const SVG_NS = 'http://www.w3.org/2000/svg';

const DOCK_COLORS = {
  'dock-dashboard': ['#3B82F6','#1E40AF'],
  'dock-orders':    ['#8B5CF6','#6D28D9'],
  'dock-customers': ['#34D399','#047857'],
  'dock-tracking':  ['#22D3EE','#0E7490'],
  'dock-inventory': ['#F59E0B','#B45309'],
  'dock-products':  ['#F472B6','#BE185D'],
  'dock-cobranzas': ['#EF4444','#B91C1C'],
  'dock-cupones':   ['#FB923C','#C2410C'],
  'dock-reportes':  ['#6366F1','#4338CA'],
  'dock-exit':      ['#9CA3AF','#4B5563'],
  'dock-config':    ['#6B7280','#374151'],
};

const DOCK_PATHS = {
  'dock-dashboard': 'M12 4a8 8 0 100 16 8 8 0 000-16zm1 4l-3 5-3-5',
  'dock-orders':    'M8 4h8l1 2v13a2 2 0 01-2 2H9a2 2 0 01-2-2V6l1-2zm2 8l2 2 4-4',
  'dock-customers': 'M9 10a3 3 0 100-6 3 3 0 000 6zm-5 9a5 5 0 0110 0m3-12a3 3 0 100-6 3 3 0 000 6zm3 12h-3',
  'dock-tracking':  'M12 2a10 10 0 110 20 10 10 0 010-20zm-2 14l8-4-8-4v8z',
  'dock-inventory': 'M4 6h16v2H4zm0 5h16v2H4zm0 5h12v2H4z',
  'dock-products':  'M12 4l-4 5h3v5h2V9h3l-4-5z',
  'dock-cobranzas': 'M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8zM6 8V6a2 2 0 012-2h12v2zM6 14a2 2 0 014 0',
  'dock-cupones':   'M8 2h10l4 4-8 8-6-6 4-4zm0 0l4 4',
  'dock-reportes':  'M6 14l4-4 4 4 6-6m-4 0h4v4',
  'dock-exit':      'M8 20H4V4h4m14 10l-4-4 4-4M10 12h10',
  'dock-config':    'M12 16a4 4 0 100-8 4 4 0 000 8zm0-8V4m0 12v4M8 12H4m12 0h4',
};

function dockGlassIcon(name, size = 22) {
  const colors = DOCK_COLORS[name];
  const path = DOCK_PATHS[name];
  if (!colors || !path) return '';
  const [c1, c2] = colors;
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 24 24" width="${size}" height="${size}"><defs><linearGradient id="g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fff" stop-opacity=".32"/><stop offset="40%" stop-color="#fff" stop-opacity=".04"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="1" y="1" width="22" height="22" rx="7" fill="url(#g)"/><rect x="1" y="1" width="22" height="10" rx="7" fill="url(#h)"/><rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="none" stroke="rgba(255,255,255,.16)" stroke-width=".5"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${path.split(/(?=M)/g).map(p => `<path d="${p.trim()}"/>`).join('')}</g></svg>`;
}

const ICONS = {
  home:       'M4 10l8-6 8 6v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8zM9 21v-9h6v9',
  search:     'M20 20l-5.5-5.5M14.5 9.5a5 5 0 11-10 0 5 5 0 0110 0z',
  cart:       'M5 4h14l2 4H4l1-4zM4 8h16l-1.5 10a2 2 0 01-2 2h-9a2 2 0 01-2-2L4 8zm5 4v5m6-5v5',
  account:    'M18 20v-2a4 4 0 00-4-4h-4a4 4 0 00-4 4v2M12 10a3 3 0 100-6 3 3 0 000 6z',
  theme:      'M12 4V2m0 20v-2m8-10h2M2 12h2m14.36-6.36l1.42-1.42M6.22 17.78l-1.42 1.42M17.78 17.78l1.42 1.42M6.22 6.22L4.8 4.8M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  language:   'M12 2a10 10 0 110 20 10 10 0 010-20zM2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z',
  menu:       'M5 7h14M5 12h14M5 17h14',
  close:      'M17 7l-10 10M7 7l10 10',
  arrowRight: 'M5 12h12m-5-5l5 5-5 5',
  arrowLeft:  'M19 12H7m5-5l-5 5 5 5',
  plus:       'M12 6v12M6 12h12',
  check:      'M6 12l4 4 8-8',
  minus:      'M6 12h12',
  trash:      'M4 7h16m-14 0v12a2 2 0 002 2h8a2 2 0 002-2V7M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2',
  save:       'M18 20H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2zm-6-6a2 2 0 100-4 2 2 0 000 4zm3 2v-3a1 1 0 00-1-1h-4a1 1 0 00-1 1v3',
  shipping:   'M3 15h2m14 0h2M8 15h8M3 12V6a2 2 0 012-2h8a2 2 0 012 2v6M3 12h12m0 0v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3z',
  returns:    'M2 5v5h5M22 19v-5h-5M4 9a9 9 0 0115-3l3 3M20 15a9 9 0 01-15 3l-3-3',
  payment:    'M4 8h16M4 8a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2',
  support:    'M19 13.5A7.5 7.5 0 014.5 6M4.5 6A7.5 7.5 0 0119 13.5M4.5 6L3 4.5M19 13.5L21 15M9 10.5h6M9 14h3',
  star:       'M12 3l2.2 4.5 5 .7-3.6 3.5.8 5-4.4-2.3-4.4 2.3.8-5L4.8 8.2l5-.7L12 3z',
  heart:      'M17.5 4.5a4.5 4.5 0 00-6.4 0L12 5.6l-.9-.9a4.5 4.5 0 10-6.4 6.4l.9.9L12 18.4l6.4-6.4.9-.9a4.5 4.5 0 000-6.4z',
  instagram:  'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 11a3 3 0 100-6 3 3 0 000 6zm4-8h.01',
  whatsapp:   'M18 5.5a9.5 9.5 0 01-12 14L3 21l1.5-3A9.5 9.5 0 0118 5.5zM9.5 9h.01M14.5 9h.01M9.5 13.5A4 4 0 0014.5 13.5',
  dashboard:  'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
  orders:     'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  customers:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zm9-3a3 3 0 100 6 3 3 0 000-6zm3 8.5V21M21 15l-3 3',
  tracking:   'M22 12h-4l-3 9L9 3l-3 9H2',
  inventory:  'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  products:   'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m4-2v8l3-3m-3 3l-3-3',
  wallet:     'M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zm-2 4h-4m0 0a2 2 0 110-4 2 2 0 010 4zM7 6h14l-3-4M3 10V6a2 2 0 012-2h12',
  coupon:     'M20 12a2 2 0 00-2-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 010 4v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 002-2zM9 9h.01M9 15h.01M13 9l-4 6',
  chart:      'M18 20V10M12 20V4M6 20v-6',
  store:      'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M9 22v-6h6v6',
  settings:   'M12 15a3 3 0 100-6 3 3 0 000 6zm-8.47-2.33a1.5 1.5 0 010-1.34l.43-.75a1.5 1.5 0 01.54-.54l.01-.01a1.5 1.5 0 00.54-2.05l-.43-.75a1.5 1.5 0 011.34-2.17h.86a1.5 1.5 0 001.5-1.5V4.5a1.5 1.5 0 013 0v.86a1.5 1.5 0 001.5 1.5h.86a1.5 1.5 0 011.34 2.17l-.43.75a1.5 1.5 0 00.54 2.05 4.5 4.5 0 010 2.34l-.43.75a1.5 1.5 0 01-.54.54 1.5 1.5 0 00-.54 2.05l.43.75a1.5 1.5 0 01-1.34 2.17h-.86a1.5 1.5 0 00-1.5 1.5v.86a1.5 1.5 0 01-3 0v-.86a1.5 1.5 0 00-1.5-1.5h-.86a1.5 1.5 0 01-1.34-2.17l.43-.75a1.5 1.5 0 00-.54-2.05 1.5 1.5 0 01-.54-.54l-.43-.75z',
  exclusive:  'M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 16l-5.5 4.5L8 13.5 3 9l6.5-.5L12 2z',
  new:        'M12 2l1.5 5.5L19 8l-4 3.5L16.5 17 12 13.5 7.5 17 9 11.5 5 8l5.5-.5L12 2z',
  accessories:'M12 2l.5 5.5L18 8l-4 3.5 1.5 5.5L12 13 8.5 17 10 11.5 6 8l5.5-.5L12 2z',
  photo:      'M15 8h.01M6 2h12a4 4 0 014 4v12a4 4 0 01-4 4H6a4 4 0 01-4-4V6a4 4 0 014-4zm2 14l3-4 2 2 3-4 4 6',
  info:       'M12 2a10 10 0 110 20 10 10 0 010-20zm0 6v4m0 4h.01',
  lock:       'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4',
  logout:     'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9',
  arrowUp:    'M12 19V5m-7 7l7-7 7 7',
  mail:       'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  send:       'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  download:   'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m7-10v10m-4-4l4 4 4-4',
  upload:     'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m14-7l-5-5-5 5m5-5v10',
  play:       'M5 3l14 9-14 9V3z',
  pause:      'M6 4h4v16H6V4zm8 0h4v16h-4V4z',
  refresh:    'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  arrowDown:  'M12 5v14m7-7l-7 7-7-7',
  tag:        'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  camera:     'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11zM12 16a3 3 0 100-6 3 3 0 000 6z',
  edit:       'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  share:      'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4m4 4V2',
  external:   'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3',
};

export function icon(name, size = 24) {
  return iconEl(name, size).outerHTML;
}

export function iconEl(name, size = 24) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = ICONS[name];
  if (!path) return svg;
  const parts = path.split(/(?=M)/g);
  parts.forEach(p => {
    const pathEl = document.createElementNS(SVG_NS, 'path');
    pathEl.setAttribute('d', p.trim());
    svg.appendChild(pathEl);
  });
  return svg;
}

const MAP = {
  shopping_bag: 'cart', account_circle: 'account', search: 'search',
  close: 'close', menu: 'menu', translate: 'language', palette: 'theme',
  arrow_forward: 'arrowRight', arrow_back: 'arrowLeft', add: 'plus',
  check: 'check', delete: 'trash', remove: 'minus',
  save: 'save', local_shipping: 'shipping', repeat: 'returns',
  lock: 'lock', support_agent: 'support', favorite_border: 'heart',
  star: 'star', info: 'info', logout: 'logout', arrow_upward: 'arrowUp',
  mail: 'mail', send: 'send', share: 'share', open_in_new: 'external',
  photo_camera: 'camera', edit: 'edit', refresh: 'refresh',
  cloud_upload: 'upload', download: 'download', play_arrow: 'play',
  pause: 'pause', local_offer: 'tag', dashboard: 'dashboard',
  payments: 'wallet', account_balance_wallet: 'wallet',
  credit_card: 'payment', swap_horiz: 'returns', receipt_long: 'orders',
  person_add: 'customers', schedule: 'info', inventory: 'inventory',
  package_2: 'products', photo_library: 'photo', campaign: 'info',
  category: 'dashboard', tune: 'settings', print: 'save',
  preview: 'search', list: 'menu', blur_on: 'theme', contrast: 'theme',
  videocam: 'play', image: 'photo', sync: 'refresh',
  dock_to_bottom: 'arrowDown', vertical_align_bottom: 'arrowDown',
  vertical_align_top: 'arrowUp', check_circle: 'check',
  mark_email_unread: 'mail', mark_email_read: 'mail', login: 'arrowRight',
  receipt: 'orders', horizontal_rule: 'minus', location_on: 'tracking',
  credit_card_off: 'payment', email: 'mail', lock_reset: 'refresh',
  package: 'products', delete_sweep: 'trash', cloud_off: 'upload',
  warning: 'info', search_off: 'search', replay: 'returns',
  backspace: 'close', add_box: 'plus', add_circle: 'plus',
  photo: 'camera',
};

const LUCIDE_MAP = {
  gauge: 'dock-dashboard', 'clipboard-check': 'dock-orders',
  'users-round': 'dock-customers', compass: 'dock-tracking',
  shelves: 'dock-inventory', shirt: 'dock-products',
  wallet: 'dock-cobranzas', tag: 'dock-cupones',
  'trending-up': 'dock-reportes', store: 'store',
  cog: 'dock-config', 'door-arrow-left': 'dock-exit',
};

function getIconSize(el) {
  const style = window.getComputedStyle(el);
  const fontSize = parseFloat(style.fontSize);
  if (fontSize && !isNaN(fontSize) && fontSize > 0) return Math.round(fontSize);
  const match = el.className.match(/text-\[(\d+)px\]/);
  if (match) return parseInt(match[1]);
  const inlineMatch = el.style.fontSize && el.style.fontSize.match(/(\d+)px/);
  if (inlineMatch) return parseInt(inlineMatch[1]);
  return 22;
}

export function replaceIcons() {
  document.querySelectorAll('.material-symbols-outlined:not(.xinco-icon-replaced)').forEach(el => {
    const name = el.textContent.trim().toLowerCase();
    const mapped = MAP[name];
    if (!mapped || !ICONS[mapped]) return;
    const size = getIconSize(el);
    const svgStr = icon(mapped, size);
    const wrapper = document.createElement('span');
    wrapper.className = el.className + ' xinco-icon-replaced';
    wrapper.style.cssText = el.style.cssText;
    wrapper.innerHTML = svgStr;
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = wrapper.style.height = size + 'px';
    wrapper.style.fontSize = '0';
    el.replaceWith(wrapper);
  });

  document.querySelectorAll('[data-lucide]:not(.xinco-icon-replaced)').forEach(el => {
    const name = el.getAttribute('data-lucide');
    const mapped = LUCIDE_MAP[name];
    if (!mapped || !ICONS[mapped]) return;
    const size = parseInt(el.getAttribute('width')) || parseInt(el.style.width) || 22;
    const isDock = !!DOCK_PATHS[mapped];
    const svgStr = isDock ? dockGlassIcon(mapped, size) : icon(mapped, size);
    const wrapper = document.createElement('span');
    wrapper.className = el.className + ' xinco-icon-replaced';
    wrapper.style.cssText = el.style.cssText;
    wrapper.innerHTML = svgStr;
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = wrapper.style.height = size + 'px';
    if (isDock) wrapper.style.setProperty('--item-accent', DOCK_COLORS[mapped][0]);
    el.replaceWith(wrapper);
  });
}

export function init() {
  window.xincoIcon = icon;
  window.xincoIconEl = iconEl;
  window.replaceIcons = replaceIcons;

  const run = () => {
    replaceIcons();
    setTimeout(replaceIcons, 300);
    setTimeout(replaceIcons, 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  const observer = new MutationObserver(() => replaceIcons());
  observer.observe(document.body, { childList: true, subtree: true });
}
