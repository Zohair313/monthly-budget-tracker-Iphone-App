const fs = require('fs');
const path = require('path');

const mobileDir = path.resolve(__dirname, '..');
const distDir = path.join(mobileDir, 'dist');
const publicDir = path.resolve(mobileDir, '../backend/public');
const iconSrc = path.join(mobileDir, 'assets/icon.png');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function findFiles(dir, ext, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(full, ext, results);
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

if (!fs.existsSync(distDir)) {
  console.error('Error: mobile/dist does not exist. Run "npx expo export --platform web" first.');
  process.exit(1);
}

// 1. Clean & copy dist into backend/public
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}
copyRecursive(distDir, publicDir);

// 2. Relocate fonts out of assets/node_modules/ into /fonts/ so Git & Vercel never ignore them
const fontsDir = path.join(publicDir, 'fonts');
fs.mkdirSync(fontsDir, { recursive: true });

const ttfFiles = findFiles(path.join(publicDir, 'assets'), '.ttf');
const jsBundles = findFiles(path.join(publicDir, '_expo'), '.js');
const preloadLinks = [];

for (const ttfPath of ttfFiles) {
  const fileName = path.basename(ttfPath);
  const relOld = '/' + path.relative(publicDir, ttfPath).replace(/\\/g, '/');
  const relOldNoSlash = relOld.slice(1);
  const relNew = `/fonts/${fileName}`;
  const relNewNoSlash = `fonts/${fileName}`;

  fs.copyFileSync(ttfPath, path.join(fontsDir, fileName));
  preloadLinks.push(
    `<link rel="preload" href="${relNew}" as="font" type="font/ttf" crossorigin="anonymous" />`
  );

  for (const jsPath of jsBundles) {
    const js = fs.readFileSync(jsPath, 'utf8');
    const updated = js.split(relOld).join(relNew).split(relOldNoSlash).join(relNewNoSlash);
    if (updated !== js) {
      fs.writeFileSync(jsPath, updated, 'utf8');
      console.log(`✓ Rewrote font path in ${path.basename(jsPath)} -> ${relNew}`);
    }
  }
}

// Remove assets/node_modules directory completely so no node_modules path exists in public/
const assetsNodeModules = path.join(publicDir, 'assets', 'node_modules');
if (fs.existsSync(assetsNodeModules)) {
  fs.rmSync(assetsNodeModules, { recursive: true, force: true });
}

// 3. Copy 3D Claymorphism App Icon for iOS & Android PWA
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(publicDir, 'icon.png'));
  fs.copyFileSync(iconSrc, path.join(publicDir, 'apple-touch-icon.png'));
  fs.copyFileSync(iconSrc, path.join(publicDir, 'favicon.png'));
}

// 4. Write Web App Manifest (Standalone App Mode)
const manifest = {
  name: 'Budget Tracker',
  short_name: 'Budget',
  description: '3D Claymorphism Monthly Budget Tracker',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#7A63F1',
  theme_color: '#7A63F1',
  icons: [
    {
      src: '/icon.png',
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png'
    }
  ]
};
fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// 5. Write Network-First Safe Service Worker (never caches stale HTML/JS bundles)
const swContent = `const CACHE_NAME = 'budget-tracker-pwa-v5';
const STATIC_ASSETS = ['/icon.png', '/apple-touch-icon.png', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Always let network handle API, HTML navigations, and JS bundles directly (no stale bundle mismatch!)
  if (
    event.request.method !== 'GET' ||
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Only cache fonts and icons
  if (url.pathname.startsWith('/fonts/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ttf')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        });
      })
    );
  }
});
`;
fs.writeFileSync(path.join(publicDir, 'sw.js'), swContent);

// 6. Enhance index.html with Full iPhone Standalone PWA Meta Tags, Font Preload & Safe Area CSS
const indexPath = path.join(publicDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const pwaHeadTags = `
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Budget Tracker" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#7A63F1" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="1024x1024" href="/icon.png" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  ${preloadLinks.join('\n  ')}
  <style>
    html, body, #root {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #7A63F1;
      overscroll-behavior-y: none;
      -webkit-tap-highlight-color: transparent;
      -webkit-text-size-adjust: 100%;
    }
    body {
      display: flex;
      justify-content: center;
      background: linear-gradient(180deg, #7A63F1 0%, #F6F6FC 38%);
    }
    #root {
      max-width: 480px;
      width: 100%;
      height: 100%;
      background-color: #7A63F1;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      box-sizing: border-box;
      position: relative;
      box-shadow: 0 20px 60px rgba(74, 50, 194, 0.25);
    }
    @media (max-width: 500px) {
      #root {
        max-width: 100%;
        box-shadow: none;
      }
    }
  </style>
`;

html = html.replace(/<meta name="viewport"[^>]*>/i, '');
html = html.replace('</head>', `${pwaHeadTags}\n</head>`);

const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function() {});
      });
    }
  </script>
`;
html = html.replace('</body>', `${swScript}\n</body>`);

fs.writeFileSync(indexPath, html, 'utf8');
console.log(
  '✓ Standalone iPhone PWA built successfully into backend/public with relocated /fonts/!'
);
