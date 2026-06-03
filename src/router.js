import { state } from './state.js';

export async function nav(page) {
  const current = document.querySelector('.page.active');
  const target = document.getElementById('page-' + page);
  if (!target) return;

  if (current && current !== target) {
    current.classList.remove('active');
    current.classList.add('page-exit');
    await new Promise(r => setTimeout(r, 220));
    current.classList.remove('page-exit');
    current.style.display = 'none';
  }

  target.style.display = '';
  target.classList.add('active');
  state.currentPage = page;
  window.scrollTo(0, 0);

  const hideHeader = ['admin','login','register'].includes(page);
  document.getElementById('main-header').style.display = hideHeader ? 'none' : '';
  document.getElementById('announcement-bar').style.display = hideHeader ? 'none' : '';

  const stitchEl = document.getElementById('mouse-stitch');
  if (stitchEl) {
    stitchEl.style.display = hideHeader ? 'none' : '';
    if (!hideHeader) setTimeout(() => { try { window.updateStitchClip?.(); } catch(e) {} }, 50);
  }

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (document.getElementById('nav-'+page)) document.getElementById('nav-'+page).classList.add('active');

  const { renderHomeProducts, renderCatalog } = await import('./products.js');
  const { renderCartPage } = await import('./cart.js');
  const { renderCheckoutPage } = await import('./checkout.js');

  if (page === 'home') renderHomeProducts();
  if (page === 'catalog') renderCatalog();
  if (page === 'cart') renderCartPage();
  if (page === 'checkout') renderCheckoutPage();
  if (page === 'account') { const { renderAccountPage } = await import('./auth.js'); renderAccountPage(); }
  if (page === 'admin') {
    const { checkAdminAccess, renderAdminDashboard, renderAdminOrders, renderAdminProducts, renderAdminInventory, renderAdminCustomers } = await import('./admin.js');
    await checkAdminAccess(); renderAdminDashboard(); renderAdminOrders(); renderAdminProducts(); renderAdminInventory(); renderAdminCustomers();
  }

  setTimeout(() => { try { window.initScrollReveal?.(); } catch(e) {} }, 50);
}

export async function handleAuthBtn() {
  if (state.user) {
    const { isAdmin } = await import('./admin.js');
    if (await isAdmin()) nav('admin');
    else nav('account');
  } else {
    nav('login');
  }
}

export function filterCatalog(tag) {
  state.filterCat = [];
  if (tag === 'remeras') state.filterCat = ['remeras'];
  else if (tag === 'pantalones') state.filterCat = ['pantalones'];
  else if (tag === 'buzos') state.filterCat = ['buzos'];
  else if (tag === 'camperas') state.filterCat = ['camperas'];
  else if (tag === 'accesorios') state.filterCat = ['accesorios'];
  if (['newdrops','stylo','esenciales'].includes(tag)) {
    state._tagFilter = tag;
  } else {
    state._tagFilter = null;
  }
  document.getElementById('catalog-title').textContent = tag === 'newdrops' ? 'NEW DROPS' : tag === 'stylo' ? 'STYLO' : tag === 'esenciales' ? 'ESENCIALES' : tag.toUpperCase();
  nav('catalog');
}

export function resetFilters() {
  document.querySelectorAll('.filter-cat').forEach(c => { c.checked = c.value === 'all'; });
  document.querySelectorAll('.filter-size').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.filter-color').forEach(b => b.style.outline = '');
  document.getElementById('price-range').value = 200000;
  document.getElementById('price-label').textContent = '$200.000';
  document.getElementById('sort-select').value = 'default';
  state._tagFilter = null;
  state.filterCat = [];
  document.getElementById('catalog-title').textContent = 'TODOS LOS ITEMS';
  const { renderCatalog } = require_products();
  renderCatalog();
}

export function init() {
  window.nav = nav;
  window.handleAuthBtn = handleAuthBtn;
  window.filterCatalog = filterCatalog;
  window.resetFilters = resetFilters;
  window.closeMobileMenu = () => {
    document.getElementById('mobile-menu').classList.remove('open');
    document.body.style.overflow = '';
  };
  window.openMobileMenu = () => {
    document.getElementById('mobile-menu').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // Filter event listeners
  document.querySelectorAll('.filter-cat').forEach(cb => cb.addEventListener('change', () => {
    if (cb.value === 'all' && cb.checked) {
      document.querySelectorAll('.filter-cat').forEach(c => { if(c.value !== 'all') c.checked = false; });
    } else {
      document.querySelector('.filter-cat[value="all"]').checked = false;
    }
    state._tagFilter = null;
    state.filterCat = [];
    import('./products.js').then(m => m.renderCatalog());
  }));
  document.querySelectorAll('.filter-size').forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('selected');
    import('./products.js').then(m => m.renderCatalog());
  }));
  document.querySelectorAll('.filter-color').forEach(btn => btn.addEventListener('click', () => {
    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      btn.style.outline = '';
    } else {
      btn.classList.add('selected');
      btn.style.outline = '3px solid #5d22ff';
      btn.style.outlineOffset = '2px';
    }
    import('./products.js').then(m => m.renderCatalog());
  }));
}
