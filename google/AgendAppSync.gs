/**
 * AgendApp — sincronizzazione con Google Calendar
 *
 * 1. Vai su https://script.google.com → Nuovo progetto → incolla tutto questo codice.
 * 2. Cambia la CHIAVE qui sotto con una parola segreta a tua scelta.
 * 3. Esegui una volta la funzione "prova" (▶) e concedi l'accesso al calendario.
 * 4. Pubblica → Nuovo deployment → tipo "App web"
 *      Esegui come: Me    —    Chi ha accesso: Chiunque
 * 5. Copia l'URL dell'app web e incollalo in AgendApp (Impostazioni → Google Calendar) insieme alla chiave.
 *
 * Lo script legge soltanto i tuoi calendari: non modifica nulla.
 */
const CHIAVE = 'cambia-questa-chiave';
const GIORNI_INDIETRO = 30;
const GIORNI_AVANTI = 365;

function doGet(e) {
  if (!e || !e.parameter || e.parameter.k !== CHIAVE) return risposta({ error: 'chiave non valida' });
  return risposta(leggiEventi());
}

function leggiEventi() {
  const tz = Session.getScriptTimeZone();
  const ora = new Date();
  const da = new Date(ora.getTime() - GIORNI_INDIETRO * 864e5);
  const a = new Date(ora.getTime() + GIORNI_AVANTI * 864e5);
  const out = { generated: ora.toISOString(), calendars: [], events: [] };
  CalendarApp.getAllCalendars().forEach(function (c) {
    if (c.isHidden()) return;
    out.calendars.push({ id: c.getId(), name: c.getName(), color: c.getColor() });
    c.getEvents(da, a).forEach(function (ev) {
      const allDay = ev.isAllDayEvent();
      const s = allDay ? ev.getAllDayStartDate() : ev.getStartTime();
      const f = allDay ? ev.getAllDayEndDate() : ev.getEndTime();
      let promemoria = [];
      try { promemoria = ev.getPopupReminders(); } catch (x) { /* nessuno */ }
      out.events.push({
        id: ev.getId() + '|' + Utilities.formatDate(s, tz, "yyyyMMdd'T'HHmm"),
        cal: c.getId(),
        calName: c.getName(),
        title: ev.getTitle(),
        desc: ev.getDescription(),
        loc: ev.getLocation(),
        allDay: allDay,
        start: Utilities.formatDate(s, tz, allDay ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"),
        end: Utilities.formatDate(f, tz, allDay ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"),
        reminders: promemoria
      });
    });
  });
  return out;
}

function risposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Esegui questa funzione una volta per autorizzare l'accesso ai calendari. */
function prova() {
  const r = leggiEventi();
  Logger.log('Calendari: ' + r.calendars.length + ' — eventi: ' + r.events.length);
}
