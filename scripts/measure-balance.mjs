#!/usr/bin/env node
// scripts/measure-balance.mjs
//
// Runs the TWO measures that survived the adversarial round in
// `_design-system/research/BALANCE_VERDICT.md` (2026-07-31), and only those two.
// Six other measures were tested and killed; they are named in `_design-system/BALANCE.md`
// so nobody re-proposes them. Do not add a measure here without putting it through the
// same decisive test (does it rank /de/salon/cuts-and-culture, which the owner likes,
// above /de/profile, which he called "ultra ass"?).
//
//   M1  FRAME OVERFLOW            correctness. Any `overflow: hidden|clip` container in the
//                                 first viewport whose content is wider than its frame is
//                                 shearing its own content. FAIL above 10px.
//   M8  ENTITY-RENDER DIVERGENCE  the only measure in that round that ordered the owner's
//                                 stated taste correctly. One salon entity must produce ONE
//                                 render signature. Two signatures = FAIL.
//
// Honest scope, repeated from the verdict so it travels with the tool:
//   - M1 says nothing about taste. It scored 0px on the liked screen AND 0px on the disliked
//     screen. It is a bug detector that happens to be cheap and to have zero false positives
//     over the eight screens tested.
//   - M8 is a HYPOTHESIS, not a validated instrument. n = 1 disliked screen, and it was built
//     after its author saw the label. It reproduces FLOORS LAW 8 to the decimal, which is why
//     it is here, but it needs the owner's next few rejections before it earns a hook.
//   - Neither is wired as a gate. This script is run by hand or by the design-verifier render
//     pass. `--gate` exists so it CAN fail a run once someone decides it should.
//
// This script reuses the repo's existing Playwright (devDependency @playwright/test 1.59.1,
// `playwright` resolves from it) and mirrors `scripts/check-geometry.mjs` for its browser
// bootstrap, arg parsing, settle sequence and cookie dismissal. No new dependency.
//
// Usage:
//   node scripts/measure-balance.mjs /de
//   node scripts/measure-balance.mjs /de --viewport mobile
//   node scripts/measure-balance.mjs /_mockups/home-v3/index.html
//   node scripts/measure-balance.mjs https://example.test/some/page --viewport 1440x900
//   node scripts/measure-balance.mjs /de/profile --dev-login          (authenticated surface)
//   node scripts/measure-balance.mjs /de /de/profile                   (2+ URLs adds M8 cross-screen)
//   node scripts/measure-balance.mjs /de --json
//   node scripts/measure-balance.mjs /de --gate                        (exit 1 on any FAIL)
//   BASE_URL=http://localhost:3000 node scripts/measure-balance.mjs /de
//
// Exit code: 0 always, UNLESS --gate is passed, in which case 1 on any FAIL (and 1 on a
// harness crash, so a broken chromium never reads as a pass).

// ----------------------------------------------------------------------------
// Config. Every number below is a threshold from BALANCE_VERDICT.md section 6,
// with the reason inline. Changing one means re-running the decisive test.
// ----------------------------------------------------------------------------

// M1: `scrollWidth - clientWidth` above this many px on an overflow:hidden|clip container
// is a FAIL. 10 rather than 2 because /de's invisible closed modal reads 9px, and the one
// real hit in the calibration sample read 32px. There is no distribution between the two,
// so this is a gap threshold, not a fitted one.
const M1_OVERFLOW_PX = 10;

// M1: ignore boxes smaller than this. A 12px icon clipping its own svg by a subpixel is not
// the defect being detected (a visibly sheared card is).
const M1_MIN_W = 40;
const M1_MIN_H = 20;

// M8: card resolution. The smallest ancestor of a /salon/<slug> link that contains at least
// one photo, is between these heights, and does not contain a different salon's link.
// 60..520 comes from the verdict's definition verbatim: below 60 is a text row, above 520 is
// a section wrapper rather than a card.
const M8_CARD_MIN_H = 60;
const M8_CARD_MAX_H = 520;

// M8: an <img> below this rendered size is a glyph or an avatar chip, not one of the card's
// photos. Excluded from the photo count so a badge icon cannot change a signature.
const M8_MIN_PHOTO_PX = 24;

// M8: two photo aspects count as the SAME shape when max/min is below this.
//
// AMENDS the threshold in BALANCE_VERDICT.md section 6, which said "photo aspect to 2dp" with
// no tolerance. Measured 2026-07-31, which is why: on /de/profile the saved row renders cards
// 175px wide and the "Neu für dich" row renders them 148px wide. Both use the same photo tray
// (`aspect-[195/131]`, first photo `flex-[0_0_66%]`, a FIXED 2px gap), so the first photo comes
// out at 0.982 in the wide row and 0.973 in the narrow one. That is a 0.9% difference produced
// by a constant gap inside two container widths. At 2dp it reads as two signatures and the
// screen fails on an artifact no one can see.
//
// The verdict's own text shows the inconsistency: it justified the profile's two signatures by
// the name rendering at 16/500 in one row and 14/500 in the other, and then EXCLUDED font size
// from the signature by name. With size excluded, all that separated those two rows was the
// 0.01 of aspect rounding.
//
// 1.05 sits an order of magnitude above the artifact (0.9%) and an order of magnitude below the
// divergence the measure exists to catch (/de renders these same salons at 1.25 against the
// profile's 0.97, a 29% difference). Both bounds are measured, not assumed. The raw 2dp aspects
// stay in the output so nothing is hidden by the clustering.
const M8_ASPECT_TOLERANCE = 1.05;

const VIEWPORTS = {
  // 390x844 is the house measurement viewport (CLAUDE.md FLOORS LAW 2, corrected 2026-07-25,
  // matches check-geometry.mjs's FLOORS pass). It is also what BALANCE_VERDICT.md measured at.
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

const DEFAULT_BASE_URL = process.env.BASE_URL || "http://localhost:50723";

// ----------------------------------------------------------------------------
// CLI args (mirrors scripts/check-geometry.mjs parseArgs)
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const targets = [];
  let baseUrl = DEFAULT_BASE_URL;
  let viewportArg = "mobile";
  let json = false;
  let gate = false;
  let devLogin = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base-url") baseUrl = argv[++i];
    else if (a === "--viewport") viewportArg = argv[++i];
    else if (a === "--json") json = true;
    else if (a === "--gate") gate = true;
    else if (a === "--dev-login") devLogin = true;
    else if (!a.startsWith("--")) targets.push(a);
  }

  let viewport = VIEWPORTS[viewportArg];
  if (!viewport) {
    const m = /^(\d+)x(\d+)$/.exec(String(viewportArg));
    if (m) viewport = { width: Number(m[1]), height: Number(m[2]) };
  }
  if (!viewport) {
    console.error(`[measure-balance] unknown --viewport "${viewportArg}", falling back to mobile (390x844)`);
    viewportArg = "mobile";
    viewport = VIEWPORTS.mobile;
  }

  return { baseUrl, viewport, viewportName: viewportArg, json, gate, devLogin, targets };
}

// ----------------------------------------------------------------------------
// Browser bootstrap (mirrors scripts/check-geometry.mjs launchBrowser())
// ----------------------------------------------------------------------------
async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    console.error("[measure-balance] `playwright` import failed, falling back to playwright-core:", err);
    ({ chromium } = await import("playwright-core"));
  }
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    console.error(
      "[measure-balance] chromium.launch failed (browser binary may be missing, try `npx playwright install chromium`):",
      err,
    );
    throw err;
  }
}

// Mirrors e2e/visual/spine.spec.ts dismissCookies(), via check-geometry.mjs.
async function dismissCookies(page) {
  const btn = page.locator("button", { hasText: /nur notwendige|akzeptieren|accept/i }).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

// ----------------------------------------------------------------------------
// In-page extraction. Serialized by page.evaluate, so it must be self-contained:
// no closures over anything but the passed `config`.
// ----------------------------------------------------------------------------
function extractBalance(config) {
  const {
    viewportWidth,
    viewportHeight,
    m1OverflowPx,
    m1MinW,
    m1MinH,
    m8CardMinH,
    m8CardMaxH,
    m8MinPhotoPx,
  } = config;

  // --- shared helpers ------------------------------------------------------
  function selectorFor(el) {
    if (!el || el.nodeType !== 1) return "(none)";
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && cur !== document.documentElement && depth < 5) {
      let part = cur.tagName.toLowerCase();
      const cls = typeof cur.className === "string" ? cur.className.trim().split(/\s+/).slice(0, 3) : [];
      if (cls.length) part += "." + cls.map((c) => CSS.escape(c)).join(".");
      parts.unshift(part);
      if (cur.id) {
        parts[0] = "#" + CSS.escape(cur.id);
        break;
      }
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(" > ");
  }

  function intersectsFirstViewport(r) {
    return r.bottom > 0 && r.top < viewportHeight && r.right > 0 && r.left < viewportWidth;
  }

  // ==========================================================================
  // M1 FRAME OVERFLOW
  // BALANCE_VERDICT.md section 2: every element whose computed overflow-x is
  // hidden or clip, larger than 40x20, intersecting the first viewport; is
  // scrollWidth - clientWidth > 0? Containers with overflow auto|scroll are
  // excluded BY CONSTRUCTION and that exclusion is load-bearing: FLOORS LAW 3
  // requires a visibly cropped peek item, which is a scroller, not a defect.
  // ==========================================================================
  const m1Hits = [];
  let m1Scanned = 0;
  for (const el of Array.from(document.querySelectorAll("*"))) {
    const cs = getComputedStyle(el);
    const ox = cs.overflowX;
    if (ox !== "hidden" && ox !== "clip") continue;
    const r = el.getBoundingClientRect();
    if (r.width < m1MinW || r.height < m1MinH) continue;
    if (!intersectsFirstViewport(r)) continue;
    m1Scanned++;
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow > 0) {
      m1Hits.push({
        selector: selectorFor(el),
        overflowPx: overflow,
        frameW: el.clientWidth,
        contentW: el.scrollWidth,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
  }
  m1Hits.sort((a, b) => b.overflowPx - a.overflowPx);
  const m1Worst = m1Hits.length ? m1Hits[0].overflowPx : 0;

  // ==========================================================================
  // M8 ENTITY-RENDER DIVERGENCE
  // BALANCE_VERDICT.md section 2: for each salon entity linked on a screen, find
  // the smallest ancestor of the /salon/<slug> link that contains at least one
  // img, is 60..520px tall, and does not contain a different salon's link.
  // Signature = (photo count, first photo aspect to 2dp, price present, rating
  // present). One entity should produce one signature.
  //
  // Font size is DELIBERATELY EXCLUDED from the signature. Home renders the name
  // at 14 and search at 16, the owner never objected to that, so including size
  // would fire on screens he has never criticised. (verdict section 2, M8.)
  // ==========================================================================
  // A CARD link points AT the salon and nothing deeper. Grounded in the real component:
  // app/[locale]/_components/homepage/SalonCard.tsx line 385 renders
  // href={`/${locale}/salon/${slug}`}. Anchoring on `$` (allowing ?query and #hash) is what
  // separates a card from a service row.
  //
  // This guard is NOT cosmetic. Without it, on /de/salon/cuts-and-culture the ten
  // `/salon/cuts-and-culture/booking?service=<uuid>` service rows all read as links to the
  // entity, and the resolver climbed until it found an ancestor with photos in the height
  // band, landing on `#section-team` (the stylist strip, 3 avatars, 246px tall). It then
  // reported that team section as a salon card with signature `3 | 1.00 | noprice | norating`.
  // BALANCE_VERDICT.md's PDP row (`3 photos, AR 1.00, no price, rating`) is the same artifact
  // measured by the original harness. It was never a salon card. Measured 2026-07-31.
  const SLUG_RE = /\/salon\/([^/?#]+)(?:[?#].*)?$/;

  function slugOf(a) {
    const href = a.getAttribute("href") || "";
    const m = SLUG_RE.exec(href);
    return m ? decodeURIComponent(m[1]) : null;
  }

  // A detail page IS the entity; it is not a rendering of the entity's card. FLOORS LAW 8 is
  // about one entity rendering through one COMPONENT across screens, so a self-link on
  // /de/salon/<slug> (a logo, a breadcrumb) is not a card of itself.
  const selfSlugMatch = /\/salon\/([^/?#]+)/.exec(location.pathname);
  const selfSlug = selfSlugMatch ? decodeURIComponent(selfSlugMatch[1]) : null;

  const salonLinks = Array.from(document.querySelectorAll('a[href*="/salon/"]')).filter((a) => {
    const s = slugOf(a);
    return s && s !== selfSlug;
  });

  // Price detector, grounded in the real render rather than guessed: the SalonCard
  // price slot renders through the PriceFrom primitive and paints e.g. "ab CHF 85"
  // / "15 CHF" (measured on /de 2026-07-31). Matches a CHF or Fr. amount anywhere
  // in the card's text.
  const PRICE_RE = /(\bCHF\b|\bFr\.)\s*\d|\d\s*(\bCHF\b|\bFr\.)/i;

  // Rating detector, grounded in app/[locale]/_components/primitives/RatingStars.tsx:
  // compact mode paints `<span>{value.toFixed(1)}</span>` next to a star svg. So the
  // signal is a LEAF element whose whole text is a one-decimal 0.0..5.0. The
  // one-decimal requirement is what stops "15 CHF" or a "4" count from matching.
  const RATING_RE = /^[0-5][.,]\d$/;

  function hasRating(card) {
    for (const el of Array.from(card.querySelectorAll("*"))) {
      if (el.children.length !== 0) continue; // leaf only
      const t = (el.textContent || "").trim();
      if (RATING_RE.test(t)) return true;
    }
    // fallback: RatingStars sets aria-label="4.8" / "4.8, 16 reviews" on the wrapper
    for (const el of Array.from(card.querySelectorAll("[aria-label]"))) {
      const t = (el.getAttribute("aria-label") || "").trim();
      if (/^[0-5][.,]\d(\s*,|\s*\/|$)/.test(t)) return true;
    }
    return false;
  }

  function resolveCard(link, slug) {
    let el = link;
    let hops = 0;
    while (el && el.nodeType === 1 && hops < 12) {
      const r = el.getBoundingClientRect();
      const hasImg = !!el.querySelector("img");
      const inHeightBand = r.height >= m8CardMinH && r.height <= m8CardMaxH;
      if (hasImg && inHeightBand) {
        // must not contain a DIFFERENT salon's link
        const others = Array.from(el.querySelectorAll('a[href*="/salon/"]')).filter((a) => {
          const s = slugOf(a);
          return s && s !== slug;
        });
        if (others.length === 0) return el;
        return null; // grew past its own entity before it ever became a card
      }
      el = el.parentElement;
      hops++;
    }
    return null;
  }

  const cards = [];
  const seenEls = new Set();
  for (const link of salonLinks) {
    const slug = slugOf(link);
    const card = resolveCard(link, slug);
    if (!card || seenEls.has(card)) continue;
    seenEls.add(card);

    const photos = Array.from(card.querySelectorAll("img"))
      .map((img) => {
        const ir = img.getBoundingClientRect();
        return { w: ir.width, h: ir.height };
      })
      .filter((p) => p.w >= m8MinPhotoPx && p.h >= m8MinPhotoPx);

    const text = card.innerText || card.textContent || "";
    const r = card.getBoundingClientRect();

    cards.push({
      slug,
      selector: selectorFor(card),
      photoCount: photos.length,
      firstAspect: photos.length ? Number((photos[0].w / photos[0].h).toFixed(2)) : null,
      price: PRICE_RE.test(text),
      rating: hasRating(card),
      rect: { y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      inFirstViewport: intersectsFirstViewport(r),
    });
  }

  // signature string, the verdict's tuple: (photos, aspect 2dp, price, rating)
  for (const c of cards) {
    c.signature = `${c.photoCount} | ${c.firstAspect === null ? "n/a" : c.firstAspect.toFixed(2)} | ${
      c.price ? "price" : "noprice"
    } | ${c.rating ? "rating" : "norating"}`;
  }

  // Two cards are the SAME rendering when photo count, price and rating match exactly and the
  // aspects are within M8_ASPECT_TOLERANCE of each other. Clustered greedily per entity rather
  // than bucketed by rounding, so two near-identical aspects can never land either side of an
  // arbitrary bucket edge.
  function sameRendering(a, b) {
    if (a.photoCount !== b.photoCount) return false;
    if (a.price !== b.price) return false;
    if (a.rating !== b.rating) return false;
    if (a.firstAspect === null || b.firstAspect === null) return a.firstAspect === b.firstAspect;
    const hi = Math.max(a.firstAspect, b.firstAspect);
    const lo = Math.min(a.firstAspect, b.firstAspect);
    if (lo <= 0) return false;
    return hi / lo < config.m8AspectTolerance;
  }

  function clusterSignatures(list) {
    const reps = [];
    for (const c of list) {
      if (!reps.some((r) => sameRendering(r, c))) reps.push(c);
    }
    return reps;
  }

  const bySlug = {};
  for (const c of cards) {
    if (!bySlug[c.slug]) bySlug[c.slug] = [];
    bySlug[c.slug].push(c);
  }
  const divergent = Object.keys(bySlug)
    .map((slug) => ({ slug, reps: clusterSignatures(bySlug[slug]) }))
    .filter((e) => e.reps.length > 1)
    .map((e) => ({ slug: e.slug, signatures: e.reps.map((r) => r.signature) }));

  // Screen-level distinct renderings, same clustering, for the report line.
  const allSignatures = clusterSignatures(cards).map((c) => c.signature);
  // Raw 2dp signatures kept alongside, so the clustering never hides a real difference.
  const rawSignatures = [];
  for (const c of cards) if (!rawSignatures.includes(c.signature)) rawSignatures.push(c.signature);

  return {
    page: {
      url: location.href,
      path: location.pathname,
      docHeight: document.documentElement.scrollHeight,
      viewportsTall: Number((document.documentElement.scrollHeight / viewportHeight).toFixed(2)),
    },
    m1: { scanned: m1Scanned, worstPx: m1Worst, hits: m1Hits.slice(0, 10), thresholdPx: m1OverflowPx },
    m8: {
      salonLinks: salonLinks.length,
      cards,
      cardCount: cards.length,
      distinctSignatures: allSignatures,
      rawSignatures,
      aspectTolerance: config.m8AspectTolerance,
      divergent,
    },
  };
}

// ----------------------------------------------------------------------------
// Reporting
// ----------------------------------------------------------------------------
function verdictFor(raw) {
  const m1Fail = raw.m1.worstPx > raw.m1.thresholdPx;
  const m8Fail = raw.m8.divergent.length > 0;
  return {
    m1: m1Fail ? "FAIL" : "PASS",
    m8: raw.m8.cardCount === 0 ? "N/A" : m8Fail ? "FAIL" : "PASS",
    overall: m1Fail || m8Fail ? "FAIL" : "PASS",
  };
}

function printReport(target, raw, v, viewport, viewportName) {
  const line = "-".repeat(78);
  console.log(line);
  console.log(`SCREEN  ${target}`);
  console.log(
    `        ${viewport.width}x${viewport.height} (${viewportName})  ·  document ${raw.page.docHeight}px = ${raw.page.viewportsTall} viewports tall`,
  );
  console.log(line);

  // M1
  console.log(
    `M1 FRAME OVERFLOW ................ ${v.m1}   worst ${raw.m1.worstPx}px  (threshold: > ${raw.m1.thresholdPx}px fails; ${raw.m1.scanned} clipping containers in the first viewport)`,
  );
  if (raw.m1.hits.length === 0) {
    console.log(`        no overflow:hidden|clip container is shearing its content.`);
  } else {
    for (const h of raw.m1.hits.slice(0, 5)) {
      const mark = h.overflowPx > raw.m1.thresholdPx ? "FAIL" : "under threshold";
      console.log(
        `        ${String(h.overflowPx).padStart(4)}px ${mark.padEnd(15)} frame ${h.frameW} holding ${h.contentW}  ${h.selector}`,
      );
    }
  }

  // M8
  console.log("");
  const sigWord = raw.m8.distinctSignatures.length === 1 ? "signature" : "signatures";
  console.log(
    `M8 ENTITY DIVERGENCE ............. ${v.m8}   ${raw.m8.cardCount} salon card(s) from ${raw.m8.salonLinks} link(s), ${raw.m8.distinctSignatures.length} distinct ${sigWord}  (threshold: any ONE entity showing 2+ signatures fails)`,
  );
  if (raw.m8.cardCount === 0) {
    console.log(`        no /salon/<slug> card resolved on this screen. M8 cannot speak; this is not a pass.`);
  } else {
    for (const s of raw.m8.distinctSignatures) {
      console.log(`        ${s}`);
    }
    console.log(
      `        signature = (photos | first-photo aspect 2dp | price | rating), aspects within ${raw.m8.aspectTolerance}x count as one shape`,
    );
    if (raw.m8.rawSignatures.length > raw.m8.distinctSignatures.length) {
      console.log(
        `        raw 2dp, before aspect clustering (${raw.m8.rawSignatures.length}): ${raw.m8.rawSignatures.join("  /  ")}`,
      );
    }
    if (raw.m8.divergent.length) {
      console.log("");
      for (const d of raw.m8.divergent) {
        console.log(`        DIVERGENT  ${d.slug}`);
        for (const s of d.signatures) console.log(`                   ${s}`);
      }
    }
  }

  console.log("");
  console.log(`VERDICT ......................... ${v.overall}`);
  console.log("");
}

// Only meaningful with 2+ screens. This is the shape of the defect the verdict actually found:
// the same salon rendering as a different object on /de than on /de/profile. FLOORS LAW 8, made
// arithmetic. `print` is false in --json mode: the GATE must not depend on the output format, so
// the divergence is always computed and only the printing is conditional.
function crossScreen(perScreen, print) {
  // Same clustering rule as within-screen (see M8_ASPECT_TOLERANCE), so a card is not called
  // divergent across two screens for a difference that would be ignored on one.
  const same = (a, b) =>
    a.photoCount === b.photoCount &&
    a.price === b.price &&
    a.rating === b.rating &&
    (a.firstAspect === null || b.firstAspect === null
      ? a.firstAspect === b.firstAspect
      : Math.max(a.firstAspect, b.firstAspect) / Math.min(a.firstAspect, b.firstAspect) < M8_ASPECT_TOLERANCE);

  const bySlug = new Map();
  for (const { target, raw } of perScreen) {
    if (!raw) continue;
    for (const c of raw.m8.cards) {
      if (!bySlug.has(c.slug)) bySlug.set(c.slug, []);
      const rows = bySlug.get(c.slug);
      if (!rows.some((r) => r.target === target && same(r, c))) rows.push({ ...c, target });
    }
  }
  const shared = [...bySlug.entries()].filter(([, rows]) => new Set(rows.map((r) => r.target)).size > 1);
  if (shared.length === 0) return false;

  const clusters = (rows) => {
    const reps = [];
    for (const r of rows) if (!reps.some((x) => same(x, r))) reps.push(r);
    return reps;
  };
  const divergent = shared.filter(([, rows]) => clusters(rows).length > 1);
  if (!print) return divergent.length > 0;

  console.log("=".repeat(78));
  console.log(`M8 CROSS-SCREEN  ${shared.length} entit(y|ies) appear on more than one of the screens measured`);
  console.log("=".repeat(78));
  for (const [slug, rows] of shared) {
    const nSig = clusters(rows).length;
    console.log(`${nSig > 1 ? "FAIL" : "PASS"}  ${slug}`);
    for (const r of rows) console.log(`        ${r.target.padEnd(34)} ${r.signature}`);
  }
  console.log("");
  console.log(
    `CROSS-SCREEN VERDICT ............ ${divergent.length ? "FAIL" : "PASS"}   ${divergent.length} of ${shared.length} shared entities render more than one way`,
  );
  console.log("");
  return divergent.length > 0;
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
async function main() {
  const { baseUrl, viewport, viewportName, json, gate, devLogin, targets } = parseArgs(process.argv.slice(2));

  if (targets.length === 0) {
    console.error("[measure-balance] no URL given.");
    console.error("  usage: node scripts/measure-balance.mjs <url-or-path> [more...] [--viewport mobile|tablet|desktop|WxH]");
    console.error("                                          [--base-url URL] [--dev-login] [--json] [--gate]");
    process.exit(gate ? 1 : 0);
  }

  const browser = await launchBrowser();
  const perScreen = [];
  try {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2, locale: "de-CH" });
    for (const target of targets) {
      const url = /^https?:\/\//.test(target) ? target : new URL(target, baseUrl).toString();
      const page = await context.newPage();
      try {
        let response = null;
        if (devLogin) {
          // app/api/dev/login is DEV-ONLY (404s under NODE_ENV=production) and mints a seed
          // test session, then 307s to `to`. BALANCE_VERDICT.md section 1.2: measuring
          // /de/profile signed out grades a LOGIN FORM, not the profile, and that error was
          // large (31.3% vs 6.2% on the measure it was checked against).
          const path = /^https?:\/\//.test(target) ? new URL(target).pathname + new URL(target).search : target;
          const loginUrl = new URL(`/api/dev/login?to=${encodeURIComponent(path)}`, baseUrl).toString();
          response = await page.goto(loginUrl, { waitUntil: "commit", timeout: 90_000 });
        } else {
          response = await page.goto(url, { waitUntil: "commit", timeout: 90_000 });
        }

        // REFUSE to grade a non-200. This is the most important guard in the script and it was
        // added because the script got it wrong: on 2026-07-31 a concurrent session deleted
        // public/_mockups/home-v3/index.html mid-run, the URL fell through to Next's
        // [locale]/[city] catch-all, the server returned a 500 error page, and the script
        // measured that error page and reported "VERDICT PASS" with total confidence. A
        // measurement tool that answers PASS for a screen that does not exist is worse than no
        // tool, because it is trusted. Any status >= 400 is an ERROR, never a verdict.
        const status = response ? response.status() : null;
        if (status !== null && status >= 400) {
          throw new Error(
            `HTTP ${status} for ${url} - refusing to grade. The page did not render; a Next error page is not a screen.`,
          );
        }

        await page.waitForLoadState("domcontentloaded");
        // Settle sequence. networkidle FIRST, then a fixed wait, because a fixed wait alone is
        // not enough and failing quietly here is the worst possible failure: measured
        // 2026-07-31, /de/basel/coiffeur renders its result cards from an API call the dev
        // server answered in 10.0s, so a 5s settle reported "0 salon cards" on a page that has
        // eight. M8 would have said N/A on a screen it should have graded. networkidle is
        // wrapped because a page with polling or an open socket never reaches it.
        await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
        await page.waitForTimeout(4000); // images / fonts / entry animations
        await dismissCookies(page);
        await page.waitForTimeout(800);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);

        const raw = await page.evaluate(extractBalance, {
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
          m1OverflowPx: M1_OVERFLOW_PX,
          m1MinW: M1_MIN_W,
          m1MinH: M1_MIN_H,
          m8CardMinH: M8_CARD_MIN_H,
          m8CardMaxH: M8_CARD_MAX_H,
          m8MinPhotoPx: M8_MIN_PHOTO_PX,
          m8AspectTolerance: M8_ASPECT_TOLERANCE,
        });
        perScreen.push({ target, url, raw, verdict: verdictFor(raw) });
      } catch (err) {
        console.error(`[measure-balance] ${target} failed:`, err && err.message ? err.message : err);
        perScreen.push({ target, url, raw: null, error: err && err.message ? err.message : String(err) });
      } finally {
        await page.close().catch((err) => console.error("[measure-balance] page.close() failed:", err));
      }
    }
  } finally {
    await browser.close().catch((err) => console.error("[measure-balance] browser.close() failed:", err));
  }

  if (json) {
    console.log(JSON.stringify({ baseUrl, viewport, viewportName, screens: perScreen }, null, 2));
  } else {
    console.log("");
    for (const s of perScreen) {
      if (!s.raw) {
        console.log("-".repeat(78));
        console.log(`SCREEN  ${s.target}`);
        console.log(`ERROR   ${s.error}`);
        console.log("");
        continue;
      }
      printReport(s.target, s.raw, s.verdict, viewport, viewportName);
    }
  }

  let crossFail = false;
  if (perScreen.filter((s) => s.raw).length > 1) {
    crossFail = crossScreen(perScreen, !json) === true;
  }

  const anyFail =
    perScreen.some((s) => !s.raw) || perScreen.some((s) => s.verdict && s.verdict.overall === "FAIL") || crossFail;

  if (gate && anyFail) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error("[measure-balance] fatal:", err);
  // A crashed harness must never read as a pass under --gate.
  process.exit(process.argv.includes("--gate") ? 1 : 0);
});
