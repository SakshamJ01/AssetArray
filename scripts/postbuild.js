const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const manifestPath = path.join(distDir, 'manifest.json');
const swPath = path.join(distDir, 'service-worker.js');

if (!fs.existsSync(distDir)) {
  console.error(`postbuild: dist/ not found at ${distDir}. Run expo export first.`);
  process.exit(1);
}

// 1. Write manifest.json
const manifestContent = {
  short_name: "Asset Array",
  name: "Asset Array | Private Wealth Management",
  icons: [
    {
      src: "/favicon.ico",
      sizes: "64x64 32x32 24x24 16x16",
      type: "image/x-icon",
    },
  ],
  start_url: "/",
  background_color: "#030712",
  theme_color: "#E0A84C",
  display: "standalone",
  orientation: "any",
  description:
    "Enterprise multi-asset advisory platform with client-side zero-knowledge encryption, AI co-pilot, and advisor-grade reporting.",
};
fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2), 'utf8');

// 2. Write self-destructing service-worker.js to unregister legacy PWA SWs
const swContent = `self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});
`;
fs.writeFileSync(swPath, swContent, 'utf8');

// 3. Patch index.html (idempotent: marker comment prevents double-injection)
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const MARKER = "<!-- asset-array-postbuild-v2 -->";

  if (!html.includes(MARKER)) {
  // Insert Inter font preconnect & resilience script in head
  const headAdditions = `
    ${MARKER}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="manifest" href="/manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Asset Array">
    <script>
      window.addEventListener('error', function(e) {
        if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
          if (!sessionStorage.getItem('aa_reloaded')) {
            sessionStorage.setItem('aa_reloaded', '1');
            window.location.reload(true);
          }
        }
      }, true);
    </script>`;

  html = html.replace('</head>', `${headAdditions}\n</head>`);

  // Insert dark background & Inter font into reset style
  html = html.replace(
    'html,\n      body {\n        height: 100%;\n      }',
    'html,\n      body {\n        height: 100%;\n        background-color: #030712;\n        color: #F8FAFC;\n        font-family: \'Inter\', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n      }'
  );
  html = html.replace(
    '#root {\n        display: flex;\n        height: 100%;\n        flex: 1;\n      }',
    '#root {\n        display: flex;\n        height: 100%;\n        flex: 1;\n        background-color: #030712;\n      }'
  );

  // Insert service-worker cleanup script before </body>
  const swCleanupScript = `
  <script data-aa-postbuild="sw-cleanup">
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var r of regs) { r.unregister(); }
      }).catch(function() {});
    }
    if (typeof caches !== 'undefined') {
      caches.keys().then(function(keys) {
        keys.forEach(function(k) { caches.delete(k); });
      }).catch(function() {});
    }
  </script>`;

  if (!html.includes('data-aa-postbuild="sw-cleanup"')) {
    html = html.replace('</body>', `${swCleanupScript}\n</body>`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Successfully injected font preconnect, dark reset, and cache cleanup into dist/index.html');
  } else {
    console.log('postbuild: already applied, skipping duplicate injection.');
  }
}
