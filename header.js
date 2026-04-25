(function () {
  var links = [
    { label: 'SOP',          href: '/sop' },
    { label: 'Affirmations', href: '/affirmations' },
    { label: 'Motivation',   href: '/motivation' },
    { label: 'Bookmarks',    href: '/bookmarks' },
    { label: 'Network',      href: '/network' }
    { label: 'Notebook'.     href: '/notebook'}
  ];

  var currentPath = window.location.pathname.replace(/\/$/, '').toLowerCase();

  var navHTML = links.map(function (l) {
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
  @media (max-width: 480px) {\
    .sh-wrap {\
      padding: 16px 20px 14px;\
      gap: 14px;\
    }\
    .sh-wrap img {\
      width: 36px;\
      height: 36px;\
    }\
    .sh-divider { height: 20px; }\
    .sh-nav a {\
      font-size: 10px;\
      letter-spacing: 0.10em;\
      margin-right: 14px;\
    }\
  }\
</style>\
<div class="sh-wrap">\
  <a class="sh-home" href="/"><img src="/sketch.png" alt="home"></a>\
  <div class="sh-divider"></div>\
  <nav class="sh-nav">' + navHTML + '</nav>\
</div>';

  var target = document.getElementById('site-header');
  if (target) {
    target.innerHTML = html;
  } else {
    document.write(html);
  }
})();
