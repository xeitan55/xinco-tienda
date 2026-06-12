import { state, fbDb } from './firebase.js';

let currentStep = 1;
let shippingProviders = [];
let _placingOrder = false;

export function checkoutStep(n) {
  if (n > 1) {
    const nombre = document.getElementById('co-nombre')?.value.trim();
    const email  = document.getElementById('co-email')?.value.trim();
    const dir    = document.getElementById('co-dir')?.value.trim();
    const ciudad = document.getElementById('co-ciudad')?.value.trim();
    if (!nombre) { window.showToast?.('INGRESÁ TU NOMBRE ❌'); goToStep(1); return; }
    if (!email || !email.includes('@')) { window.showToast?.('INGRESÁ UN EMAIL VÁLIDO ❌'); goToStep(1); return; }
    if (!dir)    { window.showToast?.('INGRESÁ TU DIRECCIÓN ❌'); goToStep(1); return; }
    if (!ciudad) { window.showToast?.('INGRESÁ TU CIUDAD ❌'); goToStep(1); return; }
  }
  if (n > 2) {
    const shipping = document.querySelector('input[name="shipping"]:checked');
    if (!shipping) { window.showToast?.('SELECCIONÁ UN MÉTODO DE ENVÍO ❌'); goToStep(2); return; }
  }
  goToStep(n);
}

export function goToStep(n) {
  const s1 = document.getElementById('checkout-step-1');
  const s2 = document.getElementById('checkout-step-2');
  const s3 = document.getElementById('checkout-step-3');
  s1.style.display = n === 1 ? '' : 'none';
  s2.style.display = n === 2 ? '' : 'none';
  s3.style.display = n === 3 ? '' : 'none';
  currentStep = n;
  [1,2,3].forEach(i => {
    const tab = document.getElementById(`step-${i}-tab`);
    if (!tab) return;
    const active = i <= n;
    tab.className = `flex-1 flex items-center justify-center gap-2 py-3 font-label-caps text-label-caps border-l-[3px] border-primary ${active ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'}`;
    if (i === 1) tab.style.borderLeft = 'none';
  });
  const currentEl = document.getElementById(`checkout-step-${n}`);
  if (currentEl) try { window.animateCheckoutStep?.(currentEl); } catch(e) {}
}

export function renderCheckoutPage() {
  const el = document.getElementById('checkout-items');
  const normalItems = state.cart.filter(i => !i.isCoupon);
  const couponItem = state.cart.find(i => i.isCoupon);
  el.innerHTML = normalItems.map(item => `
    <div class="flex gap-3">
      <img src="${item.img}" alt="${item.name}" loading="lazy" class="w-14 h-16 object-cover border-2 border-primary shrink-0"/>
      <div class="flex-1 min-w-0">
        <div class="font-label-caps text-[11px] text-primary truncate">${window.escapeHtml(item.name)}</div>
        <div class="font-label-caps text-[10px] text-on-surface-variant">${window.escapeHtml(item.size)} / x${item.qty}</div>
      </div>
      <div class="font-label-caps text-[11px] text-primary">${window.fmtPrice?.(item.price * item.qty) || '$' + (item.price * item.qty)}</div>
    </div>`).join('');
  if (couponItem) {
    el.innerHTML += `
      <div class="flex items-center gap-2 pt-3 border-t-2 border-outline-variant">
        <span class="material-symbols-outlined text-secondary-container text-[16px]">sell</span>
        <span class="font-label-caps text-[11px] text-secondary-container flex-1">${window.escapeHtml(couponItem.name)}</span>
        <span class="font-label-caps text-[11px] text-secondary-container">${window.fmtPrice?.(couponItem.price) || '$' + couponItem.price}</span>
      </div>`;
  }
  const sub = window.cartTotal?.() || state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('checkout-subtotal').textContent = window.fmtPrice?.(sub) || '$' + sub;
  const shippingEl = document.getElementById('checkout-shipping-display');
  const totalEl = document.getElementById('checkout-total');
  if (shippingEl) shippingEl.innerHTML = `<span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-outline-variant animate-pulse"></span><span class="text-on-surface-variant" style="font-size:10px;">PENDIENTE</span></span>`;
  if (totalEl) totalEl.textContent = window.fmtPrice?.(sub) + ' + envío';
  renderShippingOptions();
  checkoutStep(1);
}

export function renderShippingOptions() {
  const container = document.getElementById('shipping-options-list');
  if (!container) return;
  const active = shippingProviders.filter(p => p.enabled);
  if (!active.length) {
    container.innerHTML = `
      <label class="flex items-center gap-4 p-4 border-[3px] border-primary cursor-pointer hover:bg-surface-container-low">
        <input type="radio" name="shipping" value="standard" checked class="text-primary"/>
        <div class="flex-1">
          <div class="font-label-caps text-label-caps text-primary">ENVÍO ESTÁNDAR</div>
          <div class="font-body-md text-on-surface-variant text-sm">Por definir por el administrador</div>
        </div>
        <span class="font-label-caps text-[10px] text-on-surface-variant flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-outline-variant"></span> PENDIENTE
        </span>
      </label>`;
    return;
  }
  container.innerHTML = active.map((p, i) => {
    const isFirst = i === 0;
    let costHtml = '';
    if (p.costType === 'free') {
      costHtml = `<span class="font-label-caps text-label-caps text-secondary-container">GRATIS</span>`;
    } else if (p.costType === 'fixed' && p.cost > 0) {
      costHtml = `<span class="font-label-caps text-label-caps text-primary">${window.fmtPrice?.(p.cost) || '$' + p.cost}</span>`;
    } else {
      costHtml = `<span class="font-label-caps text-[10px] text-on-surface-variant flex items-center gap-1">
        <span class="inline-block w-2 h-2 rounded-full bg-outline-variant animate-pulse"></span> A CALCULAR
      </span>`;
    }
    const subtitle = p.id === 'pickup'
      ? (p.address ? p.address + (p.hours ? ' — ' + p.hours : '') : 'Retiro sin cargo')
      : p.label;
    return `
      <label class="flex items-center gap-4 p-4 border-[3px] border-primary cursor-pointer hover:bg-surface-container-low" onclick="updateCheckoutShipping('${p.id}')">
        <input type="radio" name="shipping" value="${p.id}" ${isFirst ? 'checked' : ''} class="text-primary"/>
        <div class="flex-1">
          <div class="font-label-caps text-label-caps text-primary">${p.label}</div>
          ${p.id !== 'pickup' ? '' : `<div class="font-body-md text-on-surface-variant text-sm">${subtitle}</div>`}
        </div>
        ${costHtml}
      </label>`;
  }).join('');
  if (active.length) updateCheckoutShipping(active[0].id);
}

export function updateCheckoutShipping(providerId) {
  const provider = shippingProviders.find(p => p.id === providerId) || { costType: 'pending', cost: 0 };
  const sub = window.cartTotal?.() || state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingEl = document.getElementById('checkout-shipping-display');
  const totalEl = document.getElementById('checkout-total');
  const noteEl = document.getElementById('checkout-shipping-note');
  if (provider.costType === 'free') {
    if (shippingEl) shippingEl.innerHTML = `<span class="text-secondary-container font-label-caps text-label-caps">GRATIS</span>`;
    if (totalEl) totalEl.textContent = window.fmtPrice?.(sub) || '$' + sub;
    if (noteEl) noteEl.classList.add('hidden');
  } else if (provider.costType === 'fixed' && provider.cost > 0) {
    if (shippingEl) shippingEl.innerHTML = `<span class="font-label-caps text-label-caps text-primary">${window.fmtPrice?.(provider.cost) || '$' + provider.cost}</span>`;
    if (totalEl) totalEl.textContent = window.fmtPrice?.(sub + provider.cost) || '$' + (sub + provider.cost);
    if (noteEl) noteEl.classList.add('hidden');
  } else {
    if (shippingEl) shippingEl.innerHTML = `<span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-outline-variant animate-pulse"></span><span class="text-on-surface-variant" style="font-size:10px;">PENDIENTE</span></span>`;
    if (totalEl) totalEl.innerHTML = `<span>${window.fmtPrice?.(sub) || '$' + sub}</span> <span class="text-[10px] text-on-surface-variant">+ envío <span class="inline-block w-2 h-2 rounded-full bg-outline-variant animate-pulse"></span></span>`;
    if (noteEl) noteEl.classList.remove('hidden');
  }
}

export async function placeOrder() {
  if (_placingOrder) return;
  _placingOrder = true;
  const btn = document.querySelector('#page-checkout .btn-violet');
  if (btn) { btn.disabled = true; btn.textContent = 'PROCESANDO...'; }
  try {
  if (state.cart.length === 0) { window.showToast?.('Tu carrito está vacío'); return; }
  const nombre = document.getElementById('co-nombre')?.value.trim();
  const apellido = document.getElementById('co-apellido')?.value.trim() || '';
  const email = document.getElementById('co-email')?.value.trim();
  const dir = document.getElementById('co-dir')?.value.trim();
  const ciudad = document.getElementById('co-ciudad')?.value.trim();
  if (!nombre) { window.showToast?.('Ingresá tu nombre ❌'); checkoutStep(1); return; }
  if (!email || !email.includes('@')) { window.showToast?.('Ingresá un email válido ❌'); checkoutStep(1); return; }
  if (!dir)   { window.showToast?.('Ingresá tu dirección de envío ❌'); checkoutStep(1); return; }
  if (!ciudad){ window.showToast?.('Ingresá tu ciudad ❌'); checkoutStep(1); return; }
  const payMethod = document.querySelector('input[name="payment"]:checked')?.value;
  if (payMethod === 'card') {
    const cardNum = document.getElementById('card-number')?.value?.replace(/\s/g,'');
    const cardExp = document.getElementById('card-expiry')?.value?.trim?.();
    const cardCvv = document.getElementById('card-cvv-input')?.value?.trim?.();
    const cardName = document.getElementById('card-holder')?.value?.trim?.();
    if (!cardNum || cardNum.length < 15) { window.showToast?.('Ingresá un número de tarjeta válido ❌'); checkoutStep(3); return; }
    if (!cardExp || !/^\d{2}\/\d{2}$/.test(cardExp)) { window.showToast?.('Ingresá la fecha de vencimiento (MM/AA) ❌'); checkoutStep(3); return; }
    if (!cardCvv || cardCvv.length < 3) { window.showToast?.('Ingresá el CVV ❌'); checkoutStep(3); return; }
    if (!cardName) { window.showToast?.('Ingresá el nombre de la tarjeta ❌'); checkoutStep(3); return; }
    const [mm, yy] = cardExp.split('/');
    const expDate = new Date(2000 + parseInt(yy), parseInt(mm) - 1, 1);
    if (expDate < new Date()) { window.showToast?.('Tu tarjeta está vencida ❌'); checkoutStep(3); return; }
  }
  const orderNum = 'ORD-' + String(Math.floor(Math.random()*9000)+1000);
  const selectedShippingId = document.querySelector('input[name="shipping"]:checked')?.value || '';
  const selectedProvider = shippingProviders.find(p => p.id === selectedShippingId);
  const shippingCost = (selectedProvider?.costType === 'fixed') ? (selectedProvider.cost || 0)
    : (selectedProvider?.costType === 'free') ? 0 : 0;
  const shippingLabel = selectedProvider?.label || 'A calcular';
  const newOrder = {
    id: orderNum, customer: (nombre + ' ' + apellido).trim(), email,
    date: new Date().toLocaleDateString('es-AR'), subtotal: window.cartTotal?.() || state.cart.reduce((s, i) => s + i.price * i.qty, 0),
    shippingCost, shippingLabel,
    shippingPending: (selectedProvider?.costType === 'pending' || !selectedProvider),
    total: (window.cartTotal?.() || state.cart.reduce((s, i) => s + i.price * i.qty, 0)) + shippingCost,
    status: 'pending', payMethod: payMethod || 'mercadopago',
    items: state.cart.map(i => ({name: i.name, qty: i.qty, price: i.price, id: i.productId || i.key}))
  };
  if (payMethod === 'mercadopago' && state.mpConfig?.enabled) {
    const btn = document.querySelector('#page-checkout .btn-violet');
    if (btn) { btn.textContent = 'GENERANDO PAGO...'; btn.disabled = true; }
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderNum, items: state.cart.filter(i => !i.isCoupon).map(i => ({ id: i.productId || i.key, name: i.name, qty: i.qty, price: i.price })),
          payer: { email, name: nombre + ' ' + apellido },
          backUrls: {
            success: window.location.origin + '/?payment=success&order=' + orderNum,
            failure: window.location.origin + '/?payment=failure&order=' + orderNum,
            pending: window.location.origin + '/?payment=pending&order=' + orderNum,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) throw new Error(data.error || 'No se pudo crear el link de pago');
      state.orders.unshift(newOrder);
      state.cart = [];
      window.updateCartCount?.();
      window.persistAll?.();
      const { fbSaveOrderRemote } = await import('./firebase.js');
      fbSaveOrderRemote(newOrder).catch(e => console.error('Firebase order sync error:', e));
      window.location.href = data.init_point;
      return;
    } catch(e) {
      console.error('placeOrder MP error:', e);
      window.showToast?.('Error al generar el pago: ' + e.message + ' ❌');
      if (btn) { btn.textContent = 'CONFIRMAR PEDIDO'; btn.disabled = false; }
      return;
    }
  }
  state.orders.unshift(newOrder);
  state.cart = [];
  window.updateCartCount?.();
  window.persistAll?.();
  ['card-number','card-expiry','card-cvv-input','card-holder'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const { fbSaveOrderRemote } = await import('./firebase.js');
  fbSaveOrderRemote(newOrder).catch(e => console.error('Firebase order sync error:', e));
  document.getElementById('order-number').textContent = '#' + orderNum;
  const { nav } = await import('./router.js');
  nav('order-confirm');
  // Send ticket email (non-blocking)
  setTimeout(() => window.sendTicket?.(), 500);
  // Render ticket detail
  setTimeout(() => window.renderTicketDetail?.(), 300);
  } catch(e) {
    console.error('placeOrder error:', e);
    window.showToast?.('Error al procesar el pedido ❌');
  } finally {
    _placingOrder = false;
    if (btn) { btn.disabled = false; btn.textContent = 'CONFIRMAR PEDIDO'; }
  }
}

// Handle MP return callback
export async function handleMpReturn() {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');
  const orderNum = params.get('order');
  if (!paymentStatus || !orderNum) return;

  // Clean URL (remove query params)
  history.replaceState({ page: 'home' }, '', '/');

  if (paymentStatus === 'success') {
    // Order was already saved before redirect
    document.getElementById('order-number').textContent = '#' + orderNum;
    const { nav } = await import('./router.js');
    nav('order-confirm');
    // Try to find order in state and send ticket
    const order = state.orders.find(o => o.id === orderNum);
    if (order) {
      setTimeout(() => window.renderTicketDetail?.(), 300);
      setTimeout(() => window.sendTicket?.(), 500);
    } else {
      // Order might only be in Firestore — pull it
      window.showToast?.('✅ Pago recibido — pedido #' + orderNum);
    }
  } else if (paymentStatus === 'failure') {
    window.showToast?.('⚠️ El pago no se completó. Podés reintentar desde tu carrito.');
  } else if (paymentStatus === 'pending') {
    window.showToast?.('⏳ Pago pendiente. Te notificaremos cuando se acredite.');
  }
}

// Shipping providers admin
export async function saveBankConfig() {
  const name = document.getElementById('bank-name')?.value.trim();
  const titular = document.getElementById('bank-titular')?.value.trim();
  const cbu = document.getElementById('bank-cbu')?.value.trim();
  const alias = document.getElementById('bank-alias')?.value.trim();
  if (!name || !cbu) { window.showToast?.('BANCO Y CBU SON OBLIGATORIOS ❌'); return; }
  if (cbu && !/^\d{22}$/.test(cbu)) { window.showToast?.('EL CBU DEBE TENER 22 DÍGITOS ❌'); return; }
  try {
    const { waitForFirebase } = await import('./firebase.js');
    const ready = await waitForFirebase();
    if (!ready) throw new Error('Firebase no disponible');
    const { doc, setDoc } = window._fb;
    await setDoc(doc(fbDb, 'config', 'bank'), { name, titular, cbu, alias }, { merge: true });
    window.showToast?.('✅ Datos bancarios guardados en Firebase');
  } catch(e) {
    console.error('saveBankConfig:', e);
    window.showToast?.('⚠️ Error al guardar: ' + e.message);
  }
}

export async function saveShippingProviders() {
  const providers = [
    {
      id: 'correoarg', label: document.getElementById('sp-correoarg-label')?.value.trim() || 'Correo Argentino (5-7 días hábiles)',
      costType: document.getElementById('sp-correoarg-cost-type')?.value || 'pending',
      cost: parseInt(document.getElementById('sp-correoarg-cost')?.value) || 0,
      trackingUrl: 'https://www.correoargentino.com.ar/formularios/e-comercio',
      trackingFormat: 'CX000000000AR', enabled: document.getElementById('sp-correoarg-enabled')?.checked || false,
    },
    {
      id: 'andreani', label: document.getElementById('sp-andreani-label')?.value.trim() || 'Andreani Express (1-3 días hábiles)',
      costType: document.getElementById('sp-andreani-cost-type')?.value || 'pending',
      cost: parseInt(document.getElementById('sp-andreani-cost')?.value) || 0,
      enabled: document.getElementById('sp-andreani-enabled')?.checked || false,
    },
    {
      id: 'oca', label: document.getElementById('sp-oca-label')?.value.trim() || 'OCA (3-5 días hábiles)',
      costType: document.getElementById('sp-oca-cost-type')?.value || 'pending',
      cost: parseInt(document.getElementById('sp-oca-cost')?.value) || 0,
      enabled: document.getElementById('sp-oca-enabled')?.checked || false,
    },
    {
      id: 'pickup', label: 'Retiro en local (sin costo)', costType: 'free', cost: 0,
      address: document.getElementById('sp-pickup-address')?.value.trim() || '',
      hours: document.getElementById('sp-pickup-hours')?.value.trim() || '',
      enabled: document.getElementById('sp-pickup-enabled')?.checked || false,
    },
  ];
  try {
    const { waitForFirebase } = await import('./firebase.js');
    const ready = await waitForFirebase();
    if (!ready) throw new Error('Firebase no disponible');
    const { doc, setDoc } = window._fb;
    await setDoc(doc(fbDb, 'config', 'shipping'), { providers }, { merge: true });
    shippingProviders = providers;
    window.showToast?.('✅ Proveedores de envío guardados en Firebase');
  } catch(e) {
    console.error('saveShippingProviders:', e);
    window.showToast?.('⚠️ Error al guardar: ' + e.message);
  }
}

export async function loadShippingProviders() {
  if (window._shippingProviders) {
    shippingProviders = window._shippingProviders;
    return;
  }
  try {
    const { waitForFirebase } = await import('./firebase.js');
    const ready = await waitForFirebase();
    if (!ready) return;
    const { doc, getDoc } = window._fb;
    const snap = await getDoc(doc(fbDb, 'config', 'shipping'));
    if (snap.exists()) {
      shippingProviders = snap.data().providers || [];
    }
  } catch(e) {
    console.warn('loadShippingProviders:', e);
  }
}

export function switchShippingTab(id) {
  ['correoarg','andreani','oca','pickup'].forEach(p => {
    const panel = document.getElementById('sp-panel-' + p);
    const tab = document.getElementById('sp-tab-' + p);
    if (panel) panel.classList.toggle('hidden', p !== id);
    if (tab) tab.classList.toggle('active', p === id);
  });
}

export function toggleShippingCostField(id) {
  const sel = document.getElementById('sp-' + id + '-cost-type')?.value;
  const wrap = document.getElementById('sp-' + id + '-cost-wrap');
  if (wrap) wrap.classList.toggle('hidden', sel !== 'fixed');
}

export function initShippingProviders() {
  const providers = shippingProviders;
  if (!providers.length) return;
  providers.forEach(p => {
    const labelEl = document.getElementById('sp-' + p.id + '-label');
    const typeEl = document.getElementById('sp-' + p.id + '-cost-type');
    const costEl = document.getElementById('sp-' + p.id + '-cost');
    const enabledEl = document.getElementById('sp-' + p.id + '-enabled');
    if (labelEl) labelEl.value = p.label || '';
    if (typeEl) { typeEl.value = p.costType || 'pending'; toggleShippingCostField(p.id); }
    if (costEl) costEl.value = p.cost || '';
    if (enabledEl) enabledEl.checked = !!p.enabled;
    if (p.id === 'pickup') {
      const addrEl = document.getElementById('sp-pickup-address');
      const hoursEl = document.getElementById('sp-pickup-hours');
      if (addrEl) addrEl.value = p.address || '';
      if (hoursEl) hoursEl.value = p.hours || '';
    }
  });
}

// MP Config
export async function initCobranzasSection() {
  const total = state.orders.reduce((s,o) => s + o.total, 0);
  const mpTotal = Math.round(total * 0.62);
  const cardTotal = Math.round(total * 0.24);
  const transTotal = total - mpTotal - cardTotal;
  const statEls = document.querySelectorAll('.cobr-stat');
  if (statEls[0]) statEls[0].textContent = window.fmtPrice?.(mpTotal) || '$' + mpTotal;
  if (statEls[1]) statEls[1].textContent = window.fmtPrice?.(cardTotal) || '$' + cardTotal;
  if (statEls[2]) statEls[2].textContent = window.fmtPrice?.(transTotal) || '$' + transTotal;

  let bankData = window._bankConfig;
  if (!bankData) {
    try {
      const { waitForFirebase } = await import('./firebase.js');
      const ready = await waitForFirebase();
      if (!ready) return;
      const { doc, getDoc } = window._fb;
      const snap = await getDoc(doc(fbDb, 'config', 'bank'));
      if (snap.exists()) bankData = snap.data();
    } catch(e) {
      console.warn('initCobranzasSection:', e);
    }
  }
  if (bankData) {
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('bank-name', bankData.name); set('bank-titular', bankData.titular);
    set('bank-cbu', bankData.cbu); set('bank-alias', bankData.alias);
  }
}

export async function saveMPConfig() {
  const pk = document.getElementById('mp-public-key').value.trim();
  const at = document.getElementById('mp-access-token').value.trim();
  const enabled = document.getElementById('mp-enabled').checked;
  if (!pk) { window.showToast?.('Ingresá la Public Key ❌'); return; }
  if (at) {
    document.getElementById('mp-access-token').value = '';
    window.showToast?.('⚠️ Access Token NO se guarda aquí — cargalo en Vercel como variable de entorno MP_ACCESS_TOKEN');
  }
  const safeConfig = { publicKey: pk, cuotas: document.getElementById('mp-cuotas').value, descuento: document.getElementById('mp-descuento').value, enabled };
  state.mpConfig = safeConfig;
  try {
    const { waitForFirebase } = await import('./firebase.js');
    const ready = await waitForFirebase();
    if (!ready) throw new Error('Firebase no disponible');
    const { doc, setDoc } = window._fb;
    await setDoc(doc(fbDb, 'config', 'mercadopago'), safeConfig, { merge: true });
  } catch(e) {
    console.error('saveMPConfig:', e);
    window.showToast?.('⚠️ Error al guardar: ' + e.message);
    return;
  }
  const badge = document.getElementById('mp-status-badge');
  if (badge) {
    badge.textContent = enabled ? 'ACTIVO ✓' : 'CONFIGURADO';
    badge.className = enabled ? 'badge badge-violet ml-auto shrink-0' : 'badge badge-outline ml-auto shrink-0';
  }
  window.showToast?.(enabled ? '✅ Mercado Pago configurado' : '✅ Configuración guardada');
}

export function resetToFactory() {
  if (!confirm('⚠️ Esto borrará el carrito local de este dispositivo. Los datos de Firebase no se modifican. ¿Estás seguro?')) return;
  localStorage.removeItem(window.DB_KEYS?.cart || 'xinco_cart');
  window.showToast?.('Carrito local restaurado. Recargando...');
  setTimeout(() => location.reload(), 1500);
}

export function init() {
  window.checkoutStep = checkoutStep;
  window.goToStep = goToStep;
  window.renderCheckoutPage = renderCheckoutPage;
  window.renderShippingOptions = renderShippingOptions;
  window.updateCheckoutShipping = updateCheckoutShipping;
  window.placeOrder = placeOrder;
  window.saveBankConfig = saveBankConfig;
  window.saveShippingProviders = saveShippingProviders;
  window.loadShippingProviders = loadShippingProviders;
  window.switchShippingTab = switchShippingTab;
  window.toggleShippingCostField = toggleShippingCostField;
  window.initShippingProviders = initShippingProviders;
  window.initCobranzasSection = initCobranzasSection;
  window.saveMPConfig = saveMPConfig;
  window.resetToFactory = resetToFactory;
  window.handleMpReturn = handleMpReturn;
  // Handle MP return on page load
  setTimeout(() => handleMpReturn(), 200);
}
