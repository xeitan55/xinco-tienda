let scene, camera, renderer, modelGroup;
let clock, isRunning;

const SHIRT_IMG = '/remera/diffuse_0.png';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80';

export async function initHero3D() {
  if (isRunning) return;
  const container = document.getElementById('hero-3d-container');
  if (!container) return;

  const THREE = await import('https://esm.sh/three@0.160.0');

  const rect = container.getBoundingClientRect();
  const w = rect.width || 400;
  const h = rect.height || 400;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  camera.position.set(0, 0.2, 4.2);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8b5cf6, 0.6);
  fill.position.set(-2, 1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x8b5cf6, 0.8);
  rim.position.set(0, -1, -3);
  scene.add(rim);
  const glow = new THREE.PointLight(0x8b5cf6, 3, 8);
  glow.position.set(0, 0, -2);
  scene.add(glow);
  const hemi = new THREE.HemisphereLight(0x8b5cf6, 0x000000, 0.4);
  scene.add(hemi);

  clock = new THREE.Clock();
  modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const shape = new THREE.Shape();
  const S = 0.65;
  shape.moveTo(0, S * 0.85);
  shape.quadraticCurveTo(-0.12 * S, S * 0.95, -0.28 * S, S * 0.9);
  shape.lineTo(-0.52 * S, S * 0.72);
  shape.lineTo(-0.52 * S, S * 0.52);
  shape.lineTo(-0.72 * S, S * 0.6);
  shape.lineTo(-0.72 * S, S * 0.28);
  shape.lineTo(-0.52 * S, S * 0.22);
  shape.lineTo(-0.52 * S, -S * 0.85);
  shape.lineTo(0.52 * S, -S * 0.85);
  shape.lineTo(0.52 * S, S * 0.22);
  shape.lineTo(0.72 * S, S * 0.28);
  shape.lineTo(0.72 * S, S * 0.6);
  shape.lineTo(0.52 * S, S * 0.52);
  shape.lineTo(0.52 * S, S * 0.72);
  shape.quadraticCurveTo(0.28 * S, S * 0.95, 0.12 * S, S * 0.95);
  shape.quadraticCurveTo(0, S * 0.9, 0, S * 0.85);

  const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 };
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();

  const texLoader = new THREE.TextureLoader();
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0 });

  const btn = container.querySelector('.hero-3d-loading');
  if (btn) btn.style.display = '';

  texLoader.load(SHIRT_IMG, tex => {
    tex.flipY = false;
    tex.colorSpace = 'srgb';
    const frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0, side: THREE.FrontSide });
    const backMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0, side: THREE.BackSide });
    const mesh = new THREE.Mesh(geom, [frontMat, backMat, sideMat]);
    mesh.scale.set(1.6, 1.6, 1.6);
    modelGroup.add(mesh);
    if (btn) btn.style.display = 'none';
  }, undefined, () => {
    texLoader.load(FALLBACK_IMG, tex => {
      tex.flipY = false;
      tex.colorSpace = 'srgb';
      const frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0, side: THREE.FrontSide });
      const backMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0, side: THREE.BackSide });
      const mesh = new THREE.Mesh(geom, [frontMat, backMat, sideMat]);
      mesh.scale.set(1.6, 1.6, 1.6);
      modelGroup.add(mesh);
      if (btn) btn.style.display = 'none';
    });
  });

  isRunning = true;
  animate();

  window.addEventListener('resize', () => {
    const r = container.getBoundingClientRect();
    if (renderer) renderer.setSize(r.width || 400, r.height || 400);
    if (camera) { camera.aspect = (r.width || 400) / (r.height || 400); camera.updateProjectionMatrix(); }
  });
}

function animate() {
  if (!isRunning) return;
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (modelGroup) {
    modelGroup.rotation.y = t * 0.4;
    modelGroup.position.y = Math.sin(t * 0.6) * 0.12;
  }
  renderer.render(scene, camera);
}

export function destroyHero3D() {
  isRunning = false;
  const container = document.getElementById('hero-3d-container');
  if (container && renderer && renderer.domElement.parentNode === container) {
    container.removeChild(renderer.domElement);
  }
  if (renderer) { renderer.dispose(); renderer = null; }
  scene = null; camera = null; modelGroup = null; clock = null;
}
