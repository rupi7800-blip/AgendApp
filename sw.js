/* AgendApp — service worker: funzionamento offline e clic sulle notifiche */
const CACHE = 'agendapp-1.2.0';
const ASSETS = [
  './', './index.html', './css/style.css', './js/app.js', './manifest.webmanifest',
  './js/aggiornamenti.js', './icons/logo.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-32.png', './icons/icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).pathname.endsWith('version.json')) return; // controllo aggiornamenti: sempre dalla rete
  const url = new URL(req.url);

  // Font Google: cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // File dell'app: rete prima (così gli aggiornamenti arrivano), cache se offline
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  }
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.id;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        c.focus();
        c.postMessage({ type: 'open-item', id });
        return;
      }
      return self.clients.openWindow('./' + (id ? '?open=' + encodeURIComponent(id) : ''));
    })
  );
});
