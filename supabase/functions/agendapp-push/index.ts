// AgendApp — invio delle notifiche push ad app chiusa (Supabase Edge Function)
// Azioni:
//   GET  ?a=key                         -> chiave pubblica VAPID
//   POST {a:'sync', device, token, sub, origin, items:[{k, at, p}]}  -> registra il dispositivo e i promemoria
//   POST {a:'off',  device, token}      -> scollega il dispositivo
//   POST {a:'test', device, token}      -> invia subito una notifica di prova
//   POST {a:'send'} + header x-cron     -> chiamata ogni minuto da pg_cron: invia i promemoria scaduti
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-cron', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function cfg(k: string) { const { data } = await db.from('push_config').select('v').eq('k', k).maybeSingle(); return data?.v as string | undefined; }
let vapid: { pub: string; priv: string } | null = null;
async function keys() {
  if (vapid) return vapid;
  let pub = await cfg('vapid_pub'), priv = await cfg('vapid_priv');
  if (!pub || !priv) {
    const g = webpush.generateVAPIDKeys();
    await db.from('push_config').upsert([{ k: 'vapid_pub', v: g.publicKey }, { k: 'vapid_priv', v: g.privateKey }], { onConflict: 'k', ignoreDuplicates: true });
    pub = await cfg('vapid_pub'); priv = await cfg('vapid_priv');
  }
  return (vapid = { pub: pub!, priv: priv! });
}
async function sha(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const okId = (s: unknown) => typeof s === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(s);
async function auth(device: string, token: string) {
  const { data } = await db.from('push_devices').select('token').eq('id', device).maybeSingle();
  if (!data) return 'new';
  return data.token === await sha(token) ? 'ok' : 'no';
}
async function push(sub: any, payload: unknown, origin?: string) {
  const k = await keys();
  const subject = origin && /^https:\/\//.test(origin) ? origin : 'https://supabase.com';
  return webpush.sendNotification(sub, JSON.stringify(payload), {
    TTL: 43200, urgency: 'high', vapidDetails: { subject, publicKey: k.pub, privateKey: k.priv }
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    if (req.method === 'GET') return json({ key: (await keys()).pub });
    const body = await req.json().catch(() => ({}));
    const a = body.a;

    if (a === 'send') {
      if (req.headers.get('x-cron') !== await cfg('cron')) return json({ error: 'no' }, 403);
      const { data, error } = await db.rpc('push_claim', { lim: 300 });
      if (error) throw error;
      let sent = 0, gone = 0;
      await Promise.all((data || []).map(async (r: any) => {
        try { await push(r.sub, r.payload, r.sub?.origin); sent++; }
        catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) { gone++; await db.from('push_devices').delete().eq('id', r.device_id); }
          else console.error('push', e?.statusCode, e?.body || e?.message);
        }
      }));
      await db.from('push_queue').delete().lt('at', new Date(Date.now() - 3 * 864e5).toISOString());
      return json({ sent, gone });
    }

    const { device, token } = body;
    if (!okId(device) || !okId(token)) return json({ error: 'dispositivo non valido' }, 400);
    const st = await auth(device, token);
    if (st === 'no') return json({ error: 'non autorizzato' }, 403);

    if (a === 'off') {
      if (st === 'ok') await db.from('push_devices').delete().eq('id', device);
      return json({ ok: true });
    }
    if (a === 'test') {
      if (st !== 'ok') return json({ error: 'dispositivo non registrato' }, 404);
      const { data } = await db.from('push_devices').select('sub').eq('id', device).single();
      await push(data!.sub, { t: 'AgendApp', b: 'Le notifiche ad app chiusa funzionano ✓', k: 'test-' + Date.now() }, data!.sub?.origin);
      return json({ ok: true });
    }
    if (a === 'sync') {
      const sub = body.sub;
      if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys) return json({ error: 'iscrizione non valida' }, 400);
      if (typeof body.origin === 'string') sub.origin = body.origin.slice(0, 200);
      const items = Array.isArray(body.items) ? body.items.slice(0, 800) : [];
      const now = Date.now();
      const rows = items.filter((x: any) => x && typeof x.k === 'string' && x.k.length < 200 && Number.isFinite(x.at) && x.at > now - 60000 && x.at < now + 40 * 864e5)
        .map((x: any) => ({
          device_id: device, key: x.k, at: new Date(x.at).toISOString(),
          payload: { t: String(x.p?.t || '').slice(0, 200), b: String(x.p?.b || '').slice(0, 400), k: x.k, id: String(x.p?.id || '').slice(0, 80), occ: String(x.p?.occ || '').slice(0, 10), req: !!x.p?.req, s: !!x.p?.s, v: !!x.p?.v }
        }));
      await db.from('push_devices').upsert({ id: device, token: await sha(token), sub, updated_at: new Date().toISOString() });
      // sostituisce i promemoria non ancora inviati; quelli già inviati non si ripetono
      await db.from('push_queue').delete().eq('device_id', device).is('sent_at', null);
      if (rows.length) {
        const { error } = await db.from('push_queue').upsert(rows, { onConflict: 'device_id,key', ignoreDuplicates: true });
        if (error) throw error;
      }
      return json({ ok: true, n: rows.length });
    }
    return json({ error: 'azione sconosciuta' }, 400);
  } catch (e: any) {
    console.error(e);
    return json({ error: e?.message || 'errore' }, 500);
  }
});
