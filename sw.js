/* AgendApp — service worker
   L'app resta sulla versione installata (funziona anche offline) finché
   non premi "Aggiorna": il tasto compare quando version.json annuncia
   una versione nuova. Non serve cambiare questo file a ogni rilascio. */
const CACHE = 'agendapp-app';
const ASSETS = [
  './', './index.html', './css/style.css', './js/app.js', './js/aggiornamenti.js', './js/ponte.js', './manifest.webmanifest',
  './icons/logo.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-32.png', './icons/icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // solo le copie vecchie di QUESTA app: le altre app sullo stesso indirizzo hanno le loro
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k.split('-')[0] === CACHE.split('-')[0]).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromNetwork(req, key) {
  return fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(key || req, copy));
    }
    return res;
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('version.json')) return; // controllo aggiornamenti: sempre dalla rete

  // Pagina: la versione installata; se manca, dalla rete
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(hit => hit || caches.match(req, { ignoreSearch: true }))
        .then(hit => hit || fromNetwork(req, './index.html'))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // File dell'app e font: prima la copia installata
  const font = url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (url.origin === self.location.origin || font) {
    e.respondWith(
      caches.match(req, { ignoreSearch: url.origin === self.location.origin })
        .then(hit => hit || fromNetwork(req))
        .catch(() => caches.match(req))
    );
  }
});

// Tasto "Aggiorna": attiva subito un eventuale service worker nuovo
const SW_VERSION = '2.0.1';
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  // diagnostica: l'app chiede quale service worker è attivo e se gestisce le push
  if (e.data && e.data.type === 'ping' && e.source) e.source.postMessage({ type: 'pong', v: SW_VERSION, push: true });
});

/* ---------- Notifiche push: arrivano anche ad app chiusa ---------- */
const PUSH_LOG = 'pushlog-agendapp';
async function remember(key) {
  // annota gli avvisi mostrati: all'apertura l'app li mette nel centro notifiche e non li ripete
  try {
    const c = await caches.open(PUSH_LOG);
    const r = await c.match('./__push-log');
    const list = r ? await r.json() : [];
    list.push(key);
    await c.put('./__push-log', new Response(JSON.stringify(list.slice(-300)), { headers: { 'Content-Type': 'application/json' } }));
  } catch (e) { /* ignora */ }
}
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { t: 'AgendApp', b: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = list.find(c => c.visibilityState === 'visible');
    const test = String(d.k || '').startsWith('test-');
    // app aperta davanti agli occhi: l'avviso lo mostra lei (schermo intero o banner)
    if (open && !test) { open.postMessage({ type: 'push', k: d.k }); return; }
    if (d.k && !test) await remember(d.k);
    await self.registration.showNotification(d.t || 'AgendApp', {
      body: d.b || '', tag: d.k || 'agendapp', renotify: true,
      icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
      requireInteraction: !!d.req, silent: d.s === false,
      vibrate: d.v ? [300, 120, 300, 120, 600] : undefined,
      data: { id: d.id || '', occ: d.occ || '' }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {}, id = data.id, occ = data.occ;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        c.focus();
        if (id) c.postMessage({ type: 'open-item', id, occ });
        return;
      }
      return self.clients.openWindow('./' + (id ? '?open=' + encodeURIComponent(id) + (occ ? '&occ=' + occ : '') : ''));
    })
  );
});
