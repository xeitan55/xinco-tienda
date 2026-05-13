// =============================================
// XINCO — js/ui.js
// Componentes UI reutilizables en todas las páginas
// =============================================

import { store, addToCart, removeFromCart, updateCartQty, cartTotal, cartCount, fmtPrice } from './store.js';
import { fbLogin, fbLogout } from './firebase.js';

// =============================================
// TOAST
// =============================================
let toastTimer;
export function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// =============================================
// HEADER — announcement bar + nav
// =============================================
export function renderAnnouncementBar() {
  const el = document.getElementById('announcement-scroller');
  if (!el) return;
  const msgs = [...store.banners.announcements, ...store.banners.announcements];
  el.innerHTML = msgs.map(m =>
    `<span class="font-label-caps text-label-caps tracking-widest uppercase px-12">${m}</span>`
  ).join('');
}

export function updateAuthUI() {
  const label = document.getElementById('auth-label');
  if (!label) return;
  if (store.user) {
    label.textContent = store.user.displayName
      ? store.user.displayName.split(' ')[0].toUpperCase()
      : store.user.email.split('@')[0].toUpperCase();
  } else {
    label.textContent = 'ACCEDER';
  }
}

export function updateCartBadge() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cartCount();
}

// =============================================
// CART DRAWER
// =============================================
export function openCart() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

export function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

export function renderCartDrawer() {
  const el = document.getElementById('cart-items');
  if (!el) return;
  if (store.cart.length === 0) {
    el.innerHTML = `<div class="text-center py-12">
      <span class="material-symbols-outlined text-[64px] text-outline-variant">shopping_bag</span>
      <p class="font-label-caps text-label-caps text-on-surface-variant mt-4">TU CARRITO ESTÁ VACÍO</p>
      <a href="catalog.html" class="btn-primary mt-6 inline-flex">EXPLORAR TIENDA</a>
    </div>`;
    document.getElementById('cart-subtotal').textContent = '$0';
    return;
  }
  el.innerHTML = store.cart.map(item => `
    <div class="flex gap-3 border-b-2 border-outline-variant pb-4">
      <img src="${item.img}" class="w-20 h-24 object-cover border-2 border-primary grayscale-hover shrink-0"/>
      <div class="flex-1 min-w-0">
        <div class="font-label-caps text-label-caps text-primary truncate">${item.name}</div>
        <div class="font-label-caps text-[10px] text-on-surface-variant mt-1">T: ${item.size} / ${item.color.toUpperCase()}</div>
        <div class="font-label-caps text-label-caps text-primary mt-2">${fmtPrice(item.price)}</div>
        <div class="flex items-center gap-2 mt-2">
          <button class="w-7 h-7 border-2 border-primary flex items-center justify-center font-label-caps" onclick="window.XINCO.updateQty('${item.key}',-1)">−</button>
          <span class="font-label-caps text-label-caps w-6 text-center">${item.qty}</span>
          <button class="w-7 h-7 border-2 border-primary flex items-center justify-center font-label-caps" onclick="window.XINCO.updateQty('${item.key}',1)">+</button>
          <button class="ml-auto text-on-surface-variant hover:text-error" onclick="window.XINCO.removeItem('${item.key}')">
            <span class="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
    </div>`).join('');
  const sub = cartTotal();
  document.getElementById('cart-subtotal').textContent = fmtPrice(sub);
  document.getElementById('cart-shipping').textContent = sub >= 95000 ? 'GRATIS' : fmtPrice(2800);
}

// =============================================
// PRODUCT CARD (shared HTML snippet)
// =============================================
export function productCard(p) {
  return `
  <div class="group relative flex flex-col bg-surface border-[3px] border-primary product-card card-hover"
       onclick="location.href='product.html?id=${p.id}'">
    <div class="relative aspect-[3/4] overflow-hidden border-b-[3px] border-primary bg-surface-container">
      ${p.badge ? `<div class="absolute top-4 left-4 z-10"><span class="badge badge-violet">${p.badge}</span></div>` : ''}
      ${p.oldPrice ? `<div class="absolute top-4 right-4 z-10"><span class="badge badge-black">SALE</span></div>` : ''}
      <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover grayscale-hover transition-all duration-500"/>
      <div class="absolute bottom-0 left-0 w-full bg-primary/90 border-t-[3px] border-primary size-overlay flex">
        ${p.sizes.slice(0,4).map(s=>`
          <button class="flex-1 py-3 font-label-caps text-on-primary hover:bg-secondary-container text-[10px] border-r border-white/20 last:border-0"
            onclick="event.stopPropagation();window.XINCO.quickAdd('${p.id}','${s}','${p.colors[0]}')">${s}</button>`).join('')}
      </div>
    </div>
    <div class="p-4">
      <div class="font-label-caps text-label-caps text-primary truncate mb-1">${p.name}</div>
      <div class="flex items-center gap-2">
        <span class="font-label-caps text-[13px] text-primary">${fmtPrice(p.price)}</span>
        ${p.oldPrice ? `<span class="font-label-caps text-[11px] text-outline line-through">${fmtPrice(p.oldPrice)}</span>` : ''}
      </div>
    </div>
  </div>`;
}

// =============================================
// SEARCH OVERLAY
// =============================================
export function openSearch() {
  document.getElementById('search-overlay')?.classList.add('open');
  setTimeout(() => document.getElementById('search-input')?.focus(), 150);
}

export function closeSearch() {
  document.getElementById('search-overlay')?.classList.remove('open');
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  const res = document.getElementById('search-results');
  if (res) res.innerHTML = '';
}

export function handleSearch(q) {
  const el = document.getElementById('search-results');
  const clearBtn = document.getElementById('search-clear');
  const suggestions = document.getElementById('search-suggestions');
  const emptyEl = document.getElementById('search-empty');
  if (clearBtn) clearBtn.classList.toggle('hidden', !q.trim());
  if (suggestions) suggestions.classList.toggle('hidden', !!q.trim());
  if (!q.trim()) { if (el) el.innerHTML = ''; return; }
  const results = store.products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.cat.toLowerCase().includes(q.toLowerCase()) ||
    (p.badge && p.badge.toLowerCase().includes(q.toLowerCase())) ||
    p.sku.toLowerCase().includes(q.toLowerCase())
  );
  if (!el) return;
  if (results.length === 0) {
    el.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  el.innerHTML = results.map(p => `
    <div class="result-card cursor-pointer overflow-hidden" onclick="location.href='product.html?id=${p.id}';closeSearch()">
      <div class="aspect-[3/4] overflow-hidden border-b-2 border-black/10 relative">
        <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover grayscale-hover"/>
        ${p.badge ? `<span class="absolute top-2 left-2 badge badge-violet text-[9px]">${p.badge}</span>` : ''}
      </div>
      <div class="p-3">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.08em;font-weight:700;color:#000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#5d22ff;margin-top:4px;">${fmtPrice(p.price)}</div>
      </div>
    </div>`).join('');
}

// =============================================
// MOBILE MENU
// =============================================
export function openMobileMenu() {
  document.getElementById('mobile-menu')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
export function closeMobileMenu() {
  document.getElementById('mobile-menu')?.classList.remove('open');
  document.body.style.overflow = '';
}

// =============================================
// SIZE GUIDE MODAL
// =============================================
export function showSizeGuide() {
  document.getElementById('size-guide-modal')?.classList.add('open');
}
export function closeSizeGuide() {
  document.getElementById('size-guide-modal')?.classList.remove('open');
}

// =============================================
// GLOBAL XINCO namespace — accesible desde HTML
// =============================================
export function registerGlobals(extras = {}) {
  window.XINCO = {
    removeItem: (key) => { removeFromCart(key); renderCartDrawer(); updateCartBadge(); },
    updateQty: (key, delta) => { updateCartQty(key, delta); renderCartDrawer(); updateCartBadge(); },
    quickAdd: (id, size, color) => {
      const p = store.products.find(pr => pr.id === id);
      if (p) { addToCart(p, size, color); updateCartBadge(); showToast('¡' + p.name + ' agregado! 🔥'); openCart(); }
    },
    openCart, closeCart, openSearch, closeSearch,
    handleSearch, openMobileMenu, closeMobileMenu,
    showSizeGuide, closeSizeGuide,
    showToast,
    ...extras
  };

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); closeSizeGuide(); closeCart(); closeMobileMenu(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  });
}
