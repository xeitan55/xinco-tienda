const THEME_KEY = 'xinco-theme';
const ACCENT_KEY = 'xinco-accent';

const ACCENTS = [
  { name: 'blue',   hex: '#3B82F6', label: 'Azul' },
  { name: 'violet', hex: '#8B5CF6', label: 'Violeta' },
  { name: 'mint',   hex: '#34D399', label: 'Menta' },
  { name: 'pink',   hex: '#F472B6', label: 'Rosa' },
  { name: 'rose',   hex: '#FB7185', label: 'Rosado' },
  { name: 'peach',  hex: '#FB923C', label: 'Durazno' },
];

export function setAccentColor(hex) {
  const r = parseInt(hex.slice(1,3), 16) || 59;
  const g = parseInt(hex.slice(3,5), 16) || 130;
  const b = parseInt(hex.slice(5,7), 16) || 246;
  const root = document.documentElement;
  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--accent-dim', `rgba(${r}, ${g}, ${b}, 0.2)`);
  root.style.setProperty('--accent-strong', `rgba(${r}, ${g}, ${b}, 0.5)`);
  localStorage.setItem(ACCENT_KEY, hex);
  document.querySelectorAll('.accent-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.color === hex);
  });
  document.querySelectorAll('.color-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.color === hex);
  });
  const admin = document.querySelector('#page-admin');
  if (admin) {
    admin.style.setProperty('--admin-accent', hex);
    admin.style.setProperty('--admin-accent-light', `rgba(${r + 40}, ${g + 40}, ${b + 40}, 0.7)`);
    admin.style.setProperty('--admin-accent-dim', `rgba(${r}, ${g}, ${b}, 0.12)`);
  }
}

export function setTheme(name) {
  const themes = { light: { label: 'Claro', icon: 'light_mode' }, dark: { label: 'Oscuro', icon: 'dark_mode' } };
  const theme = themes[name];
  if (!theme) return;
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('theme-transitioning');
  if (name !== 'light') document.documentElement.classList.add(name);
  localStorage.setItem(THEME_KEY, name);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === name);
  });
  setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 400);
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function getAccent() {
  return localStorage.getItem(ACCENT_KEY) || '#3B82F6';
}

export function toggleThemePanel() {
  const panel = document.getElementById('theme-panel');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  if (isOpen) buildAccentSelector();
}

export function init() {
  window.setAccentColor = setAccentColor;
  window.setTheme = setTheme;
  window.getTheme = getTheme;
  window.toggleThemePanel = toggleThemePanel;

  const savedTheme = getTheme();
  const savedAccent = getAccent();
  setTheme(savedTheme);
  setAccentColor(savedAccent);

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('theme-panel');
    const container = document.getElementById('theme-panel-container');
    if (!panel || !container) return;
    if (!container.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
}

function buildAccentSelector() {
  const container = document.getElementById('accent-selector');
  if (!container || container.dataset.built) return;
  container.dataset.built = '1';
  ACCENTS.forEach(a => {
    const swatch = document.createElement('button');
    swatch.className = 'accent-swatch';
    swatch.dataset.color = a.hex;
    swatch.style.background = a.hex;
    swatch.setAttribute('aria-label', a.label);
    swatch.onclick = () => setAccentColor(a.hex);
    if (a.hex === getAccent()) swatch.classList.add('active');
    container.appendChild(swatch);
  });
}
