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
  { count: 10, amp: 160, freq: 0.08, speed: 0.12, alpha: 0.04, lineW: 1.8 },
  { count: 8, amp: 110, freq: 0.15, speed: 0.20, alpha: 0.06, lineW: 1.2 },
  { count: 6, amp: 70, freq: 0.25, speed: 0.30, alpha: 0.08, lineW: 0.7 },
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
    const r = Math.min(W, H) * 0.3;
    const g = `radial-gradient(circle ${r}px at ${cx}px ${cy}px, white 0%, white 20%, transparent 55%, transparent 100%)`;
    wrap.style.maskImage = g;
    wrap.style.webkitMaskImage = g;
  }

  function drawFlow() {
    ctx.clearRect(0, 0, W, H);
    const t = time * 0.0006;

    for (const l of LAYERS) {
      ctx.beginPath();
      const spacing = W / (l.count + 1);
      for (let i = 0; i < l.count; i++) {
        const bx = spacing * (i + 1) + (i % 2 === 0 ? -40 : 40);
        const ny0 = t * l.speed * 0.08;
        const ox0 = (fbm(bx * 0.001 * l.freq, ny0, 2) - 0.5) * l.amp * 0.3;
        ctx.moveTo(bx + ox0, H + 10);
        const steps = 50;
        for (let j = 1; j <= steps; j++) {
          const p = j / steps;
          const y = H - p * (H + 20);
          const nx = bx * 0.002 * l.freq + t * l.speed * 0.06;
          const ny = p * 0.6 + t * l.speed * 0.05;
          const sway = Math.sin(p * Math.PI + t * l.speed * 0.04) * 20 * p;
          const n = fbm(nx * 2, ny * 2, 2) - 0.5;
          const x = bx + n * l.amp * p + sway;
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = `rgba(0,0,0,${l.alpha})`;
      ctx.lineWidth = l.lineW;
      ctx.stroke();
    }
  }

  function tick() {
    if (!running) return;
    const ease = 0.07;
    cx += (tx - cx) * ease;
    cy += (ty - cy) * ease;
    updateMask();
    time++;
    drawFlow();
    requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  document.addEventListener('mouseleave', () => { tx = -9999; ty = -9999; });
  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (t) { tx = t.clientX; ty = t.clientY; }
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });

  resize();
  requestAnimationFrame(tick);

  return () => { running = false; };
}
