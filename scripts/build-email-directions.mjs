/**
 * scripts/build-email-directions.mjs , four art directions for the same email, side by side.
 *
 * Owner 2026-08-15: *"maybe a picture. Like, actually, like, design, you know, for the email,
 * like, instead of just this blank text."* Plus he asked for ideas rather than one answer, so
 * this is a chooser: the SAME confirmation email, four ways, one screen, pick one.
 *
 * The frame is imported from _email-proposal.mjs, not copied, so a decision made here stays
 * true of the all-emails preview.
 *
 * Where each picture comes from, since "our own made everything" was the ask:
 *   OBJECT  public/icons/categories/v2/*.png , his 3D objects, already in the repo, resized.
 *   TYPE    no picture at all.
 *   SCENE   generated 2026-08-15 to match those same objects (matte clay, white ground, one
 *           warm accent). Ours, made for this, not stock. 2 credits.
 *   BAND    the same object over a flat colour block.
 *
 * Run: npx tsx scripts/build-email-directions.mjs
 * Out: public/_email-preview/directions.html
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { proposedShell, frameDoc, INK_BUTTON, INK, INK2, SUNKEN } from "./_email-proposal.mjs";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/_email-preview/directions.html");

// One email, held constant across all four, so the only variable is the art.
const M = {
  head: "Ihr Termin steht",
  lines: [
    "<strong>Damenhaarschnitt &amp; Föhnen</strong>",
    "Coiffure Belle Époque Niederdorf",
    "Dienstag, 26. August, 14:30",
    "Niederdorfstrasse 42, 8001 Zürich",
    'CHF 89.00 <span style="color:#6B6B6B">inkl. MWST</span>',
  ],
  cta: "Buchung verwalten",
};

const facts = M.lines.map((t) => `<p style="margin:0 0 6px;font-size:15px;line-height:1.5">${t}</p>`).join("");
const button = `<p style="margin:24px 0 0"><a href="https://solen.ch" style="${INK_BUTTON}">${M.cta}</a></p>`;
const h = (size) =>
  `<h1 style="margin:0 0 14px;font-size:${size}px;line-height:1.1;font-weight:700;letter-spacing:-.02em">${M.head}</h1>`;

const DIRECTIONS = [
  {
    id: "object",
    name: "Object",
    idea: "Your 3D object, big, above the headline. Playful, unmistakably ours, and it already exists for every category.",
    cost: "Nothing to make. Four objects are in the repo today.",
    body:
      `<img src="/_email-assets/cat-coiffeur-lg.png" width="84" height="84" alt="" style="display:block;margin:0 0 18px">` +
      h(28) + facts + button,
  },
  {
    id: "type",
    name: "Type",
    idea: "No picture at all. The status IS the art, set big. Loads instantly, never breaks, reads as confident rather than decorated.",
    cost: "Nothing to make, and nothing to maintain in four languages.",
    body: `<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${INK2};letter-spacing:.02em">Buchung bestätigt</p>` +
      h(44) + facts + button,
  },
  {
    id: "scene",
    name: "Scene",
    idea: "A made-for-us 3D scene of the moment itself, a chair and a mirror, sitting on a tinted band across the top. The warmest of the four.",
    cost: "One picture per moment, made in the same style as your objects. Confirmed, cancelled, reminder, and a few more.",
    bleed:
      `<div style="background:${SUNKEN};text-align:center;padding:18px 0 6px">` +
      `<img src="/_email-assets/generated/scene-a.png" width="168" height="168" alt="" style="display:block;margin:0 auto">` +
      `</div>`,
    body: h(28) + facts + button,
  },
  {
    id: "band",
    name: "Band",
    idea: "A flat colour block across the top with the object sitting in it. The most graphic, and the colour can carry the meaning: green confirmed, warm for cancelled.",
    cost: "Nothing to make. Same objects, one colour value per state.",
    bleed:
      `<div style="background:#16A34A;text-align:center;padding:22px 0">` +
      `<img src="/_email-assets/cat-coiffeur-lg.png" width="84" height="84" alt="" style="display:block;margin:0 auto">` +
      `</div>`,
    body: h(28) + facts + button,
  },
];

const cards = DIRECTIONS.map(
  (d, i) => `
  <article class="col">
    <div class="head">
      <span class="n">${i + 1}</span>
      <h2>${d.name}</h2>
      ${d.id === "type" ? '<span class="pick">my pick</span>' : ""}
    </div>
    <p class="idea">${d.idea}</p>
    <p class="cost">${d.cost}</p>
    <iframe title="${d.name}" srcdoc="${frameDoc(proposedShell(d.body, "de", { bleed: d.bleed }), 0)
      .replace(/"/g, "&quot;")}" data-autosize="1"></iframe>
  </article>`
).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Email art directions</title>
<style>
  * { box-sizing:border-box; -webkit-text-size-adjust:100%; }
  body { margin:0; background:${SUNKEN}; color:${INK};
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; }
  header { padding:22px 20px 6px; padding-top:max(22px,env(safe-area-inset-top)); max-width:1400px; margin:0 auto; }
  h1 { margin:0; font-size:30px; font-weight:600; letter-spacing:-.02em; }
  .sub { margin:6px 0 0; font-size:14px; color:${INK2}; max-width:60ch; line-height:1.5; }
  main { max-width:1400px; margin:0 auto; padding:18px 20px 80px;
         display:grid; grid-template-columns:repeat(4,1fr); gap:18px; align-items:start; }
  .col { background:#fff; border-radius:20px; padding:18px 16px 16px; }
  .head { display:flex; align-items:center; gap:8px; }
  .n { width:24px; height:24px; border-radius:999px; background:${SUNKEN}; color:${INK};
       font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .head h2 { margin:0; font-size:18px; font-weight:600; }
  .pick { margin-left:auto; font-size:12px; font-weight:600; color:#16A34A; }
  .idea { margin:10px 0 0; font-size:14px; line-height:1.5; }
  .cost { margin:8px 0 14px; font-size:13px; line-height:1.5; color:${INK2}; }
  iframe { width:100%; height:520px; border:0; border-radius:12px; background:#fff; display:block; }
  @media (max-width: 1100px) { main { grid-template-columns:repeat(2,1fr); } }
  @media (max-width: 640px)  { main { grid-template-columns:1fr; padding:14px 12px 80px; }
                               header { padding:16px 14px 4px; } h1 { font-size:24px; } }
</style>
</head>
<body>
<header>
  <h1>Four ways the emails could look</h1>
  <p class="sub">The same confirmation email, four times. Only the picture changes, so the choice is about the art and nothing else.</p>
</header>
<main>${cards}</main>
<script>
(function () {
  function fit(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.documentElement) return;
      f.style.height = '0px';
      f.style.height = Math.max(300, d.documentElement.scrollHeight) + 'px';
    } catch (e) {}
  }
  function all() { document.querySelectorAll('iframe[data-autosize]').forEach(function (f) {
    fit(f); f.addEventListener('load', function () { fit(f); });
  }); }
  window.addEventListener('load', all);
  window.addEventListener('resize', all);
  all();
})();
</script>
</body>
</html>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, "utf-8");
console.log(`[email-directions] ${DIRECTIONS.length} directions -> ${OUT}`);
