// =============================================
// XINCO — js/auth.js
// Login, Registro, Sesión
// =============================================

import { fbLogin, fbRegister, fbLogout } from './firebase.js';
import { store } from './store.js';
import { showToast, updateAuthUI } from './ui.js';

export async function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-pass')?.value;
  const err   = document.getElementById('login-error');
  if (!email || !pass) { showToast('Completá email y contraseña'); return; }
  try {
    await fbLogin(email, pass);
    showToast('¡Bienvenido! 👋');
    // Admin hardcodeado por email
    const dest = email === 'admin@xinco.com' ? 'admin.html' : 'index.html';
    setTimeout(() => location.href = dest, 800);
  } catch(e) {
    if (err) { err.textContent = 'EMAIL O CONTRASEÑA INCORRECTOS'; err.classList.remove('hidden'); }
    showToast('Credenciales incorrectas ❌');
  }
}

export async function doRegister() {
  const nombre   = document.getElementById('reg-nombre')?.value.trim();
  const apellido = document.getElementById('reg-apellido')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim();
  const pass     = document.getElementById('reg-pass')?.value;
  const pass2    = document.getElementById('reg-pass2')?.value;
  const terms    = document.getElementById('reg-terms')?.checked;

  if (!nombre || !email || !pass) { showToast('Completá los campos obligatorios'); return; }
  if (pass !== pass2) { showToast('Las contraseñas no coinciden ❌'); return; }
  if (pass.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres'); return; }
  if (!terms) { showToast('Debés aceptar los Términos y Condiciones'); return; }

  try {
    const user = await fbRegister(email, pass);
    // Guardar nombre en displayName (opcional, requiere updateProfile)
    showToast(`¡Cuenta creada! Bienvenido, ${nombre}! 🎉`);
    setTimeout(() => location.href = 'index.html', 800);
  } catch(e) {
    const msg = e.code === 'auth/email-already-in-use'
      ? 'Ese email ya está registrado' : 'Error al crear la cuenta';
    showToast(msg + ' ❌');
  }
}

export async function doLogout() {
  await fbLogout();
  showToast('Sesión cerrada 👋');
  setTimeout(() => location.href = 'index.html', 600);
}

export function togglePass(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

export function requireAuth(redirectIfNot = 'login.html') {
  return new Promise(resolve => {
    // Esperar hasta que Firebase confirme el estado
    const unsub = store.listeners;
    if (store.user) { resolve(store.user); return; }
    const check = setInterval(() => {
      if (store.initialized) {
        clearInterval(check);
        if (store.user) resolve(store.user);
        else location.href = redirectIfNot;
      }
    }, 100);
  });
}

export function requireAdmin(redirectIfNot = 'login.html') {
  return requireAuth(redirectIfNot).then(user => {
    if (user.email !== 'admin@xinco.com') {
      location.href = redirectIfNot;
      throw new Error('Not admin');
    }
    return user;
  });
}
