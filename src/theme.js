export function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('xinco-theme', isDark ? 'dark' : 'light');
  const icon = document.querySelector('#theme-toggle .material-symbols-outlined');
  if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
}

export function initTheme() {
  const saved = localStorage.getItem('xinco-theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
    const icon = document.querySelector('#theme-toggle .material-symbols-outlined');
    if (icon) icon.textContent = 'light_mode';
  }
}

export function init() {
  window.toggleTheme = toggleTheme;
  initTheme();
}
