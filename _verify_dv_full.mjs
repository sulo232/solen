import { chromium } from 'playwright';
import fs from 'fs';

const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad';
const results = {};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);

// ---- 2. Badge / avatar measurement on Board view ----
results.badge = await page.evaluate(() => {
  // find first avatar wrapper (relative div) containing the outline
  const outlineEl = document.querySelector('.rounded-full.border-2.border-s-ink');
  const badgeEl = document.querySelector('span[aria-hidden="true"]');
  const outlineRect = outlineEl ? outlineEl.getBoundingClientRect() : null;
  const badgeRect = badgeEl ? badgeEl.getBoundingClientRect() : null;
  const outlineCs = outlineEl ? getComputedStyle(outlineEl) : null;
  const badgeCs = badgeEl ? getComputedStyle(badgeEl) : null;
  const avatarImg = outlineEl ? outlineEl.querySelector('img, div') : null;
  const avatarRect = avatarImg ? avatarImg.getBoundingClientRect() : null;
  return {
    outline: outlineRect ? { w: outlineRect.width, h: outlineRect.height, top: outlineRect.top, bottom: outlineRect.bottom, left: outlineRect.left, right: outlineRect.right } : null,
    outlineBorderWidth: outlineCs ? outlineCs.borderWidth : null,
    badge: badgeRect ? { w: badgeRect.width, h: badgeRect.height, top: badgeRect.top, bottom: badgeRect.bottom, left: badgeRect.left, right: badgeRect.right } : null,
    badgeBg: badgeCs ? badgeCs.backgroundColor : null,
    avatarInner: avatarRect ? { w: avatarRect.width, h: avatarRect.height } : null,
    overshoot: outlineRect && badgeRect ? (badgeRect.bottom - outlineRect.bottom) : null,
  };
});

// ---- 3. Surfaces ----
results.surfaces = await page.evaluate(() => {
  const els = document.querySelectorAll('body *');
  const out = [];
  els.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 4) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        out.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,70), w: Math.round(rect.width), h: Math.round(rect.height), bg });
      }
    }
  });
  return out;
});

// ---- 4. Type sizes/weights per view (Board = already loaded) ----
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
results.typeByView = {};
results.typeByView.board = await typeInfo();

// ---- 5. Touch targets on Board ----
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
results.touchByView = {};
results.touchByView.board = await touchTargets();

// ---- 6. Horizontal overflow + staff row scroll ----
results.overflow = {};
results.overflow.board = await page.evaluate(() => {
  const scroller = document.querySelector('.overflow-x-auto');
  return {
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    staffRowScrollWidth: scroller ? scroller.scrollWidth : null,
    staffRowClientWidth: scroller ? scroller.clientWidth : null,
  };
});

// ---- 7. Colour meaning: waiting rows ----
results.waitingRows = await page.evaluate(() => {
  const items = [...document.querySelectorAll('li')];
  const out = [];
  items.forEach(li => {
    const spans = li.querySelectorAll('span');
    // find the minutes span (tabular-nums with "min")
    for (const s of spans) {
      const t = s.textContent.trim();
      if (/^\d+ min$/.test(t)) {
        out.push({ text: t, color: getComputedStyle(s).color, rowText: li.textContent.trim().slice(0,60) });
      }
    }
  });
  return out;
});

// staff badge colours on board
results.staffBadges = await page.evaluate(() => {
  const badges = [...document.querySelectorAll('span[aria-hidden="true"]')];
  return badges.map(b => ({ bg: getComputedStyle(b).backgroundColor, cls: b.className }));
});

// ---- 9. bottom bar vs last content row (board) ----
async function barVsContent() {
  return await page.evaluate(() => {
    const bars = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed' && getComputedStyle(d).bottom !== 'auto');
    const bar = bars[bars.length-1];
    const barRect = bar ? bar.getBoundingClientRect() : null;
    document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
    return { willScroll: true };
  });
}

// scroll to bottom and measure
async function scrollAndMeasureBar() {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  return await page.evaluate(() => {
    const bars = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed' && getComputedStyle(d).bottom !== 'auto' && d.getBoundingClientRect().width > 100);
    const bar = bars[bars.length-1];
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const lis = document.querySelectorAll('li, p');
    const last = lis[lis.length-1];
    const lastRect = last ? last.getBoundingClientRect() : null;
    return {
      barTop: barRect ? Math.round(barRect.top) : null,
      lastBottom: lastRect ? Math.round(lastRect.bottom) : null,
      lastText: last ? last.textContent.trim().slice(0,50) : null,
      viewportH: window.innerHeight,
      pageScrollHeight: document.body.scrollHeight,
    };
  });
}
results.barVsContent = {};
results.barVsContent.board = await scrollAndMeasureBar();
await page.evaluate(() => window.scrollTo(0,0));

fs.writeFileSync(OUT + '/results-part1.json', JSON.stringify(results, null, 2));
console.log('PART1 DONE');
await browser.close();
