(function() {

  var links = [
    { label: 'Home',         href: 'https://www.josephrossi.co' },
    { label: 'SOP',          href: 'https://www.josephrossi.co/sop' },
    { label: 'Motivation',   href: 'https://www.josephrossi.co/motivation' },
    { label: 'Affirmations', href: 'https://www.josephrossi.co/affirmations' },
    { label: 'Bookmarks',    href: 'https://www.josephrossi.co/bookmarks' },
  ];

  var currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  var navHTML = links.map(function(link) {
    var linkPath = link.href.replace('https://www.josephrossi.co', '') || '/';
    var isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));
    return '<a href="' + link.href + '"' + (isActive ? ' class="active"' : '') + '>' + link.label + '</a>';
  }).join('');

  var headerHTML =
    '<header>' +
      '<div class="header-inner">' +
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
