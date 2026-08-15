const { chromium } = require("playwright");

const URL = "http://127.0.0.1:52933/en/dev/terminal";
const VIEWPORTS = [
  { name: "402x874", width: 402, height: 874 },
  { name: "1024x820", width: 1024, height: 820 },
];
const STATES = ["Quiet", "New booking", "Move", "Late", "Arrived", "Undo", "Log"];

async function measure(page, label) {
  const data = await page.evaluate(() => {
    function isVisible(el) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") return false;
      return true;
    }
    const root = document.querySelector('[class*="z-[10000]"]') || document.body;
    const all = Array.from(root.querySelectorAll("*"));
    const sizes = new Set();
    const weights = new Set();
    let totalChars = 0;
    let boldChars = 0;
    let maxSize = 0;
    for (const el of all) {
      if (!isVisible(el)) continue;
      const text = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join("");
      if (!text) continue;
      const style = getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      const weight = parseInt(style.fontWeight, 10);
      sizes.add(size);
      weights.add(weight);
      if (size > maxSize) maxSize = size;
      totalChars += text.length;
      if (weight >= 600) boldChars += text.length;
    }
    const root2 = document.querySelector('[class*="z-[10000]"]') || document.body;
    const interactive = Array.from(root2.querySelectorAll("button, a, [role=button]"));
    const under44 = [];
    for (const el of interactive) {
      if (!isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 44) under44.push({ text: el.textContent.trim().slice(0, 30), h: Math.round(r.height) });
    }
    const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    return {
      sizes: Array.from(sizes).sort((a, b) => a - b),
      weights: Array.from(weights).sort((a, b) => a - b),
      maxSize,
      boldPct: totalChars ? Math.round((boldChars / totalChars) * 1000) / 10 : 0,
      under44,
      overflowX,
    };
  });
  console.log(`  [${label}]`, JSON.stringify(data));
  return data;
}

async function clickTab(page, name) {
  await page.locator(".sticky.top-0.z-30.bg-white").getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(150);
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    console.log(`\n=== viewport ${vp.name} ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(URL, { waitUntil: "networkidle" });

    for (const state of STATES) {
      await clickTab(page, state);
      await measure(page, state);
    }

    await clickTab(page, "Quiet");
    const rowButtons = await page.locator("li button").all();
    if (rowButtons.length > 0) {
      await rowButtons[0].click();
      await page.waitForTimeout(150);
    }
    await measure(page, "Quiet (waiting row expanded)");

    if (rowButtons.length > 1) {
      const rowButtons2 = await page.locator("li button").all();
      const target = rowButtons2[rowButtons2.length - 1];
      if (target) {
        await target.click();
        await page.waitForTimeout(150);
      }
    }
    await measure(page, "Quiet (waiting+appointment row expanded)");

    await page.close();
  }

  console.log("\n=== undo bar test ===");
  const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await clickTab(page, "Undo");
  await page.waitForTimeout(300);
  const barVisible1 = await page.locator("text=marked no-show").isVisible().catch(() => false);
  console.log("undo bar visible after entering Undo tab:", barVisible1);
  const msg = await page.locator("text=marked no-show").first().textContent().catch(() => null);
  console.log("undo message:", msg);

  await page.locator(".fixed.inset-x-0.bottom-0.z-10").getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(200);
  const barVisibleAfterClick = await page.locator("text=marked no-show").isVisible().catch(() => false);
  console.log("undo bar visible after clicking Undo:", barVisibleAfterClick);

  await clickTab(page, "New booking");
  const pendingVisible = await page.locator("text=New request").isVisible().catch(() => false);
  console.log("pending booking restored (New request card visible):", pendingVisible);

  await clickTab(page, "Quiet");
  const rowButtons = await page.locator("li button").all();
  if (rowButtons.length > 0) {
    await rowButtons[0].click();
    await page.waitForTimeout(150);
    const doneBtn = page.locator('[class*="z-[10000]"]').getByRole("button", { name: "Done", exact: true }).first();
    if (await doneBtn.isVisible().catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(200);
      const visibleRightAfter = await page.locator(".fixed.inset-x-0.bottom-0.z-10").isVisible().catch(() => false);
      console.log("undo bar visible right after Done click:", visibleRightAfter);
      await page.waitForTimeout(10500);
      const visibleAfter10s = await page.locator(".fixed.inset-x-0.bottom-0.z-10").isVisible().catch(() => false);
      console.log("undo bar visible after 10.5s (should be false):", visibleAfter10s);
    } else {
      console.log("no Done button found to test countdown");
    }
  }

  await browser.close();
})();
