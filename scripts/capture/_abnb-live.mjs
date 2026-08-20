// Live capture of Airbnb customer surfaces. Screenshots + a computed-style sweep.
// Scratch output under public/_pixel-refs (gitignored); the durable spec is a .md file.
import { chromium, devices } from 'playwright';
const OUT = 'public/_pixel-refs/airbnb/2026-08-20';
const targets = [
  ['home',    'https://www.airbnb.ch/'],
  ['search',  'https://www.airbnb.ch/s/Basel--Switzerland/homes'],
];
const sweep = () => {
  const out = { sizes:{}, weights:{}, colors:{}, bgs:{}, radii:{}, shadows:{}, borders:{} };
  const bump=(o,k)=>{ if(k) o[k]=(o[k]||0)+1; };
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height || r.top > 1400) continue;
    const c = getComputedStyle(e);
    const hasText = [...e.childNodes].some(n => n.nodeType===3 && n.textContent.trim());
    if (hasText) { bump(out.sizes,c.fontSize); bump(out.weights,c.fontWeight); bump(out.colors,c.color); }
    if (c.backgroundColor && c.backgroundColor!=='rgba(0, 0, 0, 0)') bump(out.bgs,c.backgroundColor);
    if (parseFloat(c.borderTopLeftRadius)>0) bump(out.radii,c.borderTopLeftRadius);
    if (c.boxShadow && c.boxShadow!=='none') bump(out.shadows,c.boxShadow);
    if (parseFloat(c.borderTopWidth)>0) bump(out.borders,`${c.borderTopWidth} ${c.borderTopColor}`);
  }
  const top = o => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,12);
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,top(v)]));
};
const b = await chromium.launch();
const result = {};
for (const [name, url] of targets) {
  for (const [tag, ctxOpts] of [['mobile', devices['iPhone 13']], ['desktop', { viewport:{width:1440,height:900} }]]) {
    const ctx = await b.newContext(ctxOpts);
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil:'domcontentloaded', timeout:45000 });
      await p.waitForTimeout(4500);
      await p.screenshot({ path:`${OUT}/${name}-${tag}.png`, fullPage:false });
      result[`${name}-${tag}`] = await p.evaluate(sweep);
      console.log('captured', name, tag);
    } catch (e) { result[`${name}-${tag}`] = { error:String(e).slice(0,160) }; console.log('FAILED', name, tag, String(e).slice(0,90)); }
    await ctx.close();
  }
}
await b.close();
const fs = await import('fs');
fs.writeFileSync(`${OUT}/computed.json`, JSON.stringify(result,null,1));
console.log('done ->', OUT);
