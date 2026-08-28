#!/usr/bin/env node
//
// Self-test for scripts/detect-gap-ladder-drift.mjs. Builds a synthetic tree under a temp dir
// (via the detector's test-only `--root` flag), runs the detector's default (report) mode and
// its --gate mode against that tree, and asserts every case the task specified. Never touches
// the real repo's _design-system/_gap-ladder-report.md (the detector skips writing it whenever
// --root is passed).
//
// SECOND ROUND. Three independent reviewers attacked the detector; eight defects were found and
// fixed in scripts/detect-gap-ladder-drift.mjs. Every one of the eight gets its own case below,
// added to the original 15, per the closing instruction: "EVERY case above becomes a NEW CASE...
// the suite passing 15 of 15 while missing all eight is exactly why it needs them."
//
//   Run:  node scripts/verify/gap-ladder-suite.mjs
//   Out:  "ok"/"FAIL" per case, then "N passed, M failed"; exits non-zero on any failure.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DETECTOR = join(HERE, "..", "detect-gap-ladder-drift.mjs");

const root = mkdtempSync(join(tmpdir(), "gap-ladder-suite-"));

function write(relPath, content) {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

// ---------------------------------------------------------------------------------------
// Original 15 cases. Unchanged, per the instruction not to churn what already passed.
// ---------------------------------------------------------------------------------------

// 1. a governed file with mt-6 in code -> fires
write("app/[locale]/dashboard/case1.tsx", 'export function C() { return <div className="mt-6">x</div>; }\n');

// 2. the same mt-6 inside a block comment -> quiet
write(
  "app/[locale]/dashboard/case2.tsx",
  '/* a note about mt-6, do not flag this */\nexport function C() { return <div className="mt-4">x</div>; }\n',
);

// 3. the same mt-6 inside a line comment -> quiet
write(
  "app/[locale]/dashboard/case3.tsx",
  '// mt-6 was here before the fix\nexport function C() { return <div className="mt-4">x</div>; }\n',
);

// 4. a customer-screen file with mt-6 -> quiet, not governed by claim or path
write("app/[locale]/profile/case4.tsx", 'export function C() { return <div className="mt-6">x</div>; }\n');

// 5. a governed file with p-6 and py-6 -> quiet (padding is not a gap)
write("app/[locale]/dashboard/case5.tsx", 'export function C() { return <div className="p-6 py-6">x</div>; }\n');

// 6. a governed file with mt-4, gap-4, mt-8, gap-8 -> quiet
write(
  "app/[locale]/dashboard/case6.tsx",
  'export function C() { return <div className="mt-4 gap-4 mt-8 gap-8">x</div>; }\n',
);

// 7. a governed file with mt-1, mt-2, gap-1.5 -> quiet (sub-line leading)
write(
  "app/[locale]/dashboard/case7.tsx",
  'export function C() { return <div className="mt-1 mt-2 gap-1.5">x</div>; }\n',
);

// 8. a governed file with mt-[24px] and gap-[1.5rem] -> fires (arbitrary values)
write(
  "app/[locale]/dashboard/case8.tsx",
  'export function C() { return <div className="mt-[24px] gap-[1.5rem]">x</div>; }\n',
);

// 9. a governed file with space-y-6 -> fires
write("app/[locale]/dashboard/case9.tsx", 'export function C() { return <div className="space-y-6">x</div>; }\n');

// 10. a file the detector cannot read -> reported loudly, never silently counted clean
const lockedPath = write(
  "app/[locale]/dashboard/case10-locked.tsx",
  'export function C() { return <div className="mt-6">x</div>; }\n',
);
chmodSync(lockedPath, 0o000);

// 11. a claim-breaking file: no operator path, but the header claims the law, and the code
//     breaks it. Confirms the CLAIM branch fires independent of path, and lands in the loudest
//     bucket, not weak-claim, not path.
write(
  "app/[locale]/dev/misc/case11-claim.tsx",
  "/**\n * SCREEN CLASS: operator screen. Governed by `_design-system/TERMINAL_PRINCIPLES.md`.\n */\n" +
    'export function C() { return <div className="mt-6">x</div>; }\n',
);

// 12. an all-clean tree (only the quiet fixtures) for the --gate "passes when nothing is wrong"
//     control, in a second root so it never mixes with the illegal fixtures above.
const cleanRoot = mkdtempSync(join(tmpdir(), "gap-ladder-suite-clean-"));
function writeClean(relPath, content) {
  const full = join(cleanRoot, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
writeClean("app/[locale]/dashboard/clean1.tsx", 'export function C() { return <div className="mt-4 gap-8">x</div>; }\n');
writeClean("app/[locale]/profile/clean2.tsx", 'export function C() { return <div className="mt-6">x</div>; }\n');

// ---------------------------------------------------------------------------------------
// New cases, one per defect from the second reviewer round.
// ---------------------------------------------------------------------------------------

// A1a. FALSE POSITIVE: import path containing "mt-6" -> quiet
write(
  "app/[locale]/dashboard/a1-import.tsx",
  'import { Helper } from "./mt-6/helper";\nexport function C() { return <div className="mt-4">x</div>; }\n',
);

// A1b. FALSE POSITIVE: decoy string with a URL, never used as a class -> quiet
write(
  "app/[locale]/dashboard/a1-decoy.tsx",
  'const weirdString = "https://example.com/path gap-6 not-a-real-class";\nexport function C() { return <div className="mt-4">x</div>; }\n',
);

// A1c. FALSE POSITIVE: plain JSX text content mentioning gap-6/mt-10 -> quiet
write(
  "app/[locale]/dashboard/a1-jsxtext.tsx",
  'export function C() { return <div className="mt-4">only mentions gap-6 and mt-10 in text</div>; }\n',
);

// A1d. mixed: an import decoy, a string decoy, and ONE real violation in the same file -> exactly
//      one finding, at the real className, not three.
write(
  "app/[locale]/dashboard/a1-mixed.tsx",
  'import { X } from "./mt-6/thing";\nconst decoy = "gap-6 fake";\n' +
    'export function C() { return <div className="mt-6">real</div>; }\n',
);

// A1e. clsx/cn arguments must still fire (the reviewer's own explicit "do not break this" case).
write(
  "app/[locale]/dashboard/a1-clsx-still-fires.tsx",
  'export function C() { return <div className={cn("mt-2", cond ? "mt-6" : "mt-4")}>x</div>; }\n',
);

// B1a. FAIL OPEN: an unreadable DIRECTORY containing a real violation -> reported loudly, never
//      "0 unreadable", counted as a --gate failure. Handled as its own root below since chmod 000
//      on a directory blocks listing everything inside it, including this suite's own cleanup
//      path if it were nested inside the shared `root`.
const dirRoot = mkdtempSync(join(tmpdir(), "gap-ladder-suite-dirfail-"));
const lockedDir = join(dirRoot, "app/[locale]/dashboard/locked-dir");
mkdirSync(lockedDir, { recursive: true });
writeFileSync(join(lockedDir, "real-violation.tsx"), 'export function C() { return <div className="mt-6">x</div>; }\n');
chmodSync(lockedDir, 0o000);

// B1b. FAIL OPEN: a missing --root path entirely -> reported loudly, --gate fails.
const missingRoot = join(tmpdir(), `gap-ladder-suite-missing-${Date.now()}`);

// C1a. em/pt: pt converts and fires (20pt = 26.67px, illegal).
write("app/[locale]/dashboard/c1-pt-fires.tsx", 'export function C() { return <div className="mt-[20pt]">x</div>; }\n');

// C1b. em/pt: pt converts and is legal at the exact 32px boundary (24pt = 32px).
write("app/[locale]/dashboard/c1-pt-legal.tsx", 'export function C() { return <div className="mt-[24pt]">x</div>; }\n');

// C1c. em/pt: em is NOT converted, routed to review-by-hand, never a finding.
write("app/[locale]/dashboard/c1-em-review.tsx", 'export function C() { return <div className="mt-[1.5em]">x</div>; }\n');

// C2. concatenation, in a BARE variable, not inside className/cn/clsx at all -> review-by-hand,
//     never a finding, never silently invisible.
write(
  "app/[locale]/dashboard/c2-concat-review.tsx",
  'const cls = "mt-" + "6 gap-8";\nexport function C() { return <div>{cls}</div>; }\n',
);

// C3. template literal broken across a REAL line break -> review-by-hand.
write(
  "app/[locale]/dashboard/c3-newline-review.tsx",
  "export function C() { return <div className={`mt-\n6`}>x</div>; }\n",
);

// C4. template literal with a numeric interpolation right after a prefix -> review-by-hand.
write(
  "app/[locale]/dashboard/c4-interp-review.tsx",
  "export function C() { const big = true; return <div className={`mt-${big ? 6 : 4}`}>x</div>; }\n",
);

// C5. .jsx file under a governed path, real violation -> fires (proves .jsx discovery).
write("app/[locale]/dashboard/c5-case.jsx", 'export function C() { return <div className="mt-6">x</div>; }\n');

// C6a. weak-claim: TASTE_LOG.md co-occurring with 2026-07-15, no "Round D1", no
//      TERMINAL_PRINCIPLES.md, and OUTSIDE any operator path -> fires in the weak-claim bucket,
//      never in the loud claim bucket, never in path.
write(
  "app/[locale]/misc-weak/c6-weak-tastelog.tsx",
  "/**\n * Governed by the merchant round in _design-system/TASTE_LOG.md 2026-07-15. Binary spacing: 16 and 32 only.\n */\n" +
    'export function C() { return <div className="mt-6">x</div>; }\n',
);

// C6b. weak-claim: bare case-insensitive "operator screen", OUTSIDE any operator path -> weak-claim.
write(
  "app/[locale]/misc-weak/c6-weak-operatorscreen.tsx",
  "// this is an OPERATOR SCREEN, take care with spacing.\n" +
    'export function C() { return <div className="mt-6">x</div>; }\n',
);

function run(scanRoot, extraArgs = []) {
  return spawnSync(process.execPath, [DETECTOR, "--root", scanRoot, ...extraArgs], { encoding: "utf8" });
}

let passed = 0;
let failed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `  ${detail}` : ""}`);
  }
}

const reportRun = run(root);
const out = (reportRun.stdout || "") + (reportRun.stderr || "");
const outLines = out.split("\n");

function firedFor(basename) {
  return outLines.some((l) => l.startsWith("FINDING ") && l.includes(basename));
}
function firedAsClaim(basename) {
  return outLines.some((l) => l.startsWith("FINDING claim ") && l.includes(basename));
}
function firedAsWeakClaim(basename) {
  return outLines.some((l) => l.startsWith("FINDING weakclaim ") && l.includes(basename));
}
function firedAsPath(basename) {
  return outLines.some((l) => l.startsWith("FINDING path ") && l.includes(basename));
}
function firedCount(basename) {
  return outLines.filter((l) => l.startsWith("FINDING ") && l.includes(basename)).length;
}
function reviewFor(basename) {
  return outLines.some((l) => l.startsWith("REVIEW ") && l.includes(basename));
}
function unreadableFor(basename) {
  return outLines.some((l) => l.startsWith("UNREADABLE ") && l.includes(basename));
}

// --- original 15 -------------------------------------------------------------------------
check("report mode exits 0 even with findings present", reportRun.status === 0, `exit ${reportRun.status}`);
check("case1: governed file, mt-6 -> fires", firedFor("case1.tsx"));
check("case2: mt-6 inside a block comment -> quiet", !firedFor("case2.tsx"));
check("case3: mt-6 inside a line comment -> quiet", !firedFor("case3.tsx"));
check("case4: customer-screen file, mt-6 -> quiet (not governed)", !firedFor("case4.tsx"));
check("case5: p-6 and py-6 -> quiet (padding is not a gap)", !firedFor("case5.tsx"));
check("case6: mt-4, gap-4, mt-8, gap-8 -> quiet", !firedFor("case6.tsx"));
check("case7: mt-1, mt-2, gap-1.5 -> quiet (sub-line leading)", !firedFor("case7.tsx"));
check("case8: mt-[24px] and gap-[1.5rem] -> fires (arbitrary values)", firedFor("case8.tsx"));
check("case9: space-y-6 -> fires", firedFor("case9.tsx"));
check(
  "case10: unreadable file -> reported loudly, never counted clean",
  unreadableFor("case10-locked.tsx") && !firedFor("case10-locked.tsx"),
);
check("case11: header claims the law -> lands in the CLAIM bucket, not path, not weak-claim", firedAsClaim("case11-claim.tsx") && !firedAsPath("case11-claim.tsx") && !firedAsWeakClaim("case11-claim.tsx"));
check("case1 (path-governed, no claim) lands in the PATH bucket, not claim, not weak-claim", firedAsPath("case1.tsx") && !firedAsClaim("case1.tsx") && !firedAsWeakClaim("case1.tsx"));

const gateRun = run(root, ["--gate"]);
check(
  "gate mode exits non-zero when illegal findings and an unreadable file exist",
  gateRun.status !== 0,
  `exit ${gateRun.status}`,
);

const gateCleanRun = run(cleanRoot, ["--gate"]);
check("gate mode exits 0 on an all-clean tree", gateCleanRun.status === 0, `exit ${gateCleanRun.status}`);

// --- new: defect A1, false positives -----------------------------------------------------
check("A1a: import path containing mt-6 -> quiet", !firedFor("a1-import.tsx"));
check("A1b: decoy string with a URL, never a class -> quiet", !firedFor("a1-decoy.tsx"));
check("A1c: plain JSX text mentioning gap-6/mt-10 -> quiet", !firedFor("a1-jsxtext.tsx"));
check(
  "A1d: import decoy + string decoy + one real mt-6 -> exactly ONE finding",
  firedFor("a1-mixed.tsx") && firedCount("a1-mixed.tsx") === 1,
  `count ${firedCount("a1-mixed.tsx")}`,
);
check("A1e: cn(...) second/third arguments still fire (not broken by the A1 fix)", firedFor("a1-clsx-still-fires.tsx"));

// --- new: defect B1, fail-open on directories/missing paths -------------------------------
const dirFailRun = run(dirRoot);
const dirFailOut = (dirFailRun.stdout || "") + (dirFailRun.stderr || "");
check(
  "B1a: unreadable directory -> UNREADABLE reported loudly in report mode",
  dirFailOut.includes("UNREADABLE") && dirFailOut.includes("locked-dir"),
);
check(
  "B1a: unreadable directory -> never claims '0 unreadable' / 'every candidate path was readable'",
  !dirFailOut.includes("every candidate path was readable"),
);
const dirFailGate = run(dirRoot, ["--gate"]);
check("B1a: unreadable directory -> --gate exits non-zero", dirFailGate.status !== 0, `exit ${dirFailGate.status}`);

const missingRootRun = run(missingRoot);
const missingRootOut = (missingRootRun.stdout || "") + (missingRootRun.stderr || "");
check("B1b: missing --root path -> UNREADABLE reported loudly", missingRootOut.includes("UNREADABLE"));
check(
  "B1b: missing --root path -> never claims 'every candidate path was readable'",
  !missingRootOut.includes("every candidate path was readable"),
);
const missingRootGate = run(missingRoot, ["--gate"]);
check("B1b: missing --root path -> --gate exits non-zero", missingRootGate.status !== 0, `exit ${missingRootGate.status}`);

// --- new: defect C1, em/pt units -----------------------------------------------------------
check("C1a: mt-[20pt] converts and fires (26.67px, illegal)", firedFor("c1-pt-fires.tsx"));
check("C1b: mt-[24pt] converts and is legal (32px exactly) -> quiet", !firedFor("c1-pt-legal.tsx"));
check(
  "C1c: mt-[1.5em] routed to review, never a finding",
  reviewFor("c1-em-review.tsx") && !firedFor("c1-em-review.tsx"),
);

// --- new: defects C2/C3/C4, concatenation / newline / interpolation ------------------------
check(
  "C2: bare-variable concatenation -> review, never a finding, never silent",
  reviewFor("c2-concat-review.tsx") && !firedFor("c2-concat-review.tsx"),
);
check(
  "C3: template literal broken across a real newline -> review",
  reviewFor("c3-newline-review.tsx") && !firedFor("c3-newline-review.tsx"),
);
check(
  "C4: template literal with numeric interpolation -> review",
  reviewFor("c4-interp-review.tsx") && !firedFor("c4-interp-review.tsx"),
);

// --- new: defect C5, .jsx discovery ---------------------------------------------------------
check("C5: .jsx file under a governed path -> fires", firedFor("c5-case.jsx"));

// --- new: defect C6, weak-claim markers ------------------------------------------------------
check(
  "C6a: TASTE_LOG.md + 2026-07-15 (no Round D1) -> weak-claim, not claim, not path",
  firedAsWeakClaim("c6-weak-tastelog.tsx") && !firedAsClaim("c6-weak-tastelog.tsx") && !firedAsPath("c6-weak-tastelog.tsx"),
);
check(
  "C6b: bare case-insensitive 'operator screen' -> weak-claim, not claim, not path",
  firedAsWeakClaim("c6-weak-operatorscreen.tsx") && !firedAsClaim("c6-weak-operatorscreen.tsx") && !firedAsPath("c6-weak-operatorscreen.tsx"),
);

// Cleanup. chmod the locked fixtures back before rmSync so removal never depends on directory-
// only permissions across platforms.
try {
  chmodSync(lockedPath, 0o644);
} catch {
  // best-effort, the temp dir removal below still runs
}
try {
  chmodSync(lockedDir, 0o755);
} catch {
  // best-effort
}
rmSync(root, { recursive: true, force: true });
rmSync(cleanRoot, { recursive: true, force: true });
rmSync(dirRoot, { recursive: true, force: true });

console.log("");
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
