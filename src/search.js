import { state } from './state.js';

let _searchOpening = false;
let searchDebounce = null;
let typewriterTimer = null;

export function openSearch() {
  if (_searchOpening) return;
  if (document.getElementById('page-admin')?.classList.contains('active')) return;
  _searchOpening = true;
  const overlay = document.getElementById('search-overlay');
  overlay?.classList.add('open');
  document.body.style.overflow = 'hidden';
  const results = document.getElementById('search-results');
  if (results) results.innerHTML = '';
  document.getElementById('search-empty')?.classList.add('hidden');
  document.getElementById('search-suggestions')?.classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('search-input')?.focus();
    _searchOpening = false;
  }, 250);
}

export function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay?.classList.contains('open')) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  const hs = document.getElementById('header-search');
  if (hs) hs.value = '';
  const results = document.getElementById('search-results');
  if (results) results.innerHTML = '';
  document.getElementById('search-empty')?.classList.add('hidden');
  document.getElementById('search-clear')?.classList.add('hidden');
}

export function clearSearch() {
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  const results = document.getElementById('search-results');
  if (results) results.innerHTML = '';
  document.getElementById('search-empty')?.classList.add('hidden');
  document.getElementById('search-clear')?.classList.add('hidden');
  document.getElementById('search-suggestions')?.classList.remove('hidden');
  document.getElementById('search-input')?.focus();
}

export function handleSearch(q) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    const clearBtn = document.getElementById('search-clear');
    const suggestions = document.getElementById('search-suggestions');
    const emptyEl = document.getElementById('search-empty');
    const el = document.getElementById('search-results');
    if (!el) return;
    clearBtn?.classList.toggle('hidden', !q.trim());
    suggestions?.classList.toggle('hidden', !!q.trim());
    if (!q.trim()) {
      el.innerHTML = '';
      emptyEl?.classList.add('hidden');
      return;
    }
    if (!state.products?.length) {
      el.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      return;
    }
    const results = state.products.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.cat.toLowerCase().includes(q.toLowerCase()) ||
      (p.badge && p.badge.toLowerCase().includes(q.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(q.toLowerCase()))
    );
    if (results.length === 0) {
      el.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      return;
    }
    emptyEl?.classList.add('hidden');
    el.innerHTML = results.map(p => `
      <div class="result-card cursor-pointer overflow-hidden" onclick="closeSearch();openProduct(${p.id})">
        <div class="aspect-[3/4] overflow-hidden border-b-2 border-black/10 relative">
          <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover grayscale-hover"/>
          ${p.badge ? `<span class="absolute top-2 left-2 badge badge-violet text-[9px]">${p.badge}</span>` : ''}
        </div>
        <div class="p-3">
          <div style="font-family:Inter,sans-serif;font-size:10px;letter-spacing:0.05em;font-weight:600;color:var(--on-surface,#000);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:var(--primary,#000);margin-top:4px;">${window.fmtPrice?.(p.price) || '$' + p.price}</div>
          <div style="font-family:Inter,sans-serif;font-size:9px;color:var(--on-surface-variant,rgba(0,0,0,0.35));margin-top:2px;text-transform:uppercase;">${p.cat}</div>
        </div>
      </div>`).join('');
    try { window.staggerEnter?.(el, 0.05); } catch(e) {}
  }, 120);
}

function initTypewriter() {
  const inputs = [document.getElementById('search-input'), document.getElementById('header-search')].filter(Boolean);
  if (!inputs.length) return;
  const phrases = ['BUSCAR', 'NOMBRE', 'CATEGORÍA', 'SKU'];
  let pIdx = 0, cIdx = 0, dir = 1;
  function tick() {
    const phrase = phrases[pIdx];
    const showCursor = (dir === 1 && cIdx <= phrase.length) || (dir === -1 && cIdx >= 0);
    const val = phrase.slice(0, cIdx) + (showCursor ? '|' : '');
    inputs.forEach(el => el.setAttribute('placeholder', val));
    if (dir === 1) {
      cIdx++;
      if (cIdx > phrase.length) { dir = -1; typewriterTimer = setTimeout(tick, 800); return; }
    } else {
      cIdx--;
      if (cIdx < 0) { dir = 1; pIdx = (pIdx + 1) % phrases.length; typewriterTimer = setTimeout(tick, 400); return; }
    }
    typewriterTimer = setTimeout(tick, dir === 1 ? 80 + Math.random() * 60 : 30);
  }
  tick();
}

export function init() {
  window.openSearch = openSearch;
  window.closeSearch = closeSearch;
  window.clearSearch = clearSearch;
  window.handleSearch = handleSearch;
  initTypewriter();
  document.getElementById('search-overlay')?.addEventListener('click', function(e) {
    if (e.target === this) closeSearch();
  });
}
