// Measures WHERE the search bar sits on every customer screen that carries one.
// Reads the LIVE rendered page, never the source.
//
// Selector note (2026-08-27): an earlier version of this script matched on the
// pill's TEXT (/such|search|bearbeiten/) and reported "no search control" on five
// of the seven routes. That was the instrument, not the product: outside the home
// and Inspo screens the pill shows the CURRENT search ("Coiffeur Basel"), not the
// word "Suche". Matching on shape instead (rounded, wide, near the top) finds all
// seven. Rule 15a, the known-answer control.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3457";
const ROUTES = [
  "/de",
  "/de/coiffeur",
  "/de/nails",
  "/de/spa",
  "/de/barbershop",
  "/de/inspo",
  "/de/basel/coiffeur",
];

let browser = null;
for (let attempt = 1; attempt <= 4 && !browser; attempt++) {
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error("[measure-search-bar] launch attempt " + attempt + " failed:", err.message.split("\n")[0]);
    await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
}
if (!browser) {
  console.error("[measure-search-bar] could not launch a browser after 4 tries");
  process.exit(1);
}

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

for (const route of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
  } catch (err) {
    console.error("[measure-search-bar] goto failed for " + route + ":", err.message.split("\n")[0]);
    continue;
  }
  await page.waitForTimeout(2200);
  const rows = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.top < -30 || r.top > 220) continue;
      if (r.width < 250 || r.height < 30 || r.height > 110) continue;
      const cs = getComputedStyle(el);
      if ((parseFloat(cs.borderTopLeftRadius) || 0) < 15) continue;
      let sticky = "static";
      let n = el;
      while (n && n !== document.body) {
        const q = getComputedStyle(n).position;
        if (q === "sticky" || q === "fixed") { sticky = q; break; }
        n = n.parentElement;
      }
      out.push({
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        radius: cs.borderTopLeftRadius,
        border: cs.borderTopWidth + " " + cs.borderTopColor,
        sticky,
        text: (el.textContent || "").trim().slice(0, 30),
      });
    }
    return out;
  });
  if (!rows.length) {
    console.log(route.padEnd(20), "NO SEARCH BAR ON THIS SCREEN");
  } else {
    for (const row of rows) console.log(route.padEnd(20), JSON.stringify(row));
  }
}

await browser.close();
