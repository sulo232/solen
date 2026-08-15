import { chromium } from "@playwright/test";
const URL = "http://127.0.0.1:52933/en/dev/terminal";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

const detail = await page.evaluate(() => {
  const root = document.querySelector('div.fixed.inset-0');
  const pauseBtn = Array.from(root.querySelectorAll('button')).find(b => b.textContent.trim() === 'Pause queue');
  const cs = getComputedStyle(pauseBtn);
  const parent = pauseBtn.parentElement;
  const parentCs = getComputedStyle(parent);
  return {
    outerHTML: pauseBtn.outerHTML,
    height: cs.height,
    minHeight: cs.minHeight,
    lineHeight: cs.lineHeight,
    padding: cs.padding,
    boxSizing: cs.boxSizing,
    display: cs.display,
    alignSelf: cs.alignSelf,
    parentClass: parent.className,
    parentAlignItems: parentCs.alignItems,
    parentHeight: parentCs.height,
    rect: pauseBtn.getBoundingClientRect().toJSON ? JSON.stringify(pauseBtn.getBoundingClientRect()) : null,
  };
});
console.log(JSON.stringify(detail, null, 2));
await page.screenshot({ path: "/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad/shots/header-closeup.png", clip: { x: 0, y: 0, width: 402, height: 100 } });
await browser.close();
