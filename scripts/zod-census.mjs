#!/usr/bin/env node
//
// RING 7a: zod validation census. For every app/api/**/route.ts that exports a
// POST/PATCH/PUT/DELETE handler, checks whether the handler's body is validated through
// zod (safeParse / parse / lib/validations' validateBody helper) versus read raw off
// `request.json()` / `formData()` with no schema. READ-ONLY: writes _plans/ZOD_CENSUS.md,
// touches no route files. Fixes for the worst offenders are a manual follow-up (ring 7a
// fixes the top 5 by hand, the rest is a memo for a later chunk).
//
//   Run: node scripts/zod-census.mjs (writes _plans/ZOD_CENSUS.md)
//
// Classification per method (heuristic, good enough for a census memo, not a type-checker):
//   - "no body"  : the handler never reads a body (request.json()/formData()), nothing to
//                  validate (e.g. a DELETE keyed purely off the route param).
//   - "yes"      : the handler reads a body AND calls validateBody(...) / schema.safeParse(...)
//                  / schema.parse(...) on it.
//   - "partial"  : the handler reads a body, has SOME zod signal, but also reads the raw
//                  body a second time (parsed once for validateBody, then re-read raw), which
//                  usually means part of the payload bypasses the schema.
//   - "no"       : the handler reads a body and has ZERO zod signal anywhere in the file.

import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
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

/** Extract a top-level exported function's body via brace matching, starting from its `function NAME(` match. */
function extractFunctionBody(src, methodName) {
  const re = METHOD_START_RE(methodName);
  const m = re.exec(src);
  if (!m) return null;
  const openParenIdx = src.indexOf("(", m.index);
  // Skip the parameter list to find the function's opening brace.
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
  depth = 0;
  let j = braceStart;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") {
      depth--;
      if (depth === 0) return src.slice(braceStart, j + 1);
    }
  }
  return src.slice(braceStart);
}

const BODY_READ_RE = /\b(request|req)\s*\.\s*(json|formData)\s*\(\s*\)/g;
const ZOD_SIGNAL_RE = /\bvalidateBody\s*\(|\.safeParse\s*\(|\.parse\s*\(/;

function classifyMethod(body) {
  const bodyReadMatches = [...body.matchAll(BODY_READ_RE)];
  if (bodyReadMatches.length === 0) return "no body";
  const hasZod = ZOD_SIGNAL_RE.test(body);
  if (!hasZod) return "no";
  // Partial heuristic: the body was read raw MORE THAN ONCE (once likely feeds validateBody /
  // schema.parse, the extra read(s) suggest a second raw pass that bypasses the schema).
  if (bodyReadMatches.length > 1) return "partial";
  return "yes";
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

  const usesLibValidations = /from\s+["']@\/lib\/validations["']/.test(src);
  const importsZodDirect = /from\s+["']zod["']/.test(src);

  const perMethod = {};
  for (const m of methodsExported) {
    const body = extractFunctionBody(src, m);
    perMethod[m] = body ? classifyMethod(body) : "?";
  }

  rows.push({
    route: rel(f),
    methods: methodsExported,
    perMethod,
    usesLibValidations,
    importsZodDirect,
  });
}

rows.sort((a, b) => a.route.localeCompare(b.route));

// Summary counts across all (route, method) pairs.
const counts = { yes: 0, partial: 0, no: 0, "no body": 0, "?": 0 };
for (const r of rows) {
  for (const m of r.methods) counts[r.perMethod[m]]++;
}

const date = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push("# Zod validation census (ring 7a)");
lines.push("");
lines.push(
  `Auto-generated by \`node scripts/zod-census.mjs\` (${date}). READ-ONLY memo, no route files ` +
    "were touched by this script. Scope: every `app/api/**/route.ts` exporting POST/PATCH/PUT/DELETE.",
);
lines.push("");
lines.push(
  "Classification is a regex heuristic per (route, method), not a type-checker: `yes` = the " +
    "handler reads a body and validates it via `validateBody(...)` (lib/validations.ts) or a " +
    "direct `schema.safeParse(...)`/`schema.parse(...)` call; `partial` = a zod signal is present " +
    "but the raw body was read more than once (a second raw pass usually bypasses the schema); " +
    "`no` = the handler reads a body with zero zod signal anywhere in the file; `no body` = the " +
    "handler never reads `request.json()`/`formData()` (nothing to validate, e.g. a route-param-only " +
    "DELETE).",
);
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- Routes scanned (>=1 of POST/PATCH/PUT/DELETE): ${rows.length}`);
lines.push(`- (route, method) pairs: ${rows.reduce((s, r) => s + r.methods.length, 0)}`);
lines.push(`- validated = yes: ${counts.yes}`);
lines.push(`- validated = partial: ${counts.partial}`);
lines.push(`- validated = no (unvalidated raw body): ${counts.no}`);
lines.push(`- no body (nothing to validate): ${counts["no body"]}`);
if (counts["?"]) lines.push(`- unresolved (brace-match failed, check by hand): ${counts["?"]}`);
lines.push("");
lines.push(
  "## Ring 7a fix pick (top 5, money/booking/admin writes preferred)",
);
lines.push("");
lines.push(
  "Picked by hand-reading every `validated:no` row below and prioritizing money, then booking, " +
    "then admin/moderation writes. Fixed in this ring (see route files for the added schema + " +
    "`validateBody` call):",
);
lines.push("");
lines.push("1. `app/api/walkin/pay-intent/route.ts` POST, MONEY: creates a Stripe PaymentIntent (manual-capture hold) off `body?.field` reads with only presence checks on salon_id/service_id; customer_name/customer_phone/booking_id/preferred_barber_id had zero shape validation before hitting Stripe metadata.");
lines.push("2. `app/api/bookings/[id]/reschedule/route.ts` POST, BOOKING: `new_starts_at`/`new_ends_at` are destructured raw from `await req.json()` with only a truthy check (no datetime format check) before being used in slot range queries and written onto the booking row.");
lines.push("3. `app/api/admin/salons/[id]/freeze/route.ts` POST, ADMIN: privileged salon-suspension write that cascades to cancelling every active booking + issuing Stripe refunds; `body.reason` is only type-checked (string), no length cap, before being persisted to `salons.frozen_reason`, `account_actions.reason`, and the Stripe refund reason string.");
lines.push("4. `app/api/admin/salons/[id]/warn/route.ts` POST, ADMIN: privileged salon-warning write (same `body.reason` gap as freeze above, and it auto-escalates to a freeze at 3 warnings).");
lines.push("5. `app/api/walkin/review/route.ts` POST, public write: token/rating/comment are read raw off `body?.field` with hand-rolled bounds checks (rating 1-5, comment slice(0,600)); replaced with a schema so the shape is enforced in one place instead of ad hoc per-field checks.");
lines.push("");
lines.push(
  "Runner-up candidates read but NOT picked (already have solid hand-rolled validation despite " +
    "no zod signal, so lower marginal value): `app/api/salons/mine/route.ts` PATCH (typeof-checked " +
    "per field + a Swiss-UID regex), `app/api/profile/request-deletion/route.ts` POST (GDPR erasure, " +
    "already type-guards + regex-validates email), `app/api/directory/[id]/claim/route.ts` POST " +
    "(OTP claim flow, already rate-limited + attempt-capped). `app/api/services/import/route.ts` " +
    "POST is CSV `formData`, not a fixed JSON shape, so zod is not the right tool there.",
);
lines.push("");
lines.push("The rest of the `no` / `partial` rows below are a MEMO for a later ring, not fixed here.");
lines.push("");
lines.push("## Routes");
lines.push("");
lines.push("| route | methods | validated | lib/validations import | zod import |");
lines.push("|---|---|---|---|---|");
for (const r of rows) {
  const methodCol = r.methods.map((m) => `${m}:${r.perMethod[m]}`).join(", ");
  lines.push(
    `| ${r.route} | ${r.methods.join(", ")} | ${methodCol} | ${r.usesLibValidations ? "yes" : "no"} | ${r.importsZodDirect ? "yes" : "no"} |`,
  );
}
lines.push("");

const outPath = join(REPO_ROOT, "_plans/ZOD_CENSUS.md");
writeFileSync(outPath, lines.join("\n"));
console.log(
  `Wrote ${rel(outPath)}: ${rows.length} routes, ${counts.yes} yes / ${counts.partial} partial / ${counts.no} no / ${counts["no body"]} no-body`,
);
