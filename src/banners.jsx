import { bannerState } from './state.js';

function _norm(msgs) {
  return (msgs||[]).map(m => typeof m === 'string' ? { text: m, color: '#ffffff' } : (m && m.text ? m : { text: '', color: '#ffffff' }));
}

export function renderAnnouncementBar() {
  const scroller = document.getElementById('announcement-scroller');
  if (!scroller) return;
  const msgs = _norm(bannerState.announcements);
  bannerState.announcements = msgs;
  const doubled = [...msgs, ...msgs];
  scroller.innerHTML = doubled.map(m =>
    '<span class="font-label-caps text-label-caps tracking-widest uppercase px-12" style="color:' + m.color + ' !important;">' + m.text + '</span>'
  ).join('');
}

let _hero3DStarted = false;

export function renderHeroBanner() {
  const h = bannerState.hero;
  const badge = document.getElementById('hero-badge');
  const title = document.getElementById('hero-title');
  const subtitle = document.getElementById('hero-subtitle');
  const img = document.getElementById('hero-img');
  if (badge) { badge.textContent = h.badge; badge.style.display = h.badge ? '' : 'none'; }
  if (title) title.innerHTML = h.title.replace(/\n/g, '<br>') || 'XINCO';
  if (subtitle) subtitle.textContent = h.subtitle;
  if (h.videoUrl) {
    applyHeroVideoToSection(h.videoUrl);
    applyHeroVideoEffect(h.videoEffect || 'none');
  } else {
    applyHeroVideoToSection('');
    if (img) img.src = h.img;
    applyHeroAnimStyle(h.animStyle || 'default');
  }
  if (!_hero3DStarted && document.getElementById('hero-3d-container')) {
    _hero3DStarted = true;
    import('./hero-3d.js').then(m => m.initHero3D()).catch(e => console.warn('hero-3d init:', e));
  }
}

export function renderPromoBanner() {
  const p = bannerState.promo;
  const section = document.getElementById('promo-banner-section');
  if (!section) return;
  if (!p.enabled) { section.style.display = 'none'; return; }
  section.style.display = '';
  const labelEl = section.querySelector('.promo-label');
  const titleEl = section.querySelector('.promo-title');
  const codeEl = section.querySelector('.promo-code');
  if (labelEl) labelEl.textContent = p.label;
  if (titleEl) titleEl.innerHTML = p.title.replace(/\n/g, '<br>');
  if (codeEl) codeEl.textContent = p.code;
}

// =================== HERO MEDIA & ANIMATION SYSTEM ===================
let heroVideoUrl = '';
let heroAnimStyle = 'default';
let heroVideoEffect = 'none';

function _isVideoUrl(url) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function selectHeroAnim(style, btn) {
  heroAnimStyle = style;
  document.querySelectorAll('#anim-style-selector .hero-media-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyHeroAnimStyle(style);
}

export function selectVideoEffect(effect, btn) {
  heroVideoEffect = effect;
  document.querySelectorAll('#video-effect-selector .hero-media-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyHeroVideoEffect(effect);
}

export function selectAnimStyle(style) {
  heroAnimStyle = style;
  document.querySelectorAll('#anim-style-selector .hero-media-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.anim === style);
  });
  applyHeroAnimStyle(style);
}

export function applyHeroAnimStyle(style) {
  const title = document.getElementById('hero-title');
  if (!title) return;
  title.classList.remove('hero-glitch');
  stopHeroParticles();
  const scanlines = document.getElementById('hero-scanlines');
  if (scanlines) scanlines.style.display = 'none';
  if (style === 'glitch') {
    title.classList.add('hero-glitch');
  }
}

export function applyHeroVideoEffect(effect) {
  const scanlines = document.getElementById('hero-scanlines');
  if (!scanlines) return;
  scanlines.style.display = 'none';
  stopHeroParticles();
  const title = document.getElementById('hero-title');
  if (title) title.classList.remove('hero-glitch');
  if (effect === 'scanlines') {
    scanlines.style.display = 'block';
    scanlines.style.animation = 'scanlineMove 0.2s linear infinite';
  } else if (effect === 'particles') {
    startHeroParticles();
  } else if (effect === 'glitch') {
    if (title) title.classList.add('hero-glitch');
  } else if (effect === 'vignette') {
    scanlines.style.display = 'block';
    scanlines.style.background = 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)';
    scanlines.style.animation = 'vignetteAnim 6s ease-in-out infinite';
  }
}

let _particleInterval = null;
let _particles = [];

export function startHeroParticles() {
  stopHeroParticles();
  const container = document.getElementById('hero-particles');
  if (!container) return;
  container.innerHTML = '';
  _particles = [];
  const COLORS = ['#ffffff','#c6c6c6','#888888','#555555'];
  const COUNT = 28;
  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'hero-particle';
    const size = Math.random() * 5 + 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const dur = (Math.random() * 8 + 6).toFixed(1) + 's';
    const delay = (Math.random() * 5).toFixed(1) + 's';
    const opacity = (Math.random() * 0.4 + 0.1).toFixed(2);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    dot.style.cssText = 'width:' + size + 'px; height:' + size + 'px; left:' + x + '%; top:' + y + '%; background:' + color + '; --p-dur:' + dur + '; --p-delay:' + delay + '; --p-opacity:' + opacity + '; animation-delay:' + delay + ';';
    container.appendChild(dot);
    _particles.push(dot);
  }
}

export function stopHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (container) container.innerHTML = '';
  _particles = [];
  if (_particleInterval) { clearInterval(_particleInterval); _particleInterval = null; }
}

export function applyHeroVideoToSection(url) {
  const video = document.getElementById('hero-video');
  const img = document.getElementById('hero-img');
  if (!video) return;
  if (url) {
    video.src = url;
    video.style.display = 'block';
    video.load();
    video.play().catch(() => {});
    if (img) img.style.display = 'none';
  } else {
    video.src = '';
    video.style.display = 'none';
    if (img) img.style.display = 'block';
  }
}

export function previewHeroMedia() {
  const url = document.getElementById('hero-media-url')?.value.trim();
  if (!url) { clearHeroMedia(); return; }
  const isVid = _isVideoUrl(url);
  if (isVid) {
    heroVideoUrl = url;
    bannerState.hero.videoUrl = url;
    bannerState.hero.img = '';
    applyHeroVideoToSection(url);
    const prevVid = document.getElementById('hero-preview-video');
    if (prevVid) { prevVid.src = url; prevVid.style.display = 'block'; prevVid.load(); prevVid.play().catch(() => {}); }
  } else {
    heroVideoUrl = '';
    bannerState.hero.videoUrl = '';
    bannerState.hero.img = url;
    applyHeroVideoToSection('');
    const prevImg = document.getElementById('hero-preview-img');
    if (prevImg) { prevImg.src = url; prevImg.style.display = ''; }
    const realImg = document.getElementById('hero-img');
    if (realImg) { realImg.classList.add('loading'); realImg.onload = () => { realImg.classList.remove('loading'); }; realImg.src = url; realImg.style.display = 'block'; }
  }
  _updateHeroStatusBar(url, isVid);
}

export function uploadHeroMedia(file) {
  if (!file) return;
  const isVid = file.type.startsWith('video/');
  const progress = document.getElementById('hero-media-upload-progress');
  const bar = document.getElementById('hero-media-upload-bar');
  const pct = document.getElementById('hero-media-upload-pct');
  const statusEl = document.getElementById('hero-media-upload-status');
  if (progress) progress.classList.remove('hidden');
  if (bar) bar.style.width = '0%';
  if (statusEl) statusEl.textContent = 'SUBIENDO...';
  window.showToast?.('Subiendo a Cloudinary... ☁️');
  if (isVid) {
    const prevVid = document.getElementById('hero-preview-video');
    if (prevVid) { prevVid.src = URL.createObjectURL(file); prevVid.style.display = 'block'; prevVid.load(); prevVid.play().catch(() => {}); }
  } else {
    const reader = new FileReader();
    reader.onload = (ev) => { document.getElementById('hero-preview-img').src = ev.target.result; };
    reader.readAsDataURL(file);
  }
  (window.uploadToCloudinary?.(file,
    (p) => { if (bar) bar.style.width = p + '%'; if (pct) pct.textContent = p + '%'; if (statusEl) statusEl.textContent = p < 100 ? 'SUBIENDO...' : 'PROCESANDO...'; },
    (finalUrl) => {
      if (progress) progress.classList.add('hidden');
      document.getElementById('hero-media-url').value = finalUrl;
      previewHeroMedia();
      window.showToast?.('¡Subido a Cloudinary! ☁️✅');
    },
    (err) => { if (statusEl) statusEl.textContent = 'ERROR'; if (bar) bar.style.background = '#ba1a1a'; window.showToast?.('Error al subir ❌'); },
    isVid ? 'video' : 'image'
  ));
}

export function handleHeroMediaDrop(e) {
  e.preventDefault();
  document.getElementById('hero-media-dropzone')?.classList.remove('border-primary', 'bg-surface-container-high');
  const file = e.dataTransfer.files[0];
  if (file) uploadHeroMedia(file);
}

export function clearHeroMedia() {
  heroVideoUrl = '';
  bannerState.hero.videoUrl = '';
  document.getElementById('hero-media-url').value = '';
  const statusBar = document.getElementById('hero-media-status');
  if (statusBar) statusBar.classList.add('hidden');
  applyHeroVideoToSection('');
  const prevImg = document.getElementById('hero-preview-img');
  if (prevImg) { prevImg.src = ''; prevImg.style.display = 'none'; }
  const prevVid = document.getElementById('hero-preview-video');
  if (prevVid) { prevVid.src = ''; prevVid.style.display = 'none'; }
  const prevBadge = document.getElementById('hero-preview-video-badge');
  if (prevBadge) prevBadge.classList.add('hidden');
  const realImg = document.getElementById('hero-img');
  if (realImg && bannerState.hero.img) realImg.src = bannerState.hero.img;
}

function _updateHeroStatusBar(url, isVid) {
  const bar = document.getElementById('hero-media-status');
  const badge = document.getElementById('hero-media-type-badge');
  const display = document.getElementById('hero-media-url-display');
  if (!bar) return;
  bar.classList.remove('hidden');
  if (badge) {
    badge.textContent = isVid ? 'VIDEO' : 'IMAGEN';
    badge.className = 'text-[8px] font-bold px-2 py-1 rounded ' + (isVid ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700');
  }
  if (display) display.textContent = url;
}

// =================== BANNER EDITOR ===================
export function initBannerEditor() {
  renderAnnouncementEditorList();
  document.getElementById('hero-edit-badge').value = bannerState.hero.badge;
  document.getElementById('hero-edit-title').value = bannerState.hero.title;
  document.getElementById('hero-edit-subtitle').value = bannerState.hero.subtitle;
  const mediaUrl = document.getElementById('hero-media-url');
  if (mediaUrl) mediaUrl.value = bannerState.hero.videoUrl || bannerState.hero.img;
  previewHero();
  heroVideoUrl = bannerState.hero.videoUrl || '';
  heroAnimStyle = bannerState.hero.animStyle || 'default';
  heroVideoEffect = bannerState.hero.videoEffect || 'none';
  if (heroVideoUrl) previewHeroMedia();
  document.querySelectorAll('#anim-style-selector .hero-media-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.anim === heroAnimStyle);
  });
  document.querySelectorAll('#video-effect-selector .hero-media-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.effect === heroVideoEffect);
  });
  document.getElementById('promo-edit-enabled').checked = bannerState.promo.enabled;
  document.getElementById('promo-edit-label').value = bannerState.promo.label;
  document.getElementById('promo-edit-title').value = bannerState.promo.title;
  document.getElementById('promo-edit-code').value = bannerState.promo.code;
  previewPromo();
}

export function renderAnnouncementEditorList() {
  const el = document.getElementById('announcement-editor-list');
  if (!el) return;
  const total = bannerState.announcements.length;
  el.innerHTML = bannerState.announcements.map((msg, i) => {
    const upDisabled = i === 0 ? 'disabled style="opacity:0.3"' : '';
    const dnDisabled = i === total - 1 ? 'disabled style="opacity:0.3"' : '';
    return (
      '<div class="flex items-center gap-3 p-3 border-[2px] border-outline-variant bg-surface" id="ann-row-' + i + '">' +
      '<div class="flex flex-col gap-1 shrink-0">' +
      '<button onclick="moveAnnouncement(' + i + ',-1)" ' + upDisabled + ' class="p-1 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors disabled:cursor-not-allowed">' +
      '<span class="material-symbols-outlined text-[14px]">keyboard_arrow_up</span></button>' +
      '<button onclick="moveAnnouncement(' + i + ',1)" ' + dnDisabled + ' class="p-1 border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors">' +
      '<span class="material-symbols-outlined text-[14px]">keyboard_arrow_down</span></button></div>' +
      '<span class="w-7 h-7 bg-primary text-on-primary flex items-center justify-center font-label-caps text-[11px] shrink-0">' + (i + 1) + '</span>' +
      '<input class="input-field flex-1 py-2 ann-input" value="' + (msg.text || msg) + '" data-index="' + i + '" oninput="bannerState.announcements[' + i + '].text=this.value;renderAnnouncementBar()"/>' +
      '<button onclick="removeAnnouncement(' + i + ')" class="p-2 border-2 border-error text-error hover:bg-error hover:text-on-error transition-colors shrink-0">' +
      '<span class="material-symbols-outlined text-[18px]">delete</span></button></div>'
    );
  }).join('');
}

export function addAnnouncementMsg() {
  bannerState.announcements.push('NUEVO MENSAJE — EDITAME');
  renderAnnouncementEditorList();
}

export function removeAnnouncement(i) {
  if (bannerState.announcements.length <= 1) { window.showToast?.('Debe haber al menos 1 mensaje'); return; }
  bannerState.announcements.splice(i, 1);
  renderAnnouncementEditorList();
}

export function moveAnnouncement(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= bannerState.announcements.length) return;
  [bannerState.announcements[i], bannerState.announcements[j]] = [bannerState.announcements[j], bannerState.announcements[i]];
  renderAnnouncementEditorList();
}

export async function saveAnnouncementBar() {
  document.querySelectorAll('.ann-input').forEach(inp => {
    const idx = parseInt(inp.dataset.index);
    bannerState.announcements[idx].text = inp.value.trim() || bannerState.announcements[idx].text;
  });
  try {
    const { fbSaveBannersRemote } = await import('./firebase.js');
    await fbSaveBannersRemote(bannerState);
    await import('./firebase.js').then(m => m.syncFromFirebase());
    renderAnnouncementBar();
    window.showToast?.('✅ Barra de anuncios guardada en Firebase');
  } catch(e) {
    console.error('saveAnnouncementBar:', e);
    window.showToast?.('⚠️ Error al guardar en Firebase: ' + e.message);
  }
}

export function previewHero() {
  const badge = document.getElementById('hero-edit-badge')?.value || '';
  const title = document.getElementById('hero-edit-title')?.value || '';
  const subtitle = document.getElementById('hero-edit-subtitle')?.value || '';
  const prevBadge = document.getElementById('hero-preview-badge');
  const prevTitle = document.getElementById('hero-preview-title');
  const prevSub = document.getElementById('hero-preview-subtitle');
  if (prevBadge) { prevBadge.textContent = badge; prevBadge.style.display = badge ? '' : 'none'; }
  if (prevTitle) prevTitle.innerHTML = title.replace(/\n/g,'<br>') || 'XINCO';
  if (prevSub) prevSub.textContent = subtitle;
  const realBadge = document.getElementById('hero-badge');
  const realTitle = document.getElementById('hero-title');
  const realSub = document.getElementById('hero-subtitle');
  if (realBadge) { realBadge.textContent = badge; realBadge.style.display = badge ? '' : 'none'; }
  if (realTitle) realTitle.innerHTML = title.replace(/\n/g, '<br>') || 'XINCO';
  if (realSub) realSub.textContent = subtitle;
}

export function previewHeroImg() {
  const url = document.getElementById('hero-media-url')?.value.trim();
  if (url) {
    const prevImg = document.getElementById('hero-preview-img');
    if (prevImg) { prevImg.src = url; prevImg.style.display = ''; }
    const realImg = document.getElementById('hero-img');
    if (realImg) {
      realImg.classList.add('loading');
      realImg.onload = () => { realImg.classList.remove('loading'); };
      realImg.src = url;
    }
  }
}

export function previewPromo() {
  const enabled = document.getElementById('promo-edit-enabled')?.checked || false;
  const label = document.getElementById('promo-edit-label')?.value || '';
  const title = document.getElementById('promo-edit-title')?.value || '';
  const code = document.getElementById('promo-edit-code')?.value || '';
  const pl = document.getElementById('promo-preview-label');
  const pt = document.getElementById('promo-preview-title');
  const pc = document.getElementById('promo-preview-code');
  if (pl) pl.textContent = label;
  if (pt) pt.innerHTML = title.replace(/\n/g,'<br>') || '30% OFF';
  if (pc) pc.textContent = code;
  const section = document.getElementById('promo-banner-section');
  if (section) {
    section.style.display = enabled ? '' : 'none';
    const labelEl = section.querySelector('.promo-label');
    const titleEl = section.querySelector('.promo-title');
    const codeEl = section.querySelector('.promo-code');
    if (labelEl) labelEl.textContent = label;
    if (titleEl) titleEl.innerHTML = title.replace(/\n/g, '<br>');
    if (codeEl) codeEl.textContent = code;
  }
}

export async function savePromoBanner() {
  bannerState.promo.enabled = document.getElementById('promo-edit-enabled').checked;
  bannerState.promo.label = document.getElementById('promo-edit-label').value.trim();
  bannerState.promo.title = document.getElementById('promo-edit-title').value.trim();
  bannerState.promo.code = document.getElementById('promo-edit-code').value.trim().toUpperCase();
  try {
    const { fbSaveBannersRemote } = await import('./firebase.js');
    await fbSaveBannersRemote(bannerState);
    await import('./firebase.js').then(m => m.syncFromFirebase());
    renderPromoBanner();
    window.showToast?.('✅ Banner promo guardado en Firebase');
  } catch(e) {
    console.error('savePromoBanner:', e);
    window.showToast?.('⚠️ Error al guardar en Firebase: ' + e.message);
  }
}

export async function saveHeroBanner() {
  bannerState.hero.badge = document.getElementById('hero-edit-badge').value.trim();
  bannerState.hero.title = document.getElementById('hero-edit-title').value.trim() || 'XINCO';
  bannerState.hero.subtitle = document.getElementById('hero-edit-subtitle').value.trim();
  const url = document.getElementById('hero-media-url')?.value.trim();
  if (url) {
    if (_isVideoUrl(url)) { bannerState.hero.videoUrl = url; bannerState.hero.img = ''; }
    else { bannerState.hero.img = url; bannerState.hero.videoUrl = ''; }
  }
  bannerState.hero.animStyle = heroAnimStyle;
  bannerState.hero.videoEffect = heroVideoEffect;
  try {
    const { fbSaveBannersRemote } = await import('./firebase.js');
    await fbSaveBannersRemote(bannerState);
    await import('./firebase.js').then(m => m.syncFromFirebase());
    renderHeroBanner();
    window.showToast?.('✅ Hero banner guardado en Firebase');
  } catch(e) {
    console.error('saveHeroBanner:', e);
    window.showToast?.('⚠️ Error al guardar en Firebase: ' + e.message);
  }
}

export function init() {
  window.renderAnnouncementBar = renderAnnouncementBar;
  window.renderHeroBanner = renderHeroBanner;
  window.renderPromoBanner = renderPromoBanner;
  window.initBannerEditor = initBannerEditor;
  window.renderAnnouncementEditorList = renderAnnouncementEditorList;
  window.addAnnouncementMsg = addAnnouncementMsg;
  window.removeAnnouncement = removeAnnouncement;
  window.moveAnnouncement = moveAnnouncement;
  window.saveAnnouncementBar = saveAnnouncementBar;
  window.previewHero = previewHero;
  window.previewPromo = previewPromo;
  window.savePromoBanner = savePromoBanner;
  window.saveHeroBanner = saveHeroBanner;
  window.selectVideoEffect = selectVideoEffect;
  window.selectAnimStyle = selectAnimStyle;
  window.applyHeroAnimStyle = applyHeroAnimStyle;
  window.applyHeroVideoEffect = applyHeroVideoEffect;
  window.startHeroParticles = startHeroParticles;
  window.stopHeroParticles = stopHeroParticles;
  window.applyHeroVideoToSection = applyHeroVideoToSection;
  window.previewHeroMedia = previewHeroMedia;
  window.uploadHeroMedia = uploadHeroMedia;
  window.handleHeroMediaDrop = handleHeroMediaDrop;
  window.clearHeroMedia = clearHeroMedia;

  const _origSetAccent = window.setAccentColor;
  window.setAccentColor = function(hex) {
    _origSetAccent?.(hex);
    import('./hero-3d.js').then(m => m.updateAura(bannerState.hero.modelAuraStyle || 'glow', hex)).catch(() => {});
  };
}
