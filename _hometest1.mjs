import { chromium } from 'playwright';
import fs from 'fs';

const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-design-system-consolidation-10167f/68d78dad-21dd-4632-a5a9-f1861516a718/scratchpad';
fs.mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log(...a);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'de-CH',
  });
  const page = await ctx.newPage();

  const consoleMsgs = [];
  const failedReqs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push({ t: m.type(), text: m.text().slice(0, 300) }); });
  page.on('pageerror', e => consoleMsgs.push({ t: 'pageerror', text: String(e).slice(0, 300) }));
  page.on('requestfailed', r => failedReqs.push({ url: r.url().slice(0, 200), err: r.failure()?.errorText }));
  page.on('response', r => { if (r.status() >= 400) failedReqs.push({ url: r.url().slice(0, 200), status: r.status() }); });

  log('## navigating');
  await page.goto('http://127.0.0.1:3000/de', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('main', { timeout: 180000 });
  await page.waitForTimeout(4000);

  // cookie banner
  try {
    const btn = page.getByRole('button', { name: /notwendige/i }).first();
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    log('## cookie banner dismissed');
  } catch (e) { log('## cookie banner NOT found:', String(e).slice(0, 120)); }
  await page.waitForTimeout(1500);

  // full scroll to trigger lazy content
  const scrollPass = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const marks = [];
    let y = 0;
    const step = 400;
    while (y < document.documentElement.scrollHeight) {
      window.scrollTo(0, y);
      await sleep(120);
      marks.push({ y, docH: document.documentElement.scrollHeight, bodySW: document.body.scrollWidth, bodyCW: document.body.clientWidth, deSW: document.documentElement.scrollWidth, deCW: document.documentElement.clientWidth });
      y += step;
      if (y > 40000) break;
    }
    window.scrollTo(0, 0);
    await sleep(600);
    return marks;
  });
  const overflowMarks = scrollPass.filter(m => m.deSW > m.deCW || m.bodySW > m.bodyCW);
  log('## docHeight final:', scrollPass[scrollPass.length - 1].docH);
  log('## HORIZONTAL OVERFLOW marks:', JSON.stringify(overflowMarks.slice(0, 5)));

  await page.waitForTimeout(2000);

  // sections + gaps
  const sections = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    // find the FeedZone / top-level structural children
    const out = [];
    const walk = (el, depth) => {
      for (const c of el.children) {
        const r = c.getBoundingClientRect();
        out.push({
          depth,
          tag: c.tagName,
          cls: (c.className && typeof c.className === 'string' ? c.className : '').slice(0, 90),
          top: Math.round(r.top + window.scrollY),
          bottom: Math.round(r.bottom + window.scrollY),
          h: Math.round(r.height),
          w: Math.round(r.width),
          text: (c.textContent || '').trim().slice(0, 60).replace(/\s+/g, ' '),
        });
      }
    };
    walk(main, 0);
    return out;
  });
  log('## MAIN children:');
  sections.forEach(s => log(`   ${s.tag} h=${s.h} w=${s.w} top=${s.top} "${s.text}" | ${s.cls}`));

  // images
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(i => {
      const r = i.getBoundingClientRect();
      return {
        src: (i.currentSrc || i.src || '').slice(-120),
        nw: i.naturalWidth, nh: i.naturalHeight,
        complete: i.complete,
        w: Math.round(r.width), h: Math.round(r.height),
        top: Math.round(r.top + window.scrollY),
        alt: (i.alt || '').slice(0, 40),
        display: getComputedStyle(i).display,
      };
    });
  });
  const brokenImgs = imgs.filter(i => i.w > 0 && i.h > 0 && i.nw === 0);
  log(`## IMAGES total=${imgs.length} broken(naturalWidth=0 while visible)=${brokenImgs.length}`);
  brokenImgs.forEach(i => log(`   BROKEN ${i.w}x${i.h} top=${i.top} alt="${i.alt}" src=${i.src}`));

  fs.writeFileSync(`${OUT}/sections.json`, JSON.stringify({ sections, imgs, consoleMsgs, failedReqs, scrollPass }, null, 2));

  log('## CONSOLE (errors/warnings):');
  const seen = new Set();
  consoleMsgs.forEach(m => { const k = m.t + m.text.slice(0, 100); if (!seen.has(k)) { seen.add(k); log(`   [${m.t}] ${m.text}`); } });
  log('## FAILED REQUESTS:');
  const seen2 = new Set();
  failedReqs.forEach(r => { const k = r.url + (r.status || r.err); if (!seen2.has(k)) { seen2.add(k); log(`   ${r.status || r.err} ${r.url}`); } });

  await page.screenshot({ path: `${OUT}/home-top.png` });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/home-bottom.png` });

  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
