#!/usr/bin/env node
//
// check-trust-floor , static check for LOCKFILE §17.6 / CLAUDE.md FLOORS LAW item 8
// (hierarchy-density-05): a screen carrying a paid commit action must render its
// cancellation/refund term in the DOM, not just define it in an i18n labels object.
//
//   Usage: node scripts/check-trust-floor.mjs
//
// Method: find files that render a real Stripe payment surface (WalkInPaymentForm,
// @stripe/react-stripe-js, PaymentElement, stripe.confirmPayment), then look for any
// locale-object key shaped like a cancellation/refund policy (cancel*polic*, Stornierung,
// Annulation, Annullamento/Cancellazione, refund*polic*). For each such key: count how
// many times it is referenced with a JSX-style accessor (`.keyName`) OUTSIDE the line(s)
// that DEFINE it inside a locale object (`keyName: "..."`). Zero outside references means
// the string exists but never renders , the exact bug found in
// app/[locale]/walk-in-pay/page.tsx (cancelPolicy defined 4x, rendered 0x, fixed 2026-07-27).
//
// Report-only (exit 0 unless --strict is passed). This is a heuristic, not a parser: a
// FLAG here is a prompt to go look, not proof of a bug, and a clean report is not proof
// the trust floor holds (a file with no cancellation-shaped key at all only WARNs).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const PROJECT_ROOT = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const STRICT = process.argv.includes("--strict");

const STRIPE_MARKERS = [
  "WalkInPaymentForm",
  "@stripe/react-stripe-js",
  "PaymentElement",
  "stripe.confirmPayment",
];

const POLICY_KEY_RE = /(\w*(?:cancel(?:lation)?|refund)\w*[Pp]olic\w*)\s*:\s*"/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

const appDir = join(PROJECT_ROOT, "app");
let files = [];
try {
  files = walk(appDir);
} catch {
  console.error(`check-trust-floor: could not walk ${appDir}`);
  process.exit(0);
}

const results = []; // { file, key, definitions, references, status }

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!STRIPE_MARKERS.some((m) => text.includes(m))) continue;

  const keys = new Set();
  for (const m of text.matchAll(POLICY_KEY_RE)) keys.add(m[1]);

  const relPath = relative(PROJECT_ROOT, file);

  if (keys.size === 0) {
    results.push({ file: relPath, key: null, status: "WARN" });
    continue;
  }

  for (const key of keys) {
    // Count definition sites (key: "...") vs total occurrences of the key as a whole word.
    const defRe = new RegExp(`\\b${key}\\s*:\\s*"`, "g");
    const defCount = (text.match(defRe) || []).length;
    const totalRe = new RegExp(`\\b${key}\\b`, "g");
    const totalCount = (text.match(totalRe) || []).length;
    const renderCount = totalCount - defCount;
    results.push({
      file: relPath,
      key,
      definitions: defCount,
      references: renderCount,
      status: renderCount > 0 ? "PASS" : "FAIL",
    });
  }
}

let anyFail = false;
console.log("check-trust-floor , cancellation/refund policy must render, not just be defined\n");
for (const r of results) {
  if (r.status === "WARN") {
    console.log(`WARN  ${r.file} , renders a Stripe payment surface but no cancellation/refund-policy-shaped label was found. Verify this flow genuinely needs none (LOCKFILE §17.6).`);
  } else if (r.status === "PASS") {
    console.log(`PASS  ${r.file} , ${r.key} defined ${r.definitions}x, rendered ${r.references}x`);
  } else {
    anyFail = true;
    console.log(`FAIL  ${r.file} , ${r.key} defined ${r.definitions}x but rendered 0x (trust floor violation, LOCKFILE §17.6)`);
  }
}

if (results.length === 0) {
  console.log("No Stripe-integrated payment surfaces found under app/.");
}

console.log(`\n${anyFail ? "FAIL" : "PASS"} , ${results.filter((r) => r.status === "FAIL").length} violation(s), ${results.filter((r) => r.status === "WARN").length} needing manual review.`);

process.exit(STRICT && anyFail ? 1 : 0);
