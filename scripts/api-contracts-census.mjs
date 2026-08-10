#!/usr/bin/env node
//
// api-contracts-01/02/05 census. Walks every app/api/**/route.ts and classifies
// each NextResponse.json(...) call site into a shape bucket:
//   - error responses (status 400-599): canonical (has a top-level `type` AND
//     `title` key, the RFC 9457 subset LAW.md section 7 already froze as the
//     target for NEW/touched routes) vs one of the five legacy shapes already
//     living in the codebase ({error,code}, {message,code}, {error} alone,
//     {message} alone, {error,message,code} combined, or anything else).
//   - success responses that look like a paginated list (an object literal
//     containing a `total`/`page`/`limit` sibling key): canonical
//     ({items,total,page,limit}) vs a legacy domain-named key in place of
//     `items` (e.g. {bookings,total,...}).
//   - 201-status responses: whether the same NextResponse.json(...) call's
//     option object sets a `headers` entry containing `Location`.
//
// This is a CENSUS, not a type-checker (regex + balanced-brace extraction,
// same heuristic tier as scripts/ratelimit-census.mjs). Good enough to catch
// drift in aggregate counts, not a substitute for a real parser.
//
// No mass migration: per _backend-system/LAW.md section 7, the existing
// legacy-shape count is NOT something this script demands be fixed today.
// It exists so the count can be RATCHETED (never allowed to grow) in CI,
// catching a NEW route that introduces a sixth error shape or a bespoke
// success key instead of the frozen canonical one.
//
//   Run: node scripts/api-contracts-census.mjs
//   Machine-readable summary printed on the last line as KEY=VAL pairs for
//   the CI ratchet job to parse.

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
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, filterFn, out);
    else if (filterFn(full, e.name)) out.push(full);
  }
  return out;
}

const rel = (p) => relative(REPO_ROOT, p).split(sep).join("/");

const routeFiles = walk(join(REPO_ROOT, "app", "api"), (full, name) => name === "route.ts");

/** Find the matching close-paren for a NextResponse.json( call, brace/paren-aware,
 *  string/template-literal aware enough for this codebase's actual call shapes. */
function extractCallArgs(text, openParenIdx) {
  let depth = 0;
  let i = openParenIdx;
  let inTemplate = false;
  let inString = null; // "'" | '"' | null
  for (; i < text.length; i++) {
    const c = text[i];
    const prev = text[i - 1];
    if (inString) {
      if (c === inString && prev !== "\\") inString = null;
      continue;
    }
    if (inTemplate) {
      if (c === "`" && prev !== "\\") inTemplate = false;
      continue;
    }
    if (c === "'" || c === '"') {
      inString = c;
      continue;
    }
    if (c === "`") {
      inTemplate = true;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return text.slice(openParenIdx + 1, i);
    }
  }
  return null;
}

/** Top-level object keys of the FIRST object literal in a call-args string. */
function topLevelKeys(argsStr) {
  const firstBrace = argsStr.indexOf("{");
  if (firstBrace === -1) return null;
  let depth = 0;
  let i = firstBrace;
  let end = -1;
  let inString = null;
  let inTemplate = false;
  for (; i < argsStr.length; i++) {
    const c = argsStr[i];
    const prev = argsStr[i - 1];
    if (inString) {
      if (c === inString && prev !== "\\") inString = null;
      continue;
    }
    if (inTemplate) {
      if (c === "`" && prev !== "\\") inTemplate = false;
      continue;
    }
    if (c === "'" || c === '"') {
      inString = c;
      continue;
    }
    if (c === "`") {
      inTemplate = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  const body = argsStr.slice(firstBrace + 1, end);
  // Split top-level keys: walk the body tracking depth, split on commas at depth 0.
  const keys = [];
  let d2 = 0;
  let cur = "";
  let str2 = null;
  let tmpl2 = false;
  for (let j = 0; j < body.length; j++) {
    const c = body[j];
    const prev = body[j - 1];
    if (str2) {
      cur += c;
      if (c === str2 && prev !== "\\") str2 = null;
      continue;
    }
    if (tmpl2) {
      cur += c;
      if (c === "`" && prev !== "\\") tmpl2 = false;
      continue;
    }
    if (c === "'" || c === '"') {
      str2 = c;
      cur += c;
      continue;
    }
    if (c === "`") {
      tmpl2 = true;
      cur += c;
      continue;
    }
    if (c === "{" || c === "[" || c === "(") d2++;
    if (c === "}" || c === "]" || c === ")") d2--;
    if (c === "," && d2 === 0) {
      keys.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) keys.push(cur);
  return keys
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => {
      const m = k.match(/^["'`]?([A-Za-z0-9_$]+)["'`]?\s*:/);
      if (m) return m[1];
      // shorthand { error } style, or a spread ...x (excluded)
      const shorthand = k.match(/^([A-Za-z0-9_$]+)$/);
      return shorthand ? shorthand[1] : null;
    })
    .filter(Boolean);
}

function classifyErrorShape(keys) {
  const s = new Set(keys);
  if (s.has("type") && s.has("title")) return "canonical (RFC9457 subset)";
  if (s.has("error") && s.has("code") && s.has("message")) return "legacy: error+code+message combined";
  if (s.has("error") && s.has("code")) return "legacy: error+code";
  if (s.has("message") && s.has("code")) return "legacy: message+code";
  if (s.size === 1 && s.has("error")) return "legacy: error alone";
  if (s.size === 1 && s.has("message")) return "legacy: message alone";
  return "legacy: other";
}

function classifySuccessShape(keys) {
  const s = new Set(keys);
  if (s.has("total") && s.has("page") && s.has("limit")) {
    return s.has("items") ? "canonical (list): items+total+page+limit" : `legacy (list, non-items key): ${keys.join("+")}`;
  }
  return null; // not a paginated-list-shaped response, skip (out of scope for this census pass)
}

const STATUS_RE = /status:\s*(\d{3})/;
const errorShapeCounts = {};
const successShapeCounts = {};
let created201Total = 0;
let created201WithLocation = 0;
const missingLocationFiles = [];

for (const file of routeFiles) {
  const text = readFileSync(file, "utf8");
  const callRe = /NextResponse\.json\(/g;
  let m;
  while ((m = callRe.exec(text))) {
    const openParen = m.index + "NextResponse.json".length;
    const args = extractCallArgs(text, openParen);
    if (!args) continue;
    const statusMatch = args.match(STATUS_RE);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : null;
    const keys = topLevelKeys(args);
    if (!keys) continue;

    if (status !== null && status >= 400 && status <= 599) {
      const bucket = classifyErrorShape(keys);
      errorShapeCounts[bucket] = (errorShapeCounts[bucket] || 0) + 1;
    } else {
      const bucket = classifySuccessShape(keys);
      if (bucket) successShapeCounts[bucket] = (successShapeCounts[bucket] || 0) + 1;
    }

    if (status === 201) {
      created201Total++;
      // Location header lives in the second call arg (the options object), or
      // nested under headers: { Location: ... } within the whole call text.
      const hasLocation = /Location/i.test(args);
      if (hasLocation) created201WithLocation++;
      else missingLocationFiles.push(rel(file));
    }
  }
}

function printCounts(title, counts) {
  console.log(`\n${title}`);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v.toString().padStart(4)}  ${k}`);
  }
  console.log(`  ${total.toString().padStart(4)}  TOTAL`);
  return total;
}

const errorTotal = printCounts("Error response shapes (status 400-599):", errorShapeCounts);
const successTotal = printCounts("Paginated-list success shapes:", successShapeCounts);

console.log(`\n201-Created responses: ${created201Total} total, ${created201WithLocation} set Location, ${created201Total - created201WithLocation} do not.`);

const legacyErrorCount = Object.entries(errorShapeCounts)
  .filter(([k]) => k.startsWith("legacy"))
  .reduce((a, [, v]) => a + v, 0);
const legacySuccessCount = Object.entries(successShapeCounts)
  .filter(([k]) => k.startsWith("legacy"))
  .reduce((a, [, v]) => a + v, 0);
const missingLocationCount = created201Total - created201WithLocation;

const reportPath = join(REPO_ROOT, "_backend-system", "audit", "API_CONTRACTS_CENSUS.md");
const report = `# API contracts census (api-contracts-01/02/05)

Generated by \`node scripts/api-contracts-census.mjs\`. Machine-generated, do not
hand-edit; re-run to refresh. Counts are a census (regex + balanced-brace
extraction over \`NextResponse.json(...)\` call sites), not a type-checker.

## Error response shapes (status 400-599)

${Object.entries(errorShapeCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- **${v}** : ${k}`).join("\n")}
- **${errorTotal}** total classified call sites

Canonical target (LAW.md section 7, "Error shape" row): the RFC 9457 subset
\`{type, title, status, detail}\`, extension keys (e.g. \`code\`) allowed. No mass
migration of the legacy shapes; new/touched routes should land in the
canonical bucket.

## Paginated-list success shapes

${Object.entries(successShapeCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- **${v}** : ${k}`).join("\n") || "(none detected)"}
- **${successTotal}** total classified call sites

Canonical target (api-contracts-02): \`{items, total, page, limit}\`, never a
domain-named key (\`bookings\`, \`results\`, ...) in place of \`items\`.

## 201-Created responses missing a Location header

${created201Total - created201WithLocation} of ${created201Total} do not set one.

${missingLocationFiles.length > 0 ? missingLocationFiles.slice(0, 60).map((f) => `- ${f}`).join("\n") : "(none)"}
${missingLocationFiles.length > 60 ? `\n... and ${missingLocationFiles.length - 60} more` : ""}

## CI ratchet baseline

The \`contracts-census\` job in \`.github/workflows/quality.yml\` compares these
three counts against a frozen baseline and fails only if one of them
INCREASES (a new route introducing a legacy shape or an unlabeled 201), never
because the pre-existing count is nonzero.

RATCHET_LEGACY_ERROR_SHAPES=${legacyErrorCount}
RATCHET_LEGACY_SUCCESS_SHAPES=${legacySuccessCount}
RATCHET_MISSING_LOCATION_201=${missingLocationCount}
`;
writeFileSync(reportPath, report);
console.log(`\nWrote ${rel(reportPath)}`);

console.log(
  `\nRATCHET_LEGACY_ERROR_SHAPES=${legacyErrorCount} RATCHET_LEGACY_SUCCESS_SHAPES=${legacySuccessCount} RATCHET_MISSING_LOCATION_201=${missingLocationCount}`,
);
