const { chromium } = require("playwright");

const URL = "http://127.0.0.1:52933/en/dev/terminal";

async function clickTab(page, name) {
  await page.locator(".sticky.top-0.z-30.bg-white").getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(200);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
  await page.goto(URL, { waitUntil: "networkidle" });

  console.log("=== Late ===");
  await clickTab(page, "Late");
  const lateCard = await page.locator('[class*="z-[10000]"]').innerText();
  console.log(lateCard.split("\n").filter(Boolean).slice(0, 40).join(" | "));

  console.log("\n=== Arrived ===");
  await clickTab(page, "Arrived");
  await page.waitForTimeout(200);
  const arrivedText = await page.locator('[class*="z-[10000]"]').innerText();
  console.log(arrivedText.split("\n").filter(Boolean).slice(0, 40).join(" | "));

  console.log("\n=== Log ===");
  await clickTab(page, "Log");
  const logRows = await page.locator('[class*="z-[10000]"] ul').last().locator("li").allInnerTexts();
  console.log("entry count:", logRows.length);
  logRows.forEach((t, i) => console.log(i, JSON.stringify(t)));

  await browser.close();
})();
