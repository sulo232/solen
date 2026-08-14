#!/usr/bin/env node
//
// check-invariants , cross-checks that the doc/hook system says the truth about itself.
//   Usage: node scripts/check-invariants.mjs [--repo-only]
//
// --repo-only skips the two checks that read outside the repo (global hook settings +
// global memory index), so CI (which only has the repo checked out) can still run
// invariant C. Locally (with the full home dir), run all three.
//
// Invariants:
//   A. Global hooks wired-vs-disk , every hook path referenced in ~/.claude/settings.json
//      must exist on disk (FAIL if missing); every hook file on disk not referenced
//      anywhere is a WARN (dead weight, not a failure).
//   B. Memory index , every markdown file in the global memory dir (except MEMORY.md
//      and RETIRED_*) must be linked from MEMORY.md (FAIL each orphan); every relative
//      .md link target in MEMORY.md must exist on disk (FAIL each dead link).
//   C. Doc paths alive , every _plans/_design-system/_tasks/_rules/_inventory/*.md path
//      referenced in CLAUDE.md or _plans/ACTIVE.md must exist relative to the project
//      root (FAIL each dead path).
//   D. Workflows actually run , for every .github/workflows/*.yml: any job using a LOCAL
//      action (uses: ./...) must run actions/checkout BEFORE it (FAIL), and a workflow
//      declaring workflow_dispatch must leave at least one job reachable by a manual run
//      (FAIL). Born 2026-07-15: all 15 cron jobs pinged ./.github/actions/ping-cron with no
//      checkout and died in ~6s on every run for weeks, so generate-slots never fired,
//      availability_slots ran dry, and booking broke at 27/28 salons. actionlint does NOT
//      catch either class (verified: it exits 0 on the broken shape).
//
// Exits 1 if any invariant FAILs, 0 otherwise. Prints PASS/FAIL per invariant.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import os from "node:os";
import yaml from "js-yaml";

const REPO_ONLY = process.argv.includes("--repo-only");
const PROJECT_ROOT = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const HOME = os.homedir();

let anyFail = false;
const results = []; // { name, pass, lines: [] }

function report(name, pass, lines) {
  results.push({ name, pass, lines: lines || [] });
  if (!pass) anyFail = true;
}

function expandHome(p) {
  if (p.startsWith("$HOME")) return HOME + p.slice("$HOME".length);
  if (p.startsWith("~")) return HOME + p.slice(1);
  return p;
}

function allMatches(text, regex) {
  const out = [];
  for (const m of text.matchAll(regex)) out.push(m);
  return out;
}

// ---------------------------------------------------------------------------
// Invariant A: global hooks wired-vs-disk
// ---------------------------------------------------------------------------
function checkHooksWiredVsDisk() {
  const settingsPath = join(HOME, ".claude", "settings.json");
  const hooksDir = join(HOME, ".claude", "hooks");

  if (!existsSync(settingsPath)) {
    report("A. Global hooks wired-vs-disk", true, ["SKIP: " + settingsPath + " not found"]);
    return;
  }

  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch (err) {
    report("A. Global hooks wired-vs-disk", false, ["FAIL: could not parse " + settingsPath + ": " + err.message]);
    return;
  }

  // Collect every command string anywhere under hooks.*.hooks[].command
  const commands = [];
  const hooksRoot = settings.hooks || {};
  for (const eventName of Object.keys(hooksRoot)) {
    const matchers = hooksRoot[eventName];
    if (!Array.isArray(matchers)) continue;
    for (const matcher of matchers) {
      const hookList = matcher && matcher.hooks;
      if (!Array.isArray(hookList)) continue;
      for (const h of hookList) {
        if (h && typeof h.command === "string") commands.push(h.command);
      }
    }
  }

  // Extract every path under .claude/hooks/ referenced in any command string.
  const hooksPathRe = /(\$HOME|~|\/[^\s"']*)?\/?\.claude\/hooks\/[A-Za-z0-9_.\-\/]+/g;
  const referenced = new Set();
  for (const cmd of commands) {
    const found = allMatches(cmd, hooksPathRe);
    for (const m of found) {
      referenced.add(expandHome(m[0]));
    }
  }

  const lines = [];
  let pass = true;
  for (const refPath of [...referenced].sort()) {
    if (!existsSync(refPath)) {
      pass = false;
      lines.push("FAIL: referenced hook does not exist on disk: " + refPath);
    }
  }

  // WARN: any *.py/*.sh in hooksDir (excluding _retired/ and *.bak*) never referenced.
  if (existsSync(hooksDir)) {
    const referencedBasenames = new Set([...referenced].map((p) => p.split("/").pop()));
    let entries = [];
    try {
      entries = readdirSync(hooksDir);
    } catch {
      entries = [];
    }
    for (const entry of entries) {
      if (entry === "_retired") continue;
      if (entry.includes(".bak")) continue;
      if (!(entry.endsWith(".py") || entry.endsWith(".sh"))) continue;
      const full = join(hooksDir, entry);
      let isFile = false;
      try {
        isFile = statSync(full).isFile();
      } catch {
        isFile = false;
      }
      if (!isFile) continue;
      if (!referencedBasenames.has(entry)) {
        lines.push("WARN: " + entry + " exists in " + hooksDir + " but is never referenced in settings.json");
      }
    }
  }

  if (lines.length === 0) lines.push("all referenced hooks resolve, no unreferenced hook files");
  report("A. Global hooks wired-vs-disk", pass, lines);
}

// ---------------------------------------------------------------------------
// Invariant B: memory index
// ---------------------------------------------------------------------------
function checkMemoryIndex() {
  const memDir = join(HOME, ".claude", "projects", "-Users-sulo-Documents-solen", "memory");
  const memoryMd = join(memDir, "MEMORY.md");

  if (!existsSync(memDir) || !existsSync(memoryMd)) {
    report("B. Memory index", true, ["SKIP: " + memDir + " not found"]);
    return;
  }

  const memoryContent = readFileSync(memoryMd, "utf8");
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  const linkTargets = new Set();
  for (const m of allMatches(memoryContent, linkRe)) {
    linkTargets.add(m[1]);
  }

  const lines = [];
  let pass = true;

  // Every *.md in memDir except MEMORY.md / RETIRED_* must be a link target.
  let entries = [];
  try {
    entries = readdirSync(memDir);
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.endsWith(".md")) continue;
    if (entry === "MEMORY.md") continue;
    if (entry.startsWith("RETIRED_")) continue;
    if (!linkTargets.has(entry)) {
      pass = false;
      lines.push("FAIL: orphaned memory file not linked from MEMORY.md: " + entry);
    }
  }

  // Every relative .md link target must exist in memDir.
  for (const target of linkTargets) {
    if (/^[a-z]+:\/\//i.test(target)) continue; // skip absolute URLs
    if (!target.endsWith(".md")) continue;
    if (target.startsWith("/")) continue; // not a relative link, skip
    const full = join(memDir, target);
    if (!existsSync(full)) {
      pass = false;
      lines.push("FAIL: dead link in MEMORY.md, target does not exist: " + target);
    }
  }

  if (lines.length === 0) lines.push("every memory file linked, every link target exists");
  report("B. Memory index", pass, lines);
}

// ---------------------------------------------------------------------------
// Invariant C: doc paths alive
// ---------------------------------------------------------------------------
function checkDocPathsAlive() {
  const claudeMd = join(PROJECT_ROOT, "CLAUDE.md");
  const activeMd = join(PROJECT_ROOT, "_plans", "ACTIVE.md");
  const pathRe = /(?:_plans|_design-system|_tasks|_rules|_inventory)\/[A-Za-z0-9_.\/-]+\.md/g;

  const found = new Set();
  for (const file of [claudeMd, activeMd]) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    for (const m of allMatches(content, pathRe)) found.add(m[0]);
  }

  const lines = [];
  let pass = true;
  for (const relPath of [...found].sort()) {
    const full = join(PROJECT_ROOT, relPath);
    if (!existsSync(full)) {
      pass = false;
      lines.push("FAIL: dead doc path referenced: " + relPath);
    }
  }

  if (found.size === 0) {
    lines.push("SKIP: no doc paths found (CLAUDE.md / _plans/ACTIVE.md missing or empty of matches)");
  } else if (lines.length === 0) {
    lines.push("all " + found.size + " referenced doc paths exist");
  }
  report("C. Doc paths alive", pass, lines);
}

// ---------------------------------------------------------------------------
// Invariant D: workflows actually run
// ---------------------------------------------------------------------------
function checkWorkflowsActuallyRun() {
  const dir = join(PROJECT_ROOT, ".github", "workflows");
  const lines = [];
  let pass = true;

  if (!existsSync(dir)) {
    report("D. Workflows actually run", true, ["SKIP: no .github/workflows directory"]);
    return;
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  let jobsChecked = 0;

  for (const file of files.sort()) {
    let doc;
    try {
      doc = yaml.load(readFileSync(join(dir, file), "utf8"));
    } catch (err) {
      pass = false;
      lines.push("FAIL: " + file + " is not parseable YAML: " + err.message);
      continue;
    }
    if (!doc || typeof doc !== "object" || !doc.jobs) continue;

    // `on:` parses as the boolean true under YAML 1.1, hence the two lookups.
    const on = doc.on ?? doc[true] ?? {};
    const hasDispatch = Object.prototype.hasOwnProperty.call(on, "workflow_dispatch");
    let dispatchReachable = !hasDispatch;

    for (const [jobName, job] of Object.entries(doc.jobs)) {
      if (!job || typeof job !== "object") continue;
      jobsChecked++;
      const steps = Array.isArray(job.steps) ? job.steps : [];
      const uses = steps.map((s) => (s && typeof s.uses === "string" ? s.uses : ""));
      const localIdx = uses.findIndex((u) => u.startsWith("./"));
      const checkoutIdx = uses.findIndex((u) => u.startsWith("actions/checkout"));

      if (localIdx !== -1 && (checkoutIdx === -1 || checkoutIdx > localIdx)) {
        pass = false;
        lines.push(
          "FAIL: " + file + " job '" + jobName + "' uses the local action '" + uses[localIdx] +
          "' with no actions/checkout before it , it cannot exist on the runner, the job dies in seconds",
        );
      }

      // A workflow_dispatch button that fires nothing is worse than no button.
      const cond = typeof job.if === "string" ? job.if : "";
      if (hasDispatch && (!cond || !cond.includes("github.event.schedule") || cond.includes("workflow_dispatch"))) {
        dispatchReachable = true;
      }
    }

    if (hasDispatch && !dispatchReachable) {
      pass = false;
      lines.push(
        "FAIL: " + file + " declares workflow_dispatch but every job is gated on " +
        "github.event.schedule, which is empty on a manual run , the Run-workflow button runs nothing",
      );
    }
  }

  if (lines.length === 0) {
    lines.push("all " + jobsChecked + " jobs across " + files.length + " workflow file(s) can actually run");
  }
  report("D. Workflows actually run", pass, lines);
}

function checkSalonPhotoIntegrity() {
  // Invariant E (2026-07-27). The imagery floor asks for roughly a third of every browse viewport
  // to be photographic, and the SalonCard now renders cover_photo_url to satisfy it. That makes the
  // PHOTO DATA load-bearing, and it is currently not trustworthy: measured this session against the
  // live database, salon_photos holds 0 rows for 28 salons, every cover is a remote stock URL, and
  // one Unsplash image is the cover for FOUR different salons (plus another shared by four, one by
  // three, one by two). A stock photo presented as a named business's premises is a truth problem
  // the no-fabrication rule never covered, because the field is populated and looks fine.
  //
  // This check cannot fix that: only real photographs of the real businesses can, and that is the
  // owner's to commission (workstream 42, D2b). What it CAN do is make the condition impossible to
  // forget, and catch the moment a duplicate creeps back in after real photos land.
  //
  // Reads the committed inventory snapshot, never the live database, so it stays offline and
  // deterministic in CI. That is also why it reports rather than fails: the snapshot cannot see
  // cover_photo_url values today, so the strict duplicate test needs the live read that
  // scripts/salon-photo-audit does. Wire it to FAIL once the snapshot carries the column.
  const lines = [];
  const snapshotPath = join(PROJECT_ROOT, "_inventory", "_db-snapshot.json");

  if (!existsSync(snapshotPath)) {
    report("E. Salon photo integrity", true, ["SKIP: no _inventory/_db-snapshot.json on disk"]);
    return;
  }

  let snap;
  try {
    snap = JSON.parse(readFileSync(snapshotPath, "utf8"));
  } catch (err) {
    report("E. Salon photo integrity", false, ["FAIL: snapshot is not parseable JSON: " + err.message]);
    return;
  }

  const tables = Array.isArray(snap.tables) ? snap.tables : [];
  const photos = tables.find((t) => t && t.name === "salon_photos");
  const salons = tables.find((t) => t && t.name === "salons");

  if (!photos || !salons) {
    report("E. Salon photo integrity", true, ["SKIP: salons or salon_photos missing from the snapshot"]);
    return;
  }

  lines.push("snapshot captured " + (snap.capturedAt || "unknown") + ": salons=" + salons.rows + ", salon_photos=" + photos.rows);

  if (photos.rows === 0 && salons.rows > 0) {
    lines.push(
      "REPORT: salon_photos is EMPTY for " + salons.rows + " salons, so every card is falling back to " +
      "salons.cover_photo_url, which is stock imagery shared across several salons. The imagery floor " +
      "is satisfied by pixels but not by truth. Owner action, workstream 42 D2b: commission real " +
      "photographs. See _plans/PRINCIPLES_IMPLEMENTATION.md."
    );
  } else if (photos.rows > 0) {
    lines.push("salon_photos has rows: re-run the live duplicate audit before trusting card imagery");
  }

  // Report-only by design, see the header comment.
  report("E. Salon photo integrity", true, lines);
}

// ---------------------------------------------------------------------------
// Invariant F: LOCKFILE hex vs drift-check ALLOWED_HEX reconciliation
// ---------------------------------------------------------------------------
function checkBuiltAssetsAreRendered() {
  // Invariant G (2026-08-10). THE FAILURE THIS EXISTS FOR, measured the day it was written:
  // `public/_pixel-refs/solen-icons/out/` holds 12 finished animated-icon clips, produced over 43
  // rounds of the owner's own feedback (`_plans/AIRBNB_ANIMATED_ICONS_R2.md`, 99KB). A grep for
  // `solen-icons` across `app/` and `lib/` returned ZERO hits. Weeks of approved work that never
  // reached a screen, and nobody noticed until he asked where it went.
  //
  // Why this is a check and not a gate: nothing was wrong at the moment each file was written. The
  // defect only exists LATER, as an absence, which is exactly the shape a PreToolUse gate cannot
  // see. It is also cheap and objective: a rendered-output directory either has a reference in the
  // app or it does not.
  //
  // Reports rather than fails. An asset can legitimately sit unwired for a while (a mockup
  // reference, a capture kept for measurement). The point is that it stops being invisible.
  const lines = [];
  const OUT_DIRS = [
    ["public/_pixel-refs/solen-icons/out", "solen-icons"],
  ];

  let anyUnwired = false;
  for (const [rel, needle] of OUT_DIRS) {
    const dir = join(PROJECT_ROOT, rel);
    if (!existsSync(dir)) continue;
    let files = [];
    try {
      files = readdirSync(dir).filter((f) => /\.(webm|apng|png|mp4|json)$/i.test(f));
    } catch {
      continue;
    }
    if (files.length === 0) continue;

    let refs = 0;
    for (const root of ["app", "lib", "components-legacy"]) {
      const base = join(PROJECT_ROOT, root);
      if (!existsSync(base)) continue;
      const stack = [base];
      while (stack.length) {
        const cur = stack.pop();
        let entries = [];
        try {
          entries = readdirSync(cur, { withFileTypes: true });
        } catch {
          continue;
        }
        for (const e of entries) {
          const full = join(cur, e.name);
          if (e.isDirectory()) {
            stack.push(full);
          } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
            try {
              if (readFileSync(full, "utf8").includes(needle)) refs += 1;
            } catch {
              // unreadable file is not a finding
            }
          }
        }
      }
    }

    if (refs === 0) {
      anyUnwired = true;
      lines.push(
        `UNWIRED: ${rel} holds ${files.length} built file(s) and NOTHING in app/, lib/ or ` +
        `components-legacy/ references "${needle}". Finished work that reaches no screen.`,
      );
    } else {
      lines.push(`OK: ${rel} (${files.length} files) is referenced from ${refs} source file(s)`);
    }
  }

  if (lines.length === 0) {
    report("G. Built assets reach a screen", true, ["SKIP: no tracked output directories on disk"]);
    return;
  }
  // Reports, never fails: see the header. The value is visibility, not a red build.
  report("G. Built assets reach a screen", true, anyUnwired ? lines : lines);
}

function checkColorTokenReconciliation() {
  // Finding doc-to-gate-drift-reconciliation (2026-07-27): the drift-check gate hardcodes a
  // literal ALLOWED_HEX allowlist mirroring LOCKFILE.md's token table. Twice now (2026-07-18,
  // then again 2026-07-25) a human audit re-derived that mapping by hand and got a different
  // wrong answer the first time (a naive grep counted commented-out/prose hexes as live). This
  // runs on every push instead of waiting for the next manual pass.
  //
  // Scope, deliberately conservative: only flags a NAME-MATCHED mismatch (an ALLOWED_HEX entry
  // whose inline comment names a specific LOCKFILE token, where that token's LOCKFILE hex
  // differs from the ALLOWED_HEX literal). It does NOT fail on "hex present in one file but not
  // matched by name in the other": LOCKFILE documents many token hexes that legitimately never
  // need an inline-allowlist entry (most code reaches them via a Tailwind class, not raw hex),
  // so a blind full-set diff reproduces exactly the false-positive flood the 2026-07-18 audit
  // already hit. A high-confidence named mismatch is a real, actionable finding either way.
  const lockfilePath = join(PROJECT_ROOT, "_design-system", "LOCKFILE.md");
  const checkPyPath = join(PROJECT_ROOT, ".claude", "skills", "solen-drift-check", "scripts", "check.py");

  if (!existsSync(lockfilePath) || !existsSync(checkPyPath)) {
    report("F. Color token reconciliation", true, ["SKIP: LOCKFILE.md or check.py not found"]);
    return;
  }

  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. LOCKFILE token -> hex pairs, from markdown table rows only (backtick-wrapped cells).
  const lockfileText = readFileSync(lockfilePath, "utf8");
  const tokenHexPairs = []; // { token, normToken, hex }
  for (const line of lockfileText.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = allMatches(line, /`([^`]+)`/g).map((m) => m[1]);
    let pendingTokens = [];
    for (const cell of cells) {
      if (/^#[0-9A-Fa-f]{3,8}$/.test(cell)) {
        for (const tok of pendingTokens) {
          tokenHexPairs.push({ token: tok, normToken: normalize(tok), hex: cell.toUpperCase() });
        }
        pendingTokens = [];
      } else if (/^[a-zA-Z][\w.-]*$/.test(cell)) {
        pendingTokens.push(cell);
      }
    }
  }

  // 2. check.py ALLOWED_HEX block: hex literal + same-line comment text.
  const checkPyText = readFileSync(checkPyPath, "utf8");
  const allowedHexBlockMatch = checkPyText.match(/ALLOWED_HEX\s*=\s*\{([\s\S]*?)\n\}/);
  const lines = [];
  let pass = true;
  let confirmedMatches = 0;

  if (!allowedHexBlockMatch) {
    lines.push("SKIP: could not locate ALLOWED_HEX = { ... } block in check.py");
  } else {
    const blockText = allowedHexBlockMatch[1];
    for (const rawLine of blockText.split("\n")) {
      // a whole-line python comment (retired/removed entry, e.g. "# "#9A3412" removed...")
      // is not a LIVE ALLOWED_HEX literal, skip it entirely.
      if (rawLine.trim().startsWith("#")) continue;
      const hexMatch = rawLine.match(/"(#[0-9A-Fa-f]{3,8})"/);
      if (!hexMatch) continue;
      const allowedHex = hexMatch[1].toUpperCase();
      // strip quoted hex literals before looking for the python "#" comment marker, so the
      // literal's own leading "#" is never mistaken for the comment delimiter.
      const withoutStrings = rawLine.replace(/"#[0-9A-Fa-f]{3,8}"/g, '""');
      const commentIdx = withoutStrings.indexOf("#");
      const comment = commentIdx === -1 ? "" : withoutStrings.slice(commentIdx + 1);
      const candidateTokens = allMatches(comment, /s-[a-zA-Z0-9][\w.-]*/g);
      for (const m of candidateTokens) {
        const cand = m[0];
        // a "NOT the X token" disclaimer names the token to explicitly rule it out, not to
        // assert it: skip a candidate whose preceding ~20 chars contain a negation.
        const before = comment.slice(Math.max(0, m.index - 40), m.index);
        if (/\bnot\b/i.test(before)) continue;
        const normCand = normalize(cand);
        if (normCand.length < 4) continue;
        for (const pair of tokenHexPairs) {
          // Exact match only (plus the ".DEFAULT" collapse, e.g. comment "s-ink" vs table
          // `s-ink.DEFAULT`). A prefix match (e.g. "s-accent" vs "s-accent-deep") was tried
          // and rejected: two DIFFERENT sibling tokens are not the same token with a stale
          // value, and a prefix match cross-matched them, producing pure false positives.
          const matches = pair.normToken === normCand || pair.normToken === normCand + "default";
          if (!matches) continue;
          if (pair.hex === allowedHex) {
            confirmedMatches++;
          } else {
            pass = false;
            lines.push(
              "FAIL: check.py ALLOWED_HEX has " + allowedHex + " commented '" + cand.trim() +
              "', but LOCKFILE.md's `" + pair.token + "` is " + pair.hex + " (stale hex citation)"
            );
          }
        }
      }
    }
  }

  if (lines.length === 0) {
    lines.push("no name-matched hex mismatch (" + confirmedMatches + " token-hex pairs confirmed in sync)");
  }
  report("F. Color token reconciliation", pass, lines);
}

// ---------------------------------------------------------------------------
if (!REPO_ONLY) {
  checkHooksWiredVsDisk();
  checkMemoryIndex();
}
checkDocPathsAlive();
checkWorkflowsActuallyRun();
checkSalonPhotoIntegrity();
checkColorTokenReconciliation();
checkBuiltAssetsAreRendered();

console.log("");
for (const r of results) {
  console.log((r.pass ? "PASS" : "FAIL") + ": " + r.name);
  for (const line of r.lines) {
    console.log("  " + line);
  }
}
console.log("");

if (anyFail) {
  console.log("check:invariants , FAIL");
  process.exit(1);
} else {
  console.log("check:invariants , PASS");
  process.exit(0);
}
