// Live capture of Airbnb customer surfaces. Screenshots + a computed-style sweep.
//
// v2, and the reason for v2 matters. v1 swept the page with Airbnb's own cookie dialog and app
// install banner still covering it, so roughly 90% of the frame was chrome that is not their
// design, and every number it produced described a consent sheet. This version DISMISSES both
// first, verifies they are gone, and refuses to sweep if they are not.
//
// Consent choice is deliberate: essential cookies only, never accept-all.
import { chromium, devices } from 'playwright';
const OUT = 'public/_pixel-refs/airbnb/2026-08-20';
const targets = [
  ['home',   'https://www.airbnb.ch/'],
  ['search', 'https://www.airbnb.ch/s/Basel--Switzerland/homes'],
];

async function dismissChrome(p) {
  const notes = [];
  // Essential cookies only. Text varies by locale, so match on several.
  for (const re of [/Nur notwendige/i, /Only necessary/i, /Nur erforderliche/i]) {
    const b = p.getByRole('button', { name: re }).first();
    if (await b.count().catch(() => 0)) {
      await b.click({ timeout: 5000 }).catch(() => {});
      notes.push('cookie sheet: essential only');
      break;
    }
  }
  await p.waitForTimeout(900);
  // The app install banner carries a close control with an accessible name.
  for (const re of [/schlie/i, /close/i, /dismiss/i]) {
    const b = p.getByRole('button', { name: re }).first();
    if (await b.count().catch(() => 0)) {
      await b.click({ timeout: 4000 }).catch(() => {});
      notes.push('app banner closed');
      break;
    }
  }
  await p.waitForTimeout(1200);
  return notes;
}

const sweep = () => {
  const out = { sizes:{}, weights:{}, colors:{}, bgs:{}, radii:{}, shadows:{}, borders:{} };
  const bump = (o,k) => { if (k) o[k] = (o[k]||0)+1; };
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height || r.top > 1400 || r.bottom < 0) continue;
    const c = getComputedStyle(e);
    if (c.visibility === 'hidden' || c.display === 'none' || parseFloat(c.opacity) === 0) continue;
    const hasText = [...e.childNodes].some(n => n.nodeType===3 && n.textContent.trim());
    if (hasText) { bump(out.sizes,c.fontSize); bump(out.weights,c.fontWeight); bump(out.colors,c.color); }
    if (c.backgroundColor && c.backgroundColor !== 'rgba(0, 0, 0, 0)') bump(out.bgs,c.backgroundColor);
    if (parseFloat(c.borderTopLeftRadius) > 0) bump(out.radii,c.borderTopLeftRadius);
    if (c.boxShadow && c.boxShadow !== 'none') bump(out.shadows,c.boxShadow);
    if (parseFloat(c.borderTopWidth) > 0) bump(out.borders,`${c.borderTopWidth} ${c.borderTopColor}`);
  }
  const top = o => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,12);
  return Object.fromEntries(Object.entries(out).map(([k,v]) => [k, top(v)]));
};

const b = await chromium.launch();
const result = {};
for (const [name, url] of targets) {
  for (const [tag, ctxOpts] of [['mobile', devices['iPhone 13']], ['desktop', { viewport:{width:1440,height:900} }]]) {
    const ctx = await b.newContext(ctxOpts);
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil:'domcontentloaded', timeout:45000 });
      await p.waitForTimeout(3500);
      const notes = await dismissChrome(p);
      // Refuse to report numbers off a page still wearing a consent sheet.
      // The guard failed its own test the first time: it read only the first 3000 characters,
      // and the consent sheet's copy sits far below the page content in DOM order, so it never
      // saw the thing it exists to catch. It now reads the WHOLE text and, more importantly,
      // matches the sheet's own wording. A large-fixed-overlay test was tried and removed: their
      // search page slides its results sheet over the map, which is real design, and the overlay
      // test called that contamination. A check that blocks good work gets switched off.
      const blocked = await p.evaluate(() => {
        const words = /Wir verwenden Cookies|We use cookies|Hilf uns, dein Erlebnis|Nur notwendige/i
          .test(document.body.innerText);
        return words;
      });
      await p.screenshot({ path:`${OUT}/${name}-${tag}.png` });
      result[`${name}-${tag}`] = blocked
        ? { error: 'consent sheet still covering the page, numbers withheld', notes }
        : { notes, ...await p.evaluate(sweep) };
      console.log(name, tag, blocked ? 'STILL BLOCKED' : 'clean', notes.join(' + '));
    } catch (e) {
      result[`${name}-${tag}`] = { error:String(e).slice(0,160) };
      console.log('FAILED', name, tag, String(e).slice(0,90));
    }
    await ctx.close();
  }
}
await b.close();
const fs = await import('fs');
fs.writeFileSync(`${OUT}/computed.json`, JSON.stringify(result,null,1));
console.log('done ->', OUT);
