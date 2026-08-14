#!/usr/bin/env node
// scripts/app-parity.mjs
//
// THE LOOP'S CLOSE CONDITION, made runnable. Owner, 2026-08-14: "build out evrth as a loop for app
// so its 1to 1 from web".
//
// "1 to 1" is not a feeling, so this turns it into a number that can hit zero. It walks both route
// trees and prints every CUSTOMER web route that has no app equivalent. The loop dispatches
// builders while that list is non-empty and stops when it is empty. Re-run it any time; it reads
// the trees, it does not read a checklist that can go stale.
//
//   node scripts/app-parity.mjs            the gap list
//   node scripts/app-parity.mjs --all      also show what already matches, and what is excluded
//
// WHAT IS DELIBERATELY NOT A GAP, and why each one, because an honest denominator matters more
// than a flattering number:
//   dashboard/*      the salon-owner side. The owner picked the three CUSTOMER bundles.
//   dev/*            internal mockup and probe routes, ~60 of them, never shipped to anyone.
//   legal + marketing static pages. A phone app links out to these rather than reimplementing
//                    them, which is what every marketplace app does.
//   vouchers, gift cards. A killed feature: _design-system/REMOVED.md retired the purchase and
//                    redeem endpoints as a 410 stub with zero callers.
//   coming-soon      a gate, not a screen.
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const WEB = new URL("../app/[locale]", import.meta.url).pathname;
const APP = "/Users/sulo/Documents/solen-mobile/src/app";

const EXCLUDE = [
  /^dashboard(\/|$)/,
  /^dev(\/|$)/,
  /^(agb|impressum|datenschutz|terms|tos|privacy|legal\/|sicherheit)/,
  /^(business|fuer-salons|partner|presse|karriere|ueber-uns|warum-solen|blog|brand\/)/,
  /^(vouchers|profile\/vouchers|profile\/gift-cards|salon\/\[slug\]\/gift-card)/,
  /^(coming-soon|staff-invite|onboarding\/salon)/,
  // account/messages is the KILLED chat feature, not an inbox. REMOVED.md turned chat off on
  // 2026-06-13 and the web page is a dead redirect to /profile. A builder checked before building
  // it and skipped it, correctly. It was inflating the gap count by one, and a gap you must never
  // close is not a gap. The app's real inbox is `notifications`, which exists and is wired.
  /^account\/messages$/,
];

// A web route and its app counterpart do not always share a path. These are the real pairs, each
// one verified by opening both, not guessed from the name.
const ALIAS = {
  "": "(tabs)/index",
  search: "(tabs)/suche",
  inspo: "(tabs)/entdecken",
  "inspo/[id]": "inspo/[id]",
  "inspo/saved": "discover/saved",
  termine: "profile/bookings",
  profile: "(tabs)/profil",
  "profile/haarprofil": "profile/hair-profile",
  "profile/settings": "profile/settings",
  "profile/favorites": "profile/favorites",
  "profile/referral": "profile/referral",
  "profile/edit": "profile/settings",
  "salon/[slug]": "salon/[slug]",
  "salon/[slug]/booking": "booking",
  "salon/[slug]/reviews": "reviews/[slug]",
  reviews: "reviews/[slug]",
  rewards: "rewards",
  "loyalty/stamp": "rewards",
  "profile/stamps": "rewards",
  notifications: "notifications",
  onboarding: "onboarding",
  confirmation: "confirmation",
  "auth/login": "auth/login",
  "auth/signup": "auth/login",
  "auth/register": "auth/login",
  "[city]": "(tabs)/suche",
  "[city]/[category]": "(tabs)/suche",
  coiffeur: "(tabs)/suche",
  barbershop: "(tabs)/suche",
  nails: "(tabs)/suche",
  spa: "(tabs)/suche",
  "recently-viewed": "(tabs)/index",
  "walk-in-join": "walk-in-join",
  "walk-in-pay": "walk-in-pay",
  "queue/[token]": "queue/[token]",
  "walk-in-tip/[token]": "walk-in-tip/[token]",
};

function walk(root, filename, prefix = "") {
  const out = [];
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, filename, prefix ? `${prefix}/${entry}` : entry));
    } else if (entry === filename) {
      out.push(prefix);
    }
  }
  return out;
}

function appRoutes() {
  // Expo router: every .tsx under src/app is a route, minus layouts and the mocks tree.
  const out = [];
  const rec = (dir, prefix = "") => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === "mocks") continue;
        rec(full, prefix ? `${prefix}/${entry}` : entry);
      } else if (entry.endsWith(".tsx") && !entry.startsWith("_")) {
        const base = entry.replace(/\.tsx$/, "");
        out.push(prefix ? `${prefix}/${base}` : base);
      }
    }
  };
  rec(APP);
  return out;
}

const web = walk(WEB, "page.tsx").filter((r) => !EXCLUDE.some((re) => re.test(r)));
const app = new Set(appRoutes());
const showAll = process.argv.includes("--all");

const gaps = [];
const matched = [];
for (const r of web.sort()) {
  const target = ALIAS[r] ?? r;
  (app.has(target) ? matched : gaps).push([r, target]);
}

console.log(`WEB customer routes: ${web.length}   APP routes: ${app.size}`);
console.log(`MATCHED ${matched.length}   GAPS ${gaps.length}\n`);

if (gaps.length) {
  console.log("GAPS , a customer can do this on the web and not in the app:");
  for (const [r] of gaps) console.log(`  /${r}`);
} else {
  console.log("NO GAPS. Every customer web route has an app equivalent.");
}

if (showAll) {
  console.log("\nMATCHED:");
  for (const [r, t] of matched) console.log(`  /${r}  ->  ${t}`);
  const orphans = [...app].filter((a) => ![...matched, ...gaps].some(([, t]) => t === a));
  console.log("\nAPP ROUTES WITH NO WEB COUNTERPART (fine, or a leftover):");
  for (const o of orphans.sort()) console.log(`  ${o}`);
}

process.exit(gaps.length ? 1 : 0);
