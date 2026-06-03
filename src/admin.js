import { state, fbDb } from './firebase.js';
import { bannerState, PRODUCTS, CUSTOMERS } from './state.js';

let _catImages = {};

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
  renderAdminCatEditor();
}

export function adminNav(section) {
  state.adminSection = section;
  document.querySelectorAll('.admin-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });
  const views = ['dashboard','orders','products','inventory','customers','coupons','tracking','reports','cateditor','cobranzas'];
  views.forEach(v => {
    const el = document.getElementById('admin-' + v);
    if (el) el.style.display = v === section ? '' : 'none';
  });
  if (section === 'inventory') initInventoryChart();
  if (section === 'cobranzas') window.initCobranzasSection?.();
  if (section === 'coupons') showAdminCouponTab?.('active');
}

export function showAdminSection(section) {
  const allSections = ['dashboard','orders','products','inventory','customers','banners','categorias','cupones','tracking','reportes','cobranzas'];
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
  document.querySelectorAll('.admin-nav-item').forEach(b => {
    const s = b.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    b.classList.toggle('active', s === section);
  });
  document.querySelectorAll('.dock-item').forEach(b => {
    const s = b.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    b.classList.toggle('active', s === section);
  });
  const titles = { dashboard:'TABLERO', orders:'PEDIDOS', products:'PRODUCTOS', inventory:'INVENTARIO',
    customers:'CLIENTES', cupones:'CUPONES', banners:'BANNERS', categorias:'CATEGORÍAS',
    tracking:'ENVÍOS', reportes:'REPORTES', cobranzas:'COBRANZAS' };
  const title = document.getElementById('admin-section-title');
  if (title) title.textContent = titles[section] || section.toUpperCase();
  if (section === 'inventory') initInventoryChart();
  if (section === 'cobranzas') window.initCobranzasSection?.();
  if (section === 'cupones') showAdminCouponTab?.('active');
}

export function renderAdminDashboard() {
  const total = state.orders.reduce((s,o) => s + o.total, 0);
  const totalProd = state.products.length;
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;
  const totalClients = CUSTOMERS.length;
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
  state.products = state.products.filter(p => p.id !== id);
  const PRODS = state.products;
  window.renderAdminProducts?.();
  const { fbDeleteProductRemote } = await import('./firebase.js');
  fbDeleteProductRemote(id).catch(e => console.error(e));
  window.showToast?.('✅ Producto eliminado');
}

export function editProductAdmin(id) {
  const p = state.products.find(prod => prod.id === id);
  if (!p) return;
  const map = { 'pf-name':'name', 'pf-price':'price', 'pf-cat':'cat', 'pf-stock':'stock',
    'pf-old-price':'oldPrice', 'pf-badge':'badge', 'pf-desc':'desc' };
  Object.entries(map).forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    if (el) el.value = p[key] ?? '';
  });
  const pfId = document.getElementById('pf-id');
  if (pfId) pfId.value = id;
  const form = document.getElementById('product-form-container');
  if (form) form.classList.remove('hidden');
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
  const el = document.getElementById('product-form-container');
  if (el) el.classList.toggle('hidden');
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

export function saveProduct() {
  const data = {
    name: document.getElementById('pf-name')?.value?.trim(),
    price: parseFloat(document.getElementById('pf-price')?.value) || 0,
    cat: document.getElementById('pf-cat')?.value,
    stock: parseInt(document.getElementById('pf-stock')?.value) || 0,
    oldPrice: parseFloat(document.getElementById('pf-old-price')?.value) || null,
    badge: document.getElementById('pf-badge')?.value?.trim() || null,
    desc: document.getElementById('pf-desc')?.value?.trim(),
    img: document.getElementById('pf-img')?.value?.trim() || '',
  };
  if (!data.name || !data.cat || !data.price) { window.showToast?.('Nombre, categoría y precio son obligatorios ❌'); return; }
  const editId = document.getElementById('pf-id')?.value;
  if (editId) {
    const idx = state.products.findIndex(p => p.id === parseInt(editId));
    if (idx >= 0) { data.id = parseInt(editId); state.products[idx] = data; }
  } else {
    const maxId = state.products.reduce((m, p) => Math.max(m, p.id), 0);
    data.id = maxId + 1;
    state.products.push(data);
  }
  hideProductForm();
  renderAdminProducts();
  window.showToast?.('✅ Producto guardado');
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
  const colors = ['#5d22ff','#003ecf','#2d5f2e','#031b46','#b3261e','#333333','#5d22ff','#003ecf','#2d5f2e','#031b46'];
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
export function renderAdminCustomers() {
  const container = document.getElementById('admin-customers-table');
  if (!container) return;
  container.innerHTML = `<table class="w-full text-left">
    <thead><tr class="border-b-2 border-outline-variant font-label-caps text-[10px] text-on-surface-variant/60">
      <th class="py-3 px-4">#</th><th class="py-3 px-4">NOMBRE</th><th class="py-3 px-4">EMAIL</th><th class="py-3 px-4">PEDIDOS</th><th class="py-3 px-4">TOTAL</th><th class="py-3 px-4">FECHA</th>
    </tr></thead><tbody>
    ${CUSTOMERS.map(c => `
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
    discount: type === 'percentage' ? disc : disc,
    discountAmount: type === 'fixed' ? disc : 0,
    discountPercent: type === 'percentage' ? disc : 0,
    minPurchase: min, maxUses, expiration: exp, enabled: true, used: 0,
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
  if (activeEl) {
    const active = state.coupons.filter(c => new Date(c.expiration) > now && c.enabled !== false);
    const usedCoupons = state.coupons.filter(c => c.used > 0);
    activeEl.innerHTML = [
      ...(usedCoupons.length ? [`
      <div class="p-4 bg-surface-container-low border-2 border-outline-variant mb-4">
        <h3 class="font-label-caps text-label-caps text-primary mb-3">CUPONES USADOS (${usedCoupons.length})</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${usedCoupons.map(c => `
            <div class="bg-surface border-2 border-outline-variant p-4 opacity-60">
              <div class="flex justify-between items-center">
                <span class="font-label-caps text-[14px] tracking-wider text-primary">${c.code}</span>
                <span class="badge badge-outline text-[9px]">USADO x${c.used}</span>
              </div>
              <div class="font-body-md text-sm mt-1">${c.discountPercent ? c.discountPercent + '% OFF' : c.discountAmount ? window.fmtPrice?.(c.discountAmount) : ''}
                ${c.minPurchase > 0 ? ' / mín $' + c.minPurchase : ''}</div>
              <div class="font-label-caps text-[9px] text-on-surface-variant mt-2">Exp: ${c.expiration}</div>
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
            <div class="font-body-md text-sm mt-1">${c.discountPercent ? c.discountPercent + '% OFF' : c.discountAmount ? window.fmtPrice?.(c.discountAmount) : ''}
              ${c.minPurchase > 0 ? ' / mín ' + window.fmtPrice?.(c.minPurchase) : ''}</div>
            <div class="font-label-caps text-[9px] text-on-surface-variant mt-1">Exp: ${c.expiration} | Usos: ${c.used || 0}${c.maxUses ? '/' + c.maxUses : ''}</div>
            <button onclick="navigator.clipboard.writeText('${c.code}').then(()=>showToast?.('✅ Código copiado'))" class="btn-violet w-full mt-3 py-2 text-[9px]">COPIAR CÓDIGO</button>
          </div>`).join('')}
      </div>` : '<div class="text-on-surface-variant font-body-md text-sm p-8 text-center">No hay cupones activos</div>'),
    ].join('');
  }
  if (expiredEl) {
    const expired = state.coupons.filter(c => new Date(c.expiration) <= now);
    expiredEl.innerHTML = expired.length
      ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${expired.map(c => `
          <div class="bg-surface border-2 border-outline-variant p-4 opacity-50">
            <div class="font-label-caps text-[14px] tracking-wider text-primary">${c.code}</div>
            <div class="font-body-md text-sm mt-1">${c.discountPercent ? c.discountPercent + '% OFF' : c.discountAmount ? window.fmtPrice?.(c.discountAmount) : ''}</div>
            <div class="font-label-caps text-[9px] text-on-surface-variant mt-2">Expiró: ${c.expiration}</div>
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

// Category Editor
export function applySavedCatImages() {
  const saved = bannerState.categories;
  if (!saved) return;
  Object.entries(saved).forEach(([cat, data]) => {
    _catImages[cat] = data.img || '';
    const imgEl = document.getElementById(`cat-img-${cat}`);
    if (imgEl && data.img) imgEl.src = data.img;
  });
}

export function renderAdminCatEditor() {
  const cats = ['remeras','pantalones','buzos','camperas','accesorios'];
  const container = document.getElementById('admin-cat-editor');
  if (!container) return;
  container.innerHTML = cats.map(cat => {
    const data = bannerState.categories?.[cat] || {};
    return `
      <div class="bg-surface-container-low border-2 border-outline-variant p-6">
        <h3 class="font-label-caps text-label-caps text-primary uppercase mb-4">${cat}</h3>
        <div class="flex flex-col md:flex-row gap-6">
          <div class="flex-1">
            <label class="font-label-caps text-[10px] text-on-surface-variant block mb-2">IMAGEN URL</label>
            <div class="flex gap-3">
              <input type="text" id="cat-img-input-${cat}" value="${data.img || ''}" class="flex-1 px-4 py-3 bg-surface border-2 border-outline-variant text-on-surface font-body-md text-sm" placeholder="https://..."/>
              <button onclick="showUploadModal('cat-img-input-${cat}')" class="btn-violet px-4 py-2 text-[10px] shrink-0"><span class="material-symbols-outlined text-[14px]">cloud_upload</span></button>
            </div>
          </div>
          <div class="w-32">
            <img id="cat-preview-${cat}" src="${data.img || 'https://placehold.co/150x200/1c1c1c/5d22ff?text=+'}" alt="${cat}" class="w-full h-32 object-cover border-2 border-primary"/>
          </div>
        </div>
        <div class="flex gap-4 mt-4">
          <div class="flex-1">
            <label class="font-label-caps text-[10px] text-on-surface-variant block mb-2">TÍTULO</label>
            <input type="text" id="cat-title-${cat}" value="${data.title || ''}" class="w-full px-4 py-3 bg-surface border-2 border-outline-variant text-on-surface font-body-md text-sm" placeholder="Título de la categoría"/>
          </div>
          <div class="flex-1">
            <label class="font-label-caps text-[10px] text-on-surface-variant block mb-2">SUBTÍTULO</label>
            <input type="text" id="cat-subtitle-${cat}" value="${data.subtitle || ''}" class="w-full px-4 py-3 bg-surface border-2 border-outline-variant text-on-surface font-body-md text-sm" placeholder="Subtítulo"/>
          </div>
        </div>
        <button onclick="saveCatImage('${cat}')" class="btn-violet mt-4 px-6 py-3 text-[10px]">GUARDAR CATEGORÍA</button>
      </div>`;
  }).join('');
}

export async function saveCatImage(cat) {
  const img = document.getElementById('cat-img-input-' + cat)?.value.trim() || '';
  const title = document.getElementById('cat-title-' + cat)?.value.trim() || '';
  const subtitle = document.getElementById('cat-subtitle-' + cat)?.value.trim() || '';
  if (!bannerState.categories) bannerState.categories = {};
  bannerState.categories[cat] = { img, title, subtitle };
  _catImages[cat] = img;
  const preview = document.getElementById('cat-preview-' + cat);
  if (preview && img) preview.src = img;
  const { fbSaveBannersRemote } = await import('./firebase.js');
  try {
    await fbSaveBannersRemote({ categories: bannerState.categories });
    window.showToast?.(`✅ Categoría ${cat} guardada`);
  } catch(e) {
    window.showToast?.('⚠️ Error al guardar en Firebase');
  }
}

export function init() {
  window.isAdmin = isAdmin;
  window.renderAdmin = renderAdmin;
  window.adminNav = adminNav;
  window.showAdminSection = showAdminSection;
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
  window.renderAdminCatEditor = renderAdminCatEditor;
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
  window.saveCatImage = saveCatImage;
  try { lucide?.createIcons(); } catch(e) {}
}
