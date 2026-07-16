#!/usr/bin/env node
// scripts/capture/record-interaction.mjs , the missing motion-capture primitive for
// reference-lock: records a real video of a live-site interaction (headless Chromium via
// Playwright) and dumps its before/after animation timeline (computed transition/transform/
// shadow + document.getAnimations()). Browser bootstrap mirrors scripts/mcp/site-tester.
//
// Usage: node scripts/capture/record-interaction.mjs <url> <outdir>
//   [--viewport 1440x900|390x844] [--action none|hover|click|scroll]
//   [--selector "<css>"] [--pre-click "<css>"] [--wait-ms 2500] [--settle-ms 1500]
import { chromium } from "playwright";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const [url, outdir, ...rest] = argv;
  const opts = { viewport: "1440x900", action: "none", selector: null, preClick: null, waitMs: 2500, settleMs: 1500 };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--viewport") opts.viewport = rest[++i];
    else if (a === "--action") opts.action = rest[++i];
    else if (a === "--selector") opts.selector = rest[++i];
    else if (a === "--pre-click") opts.preClick = rest[++i];
    else if (a === "--wait-ms") opts.waitMs = Number(rest[++i]);
    else if (a === "--settle-ms") opts.settleMs = Number(rest[++i]);
  }
  return { url, outdir, opts };
}

function parseViewport(v) {
  const m = /^(\d+)x(\d+)$/.exec(v || "");
  if (!m) throw new Error(`invalid --viewport "${v}", expected WIDTHxHEIGHT e.g. 1440x900`);
  return { width: Number(m[1]), height: Number(m[2]) };
}

// Runs INSIDE the page. Every property access is try/catch guarded (cross-origin / missing
// selector / unsupported Animation API must never throw the dump).
async function dumpAnimations(page, selector) {
  return page.evaluate((sel) => {
    function safeStyle(el) {
      if (!el) return null;
      try {
        const cs = getComputedStyle(el);
        return { transition: cs.transition, transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration,
          transitionTimingFunction: cs.transitionTimingFunction, transform: cs.transform, boxShadow: cs.boxShadow, opacity: cs.opacity };
      } catch (e) { return null; }
    }
    let el = null;
    try { el = sel ? document.querySelector(sel) : null; } catch (e) { el = null; }
    let animations = [];
    try {
      animations = document.getAnimations().map((a) => {
        let timing = null, keyframes = null, target = null;
        try { timing = a.effect ? a.effect.getTiming() : null; } catch (e) {}
        try { keyframes = a.effect && typeof a.effect.getKeyframes === "function" ? a.effect.getKeyframes() : null; } catch (e) {}
        try { target = a.effect && a.effect.target ? a.effect.target.tagName + "." + (a.effect.target.className || "") : null; } catch (e) {}
        return { name: a.animationName || a.id || null, playState: a.playState, timing, keyframes, target };
      });
    } catch (e) { animations = []; }
    return { element: safeStyle(el), animations };
  }, selector);
}

async function closeQuiet(context, browser) {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}

async function main() {
  const { url, outdir, opts } = parseArgs(process.argv.slice(2));
  if (!url || !outdir) {
    console.error('Usage: node scripts/capture/record-interaction.mjs <url> <outdir> [--viewport 1440x900|390x844] ' +
      '[--action none|hover|click|scroll] [--selector "<css>"] [--pre-click "<css>"] [--wait-ms 2500] [--settle-ms 1500]');
    process.exit(1);
  }
  const viewport = parseViewport(opts.viewport);
  const absOutdir = resolve(outdir);
  if (!existsSync(absOutdir)) mkdirSync(absOutdir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, recordVideo: { dir: absOutdir, size: viewport } });
  const page = await context.newPage();
  const video = page.video();

  try {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (err) {
      console.error(`[record-interaction] navigation to ${url} failed: ${err.message || err}`);
      await closeQuiet(context, browser);
      process.exit(1);
    }
    await page.waitForTimeout(opts.waitMs);
    if (opts.preClick) {
      try {
        await page.click(opts.preClick, { timeout: 3000 });
        await page.waitForTimeout(800);
      } catch (err) {
        console.error(`[record-interaction] --pre-click "${opts.preClick}" not found or not clickable, continuing: ${err.message || err}`);
      }
    }
    const before = await dumpAnimations(page, opts.selector);
    if (opts.action !== "none") {
      try {
        if (opts.action === "hover" && opts.selector) await page.hover(opts.selector);
        else if (opts.action === "click" && opts.selector) await page.click(opts.selector);
        else if (opts.action === "scroll") await page.mouse.wheel(0, 600);
        else console.error(`[record-interaction] --action "${opts.action}" needs a --selector, skipping the action`);
      } catch (err) {
        console.error(`[record-interaction] action "${opts.action}" on "${opts.selector}" failed, continuing: ${err.message || err}`);
      }
    }
    await page.waitForTimeout(opts.settleMs);
    const after = await dumpAnimations(page, opts.selector);
    const animationsPath = join(absOutdir, "animations.json");
    writeFileSync(animationsPath, JSON.stringify(
      { before, after, url, action: opts.action, selector: opts.selector, viewport: opts.viewport, capturedAt: new Date().toISOString() }, null, 2));

    await context.close();
    await browser.close();
    const capturePath = join(absOutdir, "capture.webm");
    renameSync(await video.path(), capturePath);
    console.log(`capture.webm: ${capturePath}`);
    console.log(`animations.json: ${animationsPath}`);
    console.log("ffmpeg -y -i capture.webm -vf fps=30 frames/%03d.png");
  } catch (err) {
    console.error(`[record-interaction] fatal error: ${err.message || err}`);
    await closeQuiet(context, browser);
    process.exit(1);
  }
}

main();
