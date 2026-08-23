/**
 * Progressive enhancement only: the page is fully readable without this file,
 * and follows the operating system's light/dark preference by default. The
 * toggle exists to override that preference, and is revealed only once the
 * script that makes it work has actually run.
 */
(function () {
  var button = document.getElementById('theme-toggle');
  if (!button) return;

  var label = button.querySelector('.theme-label');

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function currentTheme() {
    return document.documentElement.dataset.theme || (systemPrefersDark() ? 'dark' : 'light');
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    var next = theme === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Private browsing or blocked storage: the choice just will not persist.
    }
  }

  apply(currentTheme());
  button.hidden = false;

  button.addEventListener('click', function () {
    apply(currentTheme() === 'dark' ? 'light' : 'dark');
  });
})();
