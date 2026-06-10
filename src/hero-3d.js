import { bannerState } from './state.js';
import { isAdmin } from './admin.js';

let scene, camera, renderer, modelGroup, container;
let clock, isRunning;
let _dragData = null;

export async function initHero3D() {
  if (isRunning) return;
  container = document.getElementById('hero-3d-container');
  if (!container) return;

  const THREE = await import('https://esm.sh/three@0.160.0');
  const { OBJLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js');
  const { MTLLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/MTLLoader.js');

  const rect = container.getBoundingClientRect();
  const w = rect.width || 400;
  const h = rect.height || 400;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  camera.position.set(0, 0.15, 4.2);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(1.5, 3, 4);
  scene.add(key);
  const centerGlow = new THREE.PointLight(0xa78bfa, 2.0, 5, 1.5);
  centerGlow.position.set(0, 0.2, 1.8);
  scene.add(centerGlow);
  const backGlow = new THREE.PointLight(0x8b5cf6, 0.8, 4, 2);
  backGlow.position.set(0, 0, -2);
  scene.add(backGlow);
  const hemi = new THREE.HemisphereLight(0xc4b5fd, 0x1e1b4b, 0.3);
  scene.add(hemi);

  clock = new THREE.Clock();
  modelGroup = new THREE.Group();
  modelGroup.userData.baseX = _posToSceneX(bannerState.hero.modelPosX);
  modelGroup.userData.baseY = _posToSceneY(bannerState.hero.modelPosY);
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
          obj.traverse(child => {
            if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => { m.alphaTest = 0.5; });
              } else {
                child.material.alphaTest = 0.5;
              }
            }
          });
          modelGroup.add(obj);
          if (btn) btn.style.display = 'none';
        }, undefined, () => { if (btn) btn.textContent = 'ERROR'; });
    }, undefined, () => { if (btn) btn.textContent = 'ERROR'; });

  _setupDrag();

  isRunning = true;
  animate();

  window.addEventListener('resize', () => {
    const r = container.getBoundingClientRect();
    if (renderer) renderer.setSize(r.width || 400, r.height || 400);
    if (camera) { camera.aspect = (r.width || 400) / (r.height || 400); camera.updateProjectionMatrix(); }
  });
}

function _posToSceneX(pct) { return ((pct || 55) - 50) / 50 * 1.8; }
function _posToSceneY(pct) { return ((pct || 45) - 50) / 50 * 1.0; }

function _setupDrag() {
  if (!container) return;
  let isDragging = false, startX, startY, startPosX, startPosY;

  function onStart(e) {
    if (!isAdmin()) return;
    isDragging = true;
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;
    startPosX = bannerState.hero.modelPosX || 55;
    startPosY = bannerState.hero.modelPosY || 45;
    container.style.cursor = 'grabbing';
  }

  function onMove(e) {
    if (!isDragging) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - startX;
    const dy = pt.clientY - startY;
    const pctX = (dx / window.innerWidth) * 100;
    const pctY = (dy / window.innerHeight) * 100;
    bannerState.hero.modelPosX = Math.max(0, Math.min(100, startPosX + pctX));
    bannerState.hero.modelPosY = Math.max(0, Math.min(100, startPosY + pctY));
    if (modelGroup) {
      modelGroup.userData.baseX = _posToSceneX(bannerState.hero.modelPosX);
      modelGroup.userData.baseY = _posToSceneY(bannerState.hero.modelPosY);
    }
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = '';
    import('./firebase.js').then(({ fbDb }) => {
      if (!fbDb || !window._fb) return;
      const { doc, getDoc, setDoc } = window._fb;
      getDoc(doc(fbDb, 'config', 'banners')).then(snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data.hero) data.hero = {};
        data.hero.modelPosX = bannerState.hero.modelPosX;
        data.hero.modelPosY = bannerState.hero.modelPosY;
        setDoc(doc(fbDb, 'config', 'banners'), data, { merge: true }).catch(() => {});
      }).catch(() => {});
    });
    window.showToast?.('Posición del modelo guardada ✅');
  }

  container.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  container.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('touchend', onEnd);
}

function animate() {
  if (!isRunning) return;
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (modelGroup) {
    modelGroup.rotation.y = t * 0.35;
    modelGroup.position.x = modelGroup.userData.baseX || 0;
    modelGroup.position.y = (modelGroup.userData.baseY || 0) + Math.sin(t * 0.5) * 0.1;
  }
  renderer.render(scene, camera);
}

export function updateModelPosition() {
  if (!modelGroup) return;
  modelGroup.userData.baseX = _posToSceneX(bannerState.hero.modelPosX);
  modelGroup.userData.baseY = _posToSceneY(bannerState.hero.modelPosY);
}

export function destroyHero3D() {
  isRunning = false;
  if (container && renderer && renderer.domElement.parentNode === container) {
    container.removeChild(renderer.domElement);
  }
  if (renderer) { renderer.dispose(); renderer = null; }
  scene = null; camera = null; modelGroup = null; clock = null; container = null;
}
