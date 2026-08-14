#!/usr/bin/env node
// verify-killed-features , root-cause plan Phase C gate.
//
// "Killed" must mean the server refuses the request, not just that the UI hid the button. This
// asserts that every API route named in _design-system/REMOVED.md is actually DELETED or returns
// an early 410 , so a route can't be logged as dead in the graveyard while still executing live
// logic (the gift-card/voucher failure mode: purchase stayed alive while redeem was 410'd).
//
// Usage:  node scripts/verify-killed-features.mjs
// Exit:   0 if every graveyard-named route is deleted or 410'd, 1 otherwise.
import { readFileSync, existsSync } from "node:fs";

const REMOVED = "_design-system/REMOVED.md";
if (!existsSync(REMOVED)) process.exit(0);

const lines = readFileSync(REMOVED, "utf8").split("\n");
// A graveyard line can name a killed API route in EITHER style, and we must catch BOTH (an earlier
// version only matched the first and silently skipped 7 of 11 entries , council 2026-07-07):
//   (a) a literal file path, e.g.  app/api/vouchers/validate/route.ts  (or a dir -> /route.ts)
//   (b) an HTTP-method + URL path, e.g.  POST /api/vouchers/confirm disabled with 410
const FILE_RE = /\bapp\/api\/[A-Za-z0-9_\-/\[\].]+/g;
const URL_RE = /\b(?:GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[A-Za-z0-9_\-/\[\].]+)/g;
const is410 = (src) => /status:\s*410|["']Gone["']/.test(src);

// normalize any captured route reference to its route.ts file path
function toFile(ref) {
  let p = ref.replace(/^\//, "");                 // "/api/x" -> "api/x"
  if (p.startsWith("api/")) p = `app/${p}`;       // "api/x"  -> "app/api/x"
  p = p.replace(/\/+$/, "").replace(/\.$/, "");    // trim trailing slash/dot
  return p.endsWith("route.ts") ? p : `${p}/route.ts`;
}

const violations = [];
const seen = new Set();
for (const line of lines) {
  if (!line.trim().startsWith("-")) continue;
  const refs = [...(line.match(FILE_RE) || [])];
  for (const m of line.matchAll(URL_RE)) refs.push(m[1]);
  for (const ref of refs) {
    const file = toFile(ref);
    if (seen.has(file)) continue;
    seen.add(file);
    if (!existsSync(file)) continue; // deleted = correctly killed
    const src = readFileSync(file, "utf8");
    if (!is410(src)) violations.push(file);
  }
}

if (violations.length) {
  console.error(`verify-killed-features: ${violations.length} route(s) logged as REMOVED but still LIVE (no 410, not deleted):`);
  for (const v of violations) console.error(`  ${v}`);
  console.error("Either delete the file or make its handler return 410 early, then re-run.");
  process.exit(1);
}
console.log(`verify-killed-features: OK , every graveyard-named route (${seen.size}) is deleted or 410'd.`);
process.exit(0);
