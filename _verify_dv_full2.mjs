import { chromium } from 'playwright';
import fs from 'fs';

const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad';
const results = {};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);

// ---- StaffChip live measurement ----
results.staffChips = await page.evaluate(() => {
  const chips = [...document.querySelectorAll('[style*="width"]')].filter(el => {
    const s = el.getBoundingClientRect();
    return Math.abs(s.width - s.height) < 2 && s.width > 60 && s.width < 200;
  });
  return chips.map(chip => {
    const rect = chip.getBoundingClientRect();
    const ring = chip.querySelector('.rounded-full.border-s-ink, [class*="border-s-ink"]');
    const ringRect = ring ? ring.getBoundingClientRect() : null;
    const ringCs = ring ? getComputedStyle(ring) : null;
    const badge = chip.querySelector('span[aria-hidden="true"]');
    const badgeRect = badge ? badge.getBoundingClientRect() : null;
    const badgeCs = badge ? getComputedStyle(badge) : null;
    const avatarWrap = chip.querySelector('img, [class*="Avatar"], div > div');
    return {
      outer: { w: Math.round(rect.width), h: Math.round(rect.height) },
      ring: ring ? { w: Math.round(ringRect.width), h: Math.round(ringRect.height), borderWidth: ringCs.borderWidth } : null,
      badge: badge ? { w: Math.round(badgeRect.width), h: Math.round(badgeRect.height), bottomOffset: Math.round(rect.bottom - badgeRect.bottom), bg: badgeCs.backgroundColor } : null,
    };
  });
});

// ---- surfaces ----
results.surfaces = await page.evaluate(() => {
  const els = document.querySelectorAll('body *');
  const out = [];
  els.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 4) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        out.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,80), w: Math.round(rect.width), h: Math.round(rect.height), bg });
      }
    }
  });
  return out;
});

async function typeInfo() {
  return await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    const sizeSet = new Set(), weightSet = new Set();
    let totalChars = 0, boldChars = 0;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text) continue;
      const parent = node.parentElement;
      if (!parent || parent.closest('[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(parent);
      sizeSet.add(cs.fontSize);
      weightSet.add(cs.fontWeight);
      totalChars += text.length;
      if (parseInt(cs.fontWeight) >= 600) boldChars += text.length;
    }
    return { sizes: [...sizeSet].sort(), weights: [...weightSet].sort(), totalChars, boldChars, pct: totalChars ? (boldChars/totalChars*100).toFixed(1) : 0 };
  });
}
async function touchTargets() {
  return await page.evaluate(() => {
    const els = document.querySelectorAll('button, [role=button]');
    return [...els].map(el => {
      const rect = el.getBoundingClientRect();
      const label = el.getAttribute('aria-label') || el.textContent.trim();
      return { label: label.slice(0,40), h: Math.round(rect.height), w: Math.round(rect.width) };
    });
  });
}
async function overflowCheck() {
  return await page.evaluate(() => {
    const scroller = document.querySelector('.overflow-x-auto');
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      staffRowScrollWidth: scroller ? scroller.scrollWidth : null,
      staffRowClientWidth: scroller ? scroller.clientWidth : null,
    };
  });
}
async function barVsLastRow() {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(150);
  return await page.evaluate(() => {
    const bars = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed' && getComputedStyle(d).bottom !== 'auto' && d.getBoundingClientRect().width > 100 && d.getBoundingClientRect().width < 390);
    const bar = bars[bars.length-1];
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const rows = document.querySelectorAll('li, p, ul');
    const last = rows[rows.length-1];
    const lastRect = last ? last.getBoundingClientRect() : null;
    return {
      barTop: barRect ? Math.round(barRect.top) : null,
      lastBottom: lastRect ? Math.round(lastRect.bottom) : null,
      lastText: last ? last.textContent.trim().slice(0,50) : null,
      viewportH: window.innerHeight,
    };
  });
}

results.byView = {};
const views = [
  { key: 'board', label: 'Board' },
  { key: 'staff', label: 'Chairs' },
  { key: 'clock', label: 'Log' },
  { key: 'profile', label: 'This screen' },
];
for (const v of views) {
  await page.evaluate(() => window.scrollTo(0,0));
  if (v.key !== 'board') {
    await page.click(`button[aria-label="${v.label}"]`);
    await page.waitForTimeout(200);
  }
  results.byView[v.key] = {
    type: await typeInfo(),
    touch: await touchTargets(),
    overflow: await overflowCheck(),
    barVsLast: await barVsLastRow(),
  };
}
// back to board
await page.click('button[aria-label="Board"]');
await page.waitForTimeout(200);
await page.evaluate(() => window.scrollTo(0,0));

// ---- colour meaning: waiting rows on Board ----
results.waitingRows = await page.evaluate(() => {
  const items = [...document.querySelectorAll('li')];
  const out = [];
  items.forEach(li => {
    const spans = li.querySelectorAll('span');
    for (const s of spans) {
      const t = s.textContent.trim();
      if (/^\d+ min$/.test(t)) {
        out.push({ text: t, color: getComputedStyle(s).color });
      }
    }
  });
  return out;
});

results.staffChipsBoard = results.staffChips;

fs.writeFileSync(OUT + '/results-part2.json', JSON.stringify(results, null, 2));
console.log('PART2 DONE');
await browser.close();
