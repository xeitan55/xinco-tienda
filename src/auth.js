import { state, fbDb, fbAuth, fbLoginUser, fbLogoutUser } from './firebase.js';

let _lastRegisteredUser = null;

export async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const remember = document.getElementById('login-remember')?.checked !== false;
  const err = document.getElementById('login-error');
  const verWarn = document.getElementById('login-verify-warning');

  if (!email || !pass) { window.showToast?.('Completá email y contraseña'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { window.showToast?.('El email no tiene un formato válido '); return; }

  const btn = document.querySelector('#page-login .btn-primary');
  if (btn) { btn.textContent = 'CONECTANDO...'; btn.disabled = true; }

  try {
    if (!fbAuth || !window._fb) {
      if (btn) btn.textContent = 'INICIANDO FIREBASE...';
      const { initFirebase } = await import('./firebase.js');
      await initFirebase();
    }
    if (btn) btn.textContent = 'INGRESANDO...';

    const { setPersistence, browserLocalPersistence, browserSessionPersistence } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await setPersistence(fbAuth, remember ? browserLocalPersistence : browserSessionPersistence);

    const user = await fbLoginUser(email, pass);
    const idToken = await user.getIdTokenResult();
    const { isAdmin } = await import('./admin.js');
    const isAdminUser = idToken.claims.admin === true || isAdmin(user);
    if (!user.emailVerified && !isAdminUser) {
      if (verWarn) verWarn.classList.remove('hidden');
      if (err) { err.textContent = 'DEBÉS VERIFICAR TU EMAIL ANTES DE INICIAR SESIÓN'; err.classList.remove('hidden'); }
      if (btn) { btn.textContent = 'INICIAR SESIÓN'; btn.disabled = false; }
      return;
    }

    state.user = user;
    await updateAuthUI();
    if (err) err.classList.add('hidden');
    if (verWarn) verWarn.classList.add('hidden');
    if (btn) { btn.textContent = 'INICIAR SESIÓN'; btn.disabled = false; }
    window.showToast?.('¡Bienvenido! 👋');
    const { nav } = await import('./router.js');
    if (isAdminUser) nav('admin');
    else nav('home');
  } catch(e) {
    if (btn) { btn.textContent = 'INICIAR SESIÓN'; btn.disabled = false; }
    let msg = 'EMAIL O CONTRASEÑA INCORRECTOS';
    if (e.code === 'auth/user-not-found')     msg = 'NO EXISTE UNA CUENTA CON ESE EMAIL';
    if (e.code === 'auth/wrong-password')     msg = 'CONTRASEÑA INCORRECTA';
    if (e.code === 'auth/invalid-credential') msg = 'EMAIL O CONTRASEÑA INCORRECTOS';
    if (e.code === 'auth/too-many-requests')  msg = 'DEMASIADOS INTENTOS — ESPERÁ UNOS MINUTOS';
    if (e.code === 'auth/invalid-email')      msg = 'EL EMAIL NO ES VÁLIDO';
    if (e.message === 'Firebase no disponible') msg = 'ERROR DE CONEXIÓN — RECARGÁ LA PÁGINA';
    if (err) { err.textContent = msg; err.classList.remove('hidden'); }
    window.showToast?.(msg + ' ');
  }
}

export async function doRegister() {
  const nombre = document.getElementById('reg-nombre').value.trim();
  const apellido = document.getElementById('reg-apellido').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const terms = document.getElementById('reg-terms').checked;
  const errEl = document.getElementById('reg-error');

  function showRegError(msg) {
    if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
    window.showToast?.(msg + ' ');
  }

  if (!nombre)  { showRegError('INGRESÁ TU NOMBRE'); return; }
  if (!apellido){ showRegError('INGRESÁ TU APELLIDO'); return; }
  if (!email)   { showRegError('INGRESÁ TU EMAIL'); return; }
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) { showRegError('EL EMAIL NO TIENE UN FORMATO VÁLIDO'); return; }
  const fakeDomains = ['test.com','fake.com','asdf.com','abc.com','xxx.com','aaa.com','bbb.com','ccc.com','mailinator.com','guerrillamail.com','tempmail.com','throwam.com','yopmail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (fakeDomains.includes(domain)) { showRegError('USÁ UN EMAIL REAL Y VÁLIDO'); return; }
  if (pass.length < 8)              { showRegError('LA CONTRASEÑA DEBE TENER AL MENOS 8 CARACTERES'); return; }
  if (!/[A-Z]/.test(pass))          { showRegError('LA CONTRASEÑA DEBE TENER AL MENOS UNA MAYÚSCULA'); return; }
  if (!/[0-9]/.test(pass))          { showRegError('LA CONTRASEÑA DEBE TENER AL MENOS UN NÚMERO'); return; }
  if (pass !== pass2)               { showRegError('LAS CONTRASEÑAS NO COINCIDEN'); return; }
  if (!terms)                       { showRegError('DEBÉS ACEPTAR LOS TÉRMINOS Y CONDICIONES'); return; }

  const btn = document.getElementById('reg-submit-btn');
  if (btn) { btn.textContent = 'CREANDO CUENTA...'; btn.disabled = true; }
  if (errEl) errEl.classList.add('hidden');

  try {
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const cred = await createUserWithEmailAndPassword(fbAuth, email, pass);
    const user = cred.user;
    await updateProfile(user, { displayName: nombre + ' ' + apellido });
    const ADMIN_EMAIL = atob('YWRtaW5AeGluY28uY29t');
    if (email !== ADMIN_EMAIL) {
      await sendEmailVerification(user);
    }
    const fullName = nombre + ' ' + apellido;
    _lastRegisteredUser = { email, name: fullName };
    state.user = user;
    await updateAuthUI();
    document.getElementById('register-form-panel').classList.add('hidden');
    document.getElementById('register-success-panel').classList.remove('hidden');
    document.getElementById('reg-resend-btn')?.classList.remove('hidden');
    const sentEl = document.getElementById('reg-sent-email');
    if (sentEl) sentEl.textContent = email;
  } catch(e) {
    if (btn) { btn.textContent = 'CREAR CUENTA'; btn.disabled = false; }
    let msg = 'ERROR AL CREAR LA CUENTA';
    if (e.code === 'auth/email-already-in-use') msg = 'ESE EMAIL YA TIENE UNA CUENTA REGISTRADA';
    if (e.code === 'auth/invalid-email')        msg = 'EL EMAIL NO ES VÁLIDO';
    if (e.code === 'auth/weak-password')        msg = 'LA CONTRASEÑA ES MUY DÉBIL';
    if (e.code === 'auth/network-request-failed') msg = 'ERROR DE CONEXIÓN — VERIFICÁ TU INTERNET';
    showRegError(msg);
  }
}

export async function resendVerificationEmail() {
  if (fbAuth?.currentUser && !fbAuth.currentUser.emailVerified) {
    try {
      const { sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      await sendEmailVerification(fbAuth.currentUser, { url: 'https://xinco.shop/verificar-email' });
      window.showToast?.(' Email de verificación reenviado — revisá tu bandeja');
    } catch(e) {
      console.error('resendVerificationEmail:', e);
      window.showToast?.(' Error al reenviar: ' + (e.message || e.code));
    }
    return;
  }
  // Fallback: try with stored email from registration
  if (_lastRegisteredUser?.email) {
    try {
      const { sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      const user = fbAuth?.currentUser;
      if (user) {
      await sendEmailVerification(user, { url: 'https://xinco.shop/verificar-email' });
        window.showToast?.(' Email de verificación reenviado');
        return;
      }
    } catch(e) {}
  }
  window.showToast?.('Revisá tu bandeja o registrate nuevamente');
}

export async function doLogout() {
  await fbLogoutUser();
  state.user = null;
  await updateAuthUI();
  window.showToast?.('Sesión cerrada 👋');
  const { nav } = await import('./router.js');
  nav('home');
}

export async function updateAuthUI() {
  const label = document.getElementById('auth-label');
  const panelBtn = document.getElementById('admin-panel-btn');
  const dropdown = document.getElementById('auth-dropdown');
  const wrapper = document.getElementById('auth-wrapper');
  const { isAdmin } = await import('./admin.js');
  const admin = state.user && await isAdmin();
  if (state.user) {
    if (label) label.textContent = admin ? 'ADMIN' : (state.user.displayName || state.user.name || state.user.email?.split('@')[0] || 'USUARIO').split(' ')[0].toUpperCase();
    if (panelBtn) panelBtn.classList.toggle('hidden', !admin);
  } else {
    if (label) label.textContent = 'ACCEDER';
    if (panelBtn) panelBtn.classList.add('hidden');
    if (dropdown) dropdown.classList.add('hidden');
  }
}

export async function doLoginGoogle() {
  try {
    const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(fbAuth, provider);
    state.user = result.user;
    await updateAuthUI();
    window.showToast?.(`¡Bienvenido, ${result.user.displayName || result.user.email}! 👋`);
    const { nav } = await import('./router.js');
    nav('home');
  } catch(e) {
    if (e.code === 'auth/popup-closed-by-user') return;
    if (e.code === 'auth/popup-blocked') window.showToast?.('El popup fue bloqueado. Permitilo en tu navegador ');
    else if (!fbAuth) window.showToast?.('Firebase no disponible. Usá email y contraseña ');
    else window.showToast?.('Error al iniciar con Google: ' + (e.message || e.code) + ' ');
  }
}

export async function showForgotPassword() {
  const email = document.getElementById('login-email')?.value.trim();
  if (!email) { window.showToast?.('Ingresá tu email arriba primero'); return; }
  try {
    const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await sendPasswordResetEmail(fbAuth, email);
    window.showToast?.('¡Email de recuperación enviado! Revisá tu bandeja 📧');
  } catch(e) {
    window.showToast?.('Error: ' + (e.code === 'auth/user-not-found' ? 'Email no registrado' : e.message) + ' ');
  }
}

export function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

export function validateEmailField() {
  const email = document.getElementById('reg-email').value.trim();
  const icon = document.getElementById('reg-email-icon');
  const hint = document.getElementById('reg-email-hint');
  if (!email) { icon?.classList.add('hidden'); hint?.classList.add('hidden'); return; }
  const valid = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
  const fakeDomains = ['test.com','fake.com','asdf.com','abc.com','mailinator.com','guerrillamail.com','tempmail.com','yopmail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  const isFake = fakeDomains.includes(domain);
  icon?.classList.remove('hidden');
  hint?.classList.remove('hidden');
  if (!valid || isFake) {
    if (icon) { icon.textContent = 'cancel'; icon.style.color = '#ba1a1a'; }
    if (hint) { hint.textContent = isFake ? 'USÁ UN EMAIL REAL' : 'FORMATO DE EMAIL INVÁLIDO'; hint.style.color = '#ba1a1a'; }
  } else {
    if (icon) { icon.textContent = 'check_circle'; icon.style.color = '#2e7d32'; }
    if (hint) { hint.textContent = 'EMAIL VÁLIDO'; hint.style.color = '#2e7d32'; }
  }
}

export function checkPasswordStrength() {
  const pass  = document.getElementById('reg-pass').value;
  const bars  = [1,2,3,4].map(i => document.getElementById('str-bar-'+i));
  const label = document.getElementById('str-label');
  let score = 0;
  if (pass.length >= 8)  score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const colors = ['#ba1a1a','#e65100','#f9a825','#2e7d32'];
  const labels = ['MUY DÉBIL','DÉBIL','BUENA','FUERTE'];
  bars.forEach((b,i) => {
    if (!b) return;
    b.style.background = i < score ? colors[score-1] : '#cfc4c5';
  });
  if (label) {
    label.textContent = pass ? labels[Math.max(0,score-1)] : '';
    label.style.color = pass ? colors[Math.max(0,score-1)] : '#4c4546';
  }
  checkPasswordMatch();
}

export function checkPasswordMatch() {
  const p1 = document.getElementById('reg-pass').value;
  const p2 = document.getElementById('reg-pass2').value;
  const el = document.getElementById('reg-pass-match');
  if (!el || !p2) { el?.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  if (p1 === p2) { el.textContent = '✓ LAS CONTRASEÑAS COINCIDEN'; el.style.color = '#2e7d32'; }
  else { el.textContent = '✗ LAS CONTRASEÑAS NO COINCIDEN'; el.style.color = '#ba1a1a'; }
}

// ---- Account Page ----
export async function renderAccountPage() {
  if (!state.user) { import('./router.js').then(m => m.nav('login')); return; }
  const email = state.user.email || '';
  const name = state.user.displayName || state.user.name || email.split('@')[0] || 'USUARIO';
  const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const avatarImg = document.getElementById('account-avatar-img');
  const avatarInitials = document.getElementById('account-avatar-initials');
  if (state.user.photoURL) {
    avatarImg.src = state.user.photoURL;
    avatarImg.classList.remove('hidden');
    avatarInitials.classList.add('hidden');
  } else {
    avatarInitials.textContent = initials;
    avatarImg.classList.add('hidden');
    avatarInitials.classList.remove('hidden');
  }
  document.getElementById('account-name').textContent = name.toUpperCase();
  document.getElementById('account-email-disp').textContent = email;
  const since = state.user.metadata?.creationTime
    ? new Date(state.user.metadata.creationTime).toLocaleDateString('es-AR',{month:'long',year:'numeric'})
    : '';
  const sinceEl = document.getElementById('account-member-since');
  if (sinceEl && since) sinceEl.textContent = 'MIEMBRO DESDE ' + since.toUpperCase();
  const parts = name.split(' ');
  const inp = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
  inp('acc-nombre', parts[0]);
  inp('acc-apellido', parts.slice(1).join(' '));
  inp('acc-tel', state.user.phoneNumber || '');
  inp('acc-email-current', email);
  // Load profile fields from Firestore
  try {
    if (fbDb && window._fb && state.user?.uid) {
      const { doc, getDoc } = window._fb;
      const snap = await getDoc(doc(fbDb, 'users', state.user.uid));
      if (snap.exists()) {
        const data = snap.data();
        inp('acc-dni', data.dni);
        inp('acc-bday', data.birthday);
        inp('acc-genero', data.gender);
        if (Array.isArray(data.addresses)) { state.user.addresses = data.addresses; }
        if (data.displayName && !state.user.displayName) state.user.displayName = data.displayName;
      }
    }
  } catch(e) { console.warn('Error loading profile from Firestore:', e); }
  renderAddresses();
  const userOrders = state.orders.filter(o => o.email === email);
  const ordersEl = document.getElementById('account-orders-list');
  const emptyEl = document.getElementById('account-orders-empty');
  const countEl = document.getElementById('acc-orders-count');
  if (countEl) countEl.textContent = userOrders.length + ' PEDIDO' + (userOrders.length !== 1 ? 'S' : '');
  if (userOrders.length === 0) {
    emptyEl?.classList.remove('hidden');
    ordersEl?.classList.add('hidden');
  } else {
    emptyEl?.classList.add('hidden');
    ordersEl?.classList.remove('hidden');
    if (ordersEl) ordersEl.innerHTML = userOrders.map(o => `
      <div class="border-[3px] border-primary p-4 card-hover">
        <div class="flex justify-between items-start mb-3">
          <div>
            <span class="font-label-caps text-label-caps text-primary">#${o.id}</span>
            <span class="font-label-caps text-[10px] text-on-surface-variant ml-3">${o.date}</span>
          </div>
          <span class="badge ${o.status==='pending'?'badge-black':o.status==='shipped'?'badge-outline':'badge-violet'}">${o.status.toUpperCase()}</span>
        </div>
        <div class="font-body-md text-on-surface-variant text-sm mb-2">${(o.items||[]).map(i=>window.escapeHtml(i.name)).join(', ')}</div>
        <div class="flex justify-between items-center">
          <span class="font-label-caps text-label-caps text-primary">${window.fmtPrice?.(o.total) || '$' + o.total}</span>
          <span class="font-label-caps text-[10px] text-on-surface-variant">${o.payMethod ? o.payMethod.toUpperCase() : ''}</span>
        </div>
      </div>`).join('');
  }
}

export function showAccountTab(tab) {
  const newContent = document.getElementById('acc-content-'+tab);
  if (!newContent) return;

  document.querySelectorAll('[id^="acc-content-"]').forEach(c => {
    if (!c.classList.contains('hidden') && c !== newContent) {
      c.classList.add('tab-exit');
      setTimeout(() => {
        c.classList.add('hidden');
        c.classList.remove('tab-exit', 'tab-enter');
      }, 200);
    }
  });

  newContent.classList.remove('hidden');
  void newContent.offsetWidth;
  newContent.classList.remove('tab-exit');
  newContent.classList.add('tab-enter');

  ['orders','profile','security','datos'].forEach(t => {
    const btn = document.getElementById('acc-tab-'+t);
    if (btn) btn.classList.toggle('active', t === tab);
  });
}

export function validateProfileField(id) {
  const el = document.getElementById(id);
  const errEl = document.getElementById(id+'-err');
  if (!el || !errEl) return true;
  const val = el.value.trim();
  let msg = '';
  if (id === 'acc-nombre' && val.length < 2) msg = 'INGRESÁ UN NOMBRE VÁLIDO (MÍN. 2 CARACTERES)';
  if (id === 'acc-apellido' && val.length < 2) msg = 'INGRESÁ UN APELLIDO VÁLIDO';
  if (id === 'acc-tel' && val && !/^[\+\d\s\-\(\)]{7,20}$/.test(val)) msg = 'TELÉFONO INVÁLIDO';
  if (id === 'acc-dni' && val && !/^\d{7,8}$/.test(val.replace(/\./g,''))) msg = 'DNI DEBE TENER 7 U 8 DÍGITOS';
  if (id === 'acc-bday' && val) {
    const age = (new Date() - new Date(val)) / (1000*60*60*24*365);
    if (age < 13) msg = 'DEBÉS TENER AL MENOS 13 AÑOS';
    if (age > 120) msg = 'FECHA DE NACIMIENTO INVÁLIDA';
  }
  if (msg) { errEl.textContent = msg; errEl.classList.remove('hidden'); el.style.borderColor='#ba1a1a'; return false; }
  else { errEl.classList.add('hidden'); el.style.borderColor=''; return true; }
}

export async function saveProfile() {
  const fields = ['acc-nombre','acc-apellido','acc-tel','acc-dni','acc-bday'];
  let valid = true;
  fields.forEach(f => { if (!validateProfileField(f)) valid = false; });
  let nombre = document.getElementById('acc-nombre')?.value.trim();
  let apellido = document.getElementById('acc-apellido')?.value.trim();
  nombre = nombre?.replace(/<[^>]*>/g, '') || '';
  apellido = apellido?.replace(/<[^>]*>/g, '') || '';
  if (!nombre || !apellido) { window.showToast?.('NOMBRE Y APELLIDO SON OBLIGATORIOS '); return; }
  if (!valid) { window.showToast?.('CORREGÍ LOS CAMPOS MARCADOS EN ROJO '); return; }
  const btn = document.querySelector('#acc-content-profile .btn-primary');
  if (btn) { btn.textContent = 'GUARDANDO...'; btn.disabled = true; }
  try {
    const fullName = nombre + ' ' + apellido;
    if (fbAuth?.currentUser) {
      const { updateProfile } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      await updateProfile(fbAuth.currentUser, { displayName: fullName });
    }
    if (fbDb && window._fb && state.user) {
      const { doc, setDoc } = window._fb;
      await setDoc(doc(fbDb, 'users', state.user.uid), {
        displayName: fullName, phone: document.getElementById('acc-tel')?.value.trim() || '',
        dni: document.getElementById('acc-dni')?.value.trim() || '',
        birthday: document.getElementById('acc-bday')?.value || '',
        gender: document.getElementById('acc-genero')?.value || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    if (state.user) state.user.displayName = fullName;
    document.getElementById('account-name').textContent = fullName.toUpperCase();
    await updateAuthUI();
    window.showToast?.('¡Perfil actualizado! ');
  } catch(e) {
    window.showToast?.('Error al guardar: ' + e.message + ' ');
  } finally {
    if (btn) { btn.textContent = 'GUARDAR CAMBIOS'; btn.disabled = false; }
  }
}

export async function uploadAvatar(file) {
  if (!file) return;
  window.showToast?.('Subiendo foto de perfil...');
  const CLOUD = 'damwe7juy', PRESET = 'XINCO TIENDA';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', PRESET);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {method:'POST',body:formData});
    const data = await res.json();
    if (data.secure_url) {
      const url = data.secure_url;
      if (fbAuth?.currentUser) {
        const { updateProfile } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        await updateProfile(fbAuth.currentUser, { photoURL: url });
        if (state.user) state.user.photoURL = url;
      }
      if (fbDb && window._fb && state.user?.uid) {
        const { doc, setDoc } = window._fb;
        await setDoc(doc(fbDb, 'users', state.user.uid), { photoURL: url }, { merge: true });
      }
      const avatarImg = document.getElementById('account-avatar-img');
      const avatarInitials = document.getElementById('account-avatar-initials');
      if (avatarImg) { avatarImg.src = url; avatarImg.classList.remove('hidden'); }
      if (avatarInitials) avatarInitials.classList.add('hidden');
      window.showToast?.('¡Foto de perfil actualizada! ');
    } else {
      window.showToast?.('Error al subir la foto: respuesta inválida del servidor ');
    }
  } catch(e) { window.showToast?.('Error al subir la foto: ' + (e.message || 'conexión fallida') + ' '); }
}

export function showAddAddressForm() { document.getElementById('add-address-form')?.classList.remove('hidden'); }

export async function saveAddress() {
  const street = document.getElementById('addr-street')?.value.trim();
  const city = document.getElementById('addr-city')?.value.trim();
  const cp = document.getElementById('addr-cp')?.value.trim();
  const prov = document.getElementById('addr-prov')?.value;
  if (!street || !city || !cp || !prov) { window.showToast?.('CALLE, CIUDAD, PROVINCIA Y CP SON OBLIGATORIOS '); return; }
  if (!/^\d{4,8}$/.test(cp)) { window.showToast?.('CÓDIGO POSTAL INVÁLIDO '); return; }
  const addr = { street, city, cp, prov, addedAt: new Date().toISOString() };
  if (!state.user.addresses) state.user.addresses = [];
  state.user.addresses.push(addr);
  if (fbDb && window._fb) {
    const { doc, setDoc } = window._fb;
    await setDoc(doc(fbDb,'users',state.user.uid), { addresses: state.user.addresses }, { merge: true });
  }
  document.getElementById('add-address-form')?.classList.add('hidden');
  renderAddresses();
  window.showToast?.('Dirección guardada ');
}

export function renderAddresses() {
  const el = document.getElementById('addresses-list');
  if (!el) return;
  const addrs = state.user?.addresses || [];
  if (!addrs.length) { el.innerHTML = '<p class="font-label-caps text-[10px] text-on-surface-variant">NO HAY DIRECCIONES GUARDADAS</p>'; return; }
  el.innerHTML = addrs.map((a,i) => `
    <div class="flex justify-between items-start p-3 border-[2px] border-primary address-item" style="animation-delay:${i * 0.06}s">
      <div>
        <div class="font-label-caps text-label-caps text-primary">${window.escapeHtml(a.street)}</div>
        <div class="font-label-caps text-[10px] text-on-surface-variant">${window.escapeHtml(a.city)}, ${window.escapeHtml(a.prov)} (${window.escapeHtml(a.cp)})</div>
      </div>
      <button onclick="removeAddress(${i})" class="p-1 border-2 border-error text-error hover:bg-error hover:text-white transition-colors ml-3">
        <span class="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>`).join('');
}

export async function removeAddress(i) {
  if (!state.user?.addresses) return;
  state.user.addresses.splice(i,1);
  if (fbDb && window._fb) {
    const { doc, setDoc } = window._fb;
    await setDoc(doc(fbDb,'users',state.user.uid), { addresses: state.user.addresses }, { merge: true });
  }
  renderAddresses();
  window.showToast?.('Dirección eliminada');
}

export function validateNewEmail() {
  const email = document.getElementById('acc-email-new')?.value.trim();
  const icon = document.getElementById('new-email-icon');
  const hint = document.getElementById('new-email-hint');
  if (!email || !icon || !hint) return;
  const valid = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
  icon.classList.remove('hidden'); hint.classList.remove('hidden');
  if (valid) { icon.textContent='check_circle'; icon.style.color='#2e7d32'; hint.textContent='EMAIL VÁLIDO'; hint.style.color='#2e7d32'; }
  else { icon.textContent='cancel'; icon.style.color='#ba1a1a'; hint.textContent='FORMATO INVÁLIDO'; hint.style.color='#ba1a1a'; }
}

export async function changeUserEmail() {
  const newEmail = document.getElementById('acc-email-new')?.value.trim();
  const pass = document.getElementById('acc-email-pass')?.value;
  const msgEl = document.getElementById('email-change-msg');
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { window.showToast?.('INGRESÁ UN EMAIL VÁLIDO '); return; }
  if (!pass) { window.showToast?.('INGRESÁ TU CONTRASEÑA ACTUAL '); return; }
  if (newEmail === state.user?.email) { window.showToast?.('ESE ES TU EMAIL ACTUAL '); return; }
  const btn = document.querySelector('#acc-content-security .btn-primary');
  if (btn) { btn.textContent = 'ENVIANDO...'; btn.disabled = true; }
  try {
    const { reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const cred = EmailAuthProvider.credential(state.user.email, pass);
    await reauthenticateWithCredential(fbAuth.currentUser, cred);
    await verifyBeforeUpdateEmail(fbAuth.currentUser, newEmail, { url: 'https://xinco.shop/verificar-email' });
    if (msgEl) { msgEl.textContent = ` EMAIL DE VERIFICACIÓN ENVIADO A ${newEmail.toUpperCase()} — VERIFICÁ PARA APLICAR EL CAMBIO`; msgEl.classList.remove('hidden'); }
    document.getElementById('acc-email-new').value = '';
    document.getElementById('acc-email-pass').value = '';
    window.showToast?.('Email de verificación enviado ');
  } catch(e) {
    let msg = 'ERROR AL CAMBIAR EMAIL';
    if (e.code === 'auth/wrong-password') msg = 'CONTRASEÑA INCORRECTA ';
    if (e.code === 'auth/email-already-in-use') msg = 'ESE EMAIL YA ESTÁ EN USO ';
    if (e.code === 'auth/requires-recent-login') msg = 'SESIÓN EXPIRADA — CERRÁ SESIÓN Y VOLVÉ A ENTRAR ';
    window.showToast?.(msg);
  } finally {
    if (btn) { btn.textContent = 'ENVIAR VERIFICACIÓN AL NUEVO EMAIL'; btn.disabled = false; }
  }
}

export async function sendPasswordReset() {
  if (!state.user?.email) return;
  try {
    const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    await sendPasswordResetEmail(fbAuth, state.user.email);
    window.showToast?.('Email de restablecimiento enviado a ' + state.user.email + ' ');
  } catch(e) { window.showToast?.('Error al enviar: ' + e.message + ' '); }
}

export async function handleEmailVerification() {
  const statusEl = document.getElementById('verify-status');
  if (!statusEl) return;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

  // Case 1: Direct oobCode from handleCodeInApp — process it
  if (mode === 'verifyEmail' && oobCode) {
    try {
      await window._fb.applyActionCode(oobCode);
      statusEl.innerHTML = ' EMAIL VERIFICADO<br><span style="font-size:13px;color:#666;margin-top:8px;display:block;">Ahora podés iniciar sesión.</span>';
      setTimeout(() => { import('./router.js').then(m => m.nav('login')); }, 3000);
      return;
    } catch(e) {
      let msg = 'Error al verificar';
      if (e.code === 'auth/invalid-action-code') msg = 'El link ya expiró o ya fue usado';
      statusEl.innerHTML = ' ' + msg;
      return;
    }
  }

  // Case 2: Redirect after Firebase Auth handler processed verification
  if (window.location.pathname === '/verificar-email') {
    statusEl.innerHTML = ' EMAIL VERIFICADO<br><span style="font-size:13px;color:#666;margin-top:8px;display:block;">Ya podés iniciar sesión.</span>';
    setTimeout(() => { import('./router.js').then(m => m.nav('login')); }, 3000);
    return;
  }

  // Case 3: Not a verification page
  statusEl.innerHTML = 'VERIFICANDO...';
}

export function init() {
  try { localStorage.removeItem('xinco_last_reg_email'); } catch(_) {}
  window.doLogin = doLogin;
  window.doRegister = doRegister;
  window.doLogout = doLogout;
  window.doLoginGoogle = doLoginGoogle;
  window.updateAuthUI = updateAuthUI;
  window.showForgotPassword = showForgotPassword;
  window.togglePass = togglePass;
  window.validateEmailField = validateEmailField;
  window.checkPasswordStrength = checkPasswordStrength;
  window.checkPasswordMatch = checkPasswordMatch;
  window.resendVerificationEmail = resendVerificationEmail;
  window.resendFromRegister = () => resendVerificationEmail();
  window.renderAccountPage = renderAccountPage;
  window.showAccountTab = showAccountTab;
  window.saveProfile = saveProfile;
  window.uploadAvatar = uploadAvatar;
  window.showAddAddressForm = showAddAddressForm;
  window.saveAddress = saveAddress;
  window.removeAddress = removeAddress;
  window.validateNewEmail = validateNewEmail;
  window.changeUserEmail = changeUserEmail;
  window.sendPasswordReset = sendPasswordReset;
  window.validateProfileField = validateProfileField;
  window.renderAddresses = renderAddresses;
  window.handleEmailVerification = handleEmailVerification;
  // Process email verification link on load
  setTimeout(() => handleEmailVerification(), 500);
}
