#!/usr/bin/env node
// secrets-webhooks-10: catches a NEW `!==`/`===` comparison against a variable
// that looks like a secret, token, or signature (naming heuristic: SECRET,
// TOKEN, SIGNATURE, HMAC, API_KEY in the compared identifier). The project
// already has the correct rule written down as a comment in
// lib/bookings/guest-access.ts ("compare with crypto.timingSafeEqual, NEVER
// !=="), and correctly follows it in five call sites, but a rule that lives in
// one file's comment does not travel: every /api/cron/* route was still doing
// a plain !== compare on CRON_SECRET until this same finding fixed it
// (lib/cron-auth.ts). This script is the mechanical check that would have
// caught that drift on its own instead of requiring a manual audit pass.
//
// Ratchet, not hard zero: some `!==`/`===` on a secret-shaped name is a
// deliberate non-secret use (a variable literally named `apiKeyLabel` for a
// UI string, a `tokenType` enum compare) or a length/presence guard
// (`!cronSecret`) that this heuristic cannot always distinguish, so this
// checks the COUNT against a baseline the same way the lint/tsc jobs in
// quality.yml do: fails only when a NEW instance appears.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// SECRET/TOKEN/SIGNATURE/HMAC/API_KEY (case-insensitive) anywhere in the
// identifier on either side of a `!==`/`===`. Deliberately excludes plain
// `!secret`/`!token` presence checks (no comparison operator) and excludes
// crypto.timingSafeEqual's own internals (this file and its own comparisons
// are the fix, not a violation).
const COMPARE_PATTERN =
  /\b(?:[\w.]*(?:secret|token|signature|hmac|api_?key)[\w.]*)\s*(?:!==|===)\s*|(?:!==|===)\s*(?:[\w.]*(?:secret|token|signature|hmac|api_?key)[\w.]*)\b/gi;

// Files/dirs this check never scans: the fix itself, tests, node_modules, and
// non-runtime files where a secret-shaped identifier is just prose/copy.
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next\//,
  /\/lib\/cron-auth\.ts$/,
  /\/lib\/bookings\/guest-access\.ts$/, // documents the banned pattern in a comment, not code
  /\.test\.ts$/,
  /\.md$/,
];

function listTrackedFiles() {
  const out = execSync("git ls-files -- 'app/**/*.ts' 'app/**/*.tsx' 'lib/**/*.ts'", {
    cwd: ROOT,
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean);
}

function scanFile(relPath) {
  const full = path.join(ROOT, relPath);
  const content = readFileSync(full, "utf8");
  const lines = content.split("\n");
  const hits = [];
  lines.forEach((line, i) => {
    if (/timingSafeEqual|check-timing-safe-secrets/i.test(line)) return; // the fix, not the bug
    if (/drift-ok|em-dash-ok/i.test(line)) return; // explicit escape hatch, same convention as other gates
    if (/typeof\s+[\w.]+\s*(?:!==|===)/i.test(line)) return; // a type guard, not a value compare
    if (/\.length\s*(?:!==|===)/i.test(line)) return; // buffer-length pre-check, the accepted idiom before a constant-time compare
    COMPARE_PATTERN.lastIndex = 0;
    if (COMPARE_PATTERN.test(line)) {
      hits.push({ file: relPath, line: i + 1, text: line.trim() });
    }
  });
  return hits;
}

function main() {
  const files = listTrackedFiles().filter(
    (f) => !EXCLUDE_PATTERNS.some((re) => re.test(f))
  );
  const allHits = files.flatMap(scanFile);

  // Baseline measured 2026-07-27, immediately after fixing the 22 CRON_SECRET
  // cron routes (secrets-webhooks-10) to 0 known violations in app/+lib/. Any
  // future non-timing-safe secret compare should fail this at 0, not silently
  // join a baseline count.
  const BASELINE = 0;

  console.log(`timing-safe-secret-compare violations: ${allHits.length} (baseline: ${BASELINE})`);
  for (const h of allHits) {
    console.log(`  ${h.file}:${h.line}: ${h.text}`);
  }

  if (allHits.length > BASELINE) {
    console.error(
      `\nFAIL: found a !==/=== comparison against a secret/token/signature/hmac-shaped variable name. ` +
        `Use crypto.timingSafeEqual (or lib/cron-auth.ts's verifyCronSecret pattern: hash both sides to a ` +
        `fixed-length digest, then constant-time compare) instead. See lib/bookings/guest-access.ts's header ` +
        `comment for the documented rule this check enforces.`
    );
    process.exit(1);
  }
  process.exit(0);
}

main();
