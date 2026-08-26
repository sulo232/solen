/**
 * scripts/build-email-preview-v2.mjs , renders the v2 frame against three real emails, in all
 * three shapes, in all four locales, on one page.
 *
 * OWNER, 2026-08-26: 26 screenshots of his own inbox (Bolt + Klarna), "make it like this," and
 * separately, about the estate as it stood: the emails are too long. That second complaint is
 * why every string below is short , the copy law's economy rules, not decoration.
 *
 * WHY THIS EXISTS ALONGSIDE build-email-preview.mjs (v1's all-templates page): that page shows
 * every REAL template through the REAL wrapEmailHtml() shell, which is exactly right for
 * auditing what already ships. Nothing here ships. This is the mockup half , three emails held
 * constant, only the frame changing, so a shape can be picked before any of it touches
 * lib/email.ts. Same relationship v1's build-email-directions.mjs had to the object/type/
 * scene/band chooser, just for the frame instead of the picture.
 *
 * Run: npx tsx scripts/build-email-preview-v2.mjs (see _email-frame-v2.mjs for why plain node
 *      cannot resolve the `@/` import inside lib/email.ts)
 * Out: public/_email-preview/v2.html
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { framedEmail, frameDoc, INK, INK2, SUNKEN, WHITE } from "./_email-frame-v2.mjs";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/_email-preview/v2.html");
const LOCALES = ["de", "en", "fr", "it"];
const TREATMENTS = ["band", "plain", "object"];

const ART = {
  confirmed: "/_email-assets/art/art-confirmed.jpg",
  cancelled: "/_email-assets/art/art-cancelled.jpg",
  reminder: "/_email-assets/art/art-reminder.jpg",
};
const OBJECT = {
  confirmed: "/_email-assets/art/obj-confirmed.png",
  cancelled: "/_email-assets/art/obj-cancelled.png",
  reminder: "/_email-assets/art/obj-reminder.png",
};

// Same fixed content the booking-card picture already carries (scripts/build-email-art.mjs),
// so the words around the picture never contradict it.
const SALON = "Coiffure Belle Époque Niederdorf";
const ADDRESS = "Niederdorfstrasse 42, 8001 Zürich";
const AMOUNT = "CHF 89.00";
// The art is a flattened picture baked in German regardless of locale (no venue photography
// or per-locale service name exists to draw from yet, see build-email-art.mjs's own PHOTO
// note). Showing a translated service name in the surrounding copy while the picture still
// reads German would contradict itself, so the reminder's service row stays German in every
// locale on purpose , not a missed translation.
const SERVICE_DE = "Damenhaarschnitt & Föhnen";

const WHEN = {
  de: "Di, 26. August, 14:30",
  en: "Tue, Aug 26, 14:30",
  fr: "Mar 26 août, 14:30",
  it: "Mar 26 ago, 14:30",
};

const CTA_MANAGE = { de: "Buchung verwalten", en: "Manage booking", fr: "Gérer la réservation", it: "Gestisci la prenotazione" };
const CTA_REBOOK = {
  de: "Neuen Termin buchen",
  en: "Book a new appointment",
  fr: "Réserver un nouveau rendez-vous",
  it: "Prenota un nuovo appuntamento",
};
const LABEL_WHEN = { de: "Wann", en: "When", fr: "Quand", it: "Quando" };
const LABEL_WHERE = { de: "Wo", en: "Where", fr: "Où", it: "Dove" };
const LABEL_AMOUNT = { de: "Betrag", en: "Amount", fr: "Montant", it: "Importo" };
const LABEL_SERVICE = { de: "Was", en: "Service", fr: "Prestation", it: "Servizio" };

const EMAILS = [
  {
    id: "confirmed",
    art: ART.confirmed,
    object: OBJECT.confirmed,
    subject: {
      de: "Bestätigt: 26. Aug, 14:30",
      en: "Confirmed: Aug 26, 14:30",
      fr: "Confirmé : 26 août, 14h30",
      it: "Confermato: 26 ago, 14:30",
    },
    preheader: {
      de: `${SALON}, ${ADDRESS.split(",")[0]}.`,
      en: `${SALON}, ${ADDRESS.split(",")[0]}.`,
      fr: `${SALON}, ${ADDRESS.split(",")[0]}.`,
      it: `${SALON}, ${ADDRESS.split(",")[0]}.`,
    },
    eyebrow: { de: "Buchung bestätigt", en: "Booking confirmed", fr: "Réservation confirmée", it: "Prenotazione confermata" },
    headline: {
      de: "Ihr Termin steht",
      en: "Your appointment is set",
      fr: "Votre rendez-vous est confirmé",
      it: "Il Suo appuntamento è confermato",
    },
    rows: (l) => [
      { label: LABEL_WHEN[l], value: WHEN[l] },
      { label: LABEL_WHERE[l], value: ADDRESS },
      { label: LABEL_AMOUNT[l], value: AMOUNT },
    ],
    cta: CTA_MANAGE,
    note: null,
  },
  {
    id: "cancelled",
    art: ART.cancelled,
    object: OBJECT.cancelled,
    subject: {
      de: "Storniert: 26. Aug, 14:30",
      en: "Cancelled: Aug 26, 14:30",
      fr: "Annulé : 26 août, 14h30",
      it: "Annullato: 26 ago, 14:30",
    },
    preheader: {
      de: "Die Rückerstattung ist unterwegs.",
      en: "Your refund is on its way.",
      fr: "Votre remboursement est en cours.",
      it: "Il rimborso è in corso.",
    },
    eyebrow: { de: "Buchung storniert", en: "Booking cancelled", fr: "Réservation annulée", it: "Prenotazione annullata" },
    headline: {
      de: "Termin storniert",
      en: "Appointment cancelled",
      fr: "Rendez-vous annulé",
      it: "Appuntamento annullato",
    },
    rows: (l) => [
      { label: LABEL_WHEN[l], value: WHEN[l] },
      { label: LABEL_WHERE[l], value: ADDRESS },
    ],
    cta: CTA_REBOOK,
    note: {
      de: "Die Rückerstattung erfolgt innert 5 Werktagen.",
      en: "The refund will be processed within 5 business days.",
      fr: "Le remboursement sera effectué sous 5 jours ouvrés.",
      it: "Il rimborso sarà elaborato entro 5 giorni lavorativi.",
    },
  },
  {
    id: "reminder",
    art: ART.reminder,
    object: OBJECT.reminder,
    subject: {
      de: "Morgen 14:30: Ihr Termin",
      en: "Reminder: tomorrow at 14:30",
      fr: "Rappel : demain à 14h30",
      it: "Promemoria: domani alle 14:30",
    },
    preheader: {
      de: `${SALON}, ${ADDRESS.split(",")[0]}.`,
      en: `${SALON}, ${ADDRESS.split(",")[0]}.`,
      fr: `${SALON}, ${ADDRESS.split(",")[0]}.`,
      it: `${SALON}, ${ADDRESS.split(",")[0]}.`,
    },
    eyebrow: { de: "Terminerinnerung", en: "Appointment reminder", fr: "Rappel de rendez-vous", it: "Promemoria appuntamento" },
    headline: {
      de: "Morgen um 14:30",
      en: "Tomorrow at 14:30",
      fr: "Demain à 14h30",
      it: "Domani alle 14:30",
    },
    rows: (l) => [
      { label: LABEL_SERVICE[l], value: SERVICE_DE },
      { label: LABEL_WHERE[l], value: ADDRESS },
    ],
    cta: CTA_MANAGE,
    note: null,
  },
];

// Every subject must clear the phone-truncation floor before anything renders. Fail loudly and
// name the exact offender rather than silently shipping a page with a truncated-looking claim.
const OFFENDERS = [];
for (const email of EMAILS) {
  for (const locale of LOCALES) {
    const s = email.subject[locale];
    if (s.length >= 45) OFFENDERS.push(`${email.id}.${locale}: "${s}" (${s.length} chars, limit 45)`);
  }
}
if (OFFENDERS.length > 0) {
  console.error("[build-email-preview-v2] subject(s) too long for a phone:\n  " + OFFENDERS.join("\n  "));
  process.exit(1);
}

const TREATMENT_META = {
  band: {
    label: "Band",
    desc: "The Bolt receipt shape: colour block plus the booking card photographed from the app.",
  },
  plain: {
    label: "Plain",
    desc: "The Klarna shape: no block, headline leads straight on white.",
  },
  object: {
    label: "Object",
    desc: "The Bolt receipt shape again, with a made-for-us 3D object breaking out of the block.",
  },
};

/** One frame: an iframe per locale, only one visible at a time (JS below toggles data-locale). */
function frameGroup(email, treatment) {
  const perLocale = LOCALES.map((locale) => {
    const html = framedEmail({
      locale,
      treatment,
      preheader: email.preheader[locale],
      eyebrow: email.eyebrow[locale],
      headline: email.headline[locale],
      art: treatment === "object" ? null : email.art,
      object: treatment === "object" ? email.object : null,
      rows: email.rows(locale),
      cta: { label: email.cta[locale], href: "https://solen.ch" },
      note: email.note ? email.note[locale] : null,
    });
    const subject = email.subject[locale];
    const srcdoc = frameDoc(html, 0).replace(/"/g, "&quot;");
    return `<div class="locale-variant" data-locale="${locale}">
      <p class="caption">${subject} <span class="chars">(${subject.length} chars)</span></p>
      <iframe title="${email.id} ${treatment} ${locale}" data-autosize="1" sandbox="allow-same-origin" srcdoc="${srcdoc}"></iframe>
    </div>`;
  }).join("");
  return `<div class="frame-wrap" data-email="${email.id}" data-treatment="${treatment}">${perLocale}</div>`;
}

const columns = TREATMENTS.map((t) => {
  const meta = TREATMENT_META[t];
  const frames = EMAILS.map((email) => frameGroup(email, t)).join("");
  return `<section class="col" data-treatment="${t}">
    <div class="col-head"><h2>${meta.label}</h2><p class="desc">${meta.desc}</p></div>
    ${frames}
  </section>`;
}).join("");

const localeButtons = LOCALES.map(
  (l, i) => `<button type="button" class="switch-btn" data-locale-btn="${l}" ${i === 0 ? 'aria-pressed="true"' : ""}>${l}</button>`
).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Email frame v2</title>
<style>
  * { box-sizing:border-box; -webkit-text-size-adjust:100%; }
  html, body { margin:0; overflow-x:hidden; }
  body { background:${SUNKEN}; color:${INK};
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; }
  header { padding:22px 20px 14px; padding-top:max(22px,env(safe-area-inset-top)); max-width:1400px; margin:0 auto; }
  h1 { margin:0; font-size:26px; font-weight:600; letter-spacing:-.02em; }
  .sub { margin:6px 0 0; font-size:14px; color:${INK2}; max-width:70ch; line-height:1.5; }
  .switches { display:flex; flex-wrap:wrap; gap:16px; margin-top:16px; }
  .switch-group { display:flex; align-items:center; gap:6px; background:${WHITE}; border-radius:999px; padding:4px; }
  .switch-btn { border:0; background:transparent; padding:7px 14px; border-radius:999px; font-size:13px;
                font-weight:600; color:${INK2}; cursor:pointer; text-transform:capitalize; }
  .switch-btn[aria-pressed="true"] { background:${INK}; color:${WHITE}; }
  main { max-width:1400px; margin:0 auto; padding:6px 20px 80px;
         display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:start; }
  .col { background:${WHITE}; border-radius:20px; padding:18px 16px 20px; min-width:0; }
  .col-head h2 { margin:0; font-size:18px; font-weight:600; }
  .col-head .desc { margin:6px 0 18px; font-size:13px; line-height:1.5; color:${INK2}; }
  .frame-wrap { margin-bottom:22px; }
  .frame-wrap:last-child { margin-bottom:0; }
  .frame-wrap::before { content: attr(data-email); display:block; font-size:11px; font-weight:700;
                         text-transform:uppercase; letter-spacing:.04em; color:${INK2}; margin-bottom:8px; }
  .locale-variant { display:none; }
  .locale-variant.active { display:block; }
  .caption { margin:0 0 6px; font-size:12px; color:${INK2}; }
  .caption .chars { color:${INK2}; opacity:.7; }
  iframe { width:100%; max-width:390px; height:400px; border:0; border-radius:12px; background:${WHITE};
           display:block; margin:0 auto; transition:max-width .15s ease; }
  body[data-width="desktop"] iframe { max-width:700px; }
  @media (max-width: 1100px) { main { grid-template-columns:1fr; } }
  @media (max-width: 640px)  { main { padding:6px 12px 80px; } header { padding:16px 14px 4px; } h1 { font-size:22px; } }
</style>
</head>
<body data-width="phone">
<header>
  <h1>Email frame, v2</h1>
  <p class="sub">Three real emails (confirmed, cancelled, reminder), three shapes (Band, Plain, Object), four locales. Only the frame changes between columns; the content is held constant.</p>
  <div class="switches">
    <div class="switch-group" data-switch="locale">${localeButtons}</div>
    <div class="switch-group" data-switch="width">
      <button type="button" class="switch-btn" data-width-btn="phone" aria-pressed="true">Phone 390</button>
      <button type="button" class="switch-btn" data-width-btn="desktop">Desktop 700</button>
    </div>
  </div>
</header>
<main>${columns}</main>
<script>
(function () {
  // Locale switch: show only the matching .locale-variant in every frame-wrap.
  function setLocale(l) {
    document.querySelectorAll('.locale-variant').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-locale') === l);
    });
    document.querySelectorAll('[data-locale-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-locale-btn') === l));
    });
    resizeAll();
  }
  document.querySelectorAll('[data-locale-btn]').forEach(function (b) {
    b.addEventListener('click', function () { setLocale(b.getAttribute('data-locale-btn')); });
  });

  // Width switch: toggles a body attribute the CSS above keys off.
  document.querySelectorAll('[data-width-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var w = b.getAttribute('data-width-btn');
      document.body.setAttribute('data-width', w);
      document.querySelectorAll('[data-width-btn]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      resizeAll();
    });
  });

  // Same auto-height script build-email-directions.mjs already proved out, reused as-is: the
  // f.style.height='0px' reset before measuring is load-bearing, without it a frame can only
  // grow, never shrink back down when its content gets shorter (real bug, fixed there first).
  function fit(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.documentElement) return;
      f.style.height = '0px';
      f.style.height = Math.max(200, d.documentElement.scrollHeight) + 'px';
    } catch (e) {}
  }
  function resizeAll() {
    document.querySelectorAll('.locale-variant.active iframe[data-autosize]').forEach(fit);
  }
  function all() {
    document.querySelectorAll('iframe[data-autosize]').forEach(function (f) {
      fit(f); f.addEventListener('load', function () { fit(f); });
    });
  }
  window.addEventListener('load', all);
  window.addEventListener('resize', resizeAll);
  setLocale('de');
  all();
})();
</script>
</body>
</html>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, "utf-8");
console.log(`[build-email-preview-v2] ${EMAILS.length} emails x ${TREATMENTS.length} treatments x ${LOCALES.length} locales -> ${OUT}`);
