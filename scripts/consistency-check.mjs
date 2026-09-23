#!/usr/bin/env node
//
// Umbrella entry point for the consistency system built this session: 5 report-mode
// detectors + 2 live PreToolUse gates, previously only reachable as separate npm commands.
// This file runs the 5 detectors and prints ONE unified dashboard. ORCHESTRATION ONLY:
// no new detection logic, no new rule, blocks nothing (always exits 0). Each detector still
// writes its own full report to _design-system/_*-report.md; this script just runs them and
// summarizes the headline count each one already prints to stdout.
//
//   Run:  npm run consistency
//   Out:  a stdout dashboard only (no report file of its own, nothing new to keep in sync)
//
// All detectors are report-only; no write-time gate enforces them.
//
// Robustness: each detector runs in its own try/catch. A single detector erroring (bad exit
// code, thrown exception, missing script) prints a FAILED line for that detector only and the
// run continues, it never aborts the rest of the dashboard.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

// ---------------------------------------------------------------------------------------
// Tunables: the 5 detectors. Add a new one here (script path, npm script name, headline
// regex against that detector's own stdout summary line) when a 6th detector ships; nothing
// else in this file needs to change.
// ---------------------------------------------------------------------------------------
const DETECTORS = [
  {
    key: "dupe-check",
    label: "Component duplication",
    catches: "component re-implementation (a hand-rolled JSX tree reimplementing a locked registry primitive)",
    scriptPath: "scripts/detect-near-duplicates.mjs",
    npmScript: "dupe-check",
    gated: false,
    reportPath: "_design-system/_dupe-report.md",
    parseHeadline: (stdout) => {
      const m = /High-confidence findings:\s*(\d+)/.exec(stdout);
      return m ? { count: Number(m[1]), label: "high-confidence findings" } : null;
    },
  },
  {
    key: "icon-check",
    label: "Icon-system mismatch",
    catches: "3D-icon / Lucide mixing (illustrated category icons used outside their blessed contexts)",
    scriptPath: "scripts/detect-icon-system-mismatch.mjs",
    npmScript: "icon-check",
    gated: false,
    reportPath: "_design-system/_icon-system-report.md",
    parseHeadline: (stdout) => {
      const m = /Violations \(non-blessed 3D-icon usage\):\s*\d+ files?,\s*(\d+) reference/.exec(stdout);
      return m ? { count: Number(m[1]), label: "flagged references" } : null;
    },
  },
  {
    key: "type-check-scale",
    label: "Type-scale outliers",
    catches: "off-scale font sizes (a text-[Npx] utility outside the locked LOCKFILE type scale)",
    scriptPath: "scripts/detect-type-scale-outliers.mjs",
    npmScript: "type-check-scale",
    gated: false,
    reportPath: "_design-system/_type-scale-report.md",
    parseHeadline: (stdout) => {
      const m = /Total off-scale usages:\s*(\d+)/.exec(stdout);
      return m ? { count: Number(m[1]), label: "off-scale usages" } : null;
    },
  },
  {
    key: "selected-check",
    label: "Selected-state divergence",
    catches: "selected-state divergence (a selected/active treatment that is not the locked gray-fill recipe)",
    scriptPath: "scripts/detect-selected-state-divergence.mjs",
    npmScript: "selected-check",
    gated: false,
    reportPath: "_design-system/_selected-state-report.md",
    parseHeadline: (stdout) => {
      const m = /Hard divergences:\s*(\d+)/.exec(stdout);
      return m ? { count: Number(m[1]), label: "hard divergences" } : null;
    },
  },
  {
    key: "gap-ladder-check",
    label: "Gap-ladder drift",
    catches: "an illegal margin/gap/space utility (over 16px, not exactly 32px) on a file governed by the binary 16-and-32 spacing law, either by its own header claiming TERMINAL_PRINCIPLES.md/Round D1 or by sitting under a real operator path (dashboard, terminal, host-flows)",
    scriptPath: "scripts/detect-gap-ladder-drift.mjs",
    npmScript: "gap-ladder-check",
    gated: false,
    reportPath: "_design-system/_gap-ladder-report.md",
    parseHeadline: (stdout) => {
      const m = /Total illegal gap-ladder utilities:\s*(\d+)/.exec(stdout);
      return m ? { count: Number(m[1]), label: "illegal gap-ladder utilities" } : null;
    },
  },
  {
    key: "dead-class-check",
    label: "Dead classes",
    catches: "a literal class token that Tailwind's JIT compiled with zero matching CSS rule (a plausible-looking utility that produces no CSS, the no-scrollbar shape), bucket A only (a near neighbour to a real class exists)",
    scriptPath: "scripts/detect-dead-class.mjs",
    npmScript: "dead-class-check",
    gated: false,
    reportPath: "_design-system/_dead-class-report.md",
    parseHeadline: (stdout) => {
      const m = /Total dead classes \(bucket A[^)]*\):\s*(\d+)/.exec(stdout);
      return m ? { count: Number(m[1]), label: "dead classes (bucket A, near-miss)" } : null;
    },
  },
];

// ---------------------------------------------------------------------------------------
// Run one detector as a child process, exactly what `npm run <script>` runs (same
// `node <scriptPath>` command each package.json script wraps), so this dashboard can never
// see a different result than running the command by hand.
// ---------------------------------------------------------------------------------------
function runDetector(d) {
  const absScriptPath = join(REPO_ROOT, d.scriptPath);
  if (!existsSync(absScriptPath)) {
    return { ok: false, error: `script not found: ${d.scriptPath}` };
  }
  let result;
  try {
    result = spawnSync(process.execPath, [absScriptPath], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 32,
    });
  } catch (err) {
    return { ok: false, error: `spawn threw: ${err.message}` };
  }
  if (result.error) {
    return { ok: false, error: `spawn error: ${result.error.message}` };
  }
  if (result.status !== 0) {
    const tail = (result.stderr || result.stdout || "").trim().split("\n").slice(-5).join("\n");
    return { ok: false, error: `exited with status ${result.status}${tail ? `\n    ${tail.split("\n").join("\n    ")}` : ""}` };
  }
  let headline = null;
  try {
    headline = d.parseHeadline(result.stdout || "");
  } catch {
    headline = null;
  }
  return { ok: true, stdout: result.stdout || "", headline };
}

// Each detector gets its own try/catch on top of runDetector's own internal handling, so a
// bug in this orchestrator's own code (not just the child process) can never abort the loop.
const results = DETECTORS.map((d) => {
  try {
    return { detector: d, ...runDetector(d) };
  } catch (err) {
    return { detector: d, ok: false, error: `unexpected: ${err.message}` };
  }
});

// ---------------------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------------------
const WIDTH = 78;
const RULE = "=".repeat(WIDTH);
const SUB_RULE = "-".repeat(WIDTH);

console.log("");
console.log(RULE);
console.log("SOLEN CONSISTENCY DASHBOARD  (npm run consistency)");
console.log(RULE);
console.log("");
console.log("Runs the 5 report-mode detectors and prints one unified summary. Orchestration");
console.log("only, no new detection logic, blocks nothing. Full detail always lives in each");
console.log("detector's own _design-system/_*-report.md, this is a pointer, not a replacement.");
console.log("");

for (const r of results) {
  const d = r.detector;
  console.log(SUB_RULE);
  console.log(`${d.label}  (npm run ${d.npmScript})`);
  console.log(`  catches:  ${d.catches}`);
  console.log(`  mode:     ${d.gated ? `GATED, also enforced live by ${d.gatePath}` : "REPORT-ONLY, no live gate"}`);
  if (!r.ok) {
    console.log(`  status:   FAILED, ${r.error}`);
    console.log(`  report:   ${d.reportPath} (stale, this run did not refresh it)`);
  } else if (r.headline) {
    console.log(`  headline: ${r.headline.count} ${r.headline.label}`);
    console.log(`  report:   ${d.reportPath}`);
  } else {
    console.log("  headline: ran ok, could not parse a headline count from its stdout (see report)");
    console.log(`  report:   ${d.reportPath}`);
  }
  console.log("");
}

console.log(SUB_RULE);
const parsedCounts = results.filter((r) => r.ok && r.headline).map((r) => r.headline.count);
const failedCount = results.filter((r) => !r.ok).length;
const total = parsedCounts.reduce((n, c) => n + c, 0);
console.log(
  `TOTAL: ${total} findings across ${parsedCounts.length}/${DETECTORS.length} detectors that reported a headline` +
    (failedCount ? ` (${failedCount} FAILED to run this pass, see above)` : "") +
    ". Full detail lives in each _design-system/_*-report.md listed above.",
);
console.log(RULE);
console.log("");

// This is a diagnostic dashboard, never a gate. Always exits 0, even when a detector fails,
// so it is safe to run anywhere (including from another script or a hook) without risking a
// build/commit block that no rule asked for.
process.exit(0);
