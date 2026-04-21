(function() {

  var links = [
    { label: 'Home',         href: 'https://www.josephrossi.co' },
    { label: 'SOP',          href: 'https://www.josephrossi.co/sop' },
    { label: 'Motivation',   href: 'https://www.josephrossi.co/motivation' },
    { label: 'Affirmations', href: 'https://www.josephrossi.co/affirmations' },
    { label: 'Bookmarks',    href: 'https://www.josephrossi.co/bookmarks' },
  ];

  var currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  // Bookmarks needs a wider header to match its 960px layout
  var maxWidth = currentPath.startsWith('/bookmarks') ? '960px' : '680px';

  var navHTML = links.map(function(link) {
    var linkPath = link.href.replace('https://www.josephrossi.co', '') || '/';
    var isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));
    return '<a href="' + link.href + '"' + (isActive ? ' class="active"' : '') + '>' + link.label + '</a>';
  }).join('');

  var headerHTML =
    '<header style="border-bottom: 1px solid #e0e0e0;">' +
      '<div style="max-width:' + maxWidth + '; margin: 0 auto; padding: 24px 24px 20px;">' +
        '<div class="header-top">' +
          '<a href="https://josephrossi.co" class="header-home">Never Stop</a>' +
          '<span class="header-handle">@thejosephrossi</span>' +
        '</div>' +
        '<nav class="header-nav">' + navHTML + '</nav>' +
      '</div>' +
    '</header>';

  var target = document.getElementById('site-header');
  if (target) target.innerHTML = headerHTML;

})();
