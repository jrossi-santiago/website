<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Karla:wght@300;400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg:         #2B2D22;
      --text-cream: #F5F2EB;
      --text-dim:   rgba(245, 242, 235, 0.38);
    }

    html, body {
      height: 100%;
    }

    body {
      min-height: 100vh;
      background-color: var(--bg);
      font-family: 'Karla', system-ui, sans-serif;
      color: var(--text-cream);
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* Subtle noise texture — same as your other pages */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      background-size: 180px 180px;
      pointer-events: none;
      z-index: 0;
      opacity: 0.5;
    }

    /* Header nav lives here */
    #site-header {
      position: relative;
      z-index: 10;
      width: 100%;
    }

    /* Main content area */
    #page {
      position: relative;
      z-index: 1;
      min-height: calc(100vh - 60px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 32px 80px;
    }

    /* The three-line statement block */
    .statement {
      max-width: 820px;
      width: 100%;
    }

    .statement-line {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 400;
      font-size: clamp(32px, 6vw, 68px);
      line-height: 1.2;
      color: var(--text-cream);
      display: block;
      padding: 20px 0;
      border-bottom: 1px solid rgba(245, 242, 235, 0.07);
      letter-spacing: 0.01em;
    }

    .statement-line:last-child {
      border-bottom: none;
    }

    /* Soft fade-in on load */
    .statement {
      animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Mobile adjustments */
    @media (max-width: 480px) {
      #page {
        padding: 32px 24px 64px;
        align-items: flex-start;
        padding-top: 56px;
      }

      .statement-line {
        font-size: clamp(28px, 8vw, 42px);
        padding: 16px 0;
      }
    }
  </style>
</head>
<body>

  <div id="site-header"></div>

  <main id="page">
    <div class="statement">
      <span class="statement-line">Don't give up &amp; work really hard.</span>
      <span class="statement-line">Trust &amp; obey God's Word.</span>
      <span class="statement-line">Make it fun.</span>
    </div>
  </main>

  <script src="/header.js"></script>

</body>
</html>
