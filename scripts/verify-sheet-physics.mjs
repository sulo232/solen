// scripts/verify-sheet-physics.mjs
//
// LOCKFILE §16.5 verification law: gesture physics gets checked by a Playwright
// pointer-event script, never the Preview tab (it throttles rAF and lies about
// motion, memory `reference_preview_tab_raf_throttle`). Drives Sheet.tsx's grab
// handle with synthetic PointerEvents (page.evaluate) and asserts the three
// discriminating cases from the LOCKFILE + orchestrator brief:
//   (a) fast small flick (~30px / ~50ms) DISMISSES regardless of the small dy
//   (b) slow 150px drag then a ~40px upward move released while moving UP
//       returns home (stays open) regardless of the still-large dy
//   (c) dragging 60px above home rubber-bands (live |translateY| well under
//       the raw 60px pull), release settles home
//
// Usage: npm run build && npx next start -p 3210, then `node scripts/verify-sheet-physics.mjs`.
import { chromium } from "@playwright/test";

const BASE_URL = process.env.SHEET_VERIFY_URL || "http://localhost:3210/de/dev/primitives";

// Runs inside the page. Drives the grab handle through a list of {y, delayMs}
// samples (relative to the handle's current center), first a pointerdown at
// the handle, then a pointermove per sample, then pointerup.
async function drag(page, samples) {
  await page.evaluate(
    async ({ samples }) => {
      function dispatch(el, type, x, y) {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: "touch",
            clientX: x,
            clientY: y,
          }),
        );
      }
      const handle = document.querySelector('[aria-hidden="true"].cursor-grab');
      if (!handle) throw new Error("grab handle not found");
      const rect = handle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      dispatch(handle, "pointerdown", x, startY);
      for (const s of samples) {
        if (s.delayMs) await new Promise((r) => setTimeout(r, s.delayMs));
        dispatch(window, "pointermove", x, startY + s.dy);
      }
      dispatch(window, "pointerup", x, startY + samples[samples.length - 1].dy);
    },
    { samples },
  );
}

function readTranslateY(el) {
  return el.evaluate((node) => {
    const t = node.style.transform;
    const m = /translateY\(([-\d.]+)px\)/.exec(t || "");
    return m ? parseFloat(m[1]) : 0;
  });
}

async function openSheet(page) {
  await page.getByRole("button", { name: "Filter sheet öffnen" }).click();
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  return dialog;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  const results = [];

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // ---- case (a): fast small flick down (~30px over ~50ms) dismisses ----
    await openSheet(page);
    await drag(page, [
      { dy: 10, delayMs: 0 },
      { dy: 20, delayMs: 15 },
      { dy: 30, delayMs: 15 },
    ]);
    // dismiss spring (~0.3s) + the react-aria data-[exiting] CSS unmount (200ms).
    await page.waitForTimeout(900);
    const dialogCountA = await page.locator('[role="dialog"]').count();
    const passA = dialogCountA === 0;
    results.push(["(a) fast small flick dismisses", passA, `dialogs remaining=${dialogCountA}`]);

    // ---- case (b): slow 150px drag down, then ~40px back UP over ~80ms, ----
    // ---- released while still moving upward, returns home (stays open) ----
    const dialogB = await openSheet(page);
    await drag(page, [
      { dy: 40, delayMs: 0 },
      { dy: 90, delayMs: 60 },
      { dy: 150, delayMs: 60 },
      { dy: 130, delayMs: 30 },
      { dy: 110, delayMs: 30 },
    ]);
    await page.waitForTimeout(700);
    const dialogCountB = await page.locator('[role="dialog"]').count();
    const passB = dialogCountB === 1;
    let translateAfterB = null;
    if (passB) {
      translateAfterB = await readTranslateY(dialogB);
    }
    results.push([
      "(b) upward release returns home",
      passB,
      `dialogs remaining=${dialogCountB}, settled translateY=${translateAfterB}`,
    ]);
    if (passB) {
      // Close it cleanly for the next case (Escape, not the gesture under test).
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }

    // ---- case (c): drag 60px above home rubber-bands, then settles home ----
    const dialogC = await openSheet(page);
    await page.evaluate(async () => {
      function dispatch(el, type, x, y) {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: "touch",
            clientX: x,
            clientY: y,
          }),
        );
      }
      const handle = document.querySelector('[aria-hidden="true"].cursor-grab');
      const rect = handle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      dispatch(handle, "pointerdown", x, startY);
      // move up in a few steps to over 60px total, then leave the pointer down
      // so the caller can read the live (still-dragging) transform.
      dispatch(window, "pointermove", x, startY - 20);
      await new Promise((r) => setTimeout(r, 20));
      dispatch(window, "pointermove", x, startY - 40);
      await new Promise((r) => setTimeout(r, 20));
      dispatch(window, "pointermove", x, startY - 60);
    });
    // Read the live translateY directly off the dialog element while the
    // pointer is still down (drag() below issues the pointerup separately).
    const liveTranslate = Math.abs(await readTranslateY(dialogC));
    // release now (pointerup at the same -60 position)
    await page.evaluate(() => {
      const handle = document.querySelector('[aria-hidden="true"].cursor-grab');
      const rect = handle.getBoundingClientRect();
      handle.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: "touch",
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        }),
      );
    });
    await page.waitForTimeout(700);
    const dialogCountC = await page.locator('[role="dialog"]').count();
    const settledTranslateC = dialogCountC === 1 ? await readTranslateY(dialogC) : null;
    // Discriminating check: rubber-band must retain the sheet well clear of
    // the raw 60px pull, and settle back to (near) 0 after release.
    const passC =
      liveTranslate > 0 &&
      liveTranslate < 45 &&
      dialogCountC === 1 &&
      Math.abs(settledTranslateC ?? 999) < 2;
    results.push([
      "(c) rubber-band above home, settles home",
      passC,
      `live|translateY| during drag=${liveTranslate.toFixed(1)}px (raw pull 60px), settled=${settledTranslateC}`,
    ]);
  } finally {
    await browser.close();
  }

  console.log("\n=== Sheet §16.5 gesture-release physics verification ===");
  let allPass = true;
  for (const [name, pass, detail] of results) {
    if (!pass) allPass = false;
    console.log(`${pass ? "PASS" : "FAIL"}  ${name}  (${detail})`);
  }
  console.log(allPass ? "\nALL CASES PASS" : "\nSOME CASES FAILED");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[verify-sheet-physics] fatal:", err);
  process.exit(2);
});
