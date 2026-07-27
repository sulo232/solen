#!/usr/bin/env node
// scripts/check-contrast.mjs
//
// color-tokens-05: a computed, re-runnable WCAG contrast check. Until this file
// existed, every contrast ratio in _design-system/RATIONALE.md section 4 and
// SOURCE.md's s-accent-on-white paragraph was a one-time hand calculation
// frozen in prose -- true the day someone did the math, silently stale the
// moment a NEW component pairs an existing token against a background or at
// a font-size the original calculation never covered.
//
// Two things live here:
//   1. contrastRatio(hexA, hexB) -- the actual WCAG 2.x formula (T1 normative
//      standard, RATIONALE.md §4), usable as a library import.
//   2. A CLI scanner that greps `text-s-*` + `bg-s-*`/`bg-white` token pairs
//      out of className strings across the given files/globs and flags any
//      pairing under the applicable floor (4.5:1 normal text, 3:1 for a
//      large-text signal in the same className).
//
// Usage:
//   node scripts/check-contrast.mjs --self-test        # verify the formula
//   node scripts/check-contrast.mjs <file-or-glob...>  # scan real files
//
// This is NOT yet wired as a blocking gate (see the finding's `enforcement`
// note) -- run it manually or from a future pre-commit hook once it has been
// exercised against the full app/ tree by a human reviewer.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// 1. The WCAG 2.x contrast formula (RATIONALE.md §4: normative T1 standard).
// ---------------------------------------------------------------------------

/** @param {string} hex e.g. "#0A0A0A" or "0A0A0A" */
export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function channelToLinear(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance: 0.2126 R + 0.7152 G + 0.0722 B on linearized sRGB. */
export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/** WCAG 2.x contrast ratio: (L1 + 0.05) / (L2 + 0.05), lighter over darker. */
export function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_FLOOR_NORMAL = 4.5; // < 24px, or < 19px bold
export const WCAG_FLOOR_LARGE = 3.0;  // >= 24px, or >= 19px bold; also non-text UI (1.4.11)

// ---------------------------------------------------------------------------
// 2. Token registry -- mirrors LOCKFILE.md §1 / tailwind.config.js. Extend as
//    new text/bg token pairs enter regular use; this is deliberately a small,
//    literal, hand-maintained map (same pattern as lib/email-colors.ts and
//    lib/brand-html-constants.ts) rather than a tailwind.config.js parser.
// ---------------------------------------------------------------------------

export const TOKEN_HEX = {
  "s-ink": "#0A0A0A",
  "s-ink-2": "#6B6B6B",
  "s-ink-disabled": "#C5C8C4",
  "s-border": "#E4E4E7",
  "s-accent": "#276EF1",
  "s-accent-deep": "#1E54B7",
  "s-accent-pale": "#EAEFFE",
  "s-brand": "#16A34A",
  "s-warning": "#F1AE27",
  "s-warning-bg": "#FDF6E7",
  "s-warning-text": "#B45309",
  "s-error": "#DC2626",
  "s-error-bg": "#FEE2E2",
  "s-star": "#FFC32B",
  "white": "#FFFFFF",
  "s-bg-sunken": "#F4F4F5",
  // accessibility-05 (2026-07-27): s-chart-2/3 are chart-only tokens (LOCKFILE §1) that fail
  // WCAG contrast for TEXT at any size (2.54:1 / 2.31:1 for chart-2, both under even the 3:1
  // large-text floor). Registered here so the scanner catches a future text-s-chart-2 usage
  // instead of silently skipping an unknown token (the exact gap this finding closed: the
  // token that most needed catching was the one missing from this map).
  "s-chart-2": "#9CA3AF",
  "s-chart-3": "#D1D5DB",
};

// ---------------------------------------------------------------------------
// 3. Self-test -- reproduces the hand-computed pairs already published in
//    _design-system/RATIONALE.md §4 (measured 2026-07-15) to prove the
//    formula above is correct, not just present.
// ---------------------------------------------------------------------------

const KNOWN_PAIRS = [
  // [fg, bg, expectedRatio, tolerance]
  ["s-ink", "white", 19.80, 0.1],
  ["s-ink-2", "white", 5.33, 0.05],
  ["s-ink-2", "s-bg-sunken", 4.85, 0.05],
  ["s-accent", "white", 4.58, 0.05],
  ["s-brand", "white", 3.30, 0.05],
  ["s-ink-disabled", "white", 1.69, 0.05],
  ["s-star", "white", 1.60, 0.05],
  // accessibility-05: s-chart-2 fails text contrast at ANY size (under the 3:1 large-text
  // floor, not just the 4.5:1 normal floor) -- proves the CLAUDE.md/LOCKFILE "reinstated for
  // non-load-bearing text" authorization was never legal, not just borderline.
  ["s-chart-2", "white", 2.54, 0.05],
  ["s-chart-2", "s-bg-sunken", 2.31, 0.05],
];

function selfTest() {
  let pass = 0;
  let fail = 0;
  for (const [fg, bg, expected, tol] of KNOWN_PAIRS) {
    const ratio = contrastRatio(TOKEN_HEX[fg], TOKEN_HEX[bg]);
    const ok = Math.abs(ratio - expected) <= tol;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${fg} on ${bg}: computed ${ratio.toFixed(2)}:1, RATIONALE.md says ${expected}:1`
    );
    ok ? pass++ : fail++;
  }
  console.log(`\n${pass}/${pass + fail} known pairs matched the RATIONALE.md table.`);
  if (fail > 0) process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// 4. Scanner -- extracts text-s-*/bg-s-*(/bg-white) token co-occurrences per
//    className string and flags any pairing under the applicable floor.
// ---------------------------------------------------------------------------

const TEXT_TOKEN_RE = /\btext-(s-[a-zA-Z0-9-]+)\b/g;
const BG_TOKEN_RE = /\bbg-(s-[a-zA-Z0-9-]+|white)\b/g;
const CLASSNAME_RE = /className\s*=\s*(?:\{?\s*[`"'])([^`"']*)/g;
const LARGE_TEXT_RE = /\btext-(lg|xl|2xl|3xl|4xl|5xl)\b/;
const BOLD_RE = /\bfont-(bold|semibold|extrabold|black)\b/;

function resolveToken(name) {
  // "text-s-ink" -> "s-ink"; normalize a few common sub-key spellings.
  if (name in TOKEN_HEX) return TOKEN_HEX[name];
  return undefined;
}

function scanFile(path) {
  const src = readFileSync(path, "utf-8");
  const findings = [];
  const lines = src.split("\n");

  lines.forEach((line, idx) => {
    let m;
    CLASSNAME_RE.lastIndex = 0;
    while ((m = CLASSNAME_RE.exec(line))) {
      const cls = m[1];
      const textTokens = [...cls.matchAll(TEXT_TOKEN_RE)].map((x) => x[1]);
      const bgTokens = [...cls.matchAll(BG_TOKEN_RE)].map((x) => x[1]);
      if (textTokens.length === 0 || bgTokens.length === 0) continue;

      const isLarge = LARGE_TEXT_RE.test(cls) || (BOLD_RE.test(cls) && /\btext-(base|md)\b/.test(cls));
      const floor = isLarge ? WCAG_FLOOR_LARGE : WCAG_FLOOR_NORMAL;

      for (const t of textTokens) {
        for (const b of bgTokens) {
          const fgHex = resolveToken(t);
          const bgHex = resolveToken(b);
          if (!fgHex || !bgHex) continue; // unknown token, skip rather than guess
          const ratio = contrastRatio(fgHex, bgHex);
          if (ratio < floor) {
            findings.push({
              file: path,
              line: idx + 1,
              fg: t,
              bg: b,
              ratio: ratio.toFixed(2),
              floor,
            });
          }
        }
      }
    }
  });
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    selfTest();
    return;
  }
  if (args.length === 0) {
    console.error("Usage: node scripts/check-contrast.mjs --self-test | <file...>");
    process.exit(1);
  }
  let allFindings = [];
  for (const path of args) {
    try {
      allFindings = allFindings.concat(scanFile(path));
    } catch (e) {
      console.error(`skip ${path}: ${e.message}`);
    }
  }
  if (allFindings.length === 0) {
    console.log("No sub-floor text/background pairings found in the scanned files.");
    return;
  }
  for (const f of allFindings) {
    console.log(
      `${f.file}:${f.line}  text-${f.fg} on bg-${f.bg} = ${f.ratio}:1 (floor ${f.floor}:1)`
    );
  }
  process.exitCode = 1;
}

main();
