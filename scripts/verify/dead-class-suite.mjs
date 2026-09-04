#!/usr/bin/env node
//
// Self-test for scripts/detect-dead-class.mjs. Builds a synthetic tree under a temp dir (via the
// detector's test-only `--root` flag), runs the detector's default (report) mode and its --gate
// mode against that tree, and asserts every case the brief specified plus every case found while
// grading the detector against the live repo. Never touches the real repo's own
// _design-system/_dead-class-report.md (the detector skips writing it whenever --root is passed).
//
// The REAL app/globals.css is compiled on every run in this file (the detector always compiles
// the real stylesheet, even under --root, see that file's own header note), so these cases use
// real class names already present in this repo's compiled CSS (scrollbar-hide, w-[352px],
// md:hidden, hover:bg-white, group-hover:opacity-100) rather than inventing a fake stylesheet.
//
//   Run:  node scripts/verify/dead-class-suite.mjs
//   Out:  "ok"/"FAIL" per case, then "N passed, M failed"; exits non-zero on any failure.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DETECTOR = join(HERE, "..", "detect-dead-class.mjs");

const root = mkdtempSync(join(tmpdir(), "dead-class-suite-"));

function write(relPath, content) {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

// ---------------------------------------------------------------------------------------
// 1. THE REAL INCIDENT, known-answer control. no-scrollbar flagged, bucket A (a near neighbour,
//    scrollbar-hide, exists), scrollbar-hide itself NOT flagged.
// ---------------------------------------------------------------------------------------
write(
  "app/[locale]/known-answer/case1.tsx",
  'export function C() { return <div className="flex overflow-x-auto no-scrollbar scrollbar-hide">x</div>; }\n',
);

// 2. an arbitrary-value class (w-[352px]) NOT flagged.
// 3. a variant class (md:hidden, hover:bg-white, group-hover:opacity-100) NOT flagged.
write(
  "app/[locale]/known-answer/case2-variants.tsx",
  'export function C() { return <span className="w-[352px] md:hidden hover:bg-white group-hover:opacity-100">x</span>; }\n',
);

// 4. a class inside an import path NOT flagged.
write(
  "app/[locale]/scope/case4-import.tsx",
  'import { Helper } from "./no-real-class-here/helper";\n' +
    'export function C() { return <div className="flex">x</div>; }\n',
);

// 5. a class inside a line comment and a block comment NOT flagged.
write(
  "app/[locale]/scope/case5-comment.tsx",
  "// a comment mentioning no-real-class-either, do not flag this\n" +
    "/* another block comment with no-real-class-either inside */\n" +
    'export function C() { return <div className="flex">x</div>; }\n',
);

// 6. plain JSX text mentioning a fake class name NOT flagged (never inside className/cn/clsx).
write(
  "app/[locale]/scope/case6-jsxtext.tsx",
  'export function C() { return <div className="flex">only mentions no-real-class-jsx in text</div>; }\n',
);

// ---------------------------------------------------------------------------------------
// 7. THE cn()/clsx() OBJECT-KEY TRAP. Real shape from app/[locale]/_components/dashboard/
//    DashboardUI.tsx:230-235. "primary"/"secondary"/"ghost" are comparison operands sitting
//    inside the SAME cn(...) call as real class strings; none of the three may ever be read as a
//    class-value position, so this file produces ZERO findings of any kind.
// ---------------------------------------------------------------------------------------
write(
  "app/[locale]/scope/case7-comparison-operand.tsx",
  'function Btn({ variant = "primary" }: { variant?: "primary" | "secondary" | "ghost" }) {\n' +
    "  const base = cn(\n" +
    '    "h-11 px-4",\n' +
    '    variant === "primary" && "bg-white text-s-ink",\n' +
    '    variant === "secondary" && "border border-s-border",\n' +
    '    variant === "ghost" && "text-s-ink-2",\n' +
    "  );\n" +
    "  return <button className={base}>x</button>;\n" +
    "}\n",
);

// 8. cn(...)/clsx(...) itself must still fire on a genuinely dead argument, the exclusion must
//    not be a blanket downgrade of cn/clsx coverage.
write(
  "app/[locale]/scope/case8-cn-still-fires.tsx",
  'export function C() { return <div className={cn("flex", cond ? "no-real-cn-class" : "items-center")}>x</div>; }\n',
);

// ---------------------------------------------------------------------------------------
// 8b. THE SAME cn()/clsx() TRAP, a different shape: a string argument to some OTHER named
//     function nested inside cn(...), not cn/clsx itself. Real shape from app/[locale]/
//     _components/primitives/ServiceDisclosureRow.tsx:102 and app/[locale]/rewards/
//     RewardsView.tsx:204. "row" and "mut" are typed lookup keys into an internal Record, never
//     rendered as classes; the plain first argument to cn(...) must still fire normally.
// ---------------------------------------------------------------------------------------
write(
  "app/[locale]/scope/case8b-nested-call-arg.tsx",
  'function Helper(tier) { return tier === "row" ? "active:scale-[0.98]" : "active:scale-[0.97]"; }\n' +
    'export function C() { return <button className={cn("min-w-0 no-real-cn-class-x flex-1", Helper("row"), "text-left")}>x</button>; }\n',
);
write(
  "app/[locale]/scope/case8c-nested-call-arg-ternary.tsx",
  'function chipClass(kind) { return kind === "chip" ? "bg-s-ink" : "bg-white"; }\n' +
    'export function C({ active }) { return <span className={chipClass(active ? "chip" : "mut")}>x</span>; }\n',
);

// ---------------------------------------------------------------------------------------
// 9. TEMPLATE LITERAL INTERPOLATION resolved: a ternary of two complete strings nested inside a
//    ${...} still resolves both branches. Real shape from components-legacy/shared/
//    ClientSelectorDropdown.tsx:107. One branch contains a genuinely dead, mangled class; the
//    outer literal text (which ends in a space before the interpolation, not glued to it) must
//    check normally and not be swallowed into review-by-hand.
// ---------------------------------------------------------------------------------------
write(
  "app/[locale]/scope/case9-interp-ternary.tsx",
  "export function Row({ value, id }: { value: string; id: string }) {\n" +
    "  return (\n" +
    "    <button\n" +
    "      className={`flex items-center ${value === id ? 'bg-s-ink/10 font-bold' : 'hover:bg-s-ink/5:bg-white/5 flex'}`}\n" +
    "    >\n" +
    "      x\n" +
    "    </button>\n" +
    "  );\n" +
    "}\n",
);

// 10. an interpolated class string with NO nested quotes (`text-${x}`) is counted under review by
//     hand, not silently dropped, and never a false dead-class finding for the fragment.
write(
  "app/[locale]/scope/case10-interp-bare.tsx",
  "export function C({ x }: { x: string }) { return <div className={`no-real-prefix-${x}`}>y</div>; }\n",
);

// ---------------------------------------------------------------------------------------
// 10b. A COMMENT WRITTEN INSIDE A TEMPLATE INTERPOLATION must still be stripped, same as any
//      other comment. Real shape, app/[locale]/_components/search/SearchOverlay.tsx:2689:
//      a /* ... */ comment sitting between a ternary's branches inside a ${...}, itself
//      containing a quoted English sentence. Before the fix the quoted sentence's individual
//      words leaked through as five separate fake dead-class findings.
// ---------------------------------------------------------------------------------------
write(
  "app/[locale]/scope/case10b-comment-in-interp.tsx",
  "export function C({ selected }: { selected: boolean }) {\n" +
    "  return (\n" +
    "    <button\n" +
    '      className={`flex items-center ${selected ? "bg-s-ink font-bold text-white" /* note: "totally not a real class list here" */ : "font-medium text-s-ink"}`}\n' +
    "    >\n" +
    "      x\n" +
    "    </button>\n" +
    "  );\n" +
    "}\n",
);

// 11. a class value built by string concatenation (+) is counted under review by hand, both
//     fragments, never a false dead-class finding, and a real class in the same call (gap-8)
//     still checks normally.
write(
  "app/[locale]/scope/case11-concat.tsx",
  'export function C() { return <div className={cn("mt-" + "6 gap-8", "flex")}>x</div>; }\n',
);

// ---------------------------------------------------------------------------------------
// 12. BUCKET B: a dead class with no real neighbour (no shared rare word, no edit distance <= 2)
//     never trips --gate.
// ---------------------------------------------------------------------------------------
write(
  "app/[locale]/scope/case12-bucket-b.tsx",
  'export function C() { return <div className="zzqx-totally-unrelated-token-9182">x</div>; }\n',
);

// 13. an all-clean tree (no dead classes at all) for the --gate "passes when nothing is wrong"
//     control, in a second root so it never mixes with the illegal fixtures above.
const cleanRoot = mkdtempSync(join(tmpdir(), "dead-class-suite-clean-"));
function writeClean(relPath, content) {
  const full = join(cleanRoot, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
writeClean(
  "app/[locale]/clean/case13.tsx",
  'export function C() { return <div className="flex items-center gap-2 rounded-card">x</div>; }\n',
);

// ---------------------------------------------------------------------------------------
// 14/15. FAIL CLOSED: an unreadable file and an unreadable directory both exit 2, in BOTH report
// mode and --gate mode (this detector's own convention, distinct from the sibling detector's
// --gate-only exit 1). Handled as their own roots so the suite's own cleanup path never depends
// on a chmod-000 file/directory that is nested inside a shared root.
// ---------------------------------------------------------------------------------------
const fileFailRoot = mkdtempSync(join(tmpdir(), "dead-class-suite-filefail-"));
const lockedPath = join(fileFailRoot, "app/[locale]/x/locked.tsx");
mkdirSync(dirname(lockedPath), { recursive: true });
writeFileSync(lockedPath, 'export function C() { return <div className="flex">x</div>; }\n');
chmodSync(lockedPath, 0o000);

const dirFailRoot = mkdtempSync(join(tmpdir(), "dead-class-suite-dirfail-"));
const lockedDir = join(dirFailRoot, "app/[locale]/locked-dir");
mkdirSync(lockedDir, { recursive: true });
writeFileSync(join(lockedDir, "x.tsx"), 'export function C() { return <div className="flex">x</div>; }\n');
chmodSync(lockedDir, 0o000);

// ---------------------------------------------------------------------------------------
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

function bucketAFor(basename) {
  return outLines.some((l) => l.startsWith("FINDING bucketA ") && l.includes(basename));
}
function bucketBFor(basename) {
  return outLines.some((l) => l.startsWith("FINDING bucketB ") && l.includes(basename));
}
function anyFindingFor(basename) {
  return outLines.some((l) => (l.startsWith("FINDING bucketA ") || l.startsWith("FINDING bucketB ")) && l.includes(basename));
}
function reviewFor(basename) {
  return outLines.some((l) => l.startsWith("REVIEW ") && l.includes(basename));
}
function reviewCount(basename) {
  return outLines.filter((l) => l.startsWith("REVIEW ") && l.includes(basename)).length;
}
function findingCount(basename) {
  return outLines.filter((l) => (l.startsWith("FINDING bucketA ") || l.startsWith("FINDING bucketB ")) && l.includes(basename)).length;
}
function findingLineHas(basename, token) {
  return outLines.some((l) => (l.startsWith("FINDING bucketA ") || l.startsWith("FINDING bucketB ")) && l.includes(basename) && l.includes(` ${token} `.trimEnd()));
}
// True if any FINDING or REVIEW line for basename reports EXACTLY this raw token (the field
// right after the file:line, space-delimited), not just a substring match anywhere in the line.
function rawTokenFlaggedFor(basename, token) {
  return outLines.some((l) => {
    if (!(l.startsWith("FINDING") || l.startsWith("REVIEW")) || !l.includes(basename)) return false;
    const parts = l.split(/\s+/);
    return parts.includes(token);
  });
}

check("report mode exits 0 even with findings present", reportRun.status === 0, `exit ${reportRun.status}`);

// --- case 1: the real incident, known-answer control ---
check(
  "case1: no-scrollbar flagged, bucket A, with scrollbar-hide as a neighbour",
  bucketAFor("case1.tsx") && outLines.some((l) => l.includes("case1.tsx") && l.includes("no-scrollbar") && l.includes("scrollbar-hide")),
);
check("case1: scrollbar-hide itself NOT flagged", !anyFindingFor("case1.tsx") || !outLines.some((l) => l.includes("case1.tsx:1") && / scrollbar-hide /.test(l)));

// --- case 2: arbitrary-value + variant classes NOT flagged ---
check("case2: w-[352px], md:hidden, hover:bg-white, group-hover:opacity-100 NOT flagged", !anyFindingFor("case2-variants.tsx") && !reviewFor("case2-variants.tsx"));

// --- cases 4-6: real class positions only ---
check("case4: a class inside an import path NOT flagged", !anyFindingFor("case4-import.tsx") && !reviewFor("case4-import.tsx"));
check("case5: a class inside a line comment and a block comment NOT flagged", !anyFindingFor("case5-comment.tsx") && !reviewFor("case5-comment.tsx"));
check("case6: a class inside plain JSX text NOT flagged", !anyFindingFor("case6-jsxtext.tsx") && !reviewFor("case6-jsxtext.tsx"));

// --- case 7: the cn()/clsx() object-key trap, zero findings of any kind ---
check(
  "case7: comparison operands (primary/secondary/ghost) inside cn() produce ZERO findings",
  !anyFindingFor("case7-comparison-operand.tsx") && !reviewFor("case7-comparison-operand.tsx"),
  `findings=${findingCount("case7-comparison-operand.tsx")} review=${reviewCount("case7-comparison-operand.tsx")}`,
);

// --- case 8: cn()/clsx() coverage is not blanket-dropped ---
check("case8: cn(...) still fires on a genuinely dead ternary argument", bucketBFor("case8-cn-still-fires.tsx") || bucketAFor("case8-cn-still-fires.tsx"));

// --- case 8b/8c: the object-key trap's OTHER shape, a nested non-cn/clsx call argument ---
check(
  "case8b: Helper(\"row\") argument excluded, but cn(...)'s own plain arguments still fire",
  !rawTokenFlaggedFor("case8b-nested-call-arg.tsx", "row") &&
    anyFindingFor("case8b-nested-call-arg.tsx") &&
    outLines.some((l) => l.includes("case8b-nested-call-arg.tsx") && l.includes("no-real-cn-class-x")),
);
check(
  "case8c: chipClass(active ? \"chip\" : \"mut\") produces ZERO findings, the string sits inside a ternary nested in the call",
  !anyFindingFor("case8c-nested-call-arg-ternary.tsx") && !reviewFor("case8c-nested-call-arg-ternary.tsx"),
);

// --- case 9: nested ternary inside a template interpolation resolves both branches ---
check(
  "case9: the mangled hover:bg-s-ink/5:bg-white/5 branch is found dead",
  anyFindingFor("case9-interp-ternary.tsx") && outLines.some((l) => l.includes("case9-interp-ternary.tsx") && l.includes("hover:bg-s-ink/5:bg-white/5")),
);
check(
  "case9: the outer literal text (space-separated from the interpolation) is NOT swallowed into review",
  !outLines.some((l) => l.includes("case9-interp-ternary.tsx") && l.startsWith("REVIEW") && l.includes("items-center")),
);

// --- case 10: bare interpolation, no nested quotes, routed to review, never a false finding ---
check(
  "case10: text-${x}-shaped fragment (no-real-prefix-) routed to review, not a false dead finding",
  reviewFor("case10-interp-bare.tsx") && !anyFindingFor("case10-interp-bare.tsx"),
);

// --- case 10b: a comment INSIDE a template interpolation is stripped, its quoted sentence never leaks in ---
check(
  "case10b: a /* */ comment inside a ${...} is stripped, its quoted sentence produces ZERO findings",
  !anyFindingFor("case10b-comment-in-interp.tsx") && !reviewFor("case10b-comment-in-interp.tsx"),
  `findings=${findingCount("case10b-comment-in-interp.tsx")} review=${reviewCount("case10b-comment-in-interp.tsx")}`,
);

// --- case 11: string concatenation, both fragments reviewed, real class still checks ---
check(
  "case11: concatenation fragments (mt-, 6) both routed to review, never a false finding",
  reviewCount("case11-concat.tsx") === 2 && !anyFindingFor("case11-concat.tsx"),
  `review count=${reviewCount("case11-concat.tsx")}`,
);

// --- case 12: bucket B, no neighbour ---
check("case12: a dead class with no neighbour lands in bucket B", bucketBFor("case12-bucket-b.tsx") && !bucketAFor("case12-bucket-b.tsx"));

const gateRun = run(root, ["--gate"]);
check(
  "gate mode exits non-zero when a bucket A finding and an unreadable file exist (none unreadable here, bucket A alone)",
  gateRun.status !== 0,
  `exit ${gateRun.status}`,
);

// --- case 13: --gate passes on an all-clean tree ---
const gateCleanRun = run(cleanRoot, ["--gate"]);
check("case13: gate mode exits 0 on an all-clean tree", gateCleanRun.status === 0, `exit ${gateCleanRun.status}`);

// --- bucket B alone never trips --gate ---
const bucketBOnlyRoot = mkdtempSync(join(tmpdir(), "dead-class-suite-bucketb-"));
mkdirSync(join(bucketBOnlyRoot, "app/[locale]/x"), { recursive: true });
writeFileSync(
  join(bucketBOnlyRoot, "app/[locale]/x/case.tsx"),
  'export function C() { return <div className="zzqx-totally-unrelated-token-9182">x</div>; }\n',
);
const gateBucketBRun = run(bucketBOnlyRoot, ["--gate"]);
check("bucket B alone does not trip --gate", gateBucketBRun.status === 0, `exit ${gateBucketBRun.status}`);
rmSync(bucketBOnlyRoot, { recursive: true, force: true });

// --- cases 14/15: fail closed, exit 2, both report mode and --gate mode ---
const fileFailReportRun = run(fileFailRoot);
check("case14: an unreadable FILE exits 2 in report mode", fileFailReportRun.status === 2, `exit ${fileFailReportRun.status}`);
check(
  "case14: an unreadable FILE is reported loudly, never counted clean",
  ((fileFailReportRun.stdout || "") + (fileFailReportRun.stderr || "")).includes("UNREADABLE") &&
    ((fileFailReportRun.stdout || "") + (fileFailReportRun.stderr || "")).includes("locked.tsx"),
);
const fileFailGateRun = run(fileFailRoot, ["--gate"]);
check("case14: an unreadable FILE exits 2 in --gate mode too, not 1", fileFailGateRun.status === 2, `exit ${fileFailGateRun.status}`);

const dirFailReportRun = run(dirFailRoot);
check("case15: an unreadable DIRECTORY exits 2 in report mode", dirFailReportRun.status === 2, `exit ${dirFailReportRun.status}`);
check(
  "case15: an unreadable DIRECTORY is reported loudly, never counted clean",
  ((dirFailReportRun.stdout || "") + (dirFailReportRun.stderr || "")).includes("UNREADABLE") &&
    ((dirFailReportRun.stdout || "") + (dirFailReportRun.stderr || "")).includes("locked-dir"),
);
const dirFailGateRun = run(dirFailRoot, ["--gate"]);
check("case15: an unreadable DIRECTORY exits 2 in --gate mode too, not 1", dirFailGateRun.status === 2, `exit ${dirFailGateRun.status}`);

// --- a missing --root path entirely: same fail-closed shape ---
const missingRoot = join(tmpdir(), `dead-class-suite-missing-${Date.now()}`);
const missingRootRun = run(missingRoot);
check(
  "missing --root path exits 2, reported loudly",
  missingRootRun.status === 2 && ((missingRootRun.stdout || "") + (missingRootRun.stderr || "")).includes("UNREADABLE"),
  `exit ${missingRootRun.status}`,
);

// Cleanup. chmod the locked fixtures back before rmSync so removal never depends on directory-
// only permissions across platforms.
try { chmodSync(lockedPath, 0o644); } catch { /* best-effort */ }
try { chmodSync(lockedDir, 0o755); } catch { /* best-effort */ }
rmSync(root, { recursive: true, force: true });
rmSync(cleanRoot, { recursive: true, force: true });
rmSync(fileFailRoot, { recursive: true, force: true });
rmSync(dirFailRoot, { recursive: true, force: true });

console.log("");
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
