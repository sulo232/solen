import { chromium } from 'playwright';
import fs from 'fs';

const part = fs.readFileSync('/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/public/_mockups/parts/hdr.html','utf8');
const ids = ['hdr-stacked','hdr-pill','hdr-searchbar','hdr-minimal'];

const page = await (await chromium.launch()).newPage({ viewport:{width:390,height:844}, deviceScaleFactor:3 });
await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<style>*{margin:0;padding:0}body{font-family:Inter,system-ui}</style></head><body>${part}<div id="host"></div></body></html>`);

const out = {};
for (const id of ids) {
  await page.evaluate((id)=>{
    const h=document.getElementById('host'); h.innerHTML='';
    h.appendChild(document.getElementById(id).content.cloneNode(true));
  }, id);
  out[id] = await page.evaluate(()=>{
    const r = el => el ? el.getBoundingClientRect() : null;
    const root = document.querySelector('.hdr-root');
    const logo = document.querySelector('.hdr-logo');
    const tiles = [...document.querySelectorAll('.hdr-tile')];
    const field = document.querySelector('.hdr-field, .hdr-sb-field');
    const labels = document.querySelector('.hdr-field-labels');
    const bar = document.querySelector('.hdr-sb-bar');
    const go = document.querySelector('.hdr-go');
    const texts = [...document.querySelectorAll('.hdr-root *')]
      .filter(e=>e.children.length===0 && e.textContent.trim())
      .map(e=>({t:e.textContent.trim(), w:getComputedStyle(e).fontWeight, s:getComputedStyle(e).fontSize}));
    const lastLab = [...document.querySelectorAll('.hdr-lab')].pop();
    return {
      headerH: +r(root).height.toFixed(1),
      logoW: +r(logo).width.toFixed(1),
      logoRight: +r(logo).right.toFixed(1),
      firstTileLeft: tiles.length? +r(tiles[0]).left.toFixed(1):null,
      tileSizes: tiles.map(t=>`${r(t).width}x${r(t).height}`),
      searchFieldW: field? +r(field).width.toFixed(1):0,
      searchFieldH: field? +r(field).height.toFixed(1):0,
      labelsBoxW: labels? +r(labels).width.toFixed(1):0,
      labelsScrollW: labels? labels.scrollWidth:0,
      labelsOverflow: labels? labels.scrollWidth - Math.round(r(labels).width) : 0,
      lastLabelTruncated: lastLab? lastLab.scrollWidth > Math.ceil(lastLab.getBoundingClientRect().width) : false,
      barW: bar? +r(bar).width.toFixed(1):null,
      goW: go? +r(go).width.toFixed(1):null,
      texts,
      boldPct: (()=>{const n=texts.length; const b=texts.filter(t=>parseInt(t.w)>=600).length; return n? `${b}/${n} = ${Math.round(b/n*100)}%`:'0';})(),
    };
  });
}
console.log(JSON.stringify(out,null,1));
process.exit(0);
