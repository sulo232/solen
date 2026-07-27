#!/usr/bin/env node
//
// fe-01: the repo-wide lint ratchet in .github/workflows/quality.yml only
// guarantees the TOTAL error count never goes up. It does not guarantee new
// code is clean, because a PR can add 5 new `any`s in file A while an
// unrelated PR removes 5 in file B, and both individually pass -- that
// laundering is exactly why the baseline had not moved in months before this
// script existed.
//
// This runs ESLint ONLY against files changed since the merge-base with the
// base branch (default "main", override with DIFF_BASE env var), and fails
// on ANY occurrence of the three named rules, with NO baseline exception:
//   @typescript-eslint/no-explicit-any
//   @typescript-eslint/no-unused-vars
//   @next/next/no-html-link-for-pages
//
// A file with zero real changed lines (renamed, deleted) is skipped. A base
// ref that does not exist locally (e.g. a shallow CI checkout) falls back to
// diffing against HEAD~1 so the script degrades to "just this commit" rather
// than crashing.
//
//   Run: node scripts/lint-diff-scoped.mjs
//   Machine-readable summary on the last line: RATCHET_DIFF_SCOPED_LINT=<n>

import { execFileSync } from "node:child_process";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const BASE_REF = process.env.DIFF_BASE || "main";
const GATED_RULES = new Set([
  "@typescript-eslint/no-explicit-any",
  "@typescript-eslint/no-unused-vars",
  "@next/next/no-html-link-for-pages",
]);

function git(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function resolveMergeBase() {
  try {
    git(["rev-parse", "--verify", BASE_REF]);
    return git(["merge-base", "HEAD", BASE_REF]);
  } catch {
    // Base ref not reachable locally (shallow checkout, or BASE_REF renamed) --
    // degrade to "just the last commit" instead of crashing the whole check.
    return "HEAD~1";
  }
}

function changedFiles(mergeBase) {
  let out;
  try {
    out = git(["diff", "--name-only", "--diff-filter=ACMR", mergeBase, "--", "*.ts", "*.tsx"]);
  } catch {
    return [];
  }
  if (!out) return [];
  return out
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .filter((f) => !f.includes("node_modules/") && !f.startsWith(".next/"));
}

function main() {
  const mergeBase = resolveMergeBase();
  const files = changedFiles(mergeBase);

  if (files.length === 0) {
    console.log(`No changed .ts/.tsx files against ${mergeBase} (or base unreachable). Nothing to scope-check.`);
    console.log("RATCHET_DIFF_SCOPED_LINT=0");
    return;
  }

  let raw;
  try {
    raw = execFileSync(
      "npx",
      ["eslint", "--format", "json", ...files],
      { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }
    );
  } catch (err) {
    // ESLint exits non-zero when it finds any lint error at all; stdout still
    // carries the JSON report, so read it off the error object.
    raw = err.stdout ? err.stdout.toString() : "[]";
  }

  let results;
  try {
    results = JSON.parse(raw);
  } catch {
    console.error("Could not parse eslint --format json output; failing safe (does not block, prints for investigation).");
    console.log(raw.slice(0, 4000));
    console.log("RATCHET_DIFF_SCOPED_LINT=0");
    return;
  }

  const violations = [];
  for (const fileResult of results) {
    for (const msg of fileResult.messages || []) {
      if (msg.ruleId && GATED_RULES.has(msg.ruleId)) {
        violations.push({ file: fileResult.filePath, line: msg.line, ruleId: msg.ruleId, message: msg.message });
      }
    }
  }

  console.log(`Diff-scoped lint against ${files.length} changed file(s) (base: ${mergeBase}):`);
  for (const v of violations) {
    console.log(`  ${v.file}:${v.line} ${v.ruleId} -- ${v.message}`);
  }
  console.log(`RATCHET_DIFF_SCOPED_LINT=${violations.length}`);

  if (violations.length > 0) {
    console.error(`::error::${violations.length} new-code lint violation(s) in the three zero-tolerance rules (no-explicit-any, no-unused-vars, no-html-link-for-pages). The repo-wide ratchet can't catch this because it only tracks the TOTAL count; these rules have NO baseline exception on changed lines.`);
    process.exitCode = 1;
  }
}

main();
