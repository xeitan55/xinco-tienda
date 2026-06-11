import { state, bannerState, DB_KEYS, PRODUCTS, subscribe } from './state.js';

const FB_CONFIG = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

let fbApp, fbDb, fbAuth;
let _fbReadyResolve;
const fbReady = new Promise(resolve => { _fbReadyResolve = resolve; });
function dbSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) { console.warn('localStorage error', e); }
}

function dbLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch(e) { return fallback; }
}

function persistAll() {
  dbSave(DB_KEYS.cart, state.cart);
}

function loadCart() {
  state.cart = dbLoad(DB_KEYS.cart, []);
}

async function initFirebase() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const { getFirestore, collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, applyActionCode, checkActionCode, sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');

    fbApp  = initializeApp(FB_CONFIG);
    fbDb   = getFirestore(fbApp);
    fbAuth = getAuth(fbApp);

    window.fbDb = fbDb;
    window.fbAuth = fbAuth;
    window._fb = { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, applyActionCode, checkActionCode, sendEmailVerification };

    onAuthStateChanged(fbAuth, user => {
      state.user = user;
      (async () => {
        try {
          const { updateAuthUI } = await import('./auth.js');
          await updateAuthUI();
          if (user && state.currentPage === 'login') {
            const { isAdmin } = await import('./admin.js');
            if (await isAdmin()) { const { nav } = await import('./router.js'); await nav('admin'); }
          }
        } catch(e) {
          console.error('onAuthStateChanged error:', e);
        }
      })();
    });

    if (_fbReadyResolve) _fbReadyResolve();
  } catch(e) {
    console.error('Firebase no disponible:', e);
  }
}

async function waitForFirebase() {
  if (fbDb && window._fb) return true;
  try {
    await Promise.race([
      fbReady,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 8000))
    ]);
    return true;
  } catch(e) {
    return false;
  }
}

function normalizeProduct(data) {
  const p = { ...data };
  if (p.images && Array.isArray(p.images)) {
    p.images = p.images.map(e => typeof e === 'string' ? { url: e, colorId: '' } : (e && e.url ? e : { url: '', colorId: '' })).filter(e => e.url);
  } else {
    p.images = [];
  }
  if (!p.img || typeof p.img !== 'string') {
    p.img = p.images[0]?.url || '';
  }
  return p;
}

async function seedFirebaseProducts() {
  if (!fbDb || !window._fb) return;
  const { doc, setDoc } = window._fb;
  const seedData = PRODUCTS.length > 0 ? PRODUCTS : [{ id:'placeholder', name:'Agregá tu primer producto', price:0, cat:'remeras', badge:null, desc:'', sizes:['M'], colors:['negro'], stock:0, sku:'XNC-000', rating:0, reviews:0, img:'', images:[], tags:[] }];
  for (const p of seedData) {
    try { await setDoc(doc(fbDb, 'products', String(p.id)), p); } catch(e) { console.error('Error sembrando producto en Firestore:', e); }
  }
}

async function syncFromFirebase() {
  if (!fbDb || !window._fb) throw new Error('Firebase no inicializado');
  const { collection, getDocs, getDoc, doc, query, orderBy } = window._fb;

  try {
    const prodSnap = await getDocs(collection(fbDb, 'products'));
    if (!prodSnap.empty) {
      state.products = prodSnap.docs.map(d => {
        const p = normalizeProduct({ id: d.id, ...d.data() });
        p.rating = 0;
        p.reviews = 0;
        return p;
      });
    } else {
      await seedFirebaseProducts();
      const prodSnap2 = await getDocs(collection(fbDb, 'products'));
      state.products = prodSnap2.docs.map(d => {
        const p = normalizeProduct({ id: d.id, ...d.data() });
        p.rating = 0;
        p.reviews = 0;
        return p;
      });
    }
  } catch(e) {
    console.error('syncFromFirebase error:', e.message);
    throw e;
  }

  try {
    const bannerSnap = await getDoc(doc(fbDb, 'config', 'banners'));
    if (bannerSnap.exists()) {
      const fbData = bannerSnap.data();
      if (fbData.announcements) bannerState.announcements = fbData.announcements.map(
        m => typeof m === 'string' ? { text: m, color: '#ffffff' } : m
      );
      if (fbData.hero)          Object.assign(bannerState.hero, fbData.hero);
      if (fbData.promo)         Object.assign(bannerState.promo, fbData.promo);
      if (fbData.categories) {
        if (Array.isArray(fbData.categories)) {
          bannerState.categories = fbData.categories;
        } else if (typeof fbData.categories === 'object') {
          bannerState.categories = Object.entries(fbData.categories).map(([slug, data]) => ({
            slug,
            name: (typeof data === 'string' ? slug : (data.title || slug)).charAt(0).toUpperCase() + (typeof data === 'string' ? slug : (data.title || slug)).slice(1),
            img: typeof data === 'string' ? data : (data?.img || ''),
            title: typeof data === 'string' ? '' : (data?.title || ''),
            subtitle: typeof data === 'string' ? '' : (data?.subtitle || '')
          }));
        }
      }
    }
  } catch(e) {
    console.warn('syncFromFirebase: no se pudieron cargar banners:', e.message);
  }

  try {
    const couponSnap = await getDoc(doc(fbDb, 'config', 'coupons'));
    if (couponSnap.exists() && couponSnap.data().coupons) {
      state.coupons = couponSnap.data().coupons;
    }
  } catch(e) {
    console.warn('syncFromFirebase: no se pudieron cargar cupones:', e.message);
  }

  try {
    const mpSnap = await getDoc(doc(fbDb, 'config', 'mercadopago'));
    if (mpSnap.exists()) {
      state.mpConfig = mpSnap.data();
    }
  } catch(e) {
    console.warn('syncFromFirebase: no se pudo cargar config MP:', e.message);
  }

  try {
    const orderSnap = await getDocs(query(collection(fbDb, 'orders'), orderBy('createdAt', 'desc')));
    if (!orderSnap.empty) {
      state.orders = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch(e) {
    console.warn('syncFromFirebase: no se pudieron cargar órdenes:', e.message);
  }

  try {
    const shipSnap = await getDoc(doc(fbDb, 'config', 'shipping'));
    if (shipSnap.exists()) {
      window._shippingProviders = shipSnap.data().providers || [];
    }
  } catch(e) {
    console.warn('syncFromFirebase: no se pudieron cargar envíos:', e.message);
  }

  try {
    const bankSnap = await getDoc(doc(fbDb, 'config', 'bank'));
    if (bankSnap.exists()) {
      window._bankConfig = bankSnap.data();
    }
  } catch(e) {
    console.warn('syncFromFirebase: no se pudo cargar config bancaria:', e.message);
  }
}

async function fbSaveProductRemote(product) {
  const ready = await waitForFirebase();
  if (!ready) { window.showToast?.('⚠️ Sin conexión a Firebase — cambio guardado solo localmente'); return; }
  const { doc, setDoc } = window._fb;
  try {
    await setDoc(doc(fbDb, 'products', String(product.id)), product, { merge: true });
  } catch(e) {
    console.error('fbSaveProductRemote error:', e);
  }
}

async function fbDeleteProductRemote(id) {
  const ready = await waitForFirebase();
  if (!ready) return;
  const { doc, deleteDoc } = window._fb;
  try {
    await deleteDoc(doc(fbDb, 'products', String(id)));
  } catch(e) {
    console.error('fbDeleteProductRemote error:', e);
  }
}

async function fbSaveOrderRemote(order) {
  const ready = await waitForFirebase();
  if (!ready) return;
  const { collection, addDoc } = window._fb;
  try {
    const ref = await addDoc(collection(fbDb, 'orders'), { ...order, createdAt: new Date().toISOString() });
    return ref.id;
  } catch(e) {
    console.error('fbSaveOrderRemote error:', e);
  }
}

async function fbUpdateOrderStatusRemote(id, status) {
  const ready = await waitForFirebase();
  if (!ready) return;
  const { doc, updateDoc } = window._fb;
  try {
    await updateDoc(doc(fbDb, 'orders', String(id)), { status });
  } catch(e) {
    console.error('fbUpdateOrderStatusRemote error:', e);
  }
}

async function fbSaveBannersRemote(data) {
  const ready = await waitForFirebase();
  if (!ready) throw new Error('Firebase no disponible');
  const { doc, setDoc } = window._fb;
  try {
    await setDoc(doc(fbDb, 'config', 'banners'), data, { merge: true });
  } catch(e) {
    console.error('fbSaveBannersRemote error:', e);
    throw e;
  }
}

async function fbLoginUser(email, password) {
  if (!fbAuth || !window._fb) {
    await initFirebase();
  }
  if (!fbAuth || !window._fb) throw new Error('Firebase no disponible');
  const { signInWithEmailAndPassword } = window._fb;
  const cred = await signInWithEmailAndPassword(fbAuth, email, password);
  return cred.user;
}

async function fbLogoutUser() {
  if (!fbAuth || !window._fb) return;
  const { signOut } = window._fb;
  await signOut(fbAuth);
}

let retryCount = 0;
const MAX_BOOT_RETRIES = 10;
let _bootResolved = false;

async function bootFromFirebase() {
  try {
    const { validateCartCoupons } = await import('./coupons.js');
    const { renderAnnouncementBar, renderHeroBanner, renderPromoBanner } = await import('./banners.jsx');
    const { applySavedCatImages, renderHomePageCats, renderAdminCatFilters, renderAdminCatSelect } = await import('./admin.js');
    const { renderHomeProducts, renderExclusiveProducts, renderCatalog } = await import('./products.js');

    loadCart();
    await initFirebase();
    await syncFromFirebase();
    validateCartCoupons();
    renderAnnouncementBar();
    renderHeroBanner();
    renderPromoBanner();
    applySavedCatImages();
    renderHomePageCats();
    renderAdminCatFilters();
    renderAdminCatSelect();
    renderHomeProducts();
    renderExclusiveProducts();
    renderCatalog();
    updateCartCount();
    _bootResolved = true;
    window.dismissSplash?.();
  } catch(e) {
    console.error('bootFromFirebase: error (intento ' + retryCount + '):', e.message);
    if (retryCount === 0) _bootResolved = true;
    retryCount++;
    if (retryCount >= MAX_BOOT_RETRIES) {
      console.error('bootFromFirebase: se alcanzó el máximo de reintentos (' + MAX_BOOT_RETRIES + ')');
      window.dismissSplash?.();
      return;
    }
    const hp = document.getElementById('home-products');
    if (hp) hp.innerHTML = '<div class="col-span-4" style="text-align:center;padding:60px;"><p style="font-family:JetBrains Mono,monospace;font-size:11px;letter-spacing:0.1em;color:#ba1a1a;">ERROR DE CONEXION</p><p style="font-family:JetBrains Mono,monospace;font-size:10px;color:#4c4546;margin-top:8px;">Reintentando en ' + Math.min(retryCount * 3, 15) + ' segundos...</p></div>';
    window.dismissSplash?.();
    setTimeout(bootFromFirebase, Math.min(retryCount * 3000, 15000));
  }
}

function updateCartCount() {
  const total = state.cart.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) {
    el.textContent = total;
    el.style.display = total > 0 ? '' : 'none';
    el.classList.remove('counter-bounce');
    void el.offsetWidth;
    el.classList.add('counter-bounce');
  }
}

export function init() {
  window.initFirebase = initFirebase;
  window.bootFromFirebase = bootFromFirebase;
  window.syncFromFirebase = syncFromFirebase;
  window.fbDb = fbDb;
  window.fbAuth = fbAuth;
  window._fb = null;
  window.fbLoginUser = fbLoginUser;
  window.fbLogoutUser = fbLogoutUser;
  window.fbSaveProductRemote = fbSaveProductRemote;
  window.fbDeleteProductRemote = fbDeleteProductRemote;
  window.fbSaveOrderRemote = fbSaveOrderRemote;
  window.fbUpdateOrderStatusRemote = fbUpdateOrderStatusRemote;
  window.fbSaveBannersRemote = fbSaveBannersRemote;
  window.persistAll = persistAll;
  window.loadCart = loadCart;
  window.updateCartCount = updateCartCount;
  window.cartTotal = () => (window.state || state).cart.reduce((s, i) => s + i.price * i.qty, 0);
  window.cartSubtotal = () => (window.state || state).cart.filter(i => !i.isCoupon).reduce((s, i) => s + i.price * i.qty, 0);
  window.fmtPrice = (n) => '$' + n.toLocaleString('es-AR');
  window.waitForFirebase = waitForFirebase;
  window._bootResolved = _bootResolved;

  subscribe('cart', () => { persistAll(); updateCartCount(); });
}

export {
  initFirebase, bootFromFirebase, syncFromFirebase, fbSaveProductRemote, fbDeleteProductRemote,
  fbSaveOrderRemote, fbUpdateOrderStatusRemote, fbSaveBannersRemote, fbLoginUser, fbLogoutUser,
  persistAll, loadCart, waitForFirebase, fbDb, fbAuth, updateCartCount, _bootResolved, state
};
