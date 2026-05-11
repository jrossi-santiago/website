/* ============================================================
   header.js — shared navigation for all workspace pages
   Usage: add this anywhere in <head> or before </body>:
     <script src="/header.js"></script>
   Then replace your entire <nav>...</nav> block with:
     <div id="site-header"></div>
   And call:
     renderHeader('capture')   // pass the current page key
   ============================================================ */

const HEADER_PAGES = [
  { key: 'morning',  label: 'morning',  href: '/'         },
  { key: 'tasks',    label: 'tasks',    href: '/tasks'     },
  { key: 'goals',    label: 'goals',    href: '/goals'     },
  { key: 'notes',    label: 'notes',    href: '/notes'     },
  { key: 'calendar', label: 'calendar', href: '/calendar'  },
  { key: 'capture',  label: 'capture',  href: '/capture'   },
  { key: 'crm',      label: 'crm',      href: '/crm'       },
];

function renderHeader(activePage, options = {}) {
  const container = document.getElementById('site-header');
  if (!container) {
    console.warn('header.js: no element with id="site-header" found.');
    return;
  }

  const active = HEADER_PAGES.find(p => p.key === activePage) || HEADER_PAGES[0];

  // ── Inject styles (once)
  if (!document.getElementById('header-js-styles')) {
    const style = document.createElement('style');
    style.id = 'header-js-styles';
    style.textContent = `
      #site-header nav {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 14px 32px;
        border-bottom: 1px solid var(--border);
        background: var(--surface);
        position: sticky;
        top: 0;
        z-index: 100;
        flex-shrink: 0;
      }
      #site-header .h-logo {
        font-family: 'DM Mono', monospace;
        font-size: 13px;
        font-weight: 500;
        color: var(--text);
        margin-right: 12px;
        letter-spacing: -.02em;
        flex-shrink: 0;
      }
      #site-header .h-links {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      #site-header .h-links a {
        font-family: 'DM Mono', monospace;
        font-size: 12px;
        color: var(--muted);
        text-decoration: none;
        padding: 5px 12px;
        border-radius: 6px;
        transition: all .2s;
        letter-spacing: .03em;
      }
      #site-header .h-links a:hover {
        color: var(--text);
        background: var(--surface2);
      }
      #site-header .h-links a.active {
        color: var(--accent);
        background: rgba(124,106,247,.12);
      }
      #site-header .h-spacer { flex: 1; }

      /* ── STATUS — always visible */
      #site-header .h-status {
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        color: var(--muted);
        display: flex;
        align-items: center;
        gap: 0;
        flex-shrink: 0;
      }
      #site-header .status-dot {
        display: inline-block;
        width: 6px; height: 6px;
        border-radius: 50%;
        background: var(--danger);
        margin-right: 6px;
        vertical-align: middle;
        transition: background .3s;
        flex-shrink: 0;
      }
      #site-header .status-dot.connected { background: var(--success); }

      /* ── MOBILE DROPDOWN */
      #site-header .h-mobile-nav {
        display: none;
        align-items: center;
        gap: 8px;
      }
      #site-header .h-mobile-select-wrap {
        position: relative;
      }
      #site-header .h-mobile-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: auto;
        min-width: 110px;
        background: var(--surface2);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        transition: border-color .2s;
        gap: 8px;
      }
      #site-header .h-mobile-trigger:hover {
        border-color: var(--border2);
      }
      #site-header .h-mobile-trigger.open {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(124,106,247,.1);
      }
      #site-header .h-mobile-trigger-label {
        font-family: 'DM Mono', monospace;
        font-size: 12px;
        color: var(--accent);
        letter-spacing: .04em;
        font-weight: 500;
      }
      #site-header .h-mobile-trigger-arrow {
        font-size: 10px;
        color: var(--muted);
        transition: transform .2s;
        flex-shrink: 0;
      }
      #site-header .h-mobile-trigger.open .h-mobile-trigger-arrow {
        transform: rotate(180deg);
      }
      #site-header .h-mobile-dropdown {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        left: auto;
        min-width: 160px;
        background: var(--surface);
        border: 1px solid var(--border2);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,.5);
        z-index: 200;
        opacity: 0;
        transform: translateY(-6px);
        pointer-events: none;
        transition: opacity .15s, transform .15s;
      }
      #site-header .h-mobile-dropdown.open {
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
      }
      #site-header .h-mobile-dropdown a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 16px;
        font-family: 'DM Mono', monospace;
        font-size: 12px;
        color: var(--muted);
        text-decoration: none;
        letter-spacing: .04em;
        transition: all .15s;
        border-bottom: 1px solid var(--border);
      }
      #site-header .h-mobile-dropdown a:last-child {
        border-bottom: none;
      }
      #site-header .h-mobile-dropdown a:hover {
        background: var(--surface2);
        color: var(--text);
      }
      #site-header .h-mobile-dropdown a.active {
        color: var(--accent);
        background: rgba(124,106,247,.08);
      }
      #site-header .h-mobile-dropdown a.active::after {
        content: '✓';
        font-size: 11px;
        color: var(--accent);
      }

      /* ── RESPONSIVE */
      @media (max-width: 700px) {
        #site-header nav {
          padding: 10px 16px;
        }
        #site-header .h-links {
          display: none;
        }
        #site-header .h-logo {
          display: block;
          margin-right: 0;
          font-size: 12px;
          flex: 1;
        }
        #site-header .h-mobile-nav {
          display: flex;
        }
        #site-header .h-spacer {
          display: none;
        }
        /* status text hidden on mobile, just show the dot */
        #site-header #statusText {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Build nav HTML
  const desktopLinks = HEADER_PAGES.map(p =>
    `<a href="${p.href}"${p.key === activePage ? ' class="active"' : ''}>${p.label}</a>`
  ).join('');

  const dropdownLinks = HEADER_PAGES.map(p =>
    `<a href="${p.href}"${p.key === activePage ? ' class="active"' : ''}>${p.label}</a>`
  ).join('');

  container.innerHTML = `
    <nav>
      <span class="h-logo">// workspace</span>

      <!-- Desktop links -->
      <div class="h-links">
        ${desktopLinks}
      </div>

      <span class="h-spacer"></span>

      <!-- Status dot — always visible on all pages -->
      <div class="h-status">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText">connecting…</span>
      </div>

      <!-- Mobile: status dot + page dropdown (right side) -->
      <div class="h-mobile-nav">
        <div class="h-mobile-select-wrap">
          <div class="h-mobile-trigger" id="hMobileTrigger" onclick="toggleHeaderDropdown()">
            <span class="h-mobile-trigger-label">${active.label}</span>
            <span class="h-mobile-trigger-arrow">▼</span>
          </div>
          <div class="h-mobile-dropdown" id="hMobileDropdown">
            ${dropdownLinks}
          </div>
        </div>
      </div>

    </nav>
  `;

  // Close dropdown on outside click
  document.addEventListener('click', function headerOutsideClick(e) {
    const trigger  = document.getElementById('hMobileTrigger');
    const dropdown = document.getElementById('hMobileDropdown');
    if (!trigger || !dropdown) return;
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      trigger.classList.remove('open');
      dropdown.classList.remove('open');
    }
  });
}

function toggleHeaderDropdown() {
  const trigger  = document.getElementById('hMobileTrigger');
  const dropdown = document.getElementById('hMobileDropdown');
  if (!trigger || !dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  trigger.classList.toggle('open', !isOpen);
  dropdown.classList.toggle('open', !isOpen);
}
