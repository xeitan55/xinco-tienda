import { state } from './state.js';

const SLUG_MAP = {
  home: '/',
  catalog: '/catalogo',
  accesorios: '/accesorios',
  cart: '/carrito',
  checkout: '/checkout',
  login: '/login',
  register: '/registro',
  account: '/cuenta',
  admin: '/admin',
  'verify-email': '/verificar-email',
  'order-confirm': '/confirmacion',
};

const PAGE_FROM_SLUG = Object.fromEntries(
  Object.entries(SLUG_MAP).map(([k, v]) => [v, k])
);

export function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

export async function nav(page, opts) {
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
  const hideStitch = ['admin','login','register','account'].includes(page);
  document.getElementById('main-header').style.display = hideHeader ? 'none' : '';
  document.getElementById('announcement-bar').style.display = hideHeader ? 'none' : '';

  const footerEl = document.getElementById('global-footer');
  if (footerEl) footerEl.style.display = hideHeader ? 'none' : '';

  import('./auth.js').then(m => m.updateAuthUI());

  const stitchEl = document.getElementById('mouse-stitch');
  if (stitchEl) {
    stitchEl.style.display = hideStitch ? 'none' : '';
    if (!hideStitch) setTimeout(() => { try { window.updateStitchClip?.(); } catch(e) {} }, 50);
  }
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) bgCanvas.style.display = hideHeader ? 'none' : '';

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (page === 'catalog' && state._tagFilter) {
    const navId = 'nav-' + state._tagFilter;
    const el = document.getElementById(navId);
    if (el) el.classList.add('active');
    else if (document.getElementById('nav-'+page)) document.getElementById('nav-'+page).classList.add('active');
  } else {
    if (document.getElementById('nav-'+page)) document.getElementById('nav-'+page).classList.add('active');
  }

  const { renderHomeProducts, renderExclusiveProducts, renderCatalog, renderAccessories } = await import('./products.js');
  const { renderCartPage } = await import('./cart.js');
  const { renderCheckoutPage } = await import('./checkout.js');

  if (page === 'home') { renderHomeProducts(); renderExclusiveProducts(); }
  if (page === 'catalog') {
    if (!state._catFilterNav) {
      state.filterCat = [];
      state._tagFilter = null;
      document.querySelectorAll('.filter-cat').forEach(c => { c.checked = c.value === 'all'; });
      document.querySelectorAll('.filter-size').forEach(b => b.classList.remove('selected'));
      document.querySelectorAll('.filter-color').forEach(b => b.style.outline = '');
      const priceEl = document.getElementById('price-range');
      if (priceEl) priceEl.value = 200000;
      const labelEl = document.getElementById('price-label');
      if (labelEl) labelEl.textContent = '$200.000';
      const sortEl = document.getElementById('sort-select');
      if (sortEl) sortEl.value = 'default';
      const titleEl = document.getElementById('catalog-title');
      if (titleEl) titleEl.textContent = 'TODOS LOS ITEMS';
    }
    state._catFilterNav = false;
    renderCatalog();
  }
  if (page === 'accesorios') renderAccessories();
  if (page === 'cart') renderCartPage();
  if (page === 'checkout') renderCheckoutPage();
  if (page === 'account') { const { renderAccountPage } = await import('./auth.js'); renderAccountPage(); }
  if (page === 'admin') {
    window.closeSearch?.();
    const { init, renderAdminDashboard, renderAdminOrders, renderAdminProducts, renderAdminInventory, renderAdminCustomers, renderAdminCupones, renderAdminTracking, renderAdminReports, showAdminSection } = await import('./admin.js');
    init();
    [renderAdminDashboard, renderAdminOrders, renderAdminProducts, renderAdminInventory, renderAdminCustomers, renderAdminCupones, renderAdminTracking, renderAdminReports].forEach(fn => { try { fn(); } catch(e) { console.error(e); } });
    showAdminSection('dashboard');
  }

  // Update URL
  let slug;
  if (page === 'product' && state.currentProduct) {
    slug = '/producto/' + slugify(state.currentProduct.name);
  } else {
    slug = SLUG_MAP[page] || '/' + page;
  }
  if (!opts?.replace) {
    history.pushState({ page }, '', slug);
  } else {
    history.replaceState({ page }, '', slug);
  }

  setTimeout(() => { try { window.initScrollReveal?.(); } catch(e) {} }, 50);
}

export async function handleAuthBtn() {
  if (state.user) {
    const { isAdmin } = await import('./admin.js');
    if (await isAdmin()) await nav('admin');
    else await nav('account');
  } else {
    await nav('login');
  }
}

export async function filterCatalog(tag) {
  state._tagFilter = ['newdrops','stylo','esenciales','exclusive'].includes(tag) ? tag : null;
  state.filterCat = ['remeras','pantalones','buzos','camperas','accesorios'].includes(tag) ? [tag] : [];
  document.querySelectorAll('.filter-cat').forEach(cb => {
    cb.checked = state.filterCat.length > 0 ? cb.value === tag : cb.value === 'all';
  });
  const titles = { newdrops:'NOVEDADES', stylo:'STYLE', esenciales:'ESENCIALES', exclusive:'EXCLUSIVE' };
  document.getElementById('catalog-title').textContent = titles[tag] || tag.toUpperCase();
  state._catFilterNav = true;
  await nav('catalog');
}

export async function resetFilters() {
  document.querySelectorAll('.filter-cat').forEach(c => { c.checked = c.value === 'all'; });
  document.querySelectorAll('.filter-size').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.filter-color').forEach(b => b.style.outline = '');
  document.getElementById('price-range').value = 200000;
  document.getElementById('price-label').textContent = '$200.000';
  document.getElementById('sort-select').value = 'default';
  state._tagFilter = null;
  state.filterCat = [];
  document.getElementById('catalog-title').textContent = 'TODOS LOS ITEMS';
  const { renderCatalog } = await import('./products.js');
  renderCatalog();
}

export function init() {
  window.nav = nav;
  window.handleAuthBtn = handleAuthBtn;
  window.filterCatalog = filterCatalog;
  window.resetFilters = resetFilters;
  window.slugify = slugify;
  window.closeMobileMenu = () => {
    document.getElementById('mobile-menu')?.classList.remove('open');
    document.body.style.overflow = '';
  };
  window.openMobileMenu = () => {
    const menu = document.getElementById('mobile-menu');
    const footer = document.getElementById('mobile-menu-footer');
    if (footer) {
      if (state.user) {
        footer.innerHTML = '<a onclick="nav(\'account\');closeMobileMenu()"><span class="material-symbols-outlined text-[16px]">person</span> MI CUENTA</a><a onclick="doLogout();closeMobileMenu()"><span class="material-symbols-outlined text-[16px]">logout</span> CERRAR SESIÓN</a>';
      } else {
        footer.innerHTML = '<a onclick="nav(\'login\');closeMobileMenu()"><span class="material-symbols-outlined text-[16px]">login</span> INICIAR SESIÓN</a>';
      }
    }
    menu?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.toggleCatalogFilters = () => {
    const panel = document.getElementById('catalog-filters-panel');
    const icon = document.getElementById('filter-toggle-icon');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    if (icon) icon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  };
  // Close overlays on backdrop click
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('mobile-menu');
    if (menu && menu.classList.contains('open') && e.target === menu) {
      window.closeMobileMenu();
    }
  });
  // Browser back/forward
  window.addEventListener('popstate', (e) => {
    const page = e.state?.page;
    const overlay = document.getElementById('product-overlay');
    if (overlay?.classList.contains('open')) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      import('./products.js').then(m => m.clearPreProductPage());
    }
    if (page && page !== 'product') {
      nav(page, { replace: true });
    } else if (!page) {
      nav('home', { replace: true });
    }
  });

  // Initial navigation from URL
  const path = window.location.pathname;
  const page = PAGE_FROM_SLUG[path];
  if (page && page !== 'home') {
    // Hide home immediately to prevent flash
    const homeEl = document.getElementById('page-home');
    if (homeEl) { homeEl.classList.remove('active'); homeEl.style.display = 'none'; }
    setTimeout(() => nav(page, { replace: true }), 50);
  } else if (path.startsWith('/producto/')) {
    // Product slug route — handled after boot
    const slug = path.replace('/producto/', '');
    const homeEl = document.getElementById('page-home');
    if (homeEl) { homeEl.classList.remove('active'); homeEl.style.display = 'none'; }
    setTimeout(() => {
      const p = (window.state?.products || []).find(pr =>
        slugify(pr.name) === slug
      );
      if (p) window.openProduct(p.id);
      else document.getElementById('page-home').style.display = '';
    }, 200);
  } else if (path !== '/') {
    history.replaceState({ page: 'home' }, '', '/');
  }

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
      btn.style.outline = '3px solid var(--admin-accent, #5d22ff)';
      btn.style.outlineOffset = '2px';
    }
    import('./products.js').then(m => m.renderCatalog());
  }));
}
