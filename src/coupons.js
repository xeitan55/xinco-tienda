import { state, fbDb } from './firebase.js';

export function validateCartCoupons() {
  const removed = state.cart.filter(i => i.isCoupon).filter(i => {
    const c = getCouponByCode(i.couponCode);
    return !c || !c.enabled || (c.expiresAt && new Date(c.expiresAt) < new Date()) || (c.maxUses && c.usedCount >= c.maxUses);
  });
  state.cart = state.cart.filter(i => {
    if (!i.isCoupon) return true;
    const c = getCouponByCode(i.couponCode);
    if (!c || !c.enabled) return false;
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
    if (c.maxUses && c.usedCount >= c.maxUses) return false;
    return true;
  });
  if (removed.length) window.showToast?.('Cupón ' + removed[0].couponCode + ' ya no está disponible — fue removido');
}

export function getCouponByCode(code) {
  return state.coupons.find(c => c.code === code.toUpperCase().trim());
}

export function hasCouponInCart() {
  return state.cart.some(i => i.isCoupon);
}

export async function applyCoupon() {
  const input = document.getElementById('coupon-input');
  const status = document.getElementById('coupon-status');
  if (!input || !status) return;
  if (hasCouponInCart()) {
    status.innerHTML = '<span class="text-error">Ya tenés un cupón aplicado — retiralo primero</span>';
    return;
  }
  const code = input.value.trim().toUpperCase();
  if (!code) { status.textContent = 'Ingresá un código'; return; }
  const coupon = getCouponByCode(code);
  if (!coupon) { status.innerHTML = '<span class="text-error">Cupón inválido ❌</span>'; return; }
  if (!coupon.enabled) { status.innerHTML = '<span class="text-warning">Este cupón ya no está vigente</span>'; return; }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) { status.innerHTML = '<span class="text-error">Cupón vencido ⏰</span>'; return; }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) { status.innerHTML = '<span class="text-error">Cupón agotado</span>'; return; }
  const sub = window.cartTotal?.() || state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (coupon.minPurchase && sub < coupon.minPurchase) {
    status.innerHTML = `<span class="text-error">Compra mínima: ${window.fmtPrice?.(coupon.minPurchase) || '$' + coupon.minPurchase}</span>`;
    return;
  }
  const discount = coupon.type === 'percentage'
    ? Math.round(sub * coupon.value / 100)
    : Math.min(coupon.value, sub);
  state.cart.push({
    key: '__coupon__' + code, name: 'CUPÓN: ' + code, price: -discount, qty: 1,
    img: '', size: '', color: '', isCoupon: true, couponCode: code
  });
  input.value = '';
  status.innerHTML = `<span class="text-secondary-container">Cupón aplicado: -${window.fmtPrice?.(discount) || '$' + discount} ✅</span>`;
  window.updateCartCount?.();
  window.persistAll?.();
  renderCartDrawer();
  if (state.currentPage === 'cart') renderCartPage();
  if (state.currentPage === 'checkout') renderCheckoutPage();
}

export async function removeCoupon() {
  state.cart = state.cart.filter(i => !i.isCoupon);
  const status = document.getElementById('coupon-status');
  if (status) status.textContent = '';
  const input = document.getElementById('coupon-input');
  if (input) input.value = '';
  window.updateCartCount?.();
  window.persistAll?.();
  const { renderCartDrawer } = await import('./cart.js');
  renderCartDrawer();
  if (state.currentPage === 'cart') renderCartPage();
  if (state.currentPage === 'checkout') renderCheckoutPage();
}

export function renderAdminCupones() {
  const list = document.getElementById('cpn-list');
  if (!list) return;
  if (!state.coupons || state.coupons.length === 0) {
    list.innerHTML = '<p class="font-label-caps text-[10px] text-on-surface-variant/60">No hay cupones creados aún</p>';
    return;
  }
  list.innerHTML = state.coupons.map(c => {
    const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
    const exhausted = c.maxUses && c.usedCount >= c.maxUses;
    const active = c.enabled && !expired && !exhausted;
    return `<div class="flex items-center gap-3 p-3 border border-gray-100 rounded-lg ${active ? 'bg-white' : 'bg-gray-50 opacity-60'}">
      <div class="flex-1 min-w-0">
        <div class="font-label-caps text-label-caps text-primary flex items-center gap-2">
          <span class="uppercase font-bold">${c.code}</span>
          <span class="text-[10px] ${active ? 'text-secondary-container' : 'text-error'}">${active ? '● ACTIVO' : '● INACTIVO'}</span>
        </div>
        <div class="font-label-caps text-[10px] text-on-surface-variant mt-1">
          ${c.type === 'percentage' ? c.value + '% OFF' : (window.fmtPrice?.(c.value) || '$' + c.value) + ' OFF'}
          ${c.minPurchase ? ' | Mín: ' + (window.fmtPrice?.(c.minPurchase) || '$' + c.minPurchase) : ''}
          ${c.maxUses ? ' | Usos: ' + (c.usedCount || 0) + '/' + c.maxUses : ''}
          ${c.expiresAt ? ' | Vence: ' + c.expiresAt : ''}
        </div>
      </div>
      <button class="border border-error text-error rounded-lg px-3 py-1.5 font-label-caps text-[10px] hover:bg-error hover:text-white transition-colors" onclick="deleteCoupon('${c.code}')">ELIMINAR</button>
    </div>`;
  }).join('');
}

export async function createCoupon() {
  const code = document.getElementById('cpn-code')?.value.trim().toUpperCase();
  const type = document.getElementById('cpn-type')?.value;
  const value = parseFloat(document.getElementById('cpn-value')?.value);
  const minPurchase = parseFloat(document.getElementById('cpn-min')?.value) || 0;
  const maxUses = parseInt(document.getElementById('cpn-uses')?.value) || 999;
  if (!code || code.length < 2) { window.showToast?.('Ingresá un código válido'); return; }
  if (!value || value <= 0) { window.showToast?.('Ingresá un valor válido'); return; }
  if (type === 'percentage' && value > 100) { window.showToast?.('El porcentaje no puede superar 100%'); return; }
  if (getCouponByCode(code)) { window.showToast?.('Ya existe un cupón con ese código'); return; }
  state.coupons.push({
    code, type, value, minPurchase, maxUses, usedCount: 0, enabled: true,
    createdAt: new Date().toISOString().split('T')[0]
  });
  document.getElementById('cpn-code').value = '';
  document.getElementById('cpn-value').value = '';
  await saveCouponsRemote();
  renderAdminCupones();
  window.showToast?.('Cupón ' + code + ' creado ✅');
}

export async function deleteCoupon(code) {
  if (!confirm('Eliminar cupón ' + code + '?')) return;
  state.coupons = state.coupons.filter(c => c.code !== code);
  state.cart = state.cart.filter(i => i.isCoupon && i.couponCode !== code);
  await saveCouponsRemote();
  renderAdminCupones();
  window.updateCartCount?.();
  window.persistAll?.();
  window.showToast?.('Cupón eliminado');
}

export async function saveCouponsRemote() {
  if (!fbDb || !window._fb) return;
  const { doc, setDoc } = window._fb;
  await setDoc(doc(fbDb, 'config', 'coupons'), { coupons: state.coupons }, { merge: true });
}

export function init() {
  window.validateCartCoupons = validateCartCoupons;
  window.getCouponByCode = getCouponByCode;
  window.hasCouponInCart = hasCouponInCart;
  window.applyCoupon = applyCoupon;
  window.removeCoupon = removeCoupon;
  window.renderAdminCupones = renderAdminCupones;
  window.createCoupon = createCoupon;
  window.deleteCoupon = deleteCoupon;
  window.saveCouponsRemote = saveCouponsRemote;
}
