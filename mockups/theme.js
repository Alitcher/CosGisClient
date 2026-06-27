// Shared light/dark theme handling for all mockup pages.
(function () {
  const KEY = 'animecon-theme';
  const root = document.documentElement;

  // Initial theme: saved choice → system preference → dark
  const saved = localStorage.getItem(KEY);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  root.setAttribute('data-theme', saved || (prefersLight ? 'light' : 'dark'));

  window.toggleTheme = function () {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem(KEY, next);
  };
})();
