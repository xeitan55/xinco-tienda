import { state } from './firebase.js';
import { AVAILABLE_COLORS } from './state.js';
import { isAdmin } from './admin.js';

export function extractImgUrl(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (entry.url) return entry.url;
  return '';
}

function _getSeenReviews() {
  try { return JSON.parse(localStorage.getItem('xinco_admin_review_seen') || '[]'); } catch(e) { return []; }
}
function _markSeen(productId) {
  const seen = _getSeenReviews();
  const sid = String(productId);
  if (!seen.includes(sid)) { seen.push(sid); localStorage.setItem('xinco_admin_review_seen', JSON.stringify(seen)); }
}

export function renderProductCard(p, small=false) {
  const rawImg = p.img || (p.images && p.images[0]) || '';
  const img = extractImgUrl(rawImg);
  const colors = p.colors || [];
  const colorDots = colors.slice(0,5).map(cid => {
    const c = AVAILABLE_COLORS.find(ac=>ac.id===cid);
    const hex = c ? c.hex : '#888';
    const border = cid==='blanco'||cid==='beige'||cid==='amarillo' ? 'border:1px solid #ccc;' : '';
    return `<div style="width:12px;height:12px;border-radius:50%;background:${hex};${border}" title="${c?c.label:cid}"></div>`;
  }).join('');
  const isAdminUser = isAdmin();
  const seenIds = _getSeenReviews();
  const showReviewBadge = isAdminUser && p.reviews > 0 && !seenIds.includes(String(p.id));
  return `
    <div class="group relative flex flex-col bg-surface border border-outline-variant product-card card-hover" onclick="openProduct('${p.id}')">
      <div class="relative aspect-[4/5] overflow-hidden border-b border-outline-variant bg-surface-container">
        ${p.badge ? `<div class="absolute top-3 left-3 z-10"><span class="badge badge-violet text-[9px]">${p.badge}</span></div>` : ''}
        ${p.oldPrice && p.badge !== 'SALE' ? `<div class="absolute top-3 right-3 z-10"><span class="badge badge-black text-[9px]">SALE</span></div>` : ''}
        ${showReviewBadge ? `<div class="absolute bottom-2 right-2 z-20 flex items-center justify-center rounded-full" style="width:26px;height:26px;background:var(--admin-accent,#5d22ff);color:#fff;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${p.reviews}</div>` : ''}
        <img src="${img}" alt="${p.name}" loading="lazy" class="w-full h-full object-cover product-thumb-img transition-all duration-700"/>
        <div class="absolute bottom-0 left-0 w-full bg-surface/90 backdrop-blur-sm border-t border-outline-variant size-overlay flex">
          ${(p.sizes||['S','M','L','XL']).slice(0,4).map(s=>`<button class="flex-1 py-2.5 font-label-caps text-on-surface hover:bg-accent-color hover:text-white text-[10px] font-bold border-r border-outline-variant/30 last:border-0 transition-colors duration-200" onclick="event.stopPropagation();quickAddToCart('${p.id}','${s}','${colors[0]||'negro'}')">${s}</button>`).join('')}
        </div>
      </div>
      <div class="p-3">
        <div class="font-label-caps text-label-caps text-on-surface truncate mb-1 text-[11px] product-name transition-colors duration-300">${p.name}</div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-label-caps text-[12px] text-on-surface font-bold">${window.fmtPrice?.(p.price) || '$' + p.price}</span>
            ${p.oldPrice ? `<span class="font-label-caps text-[10px] text-outline line-through">${window.fmtPrice?.(p.oldPrice) || '$' + p.oldPrice}</span>` : ''}
          </div>
          ${colorDots ? `<div class="flex gap-1 items-center">${colorDots}</div>` : ''}
        </div>
      </div>
    </div>`;
}

export function renderHomeProducts() {
  const el = document.getElementById('home-products');
  if (!el) return;
  const products = state.products.filter(p => p.tags.includes('newdrops') || p.badge).slice(0,4);
  el.innerHTML = products.map(p => renderProductCard(p)).join('');
  try { window.staggerEnter?.(el); } catch(e) {}
}

export function renderCatalog() {
  let filtered = [...state.products];

  const checkedCats = Array.from(document.querySelectorAll('.filter-cat:checked')).map(c => c.value);
  const hasAll = checkedCats.includes('all');
  const cats = checkedCats.filter(v => v !== 'all');
  if (!hasAll && cats.length > 0) filtered = filtered.filter(p => cats.includes(p.cat));

  if (state._tagFilter) filtered = filtered.filter(p => p.tags.includes(state._tagFilter));

  const sizes = Array.from(document.querySelectorAll('.filter-size.selected')).map(b => b.dataset.size);
  if (sizes.length > 0) filtered = filtered.filter(p => sizes.some(s => (p.sizes||[]).includes(s)));

  const colors = Array.from(document.querySelectorAll('.filter-color.selected')).map(b => b.dataset.color);
  if (colors.length > 0) filtered = filtered.filter(p => colors.some(c => (p.colors||[]).includes(c)));

  const priceEl = document.getElementById('price-range');
  const maxPrice = priceEl ? parseInt(priceEl.value) : 200000;
  filtered = filtered.filter(p => p.price <= maxPrice);

  const sortEl = document.getElementById('sort-select');
  const sort = sortEl ? sortEl.value : 'default';
  if (sort === 'price-asc') filtered.sort((a,b) => a.price - b.price);
  else if (sort === 'price-desc') filtered.sort((a,b) => b.price - a.price);
  else if (sort === 'newest') filtered.sort((a,b) => (b.tags?.includes('newdrops')?1:0) - (a.tags?.includes('newdrops')?1:0));

  const grid = document.getElementById('catalog-grid');
  const empty = document.getElementById('catalog-empty');
  const count1 = document.getElementById('catalog-count');
  const count2 = document.getElementById('catalog-count-2');
  const countStr = `${filtered.length} ITEM${filtered.length !== 1 ? 'S' : ''}`;
  if (count1) count1.textContent = countStr;
  if (count2) count2.textContent = countStr;
  if (filtered.length === 0) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
  } else {
    if (empty) empty.classList.add('hidden');
    if (grid) grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
    try { window.staggerEnter?.(grid); } catch(e) {}
  }
}

export function renderAccessories() {
  let filtered = state.products.filter(p => p.cat === 'accesorios');

  const sortEl = document.getElementById('accesorios-sort');
  const sort = sortEl ? sortEl.value : 'default';
  if (sort === 'price-asc') filtered.sort((a,b) => a.price - b.price);
  else if (sort === 'price-desc') filtered.sort((a,b) => b.price - a.price);
  else if (sort === 'newest') filtered.sort((a,b) => (b.tags?.includes('newdrops')?1:0) - (a.tags?.includes('newdrops')?1:0));

  const grid = document.getElementById('accesorios-grid');
  const empty = document.getElementById('accesorios-empty');
  const count1 = document.getElementById('accesorios-count');
  const count2 = document.getElementById('accesorios-count-2');
  const countStr = `${filtered.length} ITEM${filtered.length !== 1 ? 'S' : ''}`;
  if (count1) count1.textContent = countStr;
  if (count2) count2.textContent = countStr;
  if (filtered.length === 0) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
  } else {
    if (empty) empty.classList.add('hidden');
    if (grid) grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
    try { window.staggerEnter?.(grid); } catch(e) {}
  }
}

export async function openProduct(id) {
  const { loadReviews } = await import('./reviews.js');
  const p = state.products.find(pr => String(pr.id) === String(id));
  if (!p) return;

  const overlay = document.getElementById('product-overlay');
  const isAlreadyOpen = overlay?.classList.contains('open');
  if (isAlreadyOpen) {
    const content = document.getElementById('product-content');
    if (content) {
      content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      content.style.opacity = '0';
      content.style.transform = 'translateY(8px)';
      await new Promise(r => setTimeout(r, 200));
    }
  }

  state.currentProduct = p;
  state.selectedSize = null;
  state.selectedColor = (p.colors && p.colors[0]) || 'negro';

  const rawImages = p.images && p.images.length > 0 ? p.images : (p.img ? [p.img] : []);
  const images = rawImages.map(img => {
    if (typeof img === 'string') return { url: img, colorId: '' };
    if (img && img.url) return img;
    return { url: extractImgUrl(img), colorId: '' };
  }).filter(im => im.url);
  if (images.length === 0 && p.img) images.push({ url: extractImgUrl(p.img), colorId: '' });

  const defaultImg = images.find(im => im.colorId === state.selectedColor)?.url || images[0]?.url || extractImgUrl(p.img) || '';

  document.getElementById('product-breadcrumb').textContent = p.name;
  document.getElementById('product-main-img').src = defaultImg;
  document.getElementById('product-main-img').alt = p.name;
  const badge = document.getElementById('product-badge');
  if (badge) { badge.textContent = p.badge||''; badge.style.display = p.badge ? '' : 'none'; }
  document.getElementById('product-name').textContent = p.name;
  document.getElementById('product-price').textContent = window.fmtPrice?.(p.price) || '$' + p.price;
  document.getElementById('product-old-price').textContent = p.oldPrice ? (window.fmtPrice?.(p.oldPrice) || '$' + p.oldPrice) : '';
  document.getElementById('product-desc').textContent = p.desc||'';
  document.getElementById('product-sku').textContent = p.sku||'';
  document.getElementById('product-cat').textContent = p.cat||'';
  document.getElementById('product-stock').textContent = p.stock > 20 ? 'DISPONIBLE' : p.stock > 0 ? `ÚLTIMAS ${p.stock} UNIDADES` : 'SIN STOCK';
  document.getElementById('product-reviews').textContent = `(${p.reviews||0} reseñas)`;

  const starsEl = document.getElementById('product-stars');
  if (starsEl) starsEl.innerHTML = Array.from({length:5},(_,i) =>
    `<span class="${i < Math.round(p.rating||0) ? 'star' : 'star empty'}">★</span>`).join('');

  document.getElementById('product-thumbs').innerHTML = images.slice(0,4).map((img, i) => {
    const colorObj = AVAILABLE_COLORS.find(c => c.id === img.colorId);
    const colorLabel = colorObj ? colorObj.label : '';
    const isActive = img.url === defaultImg;
    return `<div class="aspect-square bg-surface-container border-2 ${isActive ? 'border-secondary-container ring-2 ring-secondary-container' : 'border-primary'} overflow-hidden cursor-pointer hover:border-secondary-container relative transition-all"
      onclick="swapProductImage('${img.url}', this)">
      <img src="${img.url}" class="w-full h-full object-cover"/>
      ${colorLabel ? `<div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white font-label-caps text-[8px] text-center py-0.5">${colorLabel}</div>` : ''}
    </div>`;
  }).join('');

  const colors = p.colors || [];
  document.getElementById('color-selector').innerHTML = colors.map(cid => {
    const obj = AVAILABLE_COLORS.find(ac => ac.id === cid);
    const hex = obj ? obj.hex : '#888';
    const lbl = obj ? obj.label : cid.toUpperCase();
    const border = ['blanco','beige','amarillo'].includes(cid) ? 'border-color:#ccc;' : '';
    const selected = state.selectedColor === cid;
    const hasImg = images.some(im => im.colorId === cid);
    return `<div class="flex flex-col items-center gap-1 relative">
      <button class="color-swatch ${selected?'selected':''}" style="background:${hex};${border}" onclick="selectColor('${cid}')" title="${lbl}">
        ${selected ? `<span style="color:${['blanco','beige','amarillo'].includes(cid)?'#000':'#fff'};font-size:14px;">✓</span>` : ''}
      </button>
      ${hasImg ? `<span style="position:absolute;top:-3px;right:-3px;width:9px;height:9px;background:var(--admin-accent,#5d22ff);border-radius:50%;border:1px solid #fff;" title="Tiene foto"></span>` : ''}
      <span class="font-label-caps text-[9px] text-on-surface-variant">${lbl}</span>
    </div>`;
  }).join('');
  const labelEl = document.getElementById('selected-color-label');
  if (labelEl) labelEl.textContent = (AVAILABLE_COLORS.find(c=>c.id===state.selectedColor)?.label || state.selectedColor).toUpperCase();

  document.getElementById('size-selector').innerHTML = (p.sizes||['S','M','L','XL']).map(s => `
    <button class="size-btn" onclick="selectSize('${s}')">${s}</button>`).join('');

  let related = state.products.filter(pr => String(pr.id) !== String(p.id) && pr.cat === p.cat);
  if (related.length === 0) {
    related = state.products.filter(pr => String(pr.id) !== String(p.id)).slice(0,4);
  } else {
    related = related.slice(0,4);
  }
  document.getElementById('related-products').innerHTML = related.map(r => renderProductCard(r)).join('');

  if (isAlreadyOpen) {
    const content = document.getElementById('product-content');
    if (content) {
      requestAnimationFrame(() => {
        content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      });
    }
  } else {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  setTimeout(() => { try { initProductZoom(); } catch(e) {} }, 50);
  setTimeout(() => { try { loadReviews(p.id); } catch(e) {} }, 100);

  if (isAdmin() && p.reviews > 0) {
    setTimeout(() => {
      const revSection = document.getElementById('reviews-section');
      if (revSection) revSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  }

  // Update URL to product slug
  const { slugify } = await import('./router.js');
  const slug = slugify(p.name);
  if (!_preProductPage) _preProductPage = state.currentPage;
  history.replaceState({ page: 'product', productId: p.id }, '', '/producto/' + slug);
}

let _preProductPage = null;

export function clearPreProductPage() {
  _preProductPage = null;
}

export function closeProductOverlay() {
  const p = state.currentProduct;
  if (p && isAdmin() && p.reviews > 0) {
    _markSeen(p.id);
    if (state.currentPage === 'catalog') { try { renderCatalog(); } catch(e) {} }
    else if (state.currentPage === 'accesorios') { try { renderAccessories(); } catch(e) {} }
  }
  document.getElementById('product-overlay').classList.remove('open');
  document.body.style.overflow = '';
  const page = _preProductPage || 'home';
  _preProductPage = null;
  const SLUG_MAP = { home:'/', catalog:'/catalogo', cart:'/carrito', checkout:'/checkout', login:'/login', register:'/registro', account:'/cuenta', admin:'/admin', 'order-confirm':'/confirmacion' };
  history.replaceState({ page }, '', SLUG_MAP[page] || '/' + page);
  import('./router.js').then(m => m.nav(page, { replace: true }));
}

export function swapProductImage(url, thumbEl) {
  const mainImg = document.getElementById('product-main-img');
  if (mainImg) mainImg.src = url;
  const lens = document.getElementById('zoom-lens');
  if (lens) lens.style.backgroundImage = `url('${url}')`;
  if (thumbEl && thumbEl.parentNode) {
    thumbEl.parentNode.querySelectorAll('div').forEach(d => {
      d.classList.remove('border-secondary-container','ring-2','ring-secondary-container');
      d.classList.add('border-primary');
    });
    thumbEl.classList.remove('border-primary');
    thumbEl.classList.add('border-secondary-container','ring-2','ring-secondary-container');
  }
}

export function initProductZoom() {
  const container = document.getElementById('product-img-container');
  const lens = document.getElementById('zoom-lens');
  const img = document.getElementById('product-main-img');
  if (!container || !lens || !img) return;
  const zoom = 2.5;
  const lensSize = 200;
  lens.style.width = lensSize + 'px';
  lens.style.height = lensSize + 'px';
  lens.style.backgroundRepeat = 'no-repeat';
  lens.style.transition = 'opacity 0.15s ease';
  lens.style.opacity = '0';
  container.onmouseenter = function() {
    lens.style.display = 'block';
    lens.style.backgroundImage = `url('${img.src}')`;
    const rect = container.getBoundingClientRect();
    lens.style.backgroundSize = (rect.width * zoom) + 'px ' + (rect.height * zoom) + 'px';
    requestAnimationFrame(() => { lens.style.opacity = '1'; });
  };
  container.onmousemove = function(e) {
    if (lens.style.display !== 'block') return;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) return;
    const xPct = (mx / rect.width) * 100;
    const yPct = (my / rect.height) * 100;
    const lx = Math.max(0, Math.min(rect.width - lensSize, mx - lensSize / 2));
    const ly = Math.max(0, Math.min(rect.height - lensSize, my - lensSize / 2));
    lens.style.left = lx + 'px';
    lens.style.top = ly + 'px';
    lens.style.backgroundPosition = `${xPct.toFixed(1)}% ${yPct.toFixed(1)}%`;
  };
  container.onmouseleave = function() {
    lens.style.opacity = '0';
    setTimeout(() => { lens.style.display = 'none'; }, 150);
  };
}

export function selectSize(s) {
  state.selectedSize = s;
  document.getElementById('selected-size-label').textContent = s;
  document.querySelectorAll('#size-selector .size-btn').forEach(b => {
    if (b.textContent === s) b.classList.add('selected');
    else b.classList.remove('selected');
  });
}

export function selectColor(c) {
  state.selectedColor = c;
  const colorObj = AVAILABLE_COLORS.find(ac => ac.id === c);
  const label = colorObj ? colorObj.label : c.toUpperCase();
  const el = document.getElementById('selected-color-label');
  if (el) el.textContent = label;

  const p = state.currentProduct;
  if (p) {
    const images = p.images || (p.img ? [{ url: p.img, colorId: '' }] : []);
    const colorImg = images.find(img => {
      const entry = typeof img === 'string' ? { url: img, colorId: '' } : img;
      return entry.colorId === c;
    });
    const mainImg = document.getElementById('product-main-img');
    if (colorImg && mainImg) {
      const url = typeof colorImg === 'string' ? colorImg : colorImg.url;
      mainImg.src = url;
      document.querySelectorAll('#product-thumbs > div').forEach((div, i) => {
        const thumbImg = images[i];
        const thumbUrl = thumbImg ? (typeof thumbImg === 'string' ? thumbImg : thumbImg.url) : '';
        div.classList.toggle('ring-2', thumbUrl === url);
        div.classList.toggle('ring-secondary-container', thumbUrl === url);
      });
    }
    const colors = p.colors || [];
    document.getElementById('color-selector').innerHTML = colors.map(cid => {
      const obj = AVAILABLE_COLORS.find(ac => ac.id === cid);
      const hex = obj ? obj.hex : '#888';
      const lbl = obj ? obj.label : cid.toUpperCase();
      const border = ['blanco','beige','amarillo'].includes(cid) ? 'border-color:#ccc;' : '';
      const selected = cid === c;
      const hasImg = images.some(img => {
        const e = typeof img === 'string' ? { colorId: '' } : img;
        return e.colorId === cid;
      });
      return `<div class="flex flex-col items-center gap-1 relative">
        <button class="color-swatch ${selected?'selected':''}" style="background:${hex};${border}" onclick="selectColor('${cid}')" title="${lbl}">
          ${selected?`<span style="color:${['blanco','beige','amarillo'].includes(cid)?'#000':'#fff'};font-size:14px;">✓</span>`:''}
        </button>
        ${hasImg ? '<span style="position:absolute;bottom:-4px;right:-2px;width:8px;height:8px;background:var(--admin-accent,#5d22ff);border-radius:50%;border:1px solid #fff;" title="Tiene foto"></span>' : ''}
        <span class="font-label-caps text-[9px] text-on-surface-variant">${lbl}</span>
      </div>`;
    }).join('');
  }
}

export async function addSelectedToCart() {
  const p = state.currentProduct;
  if (!p) return;
  if (!state.selectedSize) { window.showToast?.('¡Seleccioná un talle primero! 📏'); return; }
  const { addToCart } = await import('./cart.js');
  addToCart(p.id, state.selectedSize, state.selectedColor || (p.colors && p.colors[0]) || 'negro');
}

export async function quickAddToCart(id, size, color) {
  const { addToCart } = await import('./cart.js');
  addToCart(id, size, color);
}

export function renderExclusiveProducts() {
  const el = document.getElementById('exclusive-products');
  const section = document.getElementById('exclusive-section');
  if (!el || !section) return;
  const products = state.products.filter(p => p.exclusive).slice(0,4);
  if (products.length === 0) { section.style.display = 'none'; return; }
  section.style.display = '';
  el.innerHTML = products.map(p => renderProductCard(p)).join('');
  try { window.staggerEnter?.(el); } catch(e) {}
}

export function init() {
  window.renderProductCard = renderProductCard;
  window.renderHomeProducts = renderHomeProducts;
  window.renderExclusiveProducts = renderExclusiveProducts;
  window.renderCatalog = renderCatalog;
  window.renderAccessories = renderAccessories;
  window.openProduct = openProduct;
  window.closeProductOverlay = closeProductOverlay;
  window.swapProductImage = swapProductImage;
  window.selectSize = selectSize;
  window.selectColor = selectColor;
  window.addSelectedToCart = addSelectedToCart;
  window.quickAddToCart = quickAddToCart;
  window.extractImgUrl = extractImgUrl;
}
