const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const manifestPath = path.join(distDir, 'manifest.json');
const swPath = path.join(distDir, 'service-worker.js');

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
    "Enterprise multi-asset advisory platform with client-side zero-knowledge encryption, AI co-pilot, and fiduciary reporting.",
};
fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2), 'utf8');

// 2. Write service-worker.js
const swContent = `const CACHE_NAME = "asset-array-pwa-v2";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        fetch(event.request)
          .then((res) => {
            if (res && res.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(event.request, res));
            }
          })
          .catch(() => {});
        return cached;
      }
      return fetch(event.request)
        .then((res) => {
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
`;
fs.writeFileSync(swPath, swContent, 'utf8');

// 3. Patch index.html
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Insert Inter font preconnect
  const fontLink = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="manifest" href="/manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Asset Array">`;

  html = html.replace('</head>', `${fontLink}\n</head>`);

  // Insert dark background & Inter font into reset style
  html = html.replace(
    'html,\n      body {\n        height: 100%;\n      }',
    'html,\n      body {\n        height: 100%;\n        background-color: #030712;\n        color: #F8FAFC;\n        font-family: \'Inter\', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n      }'
  );
  html = html.replace(
    '#root {\n        display: flex;\n        height: 100%;\n        flex: 1;\n      }',
    '#root {\n        display: flex;\n        height: 100%;\n        flex: 1;\n        background-color: #030712;\n      }'
  );

  // Insert service-worker registration script before </body>
  const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').catch(function() {});
      });
    }
  </script>`;

  html = html.replace('</body>', `${swScript}\n</body>`);

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Successfully injected PWA assets, font preconnect, and dark reset into dist/index.html');
}
