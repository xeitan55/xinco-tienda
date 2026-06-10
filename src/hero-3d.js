let scene, camera, renderer, modelGroup;
let clock, isRunning;

export async function initHero3D() {
  if (isRunning) return;
  const container = document.getElementById('hero-3d-container');
  if (!container) return;

  const THREE = await import('https://esm.sh/three@0.160.0');
  const { OBJLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js');
  const { MTLLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/MTLLoader.js');

  const rect = container.getBoundingClientRect();
  const w = rect.width || 400;
  const h = rect.height || 400;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  camera.position.set(0, 0.15, 4);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8b5cf6, 0.5);
  fill.position.set(-2, 1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x8b5cf6, 0.6);
  rim.position.set(0, -1, -3);
  scene.add(rim);
  const back = new THREE.PointLight(0x8b5cf6, 2.5, 8);
  back.position.set(0, 0, -1.5);
  scene.add(back);
  const hemi = new THREE.HemisphereLight(0x8b5cf6, 0x000000, 0.3);
  scene.add(hemi);

  clock = new THREE.Clock();
  modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const btn = container.querySelector('.hero-3d-loading');
  if (btn) btn.style.display = '';

  new MTLLoader()
    .setPath('/remera/')
    .load('model.mtl', materials => {
      materials.preload();
      new OBJLoader()
        .setPath('/remera/')
        .setMaterials(materials)
        .load('model.obj', obj => {
          obj.scale.set(2.2, 2.2, 2.2);
          obj.position.set(0, 0, 0);
          modelGroup.add(obj);
          if (btn) btn.style.display = 'none';
        }, undefined, () => { if (btn) btn.textContent = 'ERROR'; });
    }, undefined, () => { if (btn) btn.textContent = 'ERROR'; });

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
    modelGroup.rotation.y = t * 0.35;
    modelGroup.position.y = Math.sin(t * 0.5) * 0.1;
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
