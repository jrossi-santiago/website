(function () {
  var links = [
    { label: 'SOP',          href: '/sop' },
    { label: 'Affirmations', href: '/affirmations' },
    { label: 'Motivation',   href: '/motivation' },
    { label: 'Bookmarks',    href: '/bookmarks' },
    { label: 'Network',      href: '/network' },
    { label: 'Notebook',     href: '/notebook' },
    { label: 'Human Text',   href: '/humantext' }
  ];

  var currentPath = window.location.pathname.replace(/\/$/, '').toLowerCase();

  var navHTML = links.map(function (l) {
    var isActive = currentPath === l.href || currentPath === l.href + '.html';
    return '<a href="' + l.href + '"' + (isActive ? ' class="active"' : '') + '>' + l.label + '</a>';
  }).join('');

  var mobileNavHTML = links.map(function (l) {
    var isActive = currentPath === l.href || currentPath === l.href + '.html';
    return '<a href="' + l.href + '"' + (isActive ? ' class="active"' : '') + '>' + l.label + '</a>';
  }).join('');

  var html = '\
<link href="https://fonts.googleapis.com/css2?family=Lustria&family=Lato:wght@300;400&display=swap" rel="stylesheet">\
<style>\
  .sh-wrap {\
    max-width: 680px;\
    margin: 0 auto;\
    padding: 24px 32px 20px;\
    border-bottom: 1px solid #2a2a2a;\
    display: flex;\
    align-items: center;\
    gap: 20px;\
    position: relative;\
  }\
  .sh-wrap a.sh-home {\
    display: block;\
    flex-shrink: 0;\
    text-decoration: none;\
  }\
  .sh-wrap img {\
    width: 44px;\
    height: 44px;\
    border-radius: 50%;\
    object-fit: cover;\
    filter: invert(1);\
    border: 1px solid #333333;\
    display: block;\
    transition: opacity 0.2s;\
  }\
  .sh-wrap img:hover { opacity: 0.7; }\
  .sh-divider {\
    width: 1px;\
    height: 24px;\
    background: #2a2a2a;\
    flex-shrink: 0;\
  }\
  .sh-nav {\
    display: flex;\
    align-items: center;\
    flex-wrap: wrap;\
    gap: 0;\
    flex: 1;\
  }\
  .sh-nav a {\
    font-family: "Lato", sans-serif;\
    font-weight: 300;\
    font-size: 11px;\
    letter-spacing: 0.14em;\
    text-transform: uppercase;\
    color: #555555;\
    text-decoration: none;\
    margin-right: 20px;\
    padding-bottom: 2px;\
    transition: color 0.2s;\
    white-space: nowrap;\
  }\
  .sh-nav a:hover { color: #e0e0e0; }\
  .sh-nav a.active {\
    color: #e0e0e0;\
    border-bottom: 1px solid #e0e0e0;\
  }\
  .sh-hamburger {\
    display: none;\
    flex-direction: column;\
    justify-content: center;\
    gap: 5px;\
    background: none;\
    border: none;\
    cursor: pointer;\
    padding: 4px;\
    margin-left: auto;\
    flex-shrink: 0;\
  }\
  .sh-hamburger span {\
    display: block;\
    width: 22px;\
    height: 1px;\
    background: #555555;\
    transition: background 0.2s;\
  }\
  .sh-hamburger:hover span { background: #e0e0e0; }\
  .sh-mobile-menu {\
    display: none;\
    position: absolute;\
    top: 100%;\
    right: 20px;\
    background: #111111;\
    border: 1px solid #2a2a2a;\
    padding: 16px 20px;\
    z-index: 999;\
    min-width: 160px;\
  }\
  .sh-mobile-menu.open { display: block; }\
  .sh-mobile-menu a {\
    display: block;\
    font-family: "Lato", sans-serif;\
    font-weight: 300;\
    font-size: 11px;\
    letter-spacing: 0.14em;\
    text-transform: uppercase;\
    color: #555555;\
    text-decoration: none;\
    padding: 8px 0;\
    border-bottom: 1px solid #1e1e1e;\
    transition: color 0.2s;\
  }\
  .sh-mobile-menu a:last-child { border-bottom: none; }\
  .sh-mobile-menu a:hover { color: #e0e0e0; }\
  .sh-mobile-menu a.active { color: #e0e0e0; }\
  @media (max-width: 600px) {\
    .sh-nav { display: none; }\
    .sh-divider { display: none; }\
    .sh-hamburger { display: flex; }\
    .sh-wrap {\
      padding: 16px 20px 14px;\
      gap: 14px;\
    }\
    .sh-wrap img {\
      width: 36px;\
      height: 36px;\
    }\
  }\
</style>\
<div class="sh-wrap">\
  <a class="sh-home" href="/"><img src="/sketch.png" alt="home"></a>\
  <div class="sh-divider"></div>\
  <nav class="sh-nav">' + navHTML + '</nav>\
  <button class="sh-hamburger" id="sh-hamburger-btn" aria-label="Open menu">\
    <span></span><span></span><span></span>\
  </button>\
  <div class="sh-mobile-menu" id="sh-mobile-menu">' + mobileNavHTML + '</div>\
</div>';

  var target = document.getElementById('site-header');
  if (target) {
    target.innerHTML = html;
  } else {
    document.write(html);
  }

  // Wire up hamburger AFTER the HTML has been inserted
  setTimeout(function () {
    var btn = document.getElementById('sh-hamburger-btn');
    var menu = document.getElementById('sh-mobile-menu');
    if (btn && menu) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', function () {
        menu.classList.remove('open');
      });
    }
  }, 0);

})();
