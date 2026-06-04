const THEME_KEY = 'xinco-theme';

const THEMES = {
  light: { label: 'Claro', icon: 'light_mode', class: '' },
  'dark-soft': { label: 'Oscuro Suave', icon: 'bedtime', class: 'dark-soft' },
  dark: { label: 'Oscuro', icon: 'dark_mode', class: 'dark' },
};

export function setTheme(name) {
  const theme = THEMES[name];
  if (!theme) return;
  document.documentElement.classList.remove('dark', 'dark-soft');
  if (theme.class) document.documentElement.classList.add(theme.class);
  localStorage.setItem(THEME_KEY, name);
  const icon = document.querySelector('#theme-toggle .material-symbols-outlined');
  if (icon) icon.textContent = theme.icon;
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.title = theme.label;
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function cycleTheme() {
  const current = getTheme();
  const names = Object.keys(THEMES);
  const idx = names.indexOf(current);
  const next = names[(idx + 1) % names.length];
  setTheme(next);
  window.showToast?.(`Tema: ${THEMES[next].label}`);
}

export function initTheme() {
  const saved = getTheme();
  setTheme(saved);
}

export function init() {
  window.toggleTheme = cycleTheme;
  window.setTheme = setTheme;
  window.getTheme = getTheme;
  initTheme();
}

export { THEMES };
