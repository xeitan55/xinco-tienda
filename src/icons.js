const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  home:       'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  search:     'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  cart:       'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  account:    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
  theme:      'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  language:   'M12 2a10 10 0 110 20 10 10 0 010-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  menu:       'M4 6h16M4 12h16M4 18h16',
  close:      'M18 6L6 18M6 6l12 12',
  arrowRight: 'M5 12h14m-6-6l6 6-6 6',
  arrowLeft:  'M19 12H5m6-6l-6 6 6 6',
  plus:       'M12 5v14m-7-7h14',
  check:      'M5 13l4 4L19 7',
  minus:      'M5 12h14',
  trash:      'M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  save:       'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zm-7-8a3 3 0 100-6 3 3 0 000 6zm4 4v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4',
  shipping:   'M3 17h2m14 0h2M9 17h6M3 13V5a2 2 0 012-2h10a2 2 0 012 2v8m-14 0h14m0 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z',
  returns:    'M1 4v6h6M23 20v-6h-6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  payment:    'M3 10h18M3 6h18M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z',
  support:    'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10zM8 9h8M8 13h5',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart:      'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  instagram:  'M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5zm0 0v0M12 16a4 4 0 100-8 4 4 0 000 8zm5-11h.01',
  whatsapp:   'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
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
  settings:   'M12 15a3 3 0 100-6 3 3 0 000 6zm0 0v0m-8.47-2.33a1.5 1.5 0 010-1.34l.43-.75a1.5 1.5 0 01.54-.54l.01-.01a1.5 1.5 0 00.54-2.05l-.43-.75a1.5 1.5 0 011.34-2.17h.86a1.5 1.5 0 001.5-1.5V4.5a1.5 1.5 0 013 0v.86a1.5 1.5 0 001.5 1.5h.86a1.5 1.5 0 011.34 2.17l-.43.75a1.5 1.5 0 00.54 2.05 4.5 4.5 0 010 2.34l-.43.75a1.5 1.5 0 01-.54.54 1.5 1.5 0 00-.54 2.05l.43.75a1.5 1.5 0 01-1.34 2.17h-.86a1.5 1.5 0 00-1.5 1.5v.86a1.5 1.5 0 01-3 0v-.86a1.5 1.5 0 00-1.5-1.5h-.86a1.5 1.5 0 01-1.34-2.17l.43-.75a1.5 1.5 0 00-.54-2.05 1.5 1.5 0 01-.54-.54l-.43-.75z',
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
  svg.setAttribute('stroke-width', '2');
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
  'layout-dashboard': 'dashboard', 'shopping-bag': 'orders',
  users: 'customers', truck: 'tracking', boxes: 'inventory',
  package: 'products', 'credit-card': 'payment', percent: 'coupon',
  'bar-chart-3': 'chart', store: 'store', settings: 'settings',
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
    const svgStr = icon(mapped, size);
    const wrapper = document.createElement('span');
    wrapper.className = el.className + ' xinco-icon-replaced';
    wrapper.style.cssText = el.style.cssText;
    wrapper.innerHTML = svgStr;
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = wrapper.style.height = size + 'px';
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
