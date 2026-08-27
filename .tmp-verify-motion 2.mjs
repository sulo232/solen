import { chromium } from "playwright";

const URL = "http://localhost:3000/de/dev/motion";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  const resp = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("HTTP status:", resp?.status());

  await page.waitForSelector("h1", { timeout: 60000 });
  await page.waitForTimeout(500);

  const title = await page.textContent("h1");
  console.log("H1:", title);

  const demoCount = await page.locator("section:has(h2)").count();
  console.log("Demo card count:", demoCount);

  // ---- Demo 1: Tab switch, measure the sliding indicator's transform mid-animation ----
  const demo1 = page.locator("section", { hasText: "Tab switch" }).first();
  const indicators = demo1.locator("div.absolute.inset-y-1");
  const indicatorCount = await indicators.count();
  console.log("Tab switch indicators found:", indicatorCount);

  const beforeToday = await indicators.nth(0).evaluate((el) => getComputedStyle(el).transform);
  const beforeProposed = await indicators.nth(1).evaluate((el) => getComputedStyle(el).transform);
  console.log("Tab switch BEFORE click , today transform:", beforeToday, "| proposed transform:", beforeProposed);

  // click the Walk-in button in the TODAY toggle (first "Walk-in" text button inside demo1)
  await demo1.getByRole("button", { name: "Walk-in" }).first().click();

  // sample transform quickly (mid-animation) then settle
  await page.waitForTimeout(60);
  const midToday = await indicators.nth(0).evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(500);
  const afterToday = await indicators.nth(0).evaluate((el) => getComputedStyle(el).transform);
  console.log("Tab switch TODAY , mid(60ms):", midToday, "| settled:", afterToday);

  // click Proposed Walk-in (second Walk-in button)
  await demo1.getByRole("button", { name: "Walk-in" }).nth(1).click();
  await page.waitForTimeout(30);
  const midProposed = await indicators.nth(1).evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(300);
  const afterProposed = await indicators.nth(1).evaluate((el) => getComputedStyle(el).transform);
  console.log("Tab switch PROPOSED , mid(30ms):", midProposed, "| settled:", afterProposed);

  // ---- Demo 5: Press feedback, measure scale mid-press ----
  const demo5 = page.locator("section", { hasText: "Press feedback" }).first();
  const buttons = demo5.getByRole("button", { name: "Book now" });
  console.log("Press feedback buttons found:", await buttons.count());

  const restToday = await buttons.nth(0).evaluate((el) => getComputedStyle(el).transform);
  console.log("Press feedback TODAY rest transform:", restToday);

  // press-and-hold using mouse to trigger whileTap, then read mid-press transform
  const box0 = await buttons.nth(0).boundingBox();
  await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(90);
  const pressedToday = await buttons.nth(0).evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const releasedToday = await buttons.nth(0).evaluate((el) => getComputedStyle(el).transform);
  console.log("Press feedback TODAY , pressed(90ms):", pressedToday, "| released:", releasedToday);

  const box1 = await buttons.nth(1).boundingBox();
  await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(40);
  const pressedProposed = await buttons.nth(1).evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.up();
  await page.waitForTimeout(200);
  console.log("Press feedback PROPOSED , pressed(40ms):", pressedProposed);

  // ---- Demo 6: Title slide, screenshot before/after condensing ----
  const demo6 = page.locator("section", { hasText: "Title slide" }).first();
  await demo6.scrollIntoViewIfNeeded();
  const avatarWrap = demo6.locator("img").first();
  const beforeOpacity = await demo6.locator("div.flex.min-w-0.flex-1.items-center").first().evaluate((el) => getComputedStyle(el).opacity);
  console.log("Title slide BEFORE opacity (today name/avatar row):", beforeOpacity);
  await demo6.getByLabel(/Replay demo 6/).click();
  await page.waitForTimeout(220); // mid-way through the 420ms Today transition
  const midOpacity = await demo6.locator("div.flex.min-w-0.flex-1.items-center").first().evaluate((el) => getComputedStyle(el).opacity);
  console.log("Title slide MID (220ms into 420ms today) opacity:", midOpacity);
  await page.waitForTimeout(500);
  const afterOpacity = await demo6.locator("div.flex.min-w-0.flex-1.items-center").first().evaluate((el) => getComputedStyle(el).opacity);
  console.log("Title slide AFTER opacity:", afterOpacity);

  // Confirm Book CTA present in BOTH states (correction A) by checking it existed even before the click above's counterpart replay
  const bookCount = await demo6.getByText("Book", { exact: true }).count();
  console.log("Title slide Book CTA count (both Today+Proposed bars):", bookCount);

  // Confirm avatar (img) present for the condensed bar (correction B)
  console.log("Title slide <img> avatar count:", await demo6.locator("img").count());

  await page.screenshot({ path: "/private/tmp/claude-501/-Users-sulo-Documents-solen/41c4f162-f2ae-4fec-9ecc-b7d71a75e1bb/scratchpad/motion-full.png", fullPage: true });

  console.log("Console errors:", consoleErrors.length ? consoleErrors : "none");

  await browser.close();
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
