(function () {
  var currentPath = window.location.pathname;

  var nav = document.createElement('nav');
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

  var links = [
    { label: 'Card',      href: '/card'      },
    { label: 'Daily',     href: '/daily'     },
    { label: 'Bookmarks', href: '/bookmarks' },
    { label: 'Notebook',  href: '/notebook'  },
  ];

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
        a.style.color = 'rgba(245,242,235,0.55)';
        a.style.borderColor = 'rgba(245,242,235,0.16)';
      }
    });

    a.addEventListener('mouseleave', function () {
      if (!isActive) {
        a.style.color = 'rgba(245,242,235,0.28)';
        a.style.borderColor = 'rgba(245,242,235,0.07)';
      }
    });

    nav.appendChild(a);
  });

  var target = document.getElementById('site-header');
  if (target) {
    target.appendChild(nav);
  } else {
    document.body.insertBefore(nav, document.body.firstChild);
  }
})();
