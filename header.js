(function () {
  var currentPath = window.location.pathname;

  var links = [
    { label: 'Card',       href: '/card'       },
    { label: 'Daily',      href: '/daily'      },
    { label: 'Bookmarks',  href: '/bookmarks'  },
    { label: 'Notebook',   href: '/notebook'   },
    { label: 'Journal',    href: '/journal'    },
    { label: 'Human Text', href: '/humantext'  },
  ];

  // Inject a <style> tag to handle the mobile/desktop switch via CSS.
  // This is cleaner than JavaScript resize listeners — the browser
  // handles it automatically as the screen size changes.
  var style = document.createElement('style');
  style.textContent =
    '@media (min-width: 640px) { #site-nav-mobile  { display: none !important; } }' +
    '@media (max-width: 639px) { #site-nav-desktop { display: none !important; } }';
  document.head.appendChild(style);


  // ══════════════════════════════════════════
  // DESKTOP NAV — unchanged pill style
  // ══════════════════════════════════════════
  function buildDesktopNav() {
    var nav = document.createElement('nav');
    nav.id = 'site-nav-desktop';
    nav.setAttribute('aria-label', 'Site navigation');
    nav.style.cssText = [
      'position: relative',
      'z-index: 10',
      'width: 100%',
      'display: flex',
      'justify-content: center',
      'gap: 0',
      'padding: 18px 24px 0',
      'font-family: "Karla", system-ui, sans-serif',
    ].join(';');

    links.forEach(function (item, i) {
      var isActive = currentPath === item.href || currentPath === item.href + '/';
      var isFirst  = i === 0;
      var isLast   = i === links.length - 1;

      var borderRadius;
      if (isFirst)     borderRadius = '20px 0 0 20px';
      else if (isLast) borderRadius = '0 20px 20px 0';
      else             borderRadius = '0';

      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      a.style.cssText = [
        'font-family: "Karla", system-ui, sans-serif',
        'font-size: 11px',
        'font-weight: ' + (isActive ? '500' : '300'),
        'letter-spacing: 0.12em',
        'text-transform: uppercase',
        'text-decoration: none',
        'color: ' + (isActive ? 'rgba(245,242,235,0.75)' : 'rgba(245,242,235,0.28)'),
        'padding: 6px 16px',
        'border: 1px solid ' + (isActive ? 'rgba(245,242,235,0.18)' : 'rgba(245,242,235,0.07)'),
        'border-radius: ' + borderRadius,
        'background: ' + (isActive ? 'rgba(245,242,235,0.06)' : 'transparent'),
        'margin-right: -1px',
        'transition: color 0.2s, border-color 0.2s, background 0.2s',
        'cursor: pointer',
        '-webkit-font-smoothing: antialiased',
      ].join(';');

      a.addEventListener('mouseenter', function () {
        if (!isActive) {
          a.style.color       = 'rgba(245,242,235,0.55)';
          a.style.borderColor = 'rgba(245,242,235,0.16)';
        }
      });
      a.addEventListener('mouseleave', function () {
        if (!isActive) {
          a.style.color       = 'rgba(245,242,235,0.28)';
          a.style.borderColor = 'rgba(245,242,235,0.07)';
        }
      });

      nav.appendChild(a);
    });

    return nav;
  }


  // ══════════════════════════════════════════
  // MOBILE NAV — hamburger + dropdown
  // ══════════════════════════════════════════
  function buildMobileNav() {

    // Full-width wrapper, flexbox so the button sits top-right
    var wrapper = document.createElement('div');
    wrapper.id = 'site-nav-mobile';
    wrapper.style.cssText = [
      'position: relative',
      'z-index: 100',
      'width: 100%',
      'display: flex',
      'justify-content: flex-end',
      'padding: 14px 20px 0',
    ].join(';');

    // ── Hamburger button ──
    var btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Open navigation');
    btn.setAttribute('aria-expanded', 'false');
    btn.style.cssText = [
      'background: transparent',
      'border: 1px solid rgba(245,242,235,0.12)',
      'border-radius: 8px',
      'width: 36px',
      'height: 36px',
      'display: flex',
      'flex-direction: column',
      'align-items: center',
      'justify-content: center',
      'gap: 5px',
      'cursor: pointer',
      'padding: 0',
      'flex-shrink: 0',
      'transition: border-color 0.2s',
    ].join(';');

    // The three lines of the hamburger icon
    function makeLine() {
      var line = document.createElement('span');
      line.style.cssText = [
        'display: block',
        'width: 16px',
        'height: 1px',
        'background: rgba(245,242,235,0.5)',
        'border-radius: 2px',
        'transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), opacity 0.2s',
      ].join(';');
      return line;
    }

    var line1 = makeLine();
    var line2 = makeLine();
    var line3 = makeLine();
    btn.appendChild(line1);
    btn.appendChild(line2);
    btn.appendChild(line3);

    // ── Dropdown panel ──
    var dropdown = document.createElement('div');
    dropdown.setAttribute('role', 'menu');
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.style.cssText = [
      'position: absolute',
      'top: calc(100% + 6px)',
      'right: 20px',
      'background: rgba(34,36,27,0.98)',
      'border: 1px solid rgba(245,242,235,0.1)',
      'border-radius: 12px',
      'padding: 6px',
      'min-width: 170px',
      'box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.25)',
      'opacity: 0',
      'transform: translateY(-8px) scale(0.97)',
      'transform-origin: top right',
      'pointer-events: none',
      'transition: opacity 0.2s cubic-bezier(0.22,1,0.36,1), transform 0.2s cubic-bezier(0.22,1,0.36,1)',
    ].join(';');

    // Add each nav link to the dropdown
    links.forEach(function (item) {
      var isActive = currentPath === item.href || currentPath === item.href + '/';

      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      a.setAttribute('role', 'menuitem');
      a.style.cssText = [
        'display: block',
        'font-family: "Karla", system-ui, sans-serif',
        'font-size: 12px',
        'font-weight: ' + (isActive ? '500' : '300'),
        'letter-spacing: 0.12em',
        'text-transform: uppercase',
        'text-decoration: none',
        'color: ' + (isActive ? 'rgba(245,242,235,0.9)' : 'rgba(245,242,235,0.38)'),
        'padding: 11px 14px',
        'border-radius: 7px',
        'background: ' + (isActive ? 'rgba(245,242,235,0.07)' : 'transparent'),
        'transition: color 0.15s, background 0.15s',
        '-webkit-font-smoothing: antialiased',
        'cursor: pointer',
      ].join(';');

      // This empty touchstart listener makes iOS respect hover/active styles
      a.addEventListener('touchstart', function () {}, { passive: true });

      a.addEventListener('mouseenter', function () {
        if (!isActive) {
          a.style.color      = 'rgba(245,242,235,0.7)';
          a.style.background = 'rgba(245,242,235,0.05)';
        }
      });
      a.addEventListener('mouseleave', function () {
        if (!isActive) {
          a.style.color      = 'rgba(245,242,235,0.38)';
          a.style.background = 'transparent';
        }
      });

      dropdown.appendChild(a);
    });

    // ── Open / close logic ──
    var isOpen = false;

    function openMenu() {
      isOpen = true;
      btn.setAttribute('aria-expanded', 'true');
      dropdown.setAttribute('aria-hidden', 'false');
      dropdown.style.opacity       = '1';
      dropdown.style.transform     = 'translateY(0) scale(1)';
      dropdown.style.pointerEvents = 'auto';
      btn.style.borderColor        = 'rgba(245,242,235,0.28)';
      // Animate the three lines into an X
      line1.style.transform = 'translateY(6px) rotate(45deg)';
      line2.style.opacity   = '0';
      line3.style.transform = 'translateY(-6px) rotate(-45deg)';
    }

    function closeMenu() {
      isOpen = false;
      btn.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');
      dropdown.style.opacity       = '0';
      dropdown.style.transform     = 'translateY(-8px) scale(0.97)';
      dropdown.style.pointerEvents = 'none';
      btn.style.borderColor        = 'rgba(245,242,235,0.12)';
      // Return lines to hamburger
      line1.style.transform = 'none';
      line2.style.opacity   = '1';
      line3.style.transform = 'none';
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen) closeMenu(); else openMenu();
    });

    // Clicking anywhere outside the menu closes it
    document.addEventListener('click', function () {
      if (isOpen) closeMenu();
    });

    // Clicking inside the dropdown doesn't close it
    dropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    return wrapper;
  }


  // ══════════════════════════════════════════
  // MOUNT — add both navs, CSS handles which shows
  // ══════════════════════════════════════════
  var target     = document.getElementById('site-header');
  var mobileNav  = buildMobileNav();
  var desktopNav = buildDesktopNav();

  if (target) {
    target.appendChild(mobileNav);
    target.appendChild(desktopNav);
  } else {
    document.body.insertBefore(desktopNav, document.body.firstChild);
    document.body.insertBefore(mobileNav,  document.body.firstChild);
  }

})();
