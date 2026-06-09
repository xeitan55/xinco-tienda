function hash(x, y) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263;
  h = ((h ^ (h >> 13)) * 1274126177) & 0x7fffffff;
  return h / 0x7fffffff;
}

function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, n) {
  let v = 0, a = 1, f = 1, m = 0;
  for (let i = 0; i < n; i++) {
    v += a * smoothNoise(x * f, y * f);
    m += a;
    a *= 0.5;
    f *= 2;
  }
  return v / m;
}

const LAYERS = [
  { spacing: 28, amp: 80, freq: 0.15, speed: 0.08, alpha: 0.15, lineW: 1.5 },
  { spacing: 18, amp: 50, freq: 0.28, speed: 0.15, alpha: 0.20, lineW: 1.0 },
  { spacing: 10, amp: 30, freq: 0.45, speed: 0.25, alpha: 0.25, lineW: 0.6 },
];

export function init() {
  const wrap = document.getElementById('wave-lens-wrap');
  const canvas = document.getElementById('wave-canvas');
  if (!wrap || !canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, dpr;

  let tx = -9999, ty = -9999;
  let cx = -9999, cy = -9999;
  let time = 0;
  let running = true;
  let hasMoved = false;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateMask() {
    const r = Math.min(W, H, 600) * 0.28;
    const g = `radial-gradient(circle ${r}px at ${cx}px ${cy}px, white 0%, white 22%, transparent 52%, transparent 100%)`;
    wrap.style.maskImage = g;
    wrap.style.webkitMaskImage = g;
  }

  function drawWaves() {
    ctx.clearRect(0, 0, W, H);
    const t = time * 0.001;

    for (const l of LAYERS) {
      ctx.beginPath();
      for (let row = -l.spacing; row < H + l.spacing; row += l.spacing) {
        ctx.moveTo(0, row + Math.sin(row * 0.008 + t * 0.15 * l.speed) * 8);
        for (let x = 3; x <= W; x += 3) {
          const dx = Math.sin(row * 0.008 + t * 0.15 * l.speed) * 8;
          const nx = (x + dx) * 0.003 * l.freq + t * l.speed * 0.08;
          const ny = row * 0.002 + t * l.speed * 0.06;
          const y = row + (fbm(nx, ny, 2) - 0.5) * l.amp;
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = `rgba(0,0,0,${l.alpha})`;
      ctx.lineWidth = l.lineW;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ff3333';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function tick() {
    if (!running) return;
    const ease = 0.07;
    cx += (tx - cx) * ease;
    cy += (ty - cy) * ease;
    updateMask();
    time++;
    drawWaves();
    requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', e => {
    if (!hasMoved) {
      hasMoved = true;
      tx = e.clientX;
      ty = e.clientY;
      cx = tx;
      cy = ty;
    } else {
      tx = e.clientX;
      ty = e.clientY;
    }
  });
  document.addEventListener('mouseleave', () => { tx = -9999; ty = -9999; });
  document.addEventListener('touchmove', e => {
    if (!hasMoved) {
      hasMoved = true;
      const t = e.touches[0];
      if (t) { tx = t.clientX; ty = t.clientY; cx = tx; cy = ty; }
    } else {
      const t = e.touches[0];
      if (t) { tx = t.clientX; ty = t.clientY; }
    }
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });

  resize();

  // show full canvas briefly, then apply mask
  setTimeout(() => {
    if (!hasMoved) {
      cx = W / 2;
      cy = H / 2;
      updateMask();
      setTimeout(() => { tx = -9999; ty = -9999; }, 1200);
    }
  }, 300);

  requestAnimationFrame(tick);

  return () => { running = false; };
}
