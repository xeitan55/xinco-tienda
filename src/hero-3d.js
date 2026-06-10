import { bannerState } from './state.js';
import { isAdmin } from './admin.js';

let _THREE = null;
const _instances = new Map();
let _globalIsRunning = false;
let _auraStyle = 'none';

export async function initHero3D(containerId) {
  containerId = containerId || 'hero-3d-container';
  if (_instances.has(containerId)) return;
  const container = document.getElementById(containerId);
  if (!container) return;

  _THREE = await import('https://esm.sh/three@0.160.0');
  const THREE = _THREE;
  const { OBJLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js');
  const { MTLLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/MTLLoader.js');

  const rect = container.getBoundingClientRect();
  const w = rect.width || 400;
  const h = rect.height || 400;

  const scene = new THREE.Scene();
  const   camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
  camera.position.set(0, 0.1, 3.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.08);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffffff, bannerState.hero.modelFrontLight ?? 0.85);
  keyLight.position.set(2, 2.5, 3);
  scene.add(keyLight);
  const fill = new THREE.DirectionalLight(0xffffff, 0.2);
  fill.position.set(-1.5, 0.5, 2);
  scene.add(fill);
  const rimLight = new THREE.DirectionalLight(0xc4b5fd, bannerState.hero.modelBackLight ?? 0.3);
  rimLight.position.set(0, 0.5, -3);
  scene.add(rimLight);
  const hemi = new THREE.HemisphereLight(0xa78bfa, 0x1e1b4b, 0.15);
  scene.add(hemi);

  const clock = new THREE.Clock();
  const modelGroup = new THREE.Group();
  modelGroup.userData.baseX = _posToSceneX(bannerState.hero.modelPosX);
  modelGroup.userData.baseY = _posToSceneY(bannerState.hero.modelPosY);
  scene.add(modelGroup);

  const inst = { scene, camera, renderer, container, clock, modelGroup, keyLight, rimLight, auraSprite: null, modelLoaded: false };
  _instances.set(containerId, inst);

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
          inst.modelLoaded = true;
          _applyAura(inst, bannerState.hero.modelAuraStyle || 'none', bannerState.hero.modelAuraColor || '#a78bfa');
          if (btn) btn.style.display = 'none';
        }, undefined, () => { if (btn) btn.textContent = 'ERROR'; });
    }, undefined, () => { if (btn) btn.textContent = 'ERROR'; });

  _setupDrag(container);

  if (!_globalIsRunning) {
    _globalIsRunning = true;
    _animateLoop();
  }

  window.addEventListener('resize', () => {
    const r = container.getBoundingClientRect();
    if (renderer) renderer.setSize(r.width || 400, r.height || 400);
    if (camera) { camera.aspect = (r.width || 400) / (r.height || 400); camera.updateProjectionMatrix(); }
  });
}

function _posToSceneX(pct) { return ((pct ?? 22) - 50) / 50 * 1.8; }
function _posToSceneY(pct) { return ((pct ?? 32) - 50) / 50 * 1.0; }

function _setupDrag(container) {
  if (!container) return;
  let isDragging = false, startX, startY, startPosX, startPosY;

  function onStart(e) {
    if (!isAdmin()) return;
    isDragging = true;
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;
    startPosX = bannerState.hero.modelPosX || 22;
    startPosY = bannerState.hero.modelPosY || 32;
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
    _syncModelPosition();
    _syncSlider('hero-model-pos-x', bannerState.hero.modelPosX);
    _syncSlider('hero-model-pos-y', bannerState.hero.modelPosY);
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = '';
    window.showToast?.('Posición actualizada');
  }

  container.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  container.addEventListener('touchstart', onStart, { passive: true });
  container.addEventListener('touchmove', onMove, { passive: true });
  container.addEventListener('touchend', onEnd);
}

function _syncSlider(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = Math.round(val);
}

function _syncModelPosition() {
  for (const inst of _instances.values()) {
    if (inst.modelGroup) {
      inst.modelGroup.userData.baseX = _posToSceneX(bannerState.hero.modelPosX);
      inst.modelGroup.userData.baseY = _posToSceneY(bannerState.hero.modelPosY);
      if (inst.auraSprite) {
        inst.auraSprite.position.x = inst.modelGroup.userData.baseX || 0;
        inst.auraSprite.position.y = (inst.modelGroup.userData.baseY || 0) - 0.15;
      }
    }
  }
}

function _animateLoop() {
  if (!_globalIsRunning) return;
  requestAnimationFrame(_animateLoop);
  const t = performance.now() / 1000;
  for (const [id, inst] of _instances) {
    if (inst.modelGroup) {
      inst.modelGroup.rotation.y = t * 0.35;
      inst.modelGroup.position.x = inst.modelGroup.userData.baseX || 0;
      inst.modelGroup.position.y = (inst.modelGroup.userData.baseY || 0) + Math.sin(t * 0.5) * 0.1;
    }
    if (inst.auraSprite && _auraStyle === 'pulse') {
      const pulse = 0.7 + Math.sin(t * 1.5) * 0.3;
      inst.auraSprite.material.opacity = pulse;
    }
    if (inst.renderer && inst.scene && inst.camera) {
      inst.renderer.render(inst.scene, inst.camera);
    }
  }
}

export function updateLights(frontIntensity, backIntensity) {
  for (const inst of _instances.values()) {
    if (inst.keyLight) inst.keyLight.intensity = frontIntensity ?? bannerState.hero.modelFrontLight ?? 0.85;
    if (inst.rimLight) inst.rimLight.intensity = backIntensity ?? bannerState.hero.modelBackLight ?? 0.3;
  }
}

export function updateAura(style, color) {
  _auraStyle = style || 'none';
  const c = color || bannerState.hero.modelAuraColor || '#a78bfa';
  for (const inst of _instances.values()) {
    _applyAura(inst, _auraStyle, c);
  }
}

function _applyAura(inst, style, color) {
  const THREE = _THREE;
  if (!THREE || !inst.scene || !inst.modelLoaded) return;

  if (inst.auraSprite) {
    inst.scene.remove(inst.auraSprite);
    inst.auraSprite.material.map?.dispose();
    inst.auraSprite.material.dispose();
    inst.auraSprite = null;
  }

  if (style === 'none') return;

  const size = 2.4;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const hex = color || '#a78bfa';
  const r = parseInt(hex.slice(1,3), 16) || 167;
  const g = parseInt(hex.slice(3,5), 16) || 139;
  const b = parseInt(hex.slice(5,7), 16) || 250;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
  gradient.addColorStop(0.3, `rgba(${r},${g},${b},0.25)`);
  gradient.addColorStop(0.6, `rgba(${r},${g},${b},0.08)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: style === 'pulse' ? 0.8 : 1.0
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  sprite.position.set(
    inst.modelGroup?.userData?.baseX || 0,
    (inst.modelGroup?.userData?.baseY || 0) - 0.15,
    -0.3
  );
  inst.scene.add(sprite);
  inst.auraSprite = sprite;
}

export function updateModelPosition() {
  _syncModelPosition();
}

export function setHero3DPosition(xPct, yPct) {
  bannerState.hero.modelPosX = Math.max(0, Math.min(100, xPct));
  bannerState.hero.modelPosY = Math.max(0, Math.min(100, yPct));
  _syncModelPosition();
}

export function destroyHero3D(containerId) {
  containerId = containerId || 'hero-3d-container';
  const inst = _instances.get(containerId);
  if (!inst) return;
  if (inst.container && inst.renderer && inst.renderer.domElement.parentNode === inst.container) {
    inst.container.removeChild(inst.renderer.domElement);
  }
  if (inst.auraSprite) {
    try { inst.scene?.remove(inst.auraSprite); } catch(e) {}
  }
  if (inst.renderer) { inst.renderer.dispose(); }
  _instances.delete(containerId);
  if (_instances.size === 0) _globalIsRunning = false;
}
