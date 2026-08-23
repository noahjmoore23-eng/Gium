/* Noah Moore — personal site.
   Three small things: theme toggle, nav state, and the footer year.
   No dependencies, no build step. */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------------------------------------------------- theme ---
     The theme is applied in an inline <head> script so the page never
     flashes the wrong colors. Here we only wire up the toggle. */

  var toggle = document.getElementById('theme-toggle');

  function currentTheme() {
    var stamped = root.getAttribute('data-theme');
    if (stamped) return stamped;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* private browsing — the choice just won't persist */
      }
    });
  }

  /* ------------------------------------------------------------ nav ---
     A hairline appears under the header once the page scrolls, and the
     section you're reading is underlined in the nav. */

  var nav = document.getElementById('nav');

  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var links = Array.prototype.slice.call(
    document.querySelectorAll('.nav nav a[href^="#"]')
  );

  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.remove('active');
          });
          var link = byId[entry.target.id];
          if (link) link.classList.add('active');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------- year --- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
