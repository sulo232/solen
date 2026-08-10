#!/usr/bin/env node
// scripts/capture/harvest-lottie.mjs , reference-lock rung 1 for MOTION on icon systems.
// Loads a list of live URLs, scrolls them to fire lazy loads, and saves every Lottie
// animation JSON the page actually fetched (signature: fr + ip + op + layers) plus the
// WAAPI/CSS animation timeline and the DOM hosts (lottie-player, canvas, svg[data-*]).
// A Lottie JSON is frame-by-frame ground truth: fps, in/out frames, per-property keyframe
// times and bezier handles. That beats eyeballing a video.
//
// A page that did not really load gets NO report: guardedGoto rules out error status,
// cross-URL redirect, an error UI at status 200, and a not-yet-rendered body. Refusals are
// printed and recorded, never silently counted as "no animations found".
//
// Usage: node scripts/capture/harvest-lottie.mjs <outdir> <url> [url...] [--viewport WxH]
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const outdirArg = argv.shift();
if (!outdirArg) {
  console.error("Usage: node scripts/capture/harvest-lottie.mjs <outdir> <url> [url...] [--viewport WxH]");
  process.exit(1);
}
let viewport = { width: 1440, height: 900 };
const urls = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--viewport") {
    const m = /^(\d+)x(\d+)$/.exec(argv[++i] || "");
    if (m) viewport = { width: Number(m[1]), height: Number(m[2]) };
  } else urls.push(argv[i]);
}
const outdir = resolve(outdirArg);
if (!existsSync(outdir)) mkdirSync(outdir, { recursive: true });
const jsonDir = join(outdir, "lottie");
if (!existsSync(jsonDir)) mkdirSync(jsonDir, { recursive: true });

const ERROR_UI = /(application error|something went wrong|internal server error|page not found|this page isn.t available|access denied|are you a robot|unusual traffic)/i;

// The four ways a measurement lies: bad status, redirected elsewhere, error UI at 200,
// nothing rendered. All four are refusals, not results.
async function guardedGoto(page, url) {
  let res;
  try {
    res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (e) {
    return { ok: false, reason: "navigation threw", detail: e.message.split("\n")[0] };
  }
  const status = res ? res.status() : 0;
  if (!res) return { ok: false, reason: "no response object" };
  if (status >= 400) return { ok: false, reason: "http status", detail: String(status) };
  const finalUrl = page.url();
  const sameHost = (a, b) => { try { return new URL(a).host === new URL(b).host; } catch { return false; } };
  if (!sameHost(finalUrl, url)) return { ok: false, reason: "redirected off-host", detail: `${url} -> ${finalUrl}` };
  await page.waitForTimeout(3500);
  const body = await page.evaluate(() => ({
    text: (document.body?.innerText || "").slice(0, 4000),
    els: document.body ? document.body.querySelectorAll("*").length : 0,
  })).catch(() => ({ text: "", els: 0 }));
  if (body.els < 40) return { ok: false, reason: "nothing rendered", detail: `${body.els} elements` };
  const m = ERROR_UI.exec(body.text);
  if (m) return { ok: false, reason: "error UI at status " + status, detail: m[0] };
  return { ok: true, status, finalUrl, els: body.els };
}

function refusal(url, g) {
  return `REFUSED  ${url}\n         ${g.reason}${g.detail ? ": " + g.detail : ""}  (no report emitted for this URL)`;
}

function looksLottie(o) {
  return o && typeof o === "object" && Array.isArray(o.layers) &&
    typeof o.fr === "number" && typeof o.ip === "number" && typeof o.op === "number";
}

function slug(s) {
  return s.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
}

const manifest = [];
const seen = new Set();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  locale: "en-US",
});

context.on("response", async (res) => {
  const url = res.url();
  if (seen.has(url)) return;
  const ct = (res.headers()["content-type"] || "").toLowerCase();
  const isJsonish = ct.includes("json") || /\.json(\?|$)/.test(url) || /\.lottie(\?|$)/.test(url);
  if (!isJsonish) return;
  let body;
  try { body = await res.text(); } catch { return; }
  if (body.length > 8_000_000) return;
  let parsed;
  try { parsed = JSON.parse(body); } catch { return; }
  const candidates = looksLottie(parsed) ? [parsed] : [];
  if (!candidates.length && parsed && typeof parsed === "object") {
    for (const v of Object.values(parsed)) if (looksLottie(v)) candidates.push(v);
  }
  if (!candidates.length) return;
  seen.add(url);
  candidates.forEach((anim, i) => {
    const name = `${slug(url)}${candidates.length > 1 ? `.${i}` : ""}.json`;
    writeFileSync(join(jsonDir, name), JSON.stringify(anim));
    manifest.push({ file: name, url, nm: anim.nm || null, fr: anim.fr, ip: anim.ip, op: anim.op, w: anim.w, h: anim.h, layers: anim.layers.length });
    console.log(`LOTTIE  ${name}  fr=${anim.fr} ip=${anim.ip} op=${anim.op} layers=${anim.layers.length}  <- ${url.slice(0, 110)}`);
  });
});

const pageReports = [];
const refusals = [];
for (const url of urls) {
  const page = await context.newPage();
  console.log(`\n=== ${url}`);
  const g = await guardedGoto(page, url);
  if (!g.ok) {
    console.log(refusal(url, g));
    refusals.push({ url, ...g });
    await page.close().catch(() => {});
    continue;
  }
  try {
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 700));
      }
      window.scrollTo(0, 0);
    });
  } catch {}
  await page.waitForTimeout(2500);

  let report = null;
  try {
    report = await page.evaluate(() => {
      const hosts = [];
      const sel = "lottie-player, dotlottie-player, [data-testid*='lottie' i], [class*='lottie' i], [id*='lottie' i]";
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        hosts.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 120), src: el.getAttribute("src") || el.getAttribute("data-src") || null, w: Math.round(r.width), h: Math.round(r.height) });
      });
      const anims = document.getAnimations().map((a) => {
        let t = null, kf = null, tgt = null;
        try { t = a.effect ? a.effect.getTiming() : null; } catch {}
        try { kf = a.effect?.getKeyframes ? a.effect.getKeyframes() : null; } catch {}
        try { tgt = a.effect?.target ? a.effect.target.tagName.toLowerCase() + "." + (a.effect.target.className || "").toString().slice(0, 60) : null; } catch {}
        return { name: a.animationName || a.id || null, playState: a.playState, timing: t, keyframes: kf, target: tgt };
      });
      const recipes = {};
      document.querySelectorAll("button, a, [role='button'], svg, img, div").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.transitionDuration && cs.transitionDuration !== "0s") {
          const k = `${cs.transitionProperty} | ${cs.transitionDuration} | ${cs.transitionTimingFunction} | ${cs.transitionDelay}`;
          recipes[k] = (recipes[k] || 0) + 1;
        }
      });
      return { title: document.title, hosts, anims, recipes, svgCount: document.querySelectorAll("svg").length,
        hasLottieLib: !!(window.lottie || window.bodymovin || window.dotLottie) };
    });
  } catch (e) {
    report = { error: e.message };
  }
  pageReports.push({ url, guard: g, ...report });
  console.log(`  OK status=${g.status} els=${g.els} title="${report?.title || "?"}" lottieHosts=${report?.hosts?.length ?? "?"} waapi=${report?.anims?.length ?? "?"} lottieLib=${report?.hasLottieLib} svgs=${report?.svgCount}`);
  try { await page.screenshot({ path: join(outdir, `${slug(url)}.png`), fullPage: false }); } catch {}
  await page.close().catch(() => {});
}

writeFileSync(join(outdir, "manifest.json"), JSON.stringify({ capturedAt: new Date().toISOString(), viewport, manifest, pageReports, refusals }, null, 2));
console.log(`\nsaved ${manifest.length} lottie file(s) -> ${jsonDir}`);
console.log(`pages measured: ${pageReports.length}   refused: ${refusals.length}`);
await context.close().catch(() => {});
await browser.close().catch(() => {});
