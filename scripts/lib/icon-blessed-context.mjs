// scripts/lib/icon-blessed-context.mjs
//
// Shared blessed-context classifier for the icon-system consistency work. Owner ruling
// (2026-07-23, _design-system/QUESTIONS.md line 599, "over-consistency" finding #9):
// the 3D-category-icon rule is NOT homepage-only, it is ENUMERATE BLESSED SURFACES. A 3D
// icon is allowed in an enumerated set of contexts and flagged everywhere else. The core
// violation the owner was furious about was never "a 3D icon exists off the home route",
// it was MIXING two icon systems (3D illustration + Lucide line icon) as the icon for the
// SAME kind of list item / picker (the onboarding category-pill grid).
//
// The report-mode detector (scripts/detect-icon-system-mismatch.mjs) imports ONLY this
// module for the blessed/flagged decision.
//
// BLESSED CONTEXTS (owner-enumerated, tunable, extend here if the owner blesses a new one):
//   1. Homepage: app/[locale]/page.tsx + app/[locale]/_components/homepage/**.
//   2. Empty-state trays: the icon is an `iconSrc` prop on (or lexically inside the
//      attribute list of) an <EmptyTray ...> or <EmptyState ...> JSX element. Locked
//      anatomy: CLAUDE.md's "states" row (owner 2026-07-21) - EmptyState focal icon is a
//      3D category icon, never a grey Lucide disc.
//   3. Category-navigation pills: the icon sits inside a category-pill OBJECT LITERAL,
//      i.e. near a `slug:` key alongside a `route:` / `label:` / `href:` key (the shape of
//      CATEGORY_PILLS, HEADER_CATEGORIES, and any array with the same shape).
// Everything else is FLAGGED (dashboard stat cards, decorative spots, etc).

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ---------------------------------------------------------------------------------------
// THE 3D-ICON ASSET SET. Prefix match, deliberately simple (path-substring, not fuzzy):
// the two raster PNG directories (owner spec, definitive) plus the one SVG that inspection
// found to be genuinely 3D-illustration-style (see the detector report's SVG decision
// section for the full reasoning). nails-test.svg is deliberately NOT a prefix here: it
// is a throwaway test asset, excluded per the "when unsure, exclude" rule, and unreferenced
// in any .tsx today.
// ---------------------------------------------------------------------------------------
export const RASTER_3D_DIRS = ["public/icons/categories", "public/illustrations/categories"];
export const INCLUDED_SVG_ASSETS = ["/icons/category/coiffeur.svg"];
export const EXCLUDED_SVG_ASSETS = [
  {
    path: "/icons/category/nails-test.svg",
    reason: "test asset (filename '-test' suffix), unreferenced in any .tsx, excluded per the when-unsure rule",
  },
];

export const ICON_ASSET_PREFIXES = [
  "/icons/categories/",
  "/illustrations/categories/",
  ...INCLUDED_SVG_ASSETS,
];

// ---------------------------------------------------------------------------------------
// Context 1: homepage.
// ---------------------------------------------------------------------------------------
export const ALLOWED_SURFACE_PATTERNS = [
  /^app\/\[locale\]\/page\.tsx$/, // the home route itself
  /^app\/\[locale\]\/_components\/homepage\//, // every homepage section component
];

export function isHomepageFile(relPath) {
  return ALLOWED_SURFACE_PATTERNS.some((re) => re.test(relPath));
}

// ---------------------------------------------------------------------------------------
// Occurrence finding: every literal reference to a 3D-icon asset prefix in `text`,
// full-text (not line-based) so the returned index is a stable absolute offset both
// classification helpers below can use directly.
//
// A match only counts when it sits right after a string-literal quote (", ', `): this is
// what separates an actual CODE reference (`iconSrc="/icons/categories/spa.png"`) from
// prose that merely mentions the directory in a comment (`// icons under
// /public/icons/categories`), which is not a rendered icon reference at all. Skipping this
// check was a real bug caught while retooling: a comment mention has no nearby closing
// quote, so extractAssetPath() ran forward and swallowed unrelated code into the "asset
// path" until it hit some later, unrelated string's quote.
// ---------------------------------------------------------------------------------------
const QUOTE_CHARS = new Set(['"', "'", "`"]);

export function findIconAssetRefs(text) {
  const out = [];
  for (const prefix of ICON_ASSET_PREFIXES) {
    let searchFrom = 0;
    let idx;
    while ((idx = text.indexOf(prefix, searchFrom)) !== -1) {
      searchFrom = idx + prefix.length;
      if (idx === 0 || !QUOTE_CHARS.has(text[idx - 1])) continue; // prose/comment mention, not a code reference
      out.push({ index: idx, assetPrefix: prefix });
    }
  }
  out.sort((a, b) => a.index - b.index);
  return out;
}

/** The occurrence always sits right after the opening quote of a string literal; extract
 *  up to the next quote/backtick so the report can show the exact filename referenced. */
export function extractAssetPath(text, idx) {
  let end = idx;
  while (end < text.length && !/["'`]/.test(text[end])) end++;
  return text.slice(idx, end);
}

export function lineOf(text, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

// ---------------------------------------------------------------------------------------
// Context 2: empty-state trays. Find the nearest JSX opening tag enclosing `idx` (quote-
// and brace-aware forward scan from the closest preceding "<Identifier", so a multi-line
// prop list like ProfileTabs.tsx's `<EmptyTray\n  iconSrc="..."\n  ...\n/>` is still
// recognised), then check the tag name and that `idx` actually falls inside that tag's own
// attribute region (before its closing `>` / `/>`), not past it.
// ---------------------------------------------------------------------------------------
export function findEnclosingOpeningTag(text, idx) {
  const tagStartRe = /<([A-Za-z][A-Za-z0-9_.]*)/g;
  let best = null;
  let m;
  while ((m = tagStartRe.exec(text))) {
    if (m.index >= idx) break;
    best = { name: m[1], start: m.index };
  }
  if (!best) return null;

  let i = best.start;
  let inQuote = null; // one of ' " `
  let braceDepth = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuote) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === inQuote) inQuote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inQuote = c;
      i++;
      continue;
    }
    if (c === "{") {
      braceDepth++;
      i++;
      continue;
    }
    if (c === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      i++;
      continue;
    }
    // A closing tag "</" met before this opening tag ever closes means `best` was not
    // actually an unclosed opening tag reaching this far (malformed input, or `idx` is
    // past it and outside any attribute list) - bail out rather than mis-attribute.
    if (c === "<" && text[i + 1] === "/" && braceDepth === 0) return null;
    if (c === ">" && braceDepth === 0) {
      return { name: best.name, start: best.start, end: i };
    }
    i++;
  }
  return { name: best.name, start: best.start, end: text.length };
}

const EMPTY_STATE_TAG_NAMES = new Set(["EmptyTray", "EmptyState"]);

export function isInsideEmptyStateTag(text, idx) {
  const tag = findEnclosingOpeningTag(text, idx);
  return !!tag && idx > tag.start && idx < tag.end && EMPTY_STATE_TAG_NAMES.has(tag.name);
}

// ---------------------------------------------------------------------------------------
// Context 3: category-navigation pill object literals. Window-based shape check
// (deliberately NOT brace-matched: every known instance - CATEGORY_PILLS, HEADER_CATEGORIES,
// the dev-sandbox copy - is a short, single-object-per-line literal, and staying window-
// based means this can never get stuck walking an unbounded/malformed brace structure in an
// unrelated file shape). A `slug:` key alongside a `route:` / `label:` / `href:` key within
// the window is the shape signature shared by every known category-pill array; matching on
// shape (not a hardcoded array NAME) is deliberate so a differently-named array with the
// same shape is still recognised, per the owner's "or the same shape" phrasing.
// ---------------------------------------------------------------------------------------
const PILL_WINDOW_BEFORE = 500;
const PILL_WINDOW_AFTER = 150;

export function isInsideCategoryPillLiteral(text, idx) {
  const start = Math.max(0, idx - PILL_WINDOW_BEFORE);
  const end = Math.min(text.length, idx + PILL_WINDOW_AFTER);
  const window = text.slice(start, end);
  const hasSlug = /\bslug\s*:/i.test(window);
  const hasRouteOrLabel = /\broute\s*:/i.test(window) || /\blabel\s*:/i.test(window) || /\bhref\s*:/i.test(window);
  return hasSlug && hasRouteOrLabel;
}

// ---------------------------------------------------------------------------------------
// Single classification entry point. `relPath` = repo-relative path (POSIX separators);
// `text` = the FULL file text (not a diff snippet - context 2/3 need surrounding code);
// `idx` = absolute char offset of the icon-asset reference inside `text`.
// ---------------------------------------------------------------------------------------
export function classifyIconReference(relPath, text, idx) {
  if (isHomepageFile(relPath)) return { blessed: true, reason: "homepage" };
  if (isInsideEmptyStateTag(text, idx)) return { blessed: true, reason: "empty-state" };
  if (isInsideCategoryPillLiteral(text, idx)) return { blessed: true, reason: "category-pill" };
  return { blessed: false, reason: null };
}

/** Every occurrence in `text` classified, split into blessed / flagged. */
export function classifyAllReferences(relPath, text) {
  const refs = findIconAssetRefs(text);
  const blessed = [];
  const flagged = [];
  for (const ref of refs) {
    const cls = classifyIconReference(relPath, text, ref.index);
    const entry = { ...ref, assetPath: extractAssetPath(text, ref.index), line: lineOf(text, ref.index), reason: cls.reason };
    if (cls.blessed) blessed.push(entry);
    else flagged.push(entry);
  }
  return { blessed, flagged };
}

/** Count of FLAGGED (non-blessed) references only, the net-new signal the gate compares
 *  old-file-text against new-file-text with. */
export function countFlagged(relPath, text) {
  return classifyAllReferences(relPath, text).flagged.length;
}
