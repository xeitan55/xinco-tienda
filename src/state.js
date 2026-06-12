let bannerState = {
  announcements: [
    { text: 'ENVÍO GRATIS SUPERANDO LOS $95.000', color: '#ffffff' },
    { text: 'NUEVA COLECCIÓN DISPONIBLE', color: '#ffffff' },
    { text: 'HASTA 30% OFF EN SELECCIONADOS', color: '#ffffff' }
  ],
  hero: {
    badge: 'NUEVA COLECCIÓN',
    title: 'XINCO',
    subtitle: 'Donde el estilo define tu identidad',
    img: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1800&q=80',
    videoUrl: '',
    animStyle: 'default',
    videoEffect: 'none',
    modelPosX: 22,
    modelPosY: 32,
    modelScale: 2.2,
    modelFrontLight: 0.85,
    modelBackLight: 0.3,
    modelAuraStyle: 'glow',
    modelAuraColor: '#ffffff'
  },
  promo: {
    enabled: false,
    label: 'OFERTA LIMITADA',
    title: '30% OFF\nEN BUZOS',
    code: 'URBAN30'
  },
  categories: []
};

const PRODUCTS = [
  {id:1, name:'ARCHIVE HEAVY TEE', price:14500, oldPrice:null, cat:'remeras', badge:'NUEVO', desc:'Remera oversized de algodón 300g. Corte boxy, costuras reforzadas. El básico definitivo.', sizes:['S','M','L','XL'], colors:['negro','blanco'], stock:45, sku:'XNC-REM-001', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80', images:['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80','https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'], tags:['newdrops','esenciales']},
  {id:2, name:'TACTICAL CARGO PANT', price:28900, oldPrice:38000, cat:'pantalones', badge:'SALE', desc:'Cargo técnico con 8 bolsillos. Tela ripstop resistente al agua. Para la calle y más allá.', sizes:['M','L','XL'], colors:['negro','gris'], stock:18, sku:'XNC-PAN-002', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80', images:['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80','https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80'], tags:['esenciales']},
  {id:3, name:'XINCO 01 HOODIE', price:42000, oldPrice:null, cat:'buzos', badge:'DROP EXCLUSIVO', desc:'Buzo pesado con capucha ajustable. Bordado frontal. Fabricado localmente en Argentina.', sizes:['S','M','L','XL','XXL'], colors:['negro','violeta'], stock:30, sku:'XNC-BUZ-003', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80', images:['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80','https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80','https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80'], tags:['newdrops','stylo']},
  {id:4, name:'SIGNAL TRACK JACKET', price:55000, oldPrice:null, cat:'camperas', badge:'NUEVO', desc:'Campera track con detalles violeta. Tela técnica anti-viento. Diseño exclusivo.', sizes:['S','M','L'], colors:['negro','violeta'], stock:12, sku:'XNC-CAM-004', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', images:['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80','https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'], tags:['newdrops','stylo']},
  {id:5, name:'MONO LOGO TEE', price:12000, oldPrice:15000, cat:'remeras', badge:'SALE', desc:'Remera slim con logo monocromático. Algodón peinado suave. Clásica y versátil.', sizes:['XS','S','M','L','XL'], colors:['blanco','negro','gris'], stock:60, sku:'XNC-REM-005', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80', images:['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80','https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80'], tags:['esenciales']},
  {id:6, name:'STREET JOGGER V2', price:22000, oldPrice:null, cat:'pantalones', badge:null, desc:'Jogging con puños en las piernas y pretina ancha. Para moverse sin límites.', sizes:['S','M','L','XL'], colors:['negro','gris'], stock:25, sku:'XNC-PAN-006', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80', images:['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80','https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80'], tags:['esenciales']},
  {id:7, name:'NOIR ZIP HOODIE', price:38000, oldPrice:45000, cat:'buzos', badge:'SALE', desc:'Buzo con cierre completo. Interior polar. Bolsillos kangaroo. Ideal para invierno.', sizes:['M','L','XL','XXL'], colors:['negro'], stock:8, sku:'XNC-BUZ-007', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80', images:['https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80','https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'], tags:['stylo']},
  {id:8, name:'XINCO CAP 01', price:8500, oldPrice:null, cat:'accesorios', badge:'NEW', desc:'Gorra snapback con bordado frontal. Panel estructurado. Ajuste universal.', sizes:['U'], colors:['negro','blanco'], stock:80, sku:'XNC-ACC-008', rating:0, reviews:0, img:'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', images:['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80'], tags:['esenciales','newdrops']},
];

let ORDERS = [
  {id:'ORD-001', customer:'Alexander Pierce', email:'alex@mail.com', date:'24 Oct 2025', total:45000, status:'pending', items:[{name:'XINCO 01 HOODIE', qty:1, price:42000},{name:'XINCO CAP 01', qty:1, price:8500}]},
  {id:'ORD-002', customer:'Sarah Jenkins', email:'sarah@mail.com', date:'24 Oct 2025', total:12500, status:'shipped', items:[{name:'MONO LOGO TEE', qty:1, price:12000}]},
  {id:'ORD-003', customer:'Marcus Reed', email:'marcus@mail.com', date:'23 Oct 2025', total:89000, status:'shipped', items:[{name:'SIGNAL TRACK JACKET', qty:1, price:55000},{name:'TACTICAL CARGO PANT', qty:1, price:28900}]},
  {id:'ORD-004', customer:'Elena Costa', email:'elena@mail.com', date:'23 Oct 2025', total:14500, status:'pending', items:[{name:'ARCHIVE HEAVY TEE', qty:1, price:14500}]},
  {id:'ORD-005', customer:'Juan García', email:'juan@mail.com', date:'22 Oct 2025', total:60000, status:'delivered', items:[{name:'NOIR ZIP HOODIE', qty:1, price:38000},{name:'STREET JOGGER V2', qty:1, price:22000}]},
];

let CUSTOMERS = [
  {id:1, name:'Alexander Pierce', email:'alex@mail.com', orders:3, total:125000, date:'Oct 2025'},
  {id:2, name:'Sarah Jenkins', email:'sarah@mail.com', orders:1, total:12500, date:'Oct 2025'},
  {id:3, name:'Marcus Reed', email:'marcus@mail.com', orders:2, total:134000, date:'Oct 2025'},
  {id:4, name:'Elena Costa', email:'elena@mail.com', orders:1, total:14500, date:'Oct 2025'},
  {id:5, name:'Juan García', email:'juan@mail.com', orders:1, total:60000, date:'Oct 2025'},
];

let state = {
  currentPage: 'home',
  cart: [],
  user: null,
  currentProduct: null,
  selectedSize: null,
  selectedColor: null,
  filterCat: [],
  filterSizes: [],
  filterColors: [],
  filterPrice: 200000,
  sortOrder: 'default',
  products: [],
  orders: [],
  coupons: [],
  adminSection: 'dashboard'
};

const AVAILABLE_COLORS = [
  { id:'blanco',   hex:'#ffffff', label:'BLANCO' },
  { id:'negro',    hex:'#000000', label:'NEGRO' },
  { id:'gris',     hex:'#9ca3af', label:'GRIS' },
  { id:'violeta',  hex:'#5d22ff', label:'VIOLETA' },
  { id:'rojo',     hex:'#ef4444', label:'ROJO' },
  { id:'azul',     hex:'#3b82f6', label:'AZUL' },
  { id:'verde',    hex:'#22c55e', label:'VERDE' },
  { id:'rosa',     hex:'#ec4899', label:'ROSA' },
  { id:'marron',   hex:'#92400e', label:'MARRÓN' },
  { id:'naranja',  hex:'#f97316', label:'NARANJA' },
  { id:'amarillo', hex:'#eab308', label:'AMARILLO' },
  { id:'beige',    hex:'#d4b896', label:'BEIGE' },
];

const EMAILJS = {
  serviceId:  'service_x844xxw',
  templateId: 'XINCO-VERICATION',
};

const CLOUDINARY = {
  cloudName: 'damwe7juy',
  uploadPreset: 'XINCO TIENDA',
  uploadUrl: function() { return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`; },
  uploadVideoUrl: function() { return `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`; }
};

const DB_KEYS = {
  cart: 'xinco_cart',
};

export function init() {
  window.bannerState = bannerState;
  window.PRODUCTS = PRODUCTS;
  window.ORDERS = ORDERS;
  window.CUSTOMERS = CUSTOMERS;
  window.state = state;
  window.AVAILABLE_COLORS = AVAILABLE_COLORS;
  window.EMAILJS = EMAILJS;
  window.CLOUDINARY = CLOUDINARY;
  window.DB_KEYS = DB_KEYS;
  window.coupons = state.coupons;
}

export { bannerState, state, PRODUCTS, ORDERS, CUSTOMERS, AVAILABLE_COLORS, EMAILJS, CLOUDINARY, DB_KEYS };
