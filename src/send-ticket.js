import emailjs from '@emailjs/browser';
import { state } from './firebase.js';

const EJ_KEY = 'xinco_emailjs';

const EJ_DEFAULTS = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

function loadEmailJsConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(EJ_KEY)) || {};
    return { ...EJ_DEFAULTS, ...stored };
  } catch(e) { return EJ_DEFAULTS; }
}

export function saveEmailJsConfig(serviceId, templateId, publicKey) {
  const cfg = { serviceId, templateId, publicKey };
  localStorage.setItem(EJ_KEY, JSON.stringify(cfg));
  (async () => {
    const ready = await window.waitForFirebase();
    if (!ready || !window._fb || !window.fbDb) return;
    try {
      const { doc, setDoc } = window._fb;
      await setDoc(doc(window.fbDb, 'config', 'emailjs'), cfg, { merge: true });
    } catch(e) { console.warn('saveEmailJsConfig firebase:', e); }
  })();
  return cfg;
}

export async function loadEmailJsConfigFromFirebase() {
  try {
    const ready = await window.waitForFirebase();
    if (!ready || !window._fb || !window.fbDb) return;
    const { doc, getDoc } = window._fb;
    const snap = await getDoc(doc(window.fbDb, 'config', 'emailjs'));
    if (snap.exists()) {
      const d = snap.data();
      if (d.serviceId && d.templateId && d.publicKey) {
        localStorage.setItem(EJ_KEY, JSON.stringify(d));
        return d;
      }
    }
  } catch(e) { console.warn('loadEmailJsConfig firebase:', e); }
  return loadEmailJsConfig();
}

export async function sendTicket() {
  const order = state.orders[0];
  if (!order || !order.email) return;

  const cfg = loadEmailJsConfig();
  if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
    console.log('sendTicket: EmailJS no configurado');
    return;
  }

  const itemsList = (order.items || []).map(i =>
    `${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-AR')}`
  ).join('\n');

  const total = order.total || 0;
  const payLabel = order.payMethod === 'card' ? 'TARJETA' : 'MERCADO PAGO';

  try {
    await emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email: order.email,
      to_name: order.customer,
      order_id: order.id,
      order_date: order.date || new Date().toLocaleDateString('es-AR'),
      items: itemsList,
      total: '$' + total.toLocaleString('es-AR'),
      pay_method: payLabel,
      customer: order.customer,
    }, cfg.publicKey);

    console.log('✅ Ticket enviado a', order.email);
  } catch(e) {
    console.warn('sendTicket error (no bloquea):', e);
  }
}

export function renderTicketDetail() {
  const order = state.orders[0];
  if (!order) return;

  const container = document.getElementById('ticket-items');
  if (!container) return;

  container.innerHTML = (order.items || []).map(i => `
    <div class="flex justify-between items-center py-3 border-b border-gray-200 text-[13px]">
      <span class="text-black font-medium">${i.name}</span>
      <span class="text-gray-500">x${i.qty}</span>
      <span class="text-black font-semibold">${window.fmtPrice?.(i.price * i.qty) || '$' + (i.price * i.qty)}</span>
    </div>
  `).join('');

  const payLabel = order.payMethod === 'card' ? 'TARJETA' : 'MERCADO PAGO';
  document.getElementById('ticket-paymethod').textContent = payLabel;
  document.getElementById('ticket-total').innerHTML = `
    <span class="text-lg font-bold">${window.fmtPrice?.(order.total) || '$' + order.total}</span>
    <span class="text-[10px] text-gray-500 ml-2">${order.shippingLabel || 'Envío: a calcular'}</span>
  `;
}

export function init() {
  window.sendTicket = sendTicket;
  window.renderTicketDetail = renderTicketDetail;
  window.saveEmailJsConfig = saveEmailJsConfig;
  window.loadEmailJsConfigFromFirebase = loadEmailJsConfigFromFirebase;
  window.saveEmailJsConfigFromPanel = saveEmailJsConfigFromPanel;
  window.loadEmailJsIntoForm = loadEmailJsIntoForm;
  // Load EmailJS config from Firebase on startup
  setTimeout(() => loadEmailJsConfigFromFirebase(), 1000);
}

export function saveEmailJsConfigFromPanel() {
  const serviceId = document.getElementById('ej-service-id')?.value.trim();
  const templateId = document.getElementById('ej-template-id')?.value.trim();
  const publicKey = document.getElementById('ej-public-key')?.value.trim();
  if (!serviceId || !templateId || !publicKey) {
    window.showToast?.('Completá todos los campos de EmailJS ❌');
    return;
  }
  saveEmailJsConfig(serviceId, templateId, publicKey);
  window.showToast?.('✅ EmailJS configurado');
}

export function loadEmailJsIntoForm() {
  const cfg = loadEmailJsConfig();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('ej-service-id', cfg.serviceId);
  set('ej-template-id', cfg.templateId);
  set('ej-public-key', cfg.publicKey);
}
