# AgendApp

<img src="icons/logo.svg" width="96" alt="Logo AgendApp">

Agenda personale chiara e dettagliata: calendario, appuntamenti, scadenze, pagamenti, compleanni, note e promemoria a schermo intero.
Funziona nel browser e si installa sul telefono come una vera app (PWA), anche offline.

## Funzioni

- **Calendario** con vista **settimanale, mensile e annuale**. Tocca un giorno per aprirlo: vedi tutti gli impegni, ne aggiungi di nuovi e scrivi gli **appunti del giorno**. Scorri a destra o a sinistra per cambiare periodo.
- **Festività italiane** segnate in rosso (comprese Pasqua e Pasquetta).
- **Tipologie**: Appuntamenti, Scadenze, Pagamenti (con importo e totali del mese/anno), Compleanni (con l'età), Note.
- **Aree della vita** con legenda dei colori nel calendario (tocca un'area per nasconderla o mostrarla): Personale, Lavoro, Salute, Mezzi, Casa, Famiglia e amici, Svago, Sport, Studio, Animali, Finanze, Altro.
- **Mezzi**: registra auto, moto, camper, furgone, barca e bicicletta, con targa. Per ogni mezzo hai i modelli rapidi (assicurazione, bollo, revisione, tagliando, gomme, rimessaggio…).
- **Ripetizioni**: ogni giorno, settimana, 2 settimane, mese, 2/3/6 mesi, anno, 2 anni, con data di fine.
- **Notifiche personalizzabili per ogni elemento**:
  - tipo di avviso: *schermo intero*, *banner* o *discreta*;
  - quando: all'ora, 5/15/30 minuti, 1/2 ore, 1/2/3 giorni, 1/2 settimane, 1 mese prima (anche più di uno);
  - suono e vibrazione attivabili;
  - posticipa di 5 min, 15 min, 1 ora o a domani; segna come fatto/pagato direttamente dall'avviso.
  - Valori predefiniti per tipologia nelle Impostazioni.
- **Centro notifiche** con lo storico degli avvisi.
- **Prossimi impegni**: riepilogo di oggi, settimana, importi da pagare, elementi in ritardo e ricerca.
- **Tema** chiaro, scuro o automatico.
- **Importazione da altri calendari**: file `.ics` o `.zip` (export di Google Calendar, Apple, Outlook, Samsung…), con ripetizioni e promemoria; reimportando non si creano doppioni.
- **Guida all'importazione** nell'app (Impostazioni → Come importare i tuoi calendari) per Google, Apple, Outlook, Samsung.
- **Sincronizzazione Google Calendar** automatica tramite un piccolo script Google (`google/AgendAppSync.gs`, istruzioni nell'app: Impostazioni → Google Calendar).
- **Aggiornamenti**: quando esce una nuova versione compaiono il tasto **Aggiorna** e un avviso con le novità.
- **Backup** (esporta/importa JSON) ed **esportazione calendario .ics** per Google Calendar, Apple Calendario e Outlook.

## Pubblicazione con GitHub Pages

1. Nel repository: **Settings → Pages**.
2. *Source*: **Deploy from a branch**, branch **main**, cartella **/ (root)** → Save.
3. Dopo un minuto l'app è online all'indirizzo `https://<utente>.github.io/<repository>/`.

Per installarla sul telefono: aprila con Chrome (Android) o Safari (iPhone) → menu → **Aggiungi a schermata Home**.

## Note sulle notifiche

Gli avvisi arrivano quando AgendApp è aperta o in secondo piano. Con **Notifiche ad app chiusa** (Impostazioni → Notifiche)
arrivano anche con l'app chiusa o il telefono in standby, tramite Web Push:

- l'app manda a un piccolo server (progetto Supabase `agendapp-push`, in Europa) titolo, orario e luogo dei promemoria dei prossimi 35 giorni, e li riaggiorna a ogni modifica;
- ogni minuto il server invia quelli in scadenza (`supabase/functions/agendapp-push`, pianificato con `pg_cron`);
- su iPhone funziona solo con AgendApp aggiunta alla schermata Home (iOS 16.4 o successivo).

Il resto dei dati resta sul dispositivo.

## Ripetizioni

Toccando una data di un impegno che si ripete puoi modificarla o eliminarla scegliendo **solo questa data**, **questa e le successive** o **tutta la serie**.

## Pubblicare un aggiornamento

Aumentare lo stesso numero di versione in `version.json`, in `data-version` di `js/aggiornamenti.js` dentro `index.html` e in `APP_VERSION` di `js/app.js`. Non serve toccare `sw.js`: l'app resta sulla versione installata finché l'utente non preme **Aggiorna**.

## Struttura

```
index.html            pagina principale
css/style.css         grafica
js/app.js             logica (calendario, sezioni, notifiche, dati, importazione)
js/aggiornamenti.js   avviso e tasto Aggiorna
version.json          versione pubblicata e novità
google/               script per la sincronizzazione con Google Calendar
sw.js                 service worker (offline e clic sulle notifiche)
manifest.webmanifest  installazione come app
icons/                logo e icone
```

## Collega le app (AgendApp · Smistino · Cartellina)

Dal tasto con i tre pallini collegati in alto (o da "Collega le app") le tre app lavorano insieme:

- **Smistino → AgendApp**: scadenze, pagamenti e appuntamenti trovati nei messaggi vanno in agenda; se li segni fatti in AgendApp, risultano fatti anche in Smistino.
- **Cartellina → AgendApp**: visite, esami e interventi vanno in agenda. **AgendApp → Cartellina**: gli impegni dell'area Salute arrivano in Cartellina.
- **Smistino → Cartellina**: le email e i messaggi della sezione Salute (e quelli mandati col tasto "Manda a Cartellina") vengono letti da Cartellina. **Cartellina → Smistino**: medici e ospedali della rubrica finiscono sempre in Salute.

Modalità **automatica** (a ogni modifica e all'apertura) o **manuale** (tasto "Condividi e ricevi ora").
Le app stanno sullo stesso indirizzo `utente.github.io`, quindi sullo stesso telefono si scambiano i dati senza server (file `js/ponte.js`, identico nelle tre app).
Su un altro dispositivo, o su iPhone (dove ogni app sulla Home ha il suo salvataggio separato), si usa **Esporta / Importa pacchetto**.
