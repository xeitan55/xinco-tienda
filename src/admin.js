import { state, fbDb } from './firebase.js';
import { bannerState, AVAILABLE_COLORS, CLOUDINARY, DB_KEYS } from './state.js';

let _catImages = {};
let pfImages = [];
let pfSelectedColors = [];
let heroVideoUrl = '';
let heroAnimStyle = 'default';
let heroVideoEffect = 'none';
let _particleInterval = null;
let _particles = [];
let shippingProviders = [];
let trackingData = {};
let uploadedImages = [];

export function isAdmin(overrideUser) {
  const u = overrideUser || state.user;
  if (!u) return false;
  if (u.email === 'xinco.tienda.adm@gmail.com') return true;
  if (u.email === 'eitan.lazkano5@gmail.com') return true;
  if (u.email === 'admin@xinco.com') return true;
  if (u.email === 'eitanlazkano2010@gmail.com') return true;
  return false;
}

export function renderAdmin() {
  renderAdminDashboard();
  renderAdminOrders();
  renderAdminProducts();
  renderAdminInventory();
  renderAdminCustomers();
  renderAdminCupones();
  renderAdminTracking();
  renderAdminReports();
}

export function adminNav(section) {
  state.adminSection = section;
  const views = ['dashboard','orders','products','inventory','customers','coupons','tracking','reports','cateditor','cobranzas'];
  views.forEach(v => {
    const el = document.getElementById('admin-' + v);
    if (el) el.style.display = v === section ? '' : 'none';
  });
  if (section === 'inventory') initInventoryChart();
  if (section === 'cobranzas') window.initCobranzasSection?.();
  if (section === 'coupons') showAdminCouponTab?.('active');
}

let _adminEntered = false;
export function showAdminSection(section) {
  if (!_adminEntered) {
    _adminEntered = true;
    const video = document.getElementById('admin-bg-video');
    if (video) {
      const src = window._appearanceCfg?.bgVideo1 || '';
      if (src) { video.src = src; video.load(); video.play().catch(() => {}); }
    }
  }
  localStorage.setItem('xinco_admin_section', section);
  state.adminSection = section;
  const allSections = ['dashboard','orders','products','inventory','customers','cupones','tracking','reportes','cobranzas','configuracion'];
  allSections.forEach(s => {
    const el = document.getElementById('admin-section-' + s);
    if (!el) return;
    const isTarget = s === section;
    if (isTarget) {
      el.classList.remove('hidden', 'admin-fade-out');
      el.classList.add('admin-fade-in');
    } else if (!el.classList.contains('hidden')) {
      el.classList.remove('admin-fade-in');
      el.classList.add('admin-fade-out');
      setTimeout(() => el.classList.add('hidden'), 200);
    }
  });
  document.querySelectorAll('.dock-item').forEach(b => {
    const s = b.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    b.classList.toggle('active', s === section);
  });
  const titles = { dashboard:'TABLERO', orders:'PEDIDOS', products:'PRODUCTOS', inventory:'INVENTARIO',
    customers:'CLIENTES', cupones:'CUPONES',
    tracking:'ENVÍOS', reportes:'REPORTES', cobranzas:'COBRANZAS', configuracion:'CONFIGURACIÓN' };
  const subs = { dashboard:'Vista general del negocio', orders:'Lista completa de pedidos', products:'Crear y editar productos', inventory:'Stock y talles',
    customers:'Información de clientes', cupones:'Códigos de descuento',
    tracking:'Proveedores, asignación y consulta', reportes:'Ventas, clientes y documentos PDF', cobranzas:'MP, tarjetas y transferencia', configuracion:'Apariencia, banners, categorías, social y EmailJS' };
  const icons = { dashboard:'dashboard', orders:'shopping_bag', products:'inventory_2', customers:'group',
    cupones:'percent', tracking:'local_shipping', reportes:'bar_chart', cobranzas:'credit_card', configuracion:'settings' };
  const title = document.getElementById('admin-section-title');
  if (title) { title.style.opacity = '0'; title.style.transform = 'translateY(-4px)'; setTimeout(() => { title.textContent = titles[section] || section.toUpperCase(); title.style.transition = 'all 0.25s cubic-bezier(0.16,1,0.3,1)'; title.style.opacity = '1'; title.style.transform = 'translateY(0)'; }, 40); }
  const sub = document.getElementById('admin-section-sub');
  if (sub) sub.textContent = subs[section] || '';
  const iconEl = document.getElementById('admin-section-icon');
  if (iconEl) { iconEl.style.opacity = '0'; iconEl.style.transform = 'scale(0.8)'; setTimeout(() => { iconEl.textContent = icons[section] || 'dashboard'; iconEl.style.transition = 'all 0.3s cubic-bezier(0.16,1,0.3,1)'; iconEl.style.opacity = '1'; iconEl.style.transform = 'scale(1)'; }, 40); }
  if (section === 'inventory') initInventoryChart();
  if (section === 'cobranzas') window.initCobranzasSection?.();
  if (section === 'cupones') { showAdminCouponTab?.('active'); renderAdminCupones(); }
  if (section === 'tracking') { window.initTrackingSection?.(); window.initShippingProviders?.(); }
  if (section === 'reportes') window.initReportesSection?.();
  if (section === 'configuracion') {
    window.initBannerEditor?.();
    window.initCatEditor?.();
    window.initAppearancePanel?.();
    window.loadEmailJsIntoForm?.();
    loadSocialConfigFromFirebase();
  }
}

export function showSectionTab(sectionId, tabName) {
  const container = document.getElementById('admin-section-' + sectionId) || document.getElementById(sectionId);
  if (!container) return;
  container.querySelectorAll('.sub-tab-content').forEach(el => el.classList.remove('active'));
  container.querySelectorAll('.sub-tab-btn').forEach(el => el.classList.remove('active'));
  const target = container.querySelector('.sub-tab-content[data-tab="' + tabName + '"]');
  if (target) target.classList.add('active');
  const btn = container.querySelector('.sub-tab-btn[data-tab="' + tabName + '"]');
  if (btn) btn.classList.add('active');
}

export function renderAdminDashboard() {
  const total = state.orders.reduce((s,o) => s + o.total, 0);
  const totalProd = state.products.length;
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;
  const totalClients = window._cachedCustomers?.length || state.orders.reduce((acc, o) => { if (o.email && !acc.includes(o.email)) acc.push(o.email); return acc; }, []).length || 0;
  const elRevenue = document.getElementById('ad-total-revenue');
  if (elRevenue) elRevenue.textContent = window.fmtPrice?.(total) || '$' + total;
  const elPending = document.getElementById('ad-pending-orders') || document.getElementById('admin-pending-count');
  if (elPending) elPending.textContent = pendingOrders;
  const elClients = document.getElementById('ad-total-clients');
  if (elClients) elClients.textContent = totalClients;
  const table = document.getElementById('ad-recent-orders') || document.getElementById('admin-recent-orders');
  if (!table) return;
  table.innerHTML = `<table class="w-full text-left"><tbody>
    ${state.orders.slice(0, 6).map(o => `
    <tr class="border-b border-outline-variant hover:bg-surface-container-low transition-all">
      <td class="py-3 font-label-caps text-[10px]">${o.id}</td>
      <td class="py-3 font-body-md text-sm">${o.customer}</td>
      <td class="py-3 font-label-caps text-[10px]">${o.date}</td>
      <td class="py-3 font-label-caps text-[11px] text-primary">${window.fmtPrice?.(o.total) || '$' + o.total}</td>
      <td class="py-3"><span class="badge badge-${o.status === 'delivered' ? 'success' : o.status === 'shipped' ? 'violet' : 'outline'} status-${o.status}">${o.status}</span></td>
      <td class="py-3"><button onclick="editOrder('${o.id}')" class="btn-violet px-4 py-1 text-[10px]">EDITAR</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

export function renderAdminOrders() {
  const container = document.getElementById('admin-orders-table');
  if (!container) return;
  container.innerHTML = `<table class="w-full text-left">
    <thead><tr class="border-b-2 border-outline-variant font-label-caps text-[10px] text-on-surface-variant/60">
      <th class="py-3 px-4">ID</th><th class="py-3 px-4">CLIENTE</th><th class="py-3 px-4">EMAIL</th><th class="py-3 px-4">FECHA</th><th class="py-3 px-4">TOTAL</th><th class="py-3 px-4">ESTADO</th><th class="py-3 px-4"></th>
    </tr></thead><tbody>
    ${state.orders.map(o => `
    <tr class="border-b border-outline-variant hover:bg-surface-container-low transition-all">
      <td class="py-3 px-4 font-label-caps text-[10px]">${o.id}</td>
      <td class="py-3 px-4 font-body-md text-sm">${o.customer}</td>
      <td class="py-3 px-4 font-body-md text-sm">${o.email || '-'}</td>
      <td class="py-3 px-4 font-label-caps text-[10px]">${o.date}</td>
      <td class="py-3 px-4 font-label-caps text-[11px] text-primary">${window.fmtPrice?.(o.total) || '$' + o.total}</td>
      <td class="py-3 px-4"><span class="badge badge-${o.status === 'delivered' ? 'success' : o.status === 'shipped' ? 'violet' : 'outline'} status-${o.status}">${o.status}</span></td>
      <td class="py-3 px-4">
        <div class="flex gap-2">
          <button onclick="editOrder('${o.id}')" class="btn-violet px-4 py-1 text-[10px] uppercase tracking-[.2em]">Editar</button>
          <button onclick="toggleOrderDetails('${o.id}')" class="btn-ghost px-3 py-1 text-[10px] uppercase tracking-[.2em]"><span class="material-symbols-outlined text-[14px]">expand_more</span></button>
        </div>
      </td>
    </tr>
    <tr id="order-details-${o.id}" class="hidden">
      <td colspan="7" class="bg-surface-container-low p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-label-caps text-label-caps text-primary mb-2">ITEMS</h4>
            ${o.items?.map(i => `<div class="flex justify-between py-1 border-b border-outline-variant/30"><span class="font-body-md text-sm">${i.name} x${i.qty}</span><span class="font-label-caps text-[11px] text-primary">${window.fmtPrice?.(i.price * i.qty) || '$' + (i.price * i.qty)}</span></div>`).join('') || '<span class="text-on-surface-variant text-sm">Sin items</span>'}
          </div>
          <div>
            <h4 class="font-label-caps text-label-caps text-primary mb-2">DETALLES</h4>
            <div class="font-body-md text-sm space-y-2">
              <p><span class="text-on-surface-variant">Método de pago:</span> ${o.payMethod || 'mercadopago'}</p>
              <p><span class="text-on-surface-variant">Envío:</span> ${o.shippingLabel || '-'} ${o.shippingCost > 0 ? '(' + window.fmtPrice?.(o.shippingCost) + ')' : ''}</p>
              <p><span class="text-on-surface-variant">Email:</span> ${o.email || '-'}</p>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <button onclick="updateOrderStatus('${o.id}','shipped')" class="btn-violet px-4 py-2 text-[10px]">MARCAR ENVIADO</button>
          <button onclick="updateOrderStatus('${o.id}','delivered')" class="btn-ghost px-4 py-2 text-[10px]">MARCAR ENTREGADO</button>
          <button onclick="updateOrderStatus('${o.id}','cancelled')" class="btn-ghost px-4 py-2 text-[10px] text-error">CANCELAR</button>
        </div>
      </td>
    </tr>`).join('')}
    </tbody></table>`;
}

export function editOrder(id) {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  document.getElementById('edit-order-id').value = order.id;
  document.getElementById('edit-order-status').value = order.status;
  document.getElementById('edit-order-total').value = order.total;
  document.getElementById('edit-order-modal').classList.remove('hidden');
}

export function closeEditOrder() {
  document.getElementById('edit-order-modal')?.classList.add('hidden');
}

export async function saveEditOrder() {
  const id = document.getElementById('edit-order-id').value;
  const status = document.getElementById('edit-order-status').value;
  const total = parseFloat(document.getElementById('edit-order-total').value);
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  order.status = status;
  order.total = total;
  const { fbUpdateOrderStatusRemote } = await import('./firebase.js');
  fbUpdateOrderStatusRemote(id, status).catch(e => console.error(e));
  window.showToast?.(`✅ Pedido ${id} actualizado`);
  closeEditOrder();
  renderAdminOrders();
}

export function toggleOrderDetails(id) {
  const row = document.getElementById('order-details-' + id);
  if (row) row.classList.toggle('hidden');
}

export async function updateOrderStatus(id, status) {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  order.status = status;
  const { fbUpdateOrderStatusRemote } = await import('./firebase.js');
  fbUpdateOrderStatusRemote(id, status).catch(e => console.error(e));
  window.showToast?.(`✅ ${id} → ${status}`);
  renderAdminOrders();
}

export function renderAdminProducts() {
  showProductPage(1);
}

export function showProductPage(page) {
  const perPage = 12;
  const totalPages = Math.ceil(state.products.length / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const items = state.products.slice(start, end);
  const container = document.getElementById('admin-products-table');
  if (!container) return;
  container.innerHTML = `<table class="w-full text-left">
    <thead><tr class="border-b-2 border-outline-variant font-label-caps text-[10px] text-on-surface-variant/60">
      <th class="py-3 px-4">PRODUCTO</th><th class="py-3 px-4">SKU</th><th class="py-3 px-4">NOMBRE</th><th class="py-3 px-4">PRECIO</th><th class="py-3 px-4">STOCK</th><th class="py-3 px-4">CAT</th><th class="py-3 px-4"></th>
    </tr></thead><tbody>
    ${items.map(p => `<tr class="border-b border-outline-variant hover:bg-surface-container-low transition-all">
      <td class="py-3 px-4"><img src="${p.img}" alt="${p.name}" loading="lazy" class="w-12 h-14 object-cover border-2 border-primary"/></td>
      <td class="py-3 px-4 font-label-caps text-[10px]">${p.sku || '-'}</td>
      <td class="py-3 px-4 font-body-md text-sm">${p.name}</td>
      <td class="py-3 px-4 font-label-caps text-[11px] text-primary">$${p.price}</td>
      <td class="py-3 px-4"><span class="badge ${p.stock > 20 ? 'badge-success' : p.stock > 5 ? 'badge-violet' : 'badge-outline'}">${p.stock}</span></td>
      <td class="py-3 px-4 font-body-md text-sm">${p.cat}</td>
      <td class="py-3 px-4"><button onclick="editProductAdmin(${p.id})" class="btn-violet px-3 py-1 text-[9px]">EDITAR</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

export function confirmDeleteProduct(id) {
  if (!confirm('¿Eliminar este producto permanentemente?')) return;
  deleteProductAdmin(id);
}

export async function deleteProductAdmin(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  state.products = state.products.filter(p => String(p.id) !== String(id));
  renderAdminProducts();
  renderAdminInventory();
  const { fbDeleteProductRemote, persistAll } = await import('./firebase.js');
  persistAll();
  fbDeleteProductRemote(id).catch(e => console.error(e));
  window.showToast?.('Producto eliminado');
}

export function deleteProduct(id) { deleteProductAdmin(id); }

export function editProductAdmin(id) {
  const p = state.products.find(pr => String(pr.id) === String(id));
  if (!p) return;
  if (p.images && p.images.length > 0) {
    pfImages = p.images.map(e => typeof e === 'string' ? { url: e, colorId: '' } : e);
  } else if (p.img) {
    pfImages = [{ url: (typeof p.img === 'string' ? p.img : p.img.url || ''), colorId: '' }];
  } else {
    pfImages = [];
  }
  pfSelectedColors = p.colors ? [...p.colors] : [];
  document.getElementById('product-form-container').classList.remove('hidden');
  document.getElementById('product-form-title').textContent = 'EDITAR: ' + p.name;
  const set = (id, val) => { const el=document.getElementById(id); if(el) el.value = val||''; };
  set('pf-id', p.id); set('pf-name', p.name); set('pf-price', p.price);
  set('pf-stock', p.stock); set('pf-desc', p.desc); set('pf-img', p.img);
  set('pf-badge', p.badge||''); set('pf-old-price', p.oldPrice||'');
  const excEl = document.getElementById('pf-exclusive');
  if (excEl) excEl.checked = !!p.exclusive;
  if (document.getElementById('pf-cat')) document.getElementById('pf-cat').value = p.cat;
  renderProductImageSlots();
  renderColorSwatches(pfSelectedColors);
  showAdminSection('products');
  document.getElementById('product-form-container').scrollIntoView({behavior:'smooth',block:'start'});
}

export function closeProductModal() {
  const form = document.getElementById('product-form-container');
  if (form) form.classList.add('hidden');
  const pfId = document.getElementById('pf-id');
  if (pfId) pfId.value = '';
}

export async function saveProductAdmin() {
  const form = document.getElementById('edit-product-form');
  if (!form) return;
  const editId = form.dataset.editId;
  const isNew = !editId;
  const data = {
    name: document.getElementById('ep-name').value.trim(),
    cat: document.getElementById('ep-cat').value.trim(),
    price: parseFloat(document.getElementById('ep-price').value) || 0,
    oldPrice: document.getElementById('ep-oldPrice').value ? parseFloat(document.getElementById('ep-oldPrice').value) : null,
    stock: parseInt(document.getElementById('ep-stock').value) || 0,
    sku: document.getElementById('ep-sku').value.trim(),
    desc: document.getElementById('ep-desc').value.trim(),
    badge: document.getElementById('ep-badge').value.trim() || null,
    sizes: document.getElementById('ep-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
    colors: document.getElementById('ep-colors').value.split(',').map(s => s.trim()).filter(Boolean),
    tags: document.getElementById('ep-tags').value.split(',').map(s => s.trim()).filter(Boolean),
    img: document.getElementById('ep-img').value.trim(),
    images: document.getElementById('ep-images').value.split(';').map(u => u.trim()).filter(Boolean),
  };
  if (!data.name || !data.cat || !data.price) { window.showToast?.('Nombre, categoría y precio son obligatorios ❌'); return; }
  if (isNew) {
    const maxId = state.products.reduce((m, p) => Math.max(m, p.id), 0);
    data.id = maxId + 1;
    state.products.push(data);
  } else {
    const idx = state.products.findIndex(p => p.id === parseInt(editId));
    if (idx >= 0) { data.id = parseInt(editId); state.products[idx] = data; }
  }
  const { fbSaveProductRemote } = await import('./firebase.js');
  fbSaveProductRemote(data).catch(e => console.error(e));
  window.showToast?.(`✅ Producto ${isNew ? 'creado' : 'actualizado'}`);
  closeProductModal();
  renderAdminProducts();
}

export function showProductForm() {
  pfImages = []; pfSelectedColors = [];
  document.getElementById('product-form-container').classList.remove('hidden');
  document.getElementById('product-form-title').textContent = 'NUEVO PRODUCTO';
  ['pf-id','pf-name','pf-price','pf-stock','pf-desc','pf-img','pf-img-url','pf-badge','pf-old-price'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const excEl = document.getElementById('pf-exclusive');
  if (excEl) excEl.checked = false;
  renderProductImageSlots();
  renderColorSwatches([]);
  document.getElementById('product-form-container').scrollIntoView({behavior:'smooth',block:'start'});
}

export function hideProductForm() {
  const el = document.getElementById('product-form-container');
  if (el) el.classList.add('hidden');
}
export function addCustomColor() {
  window.showToast?.('Usá la sección de colores en el formulario');
}
export function addProductImageUrl() {
  const url = document.getElementById('pf-img-url')?.value?.trim();
  if (!url) { window.showToast?.('Pegá una URL primero ❌'); return; }
  const hidden = document.getElementById('pf-img');
  if (hidden) hidden.value = url;
  const slots = document.getElementById('pf-image-slots');
  if (slots) {
    const img = document.createElement('div');
    img.className = 'relative aspect-square rounded-lg overflow-hidden border-2 border-primary';
    img.innerHTML = `<img src="${url}" class="w-full h-full object-cover"/><button class="absolute top-1 right-1 bg-surface/80 rounded-full w-5 h-5 flex items-center justify-center font-label-caps text-[9px] text-on-surface" onclick="this.parentElement.remove()">✕</button>`;
    slots.appendChild(img);
  }
  window.showToast?.('✅ Imagen agregada');
}

export async function saveProduct() {
  const name  = document.getElementById('pf-name')?.value?.trim();
  const price = parseInt(document.getElementById('pf-price')?.value);
  const cat   = document.getElementById('pf-cat')?.value || 'remeras';
  const stock = parseInt(document.getElementById('pf-stock')?.value) || 0;
  const desc  = document.getElementById('pf-desc')?.value?.trim() || '';
  const badge = document.getElementById('pf-badge')?.value?.trim() || null;
  const oldPriceVal = document.getElementById('pf-old-price')?.value;
  const oldPrice = oldPriceVal ? parseInt(oldPriceVal) : null;
  const editId = document.getElementById('pf-id')?.value;
  if (!name)  { window.showToast?.('EL NOMBRE ES OBLIGATORIO ❌'); return; }
  if (!price) { window.showToast?.('EL PRECIO ES OBLIGATORIO ❌'); return; }
  if (pfImages.length === 0) { window.showToast?.('AGREGÁ AL MENOS UNA IMAGEN ❌'); return; }
  if (pfSelectedColors.length === 0) { window.showToast?.('SELECCIONÁ AL MENOS UN COLOR ❌'); return; }
  const normalizedImages = pfImages.map(entry =>
    typeof entry === 'string' ? { url: entry, colorId: '' } : entry
  );
  const firstImgUrl = normalizedImages[0]?.url || '';
  const exclusive = document.getElementById('pf-exclusive')?.checked || false;
  const productData = {
    name: name.toUpperCase(), price, oldPrice, cat, badge, desc, exclusive,
    sizes: ['XS','S','M','L','XL','XXL'], colors: [...pfSelectedColors],
    images: normalizedImages,
    img: firstImgUrl,
    stock,
    tags: exclusive ? ['exclusive'] : [],
    updatedAt: new Date().toISOString()
  };
  const btn = document.querySelector('#product-form-container .btn-primary');
  if (btn) { btn.textContent = 'GUARDANDO...'; btn.disabled = true; }
  if (editId) {
    productData.id = editId;
    const idx = state.products.findIndex(p => String(p.id) === String(editId));
    if (idx > -1) state.products[idx] = { ...state.products[idx], ...productData };
  } else {
    productData.id = 'prod-' + Date.now();
    productData.sku = 'XNC-' + cat.substring(0,3).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    productData.rating = 0; productData.reviews = 0;
    productData.createdAt = new Date().toISOString();
    state.products.push(productData);
  }
  hideProductForm();
  renderAdminProducts(); renderAdminInventory();
  try {
    const saved = editId ? state.products.find(p=>String(p.id)===String(editId)) : productData;
    const { fbSaveProductRemote } = await import('./firebase.js');
    await fbSaveProductRemote(saved);
    window.showToast?.(editId ? 'Producto actualizado en Firebase ✅' : 'Producto creado en Firebase ✅');
  } catch(e) {
    console.error('Error guardando producto en Firestore:', e);
    window.showToast?.('⚠️ Error al guardar producto en Firebase: ' + e.message);
  }
  if (btn) { btn.textContent = 'GUARDAR PRODUCTO'; btn.disabled = false; }
}

export function openNewProductModal() {
  const form = document.getElementById('edit-product-form');
  if (!form) return;
  form.removeAttribute('data-edit-id');
  ['ep-name','ep-cat','ep-price','ep-oldPrice','ep-stock','ep-sku','ep-desc','ep-badge','ep-sizes','ep-colors','ep-tags','ep-img','ep-images'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('product-modal').classList.remove('hidden');
}

// Cloudinary upload
export function openCloudinaryUploader(fieldId) {
  const url = window.CLOUDINARY?.uploadUrl() || '';
  const preset = window.CLOUDINARY?.uploadPreset || '';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);
    const btn = input.uploadBtn;
    if (btn) { btn.disabled = true; btn.textContent = 'SUB...'; }
    try {
      const res = await fetch(url, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) {
        const el = document.getElementById(fieldId);
        if (el) el.value = data.secure_url;
        window.showToast?.('✅ Imagen subida');
        closeUploadModal();
      } else {
        window.showToast?.('❌ Error: ' + (data.error?.message || 'error'));
      }
    } catch(err) {
      window.showToast?.('❌ Error de conexión');
    }
    if (btn) { btn.disabled = false; btn.textContent = 'SUBIR'; }
  };
  input.click();
}

export function showUploadModal(fieldId) {
  const modal = document.getElementById('upload-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.dataset.fieldId = fieldId || 'ep-img';
}

export function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) modal.classList.add('hidden');
}

export function uploadFromUrl() {
  const modal = document.getElementById('upload-modal');
  const fieldId = modal?.dataset?.fieldId || 'ep-img';
  const urlEl = document.getElementById('upload-url-input');
  const url = urlEl?.value?.trim();
  if (!url) { window.showToast?.('Ingresá una URL ❌'); return; }
  const el = document.getElementById(fieldId);
  if (el) el.value = url;
  window.showToast?.('✅ URL cargada');
  closeUploadModal();
  if (urlEl) urlEl.value = '';
}

// Inventory
export function renderAdminInventory() {
  const container = document.getElementById('admin-inventory-table');
  if (!container) return;
  container.innerHTML = `<table class="w-full text-left">
    <thead><tr class="border-b-2 border-outline-variant font-label-caps text-[10px] text-on-surface-variant/60">
      <th class="py-3 px-4"></th><th class="py-3 px-4">SKU</th><th class="py-3 px-4">NOMBRE</th><th class="py-3 px-4">PRECIO</th><th class="py-3 px-4">STOCK</th><th class="py-3 px-4">CAT</th><th class="py-3 px-4">AJUSTAR</th>
    </tr></thead><tbody>
    ${state.products.map(p => `
    <tr class="border-b border-outline-variant hover:bg-surface-container-low transition-all">
      <td class="py-3 px-4"><img src="${p.img}" alt="${p.name}" loading="lazy" class="w-12 h-14 object-cover border-2 border-primary"/></td>
      <td class="py-3 px-4 font-label-caps text-[10px]">${p.sku || '-'}</td>
      <td class="py-3 px-4 font-body-md text-sm">${p.name}</td>
      <td class="py-3 px-4 font-label-caps text-[11px] text-primary">${window.fmtPrice?.(p.price) || '$' + p.price}</td>
      <td class="py-3 px-4"><span class="badge ${p.stock > 20 ? 'badge-success' : p.stock > 5 ? 'badge-violet' : 'badge-outline'}">${p.stock}</span></td>
      <td class="py-3 px-4 font-body-md text-sm">${p.cat}</td>
      <td class="py-3 px-4"><input type="number" value="${p.stock}" min="0" class="w-20 px-3 py-2 bg-surface-container-low border-2 border-outline-variant text-on-surface font-body-md text-sm" onchange="updateInventoryStock(${p.id}, this.value)"/></td>
    </tr>`).join('')}
    </tbody></table>`;
}

export async function updateInventoryStock(id, value) {
  const stock = parseInt(value) || 0;
  const p = state.products.find(prod => prod.id === id);
  if (!p) return;
  p.stock = stock;
  const { fbSaveProductRemote } = await import('./firebase.js');
  fbSaveProductRemote(p).catch(e => console.error(e));
  renderAdminInventory();
}

export function initInventoryChart() {
  const canvas = document.getElementById('inventory-chart');
  if (!canvas) return;
  if (canvas._chart) return;
  const ctx = canvas.getContext('2d');
  const labels = state.products.slice(0, 10).map(p => p.name.substring(0, 15));
  const data = state.products.slice(0, 10).map(p => p.stock);
  const width = canvas.width = canvas.parentElement.offsetWidth - 40;
  const height = canvas.height = 250;
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(...data, 1);
  const barW = Math.min(40, (width - 40) / data.length - 4);
  const adminEl = document.querySelector('#page-admin');
  const accent = adminEl ? getComputedStyle(adminEl).getPropertyValue('--admin-accent').trim() : '#5d22ff';
  const colors = [accent,'#003ecf','#2d5f2e','#031b46','#b3261e','#333333',accent,'#003ecf','#2d5f2e','#031b46'];
  data.forEach((v, i) => {
    const x = 20 + i * (barW + 6);
    const h = (v / max) * (height - 60);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, height - 30 - h, barW, h);
    ctx.fillStyle = '#4c4546';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(v, x + barW / 2, height - 30 - h - 4);
    ctx.fillStyle = '#9b9495';
    ctx.fillText(labels[i].substring(0, 8), x + barW / 2, height - 10);
  });
  canvas._chart = true;
}

// Customers
export async function renderAdminCustomers() {
  const container = document.getElementById('admin-customers-table');
  if (!container) return;

  let customers = window._cachedCustomers;
  if (!customers) {
    try {
      const { waitForFirebase, fbDb } = await import('./firebase.js');
      const ready = await waitForFirebase();
      if (ready && window._fb) {
        const { collection, getDocs } = window._fb;
        const snap = await getDocs(collection(fbDb, 'users'));
        customers = snap.docs.map((d, i) => {
          const data = d.data();
          const userOrders = state.orders.filter(o => o.email === data.email);
          return {
            id: i + 1,
            name: data.displayName || data.email?.split('@')[0] || 'Sin nombre',
            email: data.email || d.id,
            orders: userOrders.length,
            total: userOrders.reduce((s, o) => s + o.total, 0),
            date: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '-'
          };
        });
        window._cachedCustomers = customers;
      }
    } catch(e) {
      console.warn('renderAdminCustomers: error cargando de Firestore:', e);
    }
  }

  if (!customers || customers.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-on-surface-variant font-body-md">No hay clientes registrados aún</div>';
    return;
  }

  container.innerHTML = `<table class="w-full text-left">
    <thead><tr class="border-b-2 border-outline-variant font-label-caps text-[10px] text-on-surface-variant/60">
      <th class="py-3 px-4">#</th><th class="py-3 px-4">NOMBRE</th><th class="py-3 px-4">EMAIL</th><th class="py-3 px-4">PEDIDOS</th><th class="py-3 px-4">TOTAL</th><th class="py-3 px-4">FECHA</th>
    </tr></thead><tbody>
    ${customers.map(c => `
    <tr class="border-b border-outline-variant hover:bg-surface-container-low transition-all">
      <td class="py-3 px-4 font-label-caps text-[10px]">#${c.id}</td>
      <td class="py-3 px-4 font-body-md text-sm">${c.name}</td>
      <td class="py-3 px-4 font-body-md text-sm">${c.email}</td>
      <td class="py-3 px-4 font-label-caps text-[10px] text-center">${c.orders}</td>
      <td class="py-3 px-4 font-label-caps text-[11px] text-primary">${window.fmtPrice?.(c.total) || '$' + c.total}</td>
      <td class="py-3 px-4 font-label-caps text-[10px]">${c.date}</td>
    </tr>`).join('')}
    </tbody></table>`;
}

// Coupons
export function showAdminCouponTab(tab) {
  ['active','expired','new'].forEach(t => {
    const btn = document.getElementById('coupon-tab-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
  });
  if (tab === 'new') {
    document.getElementById('active-coupons')?.classList.add('hidden');
    document.getElementById('expired-coupons')?.classList.add('hidden');
    document.getElementById('new-coupon-form')?.classList.remove('hidden');
  } else if (tab === 'expired') {
    document.getElementById('active-coupons')?.classList.add('hidden');
    document.getElementById('new-coupon-form')?.classList.add('hidden');
    document.getElementById('expired-coupons')?.classList.remove('hidden');
  } else {
    document.getElementById('expired-coupons')?.classList.add('hidden');
    document.getElementById('new-coupon-form')?.classList.add('hidden');
    document.getElementById('active-coupons')?.classList.remove('hidden');
  }
}

export async function createCoupon() {
  const code = document.getElementById('cp-code').value.trim().toUpperCase();
  if (!code) { window.showToast?.('Ingresá un código ❌'); return; }
  const disc = parseFloat(document.getElementById('cp-discount').value);
  if (!disc || disc <= 0 || disc > 100) { window.showToast?.('Ingresá un descuento válido (1-100) ❌'); return; }
  const type = document.getElementById('cp-type').value;
  const min = parseFloat(document.getElementById('cp-min').value) || 0;
  const maxUses = parseInt(document.getElementById('cp-max-uses').value) || 0;
  const exp = document.getElementById('cp-expiration').value;
  if (!exp) { window.showToast?.('Seleccioná una fecha de expiración ❌'); return; }
  if (new Date(exp) <= new Date()) { window.showToast?.('La fecha debe ser futura ❌'); return; }
  const data = {
    code, type,
    value: disc,
    minPurchase: min, maxUses, expiresAt: exp, enabled: true, usedCount: 0,
  };
  state.coupons.push(data);
  const { waitForFirebase } = await import('./firebase.js');
  await waitForFirebase();
  try {
    const { doc, setDoc } = window._fb;
    await setDoc(doc(fbDb, 'config', 'coupons'), { coupons: state.coupons }, { merge: true });
  } catch(e) {
    console.error('Error guardando cupón:', e);
  }
  window.showToast?.(`✅ Cupón ${code} creado`);
  ['cp-code','cp-discount','cp-min','cp-max-uses','cp-expiration'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('cp-type').value = 'percentage';
  renderAdminCupones?.();
}

export async function deleteCoupon(code) {
  state.coupons = state.coupons.filter(c => c.code !== code);
  const { waitForFirebase } = await import('./firebase.js');
  await waitForFirebase();
  try {
    const { doc, setDoc } = window._fb;
    await setDoc(doc(fbDb, 'config', 'coupons'), { coupons: state.coupons }, { merge: true });
  } catch(e) {
    console.error('Error eliminando cupón:', e);
  }
  renderAdminCupones?.();
}

export function renderAdminCupones() {
  const activeEl = document.getElementById('active-coupons');
  const expiredEl = document.getElementById('expired-coupons');
  const now = new Date();
  function fmtDiscount(c) {
    if (c.type === 'percentage') return c.value + '% OFF';
    if (c.type === 'fixed') return window.fmtPrice?.(c.value) || '$' + c.value;
    if (c.discountPercent) return c.discountPercent + '% OFF';
    if (c.discountAmount) return window.fmtPrice?.(c.discountAmount) || '$' + c.discountAmount;
    return '';
  }
  const expiresKey = c => c.expiresAt || c.expiration;
  const usedKey = c => c.usedCount ?? c.used ?? 0;
  if (activeEl) {
    const active = state.coupons.filter(c => !expiresKey(c) || (new Date(expiresKey(c)) > now && c.enabled !== false));
    const usedCoupons = state.coupons.filter(c => usedKey(c) > 0);
    activeEl.innerHTML = [
      ...(usedCoupons.length ? [`
      <div class="p-4 bg-surface-container-low border-2 border-outline-variant mb-4">
        <h3 class="font-label-caps text-label-caps text-primary mb-3">CUPONES USADOS (${usedCoupons.length})</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${usedCoupons.map(c => `
            <div class="bg-surface border-2 border-outline-variant p-4 opacity-60">
              <div class="flex justify-between items-center">
                <span class="font-label-caps text-[14px] tracking-wider text-primary">${c.code}</span>
                <span class="badge badge-outline text-[9px]">USADO x${usedKey(c)}</span>
              </div>
              <div class="font-body-md text-sm mt-1">${fmtDiscount(c)}
                ${c.minPurchase > 0 ? ' / mín $' + c.minPurchase : ''}</div>
              <div class="font-label-caps text-[9px] text-on-surface-variant mt-2">Exp: ${expiresKey(c) || '—'}</div>
            </div>`).join('')}
        </div>
      </div>`] : []),
      (active.length ? `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${active.map(c => `
          <div class="bg-surface border-2 border-primary p-4 relative">
            <div class="flex justify-between items-center">
              <span class="font-label-caps text-[14px] tracking-wider text-primary">${c.code}</span>
              <button onclick="deleteCoupon('${c.code}')" class="text-error hover:opacity-70"><span class="material-symbols-outlined text-[16px]">delete</span></button>
            </div>
            <div class="font-body-md text-sm mt-1">${fmtDiscount(c)}
              ${c.minPurchase > 0 ? ' / mín ' + window.fmtPrice?.(c.minPurchase) : ''}</div>
            <div class="font-label-caps text-[9px] text-on-surface-variant mt-1">Exp: ${expiresKey(c) || '—'} | Usos: ${usedKey(c)}${c.maxUses ? '/' + c.maxUses : ''}</div>
            <button onclick="navigator.clipboard.writeText('${c.code}').then(()=>showToast?.('✅ Código copiado'))" class="btn-violet w-full mt-3 py-2 text-[9px]">COPIAR CÓDIGO</button>
          </div>`).join('')}
      </div>` : '<div class="text-on-surface-variant font-body-md text-sm p-8 text-center">No hay cupones activos</div>'),
    ].join('');
  }
  if (expiredEl) {
    const expired = state.coupons.filter(c => expiresKey(c) && new Date(expiresKey(c)) <= now);
    expiredEl.innerHTML = expired.length
      ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${expired.map(c => `
          <div class="bg-surface border-2 border-outline-variant p-4 opacity-50">
            <div class="font-label-caps text-[14px] tracking-wider text-primary">${c.code}</div>
            <div class="font-body-md text-sm mt-1">${fmtDiscount(c)}</div>
            <div class="font-label-caps text-[9px] text-on-surface-variant mt-2">Expiró: ${expiresKey(c)}</div>
          </div>`).join('')}</div>`
      : '<div class="text-on-surface-variant font-body-md text-sm p-8 text-center">No hay cupones expirados</div>';
  }
}

// Tracking
export function renderAdminTracking() {
  const table = document.getElementById('admin-tracking-table');
  if (!table) return;
  const shipped = state.orders.filter(o => o.status === 'shipped' || o.status === 'delivered');
  table.innerHTML = shipped.length
    ? shipped.map(o => {
        const isDelivered = o.status === 'delivered';
        return `<tr class="border-b-2 border-outline-variant hover:bg-surface-container-low transition-all">
          <td class="py-3 px-4 font-label-caps text-[10px]">${o.id}</td>
          <td class="py-3 px-4 font-body-md text-sm">${o.customer}</td>
          <td class="py-3 px-4 font-label-caps text-[11px] text-primary">${window.fmtPrice?.(o.total) || '$' + o.total}</td>
          <td class="py-3 px-4"><span class="badge badge-${isDelivered ? 'success' : 'violet'}">${o.status}</span></td>
          <td class="py-3 px-4">
            <input type="text" value="${o.trackingNumber || ''}" placeholder="N° de seguimiento" class="w-36 px-3 py-2 bg-surface-container-low border-2 border-outline-variant text-on-surface font-body-md text-sm" onchange="updateTrackingNumber('${o.id}', this.value)"/>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" class="text-center text-on-surface-variant py-8">No hay pedidos en tránsito</td></tr>';
}

export async function updateTrackingNumber(id, number) {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  order.trackingNumber = number;
  const { fbSaveOrderRemote } = await import('./firebase.js');
  fbSaveOrderRemote(order).catch(e => console.error(e));
  window.showToast?.('✅ Tracking actualizado');
}

// Reports
export function renderAdminReports() {
  const totalOrders = state.orders.length;
  const totalRevenue = state.orders.reduce((s, o) => s + o.total, 0);
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
  const topProduct = state.orders.flatMap(o => o.items || []).reduce((acc, i) => { acc[i.name] = (acc[i.name] || 0) + i.qty; return acc; }, {});
  const topEntry = Object.entries(topProduct).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('rep-total-orders').textContent = totalOrders;
  document.getElementById('rep-total-revenue').textContent = window.fmtPrice?.(totalRevenue) || '$' + totalRevenue;
  document.getElementById('rep-avg-order').textContent = window.fmtPrice?.(avgOrder) || '$' + avgOrder;
  document.getElementById('rep-top-product').textContent = topEntry ? `${topEntry[0]} (x${topEntry[1]})` : '-';
}

// ===== CATEGORY CRUD =====
export function _ensureCategoriesArray() {
  if (!Array.isArray(bannerState.categories)) {
    const old = bannerState.categories || {};
    bannerState.categories = Object.entries(old).map(([slug, data]) => ({
      slug,
      name: (typeof data === 'string' ? slug : (data.title || slug)).charAt(0).toUpperCase() + (typeof data === 'string' ? slug : (data.title || slug)).slice(1),
      img: typeof data === 'string' ? data : (data?.img || ''),
      title: typeof data === 'string' ? '' : (data?.title || ''),
      subtitle: typeof data === 'string' ? '' : (data?.subtitle || '')
    }));
    if (bannerState.categories.length === 0) {
      bannerState.categories = [
        { slug: 'remeras', name: 'Remeras', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80', title: 'Remeras', subtitle: '' },
        { slug: 'pantalones', name: 'Pantalones', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80', title: 'Pantalones', subtitle: '' },
        { slug: 'buzos', name: 'Buzos', img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80', title: 'Buzos', subtitle: '' },
        { slug: 'camperas', name: 'Camperas', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', title: 'Camperas', subtitle: '' },
        { slug: 'accesorios', name: 'Accesorios', img: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&q=80', title: 'Accesorios', subtitle: '' }
      ];
    }
  }
}

export function applySavedCatImages() {
  _ensureCategoriesArray();
  bannerState.categories.forEach(cat => {
    if (cat.img) _catImages[cat.slug] = cat.img;
  });
}

export function renderCategoryEditorList() {
  _ensureCategoriesArray();
  const el = document.getElementById('category-editor-list');
  if (!el) return;
  el.innerHTML = bannerState.categories.map((cat, i) => `
    <div class="flex items-start gap-3 p-3 border-2 border-outline-variant bg-surface rounded-xl" id="cat-row-${i}">
      <div class="flex flex-col gap-1 shrink-0 pt-1">
        <button onclick="moveCategory(${i},-1)" ${i===0?'disabled style="opacity:0.3"':''} class="p-1 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors disabled:cursor-not-allowed">
          <span class="material-symbols-outlined text-[14px]">keyboard_arrow_up</span>
        </button>
        <button onclick="moveCategory(${i},1)" ${i===bannerState.categories.length-1?'disabled style="opacity:0.3"':''} class="p-1 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors">
          <span class="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
        </button>
      </div>
      <div class="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
        <img id="cat-preview-${i}" src="${cat.img || 'https://placehold.co/150x200/1c1c1c/5d22ff?text=+'}" class="w-full h-full object-cover"/>
      </div>
      <div class="flex-1 min-w-0 space-y-2">
        <div class="flex gap-2">
          <div class="flex-1">
            <label class="font-label-caps text-[9px] text-on-surface-variant block mb-0.5">SLUG</label>
            <input class="input-field py-1.5 text-[11px]" value="${cat.slug}" data-idx="${i}" data-field="slug" oninput="onCategoryInput(this)"/>
          </div>
          <div class="flex-1">
            <label class="font-label-caps text-[9px] text-on-surface-variant block mb-0.5">NOMBRE</label>
            <input class="input-field py-1.5 text-[11px]" value="${cat.name}" data-idx="${i}" data-field="name" oninput="onCategoryInput(this)"/>
          </div>
        </div>
        <div class="flex gap-2">
          <div class="flex-1">
            <label class="font-label-caps text-[9px] text-on-surface-variant block mb-0.5">URL IMAGEN</label>
            <div class="flex gap-1">
              <input class="input-field py-1.5 text-[11px] flex-1" value="${cat.img}" data-idx="${i}" data-field="img" oninput="onCategoryInput(this);previewCatImg(${i},this.value)"/>
              <button class="border border-gray-300 rounded-lg px-2 py-1 hover:bg-primary hover:text-on-primary hover:border-primary transition-colors font-label-caps text-[9px]" onclick="document.getElementById('cat-file-${i}').click()">
                <span class="material-symbols-outlined text-[14px]">upload</span>
              </button>
              <input type="file" id="cat-file-${i}" accept="image/*" class="hidden" onchange="uploadCategoryImg(${i},this.files[0])"/>
            </div>
          </div>
        </div>
      </div>
      <button onclick="removeCategory(${i})" class="p-2 border-2 border-error text-error hover:bg-error hover:text-on-error transition-colors shrink-0 self-start mt-1">
        <span class="material-symbols-outlined text-[18px]">delete</span>
      </button>
    </div>
  `).join('');
}

window.onCategoryInput = function(el) {
  const idx = parseInt(el.dataset.idx);
  const field = el.dataset.field;
  if (bannerState.categories[idx]) bannerState.categories[idx][field] = el.value;
  renderCategoryPreview();
};

window.previewCatImg = function(idx, url) {
  const img = document.getElementById('cat-preview-' + idx);
  if (img && url) img.src = url;
};

export async function uploadCategoryImg(idx, file) {
  if (!file) return;
  window.showToast?.('Subiendo imagen...');
  try {
    const signRes = await fetch('/api/cloudinary-sign?folder=xinco-tienda');
    if (!signRes.ok) throw new Error('Sign failed');
    const signData = await signRes.json();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', signData.folder);
    formData.append('timestamp', signData.timestamp);
    formData.append('api_key', signData.apiKey);
    formData.append('signature', signData.signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,{method:'POST',body:formData});
    const data = await res.json();
    if (data.secure_url) {
      bannerState.categories[idx].img = data.secure_url;
      const input = document.querySelector(`#cat-row-${idx} input[data-field="img"]`);
      if (input) input.value = data.secure_url;
      const imgPreview = document.getElementById('cat-preview-' + idx);
      if (imgPreview) imgPreview.src = data.secure_url;
      renderCategoryPreview();
      window.showToast?.('Imagen subida ✅');
    } else window.showToast?.('Error al subir ❌');
  } catch(e) { window.showToast?.('Error de conexión ❌'); }
}

export function addCategory() {
  _ensureCategoriesArray();
  const base = 'nueva-categoria';
  let slug = base;
  let n = 1;
  while (bannerState.categories.some(c => c.slug === slug)) slug = base + '-' + (++n);
  bannerState.categories.push({ slug, name: 'Nueva Categoría', img: '', title: '', subtitle: '' });
  renderCategoryEditorList();
  renderAdminCatFilters();
  renderAdminCatSelect();
  renderCategoryPreview();
}

export function removeCategory(idx) {
  _ensureCategoriesArray();
  if (!confirm('¿Eliminar categoría "' + bannerState.categories[idx]?.name + '"?')) return;
  bannerState.categories.splice(idx, 1);
  renderCategoryEditorList();
  renderAdminCatFilters();
  renderAdminCatSelect();
  renderCategoryPreview();
}

export function moveCategory(idx, dir) {
  _ensureCategoriesArray();
  const target = idx + dir;
  if (target < 0 || target >= bannerState.categories.length) return;
  [bannerState.categories[idx], bannerState.categories[target]] = [bannerState.categories[target], bannerState.categories[idx]];
  renderCategoryEditorList();
  renderAdminCatFilters();
  renderAdminCatSelect();
  renderCategoryPreview();
}

export async function saveCategories() {
  _ensureCategoriesArray();
  try {
    const { fbSaveBannersRemote, syncFromFirebase } = await import('./firebase.js');
    await fbSaveBannersRemote({ categories: bannerState.categories });
    await syncFromFirebase();
    applySavedCatImages();
    renderAdminCatFilters();
    renderAdminCatSelect();
    renderHomePageCats();
    window.showToast?.('✅ Categorías guardadas en Firebase');
  } catch(e) {
    console.error('saveCategories:', e);
    window.showToast?.('⚠️ Error al guardar: ' + e.message);
  }
}

export function renderAdminCatFilters() {
  _ensureCategoriesArray();
  const ul = document.getElementById('filter-categories');
  if (!ul) return;
  const allChecked = bannerState.categories.every(c => state.filterCat.includes(c.slug)) || state.filterCat.length === 0;
  const allHtml = `<li><label class="flex items-center gap-2 cursor-pointer group font-body-md">
    <input type="checkbox" value="all" ${allChecked ? 'checked' : ''} class="filter-cat form-checkbox text-primary border-2 border-primary rounded-none focus:ring-0 h-5 w-5 bg-transparent"/>
    <span>Todos</span></label></li>`;
  const catHtml = bannerState.categories.map(c => `<li><label class="flex items-center gap-2 cursor-pointer group font-body-md">
    <input type="checkbox" value="${c.slug}" ${state.filterCat.includes(c.slug) ? 'checked' : ''} class="filter-cat form-checkbox text-primary border-2 border-primary rounded-none focus:ring-0 h-5 w-5 bg-transparent"/>
    <span class="text-on-surface-variant group-hover:text-primary">${c.name}</span></label></li>
  `).join('');
  ul.innerHTML = allHtml + catHtml;
}

export function renderAdminCatSelect() {
  _ensureCategoriesArray();
  const sel = document.getElementById('pf-cat');
  if (!sel) return;
  sel.innerHTML = bannerState.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
}

export function renderHomePageCats() {
  _ensureCategoriesArray();
  const section = document.getElementById('home-categories-section');
  if (!section) return;
  const grid = section.querySelector('.grid');
  if (!grid) return;
  grid.innerHTML = bannerState.categories.map(c => `
    <div class="group relative block w-full h-[280px] border-[3px] border-primary overflow-hidden cursor-pointer rounded-xl" onclick="filterCatalog('${c.slug}')">
      <img src="${c.img || 'https://placehold.co/800x600/1c1c1c/5d22ff?text=+'}" alt="${c.name}" class="absolute inset-0 w-full h-full object-cover grayscale-hover"/>
      <div class="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-300"></div>
      <div class="absolute bottom-0 left-0 p-6 bg-surface border-t-[3px] border-r-[3px] border-primary rounded-tr-xl">
        <h3 style="font-family:Montserrat;font-size:28px;font-weight:800;" class="text-primary uppercase">${c.name}</h3>
      </div>
    </div>
  `).join('');
}

export function renderCategoryPreview() {
  const grid = document.getElementById('cat-preview-grid');
  if (!grid) return;
  const cats = bannerState.categories || [];
  grid.innerHTML = cats.map(c => `
    <div class="relative w-full h-[120px] border-2 border-primary rounded-lg overflow-hidden bg-white">
      <img src="${c.img || 'https://placehold.co/400x300/1c1c1c/5d22ff?text=+'}" alt="${c.name}" class="absolute inset-0 w-full h-full object-cover"/>
      <div class="absolute inset-0 bg-primary/20"></div>
      <div class="absolute bottom-0 left-0 p-2 bg-white border-t-2 border-r-2 border-primary rounded-tr-md">
        <span style="font-family:Montserrat;font-size:12px;font-weight:800;" class="text-primary uppercase">${c.name}</span>
      </div>
    </div>
  `).join('');
}

export function initCatEditor() {
  _ensureCategoriesArray();
  renderCategoryEditorList();
  renderCategoryPreview();
}

window.uploadCategoryImg = uploadCategoryImg;
window.addCategory = addCategory;
window.removeCategory = removeCategory;
window.moveCategory = moveCategory;
window.saveCategories = saveCategories;

// ===== PRODUCT IMAGE SLOTS =====
export function renderProductImageSlots() {
  const el = document.getElementById('pf-image-slots');
  if (!el) return;
  const slots = [];
  for (let i = 0; i < 4; i++) {
    const entry   = pfImages[i] || null;
    const url     = entry ? (typeof entry === 'string' ? entry : entry.url) : null;
    const colorId = entry ? (entry.colorId || '') : '';
    const colorOpts = AVAILABLE_COLORS.map(c =>
      `<option value="${c.id}" ${colorId===c.id?'selected':''}>${c.label}</option>`
    ).join('');
    slots.push(`<div class="relative border-[3px] ${i===0?'border-secondary-container':'border-primary'} bg-surface-container overflow-hidden flex flex-col" id="pf-slot-${i}" style="min-height:140px;">
      ${url ? `<div class="relative flex-1 min-h-0" style="height:100px;overflow:hidden;">
        <img src="${url}" class="w-full h-full object-cover"/>
        <div class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          <button class="p-1 bg-white text-black" onclick="removeProductImage(${i})"><span class="material-symbols-outlined text-[16px]">delete</span></button>
          ${i>0?`<button class="p-1 bg-white text-black" onclick="moveProductImageFirst(${i})"><span class="material-symbols-outlined text-[16px]">star</span></button>`:''}
        </div>
        ${i===0?'<span class="absolute top-1 left-1 badge badge-violet text-[9px] pointer-events-none">PRINCIPAL</span>':''}
      </div>
      <div class="p-1 bg-surface-container-low border-t border-outline-variant">
        <label class="font-label-caps text-[8px] text-on-surface-variant block mb-0.5">COLOR DE ESTA FOTO:</label>
        <select class="w-full font-label-caps text-[9px] border border-primary bg-white py-0.5 px-1 outline-none cursor-pointer" onchange="linkImageColor(${i}, this.value)">
          <option value="">— SIN COLOR ESPECÍFICO —</option>
          ${colorOpts}
        </select>
      </div>` : `<div class="flex flex-col items-center justify-center gap-1 text-on-surface-variant cursor-pointer flex-1 p-2"
           onclick="document.getElementById('pf-file-${i}').click()"
           ondragover="event.preventDefault()"
           ondrop="handleSlotDrop(event,${i})">
        <span class="material-symbols-outlined text-[28px]">${i===0?'add_photo_alternate':'add_circle'}</span>
        <span class="font-label-caps text-[9px]">${i===0?'FOTO PRINCIPAL':'FOTO '+(i+1)}</span>
        <span class="font-label-caps text-[8px] text-on-surface-variant">ARRASTRÁ O HACÉ CLIC</span>
        <input type="file" id="pf-file-${i}" accept="image/*" class="hidden" onchange="uploadSlotImage(this.files[0],${i})"/>
      </div>
      <div id="pf-slot-progress-${i}" class="hidden absolute bottom-0 left-0 right-0 bg-black/70 p-1">
        <div class="w-full h-1 bg-white/20"><div id="pf-slot-bar-${i}" class="h-1 bg-secondary-container" style="width:0%"></div></div>
      </div>`}
    </div>`);
  }
  el.innerHTML = slots.join('');
}

export function linkImageColor(slotIndex, colorId) {
  if (!pfImages[slotIndex]) return;
  if (typeof pfImages[slotIndex] === 'string') {
    pfImages[slotIndex] = { url: pfImages[slotIndex], colorId };
  } else {
    pfImages[slotIndex].colorId = colorId;
  }
}

export function handleSlotDrop(e, slotIndex) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) uploadSlotImage(file, slotIndex);
}

export async function uploadSlotImage(file, slotIndex) {
  if (!file || pfImages.filter(Boolean).length >= 4) { window.showToast?.('Máximo 4 imágenes por producto'); return; }
  const progressEl = document.getElementById('pf-slot-progress-'+slotIndex);
  const barEl = document.getElementById('pf-slot-bar-'+slotIndex);
  if (progressEl) progressEl.classList.remove('hidden');
  try {
    await uploadToCloudinary(file,
      (pct) => { if(barEl) barEl.style.width = pct+'%'; },
      (url) => {
        pfImages[slotIndex] = { url, colorId: '' };
        pfImages = pfImages.filter(Boolean);
        document.getElementById('pf-img').value = getFirstImageUrl();
        renderProductImageSlots();
        window.showToast?.('Imagen '+(slotIndex+1)+' subida ☁️✅');
      },
      (err) => { window.showToast?.('Error: '+err+' ❌'); if(progressEl) progressEl.classList.add('hidden'); }
    );
  } catch(e) { console.error(e); }
}

export function getFirstImageUrl() {
  if (!pfImages[0]) return '';
  return typeof pfImages[0] === 'string' ? pfImages[0] : pfImages[0].url;
}

export function removeProductImage(i) {
  pfImages.splice(i, 1);
  document.getElementById('pf-img').value = getFirstImageUrl();
  renderProductImageSlots();
}

export function moveProductImageFirst(i) {
  const img = pfImages.splice(i, 1)[0];
  pfImages.unshift(img);
  document.getElementById('pf-img').value = getFirstImageUrl();
  renderProductImageSlots();
  window.showToast?.('Imagen principal actualizada ✅');
}

// ===== COLOR SWATCHES =====
export function renderColorSwatches(selectedColors) {
  const el = document.getElementById('pf-colors-grid');
  if (!el) return;
  el.innerHTML = AVAILABLE_COLORS.map(c => `<div class="flex flex-col items-center gap-1 text-center">
    <div class="color-swatch ${selectedColors.includes(c.id)?'selected':''}"
         style="background:${c.hex};${c.id==='blanco'||c.id==='beige'||c.id==='amarillo'?'border-color:#ccc;':''}"
         onclick="toggleProductColor('${c.id}')">
      ${selectedColors.includes(c.id)?`<span style="color:${['blanco','beige','amarillo'].includes(c.id)?'#000':'#fff'};font-size:14px;line-height:1;">✓</span>`:''}
    </div>
    <span class="font-label-caps text-[9px] text-on-surface-variant cursor-pointer hover:text-primary"
          contenteditable="true" spellcheck="false"
          onblur="renameColor('${c.id}',this.textContent)">${c.label}</span>
  </div>`).join('');
}

export function toggleProductColor(colorId) {
  if (pfSelectedColors.includes(colorId)) pfSelectedColors = pfSelectedColors.filter(c=>c!==colorId);
  else pfSelectedColors.push(colorId);
  renderColorSwatches(pfSelectedColors);
}

export function renameColor(colorId, newLabel) {
  const color = AVAILABLE_COLORS.find(c => c.id === colorId);
  if (color && newLabel.trim()) color.label = newLabel.trim().toUpperCase();
}

// ===== CLOUDINARY =====
export async function uploadToCloudinary(file, onProgress, onSuccess, onError, resourceType = 'image') {
  if (!file) return;
  const maxSize = resourceType === 'video' ? 100 : 10;
  if (file.size > maxSize * 1024 * 1024) { onError(`El archivo supera los ${maxSize}MB`); return; }
  if (resourceType === 'image' && !file.type.startsWith('image/')) { onError('Solo se permiten imágenes'); return; }
  if (resourceType === 'video' && !file.type.startsWith('video/')) { onError('Solo se permiten videos'); return; }
  try {
    const signRes = await fetch('/api/cloudinary-sign?folder=xinco-tienda');
    if (!signRes.ok) throw new Error('Sign failed');
    const signData = await signRes.json();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', signData.folder);
    formData.append('timestamp', signData.timestamp);
    formData.append('api_key', signData.apiKey);
    formData.append('signature', signData.signature);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = resourceType === 'video'
        ? `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`
        : `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
      xhr.open('POST', url, true);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          const finalUrl = res.secure_url;
          uploadedImages.unshift({ url: finalUrl, name: file.name, public_id: res.public_id });
          onSuccess(finalUrl, res);
          resolve(finalUrl);
        } else {
          try { const err = JSON.parse(xhr.responseText); onError(err.error?.message || 'Error Cloudinary ' + xhr.status); reject(err); }
          catch(e) { onError('Error al subir'); reject(e); }
        }
      };
      xhr.onerror = () => { onError('Error de conexión'); reject('Network error'); };
      xhr.send(formData);
    });
  } catch(e) {
    onError('Error al firmar upload');
    throw e;
  }
}

// ===== BANNERS =====
export function initBannerEditor() {
  renderAnnouncementEditorList();
  renderAnnouncementPreview();
  document.getElementById('hero-edit-badge').value    = bannerState.hero.badge;
  document.getElementById('hero-edit-title').value    = bannerState.hero.title;
  document.getElementById('hero-edit-subtitle').value = bannerState.hero.subtitle;
  document.getElementById('hero-edit-img').value      = bannerState.hero.img;
  previewHero();
  heroVideoUrl    = bannerState.hero.videoUrl    || '';
  heroAnimStyle   = bannerState.hero.animStyle   || 'default';
  heroVideoEffect = bannerState.hero.videoEffect || 'none';
  if (heroVideoUrl) {
    switchHeroTab('video');
    document.getElementById('hero-video-url').value = heroVideoUrl;
    showHeroVideoStatus(heroVideoUrl);
  }
  document.querySelectorAll('#anim-style-selector .hero-media-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.anim === heroAnimStyle);
  });
  document.querySelectorAll('#video-effect-selector .hero-media-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.effect === heroVideoEffect);
  });
  document.getElementById('promo-edit-enabled').checked = bannerState.promo.enabled;
  document.getElementById('promo-edit-label').value = bannerState.promo.label;
  document.getElementById('promo-edit-title').value = bannerState.promo.title;
  document.getElementById('promo-edit-code').value  = bannerState.promo.code;
  previewPromo();
}

export function renderAnnouncementEditorList() {
  const el = document.getElementById('announcement-editor-list');
  if (!el) return;
  el.innerHTML = bannerState.announcements.map((msg, i) => `<div class="flex items-center gap-3 p-3 border-[2px] border-outline-variant bg-surface" id="ann-row-${i}">
    <div class="flex flex-col gap-1 shrink-0">
      <button onclick="moveAnnouncement(${i},-1)" ${i===0?'disabled style="opacity:0.3"':''} class="p-1 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors disabled:cursor-not-allowed">
        <span class="material-symbols-outlined text-[14px]">keyboard_arrow_up</span>
      </button>
      <button onclick="moveAnnouncement(${i},1)" ${i===bannerState.announcements.length-1?'disabled style="opacity:0.3"':''} class="p-1 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors">
        <span class="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
      </button>
    </div>
    <span class="w-7 h-7 bg-primary text-on-primary flex items-center justify-center font-label-caps text-[11px] shrink-0">${i+1}</span>
    <input class="input-field flex-1 py-2 ann-input" value="${msg}" data-index="${i}" oninput="bannerState.announcements[${i}]=this.value;renderAnnouncementBar()"/>
    <button onclick="removeAnnouncement(${i})" class="p-2 border-2 border-error text-error hover:bg-error hover:text-on-error transition-colors shrink-0">
      <span class="material-symbols-outlined text-[18px]">delete</span>
    </button>
  </div>`).join('');
}

export function addAnnouncementMsg() {
  bannerState.announcements.push('NUEVO MENSAJE — EDITAME');
  renderAnnouncementEditorList();
  renderAnnouncementPreview();
}

export function removeAnnouncement(i) {
  if (bannerState.announcements.length <= 1) { window.showToast?.('Debe haber al menos 1 mensaje'); return; }
  bannerState.announcements.splice(i, 1);
  renderAnnouncementEditorList();
  renderAnnouncementPreview();
}

export function moveAnnouncement(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= bannerState.announcements.length) return;
  [bannerState.announcements[i], bannerState.announcements[j]] = [bannerState.announcements[j], bannerState.announcements[i]];
  renderAnnouncementEditorList();
  renderAnnouncementPreview();
}

export async function saveAnnouncementBar() {
  document.querySelectorAll('.ann-input').forEach(inp => {
    const idx = parseInt(inp.dataset.index);
    bannerState.announcements[idx] = inp.value.trim() || bannerState.announcements[idx];
  });
  try {
    const { fbSaveBannersRemote, syncFromFirebase } = await import('./firebase.js');
    await fbSaveBannersRemote(bannerState);
    await syncFromFirebase();
    renderAnnouncementBar();
    window.showToast?.('✅ Barra de anuncios guardada en Firebase');
  } catch(e) {
    console.error('saveAnnouncementBar:', e);
    window.showToast?.('⚠️ Error al guardar en Firebase: ' + e.message);
  }
}

export function previewHero() {
  const badge    = document.getElementById('hero-edit-badge')?.value || '';
  const title    = document.getElementById('hero-edit-title')?.value || '';
  const subtitle = document.getElementById('hero-edit-subtitle')?.value || '';
  const prevBadge = document.getElementById('hero-preview-badge');
  const prevTitle = document.getElementById('hero-preview-title');
  const prevSub   = document.getElementById('hero-preview-subtitle');
  if (prevBadge) { prevBadge.textContent = badge; prevBadge.style.display = badge ? '' : 'none'; }
  if (prevTitle) prevTitle.innerHTML = title.replace(/\n/g,'<br>') || 'XINCO';
  if (prevSub)   prevSub.textContent = subtitle;
  const realBadge = document.getElementById('hero-badge');
  const realTitle = document.getElementById('hero-title');
  const realSub   = document.getElementById('hero-subtitle');
  if (realBadge) { realBadge.textContent = badge; realBadge.style.display = badge ? '' : 'none'; }
  if (realTitle) realTitle.innerHTML = title.replace(/\n/g, '<br>') || 'XINCO';
  if (realSub)   realSub.textContent = subtitle;
}

export function previewHeroImg() {
  const url = document.getElementById('hero-edit-img')?.value.trim();
  if (url) {
    const prevImg = document.getElementById('hero-preview-img');
    if (prevImg) { prevImg.src = url; prevImg.style.display = ''; }
    const realImg = document.getElementById('hero-img');
    if (realImg) {
      realImg.classList.add('loading');
      realImg.onload = () => { realImg.classList.remove('loading'); };
      realImg.src = url;
    }
  }
}

export function switchHeroTab(tab) {
  const imgPanel  = document.getElementById('hero-tab-img');
  const vidPanel  = document.getElementById('hero-tab-video');
  const imgBtn    = document.getElementById('tab-img-btn');
  const vidBtn    = document.getElementById('tab-vid-btn');
  if (!imgPanel || !vidPanel) return;
  if (tab === 'img') {
    imgPanel.classList.remove('hidden');
    vidPanel.classList.add('hidden');
    imgBtn.classList.add('active');
    vidBtn.classList.remove('active');
  } else {
    imgPanel.classList.add('hidden');
    vidPanel.classList.remove('hidden');
    imgBtn.classList.remove('active');
    vidBtn.classList.add('active');
    if (bannerState.hero.videoUrl) {
      document.getElementById('hero-video-url').value = bannerState.hero.videoUrl;
      showHeroVideoStatus(bannerState.hero.videoUrl);
    }
  }
}

export function selectAnimStyle(style) {
  heroAnimStyle = style;
  document.querySelectorAll('#anim-style-selector .hero-media-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.anim === style);
  });
  applyHeroAnimStyle(style);
}

export function applyHeroAnimStyle(style) {
  const title = document.getElementById('hero-title');
  if (!title) return;
  title.classList.remove('hero-glitch');
  stopHeroParticles();
  const scanlines = document.getElementById('hero-scanlines');
  if (scanlines) scanlines.style.display = 'none';
  if (style === 'glitch') title.classList.add('hero-glitch');
}

export function selectVideoEffect(effect, btn) {
  heroVideoEffect = effect;
  document.querySelectorAll('#video-effect-selector .hero-media-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyHeroVideoEffect(effect);
}

export function applyHeroVideoEffect(effect) {
  const scanlines = document.getElementById('hero-scanlines');
  if (!scanlines) return;
  scanlines.style.display = 'none';
  stopHeroParticles();
  const title = document.getElementById('hero-title');
  if (title) title.classList.remove('hero-glitch');
  if (effect === 'scanlines') {
    scanlines.style.display = 'block';
    scanlines.style.animation = 'scanlineMove 0.2s linear infinite';
  } else if (effect === 'particles') {
    startHeroParticles();
  } else if (effect === 'glitch') {
    if (title) title.classList.add('hero-glitch');
  } else if (effect === 'vignette') {
    scanlines.style.display = 'block';
    scanlines.style.background = 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)';
    scanlines.style.animation = 'vignetteAnim 6s ease-in-out infinite';
  }
}

export function startHeroParticles() {
  stopHeroParticles();
  const container = document.getElementById('hero-particles');
  if (!container) return;
  container.innerHTML = '';
  _particles = [];
  const COLORS  = ['#5d22ff','#ffffff','#c6c6c6','#4500d1'];
  const COUNT   = 28;
  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'hero-particle';
    const size     = Math.random() * 5 + 2;
    const x        = Math.random() * 100;
    const y        = Math.random() * 100;
    const dur      = (Math.random() * 8 + 6).toFixed(1) + 's';
    const delay    = (Math.random() * 5).toFixed(1) + 's';
    const opacity  = (Math.random() * 0.4 + 0.1).toFixed(2);
    const color    = COLORS[Math.floor(Math.random() * COLORS.length)];
    dot.style.cssText = `width:${size}px;height:${size}px;left:${x}%;top:${y}%;background:${color};--p-dur:${dur};--p-delay:${delay};--p-opacity:${opacity};animation-delay:${delay};`;
    container.appendChild(dot);
    _particles.push(dot);
  }
}

export function stopHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (container) container.innerHTML = '';
  _particles = [];
  if (_particleInterval) { clearInterval(_particleInterval); _particleInterval = null; }
}

export function applyHeroVideoToSection(url) {
  const video = document.getElementById('hero-video');
  const img   = document.getElementById('hero-img');
  if (!video) return;
  if (url) {
    video.src = url;
    video.style.display = 'block';
    video.load();
    video.play().catch(() => {});
    if (img) img.style.display = 'none';
  } else {
    video.src = '';
    video.style.display = 'none';
    if (img) img.style.display = 'block';
  }
}

export function showHeroVideoStatus(url) {
  const statusEl  = document.getElementById('hero-video-status');
  const urlDisp   = document.getElementById('hero-video-url-display');
  const prevVid   = document.getElementById('hero-preview-video');
  const prevBadge = document.getElementById('hero-preview-video-badge');
  if (statusEl) statusEl.classList.remove('hidden');
  if (urlDisp)  urlDisp.textContent = url;
  if (prevVid) {
    prevVid.src = url;
    prevVid.style.display = 'block';
    prevVid.load();
    prevVid.play().catch(() => {});
  }
  if (prevBadge) prevBadge.classList.remove('hidden');
  heroVideoUrl = url;
}

export function handleHeroVideoFileDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('hero-video-dropzone');
  if (dz) dz.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) uploadHeroVideo(file);
}

export async function uploadHeroVideo(file) {
  if (!file) return;
  const progress  = document.getElementById('hero-video-upload-progress');
  const bar       = document.getElementById('hero-video-upload-bar');
  const pct       = document.getElementById('hero-video-upload-pct');
  const statusEl  = document.getElementById('hero-video-upload-status');
  if (progress) progress.classList.remove('hidden');
  if (bar)      bar.style.width = '0%';
  if (statusEl) statusEl.textContent = 'SUBIENDO VIDEO...';
  window.showToast?.('Subiendo video a Cloudinary... ☁️');
  try {
    const videoUrl = await new Promise((resolve, reject) => {
      uploadToCloudinary(file,
        (p) => { if(bar) bar.style.width=p+'%'; if(pct) pct.textContent=p+'%'; if(statusEl) statusEl.textContent = p<100 ? 'SUBIENDO VIDEO...' : 'PROCESANDO...'; },
        (url) => resolve(url),
        (err) => reject(err),
        'video'
      );
    });
    if (progress) progress.classList.add('hidden');
    showHeroVideoStatus(videoUrl);
    document.getElementById('hero-video-url').value = videoUrl;
    window.showToast?.('¡Video subido a Cloudinary! ☁️✅');
  } catch(e) {
    if (statusEl) statusEl.textContent = 'ERROR AL SUBIR';
    if (bar) bar.style.background = '#ba1a1a';
    window.showToast?.('Error al subir el video ❌');
  }
}

export function previewHeroVideo() {
  const url = document.getElementById('hero-video-url')?.value.trim();
  if (!url) { window.showToast?.('Ingresá una URL de video ❌'); return; }
  showHeroVideoStatus(url);
  applyHeroVideoToSection(url);
  window.showToast?.('Vista previa del video activa ✅');
}

export function clearHeroVideo() {
  heroVideoUrl = '';
  ['hero-video-url'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const statusEl  = document.getElementById('hero-video-status');
  const prevVid   = document.getElementById('hero-preview-video');
  const prevBadge = document.getElementById('hero-preview-video-badge');
  if (statusEl)  statusEl.classList.add('hidden');
  if (prevVid)   { prevVid.src = ''; prevVid.style.display = 'none'; }
  if (prevBadge) prevBadge.classList.add('hidden');
  const prevImg = document.getElementById('hero-preview-img');
  if (prevImg && bannerState.hero.img) { prevImg.src = bannerState.hero.img; }
  applyHeroVideoToSection('');
  const realImg = document.getElementById('hero-img');
  if (realImg && bannerState.hero.img) realImg.src = bannerState.hero.img;
  window.showToast?.('Video eliminado — se usará la imagen');
}

export async function saveHeroBanner() {
  bannerState.hero.badge    = document.getElementById('hero-edit-badge').value.trim();
  bannerState.hero.title    = document.getElementById('hero-edit-title').value.trim() || 'XINCO';
  bannerState.hero.subtitle = document.getElementById('hero-edit-subtitle').value.trim();
  const imgUrl = document.getElementById('hero-edit-img')?.value.trim();
  if (imgUrl) bannerState.hero.img = imgUrl;
  bannerState.hero.videoUrl    = heroVideoUrl || '';
  bannerState.hero.animStyle   = heroAnimStyle;
  bannerState.hero.videoEffect = heroVideoEffect;
  try {
    const { fbSaveBannersRemote, syncFromFirebase } = await import('./firebase.js');
    await fbSaveBannersRemote(bannerState);
    await syncFromFirebase();
    renderHeroBanner();
    window.showToast?.('✅ Hero banner guardado en Firebase');
  } catch(e) {
    console.error('saveHeroBanner:', e);
    window.showToast?.('⚠️ Error al guardar en Firebase: ' + e.message);
  }
}

export function previewPromo() {
  const enabled = document.getElementById('promo-edit-enabled')?.checked || false;
  const label = document.getElementById('promo-edit-label')?.value || '';
  const title = document.getElementById('promo-edit-title')?.value || '';
  const code  = document.getElementById('promo-edit-code')?.value  || '';
  const pl = document.getElementById('promo-preview-label');
  const pt = document.getElementById('promo-preview-title');
  const pc = document.getElementById('promo-preview-code');
  if (pl) pl.textContent = label;
  if (pt) pt.innerHTML  = title.replace(/\n/g,'<br>') || '30% OFF';
  if (pc) pc.textContent = code;
  const section = document.getElementById('promo-banner-section');
  if (section) {
    section.style.display = enabled ? '' : 'none';
    const labelEl = section.querySelector('.promo-label');
    const titleEl = section.querySelector('.promo-title');
    const codeEl  = section.querySelector('.promo-code');
    if (labelEl) labelEl.textContent = label;
    if (titleEl) titleEl.innerHTML = title.replace(/\n/g, '<br>');
    if (codeEl) codeEl.textContent = code;
  }
}

export async function savePromoBanner() {
  bannerState.promo.enabled = document.getElementById('promo-edit-enabled').checked;
  bannerState.promo.label = document.getElementById('promo-edit-label').value.trim();
  bannerState.promo.title = document.getElementById('promo-edit-title').value.trim();
  bannerState.promo.code  = document.getElementById('promo-edit-code').value.trim().toUpperCase();
  try {
    const { fbSaveBannersRemote, syncFromFirebase } = await import('./firebase.js');
    await fbSaveBannersRemote(bannerState);
    await syncFromFirebase();
    renderPromoBanner();
    window.showToast?.('✅ Banner promo guardado en Firebase');
  } catch(e) {
    console.error('savePromoBanner:', e);
    window.showToast?.('⚠️ Error al guardar en Firebase: ' + e.message);
  }
}

export function renderAnnouncementPreview() {
  const bar = document.getElementById('announcement-preview-bar');
  if (!bar) return;
  const msgs = bannerState.announcements || [];
  bar.innerHTML = msgs.map(m => `<span style="margin:0 24px;white-space:nowrap;display:inline-block;">${m}</span>`).join('');
}

export function renderAnnouncementBar() {
  const scroller = document.getElementById('announcement-scroller');
  if (!scroller) return;
  const msgs = [...bannerState.announcements, ...bannerState.announcements];
  scroller.innerHTML = msgs.map(m =>
    `<span class="font-label-caps text-label-caps tracking-widest uppercase px-12">${m}</span>`
  ).join('');
  renderAnnouncementPreview();
}

export function renderHeroBanner() {
  const h = bannerState.hero;
  const badge    = document.getElementById('hero-badge');
  const title    = document.getElementById('hero-title');
  const subtitle = document.getElementById('hero-subtitle');
  const img      = document.getElementById('hero-img');
  if (badge)    { badge.textContent = h.badge; badge.style.display = h.badge ? '' : 'none'; }
  if (title)    title.innerHTML = h.title.replace(/\n/g, '<br>') || 'XINCO';
  if (subtitle) subtitle.textContent = h.subtitle;
  heroAnimStyle   = h.animStyle   || 'default';
  heroVideoEffect = h.videoEffect || 'none';
  heroVideoUrl    = h.videoUrl    || '';
  if (h.videoUrl) {
    applyHeroVideoToSection(h.videoUrl);
    applyHeroVideoEffect(h.videoEffect || 'none');
  } else {
    applyHeroVideoToSection('');
    if (img) img.src = h.img;
    applyHeroAnimStyle(h.animStyle || 'default');
  }
}

export function renderPromoBanner() {
  const p = bannerState.promo;
  const section = document.getElementById('promo-banner-section');
  if (!section) return;
  if (!p.enabled) { section.style.display = 'none'; return; }
  section.style.display = '';
  const labelEl = section.querySelector('.promo-label');
  const titleEl = section.querySelector('.promo-title');
  const codeEl  = section.querySelector('.promo-code');
  if (labelEl) labelEl.textContent = p.label;
  if (titleEl) titleEl.innerHTML = p.title.replace(/\n/g, '<br>');
  if (codeEl) codeEl.textContent = p.code;
}

export function handleHeroFileDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) uploadHeroImage(file);
}

export async function uploadHeroImage(file) {
  if (!file) return;
  const progress = document.getElementById('hero-upload-progress');
  const bar = document.getElementById('hero-upload-bar');
  const pct = document.getElementById('hero-upload-pct');
  const status = document.getElementById('hero-upload-status');
  const result = document.getElementById('hero-upload-result');
  const recentGrid = document.getElementById('hero-recent-uploads');
  progress.classList.remove('hidden');
  result.classList.add('hidden');
  bar.style.width = '0%';
      bar.style.background = 'var(--admin-accent)';
  status.textContent = 'SUBIENDO...';
  const reader = new FileReader();
  reader.onload = (ev) => { document.getElementById('hero-preview-img').src = ev.target.result; };
  reader.readAsDataURL(file);
  try {
    await uploadToCloudinary(file,
      (p) => { bar.style.width = p + '%'; pct.textContent = p + '%'; },
      (finalUrl) => {
        document.getElementById('hero-edit-img').value = finalUrl;
        bannerState.hero.img = finalUrl;
        document.getElementById('hero-img').src = finalUrl;
        document.getElementById('hero-preview-img').src = finalUrl;
        result.classList.remove('hidden');
        bar.style.width = '100%';
        pct.textContent = '100%';
        status.textContent = '¡SUBIDA EXITOSA!';
        const thumb = document.createElement('div');
        thumb.className = 'aspect-square border-2 border-primary overflow-hidden cursor-pointer hover:border-secondary-container';
        thumb.title = 'Usar esta imagen';
        thumb.innerHTML = `<img src="${finalUrl}" class="w-full h-full object-cover" onclick="applyHeroImg('${finalUrl}')"/>`;
        if (recentGrid.children.length === 1 && !recentGrid.querySelector('img')) recentGrid.innerHTML = '';
        recentGrid.prepend(thumb);
        window.showToast?.('¡Imagen del hero subida a Cloudinary! ☁️✅');
      },
      (err) => {
        status.textContent = 'ERROR: ' + err;
        bar.style.background = '#ba1a1a';
        window.showToast?.('Error al subir imagen del hero ❌');
      }
    );
  } catch(e) { console.error(e); }
}

export function applyHeroImg(url) {
  document.getElementById('hero-edit-img').value = url;
  document.getElementById('hero-preview-img').src = url;
  bannerState.hero.img = url;
  document.getElementById('hero-img').src = url;
  window.showToast?.('Imagen del hero aplicada ✅');
}

// ===== COBRANZAS =====
export async function initCobranzasSection() {
  const total = state.orders.reduce((s,o) => s + o.total, 0);
  const mpTotal = Math.round(total * 0.62);
  const cardTotal = Math.round(total * 0.24);
  const transTotal = total - mpTotal - cardTotal;
  const statEls = document.querySelectorAll('.cobr-stat');
  if (statEls[0]) statEls[0].textContent = window.fmtPrice ? window.fmtPrice(mpTotal) : '$' + mpTotal;
  if (statEls[1]) statEls[1].textContent = window.fmtPrice ? window.fmtPrice(cardTotal) : '$' + cardTotal;
  if (statEls[2]) statEls[2].textContent = window.fmtPrice ? window.fmtPrice(transTotal) : '$' + transTotal;
  try {
    const { doc, getDoc } = window._fb || {};
    if (!doc || !getDoc || !fbDb) return;
    const snap = await getDoc(doc(fbDb, 'config', 'bank'));
    if (snap.exists()) {
      const d = snap.data();
      const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      set('bank-name', d.name);
      set('bank-titular', d.titular);
      set('bank-cbu', d.cbu);
      set('bank-alias', d.alias);
    }
  } catch(e) { console.warn('initCobranzasSection:', e); }
}

export async function saveMPConfig() {
  const pk      = document.getElementById('mp-public-key').value.trim();
  const at      = document.getElementById('mp-access-token').value.trim();
  const enabled = document.getElementById('mp-enabled').checked;
  if (!pk) { window.showToast?.('Ingresá la Public Key ❌'); return; }
  if (at) {
    document.getElementById('mp-access-token').value = '';
    window.showToast?.('⚠️ Access Token NO se guarda aquí — cargalo en Vercel');
  }
  const safeConfig = {
    publicKey: pk,
    cuotas:    document.getElementById('mp-cuotas').value,
    descuento: document.getElementById('mp-descuento').value,
    enabled,
  };
  state.mpConfig = safeConfig;
  try {
    const { doc, setDoc } = window._fb || {};
    if (!doc || !setDoc || !fbDb) throw new Error('Firebase no disponible');
    await setDoc(doc(fbDb, 'config', 'mercadopago'), safeConfig, { merge: true });
  } catch(e) {
    console.error('saveMPConfig:', e);
    window.showToast?.('⚠️ Error al guardar: ' + e.message);
    return;
  }
  const badge = document.getElementById('mp-status-badge');
  if (badge) {
    badge.textContent = enabled ? 'ACTIVO ✓' : 'CONFIGURADO';
    badge.className   = enabled ? 'badge badge-violet ml-auto shrink-0' : 'badge badge-outline ml-auto shrink-0';
  }
  window.showToast?.(enabled ? '✅ Mercado Pago configurado' : '✅ Configuración guardada');
}

export async function saveBankConfig() {
  const name    = document.getElementById('bank-name')?.value.trim();
  const titular = document.getElementById('bank-titular')?.value.trim();
  const cbu     = document.getElementById('bank-cbu')?.value.trim();
  const alias   = document.getElementById('bank-alias')?.value.trim();
  if (!name || !cbu) { window.showToast?.('BANCO Y CBU SON OBLIGATORIOS ❌'); return; }
  if (cbu && !/^\d{22}$/.test(cbu)) { window.showToast?.('EL CBU DEBE TENER 22 DÍGITOS ❌'); return; }
  try {
    const { doc, setDoc } = window._fb || {};
    if (!doc || !setDoc || !fbDb) throw new Error('Firebase no disponible');
    await setDoc(doc(fbDb, 'config', 'bank'), { name, titular, cbu, alias }, { merge: true });
    window.showToast?.('✅ Datos bancarios guardados en Firebase');
  } catch(e) {
    console.error('saveBankConfig:', e);
    window.showToast?.('⚠️ Error al guardar: ' + e.message);
  }
}

// ===== SHIPPING PROVIDERS =====
export async function saveShippingProviders() {
  const providers = [
    { id:'correoarg', label: document.getElementById('sp-correoarg-label')?.value.trim() || 'Correo Argentino',
      costType: document.getElementById('sp-correoarg-cost-type')?.value || 'pending', cost: parseInt(document.getElementById('sp-correoarg-cost')?.value) || 0,
      trackingUrl: 'https://www.correoargentino.com.ar/formularios/e-comercio', trackingFormat: 'CX000000000AR', enabled: document.getElementById('sp-correoarg-enabled')?.checked || false },
    { id:'andreani', label: document.getElementById('sp-andreani-label')?.value.trim() || 'Andreani Express',
      costType: document.getElementById('sp-andreani-cost-type')?.value || 'pending', cost: parseInt(document.getElementById('sp-andreani-cost')?.value) || 0,
      enabled: document.getElementById('sp-andreani-enabled')?.checked || false },
    { id:'oca', label: document.getElementById('sp-oca-label')?.value.trim() || 'OCA',
      costType: document.getElementById('sp-oca-cost-type')?.value || 'pending', cost: parseInt(document.getElementById('sp-oca-cost')?.value) || 0,
      enabled: document.getElementById('sp-oca-enabled')?.checked || false },
    { id:'pickup', label: document.getElementById('sp-pickup-label')?.value.trim() || 'Retiro en local',
      costType: 'free', cost: 0, address: document.getElementById('sp-pickup-address')?.value.trim() || '',
      hours: document.getElementById('sp-pickup-hours')?.value.trim() || '', enabled: document.getElementById('sp-pickup-enabled')?.checked || false },
  ];
  try {
    const { doc, setDoc } = window._fb || {};
    if (!doc || !setDoc || !fbDb) throw new Error('Firebase no disponible');
    await setDoc(doc(fbDb, 'config', 'shipping'), { providers }, { merge: true });
    shippingProviders = providers;
    window.showToast?.('✅ Proveedores de envío guardados en Firebase');
  } catch(e) {
    console.error('saveShippingProviders:', e);
    window.showToast?.('⚠️ Error al guardar: ' + e.message);
  }
}

export async function loadShippingProviders() {
  try {
    const { doc, getDoc } = window._fb || {};
    if (!doc || !getDoc || !fbDb) return;
    const snap = await getDoc(doc(fbDb, 'config', 'shipping'));
    if (snap.exists()) shippingProviders = snap.data().providers || [];
  } catch(e) { console.warn('loadShippingProviders:', e); }
}

export function switchShippingTab(id) {
  ['correoarg','andreani','oca','pickup'].forEach(p => {
    const panel = document.getElementById('sp-panel-' + p);
    const tab   = document.getElementById('sp-tab-' + p);
    if (panel) panel.classList.toggle('hidden', p !== id);
    if (tab)   tab.classList.toggle('active', p === id);
  });
}

export function toggleShippingCostField(id) {
  const sel  = document.getElementById('sp-' + id + '-cost-type')?.value;
  const wrap = document.getElementById('sp-' + id + '-cost-wrap');
  if (wrap) wrap.classList.toggle('hidden', sel !== 'fixed');
}

export function initShippingProviders() {
  if (!shippingProviders.length) return;
  shippingProviders.forEach(p => {
    const labelEl   = document.getElementById('sp-' + p.id + '-label');
    const typeEl    = document.getElementById('sp-' + p.id + '-cost-type');
    const costEl    = document.getElementById('sp-' + p.id + '-cost');
    const enabledEl = document.getElementById('sp-' + p.id + '-enabled');
    if (labelEl)   labelEl.value   = p.label || '';
    if (typeEl)    { typeEl.value  = p.costType || 'pending'; toggleShippingCostField(p.id); }
    if (costEl)    costEl.value    = p.cost || '';
    if (enabledEl) enabledEl.checked = !!p.enabled;
    if (p.id === 'pickup') {
      const addrEl  = document.getElementById('sp-pickup-address');
      const hoursEl = document.getElementById('sp-pickup-hours');
      if (addrEl)  addrEl.value  = p.address || '';
      if (hoursEl) hoursEl.value = p.hours   || '';
    }
  });
}

export function renderShippingOptions() {
  const container = document.getElementById('shipping-options-list');
  if (!container) return;
  const active = shippingProviders.filter(p => p.enabled);
  if (!active.length) {
    container.innerHTML = `<label class="flex items-center gap-4 p-4 border-[3px] border-primary cursor-pointer hover:bg-surface-container-low">
      <input type="radio" name="shipping" value="standard" checked class="text-primary"/>
      <div class="flex-1"><div class="font-label-caps text-label-caps text-primary">ENVÍO ESTÁNDAR</div><div class="font-body-md text-on-surface-variant text-sm">Por definir</div></div>
      <span class="font-label-caps text-[10px] text-on-surface-variant">PENDIENTE</span>
    </label>`;
    return;
  }
  container.innerHTML = active.map((p, i) => {
    let costHtml = '';
    if (p.costType === 'free') costHtml = `<span class="font-label-caps text-label-caps text-secondary-container">GRATIS</span>`;
    else if (p.costType === 'fixed' && p.cost > 0) costHtml = `<span class="font-label-caps text-label-caps text-primary">${window.fmtPrice ? window.fmtPrice(p.cost) : '$' + p.cost}</span>`;
    else costHtml = `<span class="font-label-caps text-[10px] text-on-surface-variant">A CALCULAR</span>`;
    const subtitle = p.id === 'pickup' ? (p.address ? p.address + (p.hours ? ' — ' + p.hours : '') : 'Retiro sin cargo') : p.label;
    return `<label class="flex items-center gap-4 p-4 border-[3px] border-primary cursor-pointer hover:bg-surface-container-low" onclick="updateCheckoutShipping('${p.id}')">
      <input type="radio" name="shipping" value="${p.id}" ${i===0?'checked':''} class="text-primary"/>
      <div class="flex-1"><div class="font-label-caps text-label-caps text-primary">${p.label}</div>${p.id!=='pickup'?'':`<div class="font-body-md text-on-surface-variant text-sm">${subtitle}</div>`}</div>
      ${costHtml}
    </label>`;
  }).join('');
}

// ===== TRACKING =====
export function initTrackingSection() {
  const sel = document.getElementById('track-order-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">SELECCIONAR PEDIDO...</option>' +
    state.orders.map(o => {
      const hasTracking = trackingData[o.id] ? ' ✓' : '';
      return `<option value="${o.id}">#${o.id} — ${o.customer} (${o.status.toUpperCase()})${hasTracking}</option>`;
    }).join('');
  renderTrackingList();
  const countEl = document.getElementById('tracking-count');
  if (countEl) countEl.textContent = Object.keys(trackingData).length + ' ENVÍOS';
}

export function loadTrackingOrder(orderId) {
  const detailEl = document.getElementById('track-order-detail');
  const infoEl = document.getElementById('track-order-info');
  if (!orderId) { if (detailEl) detailEl.classList.add('hidden'); return; }
  const order = state.orders.find(o => o.id === orderId);
  const existing = trackingData[orderId];
  if (existing) {
    document.getElementById('track-number-input').value = existing.number || '';
    document.getElementById('track-service').value = existing.service || 'correoarg';
  }
  if (order && detailEl && infoEl) {
    detailEl.classList.remove('hidden');
    infoEl.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
      <div><span class="font-label-caps text-[9px] text-on-surface-variant block">CLIENTE</span>${order.customer}</div>
      <div><span class="font-label-caps text-[9px] text-on-surface-variant block">TOTAL</span>${window.fmtPrice ? window.fmtPrice(order.total) : '$' + order.total}</div>
      <div><span class="font-label-caps text-[9px] text-on-surface-variant block">FECHA</span>${order.date}</div>
      <div><span class="font-label-caps text-[9px] text-on-surface-variant block">ESTADO</span><span class="badge badge-black text-[9px]">${order.status.toUpperCase()}</span></div>
    </div>
    <div class="mt-2 text-[10px] text-on-surface-variant">${order.items.map(i=>i.name+'×'+i.qty).join(' · ')}</div>`;
  }
}

export async function assignTracking() {
  const orderId = document.getElementById('track-order-select').value;
  const number = document.getElementById('track-number-input').value.trim().toUpperCase();
  const service = document.getElementById('track-service').value;
  if (!orderId) { window.showToast?.('Seleccioná un pedido ❌'); return; }
  if (!number) { window.showToast?.('Ingresá el número de seguimiento ❌'); return; }
  trackingData[orderId] = { number, service, assignedAt: new Date().toLocaleDateString('es-AR'),
    events: [{date: new Date().toLocaleDateString('es-AR'), time: new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}), status:'EN PREPARACIÓN', desc:'El paquete está siendo preparado para envío', icon:'inventory_2'}]
  };
  const order = state.orders.find(o => o.id === orderId);
  if (order && order.status === 'pending') order.status = 'shipped';
  window.showToast?.(`✅ Tracking #${number} asignado al pedido #${orderId}`);
  const { persistAll } = await import('./firebase.js');
  persistAll();
  renderTrackingList();
  renderAdminOrders();
  renderAdminDashboard();
}

export function consultarTracking() {
  const num = document.getElementById('track-search-input').value.trim().toUpperCase();
  if (!num) { window.showToast?.('Ingresá un número de seguimiento'); return; }
  const resultEl = document.getElementById('tracking-result');
  const found = Object.entries(trackingData).find(([id, t]) => t.number === num);
  const serviceNames = {correoarg:'Correo Argentino',andreani:'Andreani',oca:'OCA',dhl:'DHL'};
  const serviceUrls = {correoarg:`https://www.correoargentino.com.ar/formularios/e-commerce?numero=${num}`,andreani:`https://www.andreani.com/rastreo/${num}`,oca:`https://www.oca.com.ar/rastreo/?query=${num}`,dhl:`https://www.dhl.com/ar-es/home/rastreo.html?tracking-id=${num}`};
  let events = [];
  let service = 'correoarg';
  let orderId = null;
  if (found) {
    [orderId, {service, events}] = found;
    const order = state.orders.find(o => o.id === orderId);
    if (order && order.status === 'shipped' && events.length < 3) {
      events = [...events,
        {date: new Date().toLocaleDateString('es-AR'), time:'10:30', status:'EN TRÁNSITO', desc:'El paquete está en camino', icon:'local_shipping'},
        {date: new Date().toLocaleDateString('es-AR'), time:'14:00', status:'EN DISTRIBUCIÓN', desc:'El paquete está siendo distribuido', icon:'delivery_dining'},
      ];
    }
    if (order && order.status === 'delivered') {
      events = [...events, {date: new Date().toLocaleDateString('es-AR'), time:'16:45', status:'ENTREGADO', desc:'El paquete fue entregado exitosamente', icon:'check_circle'}];
    }
  } else {
    events = [
      {date: new Date().toLocaleDateString('es-AR'), time:'09:00', status:'ADMITIDO', desc:'Pieza admitida', icon:'inventory_2'},
      {date: new Date().toLocaleDateString('es-AR'), time:'18:30', status:'EN TRÁNSITO', desc:'Pieza en camino', icon:'local_shipping'},
    ];
  }
  const lastEvent = events[events.length-1];
  const statusColors = {'ENTREGADO':'badge-violet','EN TRÁNSITO':'badge-black','EN DISTRIBUCIÓN':'','EN PREPARACIÓN':'','ADMITIDO':'badge-outline'};
  document.getElementById('tr-number').textContent = '# ' + num;
  document.getElementById('tr-service').textContent = serviceNames[service] || service;
  document.getElementById('tr-status-badge').textContent = lastEvent?.status || 'EN PROCESO';
  document.getElementById('tr-status-badge').className = 'badge ' + (statusColors[lastEvent?.status] || 'badge-black');
  document.getElementById('tr-official-link').href = serviceUrls[service] || '#';
  document.getElementById('tr-official-link').textContent = (serviceNames[service] || 'VER TRACKING').toUpperCase() + ' ↗';
  document.getElementById('tr-timeline').innerHTML = events.map((ev, i) => `<div class="relative pb-5">
    <div class="absolute -left-[29px] w-5 h-5 ${i===events.length-1?'bg-secondary-container':'bg-primary'} flex items-center justify-center">
      <span class="material-symbols-outlined text-white text-[12px]">${ev.icon}</span>
    </div>
    <div class="flex justify-between items-start gap-2 mb-0.5">
      <span class="font-label-caps text-[11px] text-primary">${ev.status}</span>
      <span class="font-label-caps text-[10px] text-on-surface-variant whitespace-nowrap">${ev.date} ${ev.time}</span>
    </div>
    <p class="font-body-md text-on-surface-variant text-sm">${ev.desc}</p>
  </div>`).join('');
  resultEl.classList.remove('hidden');
}

export function renderTrackingList() {
  const el = document.getElementById('tracking-list');
  if (!el) return;
  const entries = Object.entries(trackingData);
  if (entries.length === 0) {
    el.innerHTML = '<div class="p-8 text-center"><span class="material-symbols-outlined text-[48px] text-outline-variant">local_shipping</span><p class="font-label-caps text-[10px] text-on-surface-variant mt-3">NO HAY PEDIDOS CON TRACKING</p></div>';
    return;
  }
  const serviceNames = {correoarg:'Correo Argentino',andreani:'Andreani',oca:'OCA',dhl:'DHL'};
  el.innerHTML = `<table class="w-full text-left border-collapse">
    <thead><tr class="border-b-2 border-primary bg-surface font-label-caps text-label-caps text-on-surface-variant">
      <th class="p-4">PEDIDO</th><th class="p-4">CLIENTE</th><th class="p-4">Nº TRACKING</th>
      <th class="p-4 hidden md:table-cell">SERVICIO</th><th class="p-4">ÚLTIMO ESTADO</th><th class="p-4 w-10"></th>
    </tr></thead>
    <tbody>${entries.map(([orderId, t]) => {
      const order = state.orders.find(o => o.id === orderId);
      const lastEvt = t.events?.[t.events.length-1];
      return `<tr class="border-b border-outline-variant hover:bg-surface-variant font-body-md">
        <td class="p-4 font-label-caps text-[11px] text-primary">#${orderId}</td>
        <td class="p-4">${order?.customer || '—'}</td>
        <td class="p-4 font-label-caps text-[11px] text-secondary-container">${t.number}</td>
        <td class="p-4 font-label-caps text-[10px] text-on-surface-variant hidden md:table-cell">${serviceNames[t.service]||t.service}</td>
        <td class="p-4"><span class="badge badge-black text-[9px]">${lastEvt?.status||'—'}</span></td>
        <td class="p-4"><button class="p-1 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors" onclick="document.getElementById('track-search-input').value='${t.number}';consultarTracking()"><span class="material-symbols-outlined text-[16px]">search</span></button></td>
      </tr>`;}).join('')}
    </tbody></table>`;
}

// ===== REPORTS =====
export function initReportesSection() {
  const sel = document.getElementById('rep-pedido');
  if (!sel) return;
  sel.innerHTML = '<option value="">TODOS LOS PEDIDOS</option>' +
    state.orders.map(o => `<option value="${o.id}">#${o.id} — ${o.customer} (${window.fmtPrice ? window.fmtPrice(o.total) : '$' + o.total})</option>`).join('');
  previewReport();
}

export function getFilteredOrders() {
  const estado = document.getElementById('rep-estado')?.value || 'all';
  const pedidoId = document.getElementById('rep-pedido')?.value || '';
  const orden = document.getElementById('rep-orden')?.value || 'fecha-desc';
  let orders = [...state.orders];
  if (estado !== 'all') orders = orders.filter(o => o.status === estado);
  if (pedidoId) orders = orders.filter(o => o.id === pedidoId);
  if (orden === 'fecha-asc') orders.reverse();
  else if (orden === 'monto-desc') orders.sort((a,b) => b.total - a.total);
  else if (orden === 'monto-asc') orders.sort((a,b) => a.total - b.total);
  return orders;
}

export function statusLabel(s) {
  return {pending:'PENDIENTE', shipped:'ENVIADO', delivered:'ENTREGADO', cancelled:'CANCELADO'}[s] || (s||'').toUpperCase();
}

export function statusColor(s) {
  return {pending:'#e65100', shipped:'#1565c0', delivered:'#2e7d32', cancelled:'#c62828'}[s] || '#000';
}

export function buildReportHTML(tipo, orders) {
  const now = new Date().toLocaleDateString('es-AR', {day:'2-digit', month:'long', year:'numeric'});
  const totalVentas = orders.reduce((s,o) => s + o.total, 0);
  const totalPendiente = orders.filter(o=>o.status==='pending').reduce((s,o)=>s+o.total,0);
  const totalEntregado = orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+o.total,0);
  const fp = (n) => window.fmtPrice ? window.fmtPrice(n) : '$' + n;
  const header = `<div style="border-bottom:3px solid #000;padding-bottom:20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div><div style="font-family:Arial,sans-serif;font-size:32px;font-weight:900;letter-spacing:-2px;line-height:1;">XINCO</div>
    <div style="font-size:10px;color:#666;margin-top:4px;font-family:monospace;letter-spacing:1px;">URBAN STREETWEAR — MAR DEL PLATA</div></div>
    <div style="text-align:right;"><div style="font-size:10px;color:#666;font-family:monospace;">GENERADO EL ${now}</div>
    <div style="font-size:10px;color:#666;font-family:monospace;margin-top:2px;">USO EXCLUSIVO INTERNO</div></div></div>`;
  if (tipo === 'ventas') {
    return header + `<div style="font-size:18px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;border-left:4px solid #000;padding-left:12px;">RESUMEN DE VENTAS</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:12px;border:2px solid #000;background:#000;color:#fff;font-family:monospace;font-size:11px;">TOTAL GENERAL</td>
      <td style="padding:12px;border:2px solid #000;font-family:monospace;font-size:16px;font-weight:bold;text-align:right;">${fp(totalVentas)}</td>
      <td style="padding:12px;border:2px solid #000;background:#000;color:#fff;font-family:monospace;font-size:11px;">PEDIDOS TOTALES</td>
      <td style="padding:12px;border:2px solid #000;font-family:monospace;font-size:16px;font-weight:bold;text-align:right;">${orders.length}</td></tr>
      <tr><td style="padding:10px;border:1px solid #ccc;font-family:monospace;font-size:10px;color:#666;">PENDIENTE</td>
      <td style="padding:10px;border:1px solid #ccc;font-family:monospace;font-size:12px;font-weight:bold;text-align:right;color:#e65100;">${fp(totalPendiente)}</td>
      <td style="padding:10px;border:1px solid #ccc;font-family:monospace;font-size:10px;color:#666;">ENTREGADO</td>
      <td style="padding:10px;border:1px solid #ccc;font-family:monospace;font-size:12px;font-weight:bold;text-align:right;color:#2e7d32;">${fp(totalEntregado)}</td></tr>
    </table>
    <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-family:monospace;">DETALLE DE PEDIDOS</div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead><tr style="background:#000;color:#fff;"><th style="padding:8px;text-align:left;font-family:monospace;">ID</th><th style="padding:8px;text-align:left;font-family:monospace;">CLIENTE</th><th style="padding:8px;text-align:left;font-family:monospace;">EMAIL</th><th style="padding:8px;text-align:left;font-family:monospace;">FECHA</th><th style="padding:8px;text-align:right;font-family:monospace;">TOTAL</th><th style="padding:8px;text-align:center;font-family:monospace;">ESTADO</th></tr></thead>
      <tbody>${orders.map((o,i) => `<tr style="background:${i%2===0?'#f9f9f9':'#fff'};border-bottom:1px solid #e0e0e0;">
        <td style="padding:8px;font-family:monospace;font-size:10px;font-weight:bold;">#${o.id}</td>
        <td style="padding:8px;font-size:11px;">${o.customer}</td>
        <td style="padding:8px;font-size:10px;color:#555;">${o.email||'—'}</td>
        <td style="padding:8px;font-size:10px;">${o.date}</td>
        <td style="padding:8px;text-align:right;font-weight:bold;font-family:monospace;">${fp(o.total)}</td>
        <td style="padding:8px;text-align:center;"><span style="background:${statusColor(o.status)};color:#fff;padding:2px 8px;font-family:monospace;font-size:9px;">${statusLabel(o.status)}</span></td>
      </tr>`).join('')}</tbody>
      <tfoot><tr style="background:#000;color:#fff;font-weight:bold;">
        <td colspan="4" style="padding:10px;font-family:monospace;">TOTAL</td>
        <td style="padding:10px;text-align:right;font-family:monospace;">${fp(totalVentas)}</td>
        <td style="padding:10px;text-align:center;font-family:monospace;">${orders.length} PEDIDOS</td>
      </tr></tfoot>
    </table>`;
  }
  if (tipo === 'clientes') {
    const emails = [...new Set(orders.map(o=>o.email).filter(Boolean))];
    return header + `<div style="font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:20px;border-left:4px solid #000;padding-left:12px;">DATOS DE CLIENTES</div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead><tr style="background:#000;color:#fff;"><th style="padding:8px;text-align:left;font-family:monospace;">#</th><th style="padding:8px;text-align:left;font-family:monospace;">NOMBRE</th><th style="padding:8px;text-align:left;font-family:monospace;">EMAIL</th><th style="padding:8px;text-align:center;font-family:monospace;">PEDIDOS</th><th style="padding:8px;text-align:right;font-family:monospace;">TOTAL</th><th style="padding:8px;text-align:left;font-family:monospace;">ÚLTIMO</th></tr></thead>
      <tbody>${emails.map((email,i) => { const co = orders.filter(o=>o.email===email); const total = co.reduce((s,o)=>s+o.total,0); return `<tr style="background:${i%2===0?'#f9f9f9':'#fff'};border-bottom:1px solid #e0e0e0;">
        <td style="padding:8px;font-family:monospace;color:#666;">${i+1}</td>
        <td style="padding:8px;font-size:11px;font-weight:bold;">${co[0]?.customer||email}</td>
        <td style="padding:8px;font-size:10px;color:#555;">${email}</td>
        <td style="padding:8px;text-align:center;font-family:monospace;">${co.length}</td>
        <td style="padding:8px;text-align:right;font-weight:bold;font-family:monospace;">${fp(total)}</td>
        <td style="padding:8px;font-size:10px;">${co[0]?.date||'—'}</td>
      </tr>`;}).join('')}</tbody>
    </table>
    <div style="margin-top:16px;padding:12px;border:2px solid #000;background:#f5f5f5;font-family:monospace;font-size:10px;">TOTAL CLIENTES: ${emails.length} | TOTAL: ${fp(totalVentas)}</div>`;
  }
  if (tipo === 'pedido') {
    return orders.map(o => `<div${orders.indexOf(o)>0?' style="page-break-before:always;padding-top:48px;"':''}>
      ${orders.indexOf(o)>0?header:''}
      <div style="font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:20px;border-left:4px solid #000;padding-left:12px;">COMPROBANTE — #${o.id}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="width:50%;padding:12px;border:1px solid #000;vertical-align:top;"><div style="font-family:monospace;font-size:10px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">CLIENTE</div>
          <div style="font-size:12px;font-weight:bold;">${o.customer}</div>
          <div style="font-size:11px;color:#555;">${o.email||''}</div>
          <div style="font-size:11px;color:#555;">${o.phone||''}</div>
        </td>
        <td style="width:50%;padding:12px;border:1px solid #000;vertical-align:top;border-left:none;"><div style="font-family:monospace;font-size:10px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">PEDIDO</div>
          <div style="font-size:11px;"><b>Fecha:</b> ${o.date}</div>
          <div style="font-size:11px;"><b>Estado:</b> <span style="color:${statusColor(o.status)};font-weight:bold;">${statusLabel(o.status)}</span></div>
          <div style="font-size:11px;"><b>Método:</b> ${(o.payMethod||'MP').toUpperCase()}</div>
          ${trackingData[o.id]?`<div style="font-size:11px;"><b>Tracking:</b> ${trackingData[o.id].number}</div>`:''}
        </td></tr>
      </table>
      <div style="font-family:monospace;font-size:10px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">PRODUCTOS</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead><tr style="background:#000;color:#fff;"><th style="padding:8px;text-align:left;font-family:monospace;">PRODUCTO</th><th style="padding:8px;text-align:center;font-family:monospace;">CANT.</th><th style="padding:8px;text-align:right;font-family:monospace;">P.UNIT.</th><th style="padding:8px;text-align:right;font-family:monospace;">SUBTOTAL</th></tr></thead>
        <tbody>${(o.items||[]).map((item,i) => `<tr style="background:${i%2===0?'#f9f9f9':'#fff'};border-bottom:1px solid #e0e0e0;">
          <td style="padding:8px;font-size:11px;">${item.name}</td>
          <td style="padding:8px;text-align:center;font-family:monospace;">${item.qty}</td>
          <td style="padding:8px;text-align:right;font-family:monospace;">${fp(item.price)}</td>
          <td style="padding:8px;text-align:right;font-family:monospace;font-weight:bold;">${fp(item.price*item.qty)}</td>
        </tr>`).join('')}</tbody>
        <tfoot><tr style="border-top:2px solid #000;"><td colspan="3" style="padding:10px;text-align:right;font-family:monospace;font-weight:bold;">TOTAL</td>
          <td style="padding:10px;text-align:right;font-family:monospace;font-size:14px;font-weight:bold;">${fp(o.total)}</td>
        </tr></tfoot>
      </table>
      <div style="margin-top:40px;display:flex;gap:40px;"><div style="flex:1;border-top:1px solid #000;padding-top:8px;text-align:center;font-family:monospace;font-size:10px;color:#666;">FIRMA CLIENTE</div><div style="flex:1;border-top:1px solid #000;padding-top:8px;text-align:center;font-family:monospace;font-size:10px;color:#666;">FIRMA XINCO</div></div>
    </div>`).join('');
  }
  if (tipo === 'completo') {
    return header + `<div style="font-size:18px;font-weight:bold;text-transform:uppercase;margin-bottom:20px;border-left:4px solid #000;padding-left:12px;">REPORTE COMPLETO</div>
    <div style="background:#000;color:#fff;padding:16px;margin-bottom:20px;">
      <div style="font-family:monospace;font-size:10px;text-transform:uppercase;margin-bottom:8px;color:#aaa;">RESUMEN — ${now}</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div><div style="font-size:22px;font-weight:bold;">${fp(totalVentas)}</div><div style="font-size:10px;color:#aaa;font-family:monospace;">TOTAL</div></div>
        <div><div style="font-size:22px;font-weight:bold;">${orders.length}</div><div style="font-size:10px;color:#aaa;font-family:monospace;">PEDIDOS</div></div>
        <div><div style="font-size:22px;font-weight:bold;">${[...new Set(orders.map(o=>o.email).filter(Boolean))].length}</div><div style="font-size:10px;color:#aaa;font-family:monospace;">CLIENTES</div></div>
        <div><div style="font-size:22px;font-weight:bold;">${orders.length?fp(Math.round(totalVentas/orders.length)):'$0'}</div><div style="font-size:10px;color:#aaa;font-family:monospace;">PROMEDIO</div></div>
      </div>
    </div>
    ${buildReportHTML('ventas', orders)}
    <div style="page-break-before:always;padding-top:48px;">${header}${buildReportHTML('clientes', orders)}</div>`;
  }
  return header + '<p style="text-align:center;color:#666;margin-top:40px;font-family:monospace;">Seleccioná un tipo de reporte</p>';
}

export function previewReport() {
  const tipo   = document.getElementById('rep-tipo')?.value || 'ventas';
  const orders = getFilteredOrders();
  const countEl = document.getElementById('rep-count');
  if (countEl) countEl.textContent = orders.length + ' PEDIDO' + (orders.length !== 1 ? 'S' : '');
  const preview = document.getElementById('rep-preview');
  if (!preview) return;
  if (orders.length === 0) {
    preview.innerHTML = '<div style="text-align:center;padding:60px;color:#666;font-family:monospace;font-size:12px;">NO HAY PEDIDOS CON ESOS FILTROS</div>';
    return;
  }
  preview.innerHTML = buildReportHTML(tipo, orders);
}

export function printReport() {
  const tipo   = document.getElementById('rep-tipo')?.value || 'ventas';
  const orders = getFilteredOrders();
  if (orders.length === 0) { window.showToast?.('No hay pedidos para imprimir'); return; }
  const now = new Date().toLocaleDateString('es-AR', {day:'2-digit', month:'long', year:'numeric'});
  const content = buildReportHTML(tipo, orders);
  const tipoLabels = {ventas:'Resumen de Ventas', clientes:'Datos de Clientes', pedido:'Comprobante de Pedido', completo:'Reporte Completo'};
  const accentColor = getComputedStyle(document.querySelector('#page-admin')).getPropertyValue('--admin-accent').trim() || '#5d22ff';
  const printWin = window.open('', '_blank', 'width=900,height=700');
  printWin.document.write(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><title>XINCO — ${tipoLabels[tipo]} — ${now}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#000;background:#fff}
@page{size:A4;margin:20mm 15mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}thead{display:table-header-group}tr{page-break-inside:avoid}}
table{border-collapse:collapse}.page-break{page-break-before:always}</style></head>
<body>
<div class="no-print" style="background:#000;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;font-family:monospace;font-size:11px;">
  <span>XINCO — ${tipoLabels[tipo].toUpperCase()} — ${now} — ${orders.length} PEDIDO${orders.length!==1?'S':''}</span>
  <div style="display:flex;gap:8px;">
    <button onclick="window.print()" style="background:${accentColor};color:#fff;border:none;padding:8px 20px;font-family:monospace;font-size:11px;font-weight:bold;cursor:pointer;text-transform:uppercase;">▶ IMPRIMIR / PDF</button>
    <button onclick="window.close()" style="background:#fff;color:#000;border:2px solid #fff;padding:8px 16px;font-family:monospace;font-size:11px;font-weight:bold;cursor:pointer;">✕ CERRAR</button>
  </div>
</div>
<div style="padding:32px 32px 48px;">${content}</div>
</body>
</html>`);
  printWin.document.close();
  setTimeout(() => { try { printWin.focus(); } catch(e) {} }, 500);
}

export const BG_COLORS = {
  violet: { label:'Violeta', hue:[240,290], css:'#9b87f5', cssLight:'#c4b5fd' },
  blue: { label:'Azul', hue:[200,240], css:'#5b9cf5', cssLight:'#8bbaff' },
  pink: { label:'Rosa', hue:[300,340], css:'#e87be8', cssLight:'#f5b0f5' },
  green: { label:'Verde', hue:[120,160], css:'#5cc97a', cssLight:'#8edfa3' },
  gold: { label:'Dorado', hue:[40,60], css:'#e8c84a', cssLight:'#f0db6e' },
  red: { label:'Rojo', hue:[0,30], css:'#f56060', cssLight:'#f59090' }
};
let _currentBgColor = localStorage.getItem('adminBgColor') || 'violet';


function applyBgColor(scheme) {
  _currentBgColor = scheme;
  localStorage.setItem('adminBgColor', scheme);
  const c = BG_COLORS[scheme];
  let css, cssLight;
  if (c) {
    css = c.css; cssLight = c.cssLight;
  } else {
    const customMatch = scheme?.match(/^custom_#([a-f\d]{6})$/i);
    if (customMatch) { css = '#' + customMatch[1]; cssLight = css + '99'; }
    else return;
  }
  const r = document.querySelector('#page-admin');
  if (!r) return;
  r.style.setProperty('--admin-accent', css);
  r.style.setProperty('--admin-accent-light', cssLight);
  r.style.setProperty('--admin-accent-dim', css + '18');
  document.querySelectorAll('.color-swatch').forEach(el => el.classList.toggle('active', el.dataset.color === scheme));
  const avatar = document.querySelector('.admin-avatar');
  if (avatar) avatar.style.background = css;
  const iconEl = document.querySelector('.section-icon');
  if (iconEl) iconEl.style.color = css;
}

export function setAdminColor(scheme) {
  if (!BG_COLORS[scheme]) return;
  applyBgColor(scheme);
  const picker = document.getElementById('ap-vector-color');
  if (picker) picker.value = BG_COLORS[scheme].css;
}

export function getBgColor() {
  if (BG_COLORS[_currentBgColor]) return BG_COLORS[_currentBgColor];
  const customMatch = _currentBgColor?.match(/^custom_#([a-f\d]{6})$/i);
  if (customMatch) {
    const hex = customMatch[1];
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    const hsl = rgbToHsl(r, g, b);
    return { label:'Personalizado', hue:[hsl.h - 20, hsl.h + 20], css:'#' + hex, cssLight: '#' + hex + '99' };
  }
  return BG_COLORS.violet;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h || 0), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function setAdminCustomColor(hex) {
  const match = hex.match(/^#?([a-f\d]{6})$/i);
  if (!match) return;
  localStorage.setItem('adminBgColor', 'custom_' + hex);
  const r = document.querySelector('#page-admin');
  if (r) {
    r.style.setProperty('--admin-accent', hex);
    r.style.setProperty('--admin-accent-light', hex + '99');
    r.style.setProperty('--admin-accent-dim', hex + '18');
  }
  document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
  document.getElementById('ap-vector-color').value = hex;
}

// ===== ADMIN VIDEO BACKGROUND =====
export function initAdminBg() {
  const video = document.getElementById('admin-bg-video');
  if (!video) return;
  const cfg = loadAppearance();
  const src = cfg.bgVideo1 || cfg.bgVideo2 || cfg.bgVideo3 || cfg.bgVideo4 || '';
  if (src) { video.src = src; video.load(); video.play().catch(() => {}); }
}

// ===== ADMIN BACKGROUNDS FROM CLOUDINARY FOLDER =====
let _availableAdminBgs = [];

export async function fetchAdminBgList() {
  try {
    const res = await fetch('/api/admin-bg-list');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.error === 'CLOUDINARY_CREDENTIALS_MISSING') {
      console.warn('fetchAdminBgList:', data.hint);
      _availableAdminBgs = [];
      _adminBgListError = 'credentials';
      return [];
    }
    _availableAdminBgs = data.resources || [];
    _adminBgListError = _availableAdminBgs.length === 0 ? 'empty' : null;
    return _availableAdminBgs;
  } catch (e) {
    console.warn('fetchAdminBgList:', e.message);
    _adminBgListError = 'error';
    return [];
  }
}

let _adminBgListError = null;

export function renderAdminBgSelection() {
  const container = document.getElementById('ap-bg-available');
  const loading = document.getElementById('ap-bg-loading');
  const counter = document.getElementById('ap-bg-counter');
  if (!container) return;
  if (loading) loading.style.display = 'none';

  if (_adminBgListError === 'credentials') {
    container.innerHTML = '<p class="text-warning text-sm col-span-4 flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">warning</span> Cloudinary no configurado — agregá API Key y Secret en Vercel.</p>';
    if (counter) counter.textContent = 'FONDOS TOTALES 0/4';
    return;
  }

  if (_availableAdminBgs.length === 0) {
    container.innerHTML = '<p class="text-on-surface-variant/50 text-sm col-span-4">No hay fondos en la carpeta. Usá "SUBIR VIDEO" para agregar.</p>';
    if (counter) counter.textContent = 'FONDOS TOTALES 0/4';
    return;
  }

  const cfg = loadAppearance();
  const selectedUrl = cfg.bgVideo1;
  const selectedCount = selectedUrl ? 1 : 0;

  container.innerHTML = _availableAdminBgs.map((bg) => {
    const isSelected = bg.url === selectedUrl;
    return `<div class="relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-primary' : 'border-transparent hover:border-white/30'}" onclick="window.selectAdminBg('${bg.url}')" style="aspect-ratio:16/9;background:#000;">
      <video src="${bg.url}" muted loop playsinline preload="metadata" class="w-full h-full object-cover" onmouseenter="this.play()" onmouseleave="this.pause()" onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center w-full h-full text-on-surface-variant/40 text-[10px]\\'>Error</div>'"></video>
      ${isSelected ? '<div class="absolute inset-0 flex items-center justify-center bg-primary/20"><span class="material-symbols-outlined text-white text-[24px]">check_circle</span></div>' : ''}
    </div>`;
  }).join('');
  if (counter) counter.textContent = `FONDOS TOTALES ${selectedCount}/4`;
}

export function selectAdminBg(url) {
  const cfg = loadAppearance();
  const current = cfg.bgVideo1;
  if (current === url) {
    cfg.bgVideo1 = '';
    cfg.bgVideo2 = '';
    cfg.bgVideo3 = '';
    cfg.bgVideo4 = '';
    setAdminBgVideo('');
  } else {
    cfg.bgVideo1 = url;
    cfg.bgVideo2 = '';
    cfg.bgVideo3 = '';
    cfg.bgVideo4 = '';
    setAdminBgVideo(url);
  }
  localStorage.setItem(APP_KEY, JSON.stringify(cfg));
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('ap-bg-video-' + i);
    if (el) el.value = cfg['bgVideo' + i] || '';
  }
  renderAdminBgSelection();
}

export function setAdminBgVideo(url) {
  const video = document.getElementById('admin-bg-video');
  if (!video) return;
  video.src = url;
  video.play().catch(() => {});
}

export function uploadAdminBgVideo(slot, file) {
  if (!file) return;
  window.showToast?.('Subiendo video...');
  const maxSize = 100;
  if (file.size > maxSize * 1024 * 1024) { window.showToast?.(`⚠️ El archivo supera los ${maxSize}MB`); return; }
  if (!file.type.startsWith('video/')) { window.showToast?.('⚠️ Solo se permiten videos'); return; }
  // Fetch signed upload params from serverless function
  fetch('/api/cloudinary-sign?folder=XINCO-TIENDA/ADMINPANEL/BACKGROUND')
    .then(r => r.json())
    .then(signData => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', signData.folder);
      fd.append('timestamp', signData.timestamp);
      fd.append('api_key', signData.apiKey);
      fd.append('signature', signData.signature);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`, true);
      xhr.upload.onprogress = () => {};
      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          if (slot > 0) {
            selectAdminBg(res.secure_url);
          } else {
            fetchAdminBgList().then(() => renderAdminBgSelection());
            setAdminBgVideo(res.secure_url);
          }
          window.showToast?.('✅ Video subido a Cloudinary');
        } else {
          let msg = 'Error al subir';
          try { const err = JSON.parse(xhr.responseText); msg = err.error?.message || msg; } catch(e) {}
          window.showToast?.('❌ ' + msg);
        }
      };
      xhr.onerror = () => { window.showToast?.('❌ Error de conexión'); };
      xhr.send(fd);
    })
    .catch(e => {
      window.showToast?.('❌ Error al obtener firma de subida');
      console.error('uploadAdminBgVideo sign error:', e);
    });
}

// ===== PAGE BACKGROUND ANIMATION (antigravity particles) =====
let _pageBgAnimId = null;
export function initPageBg() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const BASE_COUNT = 25;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const scheme = getBgColor();
  const hue = (scheme.hue[0] + scheme.hue[1]) / 2;

  function createParticle() {
    const size = 2 + Math.random() * 4;
    return {
      x: Math.random() * W, y: H + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(0.3 + Math.random() * 0.5),
      r: size,
      alpha: 0.06 + Math.random() * 0.12,
      hue: hue + (Math.random() - 0.5) * 40,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < BASE_COUNT; i++) particles.push(createParticle());
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      const pulse = 1 + Math.sin(time * 0.001 + p.phase) * 0.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 40%, 50%, ${p.alpha})`;
      ctx.fill();
      p.x += p.vx + Math.sin(time * 0.0005 + p.phase) * 0.1;
      p.y += p.vy;
      if (p.y < -20) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -20 || p.x > W + 20) p.x = Math.random() * W;
    }
    _pageBgAnimId = requestAnimationFrame(draw);
  }

  initParticles();
  draw(0);
}

export function stopPageBg() {
  if (_pageBgAnimId) { cancelAnimationFrame(_pageBgAnimId); _pageBgAnimId = null; }
}

// ===== APPEARANCE SETTINGS =====
const APP_KEY = 'xincoAppearance';

export function loadAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem(APP_KEY));
    if (saved) return saved;
  } catch(e) {}
  return { theme: 'light', dockOpacity: 50, dockWidth: 18, dockHeight: 44, dockPosition: 'bottom', dockStyle: 'blur', dockDraggable: true, bgVideo1: '', bgVideo2: '', bgVideo3: '', bgVideo4: '' };
}

export function saveAppearance() {
  const cfg = {
    theme: window.getTheme?.() || 'light',
    dockOpacity: parseInt(document.getElementById('ap-dock-opacity')?.value || '50'),
    dockWidth: parseInt(document.getElementById('ap-dock-width')?.value || '18'),
    dockHeight: parseInt(document.getElementById('ap-dock-height')?.value || '44'),
    dockPosition: document.querySelector('input[name="dock-position"]:checked')?.value || 'bottom',
    dockStyle: document.querySelector('input[name="dock-style"]:checked')?.value || 'blur',
    dockDraggable: document.getElementById('ap-dock-draggable')?.checked ?? true,
    bgVideo1: document.getElementById('ap-bg-video-1')?.value.trim() || '',
    bgVideo2: document.getElementById('ap-bg-video-2')?.value.trim() || '',
    bgVideo3: document.getElementById('ap-bg-video-3')?.value.trim() || '',
    bgVideo4: document.getElementById('ap-bg-video-4')?.value.trim() || '',
  };
  localStorage.setItem(APP_KEY, JSON.stringify(cfg));
  applyAppearance(cfg);
  window.syncDockDraggable?.();
}

export async function saveAppearanceToFirebase() {
  saveAppearance();
  const cfg = loadAppearance();
  const ready = await window.waitForFirebase();
  if (!ready || !window._fb || !window.fbDb) {
    window.showToast?.('⚠️ Sin conexión — guardado solo localmente');
    return;
  }
  try {
    const { doc, setDoc, collection } = window._fb;
    await setDoc(doc(window.fbDb, 'config', 'apariencia'), cfg, { merge: true });
    window.showToast?.('✅ Configuración guardada en la nube');
  } catch(e) {
    console.error('saveAppearanceToFirebase error:', e);
    const msg = e.code === 'permission-denied'
      ? '⚠️ Permiso denegado — configurá las reglas de seguridad en Firebase Console'
      : e.code === 'unavailable'
        ? '⚠️ Firebase no disponible — revisá tu conexión'
        : `⚠️ Error: ${e.code || e.message}`;
    window.showToast?.(msg);
  }
}

export async function applyAllChanges() {
  const btn = document.getElementById('ap-apply-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> APLICANDO...'; }
  try {
    // Read all form values and save
    saveAppearance();
    // Sync to Firebase
    await saveAppearanceToFirebase();
    // Re-render background selection
    await fetchAdminBgList();
    renderAdminBgSelection();
    window.showToast?.('✅ Todos los cambios aplicados y sincronizados');
  } catch(e) {
    console.error('applyAllChanges error:', e);
    window.showToast?.('⚠️ Error al aplicar cambios');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span> APLICAR CAMBIOS'; }
  }
}

export function applyAppearance(cfg) {
  if (cfg.theme && window.setTheme) window.setTheme(cfg.theme);
  const dock = document.getElementById('admin-dock');
  if (dock) {
    dock.style.setProperty('--dock-width', (cfg.dockWidth || 18) + 'px');
    dock.style.setProperty('--dock-height', (cfg.dockHeight || 44) + 'px');
    dock.classList.remove('dock-blur', 'dock-acrylic', 'dock-colored-on', 'dock-bottom', 'dock-top');
    dock.classList.add('dock-' + (cfg.dockStyle || 'blur'), 'dock-' + (cfg.dockPosition || 'bottom'));
  }
  window._appearanceCfg = cfg;
  try { window.syncDockDraggable?.(); } catch(_) {}
}

export function initAppearancePanel() {
  // Try Firebase first
  (async () => {
    const ready = await window.waitForFirebase();
    if (ready && window._fb && window.fbDb) {
      try {
        const { doc, getDoc } = window._fb;
        const snap = await getDoc(doc(window.fbDb, 'config', 'apariencia'));
        if (snap.exists()) {
          const fbCfg = snap.data();
          localStorage.setItem(APP_KEY, JSON.stringify(fbCfg));
          const setVal = (id, val) => { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = val; else el.value = val; } };
          setVal('ap-dock-opacity', fbCfg.dockOpacity);
          document.getElementById('ap-dock-opacity-val').textContent = fbCfg.dockOpacity;

          setVal('ap-dock-draggable', fbCfg.dockDraggable !== false);
          setVal('ap-dock-width', fbCfg.dockWidth);
          document.getElementById('ap-dock-width-val').textContent = fbCfg.dockWidth;
          setVal('ap-dock-height', fbCfg.dockHeight);
          document.getElementById('ap-dock-height-val').textContent = fbCfg.dockHeight;
          const posRadio = document.querySelector(`input[name="dock-position"][value="${fbCfg.dockPosition || 'bottom'}"]`);
          if (posRadio) posRadio.checked = true;
          const styleRadio = document.querySelector(`input[name="dock-style"][value="${fbCfg.dockStyle || 'blur'}"]`);
          if (styleRadio) styleRadio.checked = true;
          if (fbCfg.theme && window.setTheme) window.setTheme(fbCfg.theme);
          for (let i = 1; i <= 4; i++) {
            const url = fbCfg['bgVideo' + i] || '';
            const el = document.getElementById('ap-bg-video-' + i);
            if (el) el.value = url;
          }
          applyAppearance(fbCfg);
          await fetchAdminBgList();
          renderAdminBgSelection();
          return;
        }
      } catch(e) { console.warn('initAppearancePanel: Firebase fallback:', e.message); }
    }
    // Fallback to localStorage
    const cfg = loadAppearance();
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = val; else el.value = val; } };
    setVal('ap-dock-draggable', cfg.dockDraggable !== false);
    setVal('ap-dock-opacity', cfg.dockOpacity);
    document.getElementById('ap-dock-opacity-val').textContent = cfg.dockOpacity;
    setVal('ap-dock-width', cfg.dockWidth);
    document.getElementById('ap-dock-width-val').textContent = cfg.dockWidth;
    setVal('ap-dock-height', cfg.dockHeight);
    document.getElementById('ap-dock-height-val').textContent = cfg.dockHeight;
    const posRadio = document.querySelector(`input[name="dock-position"][value="${cfg.dockPosition || 'bottom'}"]`);
    if (posRadio) posRadio.checked = true;
    const styleRadio = document.querySelector(`input[name="dock-style"][value="${cfg.dockStyle || 'blur'}"]`);
    if (styleRadio) styleRadio.checked = true;
    for (let i = 1; i <= 4; i++) {
      const url = cfg['bgVideo' + i] || '';
      const el = document.getElementById('ap-bg-video-' + i);
      if (el) el.value = url;
    }
    applyAppearance(cfg);
    await fetchAdminBgList();
    renderAdminBgSelection();
  })();
}

// ===== SOCIAL MEDIA CONFIG =====
const SOCIAL_KEY = 'xinco_social';

function loadSocialConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(SOCIAL_KEY));
    if (saved) return saved;
  } catch(e) {}
  return { instagram:'', tiktok:'', facebook:'', twitter:'', youtube:'', whatsapp:'' };
}

export function saveSocialConfig() {
  const cfg = {
    instagram: document.getElementById('sn-instagram')?.value.trim() || '',
    tiktok: document.getElementById('sn-tiktok')?.value.trim() || '',
    facebook: document.getElementById('sn-facebook')?.value.trim() || '',
    twitter: document.getElementById('sn-twitter')?.value.trim() || '',
    youtube: document.getElementById('sn-youtube')?.value.trim() || '',
    whatsapp: document.getElementById('sn-whatsapp')?.value.trim() || '',
  };
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(cfg));
  (async () => {
    const ready = await window.waitForFirebase();
    if (!ready || !window._fb || !window.fbDb) { window.showToast?.('⚠️ Sin conexión — guardado solo localmente'); return; }
    try {
      const { doc, setDoc } = window._fb;
      await setDoc(doc(window.fbDb, 'config', 'social'), cfg, { merge: true });
      window.showToast?.('✅ Redes sociales guardadas en la nube');
    } catch(e) {
      console.error('saveSocialConfig error:', e);
      const msg = e.code === 'permission-denied'
        ? '⚠️ Permiso denegado — revisá reglas de Firebase'
        : `⚠️ Error: ${e.code || e.message}`;
      window.showToast?.(msg);
    }
  })();
  renderFooterSocial(cfg);
  renderWhatsAppButton(cfg);
}

export function loadSocialConfigFromFirebase() {
  (async () => {
    const ready = await window.waitForFirebase();
    if (!ready || !window._fb || !window.fbDb) {
      const cfg = loadSocialConfig();
      renderFooterSocial(cfg);
      renderWhatsAppButton(cfg);
      return;
    }
    try {
      const { doc, getDoc } = window._fb;
      const snap = await getDoc(doc(window.fbDb, 'config', 'social'));
      if (snap.exists()) {
        const cfg = snap.data();
        localStorage.setItem(SOCIAL_KEY, JSON.stringify(cfg));
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('sn-instagram', cfg.instagram);
        set('sn-tiktok', cfg.tiktok);
        set('sn-facebook', cfg.facebook);
        set('sn-twitter', cfg.twitter);
        set('sn-youtube', cfg.youtube);
        set('sn-whatsapp', cfg.whatsapp);
        renderFooterSocial(cfg);
        renderWhatsAppButton(cfg);
        return;
      }
    } catch(e) { console.warn('loadSocialConfig firebase:', e); }
    const cfg = loadSocialConfig();
    renderFooterSocial(cfg);
    renderWhatsAppButton(cfg);
  })();
}

function renderFooterSocial(cfg) {
  const container = document.getElementById('footer-social');
  if (!container) return;
  const links = [];
  if (cfg.instagram) links.push({ label:'INSTAGRAM', url:cfg.instagram, icon:'instagram' });
  if (cfg.tiktok) links.push({ label:'TIKTOK', url:cfg.tiktok, icon:'tiktok' });
  if (cfg.facebook) links.push({ label:'FACEBOOK', url:cfg.facebook, icon:'facebook' });
  if (cfg.twitter) links.push({ label:'X', url:cfg.twitter, icon:'x' });
  if (cfg.youtube) links.push({ label:'YOUTUBE', url:cfg.youtube, icon:'youtube' });
  if (links.length === 0) {
    container.innerHTML = '<span class="font-label-caps text-[10px] text-on-primary/30">— SIN REDES CONFIGURADAS —</span>';
    return;
  }
  container.innerHTML = links.map(l =>
    `<a href="${l.url}" target="_blank" rel="noopener" class="badge badge-outline" style="background:transparent;border-color:var(--on-primary);color:var(--on-primary);text-decoration:none;">${l.label}</a>`
  ).join('');
}

function renderWhatsAppButton(cfg) {
  const btn = document.getElementById('whatsapp-float');
  if (!btn) return;
  if (cfg.whatsapp) {
    btn.href = `https://wa.me/${cfg.whatsapp.replace(/[^0-9]/g,'')}`;
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }
}

// ===== NEWSLETTER =====
export function subscribeNewsletter() {
  const input = document.getElementById('newsletter-email');
  if (!input) return;
  const email = input.value.trim();
  if (!email || !email.includes('@')) { window.showToast?.('Ingresá un email válido'); return; }
  (async () => {
    const ready = await window.waitForFirebase();
    if (!ready || !window._fb || !window.fbDb) {
      window.showToast?.('⚠️ Sin conexión — intentá más tarde');
      return;
    }
    try {
      const { doc, setDoc, collection } = window._fb;
      await setDoc(doc(collection(fbDb, 'suscriptores'), email.replace(/[.#$]/g,'_')), { email, date: new Date().toISOString() });
      window.showToast?.('✅ ¡Suscripto exitosamente!');
      input.value = '';
    } catch(e) {
      console.error(e);
      window.showToast?.('⚠️ Error al suscribir');
    }
  })();
}

// ===== INIT THEME RADIO IN ADMIN =====
export function initAdminThemeSelector() {
  const current = window.getTheme?.() || 'light';
  const theme = current === 'dark-soft' ? 'dark' : current;
  const radio = document.querySelector(`input[name="admin-theme"][value="${theme}"]`);
  if (radio) radio.checked = true;
  if (current === 'dark-soft') { window.setTheme?.('dark'); saveAppearance(); }
}

export function init() {
  applyBgColor(_currentBgColor);
  const dock = document.getElementById('admin-dock');
  if (dock && !dock._dockZoom) {
    dock._dockZoom = true;
    dock.classList.remove('dock-hidden');
    const inner = document.getElementById('admin-dock-inner');
    if (!inner) return;
    const allChildren = () => [...inner.children];
    const MAX_SCALE = 1.5;
    const MAX_DIST = 140;
    const LERP = 0.18;
    const BASE = 44, GAP = 8;
    let mouseX = -9999;
    let mouseInside = false;
    let running = true;
    allChildren().forEach(el => {
      if (el.classList.contains('dock-item')) {
        el._scale = 1;
        if (!el.hasAttribute('title')) el.title = el.dataset.section || '';
      }
    });
    dock.addEventListener('mousemove', e => {
      const r = dock.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseInside = true;
    });
    dock.addEventListener('mouseleave', () => { mouseInside = false; });
    (function tick() {
      const dr = dock.getBoundingClientRect();
      // update target scales for items only
      allChildren().forEach(el => {
        if (!el.classList.contains('dock-item')) return;
        const er = el.getBoundingClientRect();
        const cx = er.left + er.width / 2 - dr.left;
        const dist = Math.abs(mouseX - cx);
        let target = 1;
        if (mouseInside && dist < MAX_DIST) target = 1 + (1 - dist / MAX_DIST) * (MAX_SCALE - 1);
        el._scale += (target - el._scale) * LERP;
        if (Math.abs(el._scale - 1) < 0.01) el._scale = 1;
      });
      // position all children (items + dividers) from left to right
      let x = 0;
      allChildren().forEach(el => {
        if (el.classList.contains('dock-divider')) {
          el.style.position = 'absolute';
          el.style.left = x + 'px';
          el.style.top = '50%';
          el.style.marginTop = '-14px';
          x += 1 + GAP;
        } else {
          const s = el._scale || 1;
          const w = BASE * s;
          const yOff = (s - 1) * -36;
          el.style.left = x + 'px';
          el.style.transform = `translateY(${yOff}px) scale(${s})`;
          el.style.zIndex = s > 1.02 ? '2' : '';
          x += w + GAP;
        }
      });
      inner.style.width = (x - GAP) + 'px';
      if (running) requestAnimationFrame(tick);
    })();
  }
  // Drag & drop reorder (always init, outside _dockZoom guard)
  const dockInner = document.getElementById('admin-dock-inner');
  if (dockInner && !dockInner._dockDrag) {
    dockInner._dockDrag = true;
    let dragEl = null;
    function syncDraggable() {
      const enabled = window._appearanceCfg?.dockDraggable !== false;
      dockInner.querySelectorAll('.dock-item').forEach(el => el.draggable = enabled);
    }
    syncDraggable();
    // re-sync when appearance changes
    const origApply = window.applyAppearance;
    window._origApplyAppearance = origApply;
    const origSaveAppearance = window.saveAppearance;
    dockInner.querySelectorAll('.dock-item').forEach(el => {
      el.addEventListener('dragstart', e => {
        if (window._appearanceCfg?.dockDraggable === false) { e.preventDefault(); return; }
        dragEl = el;
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.4';
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '';
        dragEl = null;
        dockInner.querySelectorAll('.dock-item.drag-over').forEach(x => x.classList.remove('drag-over'));
      });
    });
    dockInner.addEventListener('dragover', e => {
      if (window._appearanceCfg?.dockDraggable === false) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.dock-item');
      if (!target || target === dragEl) return;
      dockInner.querySelectorAll('.dock-item.drag-over').forEach(x => x.classList.remove('drag-over'));
      target.classList.add('drag-over');
    });
    dockInner.addEventListener('drop', e => {
      if (window._appearanceCfg?.dockDraggable === false) return;
      e.preventDefault();
      const target = e.target.closest('.dock-item');
      if (!target || !dragEl || target === dragEl) return;
      target.classList.remove('drag-over');
      const after = e.clientX > target.getBoundingClientRect().left + target.offsetWidth / 2;
      const all = [...dockInner.querySelectorAll('.dock-item, .dock-divider')];
      const ti = all.indexOf(target), di = all.indexOf(dragEl);
      if (di === -1 || ti === -1) return;
      dockInner.insertBefore(dragEl, after && ti < all.length - 1 ? all[ti + 1] : target);
      const order = [...dockInner.querySelectorAll('.dock-item')].map(x => x.dataset.section);
      localStorage.setItem('xinco_dock_order', JSON.stringify(order));
      try { lucide?.createIcons(); } catch(_) {}
    });
    const saved = localStorage.getItem('xinco_dock_order');
    if (saved) try {
      const order = JSON.parse(saved);
      const map = {}; dockInner.querySelectorAll('.dock-item').forEach(el => { map[el.dataset.section] = el; });
      const frag = document.createDocumentFragment();
      order.forEach(k => { if (map[k]) frag.appendChild(map[k]); });
      dockInner.querySelectorAll('.dock-item').forEach(el => el.remove());
      dockInner.prepend(frag);
    } catch(_) {}
    // re-sync draggable after save
    window.syncDockDraggable = syncDraggable;
  }
  window.isAdmin = isAdmin;
  window.renderAdmin = renderAdmin;
  window.adminNav = adminNav;
  window.showAdminSection = showAdminSection;
  window.showSectionTab = showSectionTab;
  window.showProductForm = showProductForm;
  window.hideProductForm = hideProductForm;
  window.saveProduct = saveProduct;
  window.addCustomColor = addCustomColor;
  window.addProductImageUrl = addProductImageUrl;
  window.renderAdminDashboard = renderAdminDashboard;
  window.renderAdminOrders = renderAdminOrders;
  window.renderAdminProducts = renderAdminProducts;
  window.renderAdminInventory = renderAdminInventory;
  window.renderAdminCustomers = renderAdminCustomers;
  window.renderAdminCupones = renderAdminCupones;
  window.renderAdminTracking = renderAdminTracking;
  window.renderAdminReports = renderAdminReports;
  window.editOrder = editOrder;
  window.closeEditOrder = closeEditOrder;
  window.saveEditOrder = saveEditOrder;
  window.toggleOrderDetails = toggleOrderDetails;
  window.updateOrderStatus = updateOrderStatus;
  window.showProductPage = showProductPage;
  window.editProductAdmin = editProductAdmin;
  window.closeProductModal = closeProductModal;
  window.saveProductAdmin = saveProductAdmin;
  window.openNewProductModal = openNewProductModal;
  window.confirmDeleteProduct = confirmDeleteProduct;
  window.deleteProductAdmin = deleteProductAdmin;
  window.openCloudinaryUploader = openCloudinaryUploader;
  window.showUploadModal = showUploadModal;
  window.closeUploadModal = closeUploadModal;
  window.uploadFromUrl = uploadFromUrl;
  window.updateInventoryStock = updateInventoryStock;
  window.initInventoryChart = initInventoryChart;
  window.showAdminCouponTab = showAdminCouponTab;
  window.createCoupon = createCoupon;
  window.deleteCoupon = deleteCoupon;
  window.updateTrackingNumber = updateTrackingNumber;
  window.applySavedCatImages = applySavedCatImages;
  window.deleteProduct = deleteProduct;
  window.editProduct = editProductAdmin;
  window.renderProductImageSlots = renderProductImageSlots;
  window.linkImageColor = linkImageColor;
  window.handleSlotDrop = handleSlotDrop;
  window.uploadSlotImage = uploadSlotImage;
  window.getFirstImageUrl = getFirstImageUrl;
  window.removeProductImage = removeProductImage;
  window.moveProductImageFirst = moveProductImageFirst;
  window.renderColorSwatches = renderColorSwatches;
  window.toggleProductColor = toggleProductColor;
  window.renameColor = renameColor;
  window.uploadToCloudinary = uploadToCloudinary;
  window.initBannerEditor = initBannerEditor;
  window.renderAnnouncementEditorList = renderAnnouncementEditorList;
  window.addAnnouncementMsg = addAnnouncementMsg;
  window.removeAnnouncement = removeAnnouncement;
  window.moveAnnouncement = moveAnnouncement;
  window.saveAnnouncementBar = saveAnnouncementBar;
  window.previewHero = previewHero;
  window.previewHeroImg = previewHeroImg;
  window.switchHeroTab = switchHeroTab;
  window.selectAnimStyle = selectAnimStyle;
  window.applyHeroAnimStyle = applyHeroAnimStyle;
  window.selectVideoEffect = selectVideoEffect;
  window.applyHeroVideoEffect = applyHeroVideoEffect;
  window.startHeroParticles = startHeroParticles;
  window.stopHeroParticles = stopHeroParticles;
  window.applyHeroVideoToSection = applyHeroVideoToSection;
  window.showHeroVideoStatus = showHeroVideoStatus;
  window.handleHeroVideoFileDrop = handleHeroVideoFileDrop;
  window.uploadHeroVideo = uploadHeroVideo;
  window.previewHeroVideo = previewHeroVideo;
  window.clearHeroVideo = clearHeroVideo;
  window.saveHeroBanner = saveHeroBanner;
  window.previewPromo = previewPromo;
  window.savePromoBanner = savePromoBanner;
  window.renderAnnouncementBar = renderAnnouncementBar;
  window.renderHeroBanner = renderHeroBanner;
  window.renderPromoBanner = renderPromoBanner;
  window.handleHeroFileDrop = handleHeroFileDrop;
  window.uploadHeroImage = uploadHeroImage;
  window.applyHeroImg = applyHeroImg;
  window.initCobranzasSection = initCobranzasSection;
  window.saveMPConfig = saveMPConfig;
  window.saveBankConfig = saveBankConfig;
  window.saveShippingProviders = saveShippingProviders;
  window.loadShippingProviders = loadShippingProviders;
  window.switchShippingTab = switchShippingTab;
  window.toggleShippingCostField = toggleShippingCostField;
  window.initShippingProviders = initShippingProviders;
  window.renderShippingOptions = renderShippingOptions;
  window.initTrackingSection = initTrackingSection;
  window.loadTrackingOrder = loadTrackingOrder;
  window.assignTracking = assignTracking;
  window.consultarTracking = consultarTracking;
  window.renderTrackingList = renderTrackingList;
  window.initReportesSection = initReportesSection;
  window.getFilteredOrders = getFilteredOrders;
  window.statusLabel = statusLabel;
  window.statusColor = statusColor;
  window.buildReportHTML = buildReportHTML;
  window.previewReport = previewReport;
  window.printReport = printReport;
  window.initCatEditor = initCatEditor;
  window.setAdminColor = setAdminColor;
  window.setAdminBgVideo = setAdminBgVideo;
  window.uploadAdminBgVideo = uploadAdminBgVideo;
  window.selectAdminBg = selectAdminBg;
  window.fetchAdminBgList = fetchAdminBgList;
  window.renderAdminBgSelection = renderAdminBgSelection;
  window.initAppearancePanel = initAppearancePanel;
  window.saveAppearance = saveAppearance;
  window.saveAppearanceToFirebase = saveAppearanceToFirebase;
  window.applyAllChanges = applyAllChanges;
  window.saveSocialConfig = saveSocialConfig;
  window.subscribeNewsletter = subscribeNewsletter;
  window.loadSocialConfigFromFirebase = loadSocialConfigFromFirebase;
  window._adminBgColor = _currentBgColor;

  window.resetFirebaseData = async function() {
    if (!confirm('⚠️ ¿Estás seguro? Se borrarán TODOS los productos, pedidos, banners y config de Firebase.')) return;
    if (!confirm('Última chance: ¿realmente querés eliminar todo?')) return;
    const ready = await window.waitForFirebase();
    if (!ready || !window._fb || !window.fbDb) { window.showToast?.('⚠️ Sin conexión a Firebase'); return; }
    try {
      const { doc, setDoc, collection, deleteDoc } = window._fb;
      const refs = ['productos','pedidos','banners','config'].map(c => doc(window.fbDb, c, 'data'));
      await Promise.all(refs.map(r => deleteDoc(r).catch(() => {})));
      localStorage.clear();
      window.showToast?.('✅ Todos los datos eliminados');
      setTimeout(() => location.reload(), 1000);
    } catch(e) {
      window.showToast?.('⚠️ Error: ' + e.message);
    }
  };

  const cfg = loadAppearance();
  window._appearanceCfg = cfg;
  applyAppearance(cfg);
  loadSocialConfigFromFirebase();
  initAdminThemeSelector();
  window.showResetModal = function(type) {
    const modal = document.getElementById('reset-modal');
    const title = document.getElementById('reset-modal-title');
    const msg = document.getElementById('reset-modal-msg');
    const btn = document.getElementById('reset-modal-confirm');
    if (!modal) return;
    if (type === 'local') {
      title.textContent = 'RESETEAR LOCALES';
      msg.textContent = 'Se borrarán todos los datos locales (productos, pedidos, configuraciones). ¿Estás seguro?';
      btn.onclick = function() { localStorage.clear(); window.showToast?.('🗑️ Datos locales eliminados'); closeResetModal(); setTimeout(() => location.reload(), 800); };
    } else {
      title.textContent = 'RESETEAR FIREBASE';
      msg.textContent = 'Se eliminarán TODOS los datos de Firebase (productos, pedidos, banners, config). Esta acción no se puede deshacer.';
      btn.onclick = function() { closeResetModal(); resetFirebaseData(); };
    }
    modal.style.display = 'flex';
  };
  window.closeResetModal = function() {
    document.getElementById('reset-modal').style.display = 'none';
  };
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('admin-user-menu');
    if (menu && !e.target.closest('.admin-header-right')) menu.classList.add('hidden');
  });
  window.toggleUserMenu = function() {
    const menu = document.getElementById('admin-user-menu');
    if (menu) menu.classList.toggle('hidden');
  };
  try { lucide?.createIcons(); } catch(e) {}
}
