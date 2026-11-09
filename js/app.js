/* =========================================================
   AgendApp — logica dell'applicazione
   Dati salvati in locale (localStorage) sul dispositivo.
   ========================================================= */
(() => {
'use strict';

/* ---------------- Utilità ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
const wd = d => (d.getDay() + 6) % 7; // 0 = lunedì
const startOfWeek = d => addDays(d, -wd(d));
const todayD = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const dayDiff = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const MESI_S = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
const GG = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const EUR = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const fmtLong = s => { const d = pd(s); return `${GIORNI[wd(d)]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; };
const fmtMed = s => { const d = pd(s); return `${GIORNI[wd(d)]} ${d.getDate()} ${MESI[d.getMonth()]}`; };
const fmtShort = s => { const d = pd(s); return `${GG[wd(d)].toLowerCase()} ${d.getDate()} ${MESI_S[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}`; };
function relDay(s) {
  const n = dayDiff(ds(todayD()), s);
  if (n === 0) return 'oggi';
  if (n === 1) return 'domani';
  if (n === -1) return 'ieri';
  if (n === 2) return 'dopodomani';
  return n > 0 ? `tra ${n} giorni` : `${-n} giorni fa`;
}

/* ---------------- Icone ---------------- */
const ICONS = {
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  euro: '<path d="M4 10h12M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
  note: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5z"/><path d="M15 3v6h6M7 13h8M7 17h5"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  moto: '<circle cx="5" cy="16" r="3"/><circle cx="19" cy="16" r="3"/><path d="M5 16l3.5-5h6l4.5 5M14.5 11 13 7h3M8.5 11H6"/>',
  camper: '<rect x="2" y="5" width="16" height="11" rx="2"/><path d="M18 9h2l2 3v4h-4M6 9h4v3H6zM13 9h2"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.5-4.4a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  boat: '<path d="M22 18H2a4 4 0 0 0 4 3h12a4 4 0 0 0 4-3z"/><path d="M21 14 10 2 3 14z"/><path d="M10 2v16"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  dumbbell: '<path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.8 1C6.5 17.5 4.5 16.8 4.5 16.8A3.5 3.5 0 0 1 5.5 10z"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  belloff: '<path d="M8.7 3A6 6 0 0 1 18 8a21 21 0 0 0 .6 5M17 17H3s3-2 3-9a4.7 4.7 0 0 1 .3-1.7M10.3 21a1.9 1.9 0 0 0 3.4 0M2 2l20 20"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>'
};
const I = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.dots}</svg>`;

/* ---------------- Definizioni ---------------- */
const TYPES = {
  appuntamento: { label: 'Appuntamento', plural: 'Appuntamenti', icon: 'clock', desc: 'Visite, incontri, riunioni' },
  scadenza: { label: 'Scadenza', plural: 'Scadenze', icon: 'flag', desc: 'Termini da non dimenticare' },
  pagamento: { label: 'Pagamento', plural: 'Pagamenti', icon: 'euro', desc: 'Bollette, rate, abbonamenti' },
  compleanno: { label: 'Compleanno', plural: 'Compleanni', icon: 'cake', desc: 'Ricorrenze di chi ti sta a cuore' },
  nota: { label: 'Nota', plural: 'Note', icon: 'note', desc: 'Appunti e promemoria' }
};
const TYPE_ORDER = Object.keys(TYPES);
const CHECKABLE = new Set(['scadenza', 'pagamento', 'nota']);

const CATS = {
  personale: { label: 'Personale', icon: 'user', color: '#6366d9' },
  lavoro: { label: 'Lavoro', icon: 'briefcase', color: '#2f6fde' },
  salute: { label: 'Salute', icon: 'heart', color: '#e5484d' },
  mezzi: { label: 'Mezzi', icon: 'car', color: '#56657f' },
  casa: { label: 'Casa', icon: 'home', color: '#b7791f' },
  famiglia: { label: 'Famiglia e amici', icon: 'users', color: '#d63f97' },
  svago: { label: 'Svago', icon: 'sun', color: '#ef8a00' },
  sport: { label: 'Sport', icon: 'dumbbell', color: '#0f9d8a' },
  studio: { label: 'Studio', icon: 'book', color: '#7048e8' },
  animali: { label: 'Animali', icon: 'paw', color: '#8d6e63' },
  finanze: { label: 'Finanze', icon: 'wallet', color: '#1e9a68' },
  altro: { label: 'Altro', icon: 'dots', color: '#868e96' }
};

const VTYPES = {
  auto: { label: 'Auto', icon: 'car' },
  moto: { label: 'Moto', icon: 'moto' },
  camper: { label: 'Camper', icon: 'camper' },
  furgone: { label: 'Furgone', icon: 'truck' },
  barca: { label: 'Barca', icon: 'boat' },
  bicicletta: { label: 'Bicicletta', icon: 'bike' }
};
const T_ASS = { title: 'Assicurazione', type: 'pagamento', repeat: 'yearly' };
const T_BOLLO = { title: 'Bollo', type: 'pagamento', repeat: 'yearly' };
const T_REV = { title: 'Revisione', type: 'scadenza', repeat: 'yearly2' };
const T_TAGL = { title: 'Tagliando', type: 'scadenza', repeat: 'yearly' };
const T_GOMME = { title: 'Cambio gomme', type: 'appuntamento', repeat: 'monthly6' };
const VTEMPLATES = {
  auto: [T_ASS, T_BOLLO, T_REV, T_TAGL, T_GOMME],
  moto: [T_ASS, T_BOLLO, T_REV, T_TAGL],
  camper: [T_ASS, T_BOLLO, T_REV, T_TAGL, T_GOMME, { title: 'Rimessaggio', type: 'pagamento', repeat: 'yearly' }],
  furgone: [T_ASS, T_BOLLO, T_REV, T_TAGL, T_GOMME],
  barca: [T_ASS, { title: 'Ormeggio / posto barca', type: 'pagamento', repeat: 'yearly' }, { title: 'Rimessaggio', type: 'pagamento', repeat: 'yearly' }, { title: 'Manutenzione motore', type: 'scadenza', repeat: 'yearly' }, { title: 'Revisione dotazioni di sicurezza', type: 'scadenza', repeat: 'yearly' }],
  bicicletta: [{ title: 'Manutenzione', type: 'scadenza', repeat: 'monthly6' }, { title: 'Assicurazione', type: 'pagamento', repeat: 'yearly' }]
};

const REPEATS = [['none', 'Non si ripete'], ['daily', 'Ogni giorno'], ['weekly', 'Ogni settimana'], ['weekly2', 'Ogni 2 settimane'], ['monthly', 'Ogni mese'], ['monthly2', 'Ogni 2 mesi'], ['monthly3', 'Ogni 3 mesi'], ['monthly6', 'Ogni 6 mesi'], ['yearly', 'Ogni anno'], ['yearly2', 'Ogni 2 anni']];
const repLabel = r => (REPEATS.find(x => x[0] === r) || REPEATS[0])[1];
function repInfo(r) { const m = /^(daily|weekly|monthly|yearly)(\d*)$/.exec(r || ''); return m ? { freq: m[1], n: +(m[2] || 1) } : null; }

const REMINDERS = [[0, "All'ora"], [5, '5 min prima'], [15, '15 min prima'], [30, '30 min prima'], [60, '1 ora prima'], [120, '2 ore prima'], [1440, '1 giorno prima'], [2880, '2 giorni prima'], [4320, '3 giorni prima'], [10080, '1 settimana prima'], [20160, '2 settimane prima'], [43200, '1 mese prima']];
const remLabel = (m, allDay) => m === 0 ? (allDay ? 'Il giorno stesso' : "All'ora") : (REMINDERS.find(r => r[0] === m) || [0, m + ' min prima'])[1];
const STYLES = [['full', 'Schermo intero', 'Copre lo schermo finché non rispondi'], ['banner', 'Banner', 'Riquadro in alto, non blocca l\'app'], ['quiet', 'Discreta', 'Solo nel centro notifiche']];

/* ---------------- Festività italiane ---------------- */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
}
const holCache = {};
function holidays(y) {
  if (holCache[y]) return holCache[y];
  const h = {};
  [['01-01', 'Capodanno'], ['01-06', 'Epifania'], ['04-25', 'Festa della Liberazione'], ['05-01', 'Festa dei Lavoratori'], ['06-02', 'Festa della Repubblica'],
   ['08-15', 'Ferragosto'], ['11-01', 'Ognissanti'], ['12-08', 'Immacolata Concezione'], ['12-25', 'Natale'], ['12-26', 'Santo Stefano']]
    .forEach(([md, n]) => { h[`${y}-${md}`] = n; });
  if (y >= 2026) h[`${y}-10-04`] = "San Francesco d'Assisi";
  const e = easter(y);
  h[ds(e)] = 'Pasqua';
  h[ds(addDays(e, 1))] = "Lunedì dell'Angelo";
  return (holCache[y] = h);
}
const holidayOf = s => holidays(+s.slice(0, 4))[s] || '';

/* ---------------- Stato e salvataggio ---------------- */
const APP_VERSION = '1.1.1';
const KEY = 'agendapp.v1';
function relTime(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'adesso';
  if (m < 60) return `${m} min fa`;
  if (m < 1440) return `${Math.round(m / 60)} ore fa`;
  return new Date(ts).toLocaleDateString('it-IT');
}
const DEF_SETTINGS = {
  theme: 'auto',
  startView: 'month',
  allDayTime: '09:00',
  systemNotif: false,
  defaults: {
    appuntamento: { style: 'full', reminders: [60, 15], sound: true, vibrate: true },
    scadenza: { style: 'full', reminders: [10080, 1440, 0], sound: true, vibrate: true },
    pagamento: { style: 'full', reminders: [4320, 0], sound: true, vibrate: true },
    compleanno: { style: 'full', reminders: [1440, 0], sound: true, vibrate: true },
    nota: { style: 'banner', reminders: [0], sound: false, vibrate: false }
  }
};
function blankState() { return { items: [], vehicles: [], dayNotes: {}, fired: {}, snoozes: [], log: [], settings: clone(DEF_SETTINGS) }; }
function migrate(raw) {
  const s = Object.assign(blankState(), raw || {});
  s.settings = Object.assign(clone(DEF_SETTINGS), s.settings || {});
  s.settings.defaults = Object.assign(clone(DEF_SETTINGS.defaults), s.settings.defaults || {});
  ['items', 'vehicles', 'snoozes', 'log'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  ['dayNotes', 'fired'].forEach(k => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
  s.items.forEach(it => { it.done = it.done || {}; it.notify = it.notify || Object.assign({ enabled: true }, clone(s.settings.defaults[it.type] || DEF_SETTINGS.defaults.nota)); });
  return s;
}
let S;
try { S = migrate(JSON.parse(localStorage.getItem(KEY))); } catch (e) { S = blankState(); }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Impossibile salvare i dati sul dispositivo'); }
}
const getItem = id => S.items.find(i => i.id === id);
const getVeh = id => S.vehicles.find(v => v.id === id);

const ui = { tab: 'cal', view: S.settings.startView, cursor: todayD(), section: null, query: '' };

/* ---------------- Ricorrenze ---------------- */
function expand(it, from, to) {
  const start = pd(it.date), out = [];
  const r = it.type === 'compleanno' ? { freq: 'yearly', n: 1 } : repInfo(it.repeat);
  if (!r) { if (start >= from && start <= to) out.push(it.date); return out; }
  let end = to;
  if (it.until) { const u = pd(it.until); if (u < end) end = u; }
  const lo = start > from ? start : from;
  if (lo > end) return out;
  if (r.freq === 'daily') {
    for (let d = new Date(lo); d <= end; d = addDays(d, 1)) out.push(ds(d));
  } else if (r.freq === 'weekly') {
    const step = 7 * r.n, k = Math.ceil(Math.round((lo - start) / 864e5) / step);
    for (let d = addDays(start, k * step); d <= end; d = addDays(d, step)) out.push(ds(d));
  } else if (r.freq === 'monthly') {
    const sm = start.getFullYear() * 12 + start.getMonth();
    const m1 = end.getFullYear() * 12 + end.getMonth();
    for (let m = lo.getFullYear() * 12 + lo.getMonth(); m <= m1; m++) {
      if ((m - sm) % r.n) continue;
      const y = Math.floor(m / 12), mo = m % 12;
      const d = new Date(y, mo, Math.min(start.getDate(), daysIn(y, mo)));
      if (d >= lo && d <= end) out.push(ds(d));
    }
  } else {
    for (let y = lo.getFullYear(); y <= end.getFullYear(); y++) {
      if ((y - start.getFullYear()) % r.n) continue;
      const d = new Date(y, start.getMonth(), Math.min(start.getDate(), daysIn(y, start.getMonth())));
      if (d >= lo && d <= end) out.push(ds(d));
    }
  }
  return out;
}
const isAllDay = it => it.allDay || !it.time;
function occTime(it, occ) {
  const d = pd(occ);
  const [h, m] = (isAllDay(it) ? S.settings.allDayTime : it.time).split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}
const isDone = (it, occ) => !!(it.done && it.done[occ]);
const sortKey = e => (isAllDay(e.it) ? '00:00' : e.it.time) + TYPE_ORDER.indexOf(e.it.type);
const cmpOcc = (a, b) => (a.occ + sortKey(a)).localeCompare(b.occ + sortKey(b));
function buildIndex(from, to, filter) {
  const idx = {};
  for (const it of S.items) {
    if (filter && !filter(it)) continue;
    for (const o of expand(it, from, to)) (idx[o] || (idx[o] = [])).push({ it, occ: o });
  }
  for (const k in idx) idx[k].sort(cmpOcc);
  return idx;
}
function nextOcc(it, fromD = todayD()) {
  const r = it.type === 'compleanno' ? 'yearly' : it.repeat;
  const span = r === 'daily' ? 2 : 1100;
  return expand(it, fromD, addDays(fromD, span))[0] || null;
}
function overdueList(filter) {
  const t = todayD(), res = [];
  for (const it of S.items) {
    if (!(it.type === 'scadenza' || it.type === 'pagamento')) continue;
    if (filter && !filter(it)) continue;
    const created = ds(new Date(it.created || Date.now()));
    for (const o of expand(it, addDays(t, -366), addDays(t, -1))) {
      if (isDone(it, o)) continue;
      if (o >= created || o === it.date) res.push({ it, occ: o });
    }
  }
  return res.sort(cmpOcc);
}
function ageAt(it, occ) { return it.birthYear ? (+occ.slice(0, 4) - +it.birthYear) : null; }

/* ---------------- Tema ---------------- */
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.settings.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : S.settings.theme;
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === 'dark' ? '#0d1220' : '#14244a';
}
mq.addEventListener && mq.addEventListener('change', applyTheme);

/* ---------------- Toast ---------------- */
let toastT;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------------- Render principale ---------------- */
const TABS = [['cal', 'Calendario', 'calendar'], ['up', 'Prossimi', 'list'], ['sec', 'Sezioni', 'grid'], ['set', 'Impostazioni', 'sliders']];
function renderChrome() {
  $('#tabbar').innerHTML = TABS.map(([k, l, ic]) => `<button class="tab ${ui.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}" aria-current="${ui.tab === k ? 'page' : 'false'}">${I(ic)}<span>${l}</span></button>`).join('');
  const t = todayD();
  $('#brand-date').textContent = `${GIORNI[wd(t)]} ${t.getDate()} ${MESI[t.getMonth()]}`;
  $('#btn-search').innerHTML = I('search');
  $('#fab').innerHTML = I('plus');
  updateBell();
}
function updateBell() {
  const n = S.log.filter(l => !l.read).length;
  $('#btn-bell').innerHTML = I('bell') + (n ? `<span class="badge">${n > 99 ? '99+' : n}</span>` : '');
}
function render() {
  renderChrome();
  const v = $('#view');
  if (ui.tab === 'cal') v.innerHTML = calendarView();
  else if (ui.tab === 'up') { v.innerHTML = upcomingView(); bindSearch(); }
  else if (ui.tab === 'sec') v.innerHTML = sectionsView();
  else v.innerHTML = settingsView();
}
function refreshAll() { render(); sheets.forEach(s => s.refresh && s.refresh()); }

/* ---------------- Calendario ---------------- */
function calTitle() {
  const c = ui.cursor;
  if (ui.view === 'week') {
    const s = startOfWeek(c), e = addDays(s, 6);
    if (s.getMonth() === e.getMonth()) return `${s.getDate()} – ${e.getDate()} ${MESI[s.getMonth()]} <small>${s.getFullYear()}</small>`;
    if (s.getFullYear() === e.getFullYear()) return `${s.getDate()} ${MESI_S[s.getMonth()]} – ${e.getDate()} ${MESI_S[e.getMonth()]} <small>${s.getFullYear()}</small>`;
    return `${s.getDate()} ${MESI_S[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${MESI_S[e.getMonth()]} ${e.getFullYear()}`;
  }
  if (ui.view === 'month') return `${MESI[c.getMonth()]} <small>${c.getFullYear()}</small>`;
  return `${c.getFullYear()}`;
}
function calendarView() {
  const seg = [['week', 'Settimana'], ['month', 'Mese'], ['year', 'Anno']].map(([k, l]) => `<button data-act="view" data-v="${k}" class="${ui.view === k ? 'on' : ''}">${l}</button>`).join('');
  const body = ui.view === 'week' ? weekView() : ui.view === 'month' ? monthView() : yearView();
  const legend = TYPE_ORDER.map(t => `<span><i style="background:var(--c-${t})"></i>${TYPES[t].plural}</span>`).join('');
  return `<div class="cal-head">
      <div class="seg" role="tablist">${seg}</div>
      <div class="cal-nav">
        <h2 class="cal-title">${calTitle()}</h2>
        <button class="nav-btn" data-act="prev" aria-label="Precedente">${I('chevL')}</button>
        <button class="nav-btn" data-act="next" aria-label="Successivo">${I('chevR')}</button>
        <button class="pill" data-act="today">Oggi</button>
      </div>
    </div>
    <div id="cal-body">${body}</div>
    ${ui.view !== 'year' ? `<div class="legend">${legend}</div>` : ''}`;
}
function evLine(e) {
  const it = e.it, done = isDone(it, e.occ);
  const t = isAllDay(it) ? '' : `<span class="t">${it.time}</span>`;
  let name = esc(it.title);
  if (it.type === 'compleanno') { const a = ageAt(it, e.occ); name += a ? ` (${a})` : ''; }
  if (it.type === 'pagamento' && it.amount) name += ` · ${EUR.format(it.amount)}`;
  return `<div class="ev ${done ? 'done' : ''}" style="--tc:var(--c-${it.type})">${t || I(TYPES[it.type].icon)}<span class="n">${name}</span></div>`;
}
function weekView() {
  const s = startOfWeek(ui.cursor), idx = buildIndex(s, addDays(s, 6)), tk = ds(todayD());
  let html = '<div class="week">';
  for (let i = 0; i < 7; i++) {
    const d = addDays(s, i), k = ds(d), list = idx[k] || [], hol = holidayOf(k);
    html += `<button class="wday ${k === tk ? 'today' : ''} ${hol || i === 6 ? 'red' : ''}" data-act="day" data-d="${k}" aria-label="${fmtLong(k)}">
      <div class="wday-date"><span class="wd">${GG[i]}</span><span class="num">${d.getDate()}</span><span class="mo">${MESI_S[d.getMonth()]}</span></div>
      <div class="wday-items">${hol ? `<div class="wday-hol">${esc(hol)}</div>` : ''}${list.length ? list.map(evLine).join('') : (hol ? '' : '<span class="empty-line">Libero</span>')}${S.dayNotes[k] ? `<div class="ev" style="--tc:var(--muted)">${I('edit')}<span class="n">${esc(S.dayNotes[k].split('\n')[0])}</span></div>` : ''}</div>
    </button>`;
  }
  return html + '</div>';
}
function monthView() {
  const c = ui.cursor, y = c.getFullYear(), m = c.getMonth();
  const first = new Date(y, m, 1), s = startOfWeek(first);
  const weeks = Math.ceil((wd(first) + daysIn(y, m)) / 7);
  const e = addDays(s, weeks * 7 - 1);
  const idx = buildIndex(s, e), tk = ds(todayD());
  let cells = '';
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(s, i), k = ds(d), list = idx[k] || [], hol = holidayOf(k);
    const out = d.getMonth() !== m;
    const dots = list.slice(0, 5).map(x => `<i style="--tc:var(--c-${x.it.type})"></i>`).join('') + (S.dayNotes[k] ? '<i style="--tc:var(--muted)"></i>' : '');
    const chips = list.slice(0, 3).map(x => `<div class="chip-ev ${isDone(x.it, x.occ) ? 'done' : ''}" style="--tc:var(--c-${x.it.type})">${isAllDay(x.it) ? '' : x.it.time + ' '}${esc(x.it.title)}</div>`).join('');
    cells += `<button class="mcell ${out ? 'out' : ''} ${k === tk ? 'today' : ''} ${hol || wd(d) === 6 ? 'red' : ''}" data-act="day" data-d="${k}" aria-label="${fmtLong(k)}${list.length ? ', ' + list.length + ' elementi' : ''}">
      <span class="d">${d.getDate()}</span>
      ${hol && !out ? `<span class="mhol">${esc(hol)}</span>` : ''}
      <div class="dots">${dots}</div>
      <div class="chips">${chips}${list.length > 3 ? `<span class="more">+${list.length - 3} altri</span>` : ''}</div>
    </button>`;
  }
  return `<div class="month"><div class="mhead">${GG.map(g => `<div>${g}</div>`).join('')}</div><div class="mgrid">${cells}</div></div>`;
}
function yearView() {
  const y = ui.cursor.getFullYear(), idx = buildIndex(new Date(y, 0, 1), new Date(y, 11, 31)), tk = ds(todayD()), now = todayD();
  let html = '<div class="year">';
  for (let m = 0; m < 12; m++) {
    const first = new Date(y, m, 1);
    let n = 0, cells = GG.map(g => `<span class="h">${g[0]}</span>`).join('') + '<span></span>'.repeat(wd(first));
    for (let d = 1; d <= daysIn(y, m); d++) {
      const k = `${y}-${pad(m + 1)}-${pad(d)}`, list = idx[k] || [];
      n += list.length;
      const lvl = Math.min(list.length, 3), bd = list.some(x => x.it.type === 'compleanno');
      cells += `<button class="yd ${lvl ? 'l' + lvl : ''} ${k === tk ? 'today' : ''} ${holidayOf(k) || wd(new Date(y, m, d)) === 6 ? 'red' : ''} ${bd ? 'bd' : ''}" data-act="day" data-d="${k}" aria-label="${fmtLong(k)}">${d}</button>`;
    }
    const cur = now.getFullYear() === y && now.getMonth() === m;
    html += `<div class="ymonth ${cur ? 'cur' : ''}"><button class="ym-title" data-act="gomonth" data-m="${m}">${MESI[m]}<small>${n ? n + ' impegni' : ''}</small></button><div class="ygrid">${cells}</div></div>`;
  }
  return html + '</div>';
}
function shiftCursor(dir) {
  const c = ui.cursor;
  if (ui.view === 'week') ui.cursor = addDays(c, 7 * dir);
  else if (ui.view === 'month') ui.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1);
  else ui.cursor = new Date(c.getFullYear() + dir, c.getMonth(), 1);
  render();
}

/* ---------------- Righe elenco ---------------- */
function rowHtml(it, occ, o = {}) {
  const T = TYPES[it.type], C = CATS[it.category] || CATS.altro, done = occ && isDone(it, occ);
  const meta = [];
  if (occ && o.showDate !== false) {
    const rd = relDay(occ);
    meta.push(`<span class="${o.overdue ? 'red' : ''}">${I('calendar')}${fmtShort(occ)} · ${rd}</span>`);
  }
  if (!isAllDay(it)) meta.push(`<span>${I('clock')}${it.time}${it.endTime ? '–' + it.endTime : ''}</span>`);
  if (it.type === 'compleanno' && occ) { const a = ageAt(it, occ); if (a) meta.push(`<span>${I('cake')}compie ${a} anni</span>`); }
  meta.push(`<span>${I(C.icon)}${C.label}</span>`);
  if (it.vehicleId && getVeh(it.vehicleId)) meta.push(`<span>${I(VTYPES[getVeh(it.vehicleId).type].icon)}${esc(getVeh(it.vehicleId).name)}</span>`);
  if (it.location) meta.push(`<span>${I('pin')}${esc(it.location)}</span>`);
  if (it.repeat && it.repeat !== 'none' && it.type !== 'compleanno') meta.push(`<span>${I('repeat')}${repLabel(it.repeat)}</span>`);
  if (it.source === 'google') meta.push(`<span>${I('repeat')}Google${it.calName ? ' · ' + esc(it.calName) : ''}</span>`);
  else if (it.source === 'ics' && it.calName) meta.push(`<span>${I('download')}${esc(it.calName)}</span>`);
  if (!it.notify || !it.notify.enabled) meta.push(`<span>${I('belloff')}</span>`);
  const side = [];
  if (it.type === 'pagamento' && it.amount) side.push(`<span class="amount">${EUR.format(it.amount)}</span>`);
  if (CHECKABLE.has(it.type) && occ) side.push(`<button class="check ${done ? 'on' : ''}" data-act="toggle-done" data-id="${it.id}" data-occ="${occ}" aria-label="${done ? 'Segna come da fare' : 'Segna come fatto'}">${I('check')}</button>`);
  return `<div class="row ${done ? 'done' : ''} ${o.overdue ? 'overdue' : ''}" data-act="edit" data-id="${it.id}" data-occ="${occ || ''}" style="--tc:var(--c-${it.type})" tabindex="0" role="button">
    <div class="ibox">${I(T.icon)}</div>
    <div class="row-main"><div class="row-title">${esc(it.title)}</div><div class="row-meta">${meta.join('')}</div></div>
    ${side.length ? `<div class="row-side">${side.join('')}</div>` : ''}
  </div>`;
}
function emptyBox(icon, title, text, actions = '') {
  return `<div class="empty"><div class="big">${I(icon)}</div><h3>${title}</h3><p>${text}</p>${actions}</div>`;
}

/* ---------------- Prossimi ---------------- */
function upcomingView() {
  const t = todayD(), tk = ds(t);
  const idx7 = buildIndex(t, addDays(t, 6));
  const todayN = (idx7[tk] || []).length;
  const weekN = Object.values(idx7).reduce((a, l) => a + l.length, 0);
  const mStart = new Date(t.getFullYear(), t.getMonth(), 1), mEnd = new Date(t.getFullYear(), t.getMonth() + 1, 0);
  let due = 0;
  for (const it of S.items) if (it.type === 'pagamento' && it.amount) for (const o of expand(it, mStart, mEnd)) if (!isDone(it, o)) due += +it.amount;
  const od = overdueList();
  return `<h1 class="view-title">Prossimi impegni</h1>
    <div class="stats">
      <button class="stat" data-act="day" data-d="${tk}" style="--tc:var(--accent)"><div class="k">${I('sun')}Oggi</div><div class="v">${todayN}</div></button>
      <button class="stat" data-act="goweek" style="--tc:var(--c-appuntamento)"><div class="k">${I('calendar')}Prossimi 7 giorni</div><div class="v">${weekN}</div></button>
      <button class="stat" data-act="section" data-s="type:pagamento" style="--tc:var(--c-pagamento)"><div class="k">${I('euro')}Da pagare a ${MESI[t.getMonth()]}</div><div class="v">${EUR.format(due)}</div></button>
      <button class="stat ${od.length ? 'warn' : ''}" data-act="jump-overdue" style="--tc:var(--c-scadenza)"><div class="k">${I('alert')}In ritardo</div><div class="v">${od.length}</div></button>
    </div>
    <label class="searchbox">${I('search')}<input id="q" type="search" placeholder="Cerca in titoli, note, luoghi…" value="${esc(ui.query)}" autocomplete="off"></label>
    <div id="up-list">${upcomingList()}</div>`;
}
function upcomingList() {
  const q = ui.query.trim().toLowerCase();
  if (q) {
    const res = S.items.filter(it => [it.title, it.notes, it.location, (CATS[it.category] || {}).label, TYPES[it.type].label].join(' ').toLowerCase().includes(q))
      .map(it => ({ it, occ: nextOcc(it) || it.date })).sort(cmpOcc);
    if (!res.length) return emptyBox('search', 'Nessun risultato', `Niente corrisponde a “${esc(ui.query)}”.`);
    return `<div class="group-title">Risultati <span class="count">${res.length}</span></div><div class="list">${res.map(e => rowHtml(e.it, e.occ)).join('')}</div>`;
  }
  if (!S.items.length) {
    return emptyBox('sparkle', 'La tua agenda è pronta', 'Aggiungi il primo impegno con il pulsante +, oppure carica alcuni esempi per vedere come funziona.',
      `<div class="btns" style="justify-content:center"><button class="btn primary" data-act="new">${I('plus')}Nuovo</button><button class="btn" data-act="demo">${I('sparkle')}Carica esempi</button></div>`);
  }
  const t = todayD(), od = overdueList();
  let html = '';
  if (od.length) html += `<div class="group-title warn" id="overdue">${I('alert')}In ritardo <span class="count">${od.length}</span></div><div class="list">${od.map(e => rowHtml(e.it, e.occ, { overdue: true })).join('')}</div>`;
  const idx = buildIndex(t, addDays(t, 59));
  const keys = Object.keys(idx).sort();
  if (!keys.length) html += emptyBox('calendar', 'Niente nei prossimi 60 giorni', 'Goditi la calma, oppure pianifica qualcosa.');
  for (const k of keys) {
    const rd = relDay(k);
    html += `<div class="date-head">${['oggi', 'domani'].includes(rd) ? cap(rd) : fmtMed(k)}<small>${['oggi', 'domani'].includes(rd) ? fmtMed(k) : rd}${holidayOf(k) ? ' · ' + esc(holidayOf(k)) : ''}</small></div>
      <div class="list">${idx[k].map(e => rowHtml(e.it, e.occ, { showDate: false })).join('')}</div>`;
  }
  return html;
}
function bindSearch() {
  const q = $('#q');
  if (!q) return;
  q.addEventListener('input', () => { ui.query = q.value; $('#up-list').innerHTML = upcomingList(); });
}

/* ---------------- Sezioni ---------------- */
function sectionsView() {
  if (ui.section) return sectionDetail(ui.section);
  const t = todayD(), in30 = addDays(t, 30);
  const countNext = f => { let n = 0; for (const it of S.items) if (f(it)) n += expand(it, t, in30).length; return n; };
  const typeTiles = TYPE_ORDER.map(k => {
    const tot = S.items.filter(i => i.type === k).length, nx = countNext(i => i.type === k);
    return `<button class="tile" data-act="section" data-s="type:${k}" style="--tc:var(--c-${k})"><div class="ibox">${I(TYPES[k].icon)}</div><div><div class="tile-name">${TYPES[k].plural}</div><div class="tile-sub">${tot ? `${tot} salvati · ${nx} entro 30 gg` : TYPES[k].desc}</div></div></button>`;
  }).join('');
  const catTiles = Object.entries(CATS).map(([k, c]) => {
    const tot = S.items.filter(i => i.category === k).length;
    const sub = k === 'mezzi' ? `${S.vehicles.length} mezzi · ${tot} impegni` : tot ? `${tot} impegni` : 'Vuota';
    return `<button class="tile" data-act="section" data-s="cat:${k}" style="--tc:${c.color}"><div class="ibox">${I(c.icon)}</div><div><div class="tile-name">${c.label}</div><div class="tile-sub">${sub}</div></div></button>`;
  }).join('');
  return `<h1 class="view-title">Sezioni</h1>
    <div class="group-title">Tipologie</div><div class="tiles">${typeTiles}</div>
    <div class="group-title">Aree della vita</div><div class="tiles">${catTiles}</div>`;
}
function itemsGrouped(filter, opts = {}) {
  const t = todayD(), list = S.items.filter(filter);
  const od = overdueList(filter);
  const future = [], past = [];
  for (const it of list) {
    const n = nextOcc(it);
    if (n) future.push({ it, occ: n }); else past.push({ it, occ: it.date });
  }
  future.sort(cmpOcc);
  past.sort((a, b) => b.occ.localeCompare(a.occ));
  let html = '';
  if (od.length) html += `<div class="group-title warn">${I('alert')}In ritardo <span class="count">${od.length}</span></div><div class="list">${od.map(e => rowHtml(e.it, e.occ, { overdue: true })).join('')}</div>`;
  if (future.length) html += `<div class="group-title">${opts.futureLabel || 'In programma'} <span class="count">${future.length}</span></div><div class="list">${future.map(e => rowHtml(e.it, e.occ)).join('')}</div>`;
  if (past.length) html += `<div class="group-title">Passati <span class="count">${past.length}</span></div><div class="list">${past.slice(0, 30).map(e => rowHtml(e.it, e.occ)).join('')}</div>`;
  if (!html) html = emptyBox(opts.icon || 'calendar', 'Ancora niente qui', 'Aggiungi il primo elemento con il pulsante qui sopra.');
  return html;
}
function sectionDetail(key) {
  const [kind, id] = key.split(':');
  const back = `<button class="back" data-act="sec-back">${I('chevL')}Sezioni</button>`;
  if (kind === 'type') {
    const T = TYPES[id];
    let extra = '';
    if (id === 'pagamento') {
      const t = todayD(), ms = new Date(t.getFullYear(), t.getMonth(), 1), me = new Date(t.getFullYear(), t.getMonth() + 1, 0), ys = new Date(t.getFullYear(), 0, 1), ye = new Date(t.getFullYear(), 11, 31);
      let due = 0, paid = 0, year = 0;
      for (const it of S.items) {
        if (it.type !== 'pagamento' || !it.amount) continue;
        for (const o of expand(it, ms, me)) isDone(it, o) ? paid += +it.amount : due += +it.amount;
        year += expand(it, ys, ye).length * it.amount;
      }
      extra = `<div class="stats">
        <div class="stat" style="--tc:var(--c-scadenza)"><div class="k">${I('hourglass')}Da pagare a ${MESI[t.getMonth()]}</div><div class="v">${EUR.format(due)}</div></div>
        <div class="stat" style="--tc:var(--c-pagamento)"><div class="k">${I('check')}Pagato a ${MESI[t.getMonth()]}</div><div class="v">${EUR.format(paid)}</div></div>
        <div class="stat" style="--tc:var(--c-appuntamento)"><div class="k">${I('calendar')}Totale ${t.getFullYear()}</div><div class="v">${EUR.format(year)}</div></div>
        <div class="stat" style="--tc:var(--c-nota)"><div class="k">${I('repeat')}Ricorrenti</div><div class="v">${S.items.filter(i => i.type === 'pagamento' && i.repeat !== 'none').length}</div></div>
      </div>`;
    }
    return `${back}<div class="sec-head" style="--tc:var(--c-${id})"><div class="ibox">${I(T.icon)}</div><div class="grow"><h2>${T.plural}</h2><p>${T.desc}</p></div>
      <button class="btn primary sm" data-act="new-type" data-type="${id}">${I('plus')}Aggiungi</button></div>
      ${extra}${itemsGrouped(i => i.type === id, { icon: T.icon, futureLabel: id === 'compleanno' ? 'Prossimi compleanni' : 'In programma' })}`;
  }
  if (kind === 'cat') {
    const C = CATS[id];
    let veh = '';
    if (id === 'mezzi') {
      veh = `<div class="group-title">I tuoi mezzi <span class="count">${S.vehicles.length}</span></div><div class="vehicles">${S.vehicles.map(vehicleCard).join('')}
        <button class="vcard add" data-act="veh-add">${I('plus')} Aggiungi mezzo</button></div>`;
    }
    return `${back}<div class="sec-head" style="--tc:${C.color}"><div class="ibox">${I(C.icon)}</div><div class="grow"><h2>${C.label}</h2><p>${S.items.filter(i => i.category === id).length} impegni in quest'area</p></div>
      <button class="btn primary sm" data-act="new-cat" data-cat="${id}">${I('plus')}Aggiungi</button></div>
      ${veh}${itemsGrouped(i => i.category === id, { icon: C.icon })}`;
  }
  if (kind === 'veh') {
    const v = getVeh(id);
    if (!v) { ui.section = 'cat:mezzi'; return sectionDetail(ui.section); }
    const VT = VTYPES[v.type];
    const tpl = (VTEMPLATES[v.type] || []).map((t, i) => `<button class="qbtn" data-act="veh-tpl" data-vid="${v.id}" data-i="${i}" style="--tc:var(--c-${t.type})">${I(TYPES[t.type].icon)}${t.title}</button>`).join('');
    return `<button class="back" data-act="section" data-s="cat:mezzi">${I('chevL')}Mezzi</button>
      <div class="sec-head" style="--tc:${CATS.mezzi.color}"><div class="ibox">${I(VT.icon)}</div><div class="grow"><h2>${esc(v.name)}</h2><p>${VT.label}${v.plate ? ' · ' + esc(v.plate) : ''}</p></div>
      <button class="btn sm" data-act="veh-edit" data-vid="${v.id}">${I('edit')}Modifica</button></div>
      ${v.notes ? `<p class="view-sub" style="margin:0 2px 12px">${esc(v.notes)}</p>` : ''}
      <div class="group-title">Aggiungi rapidamente</div><div class="quick">${tpl}<button class="qbtn" data-act="new-veh" data-vid="${v.id}">${I('plus')}Altro…</button></div>
      ${itemsGrouped(i => i.vehicleId === v.id, { icon: VT.icon })}`;
  }
  ui.section = null;
  return sectionsView();
}
function vehicleCard(v) {
  const VT = VTYPES[v.type] || VTYPES.auto;
  const nx = S.items.filter(i => i.vehicleId === v.id).map(it => ({ it, occ: nextOcc(it) })).filter(e => e.occ).sort(cmpOcc)[0];
  return `<button class="vcard" data-act="section" data-s="veh:${v.id}">
    <div class="vcard-top"><div class="ibox" style="--tc:${CATS.mezzi.color}">${I(VT.icon)}</div><div class="grow"><div class="tile-name">${esc(v.name)}</div><div class="tile-sub">${VT.label}</div></div>${v.plate ? `<span class="plate">${esc(v.plate)}</span>` : ''}</div>
    <div class="next">${nx ? `Prossimo: <b>${esc(nx.it.title)}</b> · ${fmtShort(nx.occ)} (${relDay(nx.occ)})` : 'Nessuna scadenza in programma'}</div>
  </button>`;
}

/* ---------------- Impostazioni ---------------- */
function settingsView() {
  const st = S.settings;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const permTxt = { granted: 'Consentite', denied: 'Bloccate dal browser', default: 'Non ancora richieste', unsupported: 'Non supportate da questo browser' }[perm];
  const defs = TYPE_ORDER.map(t => {
    const d = st.defaults[t];
    return `<div class="set-type"><div class="set-type-head" style="--tc:var(--c-${t})"><div class="ibox">${I(TYPES[t].icon)}</div>${TYPES[t].plural}</div>
      <div class="chipsel" style="margin-bottom:8px">${STYLES.map(([k, l]) => `<label><input type="radio" name="def-${t}-style" data-def="${t}" data-k="style" value="${k}" ${d.style === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <div class="chipsel">${REMINDERS.map(([m]) => `<label><input type="checkbox" data-def="${t}" data-k="rem" value="${m}" ${d.reminders.includes(m) ? 'checked' : ''}><span>${remLabel(m, t !== 'appuntamento')}</span></label>`).join('')}</div>
    </div>`;
  }).join('');
  return `<h1 class="view-title">Impostazioni</h1>
  <div class="card"><h3>Aspetto</h3>
    <div class="set-row"><div class="lbl">Tema</div><div class="chipsel">${[['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']].map(([k, l]) => `<label><input type="radio" name="theme" data-set="theme" value="${k}" ${st.theme === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
    <div class="set-row"><div class="lbl">Vista iniziale del calendario</div>
      <select class="inp" style="width:auto" data-set="startView">${[['week', 'Settimana'], ['month', 'Mese'], ['year', 'Anno']].map(([k, l]) => `<option value="${k}" ${st.startView === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
  </div>
  <div class="card"><h3>Notifiche</h3>
    <div class="set-row"><div class="lbl">Notifiche di sistema<small>Avvisi anche quando l'app è in secondo piano · Stato: ${permTxt}</small></div>
      <label class="switch"><input type="checkbox" data-set="systemNotif" ${st.systemNotif && perm === 'granted' ? 'checked' : ''} ${perm === 'unsupported' ? 'disabled' : ''}><span></span></label></div>
    <div class="set-row"><div class="lbl">Orario avvisi per eventi “tutto il giorno”<small>Usato per scadenze, pagamenti e compleanni senza orario</small></div>
      <input type="time" class="inp" style="width:auto" data-set="allDayTime" value="${st.allDayTime}"></div>
    <div class="set-row"><div class="lbl">Prova l'avviso a schermo intero</div><button class="btn sm" data-act="test-alert">${I('bell')}Prova</button></div>
  </div>
  <div class="card"><h3>Avvisi predefiniti per tipologia</h3>
    <p class="hint" style="margin:2px 0 4px">Valgono per i nuovi elementi. Ogni appuntamento, scadenza o compleanno si può poi personalizzare singolarmente.</p>
    ${defs}
  </div>
  <div class="card"><h3>Importa da altri calendari</h3>
    <div class="set-row"><div class="lbl">Google Calendar<small>${S.settings.gsync && S.settings.gsync.url ? (S.settings.gsync.error ? '<span class="danger">Errore: ' + esc(S.settings.gsync.error) + '</span>' : 'Collegato' + (S.settings.gsync.last ? ' · aggiornato ' + relTime(S.settings.gsync.last) : '')) : 'Sincronizzazione automatica dei tuoi calendari Google'}</small></div>
      ${S.settings.gsync && S.settings.gsync.url ? `<button class="btn sm" data-act="gs-sync" aria-label="Sincronizza ora">${I('repeat')}</button>` : ''}<button class="btn sm" data-act="google-open">${S.settings.gsync && S.settings.gsync.url ? 'Gestisci' : 'Collega'}</button></div>
    <div class="set-row"><div class="lbl">File di calendario (.ics o .zip)<small>Da Google (Impostazioni → Importa ed esporta → Esporta), Apple, Outlook, Samsung e altri</small></div><button class="btn sm" data-act="import-ics">${I('upload')}Importa</button></div>
  </div>
  <div class="card"><h3>Dati</h3>
    <div class="set-row"><div class="lbl">Backup completo<small>Salva un file con tutti i tuoi dati</small></div><button class="btn sm" data-act="export">${I('download')}Esporta</button></div>
    <div class="set-row"><div class="lbl">Ripristina da backup</div><button class="btn sm" data-act="import">${I('upload')}Importa</button></div>
    <div class="set-row"><div class="lbl">Esporta calendario (.ics)<small>Per Google Calendar, Apple Calendario, Outlook</small></div><button class="btn sm" data-act="ics">${I('calendar')}Esporta</button></div>
    <div class="set-row"><div class="lbl">Dati di esempio</div><button class="btn sm" data-act="demo">${I('sparkle')}Carica</button></div>
    <div class="set-row"><div class="lbl danger">Cancella tutti i dati</div><button class="btn sm danger" data-act="wipe">${I('trash')}Cancella</button></div>
  </div>
  <div class="card"><h3>App</h3>
    <div class="set-row"><div class="lbl">Versione ${APP_VERSION}<small>Quando esce una nuova versione compare il tasto “Aggiorna” in alto</small></div><button class="btn sm" data-act="check-update">${I('repeat')}Cerca aggiornamenti</button></div>
  </div>
  <p class="hint" style="text-align:center;margin:8px 0 20px">AgendApp ${APP_VERSION} · I dati restano su questo dispositivo</p>`;
}

/* ---------------- Fogli (sheet) ---------------- */
const sheets = [];
function openSheet(cfg) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>
      <div class="sheet-head"><h2></h2><button class="icon-btn" data-act="sheet-close" aria-label="Chiudi">${I('x')}</button></div>
      <div class="sheet-body"></div><div class="sheet-foot" hidden></div></div>`;
  $('#sheets').appendChild(wrap);
  const sh = {
    el: wrap, cfg,
    draw() {
      const c = cfg.build();
      $('.sheet-head h2', wrap).innerHTML = c.title;
      $('.sheet-body', wrap).innerHTML = c.body;
      const f = $('.sheet-foot', wrap);
      f.hidden = !c.foot; f.innerHTML = c.foot || '';
      cfg.mount && cfg.mount(wrap, sh);
    },
    refresh: cfg.refresh ? () => cfg.refresh(wrap, sh) : null
  };
  sheets.push(sh);
  sh.draw();
  try { history.pushState({ sheet: sheets.length }, ''); } catch (e) { /* ignora */ }
  setTimeout(() => { const f = $('[autofocus]', wrap); if (f && window.innerWidth > 700) f.focus(); }, 60);
  return sh;
}
function removeTopSheet() {
  const sh = sheets.pop();
  if (!sh) return;
  sh.cfg.onClose && sh.cfg.onClose();
  sh.el.classList.add('closing');
  setTimeout(() => sh.el.remove(), 200);
}
let ignorePop = 0;
function closeSheet() {
  if (!sheets.length) return;
  removeTopSheet();
  if (history.state && history.state.sheet) { ignorePop++; history.back(); }
}
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop--; return; }
  if (sheets.length) removeTopSheet();
});

/* ---------------- Foglio giorno ---------------- */
function openDay(key) {
  let cur = key;
  const listHtml = () => {
    const list = buildIndex(pd(cur), pd(cur))[cur] || [];
    return list.length ? `<div class="list">${list.map(e => rowHtml(e.it, e.occ, { showDate: false })).join('')}</div>`
      : `<p class="empty-line" style="text-align:center;margin:18px 0">Nessun impegno in questa giornata</p>`;
  };
  openSheet({
    build() {
      const hol = holidayOf(cur), rd = relDay(cur);
      return {
        title: `${fmtLong(cur)}<span class="sub ${hol ? 'red' : ''}">${cap(rd)}${hol ? ' · ' + esc(hol) : ''}</span>`,
        body: `<div class="btns" style="margin:0 0 12px"><button class="btn sm" data-act="day-shift" data-n="-1">${I('chevL')}Giorno prima</button><span class="grow"></span><button class="btn sm" data-act="day-shift" data-n="1">Giorno dopo${I('chevR')}</button></div>
          <div class="day-quick">${TYPE_ORDER.map(t => `<button data-act="new-type" data-type="${t}" data-d="${cur}" style="--tc:var(--c-${t})">${I(TYPES[t].icon)}${TYPES[t].label}</button>`).join('')}</div>
          <div class="day-list">${listHtml()}</div>
          <div class="day-notes field"><label for="daynote" style="display:flex;justify-content:space-between">Appunti del giorno <span class="saved-hint">Salvato ✓</span></label>
          <textarea class="inp" id="daynote" placeholder="Scrivi qui pensieri, cose da ricordare, liste…">${esc(S.dayNotes[cur] || '')}</textarea></div>`
      };
    },
    mount(w, sh) {
      const ta = $('#daynote', w), hint = $('.saved-hint', w);
      let t;
      ta.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const v = ta.value.trim();
          if (v) S.dayNotes[cur] = ta.value; else delete S.dayNotes[cur];
          save(); render();
          hint.classList.add('show'); setTimeout(() => hint.classList.remove('show'), 1200);
        }, 450);
      });
      sh.shift = n => { cur = ds(addDays(pd(cur), n)); sh.draw(); };
    },
    refresh(w) { const l = $('.day-list', w); if (l) l.innerHTML = listHtml(); }
  });
}

/* ---------------- Modulo elemento ---------------- */
function defaultCategory(type) { return { compleanno: 'famiglia', pagamento: 'finanze', appuntamento: 'personale', scadenza: 'personale', nota: 'personale' }[type]; }
function nextHalfHour() { const n = new Date(); n.setMinutes(n.getMinutes() < 30 ? 30 : 60, 0, 0); return `${pad(n.getHours())}:${pad(n.getMinutes())}`; }
function newItem(p = {}) {
  const type = p.type || 'appuntamento';
  return Object.assign({
    id: uid(), type, title: '', category: p.category || defaultCategory(type), vehicleId: '',
    date: p.date || ds(todayD()), allDay: type !== 'appuntamento', time: type === 'appuntamento' ? nextHalfHour() : '', endTime: '',
    amount: '', birthYear: '', repeat: type === 'compleanno' ? 'yearly' : 'none', until: '', location: '', notes: '',
    notify: Object.assign({ enabled: true }, clone(S.settings.defaults[type])), done: {}, created: Date.now()
  }, p.extra || {});
}
function formBody(d, isNew, occ) {
  const typeSel = TYPE_ORDER.map(t => `<label style="--tc:var(--c-${t})"><input type="radio" name="type" value="${t}" ${d.type === t ? 'checked' : ''}><span>${I(TYPES[t].icon)}${TYPES[t].label}</span></label>`).join('');
  const catSel = Object.entries(CATS).map(([k, c]) => `<label><input type="radio" name="category" value="${k}" ${d.category === k ? 'checked' : ''}><span>${I(c.icon)}${c.label}</span></label>`).join('');
  const vehSel = S.vehicles.length
    ? `<select class="inp" name="vehicleId"><option value="">— Nessun mezzo specifico —</option>${S.vehicles.map(v => `<option value="${v.id}" ${d.vehicleId === v.id ? 'selected' : ''}>${VTYPES[v.type].label} · ${esc(v.name)}${v.plate ? ' (' + esc(v.plate) + ')' : ''}</option>`).join('')}</select>`
    : `<p class="hint">Non hai ancora registrato mezzi. <button type="button" class="pill" data-act="veh-add" style="padding:5px 10px;font-size:12.5px">Aggiungi mezzo</button></p>`;
  const n = d.notify;
  const doneRow = !isNew && occ && CHECKABLE.has(d.type) ? `<div class="notif-box" style="padding:4px 14px"><div class="inline-sw"><span>${d.type === 'pagamento' ? 'Pagato' : 'Fatto'} · ${fmtShort(occ)}</span><label class="switch"><input type="checkbox" name="isDone" ${isDone(d, occ) ? 'checked' : ''}><span></span></label></div></div>` : '';
  return `<form id="itemform" novalidate>
    ${doneRow}
    <div class="typesel">${typeSel}</div>
    <div class="field"><label for="f-title" data-lbl-title>Titolo</label><input class="inp title-inp" id="f-title" name="title" value="${esc(d.title)}" placeholder="Es. Visita dal dentista" autocomplete="off" required autofocus></div>
    <div class="field"><span class="flabel">Sezione</span><div class="chipsel">${catSel}</div></div>
    <div class="field" data-when="mezzi"><label>Mezzo</label>${vehSel}</div>
    <div class="grid2">
      <div class="field"><label for="f-date" data-lbl-date>Data</label><input class="inp" type="date" id="f-date" name="date" value="${d.date}" required></div>
      <div class="field" data-when="birthday"><label for="f-by">Anno di nascita</label><input class="inp" type="number" id="f-by" name="birthYear" inputmode="numeric" min="1900" max="2100" placeholder="Facoltativo" value="${esc(d.birthYear)}"></div>
      <div class="field" data-when="notbirthday" style="justify-content:flex-end"><div class="inline-sw" style="padding:9px 0"><span>Tutto il giorno</span><label class="switch"><input type="checkbox" name="allDay" ${d.allDay ? 'checked' : ''}><span></span></label></div></div>
    </div>
    <div class="grid2" data-when="timed">
      <div class="field"><label for="f-time">Ora</label><input class="inp" type="time" id="f-time" name="time" value="${d.time || ''}"></div>
      <div class="field" data-show="appuntamento"><label for="f-end">Fine</label><input class="inp" type="time" id="f-end" name="endTime" value="${d.endTime || ''}"></div>
    </div>
    <div class="field" data-show="pagamento"><label for="f-amount">Importo (€)</label><input class="inp" type="text" id="f-amount" name="amount" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${d.amount !== '' ? String(d.amount).replace('.', ',') : ''}"></div>
    <div class="grid2" data-when="notbirthday">
      <div class="field"><label for="f-rep">Ripetizione</label><select class="inp" id="f-rep" name="repeat">${REPEATS.map(([k, l]) => `<option value="${k}" ${d.repeat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field" data-when="repeat"><label for="f-until">Fino al</label><input class="inp" type="date" id="f-until" name="until" value="${d.until || ''}"></div>
    </div>
    <div class="field" data-show="appuntamento,scadenza,svago"><label for="f-loc">Luogo</label><input class="inp" id="f-loc" name="location" value="${esc(d.location)}" placeholder="Indirizzo o luogo" autocomplete="off"></div>
    <div class="field"><label for="f-notes">Note</label><textarea class="inp" id="f-notes" name="notes" placeholder="Dettagli, documenti da portare, numeri utili…">${esc(d.notes)}</textarea></div>

    <div class="notif-box ${n.enabled ? '' : 'off'}" id="nbox">
      <div class="nb-head">${I('bell')}<span class="grow">Notifica</span><label class="switch"><input type="checkbox" name="n_enabled" ${n.enabled ? 'checked' : ''}><span></span></label></div>
      <div class="nb-body">
        <div class="field"><span class="flabel">Tipo di avviso</span><div class="chipsel">${STYLES.map(([k, l]) => `<label><input type="radio" name="n_style" value="${k}" ${n.style === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
          <p class="hint" id="style-hint"></p></div>
        <div class="field"><span class="flabel">Quando avvisarmi</span><div class="chipsel">${REMINDERS.map(([m]) => `<label><input type="checkbox" name="n_rem" value="${m}" ${n.reminders.includes(m) ? 'checked' : ''}><span data-rem="${m}">${remLabel(m, d.allDay)}</span></label>`).join('')}</div>
          <p class="hint" data-when="allday-hint">Per gli eventi senza orario l'avviso arriva alle ${S.settings.allDayTime} (modificabile nelle Impostazioni).</p></div>
        <div class="inline-sw"><span>Suono</span><label class="switch"><input type="checkbox" name="n_sound" ${n.sound ? 'checked' : ''}><span></span></label></div>
        <div class="inline-sw"><span>Vibrazione</span><label class="switch"><input type="checkbox" name="n_vibrate" ${n.vibrate ? 'checked' : ''}><span></span></label></div>
      </div>
    </div>
  </form>`;
}
function syncForm(form) {
  const fd = new FormData(form);
  const type = fd.get('type'), cat = fd.get('category'), allDay = fd.get('allDay') === 'on' && type !== 'compleanno' ? true : type === 'compleanno';
  const rep = fd.get('repeat');
  const show = (el, on) => { el.style.display = on ? '' : 'none'; };
  $$('[data-show]', form).forEach(el => show(el, el.dataset.show.split(',').some(s => s === type || s === cat)));
  $$('[data-when]', form).forEach(el => {
    const w = el.dataset.when;
    show(el, w === 'mezzi' ? cat === 'mezzi'
      : w === 'timed' ? !allDay
      : w === 'repeat' ? rep && rep !== 'none'
      : w === 'birthday' ? type === 'compleanno'
      : w === 'notbirthday' ? type !== 'compleanno'
      : w === 'allday-hint' ? allDay : true);
  });
  $('[data-lbl-title]', form).textContent = type === 'compleanno' ? 'Nome' : 'Titolo';
  $('[data-lbl-date]', form).textContent = type === 'compleanno' ? 'Giorno del compleanno' : type === 'scadenza' ? 'Data di scadenza' : 'Data';
  $('#f-title', form).placeholder = { appuntamento: 'Es. Visita dal dentista', scadenza: 'Es. Rinnovo carta d\'identità', pagamento: 'Es. Bolletta luce', compleanno: 'Es. Mamma', nota: 'Es. Comprare i regali' }[type];
  $$('[data-rem]', form).forEach(el => { el.textContent = remLabel(+el.dataset.rem, allDay); });
  $('#nbox', form).classList.toggle('off', fd.get('n_enabled') !== 'on');
  const st = STYLES.find(s => s[0] === fd.get('n_style'));
  $('#style-hint', form).textContent = st ? st[2] + '.' : '';
}
function openForm(it, preset = {}, occ = null) {
  const isNew = !it;
  const d = isNew ? newItem(preset) : clone(it);
  const T0 = TYPES[d.type];
  openSheet({
    build: () => ({
      title: isNew ? `Nuovo elemento` : `Modifica ${T0.label.toLowerCase()}`,
      body: formBody(d, isNew, occ),
      foot: `<div class="btns">${isNew ? '' : `<button class="btn danger" data-act="item-delete" data-id="${d.id}" aria-label="Elimina">${I('trash')}</button><button class="btn" data-act="item-dup" data-id="${d.id}" aria-label="Duplica">Duplica</button>`}<span class="grow"></span><button class="btn" data-act="sheet-close">Annulla</button><button class="btn primary" data-act="item-save">${I('check')}Salva</button></div>`
    }),
    mount(w, sh) {
      const form = $('#itemform', w);
      let lastType = d.type;
      syncForm(form);
      form.addEventListener('change', e => {
        if (e.target.name === 'type' && isNew) {
          const t = e.target.value, def = S.settings.defaults[t];
          // aggiorna i valori predefiniti in base alla nuova tipologia
          const catIn = form.querySelector(`input[name=category][value="${defaultCategory(t)}"]`);
          const curCat = new FormData(form).get('category');
          if (curCat === defaultCategory(lastType) && catIn) catIn.checked = true;
          form.elements.allDay.checked = t !== 'appuntamento';
          if (t === 'appuntamento' && !form.elements.time.value) form.elements.time.value = nextHalfHour();
          $$('input[name=n_style]', form).forEach(r => { r.checked = r.value === def.style; });
          $$('input[name=n_rem]', form).forEach(c => { c.checked = def.reminders.includes(+c.value); });
          form.elements.n_sound.checked = def.sound; form.elements.n_vibrate.checked = def.vibrate;
          lastType = t;
        }
        syncForm(form);
      });
      form.addEventListener('submit', e => { e.preventDefault(); sh.save(); });
      sh.save = () => {
        const fd = new FormData(form);
        const title = (fd.get('title') || '').trim();
        if (!title) { form.elements.title.focus(); toast(fd.get('type') === 'compleanno' ? 'Inserisci il nome' : 'Inserisci un titolo'); return; }
        if (!fd.get('date')) { form.elements.date.focus(); toast('Inserisci la data'); return; }
        const type = fd.get('type');
        let allDay = type === 'compleanno' || fd.get('allDay') === 'on';
        const time = fd.get('time') || '';
        if (!allDay && !time) allDay = true;
        const out = Object.assign(d, {
          type, title, category: fd.get('category') || 'altro',
          vehicleId: fd.get('category') === 'mezzi' ? (fd.get('vehicleId') || '') : '',
          date: fd.get('date'), allDay, time: allDay ? '' : time, endTime: !allDay && type === 'appuntamento' ? (fd.get('endTime') || '') : '',
          amount: type === 'pagamento' && fd.get('amount') ? Math.round(parseFloat(String(fd.get('amount')).replace(',', '.')) * 100) / 100 : '',
          birthYear: type === 'compleanno' ? (fd.get('birthYear') || '') : '',
          repeat: type === 'compleanno' ? 'yearly' : (fd.get('repeat') || 'none'),
          until: type !== 'compleanno' && fd.get('repeat') !== 'none' ? (fd.get('until') || '') : '',
          location: fd.get('location') || '', notes: fd.get('notes') || '',
          notify: {
            enabled: fd.get('n_enabled') === 'on', style: fd.get('n_style') || 'full',
            reminders: fd.getAll('n_rem').map(Number).sort((a, b) => b - a),
            sound: fd.get('n_sound') === 'on', vibrate: fd.get('n_vibrate') === 'on'
          }
        });
        if (Number.isNaN(out.amount)) out.amount = '';
        if (occ && form.elements.isDone) { if (form.elements.isDone.checked) out.done[occ] = true; else delete out.done[occ]; }
        if (isNew) S.items.push(out); else S.items[S.items.findIndex(x => x.id === out.id)] = out;
        resetFired(out);
        save();
        closeSheet();
        refreshAll();
        toast(isNew ? `${TYPES[type].label} aggiunt${type === 'appuntamento' || type === 'pagamento' || type === 'compleanno' ? 'o' : 'a'}` : 'Modifiche salvate');
      };
    }
  });
}
function resetFired(it) {
  // azzera gli avvisi già registrati e segna come "già passati" quelli antecedenti a ora
  for (const k of Object.keys(S.fired)) if (k.startsWith(it.id + '|')) delete S.fired[k];
  S.snoozes = S.snoozes.filter(s => s.id !== it.id);
  const now = Date.now(), t = todayD();
  if (!it.notify || !it.notify.enabled) return;
  for (const occ of expand(it, addDays(t, -2), addDays(t, 33))) {
    const at = occTime(it, occ);
    for (const off of it.notify.reminders) { const f = at - off * 60000; if (f <= now) S.fired[`${it.id}|${occ}|${off}`] = f; }
  }
}

/* ---------------- Mezzi ---------------- */
function openVehicleForm(v) {
  const isNew = !v;
  const d = v ? clone(v) : { id: uid(), type: 'auto', name: '', plate: '', notes: '' };
  openSheet({
    build: () => ({
      title: isNew ? 'Nuovo mezzo' : 'Modifica mezzo',
      body: `<form id="vform"><div class="field"><span class="flabel">Tipo</span><div class="chipsel">${Object.entries(VTYPES).map(([k, t]) => `<label><input type="radio" name="type" value="${k}" ${d.type === k ? 'checked' : ''}><span>${I(t.icon)}${t.label}</span></label>`).join('')}</div></div>
        <div class="field"><label for="v-name">Nome</label><input class="inp title-inp" id="v-name" name="name" value="${esc(d.name)}" placeholder="Es. Panda, Ducati, Gommone" autofocus autocomplete="off"></div>
        <div class="field"><label for="v-plate">Targa / identificativo</label><input class="inp" id="v-plate" name="plate" value="${esc(d.plate)}" placeholder="Facoltativo" autocomplete="off" style="text-transform:uppercase"></div>
        <div class="field"><label for="v-notes">Note</label><textarea class="inp" id="v-notes" name="notes" placeholder="Compagnia assicurativa, officina di fiducia, km…">${esc(d.notes)}</textarea></div></form>`,
      foot: `<div class="btns">${isNew ? '' : `<button class="btn danger" data-act="veh-delete" data-vid="${d.id}">${I('trash')}</button>`}<span class="grow"></span><button class="btn" data-act="sheet-close">Annulla</button><button class="btn primary" data-act="veh-save">${I('check')}Salva</button></div>`
    }),
    mount(w, sh) {
      const f = $('#vform', w);
      f.addEventListener('submit', e => { e.preventDefault(); sh.save(); });
      sh.save = () => {
        const fd = new FormData(f), name = (fd.get('name') || '').trim();
        if (!name) { toast('Dai un nome al mezzo'); f.elements.name.focus(); return; }
        Object.assign(d, { type: fd.get('type'), name, plate: (fd.get('plate') || '').trim().toUpperCase(), notes: fd.get('notes') || '' });
        if (isNew) S.vehicles.push(d); else S.vehicles[S.vehicles.findIndex(x => x.id === d.id)] = d;
        save(); closeSheet();
        if (isNew && ui.tab === 'sec') ui.section = 'veh:' + d.id;
        refreshAll();
        // se il modulo elemento è aperto sotto, aggiorna la lista mezzi
        const top = sheets[sheets.length - 1];
        if (top && $('#itemform', top.el)) {
          const sel = $('select[name=vehicleId]', top.el);
          const host = sel ? sel.parentElement : $('[data-when=mezzi]', top.el);
          if (host) host.innerHTML = `<label>Mezzo</label><select class="inp" name="vehicleId"><option value="">— Nessun mezzo specifico —</option>${S.vehicles.map(v => `<option value="${v.id}" ${v.id === d.id ? 'selected' : ''}>${VTYPES[v.type].label} · ${esc(v.name)}</option>`).join('')}</select>`;
        }
        toast(isNew ? 'Mezzo aggiunto' : 'Mezzo aggiornato');
      };
    }
  });
}

/* ---------------- Centro notifiche ---------------- */
function openNotifCenter() {
  openSheet({
    build() {
      const items = S.log.slice(0, 60);
      const body = items.length ? items.map(l => {
        const it = getItem(l.id);
        if (!it) return '';
        const d = new Date(l.at);
        return `<div class="nc-item ${l.read ? '' : 'unread'}" data-act="nc-open" data-key="${esc(l.key)}" style="--tc:var(--c-${it.type})">
          <div class="ibox">${I(TYPES[it.type].icon)}</div>
          <div class="row-main"><div class="row-title">${esc(it.title)}</div>
          <div class="row-meta"><span>${TYPES[it.type].label} · ${fmtShort(l.occ)}</span><span>${I('bell')}${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}</span></div></div></div>`;
      }).join('') : emptyBox('bell', 'Nessuna notifica', 'Qui trovi lo storico di tutti gli avvisi, anche quelli discreti.');
      return {
        title: 'Notifiche',
        body,
        foot: items.length ? `<div class="btns"><button class="btn" data-act="nc-clear">${I('trash')}Svuota</button><span class="grow"></span><button class="btn primary" data-act="nc-read">${I('check')}Segna tutte come lette</button></div>` : ''
      };
    },
    refresh(w, sh) { sh.draw(); }
  });
}

/* ---------------- Motore promemoria ---------------- */
const alertQueue = [];
let alertShowing = null, soundLoop = null, actx = null;
function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { /* audio non disponibile */ }
}
document.addEventListener('pointerdown', unlockAudio, { passive: true });
function chime() {
  if (!actx || actx.state !== 'running') return;
  const t = actx.currentTime;
  [783.99, 1046.5, 1318.5].forEach((f, i) => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const st = t + i * 0.16;
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(0.28, st + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, st + 1.1);
    o.connect(g); g.connect(actx.destination);
    o.start(st); o.stop(st + 1.2);
  });
}
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* no */ } }

function checkReminders() {
  const now = Date.now(), t = todayD();
  let changed = false;
  for (const it of S.items) {
    const n = it.notify;
    if (!n || !n.enabled || !n.reminders || !n.reminders.length) continue;
    for (const occ of expand(it, addDays(t, -1), addDays(t, 33))) {
      if (isDone(it, occ)) continue;
      const at = occTime(it, occ);
      for (const off of n.reminders) {
        const fire = at - off * 60000;
        if (fire > now) continue;
        const key = `${it.id}|${occ}|${off}`;
        if (S.fired[key]) continue;
        S.fired[key] = fire; changed = true;
        if (now - fire <= 12 * 3600e3) dispatch({ key, id: it.id, occ, off, fire });
      }
    }
  }
  S.snoozes = S.snoozes.filter(s => {
    if (s.at > now) return true;
    const it = getItem(s.id);
    if (it && !isDone(it, s.occ)) dispatch({ key: `${s.key}|z${s.at}`, id: s.id, occ: s.occ, off: null, fire: s.at, snoozed: true });
    changed = true;
    return false;
  });
  const lim = now - 60 * 864e5;
  for (const k in S.fired) if (S.fired[k] < lim) { delete S.fired[k]; changed = true; }
  if (changed) save();
  pump();
}
function dispatch(a) {
  const it = getItem(a.id);
  if (!it) return;
  S.log.unshift({ key: a.key, id: a.id, occ: a.occ, at: a.fire, read: false });
  S.log = S.log.slice(0, 150);
  const style = it.notify.style;
  systemNotify(it, a);
  if (style === 'full') alertQueue.push(a);
  else if (style === 'banner') showBanner(it, a);
  updateBell();
}
function alertBody(it, occ) {
  const parts = [];
  parts.push(`${TYPES[it.type].label} · ${fmtMed(occ)}${isAllDay(it) ? '' : ' alle ' + it.time}`);
  if (it.type === 'pagamento' && it.amount) parts.push(EUR.format(it.amount));
  if (it.type === 'compleanno' && ageAt(it, occ)) parts.push(`compie ${ageAt(it, occ)} anni`);
  if (it.location) parts.push(it.location);
  return parts.join(' — ');
}
function systemNotify(it, a) {
  if (!S.settings.systemNotif || !('Notification' in window) || Notification.permission !== 'granted') return;
  if (it.notify.style === 'quiet' || !document.hidden) return;
  const opts = {
    body: alertBody(it, a.occ), tag: a.key, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    requireInteraction: it.notify.style === 'full', silent: !it.notify.sound, data: { id: it.id },
    vibrate: it.notify.vibrate ? [300, 120, 300, 120, 600] : undefined
  };
  const title = (it.type === 'compleanno' ? '🎂 ' : '') + it.title;
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(r => r.showNotification(title, opts)).catch(() => {});
  } else {
    try { new Notification(title, opts); } catch (e) { /* no */ }
  }
}
function whenText(it, occ) {
  const rd = relDay(occ);
  if (it.type === 'compleanno') { const a = ageAt(it, occ); return `${cap(rd)}${a ? ` compie ${a} anni` : ' è il compleanno'}`; }
  if (isAllDay(it)) return it.type === 'scadenza' ? `Scade ${rd}` : cap(rd);
  const m = Math.round((occTime(it, occ) - Date.now()) / 60000);
  if (Math.abs(m) <= 1) return 'Adesso';
  if (m > 0 && m < 60) return `Tra ${m} minuti`;
  if (m > 0 && m < 1440 && rd === 'oggi') { const h = Math.floor(m / 60), mm = m % 60; return `Tra ${h} or${h === 1 ? 'a' : 'e'}${mm ? ' e ' + mm + ' min' : ''}`; }
  if (m < 0 && m > -60) return it.type === 'appuntamento' ? `Iniziato ${-m} minuti fa` : it.type === 'scadenza' ? `Scaduta ${-m} minuti fa` : `${-m} minuti fa`;
  return `${cap(rd)} alle ${it.time}`;
}
function pump() {
  if (alertShowing || !alertQueue.length) return;
  showAlert(alertQueue.shift());
}
function showAlert(a) {
  const it = a.item || getItem(a.id);
  if (!it) { pump(); return; }
  alertShowing = a;
  const T = TYPES[it.type], C = CATS[it.category] || CATS.altro;
  const meta = [`<span>${I('calendar')}${fmtMed(a.occ)}</span>`];
  if (!isAllDay(it)) meta.push(`<span>${I('clock')}${it.time}${it.endTime ? '–' + it.endTime : ''}</span>`);
  if (it.location) meta.push(`<span>${I('pin')}${esc(it.location)}</span>`);
  if (it.type === 'pagamento' && it.amount) meta.push(`<span>${I('euro')}${EUR.format(it.amount)}</span>`);
  meta.push(`<span>${I(C.icon)}${C.label}</span>`);
  const check = CHECKABLE.has(it.type);
  $('#alert-root').innerHTML = `<div class="alert" style="--tc:var(--c-${it.type})" role="alertdialog" aria-modal="true" aria-labelledby="al-title">
    ${alertQueue.length ? `<div class="alert-count">+${alertQueue.length} in coda</div>` : ''}
    <div class="alert-kind">${I(T.icon)}${T.label}${a.snoozed ? ' · posticipato' : ''}</div>
    <div class="alert-ring">${I(T.icon)}</div>
    <div class="alert-when">${whenText(it, a.occ)}</div>
    <h1 class="alert-title" id="al-title">${esc(it.title)}</h1>
    <div class="alert-meta">${meta.join('')}</div>
    ${it.notes ? `<div class="alert-notes">${esc(it.notes)}</div>` : ''}
    <div class="alert-actions">
      ${check ? `<button class="btn light" data-al="done">${I('check')}${it.type === 'pagamento' ? 'Segna come pagato' : 'Segna come fatto'}</button>` : `<button class="btn light" data-al="ok">${I('check')}Ho capito</button>`}
      <div class="snooze-row">${[[5, '5 min'], [15, '15 min'], [60, '1 ora'], [1440, 'Domani']].map(([m, l]) => `<button class="btn ghost" data-al="snooze" data-m="${m}">${l}</button>`).join('')}</div>
      <button class="btn ghost" data-al="open">${I('edit')}Apri dettagli</button>
      ${check ? `<button class="btn ghost" data-al="ok">Chiudi</button>` : ''}
    </div></div>`;
  const first = $('#alert-root .btn'); first && first.focus();
  if (it.notify.sound) {
    unlockAudio(); chime();
    let n = 0;
    soundLoop = setInterval(() => { if (++n > 14) stopSound(); else chime(); }, 4000);
  }
  if (it.notify.vibrate) vibrate([500, 200, 500, 200, 900]);
}
function stopSound() { clearInterval(soundLoop); soundLoop = null; vibrate(0); }
function closeAlert(action, m) {
  const a = alertShowing;
  if (!a) return;
  stopSound();
  const it = a.item || getItem(a.id);
  const real = it && !a.item;
  if (real) {
    if (action === 'done') { it.done[a.occ] = true; toast(it.type === 'pagamento' ? 'Segnato come pagato' : 'Segnato come fatto'); }
    if (action === 'snooze') {
      S.snoozes.push({ key: a.key.split('|z')[0], id: a.id, occ: a.occ, at: Date.now() + m * 60000 });
      toast(`Ti avviso di nuovo ${m >= 1440 ? 'domani' : m >= 60 ? 'tra 1 ora' : 'tra ' + m + ' minuti'}`);
    }
    const l = S.log.find(x => x.key === a.key); if (l) l.read = true;
    save();
  } else if (action === 'snooze') toast('Questa era una prova: nessun posticipo');
  $('#alert-root').innerHTML = '';
  alertShowing = null;
  refreshAll();
  if (real && action === 'open') openForm(it, {}, a.occ);
  setTimeout(pump, 300);
}
$('#alert-root').addEventListener('click', e => {
  const b = e.target.closest('[data-al]');
  if (b) closeAlert(b.dataset.al, +b.dataset.m || 0);
});
function showBanner(it, a) {
  const el = document.createElement('div');
  el.className = 'banner';
  el.style.setProperty('--tc', `var(--c-${it.type})`);
  el.innerHTML = `<div class="ibox">${I(TYPES[it.type].icon)}</div>
    <div class="row-main" data-b="open"><div class="row-title">${esc(it.title)}</div><div class="row-meta"><span>${whenText(it, a.occ)}</span></div></div>
    <div class="btns"><button class="btn sm" data-b="snooze" aria-label="Posticipa di 10 minuti">${I('alarm')}10'</button><button class="icon-btn" data-b="close" aria-label="Chiudi">${I('x')}</button></div>`;
  $('#banners').appendChild(el);
  if (it.notify.sound) { unlockAudio(); chime(); }
  if (it.notify.vibrate) vibrate([250, 120, 250]);
  const kill = () => { el.style.transition = 'all .25s'; el.style.opacity = '0'; el.style.transform = 'translateY(-14px)'; setTimeout(() => el.remove(), 260); };
  const timer = setTimeout(kill, 14000);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-b]');
    if (!b) return;
    clearTimeout(timer); kill();
    const l = S.log.find(x => x.key === a.key); if (l) l.read = true;
    if (b.dataset.b === 'snooze') { S.snoozes.push({ key: a.key.split('|z')[0], id: a.id, occ: a.occ, at: Date.now() + 600000 }); toast('Ti avviso di nuovo tra 10 minuti'); }
    save(); updateBell();
    if (b.dataset.b === 'open') openForm(it, {}, a.occ);
  });
}

/* ---------------- Import / export ---------------- */
function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function exportJSON() {
  download(`agendapp-backup-${ds(todayD())}.json`, JSON.stringify({ app: 'AgendApp', version: 1, exported: new Date().toISOString(), data: S }, null, 2), 'application/json');
  toast('Backup scaricato');
}
function importJSON() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const raw = JSON.parse(r.result), data = raw.data || raw;
        if (!Array.isArray(data.items)) throw new Error('formato');
        if (!confirm(`Il backup contiene ${data.items.length} elementi. Sostituire i dati attuali?`)) return;
        S = migrate(data);
        S.items.forEach(resetFired);
        save(); applyTheme(); refreshAll();
        toast('Backup ripristinato');
      } catch (e) { toast('File non valido'); }
    };
    r.readAsText(f);
  };
  inp.click();
}
function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
function exportICS() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const [ah, am] = S.settings.allDayTime.split(':').map(Number);
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AgendApp//IT', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:AgendApp'];
  for (const it of S.items) {
    const dd = it.date.replace(/-/g, '');
    L.push('BEGIN:VEVENT', `UID:${it.id}@agendapp`, `DTSTAMP:${stamp}`);
    if (isAllDay(it)) {
      L.push(`DTSTART;VALUE=DATE:${dd}`, `DTEND;VALUE=DATE:${ds(addDays(pd(it.date), 1)).replace(/-/g, '')}`);
    } else {
      const st = it.time.replace(':', '');
      let en = it.endTime ? it.endTime.replace(':', '') : pad((+it.time.slice(0, 2) + 1) % 24) + it.time.slice(3);
      L.push(`DTSTART:${dd}T${st}00`, `DTEND:${dd}T${en}00`);
    }
    const desc = [TYPES[it.type].label, (CATS[it.category] || CATS.altro).label, it.amount ? EUR.format(it.amount) : '', it.notes].filter(Boolean).join(' · ');
    L.push(`SUMMARY:${icsText(it.title)}`, `DESCRIPTION:${icsText(desc)}`, `CATEGORIES:${icsText(TYPES[it.type].label)}`);
    if (it.location) L.push(`LOCATION:${icsText(it.location)}`);
    const r = it.type === 'compleanno' ? { freq: 'yearly', n: 1 } : repInfo(it.repeat);
    if (r) L.push(`RRULE:FREQ=${r.freq.toUpperCase()};INTERVAL=${r.n}${it.until ? ';UNTIL=' + it.until.replace(/-/g, '') + 'T235959' : ''}`);
    if (it.notify && it.notify.enabled) for (const off of it.notify.reminders) {
      const mins = isAllDay(it) ? (ah * 60 + am) - off : -off;
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(it.title)}`, `TRIGGER:${mins < 0 ? '-' : ''}PT${Math.abs(mins)}M`, 'END:VALARM');
    }
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  download(`agendapp-${ds(todayD())}.ics`, L.join('\r\n'), 'text/calendar');
  toast('Calendario esportato');
}
function loadDemo() {
  const t = todayD(), D = n => ds(addDays(t, n));
  const car = { id: uid(), type: 'auto', name: 'Panda', plate: 'AB123CD', notes: '' };
  const bike = { id: uid(), type: 'bicicletta', name: 'MTB', plate: '', notes: '' };
  S.vehicles.push(car, bike);
  const mk = (p, extra) => { const it = newItem(p); Object.assign(it, extra); return it; };
  const list = [
    mk({ type: 'appuntamento', date: D(2) }, { title: 'Visita dal dentista', category: 'salute', time: '10:30', endTime: '11:15', location: 'Studio dentistico', notes: 'Portare la tessera sanitaria' }),
    mk({ type: 'appuntamento', date: D(1) }, { title: 'Riunione settimanale', category: 'lavoro', time: '09:00', endTime: '10:00', repeat: 'weekly' }),
    mk({ type: 'scadenza', date: D(12) }, { title: 'Revisione Panda', category: 'mezzi', vehicleId: car.id, repeat: 'yearly2' }),
    mk({ type: 'pagamento', date: D(18) }, { title: 'Assicurazione Panda', category: 'mezzi', vehicleId: car.id, amount: 480, repeat: 'yearly' }),
    mk({ type: 'pagamento', date: D(5) }, { title: 'Bolletta luce', category: 'casa', amount: 74.5, repeat: 'monthly2' }),
    mk({ type: 'pagamento', date: D(-3) }, { title: 'Abbonamento palestra', category: 'sport', amount: 45, repeat: 'monthly' }),
    mk({ type: 'compleanno', date: D(9) }, { title: 'Mamma', category: 'famiglia', birthYear: String(t.getFullYear() - 68) }),
    mk({ type: 'scadenza', date: D(25) }, { title: 'Rinnovo carta d\'identità', category: 'personale', location: 'Comune' }),
    mk({ type: 'nota', date: D(0) }, { title: 'Comprare i regali', category: 'famiglia', notes: 'Lista: libro, sciarpa, cuffie' }),
    mk({ type: 'appuntamento', date: D(6) }, { title: 'Giro in MTB con gli amici', category: 'svago', time: '08:30', location: 'Parcheggio dei boschi' }),
    mk({ type: 'scadenza', date: D(20) }, { title: 'Manutenzione MTB', category: 'mezzi', vehicleId: bike.id, repeat: 'monthly6' })
  ];
  list.forEach(it => { it.created = Date.now() - 30 * 864e5; S.items.push(it); resetFired(it); });
  S.dayNotes[D(0)] = 'Benvenuto in AgendApp! Qui puoi scrivere gli appunti della giornata.';
  save(); refreshAll();
  toast('Esempi caricati');
}

/* ---------------- Importazione da altri calendari (.ics / .zip) ---------------- */
function icsUnesc(s) { return String(s || '').replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); }
function icsDate(val, P) {
  if ((P && P.VALUE === 'DATE') || /^\d{8}$/.test(val)) return { date: `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`, allDay: true };
  const m = /^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)?(Z)?$/.exec(val);
  if (!m) return null;
  const d = m[7] ? new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5])) : new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
  return { date: ds(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, allDay: false };
}
function icsDur(v) { // restituisce i minuti di anticipo (>= 0)
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim());
  if (!m) return null;
  const tot = ((+m[2] || 0) * 7 * 1440) + ((+m[3] || 0) * 1440) + ((+m[4] || 0) * 60) + (+m[5] || 0);
  return m[1] === '-' ? tot : 0;
}
function parseICS(text) {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const events = [];
  let cur = null, alarm = null, calName = '';
  for (const raw of lines) {
    const i = raw.indexOf(':');
    if (i < 0) continue;
    const left = raw.slice(0, i), val = raw.slice(i + 1);
    const [nm, ...ps] = left.split(';');
    const N = nm.toUpperCase(), P = {};
    ps.forEach(p => { const j = p.indexOf('='); if (j > 0) P[p.slice(0, j).toUpperCase()] = p.slice(j + 1).replace(/"/g, ''); });
    if (N === 'BEGIN' && val === 'VEVENT') { cur = { alarms: [] }; continue; }
    if (N === 'END' && val === 'VEVENT') { if (cur) events.push(cur); cur = null; continue; }
    if (!cur) { if (N === 'X-WR-CALNAME') calName = icsUnesc(val); continue; }
    if (N === 'BEGIN' && val === 'VALARM') { alarm = {}; continue; }
    if (N === 'END' && val === 'VALARM') { if (alarm && alarm.t != null) cur.alarms.push(alarm.t); alarm = null; continue; }
    if (alarm) { if (N === 'TRIGGER' && P.VALUE !== 'DATE-TIME') alarm.t = icsDur(val); continue; }
    if (N === 'UID') cur.uid = val;
    else if (N === 'SUMMARY') cur.summary = icsUnesc(val);
    else if (N === 'DESCRIPTION') cur.desc = icsUnesc(val);
    else if (N === 'LOCATION') cur.loc = icsUnesc(val);
    else if (N === 'DTSTART') cur.start = icsDate(val, P);
    else if (N === 'DTEND') cur.end = icsDate(val, P);
    else if (N === 'RRULE') { cur.rrule = {}; val.split(';').forEach(kv => { const [k, v] = kv.split('='); cur.rrule[k.toUpperCase()] = v; }); }
    else if (N === 'RECURRENCE-ID') cur.recId = true;
    else if (N === 'STATUS') cur.status = val.toUpperCase();
  }
  return { calName, events };
}
async function unzipICS(buf) {
  const dv = new DataView(buf), dec = new TextDecoder();
  let e = buf.byteLength - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('zip non valido');
  const n = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  const out = [];
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true),
      xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nlen));
    p += 46 + nlen + xlen + clen;
    if (!/\.ics$/i.test(name)) continue;
    const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    const data = new Uint8Array(buf, start, csize);
    let bytes;
    if (method === 0) bytes = data;
    else if (method === 8 && 'DecompressionStream' in window) {
      bytes = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    } else continue;
    out.push({ name: name.split('/').pop(), text: dec.decode(bytes) });
  }
  return out;
}
const BDAY_RE = /compleann|birthday|geburtstag|cumplea|anniversaire/i;
function cleanBdayTitle(t) {
  return (t || '').replace(/^\s*(🎂\s*)?(compleanno( di)?|birthday( of)?|buon compleanno)\s*/i, '').replace(/['’]s birthday$/i, '').trim() || t;
}
const RR_MAP = { DAILY: { 1: 'daily' }, WEEKLY: { 1: 'weekly', 2: 'weekly2' }, MONTHLY: { 1: 'monthly', 2: 'monthly2', 3: 'monthly3', 6: 'monthly6' }, YEARLY: { 1: 'yearly', 2: 'yearly2' } };
const WD_ICS = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };
function icsEventToItems(ev, o) {
  if (!ev.start || ev.recId || ev.status === 'CANCELLED') return [];
  const rr = ev.rrule;
  const bday = BDAY_RE.test(ev.summary || '');
  const type = o.type === 'auto' ? (bday ? 'compleanno' : 'appuntamento') : o.type;
  let repeat = 'none', until = '';
  if (rr && RR_MAP[rr.FREQ]) {
    const n = +(rr.INTERVAL || 1);
    repeat = RR_MAP[rr.FREQ][n] || RR_MAP[rr.FREQ][1];
    if (rr.UNTIL) { const u = icsDate(rr.UNTIL, {}); if (u) until = u.date; }
  }
  const base = newItem({ type, date: ev.start.date, category: o.category });
  Object.assign(base, {
    title: (type === 'compleanno' ? cleanBdayTitle(ev.summary) : ev.summary) || '(senza titolo)',
    allDay: ev.start.allDay || type === 'compleanno', time: ev.start.allDay ? '' : ev.start.time,
    endTime: !ev.start.allDay && ev.end && ev.end.date === ev.start.date && type === 'appuntamento' ? ev.end.time : '',
    location: ev.loc || '', notes: (ev.desc || '').slice(0, 3000),
    repeat: type === 'compleanno' ? 'yearly' : repeat, until,
    extUid: `${o.prefix}${ev.uid || ev.summary + ev.start.date}`, source: o.source, calName: o.calName || ''
  });
  if (ev.alarms.length) base.notify.reminders = [...new Set(ev.alarms)].sort((a, b) => b - a);
  if (rr && rr.COUNT && repeat !== 'none') {
    const occ = expand(base, pd(base.date), addDays(pd(base.date), 3660));
    const c = +rr.COUNT;
    if (occ[c - 1]) base.until = occ[c - 1];
  }
  let items = [base];
  if (rr && rr.FREQ === 'WEEKLY' && rr.BYDAY && rr.BYDAY.includes(',')) {
    items = rr.BYDAY.split(',').map(code => {
      const w = WD_ICS[code.replace(/^[+-]?\d+/, '')];
      if (w == null) return null;
      const c = clone(base);
      const st = pd(base.date);
      c.date = ds(addDays(st, (w - wd(st) + 7) % 7));
      c.id = uid(); c.extUid = base.extUid + '#' + code;
      return c;
    }).filter(Boolean);
  }
  if (o.skipPast) {
    const lim = ds(addDays(todayD(), -1));
    items = items.filter(it => {
      if (it.type === 'compleanno') return true;
      if (it.repeat === 'none') return it.date >= lim;
      return !it.until || it.until >= lim;
    });
  }
  return items;
}
function mergeItems(items) {
  let added = 0, updated = 0;
  for (const it of items) {
    const ex = it.extUid && S.items.find(x => x.extUid === it.extUid);
    if (ex) {
      // aggiorna i dati ma conserva le scelte fatte in AgendApp (tipo, sezione, notifiche, spunte)
      Object.assign(ex, { title: it.title, date: it.date, allDay: it.allDay, time: it.time, endTime: it.endTime, location: it.location, notes: it.notes, repeat: ex.type === 'compleanno' ? 'yearly' : it.repeat, until: it.until, calName: it.calName });
      resetFired(ex); updated++;
    } else { S.items.push(it); resetFired(it); added++; }
  }
  return { added, updated };
}
function pickCalendarFiles() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.multiple = true;
  inp.accept = '.ics,.ical,.ifb,.zip,text/calendar,application/zip';
  inp.onchange = async () => {
    const files = [...inp.files];
    if (!files.length) return;
    const cals = [];
    try {
      for (const f of files) {
        if (/\.zip$/i.test(f.name) || f.type.includes('zip')) {
          for (const e of await unzipICS(await f.arrayBuffer())) cals.push({ file: e.name, ...parseICS(e.text) });
        } else cals.push({ file: f.name, ...parseICS(await f.text()) });
      }
    } catch (e) { toast('Impossibile leggere il file'); return; }
    const valid = cals.filter(c => c.events.length);
    if (!valid.length) { toast('Nessun evento trovato nel file'); return; }
    openImportSheet(valid);
  };
  inp.click();
}
function openImportSheet(cals) {
  const label = c => c.calName || c.file.replace(/\.ics$/i, '').replace(/_[a-z0-9.@-]+$/i, '');
  openSheet({
    build: () => ({
      title: 'Importa calendario<span class="sub">Trovati ' + cals.reduce((a, c) => a + c.events.length, 0) + ' eventi</span>',
      body: `<form id="impform">
        <div class="field"><span class="flabel">Calendari da importare</span>
          ${cals.map((c, i) => `<div class="inline-sw"><span style="white-space:normal">${esc(label(c))} <small style="color:var(--muted)">· ${c.events.length} eventi</small></span><label class="switch"><input type="checkbox" name="cal" value="${i}" checked><span></span></label></div>`).join('')}
        </div>
        <div class="grid2">
          <div class="field"><label for="imp-type">Importa come</label><select class="inp" id="imp-type" name="type"><option value="auto">Automatico</option>${TYPE_ORDER.map(t => `<option value="${t}">${TYPES[t].plural}</option>`).join('')}</select></div>
          <div class="field"><label for="imp-cat">Sezione</label><select class="inp" id="imp-cat" name="category">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${k === 'personale' ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div>
        </div>
        <p class="hint" style="margin:-6px 0 12px">“Automatico”: i compleanni diventano Compleanni, il resto Appuntamenti. Ripetizioni e promemoria vengono mantenuti; se importi di nuovo lo stesso file gli eventi vengono aggiornati, non duplicati.</p>
        <div class="inline-sw"><span>Salta gli eventi già passati</span><label class="switch"><input type="checkbox" name="skipPast" checked><span></span></label></div>
      </form>`,
      foot: `<div class="btns"><span class="grow"></span><button class="btn" data-act="sheet-close">Annulla</button><button class="btn primary" data-act="import-run">${I('download')}Importa</button></div>`
    }),
    mount(w, sh) {
      sh.run = () => {
        const fd = new FormData($('#impform', w));
        const pick = fd.getAll('cal').map(Number);
        if (!pick.length) { toast('Seleziona almeno un calendario'); return; }
        let items = [];
        for (const i of pick) {
          const c = cals[i];
          const o = { type: fd.get('type'), category: fd.get('category'), skipPast: fd.get('skipPast') === 'on', prefix: 'ics:', source: 'ics', calName: label(c) };
          c.events.forEach(ev => { items = items.concat(icsEventToItems(ev, o)); });
        }
        const r = mergeItems(items);
        save(); closeSheet(); refreshAll();
        toast(`Importati ${r.added} eventi${r.updated ? `, ${r.updated} aggiornati` : ''}`);
      };
    }
  });
}

/* ---------------- Sincronizzazione Google Calendar (Apps Script) ---------------- */
const gs = () => S.settings.gsync || (S.settings.gsync = { url: '', key: '', category: 'personale', auto: true, excluded: [], calendars: [], last: 0, error: '' });
let syncing = false;
async function syncGoogle(manual) {
  const g = gs();
  if (!g.url) { if (manual) toast('Inserisci prima l\'indirizzo dello script'); return; }
  if (syncing) return;
  syncing = true;
  if (manual) toast('Sincronizzazione in corso…');
  try {
    const u = g.url + (g.url.includes('?') ? '&' : '?') + 'k=' + encodeURIComponent(g.key || '') + '&t=' + Date.now();
    const r = await fetch(u, { redirect: 'follow' });
    const data = await r.json();
    if (data.error) throw new Error(data.error === 'chiave non valida' ? 'Chiave non valida' : data.error);
    const ex = new Set(g.excluded || []), seen = new Set();
    const items = [];
    for (const ev of data.events || []) {
      if (ex.has(ev.cal)) continue;
      const allDay = !!ev.allDay;
      const sd = ev.start.slice(0, 10), st = allDay ? '' : ev.start.slice(11, 16);
      const bday = BDAY_RE.test(ev.title || '');
      const type = bday ? 'compleanno' : 'appuntamento';
      const it = newItem({ type, date: sd, category: g.category || 'personale' });
      Object.assign(it, {
        title: (bday ? cleanBdayTitle(ev.title) : ev.title) || '(senza titolo)', allDay: allDay || bday, time: bday ? '' : st,
        endTime: !allDay && !bday && ev.end && ev.end.slice(0, 10) === sd ? ev.end.slice(11, 16) : '',
        location: ev.loc || '', notes: (ev.desc || '').replace(/<[^>]+>/g, ' ').slice(0, 3000),
        repeat: 'none', extUid: 'g:' + ev.id, source: 'google', calName: ev.calName || ''
      });
      if (Array.isArray(ev.reminders) && ev.reminders.length) it.notify.reminders = [...new Set(ev.reminders.map(Number))].sort((a, b) => b - a);
      seen.add(it.extUid);
      items.push(it);
    }
    const res = mergeItems(items);
    // elimina gli eventi cancellati su Google (solo nell'intervallo sincronizzato)
    const from = ds(addDays(todayD(), -30)), to = ds(addDays(todayD(), 365));
    const before = S.items.length;
    S.items = S.items.filter(i => !(i.source === 'google' && !seen.has(i.extUid) && i.date >= from && i.date <= to));
    const removed = before - S.items.length;
    g.calendars = data.calendars || [];
    g.last = Date.now(); g.error = '';
    save(); refreshAll();
    if (manual) toast(`Google Calendar aggiornato: ${res.added} nuovi, ${res.updated} aggiornati${removed ? `, ${removed} rimossi` : ''}`);
  } catch (e) {
    g.error = (e && e.message) || 'errore';
    save();
    if (manual) { toast('Sincronizzazione non riuscita: ' + g.error); refreshAll(); }
  } finally { syncing = false; }
}
function autoSync() {
  const g = S.settings.gsync;
  if (g && g.url && g.auto && navigator.onLine && Date.now() - (g.last || 0) > 30 * 60 * 1000) syncGoogle(false);
}
function openGoogleSheet() {
  const g = gs();
  openSheet({
    build: () => ({
      title: 'Google Calendar<span class="sub">' + (g.last ? 'Ultima sincronizzazione: ' + new Date(g.last).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : 'Non ancora collegato') + '</span>',
      body: `<div class="notif-box" style="padding:12px 14px">
          <div class="nb-head" style="padding-top:0">${I('sparkle')}<span class="grow">Come collegarlo (una sola volta, da computer)</span></div>
          <ol class="hint" style="padding-left:18px;margin:0;font-size:13.5px;color:var(--ink-2)">
            <li>Apri <b>script.google.com</b> con il tuo account Google → <b>Nuovo progetto</b>.</li>
            <li>Incolla il codice dello script (tasto qui sotto) e cambia la <b>CHIAVE</b> con una parola segreta.</li>
            <li>Esegui la funzione <b>prova</b> e concedi l'accesso al calendario.</li>
            <li><b>Pubblica → Nuovo deployment → App web</b>: “Esegui come: Me”, “Chi ha accesso: Chiunque”.</li>
            <li>Copia l'URL dell'app web e incollalo qui con la stessa chiave.</li>
          </ol>
          <div class="btns" style="margin-top:10px"><button class="btn sm" data-act="gs-copy">${I('note')}Copia codice script</button></div>
        </div>
        <form id="gsform">
          <div class="field"><label for="gs-url">URL dell'app web</label><input class="inp" id="gs-url" name="url" value="${esc(g.url)}" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off" inputmode="url"></div>
          <div class="grid2">
            <div class="field"><label for="gs-key">Chiave</label><input class="inp" id="gs-key" name="key" value="${esc(g.key)}" autocomplete="off"></div>
            <div class="field"><label for="gs-cat">Sezione</label><select class="inp" id="gs-cat" name="category">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${g.category === k ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div>
          </div>
          <div class="inline-sw"><span>Sincronizza automaticamente</span><label class="switch"><input type="checkbox" name="auto" ${g.auto ? 'checked' : ''}><span></span></label></div>
          ${g.calendars && g.calendars.length ? `<div class="field" style="margin-top:8px"><span class="flabel">Calendari</span>${g.calendars.map(c => `<div class="inline-sw"><span style="white-space:normal"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${esc(c.color || '#888')};margin-right:6px"></i>${esc(c.name)}</span><label class="switch"><input type="checkbox" name="cal" value="${esc(c.id)}" ${(g.excluded || []).includes(c.id) ? '' : 'checked'}><span></span></label></div>`).join('')}</div>` : ''}
          ${g.error ? `<p class="hint" style="color:var(--red)">Ultimo errore: ${esc(g.error)}</p>` : ''}
          <p class="hint">Gli eventi di Google arrivano in AgendApp (ultimi 30 giorni e prossimi 12 mesi). Titolo, data e luogo si modificano su Google; in AgendApp puoi personalizzare notifiche, tipologia e sezione.</p>
        </form>`,
      foot: `<div class="btns">${g.url ? `<button class="btn danger" data-act="gs-unlink">Scollega</button>` : ''}<span class="grow"></span><button class="btn primary" data-act="gs-save">${I('repeat')}Salva e sincronizza</button></div>`
    }),
    mount(w, sh) {
      sh.saveG = () => {
        const f = $('#gsform', w), fd = new FormData(f);
        g.url = (fd.get('url') || '').trim();
        g.key = (fd.get('key') || '').trim();
        g.category = fd.get('category');
        g.auto = fd.get('auto') === 'on';
        if (g.calendars && g.calendars.length) { const on = new Set(fd.getAll('cal')); g.excluded = g.calendars.map(c => c.id).filter(id => !on.has(id)); }
        if (g.url && !/^https:\/\/script\.google(usercontent)?\.com\//.test(g.url)) { toast('L\'URL deve iniziare con https://script.google.com/'); return; }
        save(); closeSheet();
        if (g.url) syncGoogle(true); else refreshAll();
      };
    }
  });
}

/* ---------------- Gestione eventi ---------------- */
const ACT = {
  tab: el => { ui.tab = el.dataset.tab; if (ui.tab !== 'sec') ui.section = null; render(); window.scrollTo(0, 0); },
  view: el => { ui.view = el.dataset.v; render(); },
  prev: () => shiftCursor(-1),
  next: () => shiftCursor(1),
  today: () => { ui.cursor = todayD(); render(); },
  day: el => openDay(el.dataset.d),
  'day-shift': el => { const s = sheets[sheets.length - 1]; s && s.shift && s.shift(+el.dataset.n); },
  gomonth: el => { ui.cursor = new Date(ui.cursor.getFullYear(), +el.dataset.m, 1); ui.view = 'month'; render(); window.scrollTo(0, 0); },
  goweek: () => { ui.tab = 'cal'; ui.view = 'week'; ui.cursor = todayD(); render(); },
  'jump-overdue': () => { const el = $('#overdue'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else toast('Niente in ritardo, ottimo!'); },
  new: () => {
    let date = ds(todayD());
    const top = sheets[sheets.length - 1];
    if (top && top.shift) { const h = $('[data-act="new-type"]', top.el); if (h) date = h.dataset.d; }
    const p = { date };
    if (ui.tab === 'sec' && ui.section) {
      const [k, id] = ui.section.split(':');
      if (k === 'type') p.type = id;
      if (k === 'cat') p.category = id;
      if (k === 'veh') { p.category = 'mezzi'; p.extra = { vehicleId: id, category: 'mezzi' }; }
    }
    openForm(null, p);
  },
  'new-type': el => openForm(null, { type: el.dataset.type, date: el.dataset.d || ds(todayD()) }),
  'new-cat': el => openForm(null, { category: el.dataset.cat }),
  'new-veh': el => openForm(null, { type: 'scadenza', category: 'mezzi', extra: { vehicleId: el.dataset.vid } }),
  edit: el => { const it = getItem(el.dataset.id); if (it) openForm(it, {}, el.dataset.occ || null); },
  'toggle-done': el => {
    const it = getItem(el.dataset.id), o = el.dataset.occ;
    if (!it) return;
    if (it.done[o]) delete it.done[o]; else it.done[o] = true;
    save(); refreshAll();
    toast(it.done[o] ? (it.type === 'pagamento' ? 'Pagato ✓' : 'Fatto ✓') : 'Segnato come da fare');
  },
  'item-save': () => { const s = sheets[sheets.length - 1]; s && s.save && s.save(); },
  'item-delete': el => {
    const it = getItem(el.dataset.id);
    if (!it) return;
    const rep = it.repeat && it.repeat !== 'none';
    if (!confirm(`Eliminare “${it.title}”${rep ? ' e tutte le sue ripetizioni' : ''}?`)) return;
    S.items = S.items.filter(x => x.id !== it.id);
    S.snoozes = S.snoozes.filter(s => s.id !== it.id);
    save(); closeSheet(); refreshAll(); toast('Eliminato');
  },
  'item-dup': el => {
    const it = getItem(el.dataset.id);
    if (!it) return;
    const c = clone(it); c.id = uid(); c.title += ' (copia)'; c.done = {}; c.created = Date.now();
    S.items.push(c); resetFired(c); save(); closeSheet(); refreshAll();
    setTimeout(() => openForm(c), 250);
  },
  section: el => { ui.tab = 'sec'; ui.section = el.dataset.s; render(); window.scrollTo(0, 0); },
  'sec-back': () => { ui.section = null; render(); },
  'veh-add': () => openVehicleForm(null),
  'veh-edit': el => openVehicleForm(getVeh(el.dataset.vid)),
  'veh-save': () => { const s = sheets[sheets.length - 1]; s && s.save && s.save(); },
  'veh-delete': el => {
    const v = getVeh(el.dataset.vid);
    if (!v || !confirm(`Eliminare “${v.name}”? Gli impegni collegati resteranno nella sezione Mezzi.`)) return;
    S.vehicles = S.vehicles.filter(x => x.id !== v.id);
    S.items.forEach(i => { if (i.vehicleId === v.id) i.vehicleId = ''; });
    ui.section = 'cat:mezzi';
    save(); closeSheet(); refreshAll();
  },
  'veh-tpl': el => {
    const v = getVeh(el.dataset.vid), t = VTEMPLATES[v.type][+el.dataset.i];
    openForm(null, { type: t.type, category: 'mezzi', extra: { vehicleId: v.id, title: `${t.title} ${v.name}`, repeat: t.repeat } });
  },
  'sheet-close': () => closeSheet(),
  'notif-center': () => openNotifCenter(),
  'nc-open': el => {
    const l = S.log.find(x => x.key === el.dataset.key);
    if (!l) return;
    l.read = true; save(); updateBell();
    const it = getItem(l.id);
    if (it) openForm(it, {}, l.occ);
  },
  'nc-read': () => { S.log.forEach(l => { l.read = true; }); save(); refreshAll(); },
  'nc-clear': () => { S.log = []; save(); refreshAll(); },
  'search-open': () => { ui.tab = 'up'; render(); setTimeout(() => { const q = $('#q'); q && q.focus(); }, 50); },
  'test-alert': () => {
    unlockAudio();
    const it = newItem({ type: 'appuntamento' });
    Object.assign(it, { title: 'Questo è un avviso di prova', time: nextHalfHour(), location: 'AgendApp', notes: 'Gli avvisi a schermo intero restano visibili finché non scegli cosa fare.' });
    alertQueue.unshift({ key: 'test', item: it, occ: ds(todayD()) });
    pump();
  },
  'import-ics': () => pickCalendarFiles(),
  'import-run': () => { const s = sheets[sheets.length - 1]; s && s.run && s.run(); },
  'google-open': () => openGoogleSheet(),
  'gs-save': () => { const s = sheets[sheets.length - 1]; s && s.saveG && s.saveG(); },
  'gs-sync': () => syncGoogle(true),
  'gs-copy': async () => {
    try {
      const code = await (await fetch('google/AgendAppSync.gs', { cache: 'no-cache' })).text();
      await navigator.clipboard.writeText(code);
      toast('Codice copiato: incollalo su script.google.com');
    } catch (e) { window.open('google/AgendAppSync.gs', '_blank'); }
  },
  'gs-unlink': () => {
    const n = S.items.filter(i => i.source === 'google').length;
    const del = n && confirm(`Scollegare Google Calendar. Vuoi eliminare anche i ${n} eventi importati da Google?`);
    if (del) S.items = S.items.filter(i => i.source !== 'google');
    S.settings.gsync = null;
    save(); closeSheet(); refreshAll(); toast('Google Calendar scollegato');
  },
  'check-update': () => {
    if (!window.AppUpdate) { toast('Controllo aggiornamenti non disponibile'); return; }
    window.AppUpdate.check().then(found => { if (!found) toast(`Hai già l'ultima versione (${APP_VERSION})`); });
  },
  export: exportJSON,
  import: importJSON,
  ics: exportICS,
  demo: loadDemo,
  wipe: () => {
    if (!confirm('Cancellare definitivamente tutti i dati di AgendApp?')) return;
    if (!confirm('Sei sicuro? L\'operazione non si può annullare.')) return;
    const st = S.settings; S = blankState(); S.settings = st; save(); refreshAll(); toast('Dati cancellati');
  }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn(el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (alertShowing) closeAlert('ok');
    else if (sheets.length) closeSheet();
  }
  if (e.key === 'Enter' && e.target.matches('.row[data-act]')) ACT.edit(e.target);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.set) {
    const k = el.dataset.set;
    if (k === 'systemNotif') {
      if (el.checked && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(p => {
          S.settings.systemNotif = p === 'granted';
          save(); render();
          toast(p === 'granted' ? 'Notifiche di sistema attivate' : 'Permesso negato dal browser');
        });
        return;
      }
      S.settings.systemNotif = el.checked;
    } else S.settings[k] = el.value;
    save();
    if (k === 'theme') applyTheme();
    if (k === 'allDayTime') S.items.forEach(resetFired), save();
    toast('Impostazione salvata');
  } else if (el.dataset.def) {
    const d = S.settings.defaults[el.dataset.def];
    if (el.dataset.k === 'style') d.style = el.value;
    else {
      const m = +el.value;
      d.reminders = el.checked ? [...new Set([...d.reminders, m])].sort((a, b) => b - a) : d.reminders.filter(x => x !== m);
    }
    save();
  }
});

/* scorrimento laterale nel calendario */
let tx = null, ty = null;
$('#view').addEventListener('touchstart', e => { if (ui.tab !== 'cal') return; tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
$('#view').addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  tx = null;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 50) shiftCursor(dx < 0 ? 1 : -1);
}, { passive: true });

/* ---------------- Avvio ---------------- */
applyTheme();
render();
setTimeout(checkReminders, 800);
setInterval(checkReminders, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); renderChrome(); autoSync(); } });
setTimeout(autoSync, 1500);
// a mezzanotte aggiorna la vista "oggi"
let lastDay = ds(todayD());
setInterval(() => { const d = ds(todayD()); if (d !== lastDay) { lastDay = d; render(); } }, 60000);

const params = new URLSearchParams(location.search);
if (params.get('open')) { const it = getItem(params.get('open')); if (it) setTimeout(() => openForm(it, {}, nextOcc(it)), 300); history.replaceState(null, '', location.pathname); }

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'open-item') { const it = getItem(e.data.id); if (it) openForm(it, {}, nextOcc(it)); }
  });
}
})();
