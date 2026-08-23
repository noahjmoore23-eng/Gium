/* Noah Moore — personal site.
   Two small things: the theme toggle and the nav's active state.
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

  /* Without this a screen reader user cannot tell which theme is active, or
     that pressing the button changed anything. */
  function syncToggle() {
    toggle.setAttribute(
      'aria-pressed',
      currentTheme() === 'dark' ? 'true' : 'false'
    );
  }

  if (toggle) {
    /* The inline head script runs before this button exists, so the initial
       pressed state has to be set here. */
    syncToggle();

    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      syncToggle();
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

    var visible = Object.create(null);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible[entry.target.id] = true;
          else delete visible[entry.target.id];
        });

        links.forEach(function (l) {
          l.classList.remove('active');
        });

        /* First section in document order wins, so two sections straddling the
           band can't fight over the underline. */
        for (var i = 0; i < sections.length; i++) {
          if (visible[sections[i].id]) {
            var link = byId[sections[i].id];
            if (link) link.classList.add('active');
            break;
          }
        }
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

})();
