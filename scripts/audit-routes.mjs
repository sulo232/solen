#!/usr/bin/env node
// audit-routes , root-cause plan Phase A gate.
//
// Flags mutating API routes (POST/PATCH/PUT/DELETE) that are missing a security guard, so a new
// route can't ship without auth + rate-limiting. Recognizes the FULL set of auth signals in this
// codebase (session, service-role+ownership, bespoke helpers, cron secret) so it doesn't overcount
// a route that authorizes via resolveBookingActor/requireUser the way a naive 4-helper grep did.
//
// Usage:  node scripts/audit-routes.mjs [--json]
// Exit:   0 if no HIGH gaps, 1 if any HIGH gap (so it can gate a commit / CI job).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const API_DIR = "app/api";
const MUTATING = ["POST", "PATCH", "PUT", "DELETE"];

// Any ONE of these present = the route has *some* authorization (session, service-role+ownership,
// a bespoke helper, a signed webhook, a possession token, or the cron secret). Kept broad on purpose.
const AUTH_SIGNALS = [
  /getSession\s*\(/, /\.auth\.getUser\s*\(/, /getSessionUser\s*\(/, /resolveBookingActor\s*\(/,
  /verifyCronSecret\s*\(/, /requireUser\s*\(/, /requireAdmin\s*\(/, /getServerUser\s*\(/,
  /CRON_SECRET/, /owner_id\s*!==/, /owner_id\s*===/, /profiles.*\.role/, /resolveBookingAccess/,
  /constructEvent\s*\(/,                       // Stripe webhook signature auth
  /access_token/, /guest_token/, /token_hash/, /\.eq\(\s*["']token["']/, /x-cron-secret/, // possession-token auth
];
const RATE_SIGNAL = /applyRateLimit\s*\(/;
const CRON_SIGNAL = /verifyCronSecret\s*\(|CRON_SECRET/;
// Routes that legitimately have no auth AND no rate-limit: public auth endpoints (can't gate login on
// a session) and endpoints disabled with an early 410. Keep this list SHORT + reasoned , anything new
// landing here should be a deliberate decision, not a default.
const PUBLIC_ALLOWLIST = new Set([
  "app/api/auth/login/route.ts", "app/api/auth/logout/route.ts", "app/api/auth/signup/route.ts",
  "app/api/auth/verify-otp/route.ts", "app/api/auth/verify-phone/check/route.ts",
  "app/api/auth/verify-phone/send/route.ts",
  // Known incomplete in-memory MOCK stub (no DB, no persisted data), tracked in
  // _tasks/INCOMPLETE_FEATURES.md , needs a real table + auth before it is a real feature.
  "app/api/nail/hand-chart/route.ts",
]);
const DISABLED_410 = /status:\s*410|"Gone"/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name === "route.ts") out.push(p);
  }
  return out;
}

const files = walk(API_DIR);
const high = [];   // mutating route with NO auth signal at all
const med = [];    // mutating, authed, but no rate limit (and not a cron)
let mutating = 0;

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const methods = MUTATING.filter((m) => new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(src));
  if (methods.length === 0) continue;
  mutating++;
  const hasAuth = AUTH_SIGNALS.some((r) => r.test(src));
  const hasRate = RATE_SIGNAL.test(src);
  const isCron = CRON_SIGNAL.test(src);
  const norm = f.split("\\").join("/");
  const isPublicOk = PUBLIC_ALLOWLIST.has(norm) || DISABLED_410.test(src);
  // HIGH = FULLY OPEN: mutating with NEITHER auth NOR a rate limit, and not an allow-listed public
  // route. A public route that is at least rate-limited (a lead form, a beacon) is acceptable.
  if (!hasAuth && !hasRate && !isPublicOk) high.push({ file: f, methods });
  else if (hasAuth && !hasRate && !isCron) med.push({ file: f, methods });
}

const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify({ mutatingRoutes: mutating, high, med }, null, 2));
} else {
  console.log(`audit-routes: ${mutating} mutating routes scanned`);
  console.log(`\nHIGH , mutating routes with NO detectable auth signal (${high.length}):`);
  for (const h of high) console.log(`  ${h.file}  [${h.methods.join(",")}]`);
  console.log(`\nMEDIUM , authed but no rate limit, non-cron (${med.length}):`);
  for (const m of med) console.log(`  ${m.file}  [${m.methods.join(",")}]`);
  console.log(`\nBaseline today: HIGH=${high.length}, MEDIUM=${med.length}. Gate fails on HIGH.`);
}

process.exit(high.length > 0 ? 1 : 0);
