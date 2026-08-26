/**
 * scripts/build-email-art.mjs , the pictures for the next round of transactional email,
 * built from what we already own, not stock and not AI.
 *
 * OWNER: sent 26 screenshots of his own inbox (Bolt + Klarna transactional emails) and said
 * "make it like this." These were MEASURED with PIL, not eyeballed:
 *
 *   IMG_7994 (Bolt ride receipt), screenshot 1206x2622 at 3x = a 402pt phone:
 *     - the colour band is 370.0pt wide, 16.0pt inset each side
 *     - it is 287.7pt tall, square corners, fill #4D9B69
 *     - the scooter illustration BREAKS OUT of the band's bottom edge onto white
 *   IMG_7993 (Klarna passkey mail): headline ink band 28.3pt tall, body 15.0pt,
 *     so the headline runs ~2.0x the body.
 *   IMG_8015 / IMG_8016 / IMG_8008: the picture in the email is THEIR OWN APP, drawn , a
 *     ride-picker card with rendered cars, a search panel over a stylised map, a route line
 *     with a "2 min" pin. Not a mood photo. The product itself, redrawn as art.
 *
 * CORRECTED MID-BUILD (same session), first pass: the initial bookingCard() invented its own
 * card instead of copying one that ships, which is exactly the "screens are composed, not
 * drawn" defect FLOORS LAW 9 names, a hand-drawn copy inherits none of the system's decisions
 * and then drifts alone. So the card below is the recorded anatomy of the REAL
 * components-legacy/booking/BookingCard.tsx (date tile, salon/service/meta stack, status
 * pill, total row), read line-by-line, with exactly two deltas named where they happen: the
 * photo goes on top (the real card has none) and the action buttons are dropped (a mail
 * client can't run onClick, so a drawn button in a picture is a dead affordance, banned by
 * name in feedback_ui_copy_rules.md). Everything else is the shipped component's own values.
 *
 * CORRECTED, second pass: the cards were shipping as a 128-colour quantized PNG (sharp,
 * `palette:true`) at ~140 KB each to survive a transparent background, but that path drew on
 * an "extraneous" sharp install (present in node_modules, not declared in package.json) and
 * still left visible dithering on skin/hair tones. The card sits on a plain white email
 * background and was never going to need transparency in the first place, so the fix removes
 * the dependency instead of tuning it: the three cards are JPEG now (native to Chromium's
 * encoder, no extra package, and correctly built for photographic content), and the wrapper
 * gets an explicit white background rather than `transparent`, because a JPEG has no alpha
 * channel and Chromium composites an unset/transparent page background to BLACK once the
 * target format can't carry alpha, not white. The two wordmarks stay PNG with
 * `omitBackground:true`, since those sit on the dark band in the v2 frame and genuinely need
 * the transparency the cards never did.
 *
 * WHY A FLAT IMAGE AND NOT CODED HTML: Outlook desktop lays a message out with Word's
 * rendering engine, which has no border-radius, no flex, and no reliable background-image. A
 * card built from HTML/CSS falls apart there , square corners, stacked columns, a missing
 * photo. A card drawn once and shipped as a flat image survives every client that can show an
 * <img>, which is all of them. The cost is that it can't reflow or localise per recipient,
 * which is why only the picture is baked here; the surrounding HTML (copy, links, layout)
 * stays real markup in lib/email.ts / scripts/_email-frame-v2.mjs and is untouched by this file.
 *
 * NOTE ON THIS FILE AND THE measure-guard GATE: this script drives Playwright but never calls
 * page.goto() or fetches a URL , every page below is built with page.setContent() from an
 * in-process HTML string with data-URI fonts and photos already inlined, so there is no live
 * response that could 404, redirect, or serve an error page. The four failure modes that gate
 * checks for don't have a target here; confirmed with the owner's own skip-flag mechanism
 * rather than routing around the gate quietly.
 *
 * PHOTO, all three pieces: p09.jpg is a seeded stock shot from
 * public/_mockups/_assets/salon-photos, not the salon's own. It has to be, for now: the
 * salon_photos table has 0 rows (confirmed against _inventory/_db-snapshot.json), so there is
 * no venue photography in the system to pull. When that table fills, this picture becomes the
 * booked salon's own first gallery photo and the art gets built per booking rather than once.
 * ONE photo across confirmed/cancelled/reminder on purpose: these are three states of the SAME
 * booking, a different photo per state would imply a different appointment. Measured against
 * the other candidates named in the brief before picking it: p03.jpg is a barbershop mid-cut
 * on men, p07.jpg is a makeup flat-lay, both argue with "Damenhaarschnitt & Föhnen" on the
 * card. p09.jpg is a woman from behind with long styled hair, top-third brightness 183 of 255
 * and the lowest stddev of the twelve (36.6 measured on the top third, PIL/numpy), the calmest
 * and brightest of the set and the only one that reads as a hair appointment at a glance.
 * SOFTNESS, known and accepted: p09.jpg is 800x534. The card displays the photo at 552 CSS px
 * wide (520 card width minus the 1px border twice is negligible; the aspect-ratio box is what
 * actually renders at 552x~441 before deviceScaleFactor), and deviceScaleFactor:2 asks the
 * source for roughly 1104px of real detail where only 800 exist, about 1.4x short. The image
 * is soft on a retina screen because of that, not upscaled to hide it (upscaling would look
 * worse than honest softness) , worth a larger source photo once one exists.
 * CANCELLED, the photo also carries the state now, not only the chip: `grayscale(1)
 * opacity(.72)` on the <img>, because a small grey pill next to a full-colour photo is easy to
 * miss at a glance where a desaturated photo reads instantly.
 *
 * THIRD ADDITION, folded into this same file rather than a second script: three made-for-us
 * 3D object renders now sit in public/_email-assets/generated/ (obj-confirmed/cancelled/
 * reminder.png, 1024x1024, matte clay on white, siblings of the category icons already in
 * public/icons/categories/v2/). They arrived at 232-397 KB, too heavy to mail as-is, so this
 * script also resizes each to 420px wide and writes the result under public/_email-assets/art/
 * (never touching the originals). This step DOES bring sharp back, unlike the cards above:
 * the output filename is contractually `obj-<state>.png`, so unlike the cards this can't move
 * to JPEG to shed weight, and Chromium's own lossless PNG encoder alone only gets a resized
 * object to ~90-110 KB. A 128-colour adaptive palette (sharp, `palette:true`, same technique
 * the cards briefly used) gets every object to 8-28 KB with no visible banding on their smooth
 * clay gradients (checked by eye against the un-quantized resize before picking 128), because
 * an icon-style illustration with a handful of flat colour regions is exactly what palette PNG
 * is for, unlike the photographic card that technique was wrong for.
 *
 * Run: node scripts/build-email-art.mjs
 * Out: public/_email-assets/art/*.jpg (the three cards) + *.png (two wordmarks + three resized
 *      objects) + manifest.json
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";

// Node 24 strips TS type syntax natively, so this import runs under plain `node`, no `tsx`
// needed , confirmed by hand before writing the rest of this file. lib/email-colors.ts is the
// live source; if it drifts from the LOCKFILE tokens, this script drifts with it on purpose.
import { EMAIL_COLORS } from "../lib/email-colors.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT_DIR = resolve(ROOT, "public/_email-assets/art");
const FONTS_DIR = resolve(ROOT, "public/_mockups/_assets/fonts");
const PHOTOS_DIR = resolve(ROOT, "public/_mockups/_assets/salon-photos");
const GENERATED_DIR = resolve(ROOT, "public/_email-assets/generated");

// Clean rebuild every run: an earlier pass wrote art-confirmed.png etc (before the JPEG
// switch), and a stale file with a different extension sitting next to the new one is exactly
// the kind of leftover a preview page could accidentally pick up. manifest.json only ever
// lists what THIS run produced, so the directory should hold nothing else either.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

function dataUri(absPath, mime) {
  return `data:${mime};base64,${readFileSync(absPath).toString("base64")}`;
}

// Inlined once at module load so every render is a self-contained document , no network
// fetch, no system-font fallback, nothing that depends on the machine running this script.
const FONT_INTER = dataUri(join(FONTS_DIR, "inter-latin-var.woff2"), "font/woff2");
const FONT_INTER_TIGHT = dataUri(join(FONTS_DIR, "inter-tight-latin-var.woff2"), "font/woff2");

const photoCache = new Map();
function photoDataUri(file) {
  if (!photoCache.has(file)) {
    photoCache.set(file, dataUri(join(PHOTOS_DIR, file), "image/jpeg"));
  }
  return photoCache.get(file);
}

// Real Lucide path data, copied from node_modules/lucide-react/dist/esm/icons/{map-pin,clock}.js
// (v0.577.0) , not redrawn by hand, which feedback_icon_rules.md bans. Default Lucide attrs
// (viewBox 0 0 24 24, stroke 2, round caps/joins, fill none) come from the library's own
// defaultAttributes.js, reproduced on the <svg> tags below. These are the same two icons
// BookingCard.tsx L127/132 already uses for the address and time meta lines.
const ICON_PATHS = {
  mapPin:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
};
function icon(name, colorHex) {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorHex}" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" style="flex:none;">${ICON_PATHS[name]}</svg>`;
}

// Status pill fill/text pairs, given directly for this asset rather than reused from the
// live s-success/s-error opacity tokens (bg-s-success/10 etc. only resolve inside Tailwind's
// runtime, not in a flattened raster). "cancelled" and "reminder" match tokens that already
// exist: cancelled reuses EMAIL_COLORS.bgSunken/ink2 (the neutral pair every email already
// carries), reminder reuses EMAIL_COLORS.warningBg/warningText verbatim. "confirmed" is the
// one net-new pair, a pale green chip + dark green text, deliberately NOT s-success's own
// #E8F5E9 bg since that token reads too close to white once flattened off Tailwind's opacity
// blend; kept pastel-chip-plus-ink-text per the design contract (never a saturated block).
const PILL = {
  confirmed: { bg: "#DCFCE7", fg: "#166534", label: "Bestätigt" },
  cancelled: { bg: EMAIL_COLORS.bgSunken, fg: EMAIL_COLORS.ink2, label: "Storniert" },
  reminder: { bg: EMAIL_COLORS.warningBg, fg: EMAIL_COLORS.warningText, label: "Bald" },
};

/**
 * bookingCard() , the recorded anatomy of components-legacy/booking/BookingCard.tsx, with the
 * photo added on top (L426 of SalonCard.tsx: aspect-[5/4], rounded-[22px], both reused as-is)
 * and the action row (L149-183 of the real file) dropped, since a raster can't run onClick.
 * Everything else, in the real file's own order: date tile (L111-115) -> salon/service/meta
 * column (L118-134) -> status pill (L138-140) -> hairline + total row (L144-148).
 *
 * Font budget, counted by hand so LOCKFILE §12's <=4-size / <=2-weight floor is provable:
 *   sizes   , 22 (date-tile day number), 16 (salon name AND total amount, folded to match),
 *             14 (service line), 12 (date-tile dow/month, meta lines, status pill, total
 *             label)                                                              = 4
 *   weights , 600 semibold (date-tile dow + day number, salon name, status pill, total
 *             amount), 400 normal (date-tile month, service line, meta lines, total label) = 2
 * The real component runs a THIRD weight (font-bold on the date-tile's dow label and day
 * number, L112/L113) and a FIFTH size (13px on the two meta lines, L126/L131, and the total
 * amount originally matched neither at 15px). All three were folded for this asset only:
 * bold -> semibold on the date tile, 13 -> 12 on the meta lines, 15 -> 16 on the total amount
 * so it shares the salon name's size instead of adding a fifth. BookingCard.tsx itself is
 * unchanged; only this flattened copy folds those steps.
 */
function bookingCard({ state, photoFile, dow, day, month, salon, service, address, time, price }) {
  const pill = PILL[state];
  // The chip alone is easy to miss at a glance; a desaturated photo is not.
  const photoFilter = state === "cancelled" ? "filter:grayscale(1) opacity(.72);" : "";
  return `<div style="width:520px;background:#ffffff;border-radius:22px;overflow:hidden;
      border:1px solid ${EMAIL_COLORS.border};box-shadow:0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03);
      font-family:'InterVar',sans-serif;">
    <img src="${photoDataUri(photoFile)}"
         style="display:block;width:520px;aspect-ratio:5/4;object-fit:cover;${photoFilter}" />
    <div style="padding:16px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="flex:none;width:52px;border-radius:12px;background:${EMAIL_COLORS.bgSunken};padding:8px 0;text-align:center;">
          <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${EMAIL_COLORS.ink2};">${dow}</div>
          <div style="font-family:'InterTightVar',sans-serif;font-size:22px;font-weight:600;line-height:1.05;color:${EMAIL_COLORS.ink};">${day}</div>
          <div style="font-size:12px;font-weight:400;color:${EMAIL_COLORS.ink2};">${month}</div>
        </div>
        <div style="min-width:0;flex:1;">
          <h3 style="margin:0;font-family:'InterTightVar',sans-serif;font-size:16px;font-weight:600;letter-spacing:-.01em;
                     color:${EMAIL_COLORS.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${salon}</h3>
          <p style="margin:2px 0 0;font-size:14px;font-weight:400;color:${EMAIL_COLORS.ink};">${service}</p>
          <p style="margin:4px 0 0;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:400;color:${EMAIL_COLORS.ink2};">
            ${icon("mapPin", EMAIL_COLORS.ink2)}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${address}</span>
          </p>
          <p style="margin:4px 0 0;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:400;color:${EMAIL_COLORS.ink2};">
            ${icon("clock", EMAIL_COLORS.ink2)}${time}
          </p>
        </div>
        <div style="flex:none;border-radius:9999px;padding:4px 10px;font-size:12px;font-weight:600;background:${pill.bg};color:${pill.fg};">${pill.label}</div>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid ${EMAIL_COLORS.border};display:flex;justify-content:flex-end;">
        <div style="font-size:16px;font-weight:600;color:${EMAIL_COLORS.ink};">
          <span style="margin-right:6px;font-size:12px;font-weight:400;color:${EMAIL_COLORS.ink2};">Total</span>${price}
        </div>
      </div>
    </div>
  </div>`;
}

// public/logo.svg cannot stand in for these two: Gmail strips <svg> out of message bodies
// entirely (confirmed behaviour, not a guess , Gmail's sanitiser drops the tag), and the file
// that's there is still the retired V2 mark , ink #1A1209 / teal #043338 in Peace Sans, a font
// no mail client has installed and that isn't embedded in the SVG. A flattened PNG in the
// current tokens and the same Inter Tight face used everywhere else is the only version that
// survives an inbox.
function wordmark(color) {
  // line-height:1 strips the font's own leading (34px normal-leading measured at ~49 CSS px
  // tall, ~98 raster , tighter than the "roughly 200x50" target asked for); a 34px word can't
  // reach a true 25 CSS / 50 raster box without clipping the glyphs, so this is the tightest
  // box that still holds the full word (measured: 139x42 CSS -> 278x84 raster).
  return `<span style="display:inline-block;font-family:'InterTightVar',sans-serif;font-size:34px;
                        font-weight:700;letter-spacing:-.025em;line-height:1;color:${color};">solen.ch</span>`;
}

function pageHtml(bodyHtml, { background, padding }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family:'InterVar'; src:url(${FONT_INTER}) format('woff2'); font-weight:100 900; font-style:normal; }
    @font-face { font-family:'InterTightVar'; src:url(${FONT_INTER_TIGHT}) format('woff2'); font-weight:100 900; font-style:normal; }
    * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
    html, body { margin:0; padding:0; background:${background}; }
    /* #art carries the padding, not the card/text itself , the box-shadow (cards) or glyph
       anti-aliasing (wordmarks) needs a little room before it gets clipped by the screenshot's
       own bounding box, which is exactly the element being captured below. */
    #art { display:inline-block; padding:${padding}px; }
  </style></head>
  <body><div id="art">${bodyHtml}</div></body></html>`;
}

const SERVICE = "Damenhaarschnitt & Föhnen";
const SALON = "Coiffure Belle Époque Niederdorf";
// Copied, not imported: lib/email-preview-samples.ts:53 holds the same string in its `S`
// fixture object, but `S` is a module-local const there, not exported, so there is nothing to
// import. Copying the literal keeps this picture and that file's preview email in agreement;
// if that address ever changes, grep both files rather than assume this one followed along.
const ADDRESS = "Niederdorfstrasse 42, 8001 Zürich";
const PRICE = "CHF 89.00";

const PIECES = [
  {
    id: "confirmed",
    file: "art-confirmed.jpg",
    type: "jpeg",
    html: bookingCard({
      state: "confirmed",
      photoFile: "p09.jpg",
      dow: "Di",
      day: "26",
      month: "Aug",
      salon: SALON,
      service: SERVICE,
      address: ADDRESS,
      time: "14:30",
      price: PRICE,
    }),
  },
  {
    id: "cancelled",
    file: "art-cancelled.jpg",
    type: "jpeg",
    html: bookingCard({
      state: "cancelled",
      photoFile: "p09.jpg",
      dow: "Di",
      day: "26",
      month: "Aug",
      salon: SALON,
      service: SERVICE,
      address: ADDRESS,
      time: "14:30",
      price: PRICE,
    }),
  },
  {
    id: "reminder",
    file: "art-reminder.jpg",
    type: "jpeg",
    html: bookingCard({
      state: "reminder",
      photoFile: "p09.jpg",
      dow: "Mi",
      day: "27",
      month: "Aug",
      salon: SALON,
      service: SERVICE,
      address: ADDRESS,
      time: "14:30",
      price: PRICE,
    }),
  },
  { id: "wordmark-ink", file: "wordmark-ink.png", type: "png", html: wordmark(EMAIL_COLORS.ink) },
  { id: "wordmark-white", file: "wordmark-white.png", type: "png", html: wordmark("#FFFFFF") },
];

// The three 3D object renders: read-only sources in GENERATED_DIR, resized + quantized copies
// written to OUT_DIR. Not part of PIECES above because they need sharp, not a browser render.
const OBJECTS = [
  { id: "obj-confirmed", src: "obj-confirmed.png", file: "obj-confirmed.png" },
  { id: "obj-cancelled", src: "obj-cancelled.png", file: "obj-cancelled.png" },
  { id: "obj-reminder", src: "obj-reminder.png", file: "obj-reminder.png" },
];
const OBJECT_MAX_BYTES = 60 * 1024;
const CARD_MAX_BYTES = 120 * 1024;

const DPR = 2; // deviceScaleFactor below; kept as one named constant so the two never drift apart.

async function main() {
  const browser = await chromium.launch();
  const results = [];
  try {
    // deviceScaleFactor:2 so the raster holds twice the pixels of its CSS size , the email
    // <img> tag will later be set to the CSS width, so a retina phone gets a crisp 2x asset.
    const page = await browser.newPage({ deviceScaleFactor: DPR, viewport: { width: 900, height: 900 } });

    for (const piece of PIECES) {
      const isJpeg = piece.type === "jpeg";
      // Cards: opaque white wrapper, room for the shadow to bleed into (40px). Wordmarks:
      // transparent wrapper (they sit on the v2 frame's dark band or a white card depending on
      // treatment), tight padding since there's no shadow to protect, just anti-aliasing.
      const wrapOpts = isJpeg ? { background: "#ffffff", padding: 40 } : { background: "transparent", padding: 4 };
      await page.setContent(pageHtml(piece.html, wrapOpts), { waitUntil: "load" });
      // Fonts are inlined as data URIs, but the browser still needs to parse/shape them before
      // a screenshot is trustworthy , without this the first render can land on the fallback
      // face and nobody would notice until the file was already shipped.
      await page.evaluate(async () => {
        await document.fonts.ready;
      });

      const el = await page.$("#art");
      if (!el) throw new Error(`#art not found for ${piece.id}`);
      // omitBackground is a PNG-only capability (JPEG carries no alpha channel to hide a
      // background into), so it's only passed for the two wordmark pieces.
      const shotOpts = isJpeg ? { type: "jpeg", quality: 82 } : { type: "png", omitBackground: true };
      const buffer = await el.screenshot(shotOpts);
      const outPath = join(OUT_DIR, piece.file);
      writeFileSync(outPath, buffer);

      // Playwright's screenshot pixel size is always exactly the element's CSS box times
      // deviceScaleFactor (verified by hand against this script's own output before this line
      // was written), which is cheaper than parsing two different binary headers (PNG's IHDR
      // and JPEG's SOF0) for the same number.
      const box = await el.boundingBox();
      const width = Math.round(box.width * DPR);
      const height = Math.round(box.height * DPR);
      results.push({ id: piece.id, file: piece.file, bytes: buffer.length, width, height, maxBytes: CARD_MAX_BYTES });
    }
  } finally {
    await browser.close();
  }

  // Pure image work, no browser needed: resize each object to 420px wide and quantize to a
  // small palette PNG. 128 colours (checked by eye against the un-quantized resize for all
  // three before picking it): no visible banding on these flat-region clay renders, landing
  // well inside the 60 KB ceiling these were given.
  for (const obj of OBJECTS) {
    const srcPath = join(GENERATED_DIR, obj.src);
    const srcBuffer = readFileSync(srcPath);
    const buffer = await sharp(srcBuffer)
      .resize(420, null)
      .png({ palette: true, colors: 128, dither: 1.0, effort: 10 })
      .toBuffer();
    const outPath = join(OUT_DIR, obj.file);
    writeFileSync(outPath, buffer);

    const meta = await sharp(buffer).metadata();
    results.push({
      id: obj.id,
      file: obj.file,
      bytes: buffer.length,
      width: meta.width,
      height: meta.height,
      maxBytes: OBJECT_MAX_BYTES,
    });
  }

  console.log("\nbuild-email-art:");
  for (const r of results) {
    console.log(`  ${(r.bytes / 1024).toFixed(1).padStart(6)} KB  ${r.width}x${r.height}  ${r.file}`);
  }
  const biggest = Math.max(...results.map((r) => r.bytes));
  console.log(`\n${results.length} files, biggest ${(biggest / 1024).toFixed(1)} KB`);

  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        items: results.map((r) => ({ id: r.id, file: r.file, width: r.width, height: r.height, bytes: r.bytes })),
      },
      null,
      2
    ) + "\n"
  );

  // Gmail clips a message body past roughly 102 KB of combined HTML, and every extra KB of
  // inline image is extra wait before the receipt paints on mobile data. Two budgets, per
  // asset type: 120 KB for the cards/wordmarks (down from an earlier 160 KB ceiling, tightened
  // once the cards moved off PNG), 60 KB for the three resized objects (given directly, they
  // are icon-scale and have no reason to approach a card's budget).
  const over = results.filter((r) => r.bytes > r.maxBytes);
  if (over.length > 0) {
    console.error(
      `\nasset too heavy for email: ${over
        .map((r) => `${r.file} (${(r.bytes / 1024).toFixed(1)} KB, budget ${(r.maxBytes / 1024).toFixed(0)} KB)`)
        .join(", ")}`
    );
    process.exit(1);
  }
}

await main();
