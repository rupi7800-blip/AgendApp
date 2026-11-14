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
const SW_VERSION = '2.1.0';
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  // diagnostica: l'app chiede quale service worker è attivo e se gestisce le push
  if (e.data && e.data.type === 'ping' && e.source) e.source.postMessage({ type: 'pong', v: SW_VERSION, push: true });
});

/* ---------- Notifiche push: arrivano anche ad app chiusa ----------
   Avvisi "schermo intero": la notifica resta finché non rispondi, ha i tasti
   Fatto / Tra 10 min e si ripete dopo 2, 5 e 10 minuti se la ignori.
   Toccandola si apre AgendApp direttamente sull'avviso a tutto schermo. */
const PUSH_LOG = 'pushlog-agendapp';
const PUSH_URL = 'https://orwotjyfhpqasxpowvkt.supabase.co/functions/v1/agendapp-push';
async function store() { return caches.open(PUSH_LOG); }
async function readJSON(name, def) {
  try { const r = await (await store()).match('./' + name); return r ? await r.json() : def; } catch (e) { return def; }
}
async function writeJSON(name, val) {
  try { await (await store()).put('./' + name, new Response(JSON.stringify(val), { headers: { 'Content-Type': 'application/json' } })); } catch (e) { /* ignora */ }
}
// annota gli avvisi mostrati: all'apertura l'app li mette nel centro notifiche e non li ripete
async function remember(key) {
  const list = await readJSON('__push-log', []);
  list.push(key);
  await writeJSON('__push-log', list.slice(-300));
}
// azioni fatte dalla notifica (fatto, posticipa): l'app le applica quando si apre
async function rememberAction(a) {
  const list = await readJSON('__push-actions', []);
  list.push(a);
  await writeJSON('__push-actions', list.slice(-100));
}
async function server(body) {
  const cred = await readJSON('__push-cred', null);
  if (!cred || !cred.device) return;
  try {
    await fetch(PUSH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ device: cred.device, token: cred.token }, body)) });
  } catch (e) { /* offline: l'app riallinea quando si apre */ }
}
const baseKey = k => String(k || '').split('|z')[0].split('|r')[0];

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
    const actions = [];
    if (d.req || d.c) {
      if (d.c) actions.push({ action: 'done', title: '✓ ' + d.c });
      actions.push({ action: 'snooze', title: '⏰ Tra 10 min' });
      if (!d.c) actions.push({ action: 'ok', title: 'Ho capito' });
    }
    const tag = d.k ? baseKey(d.k) : 'agendapp';
    await self.registration.showNotification((d.r ? '🔔 ' : '') + (d.t || 'AgendApp'), {
      body: (d.r ? 'Promemoria ripetuto · ' : '') + (d.b || ''), tag, renotify: true,
      icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
      requireInteraction: !!d.req, silent: d.s === false,
      vibrate: d.v ? (d.req ? [800, 300, 800, 300, 800, 300, 1200] : [300, 120, 300]) : undefined,
      timestamp: Date.now(), actions,
      data: { id: d.id || '', occ: d.occ || '', k: d.k || '', t: d.t || '', b: d.b || '', req: !!d.req, s: !!d.s, v: !!d.v, c: d.c || '' }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {}, id = data.id, occ = data.occ, k = data.k, base = baseKey(k);
  const act = e.action || 'open';
  e.waitUntil((async () => {
    if (act === 'done') {
      await rememberAction({ a: 'done', id, occ, k, at: Date.now() });
      await server({ a: 'ack', keys: [`${id}|${occ}|`] });
      return;
    }
    if (act === 'snooze') {
      const at = Date.now() + 10 * 60000;
      await rememberAction({ a: 'snooze', id, occ, k: base, at });
      await server({ a: 'ack', keys: [base] });
      await server({ a: 'snooze', k: base, at, p: { t: data.t, b: data.b, id, occ, req: data.req, s: data.s, v: data.v, c: data.c } });
      return;
    }
    if (k) await server({ a: 'ack', keys: [base] });
    if (act === 'ok' || !id) return;
    // tocco sulla notifica: apre AgendApp sull'avviso a tutto schermo
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      try { await c.focus(); } catch (err) { /* ignora */ }
      c.postMessage({ type: 'open-alert', id, occ, k });
      return;
    }
    await self.clients.openWindow('./?alert=' + encodeURIComponent(id) + '&occ=' + encodeURIComponent(occ || '') + '&k=' + encodeURIComponent(k || ''));
  })());
});

// notifica scorsa via: l'hai vista, niente ripetizioni
self.addEventListener('notificationclose', e => {
  const k = (e.notification.data || {}).k;
  if (k && !String(k).startsWith('test-')) e.waitUntil(server({ a: 'ack', keys: [baseKey(k)] }));
});
