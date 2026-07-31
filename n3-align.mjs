import { chromium } from 'playwright';
const url='file:///Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/n3-harness.html';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3});
await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(400);
const r=await p.evaluate(()=>{
  const cells=[...document.querySelectorAll('.dn3-tab')];
  return cells.map(c=>{
    const lab=c.querySelector('.dn3-tab-label').getBoundingClientRect();
    const art=c.querySelector('img')||c.querySelector('.dn3-i-menu');
    const a=art.getBoundingClientRect();
    return {label:c.textContent.trim(), labelTop:+lab.top.toFixed(1), artTop:+a.top.toFixed(1),
            artBottom:+a.bottom.toFixed(1), artH:+a.height.toFixed(1),
            cellW:+c.getBoundingClientRect().width.toFixed(1),
            labelW:+lab.width.toFixed(1)};
  });
});
console.log(JSON.stringify(r,null,1));
const lt=r.map(x=>x.labelTop); console.log('labelTop spread', (Math.max(...lt)-Math.min(...lt)).toFixed(1));
const ab=r.map(x=>x.artBottom); console.log('artBottom spread', (Math.max(...ab)-Math.min(...ab)).toFixed(1));
const at=r.map(x=>x.artTop); console.log('artTop spread', (Math.max(...at)-Math.min(...at)).toFixed(1));
console.log('overflow?', r.map(x=>x.labelW>x.cellW?x.label:null).filter(Boolean));
await b.close();
