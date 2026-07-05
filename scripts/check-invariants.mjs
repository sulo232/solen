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
//
// Exits 1 if any invariant FAILs, 0 otherwise. Prints PASS/FAIL per invariant.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import os from "node:os";

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
if (!REPO_ONLY) {
  checkHooksWiredVsDisk();
  checkMemoryIndex();
}
checkDocPathsAlive();

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
