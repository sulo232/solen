/**
 * scripts/build-email-preview.mjs , emit a standalone, self-contained page showing
 * every transactional and lifecycle email.
 *
 * WHY a second delivery path when /dev/emails already exists: that page needs the Next
 * dev server running. This one is a single file that can be served statically and
 * tunnelled to a phone in seconds. It is NOT a second implementation: both read the
 * same catalogue (lib/email-preview-samples.ts) and both wrap bodies with the same
 * wrapEmailHtml() that sendEmail() uses, so neither can drift from what actually sends.
 *
 * Run: npx tsx scripts/build-email-preview.mjs
 * Out: public/_email-preview/index.html
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { wrapEmailHtml, EMAIL_FONT_STACK } from "../lib/email.ts";
import { EMAIL_PREVIEWS, EMAIL_PREVIEW_GROUPS } from "../lib/email-preview-samples.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../public/_email-preview/index.html");
const LOCALES = ["de", "en", "fr", "it"];

/** Mail clients render on their own white page with default margins. Mirror that, nothing more. */
function frameDoc(inner, pad = 16) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}img{max-width:100%}</style></head><body style="margin:0;padding:${pad}px;background:#ffffff">${inner}</body></html>`;
}

/**
 * PROPOSED shell, NOT APPLIED to any real email. This is the mockup half of the page:
 * the same untouched body, put inside a page frame, so the two can be compared side by
 * side before anything ships. Nothing here is imported by lib/email.ts.
 *
 * Every value is lifted from something that already exists, none invented:
 *   600px            already used by lib/email-templates/off-peak.ts
 *   #F4F4F5 / #0A0A0A / #6B6B6B / #E4E4E7   EMAIL_COLORS, mirrored from the LOCKFILE
 *   16px card radius the locked form/summary card radius
 *   "solen.ch"       the sign-off most templates already end with
 *
 * Tables, not modern layout: Outlook renders these with Word, which supports neither
 * flexbox nor grid. Open question for the owner, NOT decided here: there is no email
 * logo to use. public/logo.svg is an SVG (Gmail strips SVG) in the retired V2 palette
 * (#1A1209 ink, #043338 teal) and set in a font that no mail client will load, so it
 * would arrive as a broken box. A wordmark in text is used below instead.
 */
const INK_BUTTON =
  "display:inline-block;padding:13px 26px;background:#0A0A0A;color:#ffffff;border-radius:999px;" +
  "text-decoration:none;font-weight:600;font-size:15px";

/**
 * PROPOSED COPY, also not applied. Owner 2026-08-15: the emails are "a little bit too long".
 *
 * MEASURED before cutting, so this is not a vibe: bodies run 15 to 84 words, median 26. The
 * subjects are the worse half. Median 57 characters, longest 98, and 46 of 66 run past 45.
 * A phone inbox shows roughly the first 33 to 50 characters (Twilio, EmailToolTester, Backlinko
 * via Mailgenius all land in that band), so most of our subjects are cut off mid-sentence and
 * the useful word is past the cut. Every subject below front-loads the status in the first
 * 11 characters.
 *
 * Written for the three emails a customer actually gets around a booking. The rest keep their
 * current words inside the new frame, so this is a direction to react to, not a silent rewrite
 * of 66 templates.
 *
 * German is formal (Sie), per COPY_LAW. No em-dashes anywhere.
 */
const S = {
  service: "Damenhaarschnitt & Föhnen",
  salon: "Coiffure Belle Époque Niederdorf",
  short: "26. Aug, 14:30",
  long: { de: "Dienstag, 26. August, 14:30", en: "Tuesday 26 August, 14:30", fr: "Mardi 26 août, 14:30", it: "Martedì 26 agosto, 14:30" },
  address: "Niederdorfstrasse 42, 8001 Zürich",
  total: "CHF 89.00",
};

const PROPOSED_COPY = {
  "booking-confirmation": {
    art: `<img src="/_email-assets/confirm-mark.gif" width="70" height="70" alt="" style="display:block;margin:0 0 18px">`,
    subject: {
      de: `Bestätigt: ${S.short}`,
      en: `Confirmed: ${S.short}`,
      fr: `Confirmé: ${S.short}`,
      it: `Confermato: ${S.short}`,
    },
    head: { de: "Ihr Termin steht", en: "Your appointment is set", fr: "Votre rendez-vous est confirmé", it: "Il tuo appuntamento è confermato" },
    lines: (l) => [
      `<strong>${S.service}</strong>`,
      `${S.salon}`,
      `${S.long[l]}`,
      `${S.address}`,
      `${S.total} <span style="color:#6B6B6B">${{ de: "inkl. MWST", en: "incl. VAT", fr: "TVA incl.", it: "IVA incl." }[l]}</span>`,
    ],
    cta: { de: "Buchung verwalten", en: "Manage booking", fr: "Gérer la réservation", it: "Gestisci la prenotazione" },
  },
  "booking-cancellation": {
    art: `<img src="/_email-assets/cat-coiffeur-lg.png" width="84" height="84" alt="" style="display:block;margin:0 0 18px">`,
    subject: {
      de: `Storniert: ${S.short}`,
      en: `Cancelled: ${S.short}`,
      fr: `Annulé: ${S.short}`,
      it: `Annullato: ${S.short}`,
    },
    head: { de: "Termin storniert", en: "Appointment cancelled", fr: "Rendez-vous annulé", it: "Appuntamento annullato" },
    lines: (l) => [
      `<strong>${S.service}</strong>`,
      `${S.salon}, ${S.long[l]}`,
      `<span style="color:#6B6B6B">${{
        de: "Der Betrag wird in 5 bis 10 Tagen zurückerstattet.",
        en: "Your refund arrives in 5 to 10 days.",
        fr: "Le remboursement arrive sous 5 à 10 jours.",
        it: "Il rimborso arriva entro 5 a 10 giorni.",
      }[l]}</span>`,
    ],
    cta: { de: "Neuen Termin buchen", en: "Book a new time", fr: "Réserver un autre créneau", it: "Prenota un altro orario" },
  },
  "booking-reminder": {
    art: `<img src="/_email-assets/cat-coiffeur-lg.png" width="84" height="84" alt="" style="display:block;margin:0 0 18px">`,
    subject: {
      de: "Morgen 14:30: Ihr Termin",
      en: "Tomorrow 14:30: your appointment",
      fr: "Demain 14:30: votre rendez-vous",
      it: "Domani 14:30: il tuo appuntamento",
    },
    head: { de: "Bis morgen", en: "See you tomorrow", fr: "À demain", it: "A domani" },
    lines: () => [
      `<strong>${S.service}</strong>`,
      `${S.salon}`,
      `${S.address}`,
    ],
    cta: { de: "Route ansehen", en: "Get directions", fr: "Voir l'itinéraire", it: "Vedi il percorso" },
  },
};

/** The proposed body: art, one headline, short stacked facts, one button. */
function proposedBody(id, locale) {
  const c = PROPOSED_COPY[id];
  if (!c) return null;
  const lines = c
    .lines(locale)
    .map((t) => `<p style="margin:0 0 6px;font-size:15px;line-height:1.5">${t}</p>`)
    .join("");
  return (
    c.art +
    `<h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;font-weight:700;letter-spacing:-.02em">${c.head[locale]}</h1>` +
    lines +
    `<p style="margin:24px 0 0"><a href="https://solen.ch" style="${INK_BUTTON}">${c.cta[locale]}</a></p>`
  );
}

function proposedShell(bodyHtml, locale) {
  const FOOT = {
    de: "Sie erhalten diese E-Mail, weil Sie einen Termin über solen.ch gebucht haben.",
    en: "You are receiving this email because you booked an appointment through solen.ch.",
    fr: "Vous recevez cet e-mail car vous avez réservé un rendez-vous via solen.ch.",
    it: "Ricevi questa email perché hai prenotato un appuntamento tramite solen.ch.",
  }[locale];

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F4F5;margin:0;padding:24px 12px;font-family:${EMAIL_FONT_STACK}">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px">
      <tr><td style="padding:24px 28px 18px;font-family:${EMAIL_FONT_STACK}">
        <span style="font-size:20px;font-weight:700;color:#0A0A0A;letter-spacing:-.01em">solen.ch</span>
      </td></tr>
      <tr><td style="padding:0 28px"><div style="height:1px;background:#E4E4E7;line-height:1px">&nbsp;</div></td></tr>
      <tr><td style="padding:22px 28px 28px;color:#0A0A0A;font-size:15px;line-height:1.55;font-family:${EMAIL_FONT_STACK}">${bodyHtml}</td></tr>
    </table>
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
      <tr><td style="padding:16px 28px 8px;color:#6B6B6B;font-size:12px;line-height:1.5;font-family:${EMAIL_FONT_STACK}">${FOOT}</td></tr>
    </table>
  </td></tr>
</table>`;
}

// Build every template in every locale up front, in both treatments. A template with no
// locale parameter (admin notification, cold outreach) simply yields the same output four
// times, which is itself worth seeing.
const data = {};
const failures = [];
for (const entry of EMAIL_PREVIEWS) {
  data[entry.id] = {};
  for (const locale of LOCALES) {
    try {
      const payload = entry.build(locale);
      // Where proposed copy exists, the proposed view shows it. Where it does not, the email
      // keeps its current words inside the new frame, and the card says so.
      const rewritten = proposedBody(entry.id, locale);
      const proposedSubject = PROPOSED_COPY[entry.id]?.subject?.[locale] ?? payload.subject;
      data[entry.id][locale] = {
        subject: payload.subject,
        proposedSubject,
        rewritten: Boolean(rewritten),
        now: frameDoc(wrapEmailHtml(payload.html)),
        proposed: frameDoc(proposedShell(rewritten ?? payload.html, locale), 0),
        attachments: (payload.attachments ?? []).map((a) => a.filename),
      };
    } catch (err) {
      failures.push(`${entry.id} / ${locale}: ${err instanceof Error ? err.message : String(err)}`);
      const failed = frameDoc("<p>failed</p>");
      data[entry.id][locale] = { subject: "(failed to build)", proposedSubject: "(failed to build)", rewritten: false, now: failed, proposed: failed, attachments: [] };
    }
  }
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sections = EMAIL_PREVIEW_GROUPS.map((group) => {
  const entries = EMAIL_PREVIEWS.filter((e) => e.group === group);
  if (entries.length === 0) return "";
  const cards = entries
    .map(
      (e) => `
      <article class="card" id="${e.id}">
        <div class="card-head">
          <span class="name">${e.label}</span>
          <span class="chip">to the ${e.audience}</span>
          ${data[e.id].de.attachments.length ? `<span class="chip">${data[e.id].de.attachments.join(", ")} attached</span>` : ""}
          <code class="id">${e.id}</code>
        </div>
        <p class="subject"><span class="muted">Subject: </span><b data-subject="${e.id}"></b>
          <span class="len muted"></span>
          <span class="chip" data-rewritten="${e.id}" style="display:none">words unchanged, frame only</span></p>
        <div class="stage"><iframe title="${e.label}" data-frame="${e.id}" sandbox="allow-same-origin"></iframe></div>
      </article>`
    )
    .join("");
  return `<section id="${slug(group)}"><h2>${group}</h2>${cards}</section>`;
}).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Solen email preview</title>
<style>
  :root { --ink:#0A0A0A; --ink2:#6B6B6B; --border:#E4E4E7; --sunken:#F4F4F5; --accent:#276EF1; }
  * { box-sizing:border-box; -webkit-text-size-adjust:100%; }
  body { margin:0; background:var(--sunken); color:var(--ink);
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; }
  header { position:sticky; top:0; z-index:5; background:rgba(255,255,255,.96); border-bottom:1px solid var(--border);
           backdrop-filter:blur(8px); padding:14px 20px; padding-top:max(14px,env(safe-area-inset-top)); }
  h1 { margin:0; font-size:28px; font-weight:600; letter-spacing:-.02em; }
  .sub { margin:2px 0 0; font-size:13px; color:var(--ink2); }
  .rows { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  .toggle { display:flex; gap:4px; }
  .toggle button { appearance:none; border:0; background:transparent; color:var(--ink2);
                   font:inherit; font-size:13px; padding:7px 13px; border-radius:999px; cursor:pointer; min-height:44px; }
  .toggle button[aria-pressed="true"] { background:var(--sunken); color:var(--ink); font-weight:600; }
  main { max-width:1120px; margin:0 auto; padding:0 20px 96px; }
  nav.index { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:13px; padding:18px 0; }
  nav.index a { color:var(--accent); text-decoration:none; }
  nav.index a:hover { text-decoration:underline; }
  section { padding-top:36px; scroll-margin-top:120px; }
  section h2 { font-size:20px; font-weight:600; margin:0 0 14px; }
  .card { background:#fff; border-radius:24px; overflow:hidden; margin-bottom:22px; scroll-margin-top:120px; }
  .card-head { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 12px;
               padding:13px 16px; border-bottom:1px solid var(--border); }
  .name { font-size:15px; font-weight:600; }
  .chip { background:var(--sunken); color:var(--ink2); font-size:12px; padding:2px 9px; border-radius:999px; }
  .id { margin-left:auto; font-size:12px; color:var(--ink2); }
  .subject { margin:0; padding:13px 16px; border-bottom:1px solid var(--border); font-size:14px; }
  .muted { color:var(--ink2); }
  .stage { display:flex; justify-content:center; background:var(--sunken); padding:22px 12px; }
  iframe { border:0; background:#fff; border-radius:8px; width:700px; max-width:100%; height:260px; }
  body[data-w="phone"] iframe { width:390px; }
  @media (max-width: 560px) {
    header { padding:10px 14px; padding-top:max(10px,env(safe-area-inset-top)); }
    h1 { font-size:20px; }
    .sub { display:none; }
    /* All three toggles on ONE swipeable row: stacked they took 23% of a phone screen. */
    .rows { gap:2px; margin-top:6px; flex-wrap:nowrap; overflow-x:auto;
            -webkit-overflow-scrolling:touch; scrollbar-width:none; }
    .rows::-webkit-scrollbar { display:none; }
    .toggle { flex-wrap:nowrap; flex:0 0 auto; }
    .toggle + .toggle { margin-left:6px; padding-left:6px; border-left:1px solid var(--border); }
    .toggle button { padding:7px 11px; white-space:nowrap; }
    main { padding:0 12px 96px; }
    .stage { padding:14px 8px; }
  }
</style>
</head>
<body data-l="de" data-w="desktop" data-t="now">
<header>
  <h1>Email preview</h1>
  <p class="sub">${EMAIL_PREVIEWS.length} templates, exactly as they arrive. Sample content, nothing sends.</p>
  <div class="rows">
    <div class="toggle" id="loc">${LOCALES.map((l) => `<button data-l="${l}">${l.toUpperCase()}</button>`).join("")}</div>
    <div class="toggle" id="wid">
      <button data-w="desktop">Desktop 700</button>
      <button data-w="phone">Phone 390</button>
    </div>
    <div class="toggle" id="treat">
      <button data-t="now">What ships now</button>
      <button data-t="proposed">Proposed frame</button>
    </div>
  </div>
</header>

<main>
  <nav class="index">
    ${EMAIL_PREVIEW_GROUPS.map((g) => `<a href="#${slug(g)}">${g} (${EMAIL_PREVIEWS.filter((e) => e.group === g).length})</a>`).join("")}
  </nav>
  ${sections}
</main>

<script id="payload" type="application/json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
<script>
(function () {
  var DATA = JSON.parse(document.getElementById('payload').textContent);
  var body = document.body;

  function fit(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.documentElement) return;
      // Collapse first: scrollHeight never reports less than the frame's own height, so a
      // frame that has already grown can never shrink again (switching desktop to phone,
      // or to a shorter locale, would keep the tallest height forever).
      f.style.height = '0px';
      f.style.height = Math.max(120, d.documentElement.scrollHeight) + 'px';
    } catch (e) {}
  }

  function paint() {
    var l = body.dataset.l, t = body.dataset.t;
    document.querySelectorAll('[data-frame]').forEach(function (f) {
      var rec = DATA[f.getAttribute('data-frame')][l];
      f.srcdoc = t === 'proposed' ? rec.proposed : rec.now;
      f.addEventListener('load', function () { fit(f); }, { once: true });
    });
    document.querySelectorAll('[data-subject]').forEach(function (b) {
      var rec = DATA[b.getAttribute('data-subject')][l];
      b.textContent = t === 'proposed' ? rec.proposedSubject : rec.subject;
      var note = b.parentElement.querySelector('.len');
      if (note) {
        var n = (t === 'proposed' ? rec.proposedSubject : rec.subject).length;
        note.textContent = n + ' characters' + (n > 45 ? ', cut off on a phone' : '');
        note.style.color = n > 45 ? '#B45309' : '#6B6B6B';
      }
      var badge = document.querySelector('[data-rewritten="' + b.getAttribute('data-subject') + '"]');
      if (badge) badge.style.display = (t === 'proposed' && !rec.rewritten) ? 'inline' : 'none';
    });
    document.querySelectorAll('#loc button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.l === l));
    });
    document.querySelectorAll('#wid button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.w === body.dataset.w));
    });
    document.querySelectorAll('#treat button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.t === t));
    });
  }

  document.getElementById('loc').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    body.dataset.l = b.dataset.l; paint();
  });
  document.getElementById('treat').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    body.dataset.t = b.dataset.t; paint();
  });
  document.getElementById('wid').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    body.dataset.w = b.dataset.w; paint();
    setTimeout(function () { document.querySelectorAll('[data-frame]').forEach(fit); }, 60);
  });

  paint();
})();
</script>
</body>
</html>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, "utf-8");

console.log(`[email-preview] ${EMAIL_PREVIEWS.length} templates x ${LOCALES.length} locales -> ${OUT}`);
if (failures.length) {
  console.error(`[email-preview] ${failures.length} build failure(s):`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
