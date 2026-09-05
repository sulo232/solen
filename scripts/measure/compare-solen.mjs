#!/usr/bin/env node
/**
 * compare-solen.mjs
 *
 * Re-measures our own screens for the standing Solen vs Fresha vs Airbnb comparison
 * (_design-system/references/COMPARE_SOLEN_FRESHA_AIRBNB.md). Run any time after a change
 * to re-generate the Solen column of that document.
 *
 * Usage: node scripts/measure/compare-solen.mjs [baseUrl]
 *   baseUrl defaults to http://localhost:3461
 *   COMPARE_BOOKING_ID=<uuid> names a booking of the seed customer for the confirmation row (the list links no id).
 *
 * Read-only against the app: navigates and clicks inside the booking wizard (client-side
 * state only) and never reaches the Stripe pay step. Never enters credentials.
 *
 * Uses the shared measure guard (scripts/_measure-guard.mjs) on every navigation: a page
 * that errored, redirected somewhere unexpected, or rendered nothing gets NO verdict, it is
 * recorded as "not measured" with the reason. Silence is not a pass.
 *
 * Prints a JSON blob to stdout AND a markdown table, and writes both to
 * scripts/measure/out/ for the doc-writer to read.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guardedGoto, refusal } from '../_measure-guard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv[2] || 'http://localhost:3461';
const VIEWPORT = { width: 390, height: 844 };
const CUSTOMER_EMAIL = 'kunde@solen.ch';
const TEST_SALON_SLUG = 'muse-beauty-studio';

const OUT_DIR = path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// In-page metrics collector. Runs inside page.evaluate().
// ---------------------------------------------------------------------------
function collectMetricsInPage(args) {
  const [viewportW, viewportH] = args;
  const vpArea = viewportW * viewportH;

  function isVisible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  const all = Array.from(document.querySelectorAll('body *'));

  // ---- font sizes / weights over VISIBLE text-bearing elements -----------
  const textEls = [];
  for (const el of all) {
    if (!isVisible(el)) continue;
    let hasDirectText = false;
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim().length > 0) {
        hasDirectText = true;
        break;
      }
    }
    if (hasDirectText) textEls.push(el);
  }

  const sizeCounts = {};
  const weightCounts = {};
  let weightHighCount = 0;
  let maxSize = 0;
  for (const el of textEls) {
    const cs = getComputedStyle(el);
    const size = Math.round(parseFloat(cs.fontSize) * 10) / 10;
    const weight = parseInt(cs.fontWeight, 10) || 400;
    sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    weightCounts[weight] = (weightCounts[weight] || 0) + 1;
    if (weight >= 600) weightHighCount++;
    if (size > maxSize) maxSize = size;
  }
  const distinctSizes = Object.keys(sizeCounts).map(Number).sort((a, b) => a - b);
  const distinctWeights = Object.keys(weightCounts).map(Number).sort((a, b) => a - b);
  let bodySize = distinctSizes[0] || null;
  let bodyModeCount = -1;
  for (const [s, c] of Object.entries(sizeCounts)) {
    if (c > bodyModeCount) {
      bodyModeCount = c;
      bodySize = Number(s);
    }
  }
  const anchorSize = maxSize || null;
  const anchorRatio = bodySize ? Math.round((anchorSize / bodySize) * 100) / 100 : null;
  const weightHighSharePct = textEls.length
    ? Math.round((weightHighCount / textEls.length) * 1000) / 10
    : null;

  // ---- photographic share of the first viewport ---------------------------
  const mediaEls = Array.from(document.querySelectorAll('img, picture, video'));
  const bgEls = all.filter((el) => {
    const bi = getComputedStyle(el).backgroundImage;
    return bi && bi !== 'none';
  });
  const photoSet = new Set([...mediaEls, ...bgEls]);
  let photoArea = 0;
  for (const el of photoSet) {
    const r = el.getBoundingClientRect();
    const ix = Math.max(0, Math.min(r.right, viewportW) - Math.max(r.left, 0));
    const iy = Math.max(0, Math.min(r.bottom, viewportH) - Math.max(r.top, 0));
    if (ix > 0 && iy > 0) photoArea += ix * iy;
  }
  // Not de-overlapped against each other (heuristic, upper bound); noted in the report.
  const photoPctFirstViewport = Math.round((Math.min(photoArea, vpArea * 3) / vpArea) * 1000) / 10;

  // ---- box-shadow / border-radius vocabulary ------------------------------
  const shadows = new Set();
  const radii = new Set();
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.boxShadow && cs.boxShadow !== 'none') shadows.add(cs.boxShadow);
    if (cs.borderRadius && cs.borderRadius !== '0px') radii.add(cs.borderRadius);
  }

  // ---- section gap (median gap between top-level sections) ---------------
  const container = document.querySelector('main') || document.body;
  const children = Array.from(container.children).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 40 && isVisible(el);
  });
  const gaps = [];
  for (let i = 1; i < children.length; i++) {
    const prev = children[i - 1].getBoundingClientRect();
    const cur = children[i].getBoundingClientRect();
    const gap = cur.top - prev.bottom;
    if (gap >= 0 && gap < 400) gaps.push(Math.round(gap));
  }
  gaps.sort((a, b) => a - b);
  const sectionGapMedianPx = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;

  // ---- sticky/fixed bottom bar ---------------------------------------------
  let stickyBottomBar = false;
  let stickyCtaText = null;
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'sticky') {
      const r = el.getBoundingClientRect();
      if (r.bottom >= viewportH - 8 && r.bottom <= viewportH + 8 && r.width > viewportW * 0.5) {
        stickyBottomBar = true;
        stickyCtaText = (el.innerText || '').trim().slice(0, 60) || null;
        break;
      }
    }
  }

  // ---- primary CTA + distance from last required input --------------------
  const ctaWords = /book|buchen|continue|weiter|pay|bezahlen|confirm|best.tigen|reserve|next/i;
  let ctaEl = null;
  const buttons = Array.from(document.querySelectorAll('button, a[role="button"], [role="button"]'));
  for (const b of buttons) {
    if (!isVisible(b)) continue;
    const txt = (b.innerText || '').trim();
    if (ctaWords.test(txt)) {
      ctaEl = b;
      break;
    }
  }
  const ctaRect = ctaEl ? ctaEl.getBoundingClientRect() : null;
  const ctaText = ctaEl ? (ctaEl.innerText || '').trim().slice(0, 60) : null;

  const inputs = Array.from(
    document.querySelectorAll(
      'input, select, textarea, [role="radio"], [role="option"][aria-selected="true"], button[aria-pressed="true"]'
    )
  );
  let lastInputBottom = null;
  for (const inp of inputs) {
    if (!isVisible(inp)) continue;
    const r = inp.getBoundingClientRect();
    if (lastInputBottom === null || r.bottom > lastInputBottom) lastInputBottom = r.bottom;
  }
  const ctaDistanceFromLastInputPx =
    ctaRect && lastInputBottom !== null ? Math.round(ctaRect.top - lastInputBottom) : null;

  // ---- content units visible in the first viewport (repeated-structure heuristic) --
  function rectIntersectsViewport(r) {
    return r.bottom > 0 && r.top < viewportH && r.right > 0 && r.left < viewportW;
  }
  let bestCount = 0;
  let bestMatching = [];
  const candidates = all.filter((el) => el.children.length >= 3);
  for (const el of candidates) {
    const kids = Array.from(el.children);
    const sig = {};
    for (const k of kids) {
      const cls = (k.className || '').toString().split(' ').slice(0, 2).join('.');
      const key = k.tagName + ':' + cls;
      sig[key] = sig[key] || [];
      sig[key].push(k);
    }
    for (const key of Object.keys(sig)) {
      if (sig[key].length >= 3 && sig[key].length > bestCount) {
        bestCount = sig[key].length;
        bestMatching = sig[key];
      }
    }
  }
  const contentUnitsFirstViewport = bestMatching.length
    ? bestMatching.filter((k) => rectIntersectsViewport(k.getBoundingClientRect())).length
    : null;

  return {
    textElementCount: textEls.length,
    distinctSizesCount: distinctSizes.length,
    distinctSizes,
    distinctWeightsCount: distinctWeights.length,
    distinctWeights,
    anchorSize,
    bodySize,
    anchorRatio,
    weightHighSharePct,
    photoPctFirstViewport,
    boxShadows: Array.from(shadows).slice(0, 15),
    borderRadii: Array.from(radii).slice(0, 15),
    sectionGapMedianPx,
    sectionGapSampleCount: gaps.length,
    stickyBottomBar,
    stickyCtaText,
    ctaFound: !!ctaEl,
    ctaText,
    ctaDistanceFromLastInputPx,
    contentUnitsFirstViewport,
  };
}

async function collectTransitionDurations(page) {
  return page
    .evaluate(() => {
      const set = new Set();
      document.querySelectorAll('body *').forEach((el) => {
        const d = getComputedStyle(el).transitionDuration;
        if (d && d !== '0s') set.add(d);
      });
      return Array.from(set).slice(0, 15);
    })
    .catch(() => []);
}

async function measureMotion(page) {
  const destructive = /delete|l.schen|cancel|stornieren|remove|entfernen|logout|abmelden|log out/i;
  let clicked = false;
  try {
    const handles = await page.$$('a, button, [role="button"]');
    for (const el of handles) {
      const box = await el.boundingBox().catch(() => null);
      if (!box) continue;
      if (box.y < 0 || box.y > VIEWPORT.height || box.width < 20 || box.height < 20) continue;
      const txt = (await el.innerText().catch(() => '')) || '';
      if (destructive.test(txt)) continue;
      await el.click({ timeout: 2000 }).catch(() => {});
      clicked = true;
      break;
    }
  } catch {
    /* best-effort only */
  }
  await page.waitForTimeout(350);
  const animationsAfterTap = await page.evaluate(() => document.getAnimations().length).catch(() => null);
  const transitionDurations = await collectTransitionDurations(page);
  return { tappedSomething: clicked, animationsAfterTap, transitionDurations };
}

async function measureCurrentPage(page, label, notes = [], opts = {}) {
  const { skipMotionTap = false } = opts;
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(collectMetricsInPage, [VIEWPORT.width, VIEWPORT.height]);
  // Capture the URL BEFORE any motion tap: a tap can navigate (e.g. a card link), and the
  // report must describe the screen the static metrics actually came from, not wherever the
  // tap happened to land.
  const url = page.url();
  const motion = skipMotionTap
    ? {
        tappedSomething: false,
        animationsAfterTap: null,
        transitionDurations: await collectTransitionDurations(page),
        skippedReason: 'mid-flow step: a probe tap risks corrupting booking-wizard state; animation-count-after-tap not measured here, transition-duration values are still real computed styles',
      }
    : await measureMotion(page);
  return { screen: label, tag: 'verified', notes, url, ...metrics, motion };
}

async function coldContext(browser) {
  return browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
}

function notMeasured(screen, g) {
  console.error(refusal(g.url, g));
  return { screen, tag: 'not-measured', reason: g.reason, attemptedUrl: g.url, status: g.status };
}

// A cookie-consent banner's own "Accept/Continue" control can sit earlier in the DOM than the
// booking wizard's sticky bar, so a generic `button:has-text("Continue")` lookup can click the
// banner instead of the wizard. Dismiss it once, right after guardedGoto/_measure-guard proves
// the real page loaded, before any further interaction.
async function dismissCookieBanner(page) {
  await page.waitForTimeout(400);
  const clicked = await page
    .evaluate(() => {
      const words = /accept|akzeptieren|zustimmen|alle akzeptieren|got it|einverstanden/i;
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => words.test(b.textContent || '') && b.offsetParent !== null
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })
    .catch(() => false);
  if (clicked) await page.waitForTimeout(300);
  return clicked;
}

// addFirstServiceToCart: clicks inside a wizard page that guardedGoto (see _measure-guard.mjs
// above) already proved is real. Handles the ServiceDetailSheet that opens for a service with
// addons/required options. Clicks fire via real DOM .click() calls in the page so React's event
// delegation picks them up. Returns true only if the cart summary shows a non-zero item count
// afterward: prove behavior, not existence, applied to a script step instead of a product filter.
async function addFirstServiceToCart(page) {
  const clicked = await page.evaluate(() => {
    const addButtons = Array.from(document.querySelectorAll('[aria-label]')).filter((b) =>
      /^add$/i.test(b.getAttribute('aria-label') || '')
    );
    if (!addButtons.length) return false;
    addButtons[0].click();
    return true;
  });
  if (!clicked) return false;
  await page.waitForTimeout(450);

  // A sheet may have opened (required option or addons). Pick a first option, then Done.
  await page.evaluate(() => {
    const doneBtn = Array.from(document.querySelectorAll('button')).find((b) => /^\s*done\s*$/i.test(b.textContent || ''));
    if (!doneBtn) return;
    const container =
      doneBtn.closest('[role="dialog"]') || doneBtn.parentElement?.parentElement?.parentElement || document.body;
    const candidates = Array.from(container.querySelectorAll('button')).filter(
      (b) => b !== doneBtn && !/remove|close/i.test(b.textContent || '') && b.offsetParent !== null
    );
    if (candidates.length) candidates[0].click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const doneBtn = Array.from(document.querySelectorAll('button')).find((b) => /^\s*done\s*$/i.test(b.textContent || ''));
    if (doneBtn) doneBtn.click();
  });
  await page.waitForTimeout(450);

  const cartText = await page.evaluate(() => document.body.innerText).catch(() => '');
  return /[1-9]\d*\s*item/i.test(cartText);
}

// ---------------------------------------------------------------------------
async function run() {
  const browser = await chromium.launch();
  const results = [];

  // --- home ---
  {
    const ctx = await coldContext(browser);
    const page = await ctx.newPage();
    const url = `${BASE_URL}/en`;
    const g = await guardedGoto(page, url, { expectSelector: 'main', minElements: 10 });
    results.push(g.ok ? await measureCurrentPage(page, 'home') : notMeasured('home', g));
    await ctx.close();
  }

  // --- search results ---
  {
    const ctx = await coldContext(browser);
    const page = await ctx.newPage();
    const url = `${BASE_URL}/en/basel/coiffeur`;
    const g = await guardedGoto(page, url, { expectSelector: 'main', minElements: 10 });
    results.push(g.ok ? await measureCurrentPage(page, 'search-results') : notMeasured('search-results', g));
    await ctx.close();
  }

  // --- salon page ---
  {
    const ctx = await coldContext(browser);
    const page = await ctx.newPage();
    const url = `${BASE_URL}/en/salon/${TEST_SALON_SLUG}`;
    const g = await guardedGoto(page, url, { expectSelector: 'main', minElements: 10 });
    results.push(g.ok ? await measureCurrentPage(page, 'salon-page') : notMeasured('salon-page', g));
    await ctx.close();
  }

  // --- booking flow: services -> staff -> time -> review, one continuous cold context ---
  // Every intermediate step skips the motion-probe tap (skipMotionTap: true): a stray click
  // inside a stateful wizard can derail the whole sequence (this bit a first attempt at this
  // script, see git history), so animation-count-after-tap is only measured on the standalone
  // screens where a click discards a whole-context page anyway.
  {
    const bookingCtx = await coldContext(browser);
    const page = await bookingCtx.newPage();
    const startUrl = `${BASE_URL}/en/salon/${TEST_SALON_SLUG}/booking`;
    const g0 = await guardedGoto(page, startUrl, { expectSelector: 'main', minElements: 10 });

    // The wizard is a client-side state machine on ONE url; if a click ever navigates us off
    // that url, the flow derailed (e.g. an exit control was hit instead of "Continue") and
    // every step after that point would silently measure the wrong screen. Stop and say so
    // rather than keep measuring: not-measured beats a mislabeled screen.
    function derailed() {
      return stripSlash(page.url()) !== stripSlash(startUrl);
    }
    function stripSlash(u) {
      return u.replace(/\/+$/, '');
    }

    if (!g0.ok) {
      results.push(notMeasured('booking-services', g0));
      results.push({ screen: 'booking-staff', tag: 'not-measured', reason: 'blocked: services step failed to load' });
      results.push({ screen: 'booking-time', tag: 'not-measured', reason: 'blocked: services step failed to load' });
      results.push({ screen: 'booking-review', tag: 'not-measured', reason: 'blocked: services step failed to load' });
    } else {
      try {
        // Dismiss any cookie-consent banner FIRST: its own "Accept" control can otherwise be
        // the element a generic `button:has-text("Continue")` lookup clicks instead of the
        // wizard's real sticky-bar Continue button, silently derailing every step after it.
        await dismissCookieBanner(page);

        // Step 1: services-staff step.
        results.push(await measureCurrentPage(page, 'booking-services', [], { skipMotionTap: true }));

        const addedToCart = await addFirstServiceToCart(page);
        if (!addedToCart || derailed()) {
          const reason = derailed()
            ? `wizard navigated to ${page.url()} instead of adding to cart`
            : 'clicking the first "Add" control never produced a non-zero cart item count (selector or sheet-flow mismatch)';
          results.push({ screen: 'booking-staff', tag: 'not-measured', reason });
          results.push({ screen: 'booking-time', tag: 'not-measured', reason });
          results.push({ screen: 'booking-review', tag: 'not-measured', reason });
        } else {
          const continue1 = await page.$('button:has-text("Continue")');
          if (continue1) await continue1.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(700);

          if (derailed()) {
            const reason = `wizard navigated to ${page.url()} after clicking Continue on the services step`;
            results.push({ screen: 'booking-staff', tag: 'not-measured', reason });
            results.push({ screen: 'booking-time', tag: 'not-measured', reason });
            results.push({ screen: 'booking-review', tag: 'not-measured', reason });
          } else {
            // Step 2: staff (skipped by the wizard if the salon has <=1 staff; "Any" is
            // pre-selected by default, so if this step renders the continue button is live).
            const staffHeading = await page.$('text=/stylist|staff|mitarbeiter/i').catch(() => null);
            if (staffHeading) {
              results.push(await measureCurrentPage(page, 'booking-staff', [], { skipMotionTap: true }));
              const continue2 = await page.$('button:has-text("Continue")');
              if (continue2) await continue2.click({ timeout: 2000 }).catch(() => {});
              await page.waitForTimeout(700);
            } else {
              results.push({
                screen: 'booking-staff',
                tag: 'not-measured',
                reason: 'staff step did not render (wizard auto-advanced, this salon likely has 1 staff member or the DOM markers changed)',
              });
            }

            if (derailed()) {
              const reason = `wizard navigated to ${page.url()} instead of reaching the datetime step`;
              results.push({ screen: 'booking-time', tag: 'not-measured', reason });
              results.push({ screen: 'booking-review', tag: 'not-measured', reason });
            } else {
              // Step 3: datetime
              results.push(await measureCurrentPage(page, 'booking-time', [], { skipMotionTap: true }));

              // Pick a date: first enabled date-strip button (aria-pressed present, not disabled).
              const dateBtn = await page.$('button[aria-pressed="false"]:not([disabled])').catch(() => null);
              if (dateBtn) {
                await dateBtn.click({ timeout: 2000 }).catch(() => {});
                await page.waitForTimeout(1100); // slots fetch
              }
              // Pick a time slot: first available option in the listbox.
              const slotOptions = await page.$$('[role="listbox"] [role="option"]');
              let pickedSlot = false;
              for (const opt of slotOptions) {
                const disabled = await opt.getAttribute('aria-disabled').catch(() => null);
                const label = (await opt.getAttribute('aria-label').catch(() => '')) || '';
                if (disabled === 'true' || /unavailable|nicht verf.gbar/i.test(label)) continue;
                await opt.click({ timeout: 2000 }).catch(() => {});
                pickedSlot = true;
                break;
              }
              await page.waitForTimeout(400);
              const continue3 = await page.$('button:has-text("Continue")');
              if (pickedSlot && continue3) {
                await continue3.click({ timeout: 2000 }).catch(() => {});
                await page.waitForTimeout(800);
              }

              // Optional hair step may appear between datetime and pay-confirm; skip it generically.
              const payMarker = await page.$('text=/pay|bezahlen|summary|zusammenfassung/i').catch(() => null);
              const continueHair = await page.$('button:has-text("Continue")');
              if (continueHair && !payMarker) {
                await continueHair.click({ timeout: 2000 }).catch(() => {});
                await page.waitForTimeout(800);
              }

              if (derailed()) {
                results.push({
                  screen: 'booking-review',
                  tag: 'not-measured',
                  reason: `wizard navigated to ${page.url()} instead of reaching the review/pay-confirm step`,
                });
              } else if (!pickedSlot) {
                results.push({
                  screen: 'booking-review',
                  tag: 'not-measured',
                  reason: 'no bookable slot was available to select, so the flow could not advance past the datetime step',
                });
              } else {
                // Step 4: review / pay-confirm summary. Measured but NEVER submitted (no card
                // entry, no submit-pay click) -- the hard stop named in the brief.
                results.push(
                  await measureCurrentPage(
                    page,
                    'booking-review',
                    ['pay-confirm summary screen; the Stripe payment step itself was never submitted (hard stop, no money spent)'],
                    { skipMotionTap: true }
                  )
                );
              }
            }
          }
        }
      } catch (e) {
        results.push({ screen: 'booking-flow', tag: 'not-measured', reason: `interaction failed mid-flow: ${String(e).slice(0, 300)}` });
      }
    }
    await bookingCtx.close();
  }

  // --- bookings list (signed in as customer) + confirmation (needs a real booking id) ---
  {
    const ctx = await coldContext(browser);
    const page = await ctx.newPage();
    // The real bookings list lives at /en/profile/bookings; /en/bookings has no page and falls through to the city route.
    const loginUrl = `${BASE_URL}/api/dev/login?to=${encodeURIComponent('/en/profile/bookings')}&email=${CUSTOMER_EMAIL}`;
    // The dev-login route 307-redirects to the target path, so redirects are expected here.
    const g = await guardedGoto(page, loginUrl, { expectSelector: 'main', minElements: 5, allowRedirect: true });

    if (!g.ok) {
      results.push(notMeasured('bookings-list', g));
      results.push({ screen: 'confirmation', tag: 'not-measured', reason: 'blocked: could not sign in as the seed customer' });
    } else {
      results.push(await measureCurrentPage(page, 'bookings-list'));

      // Try to recover a real booking id from the rendered list to drive /confirmation.
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
      // Links may carry the id as /bookings/<id> or ?booking_id=<id>; the list is client-rendered, so if no link
      // carries one, COMPARE_BOOKING_ID (a booking of the seed customer, set by the caller) is the fallback.
      const idPattern = /(?:bookings\/|booking_id=)([0-9a-fA-F-]{36})/;
      const ids = [
        ...new Set(hrefs.map((h) => (h && idPattern.exec(h) ? idPattern.exec(h)[1] : null)).filter(Boolean)),
      ];
      if (ids.length === 0 && process.env.COMPARE_BOOKING_ID) ids.push(process.env.COMPARE_BOOKING_ID);

      let confirmationMeasured = false;
      let lastRefusal = null;
      for (const id of ids.slice(0, 5)) {
        const confirmUrl = `${BASE_URL}/en/confirmation?booking_id=${id}`;
        const gc = await guardedGoto(page, confirmUrl, { expectSelector: 'main', minElements: 10, allowRedirect: true });
        if (gc.ok) {
          results.push(
            await measureCurrentPage(page, 'confirmation', [`booking_id=${id} from the seeded customer's own bookings list`])
          );
          confirmationMeasured = true;
          break;
        }
        lastRefusal = gc;
      }
      if (!confirmationMeasured) {
        if (ids.length === 0) {
          results.push({
            screen: 'confirmation',
            tag: 'not-measured',
            reason: 'no booking ids found in hrefs on /en/profile/bookings and COMPARE_BOOKING_ID is not set (the list is client-rendered and links no booking id in its HTML)',
          });
        } else {
          results.push(notMeasured('confirmation', lastRefusal));
        }
      }
    }
    await ctx.close();
  }

  await browser.close();
  return results;
}

function toMarkdownTable(results) {
  const rows = results.map((r) => {
    if (r.tag === 'not-measured') {
      return `| ${r.screen} | not measured | ${(r.reason || '').replace(/\|/g, '/')} |`;
    }
    return (
      `| ${r.screen} | sizes ${r.distinctSizesCount} (${(r.distinctSizes || []).join(',')}) / weights ${r.distinctWeightsCount} (${(r.distinctWeights || []).join(',')}) ` +
      `| anchor ${r.anchorSize}px (body ${r.bodySize}px, ratio ${r.anchorRatio}x) ` +
      `| photo ${r.photoPctFirstViewport}% | weight>=600 ${r.weightHighSharePct}% | gap median ${r.sectionGapMedianPx}px (n=${r.sectionGapSampleCount}) ` +
      `| sticky-cta ${r.stickyBottomBar} | cta-to-last-input ${r.ctaDistanceFromLastInputPx}px | units-in-viewport ${r.contentUnitsFirstViewport} ` +
      `| shadows: ${(r.boxShadows || []).length} distinct | radii: ${(r.borderRadii || []).join(' / ')} ` +
      `| animations-after-tap ${r.motion ? r.motion.animationsAfterTap : 'n/a'} | transition-durations ${r.motion ? r.motion.transitionDurations.join(', ') : 'n/a'} |`
    );
  });
  return (
    '| screen | sizes/weights | anchor | photo% | weight>=600% | section gap | sticky CTA | CTA distance | content units | shadows/radii | motion |\n' +
    '|---|---|---|---|---|---|---|---|---|---|---|\n' +
    rows.join('\n')
  );
}

const results = await run();
const jsonPath = path.join(OUT_DIR, 'solen-measurements.json');
const mdPath = path.join(OUT_DIR, 'solen-measurements.md');
fs.writeFileSync(jsonPath, JSON.stringify({ baseUrl: BASE_URL, ranAt: new Date().toISOString(), results }, null, 2));
fs.writeFileSync(mdPath, toMarkdownTable(results));

console.log(JSON.stringify({ baseUrl: BASE_URL, ranAt: new Date().toISOString(), results }, null, 2));
console.log('\n--- markdown ---\n');
console.log(toMarkdownTable(results));
