const CACHE = 'sudwifi-demo-sett-v2';
const FILES = [
 "./",
 "acces-vacanciers.html",
 "assets/dc-lite.js",
 "assets/fonts.css",
 "assets/fonts/fira-sans-latin-600-normal.woff2",
 "assets/fonts/fira-sans-latin-700-normal.woff2",
 "assets/fonts/fira-sans-latin-ext-600-normal.woff2",
 "assets/fonts/fira-sans-latin-ext-700-normal.woff2",
 "assets/fonts/montserrat-latin-500-normal.woff2",
 "assets/fonts/montserrat-latin-600-normal.woff2",
 "assets/fonts/montserrat-latin-700-normal.woff2",
 "assets/fonts/montserrat-latin-ext-500-normal.woff2",
 "assets/fonts/montserrat-latin-ext-600-normal.woff2",
 "assets/fonts/montserrat-latin-ext-700-normal.woff2",
 "assets/fonts/quicksand-latin-500-normal.woff2",
 "assets/fonts/quicksand-latin-600-normal.woff2",
 "assets/fonts/quicksand-latin-700-normal.woff2",
 "assets/fonts/quicksand-latin-ext-500-normal.woff2",
 "assets/fonts/quicksand-latin-ext-600-normal.woff2",
 "assets/fonts/quicksand-latin-ext-700-normal.woff2",
 "assets/icone-192.png",
 "assets/icone-512.png",
 "assets/logo-sud-wifi-couleur.png",
 "assets/logo-sud-wifi-nav.png",
 "assets/plan-camping-demo.jpg",
 "index.html",
 "manifest.webmanifest",
 "mobile.html",
 "mon-equipe.html",
 "suivi-sud-wifi.html",
 "supervision.html",
 "tableau-de-bord.html"
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
