/* ============================================================
   SHARED HEADER — header.js
   Inject navbar on all pages
   ============================================================ */

(function() {
  // Create navbar HTML
  const navHTML = `
    <nav class="shared-navbar">
      <a href="https://josephrossi.co">Home</a>
      <a href="https://josephrossi.co/card">Analog</a>
      <a href="https://josephrossi.co/notebook">B-Journal</a>
      <a href="https://josephrossi.co/journal">P-Journal</a>
      <a href="https://josephrossi.co/bookmarks">Bookmarks</a>
    </nav>
  `;

  // Create and inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    /* ============================================================
       SHARED NAVBAR STYLES
       ============================================================ */

    .shared-navbar {
      background: #ffffff;
      border-bottom: 1px solid #d0d0d0;
      padding: 16px 20px;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
      position: relative;
      z-index: 999;
    }

    .shared-navbar a {
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #1a1a1a;
      text-decoration: none;
      transition: color 0.2s;
      white-space: nowrap;
    }

    .shared-navbar a:hover {
      color: #2563eb;
    }

    body {
      display: flex;
      flex-direction: column;
    }

    body > *:not(.shared-navbar) {
      flex: 1;
    }

    @media (max-width: 768px) {
      .shared-navbar {
        padding: 12px 16px;
        gap: 16px;
      }

      .shared-navbar a {
        font-size: 10px;
      }
    }
  `;

  // Inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNavbar);
  } else {
    injectNavbar();
  }

  function injectNavbar() {
    // Add styles to head
    document.head.appendChild(styleSheet);

    // Create navbar element
    const navElement = document.createElement('div');
    navElement.innerHTML = navHTML;
    
    // Insert at top of body
    document.body.insertBefore(navElement.firstElementChild, document.body.firstChild);
  }
})();
