import { _bootResolved } from './firebase.js';

const SPLASH_MIN_MS = 3000;
const SPLASH_MAX_MS = 8000;
const _splashStart = Date.now();
let _splashDismissed = false;

export function dismissSplash() {
  if (_splashDismissed) return;
  _splashDismissed = true;
  const el = document.getElementById('splash');
  if (!el) return;
  const elapsed = Date.now() - _splashStart;
  const wait = Math.max(0, SPLASH_MIN_MS - elapsed);
  setTimeout(() => {
    el.classList.add('hiding');
    document.body.style.overflow = '';
    setTimeout(() => { el.style.display = 'none'; }, 650);
  }, wait);
}

export function preloadImage(url) {
  if (!url) return Promise.resolve();
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
    setTimeout(resolve, 4000);
  });
}

let _toastTimer;
export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

export function initScrollReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
  if (els.length === 0) return;
  let observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

export function initTiltEffect() {
  const container = document.querySelector('.hero-tilt');
  if (!container) return;
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -12;
    const rotateY = (x - 0.5) * 12;
    container.querySelectorAll('.hero-tilt-child').forEach(el => {
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
  });
  container.addEventListener('mouseleave', () => {
    container.querySelectorAll('.hero-tilt-child').forEach(el => {
      el.style.transform = 'rotateX(0) rotateY(0)';
    });
  });
}

export function staggerEnter(container, delay = 0.04) {
  if (!container) return;
  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    child.style.opacity = '0';
    child.style.transform = 'translateY(16px)';
    child.style.transition = `opacity 0.4s ease-out ${i * delay}s, transform 0.4s ease-out ${i * delay}s`;
    requestAnimationFrame(() => {
      child.style.opacity = '1';
      child.style.transform = 'translateY(0)';
    });
  }
}

export function animateCheckoutStep(stepEl) {
  if (!stepEl) return;
  stepEl.style.opacity = '0';
  stepEl.style.transform = 'translateX(20px)';
  stepEl.style.transition = 'none';
  void stepEl.offsetWidth;
  stepEl.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out';
  requestAnimationFrame(() => {
    stepEl.style.opacity = '1';
    stepEl.style.transform = 'translateX(0)';
  });
}

export function updateStitchClip() {
  const canvas = document.getElementById('mouse-stitch');
  if (!canvas || canvas.style.display === 'none') return;
  canvas.style.maskImage = '';
  canvas.style.webkitMaskImage = '';
  const limit = document.getElementById('promo-banner-section') || document.querySelector('footer');
  if (!limit) { canvas.style.clipPath = ''; return; }
  const rect = limit.getBoundingClientRect();
  const bottom = window.innerHeight - rect.top + 3;
  if (bottom > 0 && bottom < window.innerHeight) {
    canvas.style.clipPath = `inset(0 0 ${bottom}px 0)`;
  } else if (bottom >= window.innerHeight) {
    canvas.style.clipPath = 'inset(0 0 0 0)';
  } else {
    canvas.style.clipPath = '';
  }
}

export function handleMPReturn(bootResolvedRef) {
  (async function() {
    const _urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = _urlParams.get('payment');
    const orderId = _urlParams.get('order');
    if (!paymentStatus) return;
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    while (!bootResolvedRef) await new Promise(r => setTimeout(r, 100));
    if (paymentStatus === 'success') {
      if (orderId) {
        const orderEl = document.getElementById('order-number');
        if (orderEl) orderEl.textContent = '#' + orderId;
      }
      import('./router.js').then(m => m.nav('order-confirm'));
      showToast('✅ ¡Pago exitoso! Tu pedido fue confirmado');
    } else if (paymentStatus === 'pending') {
      import('./router.js').then(m => m.nav('home'));
      showToast('⏳ Pago pendiente de acreditación — te avisaremos por email');
    } else if (paymentStatus === 'failure') {
      import('./router.js').then(m => m.nav('checkout'));
      showToast('❌ El pago no se pudo procesar — intentá de nuevo');
    }
  })();
}

export function initStitches() {
  const canvas = document.getElementById('mouse-stitch');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let pts = [];
  let cols = 0, rows = 0;
  let mx = -9999, my = -9999;
  let animId = null;
  let isVisible = true;
  const SPACING = 32;
  const MOUSE_RADIUS = 140;
  const STITCH_SIZE = 4;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initGrid() {
    pts = [];
    const w = canvas.width, h = canvas.height;
    cols = Math.floor(w / SPACING) + 2;
    rows = Math.floor(h / SPACING) + 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pts.push({
          ox: c * SPACING, oy: r * SPACING,
          x: c * SPACING, y: r * SPACING,
          vx: 0, vy: 0,
        });
      }
    }
  }

  function draw() {
    if (!isVisible) { animId = requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pts) {
      const dxo = p.ox - p.x;
      const dyo = p.oy - p.y;
      p.vx += dxo * 0.045;
      p.vy += dyo * 0.045;
      const dxm = mx - p.x;
      const dym = my - p.y;
      const distM = Math.sqrt(dxm * dxm + dym * dym);
      if (distM < MOUSE_RADIUS && distM > 2) {
        const force = (1 - distM / MOUSE_RADIUS);
        const pull = force * 0.8;
        p.vx += (dxm / distM) * pull;
        p.vy += (dym / distM) * pull;
      }
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x += p.vx;
      p.y += p.vy;
    }
    const accentDim = getComputedStyle(document.documentElement).getPropertyValue('--accent-dim').trim() || 'rgba(93,34,255,0.2)';
    ctx.strokeStyle = accentDim;
    ctx.lineWidth = 0.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const p = pts[idx];
        if (c < cols - 1) {
          const right = pts[idx + 1];
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(right.x, right.y); ctx.stroke();
        }
        if (r < rows - 1) {
          const down = pts[idx + cols];
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(down.x, down.y); ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      const s = STITCH_SIZE * (0.6 + 0.4 * (1 - Math.min(1, Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2) / MOUSE_RADIUS)));
      const accentStrong = getComputedStyle(document.documentElement).getPropertyValue('--accent-strong').trim() || 'rgba(93,34,255,0.5)';
      ctx.strokeStyle = accentStrong;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(p.x - s, p.y - s); ctx.lineTo(p.x + s, p.y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + s, p.y - s); ctx.lineTo(p.x - s, p.y + s); ctx.stroke();
    }
    animId = requestAnimationFrame(draw);
  }

  resize();
  initGrid();
  draw();
  window.addEventListener('resize', () => { resize(); initGrid(); updateStitchClip(); });
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });
  document.addEventListener('scroll', updateStitchClip, { passive: true });
  setTimeout(updateStitchClip, 100);
  if ('ontouchstart' in window) {
    canvas.style.display = 'none';
    cancelAnimationFrame(animId);
  }
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
  });
}

export function initXincoGlitter() {
  const hero = document.getElementById('hero-section');
  const canvas = document.getElementById('xinco-canvas');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  let W, H, animId = null;
  let time = 0;
  let contourPoints = [];
  let surfacePoints = [];
  let sparkles = [];

  function getTitleText() {
    const el = document.getElementById('hero-title');
    return el ? el.textContent || 'XINCO' : 'XINCO';
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    W = canvas.width;
    H = canvas.height;
    computeContour();
  }

  function computeContour() {
    contourPoints = [];
    surfacePoints = [];
    const text = getTitleText();
    if (!text) return;
    const el = document.getElementById('hero-title');
    if (!el) return;
    const er = el.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    const tx = er.left - cr.left;
    const ty = er.top - cr.top;
    const tw = er.width;
    const th = er.height;
    if (tw < 1 || th < 1) return;
    const font = window.getComputedStyle(el).font || '900 80px Montserrat';
    const scale = 2;
    const off = document.createElement('canvas');
    off.width = Math.ceil(tw * scale);
    off.height = Math.ceil(th * scale);
    const offCtx = off.getContext('2d');
    offCtx.fillStyle = '#000';
    offCtx.fillRect(0, 0, off.width, off.height);
    offCtx.fillStyle = '#fff';
    const fontSize = parseFloat(font.match(/\d+px/)?.[0] || '80');
    offCtx.font = `${900} ${fontSize * scale}px Montserrat`;
    offCtx.textBaseline = 'top';
    offCtx.textAlign = 'left';
    offCtx.fillText(text, 0, 0);
    const imageData = offCtx.getImageData(0, 0, off.width, off.height);
    const data = imageData.data;
    const w = off.width, h = off.height;
    const edgePts = [];
    const fillPts = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (data[idx] > 128) {
          fillPts.push({ x: x / scale + tx, y: y / scale + ty });
          const left = x > 0 ? data[(y * w + (x - 1)) * 4] : 0;
          const right = x < w - 1 ? data[(y * w + (x + 1)) * 4] : 0;
          const up = y > 0 ? data[((y - 1) * w + x) * 4] : 0;
          const down = y < h - 1 ? data[((y + 1) * w + x) * 4] : 0;
          if (left <= 128 || right <= 128 || up <= 128 || down <= 128) {
            edgePts.push({ x: x / scale + tx, y: y / scale + ty });
          }
        }
      }
    }
    const eStep = Math.max(1, Math.floor(edgePts.length / 200));
    for (let i = 0; i < edgePts.length; i += eStep) contourPoints.push(edgePts[i]);
    const fStep = Math.max(1, Math.floor(fillPts.length / 150));
    for (let i = 0; i < fillPts.length; i += fStep) surfacePoints.push(fillPts[i]);
  }

  function spawnSparkle() {
    const pool = Math.random() < 0.4 ? surfacePoints : contourPoints;
    if (pool.length < 1) return;
    const p = pool[Math.floor(Math.random() * pool.length)];
    const size = 2 + Math.random() * 4;
    const isBig = Math.random() < 0.15;
    sparkles.push({
      x: p.x + (Math.random() - 0.5) * 4, y: p.y + (Math.random() - 0.5) * 4,
      size: isBig ? size * 2.5 : size, life: 0, maxLife: 0.6 + Math.random() * 1.0,
      speed: 0.02 + Math.random() * 0.04, hue: Math.random() < 0.3 ? 270 : Math.random() < 0.5 ? 300 : 260, isBig,
    });
  }

  function triggerBurst() {
    for (let i = 0; i < 25; i++) setTimeout(spawnSparkle, i * 20);
  }

  function update() {
    time++;
    if (Math.random() < 0.15) spawnSparkle();
    if (Math.random() < 0.003) triggerBurst();
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.life += s.speed;
      if (s.life >= s.maxLife) sparkles.splice(i, 1);
    }
  }

  function drawTextGlow() {
    if (contourPoints.length < 2) return;
    const cx = contourPoints.reduce((s, p) => s + p.x, 0) / contourPoints.length;
    const cy = contourPoints.reduce((s, p) => s + p.y, 0) / contourPoints.length;
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.025);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
    grad.addColorStop(0, `rgba(139,92,246,${0.06 * (0.6 + 0.4 * pulse)})`);
    grad.addColorStop(0.5, `rgba(139,92,246,${0.02})`);
    grad.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawSparkles() {
    for (const s of sparkles) {
      const t = s.life / s.maxLife;
      const alpha = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
      const glowSize = s.size * 5;
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowSize);
      grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.3})`);
      grad.addColorStop(0.3, `rgba(216,180,255,${alpha * 0.12})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
      const r = s.size;
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.9})`;
      ctx.lineWidth = 0.8 + s.size * 0.15;
      ctx.beginPath();
      ctx.moveTo(s.x - r * 1.5, s.y); ctx.lineTo(s.x + r * 1.5, s.y);
      ctx.moveTo(s.x, s.y - r * 1.5); ctx.lineTo(s.x, s.y + r * 1.5);
      ctx.stroke();
      ctx.strokeStyle = `rgba(200,160,255,${alpha * 0.5})`;
      ctx.lineWidth = 0.5 + s.size * 0.1;
      const d = r * 0.9;
      ctx.beginPath();
      ctx.moveTo(s.x - d, s.y - d); ctx.lineTo(s.x + d, s.y + d);
      ctx.moveTo(s.x + d, s.y - d); ctx.lineTo(s.x - d, s.y + d);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.95})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1 + s.size * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    update();
    drawTextGlow();
    drawSparkles();
    animId = requestAnimationFrame(draw);
  }

  resize();
  setTimeout(resize, 300);
  setTimeout(resize, 800);
  window.addEventListener('resize', resize);
  let heroVisible = false;
  const obs = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      heroVisible = entry.isIntersecting;
      if (heroVisible) { resize(); if (!animId) drawLoop(); }
      else { if (animId) { cancelAnimationFrame(animId); animId = null; } }
    }
  }, { threshold: 0.1 });
  obs.observe(hero);
  const titleEl = document.getElementById('hero-title');
  if (titleEl) {
    new MutationObserver(() => { if (heroVisible) computeContour(); }).observe(titleEl, { childList: true, characterData: true, subtree: true });
  }
  let lastW = W, lastH = H;
  let resizeCheckId = null;
  function checkResize() {
    resizeCheckId = null;
    if (!heroVisible) return;
    const r = hero.getBoundingClientRect();
    if (Math.abs(r.width - lastW) > 1 || Math.abs(r.height - lastH) > 1) {
      lastW = r.width; lastH = r.height;
      resize();
    }
  }
  window.addEventListener('resize', () => { if (!resizeCheckId) resizeCheckId = setTimeout(checkResize, 200); });
  function drawLoop() {
    if (!heroVisible) { animId = null; return; }
    if (contourPoints.length < 5) computeContour();
    ctx.clearRect(0, 0, W, H);
    update();
    drawTextGlow();
    drawSparkles();
    animId = requestAnimationFrame(drawLoop);
  }
}

export function init() {
  document.body.style.overflow = 'hidden';
  window.dismissSplash = dismissSplash;
  window.preloadImage = preloadImage;
  window.showToast = showToast;
  window.initScrollReveal = initScrollReveal;
  window.initTiltEffect = initTiltEffect;
  window.staggerEnter = staggerEnter;
  window.animateCheckoutStep = animateCheckoutStep;
  window.updateStitchClip = updateStitchClip;
  window.showSizeGuide = () => document.getElementById('size-guide-modal').classList.add('open');
  window.closeSizeGuide = () => document.getElementById('size-guide-modal').classList.remove('open');

  setTimeout(dismissSplash, SPLASH_MAX_MS);
  document.getElementById('size-guide-modal')?.addEventListener('click', function(e) {
    if (e.target === this) window.closeSizeGuide();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      try { window.closeSearch?.(); } catch(ex) {}
      try { window.closeSizeGuide?.(); } catch(ex) {}
      try { window.closeCart?.(); } catch(ex) {}
      window.closeMobileMenu?.();
      try { window.closeProductOverlay?.(); } catch(ex) {}
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      try { window.openSearch?.(); } catch(ex) {}
    }
  });

  // Stitch canvas
  initStitches();
  // Glitter effect
  initXincoGlitter();
  // Scroll reveal + tilt
  setTimeout(() => { initScrollReveal(); initTiltEffect(); }, 300);
}
