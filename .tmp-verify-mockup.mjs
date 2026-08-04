import { chromium } from 'playwright';

const URL = 'https://card-albums-anne-mood.trycloudflare.com/_mockups/improve/category.html';
const SHOT_DIR = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/57967b14-3150-443c-a086-24ec109168b4/scratchpad';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);

// Current pane (default)
await page.screenshot({ path: `${SHOT_DIR}/mockup-current.png` });
const overflowCur = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}));

// Switch to Proposed
await page.click('#tPro');
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOT_DIR}/mockup-proposed.png` });

const data = await page.evaluate(() => {
  const overflow = {
    scrollWidth: document.getElementById('pPro').scrollWidth,
    clientWidth: document.getElementById('pPro').clientWidth,
    bodyScrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  };
  const icons = [];
  document.querySelectorAll('#pPro svg.lucide').forEach(svg => {
    const cs = getComputedStyle(svg);
    icons.push({ cap: cs.strokeLinecap, join: cs.strokeLinejoin });
  });
  const sizes = new Set();
  document.querySelectorAll('#pPro *').forEach(el => {
    const hasDirectText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (hasDirectText) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.top < 2000) sizes.add(getComputedStyle(el).fontSize);
    }
  });
  return { overflow, icons, distinctSizes: [...sizes] };
});

console.log(JSON.stringify({ overflowCur, ...data }, null, 2));
await browser.close();
