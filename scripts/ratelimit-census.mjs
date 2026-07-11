#!/usr/bin/env node
//
// RING 9: rate-limiter census. For every app/api/**/route.ts that exports a
// POST/PATCH/PUT/DELETE handler, checks whether the handler's body calls
// applyRateLimit(...)/checkRateLimit(...) (lib/ratelimit.ts), OR is gated some
// other way that makes an IP/user rate limiter redundant: CRON_SECRET (cron-only,
// unauthenticated-by-design but requires a secret header) or an admin-role check
// (requireAdmin()/requireRole([...'admin'...])/inline `profile.role !== "admin"`).
// Both of those count as COVERED for this census's purposes (an attacker without
// the cron secret or an admin session can't reach the handler at all, so a
// per-IP/per-user limiter adds little). READ-ONLY: writes _plans/RATELIMIT_CENSUS.md,
// touches no route files. Fixes for the worst offenders are a manual follow-up
// (ring 9 fixes the top 10 by hand, the rest is a memo for a later ring).
//
//   Run: node scripts/ratelimit-census.mjs (writes _plans/RATELIMIT_CENSUS.md)
//
// Classification per method (heuristic, good enough for a census memo, not a
// type-checker):
//   - "limiter:<name>" : the handler body calls applyRateLimit(<name>, ...) or
//                        checkRateLimit(<name>, ...). <name> is whichever limiter
//                        export from lib/ratelimit.ts is passed as the first arg.
//   - "cron-gated"     : the body reads CRON_SECRET (cron/GitHub-Actions-only route).
//   - "admin-gated"    : the body calls requireAdmin()/requireRole(...) or has an
//                        inline `profile.role !== "admin"` / `=== "admin"` check.
//   - "UNLIMITED"      : none of the above. Then sub-classified by exposure:
//       "public"        : no auth check found in the body (getUser()/requireAuth()/
//                         requireSalonOwner()/requireRole() all absent), reachable
//                         by anyone, no session needed.
//       "authenticated" : an auth check is present, but no rate limiter and no
//                         admin gate, reachable by any logged-in user.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude"]);

function walk(dir, filterFn, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue; // Finder/iCloud copy artifacts
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, filterFn, out);
    else if (filterFn(full, e.name)) out.push(full);
  }
  return out;
}

const rel = (p) => relative(REPO_ROOT, p).split(sep).join("/");

const METHODS = ["POST", "PATCH", "PUT", "DELETE"];
const METHOD_START_RE = (m) => new RegExp(`export\\s+async\\s+function\\s+${m}\\s*\\(`);

/** Extract a function body via brace matching, starting from a `startRe` match ending
 *  right before the function's `(` params. Works for both `function NAME(` and
 *  `const NAME = async (` declaration styles. */
function extractBodyByRegex(src, startRe) {
  const m = startRe.exec(src);
  if (!m) return null;
  const openParenIdx = src.indexOf("(", m.index);
  if (openParenIdx === -1) return null;
  let depth = 1;
  let i = openParenIdx + 1;
  for (; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")") {
      depth--;
      if (depth === 0) break;
    }
  }
  const braceStart = src.indexOf("{", i);
  if (braceStart === -1) return null;
  let depth2 = 0;
  let j = braceStart;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth2++;
    else if (src[j] === "}") {
      depth2--;
      if (depth2 === 0) return src.slice(braceStart, j + 1);
    }
  }
  return src.slice(braceStart);
}

function extractFunctionBody(src, methodName) {
  return extractBodyByRegex(src, METHOD_START_RE(methodName));
}

const LIMITER_CALL_RE = /\b(?:applyRateLimit|checkRateLimit)\s*\(\s*([A-Za-z0-9_.]+)/;
const CRON_SECRET_RE = /CRON_SECRET/;
const ADMIN_GATE_RE =
  /\brequireAdmin\s*\(|\brequireRole\s*\(\s*\[[^\]]*["']admin["']|\brequireRole\s*\(\s*["']admin["']|\.role\s*!==\s*["']admin["']|\.role\s*===\s*["']admin["']/;
// Direct auth signals + known central authorization resolvers imported from lib/ (these
// prove entitlement even though they don't literally call `.auth.getUser()` inline in the
// route body): resolveBookingActor (lib/bookings/authorize.ts, customer/salon/admin/guest).
const AUTH_CHECK_RE =
  /\.auth\.getUser\s*\(|\brequireAuth\s*\(|\brequireAdmin\s*\(|\brequireSalonOwner\s*\(|\brequireRole\s*\(|\bresolveBookingActor\s*\(/;

// Local helper functions defined IN THE SAME FILE that a route handler delegates its
// auth/rate-limit check to (e.g. a shared `async function authenticate() { ...
// applyRateLimit... }` called from GET/POST/PUT/DELETE). Direct per-method body scanning
// misses these because the limiter call lives in a different function's source range, so
// helper bodies are resolved once per file and merged into whichever method calls them.
const HELPER_DECL_RE = /(?:export\s+)?async\s+function\s+(\w+)\s*\(|\bconst\s+(\w+)\s*=\s*async\s*\(/g;

function findLocalHelperBodies(src) {
  const names = new Set();
  let hm;
  HELPER_DECL_RE.lastIndex = 0;
  while ((hm = HELPER_DECL_RE.exec(src))) {
    const name = hm[1] ?? hm[2];
    if (name && !METHODS.includes(name)) names.add(name);
  }
  const bodies = new Map();
  for (const name of names) {
    const declRe = new RegExp(`(?:export\\s+)?async\\s+function\\s+${name}\\s*\\(|\\bconst\\s+${name}\\s*=\\s*async\\s*\\(`);
    const body = extractBodyByRegex(src, declRe);
    if (body) bodies.set(name, body);
  }
  return bodies;
}

function classifyMethod(body, helperBodies) {
  // Local helpers this method's body actually calls (by name), so an unrelated sibling
  // helper's rate limiter doesn't falsely "cover" a method that never calls it.
  const calledHelperBodies = [];
  for (const [name, helperBody] of helperBodies) {
    if (new RegExp(`\\b${name}\\s*\\(`).test(body)) calledHelperBodies.push(helperBody);
  }
  const searchSpace = [body, ...calledHelperBodies];

  for (const text of searchSpace) {
    const limiterMatch = LIMITER_CALL_RE.exec(text);
    if (limiterMatch) return { verdict: `limiter:${limiterMatch[1]}`, covered: true, exposure: null };
  }
  for (const text of searchSpace) {
    if (CRON_SECRET_RE.test(text)) return { verdict: "cron-gated", covered: true, exposure: null };
  }
  for (const text of searchSpace) {
    if (ADMIN_GATE_RE.test(text)) return { verdict: "admin-gated", covered: true, exposure: null };
  }
  const exposure = searchSpace.some((text) => AUTH_CHECK_RE.test(text)) ? "authenticated" : "public";
  return { verdict: "UNLIMITED", covered: false, exposure };
}

const files = walk(join(REPO_ROOT, "app/api"), (_full, name) => name === "route.ts");

const rows = [];
for (const f of files) {
  let src;
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const methodsExported = METHODS.filter((m) => METHOD_START_RE(m).test(src));
  if (!methodsExported.length) continue;

  const helperBodies = findLocalHelperBodies(src);

  const perMethod = {};
  for (const m of methodsExported) {
    const body = extractFunctionBody(src, m);
    perMethod[m] = body ? classifyMethod(body, helperBodies) : { verdict: "?", covered: false, exposure: null };
  }

  rows.push({ route: rel(f), methods: methodsExported, perMethod });
}

rows.sort((a, b) => a.route.localeCompare(b.route));

// Summary counts across all (route, method) pairs.
let coveredCount = 0;
let unlimitedPublic = 0;
let unlimitedAuth = 0;
let unresolved = 0;
const limiterUsage = new Map();
for (const r of rows) {
  for (const m of r.methods) {
    const c = r.perMethod[m];
    if (c.verdict === "?") {
      unresolved++;
    } else if (c.covered) {
      coveredCount++;
      if (c.verdict.startsWith("limiter:")) {
        const name = c.verdict.slice("limiter:".length);
        limiterUsage.set(name, (limiterUsage.get(name) ?? 0) + 1);
      }
    } else if (c.exposure === "public") {
      unlimitedPublic++;
    } else {
      unlimitedAuth++;
    }
  }
}

// UNLIMITED rows for the exposure-ranked list: public first, then authenticated,
// each group ordered by route path for determinism.
const unlimitedRows = [];
for (const r of rows) {
  for (const m of r.methods) {
    const c = r.perMethod[m];
    if (!c.covered && c.verdict === "UNLIMITED") {
      unlimitedRows.push({ route: r.route, method: m, exposure: c.exposure });
    }
  }
}
unlimitedRows.sort((a, b) => {
  const order = { public: 0, authenticated: 1 };
  if (order[a.exposure] !== order[b.exposure]) return order[a.exposure] - order[b.exposure];
  if (a.route !== b.route) return a.route.localeCompare(b.route);
  return a.method.localeCompare(b.method);
});

const date = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push("# Rate-limiter census (ring 9)");
lines.push("");
lines.push(
  `Auto-generated by \`node scripts/ratelimit-census.mjs\` (${date}). READ-ONLY memo, no route ` +
    "files were touched by this script. Scope: every `app/api/**/route.ts` exporting POST/PATCH/PUT/DELETE.",
);
lines.push("");
lines.push(
  "Classification is a regex heuristic per (route, method), not a type-checker: `limiter:<name>` = " +
    "the handler calls `applyRateLimit(<name>, ...)`/`checkRateLimit(<name>, ...)` from `lib/ratelimit.ts`; " +
    "`cron-gated` = the handler reads `CRON_SECRET` (GitHub-Actions-only route); `admin-gated` = the handler " +
    "calls `requireAdmin()`/`requireRole([...\"admin\"...])` or has an inline `profile.role !== \"admin\"` " +
    "check; `UNLIMITED` = none of the above, sub-split into `public` (no auth check found at all) and " +
    "`authenticated` (an auth check is present but no rate limiter and no admin gate).",
);
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- Routes scanned (>=1 of POST/PATCH/PUT/DELETE): ${rows.length}`);
lines.push(`- (route, method) pairs: ${rows.reduce((s, r) => s + r.methods.length, 0)}`);
lines.push(`- covered (limiter, cron-gated, or admin-gated): ${coveredCount}`);
lines.push(`- UNLIMITED, public (no auth check): ${unlimitedPublic}`);
lines.push(`- UNLIMITED, authenticated (auth check, no limiter/admin-gate): ${unlimitedAuth}`);
if (unresolved) lines.push(`- unresolved (brace-match failed, check by hand): ${unresolved}`);
lines.push("");
lines.push("### Limiter usage (covered routes, by limiter export)");
lines.push("");
const limiterNames = [...limiterUsage.keys()].sort();
if (limiterNames.length) {
  for (const name of limiterNames) lines.push(`- \`${name}\`: ${limiterUsage.get(name)}`);
} else {
  lines.push("(none)");
}
lines.push("");
lines.push("## Ring 9 fix pick (top 10 most exposed, public first)");
lines.push("");
lines.push(
  "Picked by hand-reading every UNLIMITED row from the FIRST run of this script (before any " +
    "fix below was applied), public/unauthenticated routes prioritized over merely-authenticated " +
    "ones (admin-gated and cron-gated rows were excluded, they're already COVERED for this " +
    "census's purposes). This list is a fixed record of what was picked and fixed in ring 9, not " +
    "re-derived on every run, once a route below is fixed it drops out of the live `UNLIMITED` " +
    "rows in the table further down, so a dynamic top-10 would silently rewrite history on every " +
    "re-run. Each fix wires the route onto the `lib/ratelimit.ts` tier that matches its nearest " +
    "already-gated sibling (booking-ish -> bookingLimiter, money -> paymentLimiter, else " +
    "generalLimiter). See route files for the added `applyRateLimit` call.",
);
lines.push("");
lines.push("1. `app/api/nail/hand-chart/route.ts` POST (public): a mock/in-memory stub endpoint (no Supabase table, no auth, no ownership scoping) with zero rate limiting at all. Wired onto `generalLimiter`, IP-keyed (no user session exists on this route).");
lines.push("2. `app/api/admin/preview-salon/route.ts` DELETE (authenticated): its sibling POST is admin-role-gated; DELETE only checks `if (!user)`, no role check, and had no limiter either. Wired onto `generalLimiter`, userId-keyed (the missing admin-role check on DELETE is a separate authz gap, out of scope for this rate-limit ring).");
lines.push("3. `app/api/availability/manage/[slot_id]/route.ts` DELETE (authenticated): owner-facing slot management, same shape as `dashboard/spa/rooms` (generalLimiter). Wired onto `generalLimiter`, userId-keyed.");
lines.push("4. `app/api/availability/manage/route.ts` POST (authenticated): the bulk-insert sibling of #3, same tier. Wired onto `generalLimiter`, userId-keyed.");
lines.push("5. `app/api/bookings/[id]/cancel/route.ts` POST (authenticated): booking-lifecycle write; `app/api/bookings/[id]/route.ts` PATCH and `app/api/bookings/route.ts` POST (create) both already use `bookingLimiter` for this exact family regardless of actor. Wired onto `bookingLimiter`, userId-keyed.");
lines.push("6. `app/api/bookings/[id]/confirm/route.ts` POST (authenticated): salon-owner booking confirm, same booking-lifecycle family as #5. Wired onto `bookingLimiter`, keyed by the userId `resolveBookingActor` already resolved (actor is always \"salon\" past the auth check, so userId is always set).");
lines.push("7. `app/api/bookings/[id]/reschedule/route.ts` POST (authenticated): same family as #5/#6, reachable by a logged-in customer OR a token-verified guest. Wired onto `bookingLimiter`, userId-keyed when logged in, IP-keyed for the guest path (`resolveBookingActor` returns `userId: null` for guests).");
lines.push("8. `app/api/bookings/recurring/[id]/route.ts` DELETE (authenticated): same booking-lifecycle family as #5 (`app/api/bookings/recurring/route.ts` POST already uses `bookingLimiter`). Wired onto `bookingLimiter`, userId-keyed.");
lines.push("9. `app/api/bookings/waitlist/route.ts` POST (authenticated): same booking-lifecycle family. Wired onto `bookingLimiter`, userId-keyed.");
lines.push("10. `app/api/clients/[id]/formulas/route.ts` POST (authenticated): salon-owner CRM write, same shape as its already-limited siblings `clients/[id]/cut-history` and `clients/[id]/nail-history` (both `generalLimiter`). Wired onto `generalLimiter`, userId-keyed.");
lines.push("");
lines.push(
  "**Deliberately skipped**: `app/api/stripe/webhook/route.ts` POST is the single other `UNLIMITED, " +
    "public` row. It is gated by Stripe signature verification (`stripe.webhooks.constructEvent`), " +
    "not a session, and Stripe's webhook deliveries share IP ranges across every Stripe customer, " +
    "so a naive per-IP limiter risks dropping legitimate retries/bursts and breaking real payment " +
    "processing. Left UNLIMITED here on purpose, not fixed in this ring.",
);
lines.push("");
lines.push(
  "The rest of the `UNLIMITED` rows below (past the 10 fixed here, and the stripe/webhook skip) are a MEMO for a later ring, not fixed here.",
);
lines.push("");
lines.push("## Routes");
lines.push("");
lines.push("| route | methods | verdict per method |");
lines.push("|---|---|---|");
for (const r of rows) {
  const methodCol = r.methods
    .map((m) => {
      const c = r.perMethod[m];
      if (c.verdict === "UNLIMITED") return `${m}:UNLIMITED(${c.exposure})`;
      return `${m}:${c.verdict}`;
    })
    .join(", ");
  lines.push(`| ${r.route} | ${r.methods.join(", ")} | ${methodCol} |`);
}
lines.push("");

const outPath = join(REPO_ROOT, "_plans/RATELIMIT_CENSUS.md");
writeFileSync(outPath, lines.join("\n"));
console.log(
  `Wrote ${rel(outPath)}: ${rows.length} routes, ${coveredCount} covered / ${unlimitedPublic} unlimited-public / ${unlimitedAuth} unlimited-authenticated`,
);
