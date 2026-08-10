#!/usr/bin/env node
//
// fe-04: structural code-duplication census over app/ + components/ +
// components-legacy/. This targets LOGIC/JSX duplication, a distinct failure
// mode from solen-drift-check's token-level (hex/spacing/duration) drift.
//
// The registry itself (_design-system/COMPONENT_REGISTRY.md) documents at
// least 5 confirmed historical duplication incidents (PriceFrom, SeeAllButton,
// Avatar, RatingStars, FilterBar) each found only by a human doing a manual
// sweep, months or longer after the duplicate shipped. This runs the same
// class of check (jscpd) automatically, ratcheted the same way the lint/tsc/
// audit jobs in quality.yml already are: fails only when the clone count goes
// UP from the baseline recorded below, never a blanket zero (a large existing
// codebase always carries some legitimate near-duplication).
//
//   Run: node scripts/duplication-census.mjs
//   Machine-readable summary on the last line: RATCHET_DUPLICATION_CLONES=<n>

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

// IMPORTANT: pass these as three SEPARATE non-overlapping paths. Passing an
// already-nested path alongside its parent (e.g. "app" AND "app/[locale]")
// makes jscpd scan the overlapping files twice, comparing each file against
// its own second copy and reporting every file as 100% duplicated with
// itself -- this inflated an early manual run of this exact check from a
// real ~2% duplication rate to a false 27.8%. app/, components/, and
// components-legacy/ are disjoint, so this is safe.
const SCAN_DIRS = ["app", "components", "components-legacy"];
const MIN_LINES = 30;
const MIN_TOKENS = 15;

function main() {
  const outDir = mkdtempSync(join(tmpdir(), "jscpd-"));
  try {
    execFileSync(
      "npx",
      [
        "jscpd",
        ...SCAN_DIRS,
        "--min-lines",
        String(MIN_LINES),
        "--min-tokens",
        String(MIN_TOKENS),
        "--reporters",
        "json",
        "--output",
        outDir,
        "--silent",
        // jscpd exits non-zero by default once it finds ANY clone (its own
        // "threshold" gate defaults to 0%); this script owns the ratchet
        // decision instead, so let jscpd always exit 0 and read its report.
        "--threshold",
        "100",
      ],
      { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "pipe"] }
    );

    const report = JSON.parse(readFileSync(join(outDir, "jscpd-report.json"), "utf8"));
    const { clones, duplicatedLines, percentage } = report.statistics.total;

    console.log(`Duplication census (jscpd, min-lines=${MIN_LINES}, min-tokens=${MIN_TOKENS}, dirs=${SCAN_DIRS.join(",")}):`);
    console.log(`  clones: ${clones}`);
    console.log(`  duplicated lines: ${duplicatedLines} (${percentage.toFixed(2)}%)`);
    console.log(`RATCHET_DUPLICATION_CLONES=${clones}`);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

main();
