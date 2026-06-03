import { state } from './state.js';

export function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('search-empty').classList.add('hidden');
  document.getElementById('search-suggestions').classList.remove('hidden');
  setTimeout(() => document.getElementById('search-input').focus(), 150);
}

export function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('search-empty').classList.add('hidden');
  document.getElementById('search-clear').classList.add('hidden');
}

export function clearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('search-empty').classList.add('hidden');
  document.getElementById('search-clear').classList.add('hidden');
  document.getElementById('search-suggestions').classList.remove('hidden');
  document.getElementById('search-input').focus();
}

export function handleSearch(q) {
  const clearBtn = document.getElementById('search-clear');
  const suggestions = document.getElementById('search-suggestions');
  const emptyEl = document.getElementById('search-empty');
  clearBtn.classList.toggle('hidden', !q.trim());
  suggestions.classList.toggle('hidden', !!q.trim());
  const el = document.getElementById('search-results');
  if (!q.trim()) {
    el.innerHTML = '';
    emptyEl.classList.add('hidden');
    return;
  }
  const results = state.products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.cat.toLowerCase().includes(q.toLowerCase()) ||
    (p.badge && p.badge.toLowerCase().includes(q.toLowerCase())) ||
    p.sku.toLowerCase().includes(q.toLowerCase())
  );
  if (results.length === 0) {
    el.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  el.innerHTML = results.map(p => `
    <div class="result-card cursor-pointer overflow-hidden" onclick="closeSearch();openProduct(${p.id})">
      <div class="aspect-[3/4] overflow-hidden border-b-2 border-black/10 relative">
        <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover grayscale-hover"/>
        ${p.badge ? `<span class="absolute top-2 left-2 badge badge-violet text-[9px]">${p.badge}</span>` : ''}
      </div>
      <div class="p-3">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.08em;font-weight:700;color:#000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#5d22ff;margin-top:4px;">${window.fmtPrice?.(p.price) || '$' + p.price}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(0,0,0,0.35);margin-top:2px;text-transform:uppercase;">${p.cat}</div>
      </div>
    </div>`).join('');
  try { window.staggerEnter?.(el, 0.05); } catch(e) {}
}

export function init() {
  window.openSearch = openSearch;
  window.closeSearch = closeSearch;
  window.clearSearch = clearSearch;
  window.handleSearch = handleSearch;
}
