// =============================================
// XINCO — js/store.js
// Estado global + sincronización Firebase
// localStorage como caché offline
// =============================================

import {
  fbGetProducts, fbSaveProduct, fbDeleteProduct,
  fbGetOrders, fbSaveOrder, fbUpdateOrderStatus,
  fbGetBanners, fbSaveBanners,
  fbGetTracking, fbSaveTracking,
  fbGetConfig, fbSaveConfig,
  fbOnAuthChange, fbCurrentUser
} from './firebase.js';

// =============================================
// PRODUCTOS POR DEFECTO (primera carga)
// =============================================
export const DEFAULT_PRODUCTS = [
  {id:'prod-1', name:'ARCHIVE HEAVY TEE', price:14500, oldPrice:null, cat:'remeras', badge:'NUEVO',
   desc:'Remera oversized de algodón 300g. Corte boxy, costuras reforzadas.',
   sizes:['S','M','L','XL'], colors:['negro','blanco'], stock:45, sku:'XNC-REM-001',
   rating:4.8, reviews:32,
   img:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80',
   images:['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80'],
   tags:['newdrops','esenciales']},
  {id:'prod-2', name:'TACTICAL CARGO PANT', price:28900, oldPrice:38000, cat:'pantalones', badge:'SALE',
   desc:'Cargo técnico con 8 bolsillos. Tela ripstop resistente al agua.',
   sizes:['M','L','XL'], colors:['negro','gris'], stock:18, sku:'XNC-PAN-002',
   rating:4.9, reviews:18,
   img:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
   images:['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80'],
   tags:['esenciales']},
  {id:'prod-3', name:'XINCO 01 HOODIE', price:42000, oldPrice:null, cat:'buzos', badge:'DROP EXCLUSIVO',
   desc:'Buzo pesado con capucha ajustable. Bordado frontal. Fabricado en Argentina.',
   sizes:['S','M','L','XL','XXL'], colors:['negro','violeta'], stock:30, sku:'XNC-BUZ-003',
   rating:5.0, reviews:47,
   img:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
   images:['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'],
   tags:['newdrops','stylo']},
  {id:'prod-4', name:'SIGNAL TRACK JACKET', price:55000, oldPrice:null, cat:'buzos', badge:'NUEVO',
   desc:'Campera track con detalles violeta. Tela técnica anti-viento.',
   sizes:['S','M','L'], colors:['negro','violeta'], stock:12, sku:'XNC-BUZ-004',
   rating:4.7, reviews:11,
   img:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
   images:['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80'],
   tags:['newdrops','stylo']},
  {id:'prod-5', name:'MONO LOGO TEE', price:12000, oldPrice:15000, cat:'remeras', badge:'SALE',
   desc:'Remera slim con logo monocromático. Algodón peinado suave.',
   sizes:['XS','S','M','L','XL'], colors:['blanco','negro','gris'], stock:60, sku:'XNC-REM-005',
   rating:4.5, reviews:28,
   img:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
   images:['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80'],
   tags:['esenciales']},
  {id:'prod-6', name:'STREET JOGGER V2', price:22000, oldPrice:null, cat:'pantalones', badge:null,
   desc:'Jogging urbano con puños en las piernas y pretina ancha.',
   sizes:['S','M','L','XL'], colors:['negro','gris'], stock:25, sku:'XNC-PAN-006',
   rating:4.6, reviews:15,
   img:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80',
   images:['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80'],
   tags:['esenciales']},
  {id:'prod-7', name:'NOIR ZIP HOODIE', price:38000, oldPrice:45000, cat:'buzos', badge:'SALE',
   desc:'Buzo con cierre completo. Interior polar. Bolsillos kangaroo.',
   sizes:['M','L','XL','XXL'], colors:['negro'], stock:8, sku:'XNC-BUZ-007',
   rating:4.8, reviews:22,
   img:'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80',
   images:['https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80'],
   tags:['stylo']},
  {id:'prod-8', name:'XINCO CAP 01', price:8500, oldPrice:null, cat:'accesorios', badge:'NEW',
   desc:'Gorra snapback con bordado frontal. Panel estructurado. Ajuste universal.',
   sizes:['U'], colors:['negro','blanco'], stock:80, sku:'XNC-ACC-008',
   rating:4.4, reviews:9,
   img:'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
   images:['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80'],
   tags:['esenciales','newdrops']},
];

export const DEFAULT_BANNERS = {
  announcements: [
    'ENVÍO GRATIS SUPERANDO LOS $95.000',
    'NUEVA COLECCIÓN DISPONIBLE',
    'HASTA 30% OFF EN SELECCIONADOS'
  ],
  hero: {
    badge: 'SS/2025 — NUEVA COLECCIÓN',
    title: 'XINCO',
    subtitle: 'Ropa que habla el idioma de la calle. Diseñado para los que no piden permiso.',
    img: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1800&q=80'
  },
  promo: {
    label: 'OFERTA LIMITADA',
    title: '30% OFF\nEN BUZOS',
    code: 'URBAN30'
  }
};

// =============================================
// ESTADO GLOBAL
// =============================================
export const store = {
  products:    [],
  orders:      [],
  cart:        [],
  banners:     { ...DEFAULT_BANNERS },
  tracking:    {},
  user:        null,
  mpConfig:    null,
  initialized: false,
  listeners:   [],            // callbacks para rerender
};

// =============================================
// LOCAL STORAGE — caché offline
// =============================================
const LS = {
  cart:    'xinco_cart',
  user:    'xinco_user_cache',
};

function lsSave(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}
function lsLoad(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; }
}

// =============================================
// SUSCRIPCIÓN — cualquier módulo puede escuchar
// =============================================
export function onStoreChange(fn) {
  store.listeners.push(fn);
}
function emit(event, payload) {
  store.listeners.forEach(fn => fn(event, payload));
}

// =============================================
// INIT — carga todo desde Firebase
// =============================================
export async function initStore() {
  // Carrito desde localStorage (instantáneo)
  store.cart = lsLoad(LS.cart, []);

  // Auth listener
  fbOnAuthChange(user => {
    store.user = user;
    emit('auth', user);
  });

  try {
    // Productos
    const prods = await fbGetProducts();
    store.products = prods.length > 0 ? prods : DEFAULT_PRODUCTS;

    // Si no hay productos en Firebase, subirlos la primera vez
    if (prods.length === 0) {
      await seedProducts();
    }

    // Pedidos
    store.orders = await fbGetOrders();

    // Banners
    const banners = await fbGetBanners();
    if (banners) store.banners = banners;

    // Tracking
    store.tracking = await fbGetTracking();

    // Config MP
    const mp = await fbGetConfig('mercadopago');
    if (mp) store.mpConfig = mp;

  } catch(e) {
    console.warn('Firebase offline, usando caché local', e.message);
    // Fallback a productos por defecto si Firebase falla
    if (store.products.length === 0) store.products = DEFAULT_PRODUCTS;
  }

  store.initialized = true;
  emit('ready', store);
}

// Sube los productos por defecto a Firebase en la primera ejecución
async function seedProducts() {
  for (const p of DEFAULT_PRODUCTS) {
    try { await fbSaveProduct(p); } catch(e) {}
  }
}

// =============================================
// PRODUCTOS
// =============================================
export async function saveProduct(product) {
  const id = await fbSaveProduct(product);
  const saved = { ...product, id };
  const idx = store.products.findIndex(p => p.id === saved.id);
  if (idx > -1) store.products[idx] = saved;
  else store.products.push(saved);
  emit('products', store.products);
  return id;
}

export async function deleteProduct(id) {
  await fbDeleteProduct(id);
  store.products = store.products.filter(p => p.id !== id);
  emit('products', store.products);
}

export async function updateStock(id, delta) {
  const p = store.products.find(pr => pr.id === id);
  if (!p) return;
  p.stock = Math.max(0, p.stock + delta);
  await fbSaveProduct(p);
  emit('products', store.products);
}

// =============================================
// CARRITO
// =============================================
export function addToCart(product, size, color) {
  const key = `${product.id}-${size}-${color}`;
  const existing = store.cart.find(i => i.key === key);
  if (existing) { existing.qty++; }
  else { store.cart.push({ key, productId: product.id, name: product.name, price: product.price, size, color, qty: 1, img: product.img }); }
  lsSave(LS.cart, store.cart);
  emit('cart', store.cart);
}

export function removeFromCart(key) {
  store.cart = store.cart.filter(i => i.key !== key);
  lsSave(LS.cart, store.cart);
  emit('cart', store.cart);
}

export function updateCartQty(key, delta) {
  const item = store.cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(key);
  else { lsSave(LS.cart, store.cart); emit('cart', store.cart); }
}

export function clearCart() {
  store.cart = [];
  lsSave(LS.cart, []);
  emit('cart', []);
}

export function cartTotal() {
  return store.cart.reduce((s, i) => s + i.price * i.qty, 0);
}

export function cartCount() {
  return store.cart.reduce((s, i) => s + i.qty, 0);
}

// =============================================
// PEDIDOS
// =============================================
export async function placeOrder(orderData) {
  const id = await fbSaveOrder(orderData);
  const order = { ...orderData, id };
  store.orders.unshift(order);
  clearCart();
  emit('orders', store.orders);
  return id;
}

export async function updateOrderStatus(id, status) {
  await fbUpdateOrderStatus(id, status);
  const order = store.orders.find(o => o.id === id);
  if (order) order.status = status;
  emit('orders', store.orders);
}

// =============================================
// BANNERS
// =============================================
export async function saveBanners(data) {
  Object.assign(store.banners, data);
  await fbSaveBanners(store.banners);
  emit('banners', store.banners);
}

// =============================================
// TRACKING
// =============================================
export async function saveTracking(orderId, data) {
  store.tracking[orderId] = data;
  await fbSaveTracking(orderId, data);
  emit('tracking', store.tracking);
}

// =============================================
// CONFIG MP / BANCO
// =============================================
export async function saveMPConfig(config) {
  store.mpConfig = config;
  await fbSaveConfig('mercadopago', config);
  emit('config', config);
}

// =============================================
// HELPERS
// =============================================
export function fmtPrice(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}
