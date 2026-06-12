import { state } from './state.js';

export function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

export function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

export function goToCheckout() {
  closeCart();
  import('./router.js').then(m => m.nav('checkout'));
}

export function addToCart(productId, size, color) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  if (product.stock <= 0) { window.showToast?.('Producto sin stock '); return; }
  const key = productId + '-' + size + '-' + color;
  const existing = state.cart.find(i => i.key === key);
  const currentQty = existing ? existing.qty : 0;
  if (currentQty >= product.stock) { window.showToast?.('No hay más stock disponible '); return; }
  if (existing) { existing.qty++; }
  else { state.cart.push({key, productId, name: product.name, price: product.price, size, color, qty: 1, img: product.img}); }
  window.updateCartCount?.();
  window.persistAll?.();
  window.showToast?.('¡' + product.name + ' agregado! 🔥');
}

export function removeFromCart(key) {
  state.cart = state.cart.filter(i => i.key !== key);
  if (state.cart.every(i => i.isCoupon)) { state.cart = []; }
  window.updateCartCount?.();
  window.persistAll?.();
  renderCartDrawer();
  if (state.currentPage === 'cart') renderCartPage();
}

export function updateQty(key, delta) {
  const item = state.cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(key);
  else { window.updateCartCount?.(); window.persistAll?.(); renderCartDrawer(); if(state.currentPage==='cart') renderCartPage(); }
}

export function renderCartDrawer() {
  const el = document.getElementById('cart-items');
  const normalItems = state.cart.filter(i => !i.isCoupon);
  const couponItem = state.cart.find(i => i.isCoupon);
  if (state.cart.length === 0) {
    el.innerHTML = '<div class="text-center py-12"><span class="material-symbols-outlined text-[64px] text-outline-variant">shopping_bag</span><p class="font-label-caps text-label-caps text-on-surface-variant mt-4">TU CARRITO ESTÁ VACÍO</p><button class="btn-primary mt-6" onclick="closeCart();nav(\'catalog\')">EXPLORAR TIENDA</button></div>';
    document.getElementById('cart-subtotal').textContent = '$0';
    document.getElementById('cart-shipping').textContent = 'GRATIS';
    return;
  }
  el.innerHTML = normalItems.map(item => `
    <div class="flex gap-3 border-b-2 border-outline-variant pb-4">
      <img src="${item.img}" alt="${item.name}" loading="lazy" class="w-20 h-24 object-cover border-2 border-primary grayscale-hover shrink-0"/>
      <div class="flex-1 min-w-0">
        <div class="font-label-caps text-label-caps text-primary truncate">${window.escapeHtml(item.name)}</div>
        <div class="font-label-caps text-[10px] text-on-surface-variant mt-1">TALLE: ${window.escapeHtml(item.size)} / ${window.escapeHtml(item.color.toUpperCase())}</div>
        <div class="font-label-caps text-label-caps text-primary mt-2">${window.fmtPrice?.(item.price) || '$' + item.price}</div>
        <div class="flex items-center gap-2 mt-2">
          <button class="w-7 h-7 border-2 border-primary flex items-center justify-center font-label-caps" onclick="updateQty('${item.key}',-1)">−</button>
          <span class="font-label-caps text-label-caps w-6 text-center">${item.qty}</span>
          <button class="w-7 h-7 border-2 border-primary flex items-center justify-center font-label-caps" onclick="updateQty('${item.key}',1)">+</button>
          <button class="ml-auto text-on-surface-variant hover:text-error" onclick="removeFromCart('${item.key}')"><span class="material-symbols-outlined text-[20px]">delete</span></button>
        </div>
      </div>
    </div>
  `).join('');
  if (couponItem) {
    el.innerHTML += `
      <div class="flex items-center gap-3 py-3 border-b-2 border-outline-variant">
        <div class="w-10 h-10 border-2 border-secondary-container flex items-center justify-center bg-secondary-container/10 shrink-0">
          <span class="material-symbols-outlined text-secondary-container" style="font-size:22px;">sell</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-label-caps text-label-caps text-secondary-container truncate">${window.escapeHtml(couponItem.name)}</div>
          <div class="font-label-caps text-[11px] text-secondary-container font-bold">${window.fmtPrice?.(couponItem.price) || '$' + couponItem.price}</div>
        </div>
        <button class="text-error hover:text-error/70" onclick="removeCoupon()"><span class="material-symbols-outlined text-[20px]">delete</span></button>
      </div>`;
  }
  const sub = window.cartTotal?.() || state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const rawSub = window.cartSubtotal?.() || state.cart.filter(i => !i.isCoupon).reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cart-subtotal').textContent = window.fmtPrice?.(sub) || '$' + sub;
  document.getElementById('cart-shipping').textContent = rawSub >= 95000 ? 'GRATIS' : window.fmtPrice?.(2800) || '$2.800';
  try { window.staggerEnter?.(el, 0.06); } catch(e) {}
}

export function renderCartPage() {
  const el = document.getElementById('cart-page-items');
  const normalItems = state.cart.filter(i => !i.isCoupon);
  const couponItem = state.cart.find(i => i.isCoupon);
  if (state.cart.length === 0) {
    el.innerHTML = '<div class="text-center py-16 border-[3px] border-primary"><span class="material-symbols-outlined text-[64px] text-outline-variant">shopping_bag</span><p class="font-label-caps text-label-caps text-on-surface-variant mt-4">TU CARRITO ESTÁ VACÍO</p><button class="btn-primary mt-6" onclick="nav(\'catalog\')">IR AL CATÁLOGO</button></div>';
  } else {
    el.innerHTML = `
      <div class="border-[3px] border-primary overflow-hidden">
        <div class="bg-surface-container p-4 border-b-[3px] border-primary grid grid-cols-12 font-label-caps text-label-caps text-on-surface-variant">
          <div class="col-span-6">PRODUCTO</div><div class="col-span-2 text-center">PRECIO</div><div class="col-span-2 text-center">CANTIDAD</div><div class="col-span-2 text-right">TOTAL</div>
        </div>
        ${normalItems.map(item => `
        <div class="p-4 border-b border-outline-variant grid grid-cols-12 items-center gap-2">
          <div class="col-span-6 flex items-center gap-3">
            <img src="${item.img}" alt="${item.name}" loading="lazy" class="w-16 h-20 object-cover border-2 border-primary shrink-0 grayscale-hover"/>
            <div>
              <div class="font-label-caps text-label-caps text-primary">${window.escapeHtml(item.name)}</div>
              <div class="font-label-caps text-[10px] text-on-surface-variant mt-1">T: ${window.escapeHtml(item.size)} / ${window.escapeHtml(item.color.toUpperCase())}</div>
              <button class="font-label-caps text-[10px] text-error underline mt-1" onclick="removeFromCart('${item.key}')">ELIMINAR</button>
            </div>
          </div>
          <div class="col-span-2 text-center font-label-caps text-label-caps">${window.fmtPrice?.(item.price) || '$' + item.price}</div>
          <div class="col-span-2 flex items-center justify-center gap-2">
            <button class="w-7 h-7 border-2 border-primary flex items-center justify-center" onclick="updateQty('${item.key}',-1)">−</button>
            <span class="font-label-caps w-5 text-center">${item.qty}</span>
            <button class="w-7 h-7 border-2 border-primary flex items-center justify-center" onclick="updateQty('${item.key}',1)">+</button>
          </div>
          <div class="col-span-2 text-right font-label-caps text-label-caps text-primary">${window.fmtPrice?.(item.price * item.qty) || '$' + (item.price * item.qty)}</div>
        </div>`).join('')}
        ${couponItem ? `
        <div class="p-4 border-b border-outline-variant grid grid-cols-12 items-center gap-2 bg-secondary-container/5">
          <div class="col-span-6 flex items-center gap-3">
            <div class="w-12 h-12 border-2 border-secondary-container flex items-center justify-center bg-secondary-container/10 shrink-0">
              <span class="material-symbols-outlined text-secondary-container">sell</span>
            </div>
            <div>
              <div class="font-label-caps text-label-caps text-secondary-container">${couponItem.name}</div>
              <button class="font-label-caps text-[10px] text-error underline mt-1" onclick="removeCoupon()">QUITAR CUPÓN</button>
            </div>
          </div>
          <div class="col-span-2 text-center font-label-caps text-label-caps text-secondary-container">${window.fmtPrice?.(couponItem.price) || '$' + couponItem.price}</div>
          <div class="col-span-2"></div>
          <div class="col-span-2 text-right font-label-caps text-label-caps text-secondary-container">${window.fmtPrice?.(couponItem.price) || '$' + couponItem.price}</div>
        </div>` : ''}
      </div>`;
  }
  const sub = window.cartTotal?.() || state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const rawSub = window.cartSubtotal?.() || state.cart.filter(i => !i.isCoupon).reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cart-page-subtotal').textContent = window.fmtPrice?.(sub) || '$' + sub;
  document.getElementById('cart-page-shipping').textContent = rawSub >= 95000 ? 'GRATIS' : window.fmtPrice?.(2800) || '$2.800';
  document.getElementById('cart-page-total').textContent = window.fmtPrice?.(rawSub >= 95000 ? sub : sub + 2800) || '$' + (rawSub >= 95000 ? sub : sub + 2800);
  try { window.staggerEnter?.(el, 0.06); } catch(e) {}
}

export function init() {
  window.openCart = openCart;
  window.closeCart = closeCart;
  window.goToCheckout = goToCheckout;
  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.updateQty = updateQty;
  window.renderCartDrawer = renderCartDrawer;
  window.renderCartPage = renderCartPage;
}
