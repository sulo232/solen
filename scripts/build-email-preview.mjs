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
function frameDoc(inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;background:#ffffff">${inner}</body></html>`;
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
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px">
      <tr><td style="padding:24px 28px 18px;font-family:${EMAIL_FONT_STACK}">
        <span style="font-size:20px;font-weight:700;color:#0A0A0A;letter-spacing:-.01em">solen.ch</span>
      </td></tr>
      <tr><td style="padding:0 28px"><div style="height:1px;background:#E4E4E7;line-height:1px">&nbsp;</div></td></tr>
      <tr><td style="padding:22px 28px 28px;color:#0A0A0A;font-size:15px;line-height:1.55;font-family:${EMAIL_FONT_STACK}">${bodyHtml}</td></tr>
    </table>
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">
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
      data[entry.id][locale] = {
        subject: payload.subject,
        now: frameDoc(wrapEmailHtml(payload.html)),
        proposed: frameDoc(proposedShell(payload.html, locale)),
        attachments: (payload.attachments ?? []).map((a) => a.filename),
      };
    } catch (err) {
      failures.push(`${entry.id} / ${locale}: ${err instanceof Error ? err.message : String(err)}`);
      const failed = frameDoc("<p>failed</p>");
      data[entry.id][locale] = { subject: "(failed to build)", now: failed, proposed: failed, attachments: [] };
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
        <p class="subject"><span class="muted">Subject: </span><b data-subject="${e.id}"></b></p>
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
                   font:inherit; font-size:13px; padding:7px 13px; border-radius:999px; cursor:pointer; min-height:36px; }
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
      b.textContent = DATA[b.getAttribute('data-subject')][l].subject;
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
