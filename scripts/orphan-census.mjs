#!/usr/bin/env node
//
// fe-07: Rule 40's zero-importer bash loop (_rules/STRUCTURAL_RULES.md) was written as a
// manual snippet a human might paste in, never wired to run on a cadence. components-legacy
// is explicitly named "legacy" yet had no schedule forcing its dead weight out; every
// deletion in _design-system/REMOVED.md so far happened via an irregularly-named manual pass
// ("ring 4b", "loop iter4", "SWEEP_BACKLOG"), meaning the folder only shrinks when an agent
// happens to go looking, and grows continuously in between.
//
// This is that loop, corrected and made real: a basename-only grep for each component's own
// name across app/+components/+components-legacy/+lib, excluding the component's own file.
// A component with 0 mentions anywhere outside itself is an orphan. Meant to run on a monthly
// schedule (.github/workflows/orphan-sweep.yml) writing _design-system/ORPHAN_REPORT.md, not
// gating any PR.
//
//   Run: node scripts/orphan-census.mjs [--write]
//   --write: also regenerates _design-system/ORPHAN_REPORT.md
//   Machine-readable summary on the last line: RATCHET_ORPHAN_COMPONENTS=<n>

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { REPO_ROOT, scanComponents } from "./lib/scan-surface.mjs";

function countMentions(name, ownFile) {
  // Basename-only word-boundary grep across the four surfaces components can legitimately be
  // consumed from. -w gives word-boundary matching, so "Avatar" doesn't false-match "AvatarGroup".
  let out;
  try {
    out = execFileSync(
      "grep",
      ["-rlw", name, "app", "components", "components-legacy", "lib", "--include=*.tsx", "--include=*.ts"],
      { cwd: REPO_ROOT, encoding: "utf8" }
    );
  } catch (err) {
    // grep exits 1 when it finds nothing, that's a real "0 mentions" result, not an error.
    out = err.status === 1 ? "" : (() => { throw err; })();
  }
  const files = out.split("\n").map((f) => f.trim()).filter(Boolean);
  return files.filter((f) => f !== ownFile).length;
}

function main() {
  const write = process.argv.includes("--write");
  const components = scanComponents();
  const orphans = [];

  for (const c of components) {
    const mentions = countMentions(c.name, c.file);
    if (mentions === 0) orphans.push(c);
  }

  console.log(`Orphan census: ${orphans.length} of ${components.length} components have zero mentions outside their own file.`);
  for (const o of orphans) {
    console.log(`  ORPHAN: ${o.file}`);
  }
  console.log(`RATCHET_ORPHAN_COMPONENTS=${orphans.length}`);

  if (write) {
    const date = new Date().toISOString().slice(0, 10);
    const lines = [
      "# Orphan Component Report",
      "",
      `Generated ${date} by \`node scripts/orphan-census.mjs --write\` (fe-07). Runs monthly via`,
      "`.github/workflows/orphan-sweep.yml`, does not block any PR.",
      "",
      "A component below has ZERO mentions of its own basename anywhere under app/, components/,",
      "components-legacy/, or lib/ outside its own file. That does not automatically mean dead,",
      "check for a dynamic import, a barrel re-export under a different name, or a genuine",
      "in-progress build, but a component appearing here on 2 consecutive monthly runs is a",
      "real deletion candidate per _rules/STRUCTURAL_RULES.md Rule 41.",
      "",
      `**This run: ${orphans.length} orphan(s) of ${components.length} total components scanned.**`,
      "",
      "| Component | File |",
      "|---|---|",
      ...orphans.map((o) => `| ${o.name} | \`${o.file}\` |`),
      "",
      "Action: either (a) delete the file plus add a `_design-system/REMOVED.md` line via",
      "`npm run removed -- ...`, or (b) add a one-line `// KEEP: <reason>` comment at the top of",
      "the file naming a concrete reason it stays, before the next monthly run.",
      "",
    ];
    writeFileSync(join(REPO_ROOT, "_design-system", "ORPHAN_REPORT.md"), lines.join("\n"));
    console.log("Wrote _design-system/ORPHAN_REPORT.md");
  }
}

main();
