import { bannerState } from './state.js';
import { fbDb } from './firebase.js';

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

// =================== HERO VIDEO & ANIMATION SYSTEM ===================
let heroVideoUrl = '';
let heroAnimStyle = 'default';
let heroVideoEffect = 'none';

export function switchHeroTab(tab) {
  const imgPanel = document.getElementById('hero-tab-img');
  const vidPanel = document.getElementById('hero-tab-video');
  const imgBtn = document.getElementById('tab-img-btn');
  const vidBtn = document.getElementById('tab-vid-btn');
  if (!imgPanel || !vidPanel) return;
  if (tab === 'img') {
    imgPanel.classList.remove('hidden');
    vidPanel.classList.add('hidden');
    imgBtn.classList.add('active');
    vidBtn.classList.remove('active');
  } else {
    imgPanel.classList.add('hidden');
    vidPanel.classList.remove('hidden');
    imgBtn.classList.remove('active');
    vidBtn.classList.add('active');
    if (bannerState.hero.videoUrl) {
      document.getElementById('hero-video-url').value = bannerState.hero.videoUrl;
      showHeroVideoStatus(bannerState.hero.videoUrl);
    }
  }
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
  const COLORS = ['#5d22ff','#ffffff','#c6c6c6','#4500d1'];
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

export function showHeroVideoStatus(url) {
  const statusEl = document.getElementById('hero-video-status');
  const urlDisp = document.getElementById('hero-video-url-display');
  const prevVid = document.getElementById('hero-preview-video');
  const prevBadge = document.getElementById('hero-preview-video-badge');
  if (statusEl) statusEl.classList.remove('hidden');
  if (urlDisp) urlDisp.textContent = url;
  if (prevVid) {
    prevVid.src = url;
    prevVid.style.display = 'block';
    prevVid.load();
    prevVid.play().catch(() => {});
  }
  if (prevBadge) prevBadge.classList.remove('hidden');
  heroVideoUrl = url;
}

export function handleHeroVideoFileDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('hero-video-dropzone');
  if (dz) dz.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) uploadHeroVideo(file);
}

export async function uploadHeroVideo(file) {
  if (!file) return;
  const progress = document.getElementById('hero-video-upload-progress');
  const bar = document.getElementById('hero-video-upload-bar');
  const pct = document.getElementById('hero-video-upload-pct');
  const statusEl = document.getElementById('hero-video-upload-status');
  if (progress) progress.classList.remove('hidden');
  if (bar) bar.style.width = '0%';
  if (statusEl) statusEl.textContent = 'SUBIENDO VIDEO...';
  window.showToast?.('Subiendo video a Cloudinary... ☁️');
  try {
    const videoUrl = await new Promise((resolve, reject) => {
      window.uploadToCloudinary?.(file,
        (p) => { if(bar) bar.style.width=p+'%'; if(pct) pct.textContent=p+'%'; if(statusEl) statusEl.textContent = p<100 ? 'SUBIENDO VIDEO...' : 'PROCESANDO...'; },
        (url) => resolve(url),
        (err) => reject(err),
        'video'
      ) || reject('uploadToCloudinary not available');
    });
    if (progress) progress.classList.add('hidden');
    showHeroVideoStatus(videoUrl);
    document.getElementById('hero-video-url').value = videoUrl;
    window.showToast?.('¡Video subido a Cloudinary! ☁️✅');
  } catch(e) {
    if (statusEl) statusEl.textContent = 'ERROR AL SUBIR';
    if (bar) bar.style.background = '#ba1a1a';
    window.showToast?.('Error al subir el video ❌');
  }
}

export function previewHeroVideo() {
  const url = document.getElementById('hero-video-url')?.value.trim();
  if (!url) { window.showToast?.('Ingresá una URL de video ❌'); return; }
  showHeroVideoStatus(url);
  applyHeroVideoToSection(url);
  window.showToast?.('Vista previa del video activa ✅');
}

export function clearHeroVideo() {
  heroVideoUrl = '';
  const inputs = ['hero-video-url'];
  inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const statusEl = document.getElementById('hero-video-status');
  const prevVid = document.getElementById('hero-preview-video');
  const prevBadge = document.getElementById('hero-preview-video-badge');
  if (statusEl) statusEl.classList.add('hidden');
  if (prevVid) { prevVid.src = ''; prevVid.style.display = 'none'; }
  if (prevBadge) prevBadge.classList.add('hidden');
  const prevImg = document.getElementById('hero-preview-img');
  if (prevImg && bannerState.hero.img) prevImg.src = bannerState.hero.img;
  applyHeroVideoToSection('');
  const realImg = document.getElementById('hero-img');
  if (realImg && bannerState.hero.img) realImg.src = bannerState.hero.img;
  window.showToast?.('Video eliminado — se usará la imagen');
}

export function handleHeroFileDrop(e) {
  e.preventDefault();
  document.getElementById('hero-dropzone')?.classList.remove('bg-surface-container');
  const file = e.dataTransfer.files[0];
  if (file) uploadHeroImage(file);
}

export async function uploadHeroImage(file) {
  if (!file) return;
  const progress = document.getElementById('hero-upload-progress');
  const bar = document.getElementById('hero-upload-bar');
  const pct = document.getElementById('hero-upload-pct');
  const status = document.getElementById('hero-upload-status');
  const result = document.getElementById('hero-upload-result');
  const recentGrid = document.getElementById('hero-recent-uploads');
  progress.classList.remove('hidden');
  result.classList.add('hidden');
  bar.style.width = '0%';
  bar.style.background = '#5d22ff';
  status.textContent = 'SUBIENDO...';
  const reader = new FileReader();
  reader.onload = (ev) => { document.getElementById('hero-preview-img').src = ev.target.result; };
  reader.readAsDataURL(file);
  try {
    await (window.uploadToCloudinary?.(file,
      (p) => { bar.style.width = p + '%'; pct.textContent = p + '%'; },
      (finalUrl) => {
        document.getElementById('hero-edit-img').value = finalUrl;
        bannerState.hero.img = finalUrl;
        document.getElementById('hero-img').src = finalUrl;
        document.getElementById('hero-preview-img').src = finalUrl;
        result.classList.remove('hidden');
        bar.style.width = '100%';
        pct.textContent = '100%';
        status.textContent = '¡SUBIDA EXITOSA!';
        const thumb = document.createElement('div');
        thumb.className = 'aspect-square border-2 border-primary overflow-hidden cursor-pointer hover:border-secondary-container';
        thumb.title = 'Usar esta imagen';
        thumb.innerHTML = '<img src="' + finalUrl + '" class="w-full h-full object-cover" onclick="applyHeroImg(\'' + finalUrl + '\')"/>';
        if (recentGrid.children.length === 1 && !recentGrid.querySelector('img')) recentGrid.innerHTML = '';
        recentGrid.prepend(thumb);
        window.showToast?.('¡Imagen del hero subida a Cloudinary! ☁️✅');
      },
      (err) => { status.textContent = 'ERROR: ' + err; bar.style.background = '#ba1a1a'; window.showToast?.('Error al subir imagen del hero ❌'); }
    ) || Promise.reject('uploadToCloudinary not available'));
  } catch(e) { console.error(e); }
}

export function applyHeroImg(url) {
  document.getElementById('hero-edit-img').value = url;
  document.getElementById('hero-preview-img').src = url;
  bannerState.hero.img = url;
  document.getElementById('hero-img').src = url;
  window.showToast?.('Imagen del hero aplicada ✅');
}

// =================== BANNER EDITOR ===================
export function initBannerEditor() {
  renderAnnouncementEditorList();
  document.getElementById('hero-edit-badge').value = bannerState.hero.badge;
  document.getElementById('hero-edit-title').value = bannerState.hero.title;
  document.getElementById('hero-edit-subtitle').value = bannerState.hero.subtitle;
  document.getElementById('hero-edit-img').value = bannerState.hero.img;
  previewHero();
  heroVideoUrl = bannerState.hero.videoUrl || '';
  heroAnimStyle = bannerState.hero.animStyle || 'default';
  heroVideoEffect = bannerState.hero.videoEffect || 'none';
  if (heroVideoUrl) {
    switchHeroTab('video');
    document.getElementById('hero-video-url').value = heroVideoUrl;
    showHeroVideoStatus(heroVideoUrl);
  }
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
      '<input class="input-field flex-1 py-2 ann-input" value="' + msg + '" data-index="' + i + '" oninput="bannerState.announcements[' + i + ']=this.value;renderAnnouncementBar()"/>' +
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
    bannerState.announcements[idx] = inp.value.trim() || bannerState.announcements[idx];
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
  const url = document.getElementById('hero-edit-img')?.value.trim();
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
  const imgUrl = document.getElementById('hero-edit-img')?.value.trim();
  if (imgUrl) bannerState.hero.img = imgUrl;
  bannerState.hero.videoUrl = heroVideoUrl || '';
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
  window.previewHeroImg = previewHeroImg;
  window.previewPromo = previewPromo;
  window.savePromoBanner = savePromoBanner;
  window.saveHeroBanner = saveHeroBanner;
  window.switchHeroTab = switchHeroTab;
  window.selectHeroAnim = selectHeroAnim;
  window.selectVideoEffect = selectVideoEffect;
  window.selectAnimStyle = selectAnimStyle;
  window.applyHeroAnimStyle = applyHeroAnimStyle;
  window.applyHeroVideoEffect = applyHeroVideoEffect;
  window.startHeroParticles = startHeroParticles;
  window.stopHeroParticles = stopHeroParticles;
  window.applyHeroVideoToSection = applyHeroVideoToSection;
  window.showHeroVideoStatus = showHeroVideoStatus;
  window.previewHeroVideo = previewHeroVideo;
  window.clearHeroVideo = clearHeroVideo;
  window.handleHeroFileDrop = handleHeroFileDrop;
  window.uploadHeroImage = uploadHeroImage;
  window.uploadHeroVideo = uploadHeroVideo;
  window.handleHeroVideoFileDrop = handleHeroVideoFileDrop;
  window.applyHeroImg = applyHeroImg;
}
