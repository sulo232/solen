#!/usr/bin/env node
//
// Near-duplicate component detector. Sibling to exists.mjs / drift-check: report-mode ONLY,
// never a gate. Answers the cross-surface mismatch class the per-file drift gate cannot see
// (doctrine: _design-system/research/CONSISTENCY_MISMATCH_R1.md section 3.6, "component
// re-implementation"): a UI element sharing a ROLE with a locked registry primitive (the
// modal, the from-price line, the avatar) hand-authored as a second JSX tree instead of
// importing the primitive.
//
//   Run:  npm run dupe-check
//   Out:  _design-system/_dupe-report.md  +  a stdout summary
//
// THREE SIGNALS on the TS AST already in the repo (typescript + @typescript-eslint/parser
// are existing devDependencies; this file uses the TypeScript compiler API directly, zero
// new dependencies):
//   Signal A: className token-set Jaccard similarity between JSX-returning components.
//   Signal B: tag+prop-NAME sequence (text + prop VALUES stripped) similarity, catches a
//             same-shape/different-legal-token reimplementation Signal A alone would miss.
//   Signal C: fingerprint each LOCKED registry primitive once (parsed from
//             COMPONENT_REGISTRY.md's File column), compare every OTHER component against
//             that fixed corpus only (O(n), not O(n^2) pairwise).
//
// Both A and B are computed at TWO granularities per JSX node, because a real reimplementation
// can either (a) be a small, mostly self-contained shape (Avatar/PriceFrom: candidate and
// primitive are both a handful of elements, compare the WHOLE accumulated subtree) or
// (b) be a small structural fragment buried inside a much larger enclosing component (the
// dashboard Modal fork: the backdrop div is one element deep inside a 14-element function,
// the primitive's own backdrop node is one element deep inside its own small function).
// "own" = a node's OWN className/tag/props only (no descendants merged in). "full" = a
// node's OWN plus every descendant merged in (the whole accumulated subtree beneath it).
//
// Class-token and tag+prop-token similarity is IDF-weighted (classic IR technique, not
// invented for this file): a token's weight is inverse to how many JSX elements repo-wide
// carry it, so "flex items-center gap-2" (used on thousands of elements) contributes almost
// nothing to a match while "fixed inset-0" or "tabular-nums" (rare, used on a handful of
// elements) contributes heavily. This is the false-positive control #4 (boilerplate
// stoplist) implemented as a measured repo statistic instead of a hand-typed list, per the
// doctrine's own instruction to calibrate against this repo, not hardcode blindly.
//
// A fourth micro-signal (text markers) is layered onto Signal C's fingerprint, disclosed
// here rather than silently added: some primitives (PriceFrom's "CHF", a format-string
// primitive) carry almost their entire identity in a literal static text fragment, not in
// Tailwind classes or JSX shape. Signal A/B genuinely cannot separate a reimplemented
// "ab CHF {x}" span from any other lone <span className="...">{...}</span> in the repo
// (verified by hand before writing this: zero className overlap, and the tag+prop shape
// alone is the single most common shape in the whole codebase). Signal C's own definition
// ("fingerprint each primitive") is read here to include the primitive's own literal
// rendered text, not only its classes and shape. This was checked against the mandated
// self-test before shipping (rule 12.5): omitting it silently failed one of three required
// true positives.
//
// FALSE-POSITIVE CONTROLS (mandatory, all implemented):
//  1. Composition-exclusion: if a candidate imports and renders the primitive itself, that
//     subtree is reuse, not a duplicate. Excluded before scoring.
//  2. Minimum JSX-size floor + a size window relative to the primitive being compared
//     against (calibrated against this repo's own true positives, see CALIBRATION below).
//  3. Occurrence gating: 1 matching file = low, 2 = medium ("review"), 3+ = high (mirrors
//     Rule of Three, matches the known 8-way dashboard Modal fork).
//  4. Boilerplate is downweighted via measured IDF, not a fixed stoplist (see above).
//  5. A matching name root (both components named *Modal) is never checked as a gate; only
//     shape/class/text evidence gates a finding.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative, sep, extname } from "node:path";
import ts from "typescript";
import { REPO_ROOT } from "./lib/scan-surface.mjs";

const REGISTRY_PATH = join(REPO_ROOT, "_design-system/COMPONENT_REGISTRY.md");
const REPORT_PATH = join(REPO_ROOT, "_design-system/_dupe-report.md");

// ---------------------------------------------------------------------------------------
// CALIBRATION (tuned against this repo's own known true positives, not asserted blindly):
//   Avatar     -> app/[locale]/profile/settings/page.tsx (IdentityBlock, ~line 174)
//   PriceFrom  -> components-legacy/discovery/DetailPage.tsx (~line 409) +
//                 app/[locale]/_components/search/CategoryHeroCarousel.tsx (~line 162)
//   Modal      -> ~8 dashboard pages (ConfirmModal / StaffModal / ServiceModal / ...)
// Values below are the result of running this detector against those three cases and the
// rest of the repo, then picking the lowest threshold that still separates the known hits
// from the general noise floor. See the report footer for the actual score distribution.
// ---------------------------------------------------------------------------------------
const SIZE_WINDOW_MIN = 0.3; // candidate "full" subtree must be >= primitive.elementCount * this
const SIZE_WINDOW_MAX = 3.5; // and <= primitive.elementCount * this
const SCORE_THRESHOLD = 0.16; // weighted-Jaccard / anchor-coverage / shape-anchor floor to report
const ANCHOR_K = 6; // top-K rarest primitive class tokens used for anchor-coverage
const MARKER_SCORE = 0.5; // confidence assigned to an exact distinctive-text-marker hit
// Require >= OWN_MIN_TOKENS non-zero-weight tokens on both sides so only a genuinely
// distinctive combo (not "tabular-nums" alone, not "flex gap-2") can anchor a match.
const OWN_MIN_TOKENS = 4;
// A minimum ABSOLUTE weighted overlap, not just a ratio: a 2-token identical set (e.g. both
// "absolute inset-0") scores a spurious raw Jaccard of 1.0 regardless of IDF weighting
// (identical sets always divide to 1). The modal backdrop true positive's genuine overlap
// ("fixed" + "inset-0") sums to ~9.5 in this repo; generic 1-2 token coincidences sum far
// lower. Calibrated between the two (see CALIBRATION); also used as the floor for the
// FULL-level className comparison, same rationale, same scale.
const MIN_OWN_ABS_WEIGHT = 8;
const BOILERPLATE_COMBO_CAP = 20; // an exact className SET appearing on >= this many distinct
// elements repo-wide (e.g. "h-full w-full object-cover", the stock image-fill idiom) is
// layout noise, not a role signature; per-token IDF cannot see this (each token alone can be
// individually rare while the exact co-occurring combo is common), so this is a second,
// combo-level frequency check, measured from the repo rather than a hand-typed stoplist.
const MIN_PRIMITIVE_DISTINCTIVENESS = 30; // sum of IDF over a primitive's own class tokens.
// A tiny wrapper primitive (CardName: `font-body text-s-ink font-medium`, three individually
// common tokens, sum ~8) is a coincidence magnet: that exact 3-class recipe is simply how
// "semibold ink text" is written throughout the app for many unrelated purposes, not a
// distinctive fingerprint. Requiring the primitive's OWN vocabulary to carry a minimum amount
// of measured rarity before it anchors a comparison is the same IDF principle applied to the
// primitive side instead of the match side. Modal/Avatar/PriceFrom (the known true positives)
// clear this by a wide margin (~20-40); CardName/CardMeta/MetaDot do not, and are reported
// separately as excluded rather than silently dropped.
const OWN_NODES_CAP = 8; // the "own" (single-element) comparison is only trustworthy for a
// THIN architectural primitive (Modal=3 own-nodes, Avatar=5, PriceFrom=3, SeeAllButton=4): a
// primitive with more own-nodes than this is a composite, multi-purpose section (SalonServices
// at 18, ProfileTabs at 46), and comparing ANY one of its many internal elements against ANY
// one candidate element floods the report (measured during calibration: without this cap,
// generic-but-individually-not-ultra-common combos like "flex items-baseline gap-2" or a
// standard "truncated meta text" recipe coincidentally matched a composite primitive's
// internal styling on hundreds of unrelated files). Composite primitives still participate
// fully in the "full" (whole accumulated subtree) and text-marker comparisons.
const CORPUS_MAX_ELEMENTS = 20; // registry rows above this element count are page-level
// orchestrators (SearchTemplate=83, ProfileTabs=46, SearchOverlay=109, SalonDetailV3=34, ...),
// not a coherent small "shape" a stray unrelated element could plausibly reimplement by
// coincidence. Measured from this repo's own registry: every known true-positive primitive
// (Modal=3, Avatar=5, PriceFrom=3, CategoryHeroCarousel=17) sits well under this; every
// excluded row is a composite section-orchestrator (confirmed by hand during calibration,
// see CALIBRATION). Signal C is defined against "a locked registry primitive" (a shape),
// not a page section, so this is a scope correction, not a weakened threshold.
const MARKER_STOPWORDS = new Set([
  "ab", "von", "bis", "und", "der", "die", "das", "ein", "eine", "zur", "zum", "auf", "für",
  "mit", "the", "and", "for", "with", "you", "your", "from", "not", "are", "was", "were",
]);

// ---------------------------------------------------------------------------------------
// PRECISION REDESIGN (round 2, owner-directed 2026-07-23): the round-1 scoring above ranks
// candidates well but its REPORTING gate (SCORE_THRESHOLD alone) does not separate a true
// positive from repo-wide noise, because both land in the same 0.16-0.5 score band (measured:
// Avatar's own true positive scored 0.17, INSIDE the noise floor of "SalonAppCta" and
// similar generic-idiom primitives that also score 0.16-0.3 against dozens of unrelated
// files). Threshold tuning cannot fix this: the signal and the noise overlap. What separates
// them instead is WHICH KIND of evidence fired, not how big the number is. A finding is only
// reported as high-confidence when it clears ONE of three qualitatively different bars:
//   1. TEXT-MARKER: an exact distinctive literal/code shared with the primitive (already the
//      highest-precision signal in round 1, unchanged, MARKER_SCORE above).
//   2. STRUCTURAL_CLONE_MIN: the shape signal (tag+prop Jaccard OR own-element precision,
//      whichever is higher, RAW not discounted) is high enough to mean genuine copy-paste,
//      regardless of how common the primitive's role is elsewhere.
//   3. NAME_ROOT_SHAPE_MIN: the candidate's own enclosing function/component name shares a
//      root with the primitive's name (ConfirmModal/StaffModal/... all contain "Modal") AND
//      the shape signal clears a lower, moderate bar. Name-root alone is never a gate on its
//      own (per the false-positive control in the doctrine); it only lowers the shape bar
//      required, it never substitutes for having no shape evidence at all.
// A primitive that racks up many broad (SCORE_THRESHOLD-level) matches but NONE of these
// three, is a generic design idiom (a pill, a bordered card), not a reuse-miss, and gets
// excluded from high-confidence reporting entirely (PREVALENCE_GUARD_MAX_FILES below).
// ---------------------------------------------------------------------------------------
const STRUCTURAL_CLONE_MIN = 0.6; // raw shape signal for a "this is basically copy-paste" claim
const NAME_ROOT_SHAPE_MIN = 0.3; // lower shape bar, but ONLY when name-root corroborates
const PREVALENCE_GUARD_MAX_FILES = 25; // broad matches above this, with zero high-confidence
// hits among them, means the primitive's own recipe is too generic to be a role signature at
// all (measured: SalonAppCta/DashQuickAction/ErrorState/BentoCard/BackButton/PillToggle all
// matched 40-189 files at noise-floor scores with no marker, no >=0.6 shape clone, and no
// name-root corroboration anywhere in that set).
// Avatar's SIZE is rendered via an inline `style={{width,height}}`, not a Tailwind class (see
// Avatar.tsx), so the standard className-overlap signals structurally cannot see it: Avatar's
// own classSet has no h-N/w-N token to share with a candidate at all. This is a disclosed,
// narrow, primitive-specific extension (not a general mechanism) for exactly that gap: a
// circular photo-or-initials shape is fixed rounded-full + an explicit pixel size class + an
// <img> tag, the same combination a human reviewer would look for by eye.
const AVATAR_FIXED_SIZE_RE = /^(h|w)-\d+$/;
const AVATAR_FIXED_SIZE_BRACKET_RE = /^(h|w)-\[\d+px\]$/;
function looksLikeAvatarShape(full) {
  const hasRoundedFull = full.classSet.has("rounded-full");
  const hasFixedSize = [...full.classSet].some(
    (t) => AVATAR_FIXED_SIZE_RE.test(t) || AVATAR_FIXED_SIZE_BRACKET_RE.test(t),
  );
  const hasImgTag = full.tagNames.has("img") || full.tagNames.has("Image");
  return hasRoundedFull && hasFixedSize && hasImgTag;
}

function normalizeName(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function nameRootMatches(enclosingName, primitiveName) {
  const a = normalizeName(enclosingName);
  const b = normalizeName(primitiveName);
  if (a.length < 3 || b.length < 3) return false;
  return a.includes(b) || b.includes(a);
}

const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", ".turbo", "dist", "build", "coverage", ".vercel", ".claude",
]);

// ---------------------------------------------------------------------------------------
// File walk (deliberately NOT scan-surface.mjs's scanComponents(): that helper excludes
// Next-reserved filenames like page.tsx/layout.tsx because they aren't reusable components
// at the FILE level. Two of the three known self-test cases (IdentityBlock, the dashboard
// modals) are locally-defined FUNCTIONS inside page.tsx files, so this detector's unit of
// analysis is the function/JSX-subtree, not the file, and it must walk page.tsx too.)
// ---------------------------------------------------------------------------------------
function walkTsx(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || e.name.startsWith(".")) continue;
    if (/ \d+(\.[\w.]+)?$/.test(e.name)) continue; // Finder/iCloud copy artifacts
    const full = join(dir, e.name);
    if (e.isDirectory()) walkTsx(full, out);
    else if (e.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function relRoot(absPath) {
  return relative(REPO_ROOT, absPath).split(sep).join("/");
}

// ---------------------------------------------------------------------------------------
// COMPONENT_REGISTRY.md -> primitive corpus (file, componentName) pairs.
// Reuses the registry as data instead of re-declaring a component list.
// ---------------------------------------------------------------------------------------
function resolveRegistryPath(raw) {
  raw = raw.trim();
  if (
    raw.startsWith("components-legacy/") ||
    raw.startsWith("lib/") ||
    raw.startsWith("_design-system/") ||
    raw.startsWith("app/")
  ) {
    return join(REPO_ROOT, raw);
  }
  if (raw.startsWith("_components/")) {
    return join(REPO_ROOT, "app/[locale]", raw);
  }
  return join(REPO_ROOT, "app/[locale]/_components", raw);
}

function parseRegistryRows() {
  const text = readFileSync(REGISTRY_PATH, "utf8");
  const rows = [];
  const rowRe = /^\|\s*(~~)?\*\*([^*~]+)\*\*(~~)?\s*\|\s*([^|]*)\|/;
  for (const line of text.split("\n")) {
    const m = rowRe.exec(line);
    if (!m) continue;
    if (m[1] || m[3]) continue; // ~~strikethrough~~ = removed component, skip
    const name = m[2].trim();
    const fileCell = m[4];
    const pathMatch = /`([^`]+)`/.exec(fileCell);
    if (!pathMatch) continue;
    const rawPath = pathMatch[1];
    if (!rawPath.endsWith(".tsx")) continue; // .ts utils / .md docs are not JSX components
    const abs = resolveRegistryPath(rawPath);
    if (!existsSync(abs)) continue;
    rows.push({ name, rawPath, absPath: abs });
  }
  return rows;
}

// ---------------------------------------------------------------------------------------
// AST helpers
// ---------------------------------------------------------------------------------------
function parseSourceFile(absPath) {
  let src;
  try {
    src = readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
  const kind = absPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(absPath, src, ts.ScriptTarget.Latest, true, kind);
}

function resolveModuleFile(fromAbsFile, spec) {
  let base;
  if (spec.startsWith("@/")) {
    base = join(REPO_ROOT, spec.slice(2));
  } else if (spec.startsWith(".")) {
    base = join(dirname(fromAbsFile), spec);
  } else {
    return null; // external package (react, lucide-react, next/link, ...)
  }
  const candidates = [base, `${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

/** localName -> { file: repo-relative path or null, imported: exported name or "default"/"*" } */
function collectImports(sourceFile, absPath) {
  const map = new Map();
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    const resolved = resolveModuleFile(absPath, spec);
    const relResolved = resolved ? relRoot(resolved) : null;
    const clause = stmt.importClause;
    if (clause.name) map.set(clause.name.text, { file: relResolved, imported: "default" });
    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) {
        map.set(clause.namedBindings.name.text, { file: relResolved, imported: "*" });
      } else if (ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) {
          const localName = el.name.text;
          const importedName = el.propertyName ? el.propertyName.text : el.name.text;
          map.set(localName, { file: relResolved, imported: importedName });
        }
      }
    }
  }
  return map;
}

/** Recursively collect every static string/template-literal fragment inside a node, split into words. */
function collectLiteralTextTokens(node, out) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    for (const t of node.text.split(/\s+/)) if (t) out.push(t);
    return;
  }
  if (ts.isTemplateExpression(node)) {
    for (const t of node.head.text.split(/\s+/)) if (t) out.push(t);
    for (const span of node.templateSpans) {
      for (const t of span.literal.text.split(/\s+/)) if (t) out.push(t);
    }
    return;
  }
  ts.forEachChild(node, (child) => collectLiteralTextTokens(child, out));
}

/** Same as collectLiteralTextTokens, but STOPS at a nested JSX element instead of recursing
 *  into it: without this, a conditional child like `{show && <div className="flex gap-2">}`
 *  would leak "flex"/"gap-2" from the NESTED element's className attribute into the OUTER
 *  element's text markers (the nested element's own text is separately captured when the
 *  main walk reaches it directly). Caught during the required self-test run. */
function collectMarkerLiteralTokens(node, out) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    for (const t of node.text.split(/\s+/)) if (t) out.push(t);
    return;
  }
  if (ts.isTemplateExpression(node)) {
    for (const t of node.head.text.split(/\s+/)) if (t) out.push(t);
    for (const span of node.templateSpans) {
      for (const t of span.literal.text.split(/\s+/)) if (t) out.push(t);
    }
    return;
  }
  ts.forEachChild(node, (child) => collectMarkerLiteralTokens(child, out));
}

/** Module-scope `const X = cva(...)` / `cn(...)` / `clsx(...)` bindings, resolved once per file
 *  so a JSX className like `modalSurfaceVariants({size})` still contributes its base tokens. */
function collectModuleClassTokens(sourceFile) {
  const map = new Map();
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!decl.initializer || !ts.isIdentifier(decl.name)) continue;
      if (!ts.isCallExpression(decl.initializer)) continue;
      const calleeName = decl.initializer.expression.getText(sourceFile).split(".").pop();
      if (!/^(cva|cn|clsx|classNames)$/.test(calleeName)) continue;
      const tokens = [];
      collectLiteralTextTokens(decl.initializer, tokens);
      map.set(decl.name.text, tokens);
    }
  }
  return map;
}

/** Add a class token AND, if it carries an arbitrary-value payload, its family form too
 *  (`bg-[rgba(...)]` -> also add `bg-[]`). Adds BOTH rather than replacing: the exact
 *  literal stays a distinct (usually rare, high-weight) token so two components using the
 *  SAME concrete arbitrary value still match strongly on it; the family form is shared by
 *  every different concrete value of that utility, so it is naturally common/low-weight
 *  under IDF and cannot alone manufacture a spurious exact-set match (verified: an earlier
 *  version REPLACED the literal with the family form only, which collapsed `text-[16px]`
 *  and `text-[clamp(16px,1.6vw,18px)]` into one identical token and flooded the report
 *  with every differently-sized heading in the app matching every other; caught and fixed
 *  during the required self-test run, see CALIBRATION). Does NOT attempt full Tailwind
 *  semantic resolution (rounded-2xl vs rounded-[16px]); that is the separate,
 *  not-yet-reconciled type-scale whitelist work.
 */
function addClassToken(out, t) {
  out.add(t);
  if (t.includes("[")) out.add(t.replace(/\[[^\]]*\]/g, "[]"));
}

/** className attribute value -> token set. Handles plain strings, template literals, and
 *  cn()/clsx()/cva()/local-variant-call expressions by walking their whole subtree for
 *  string/template literal fragments (deliberately broad: a className value is almost
 *  never a non-class string, so this stays simple instead of enumerating call shapes). */
function collectClassNameTokens(exprNode, moduleClassTokens, out) {
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      for (const t of node.text.split(/\s+/)) if (t) addClassToken(out, t);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      for (const t of node.head.text.split(/\s+/)) if (t) addClassToken(out, t);
      for (const span of node.templateSpans) {
        for (const t of span.literal.text.split(/\s+/)) if (t) addClassToken(out, t);
      }
      return;
    }
    if (ts.isIdentifier(node) && moduleClassTokens.has(node.text)) {
      for (const t of moduleClassTokens.get(node.text)) addClassToken(out, t);
    }
    if (ts.isCallExpression(node)) {
      const calleeName = node.expression.getText().split(".").pop();
      if (moduleClassTokens.has(calleeName)) {
        for (const t of moduleClassTokens.get(calleeName)) addClassToken(out, t);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(exprNode);
}

// Markers are restricted to ALL-CAPS format/currency codes (CHF, EUR, VAT, IBAN, FAQ),
// not ordinary prose words. An earlier version matched any word >= 3 letters minus a small
// stopword list, which caught the required "CHF" true positive but ALSO caught "buchen"
// ("to book", one of the single most common words in a German booking app) and "dir"/"willst"
// as spurious markers, flooding matches across dozens of unrelated files that merely share a
// common verb. A primitive's genuinely distinctive rendered text (a currency/unit code) is
// reliably ALL-CAPS; ordinary copy is not, so this is a precision fix, not a coverage cut for
// the mandated PriceFrom case (verified during the required self-test).
// MINIMUM 3 chars, not 2: a 2-letter cap sequence catches locale/country codes leaking out of
// unrelated string literals (`toLocaleDateString("de-CH")`, `"en-US"`) as a spurious "CH"/"US"
// marker (caught during the round-2 precision redesign: "CH" alone matched 31 unrelated files
// against both SalonHeader and SalonReviews, neither of which is a currency-format primitive;
// their real content just happens to construct a `de-CH` locale string somewhere).
function collectMarkerWords(text, out) {
  const words = text.match(/[A-ZÀ-Ý]{3,6}/g);
  if (!words) return;
  for (const w of words) {
    if (MARKER_STOPWORDS.has(w.toLowerCase())) continue;
    out.add(w);
  }
}

// ---------------------------------------------------------------------------------------
// JSX subtree fingerprinting. One pass, bottom-up. Every JSX node gets:
//   own  = { classSet, tagPropToken, tagName }              (this node ONLY, no descendants)
//   full = { classSet, tagPropTokens[], tagNames, elementCount, textMarkers }  (whole subtree)
// Every element also tallies into the global docFreq maps (its OWN tokens only, once each),
// which is how the IDF weighting in scoreAll() gets calibrated to this repo's real usage.
// ---------------------------------------------------------------------------------------
function emptyFull() {
  return { classSet: new Set(), tagPropTokens: [], tagNames: new Set(), elementCount: 0, textMarkers: new Set() };
}

function mergeFull(target, source) {
  if (!source) return;
  target.elementCount += source.elementCount;
  for (const c of source.classSet) target.classSet.add(c);
  for (const t of source.tagPropTokens) target.tagPropTokens.push(t);
  for (const t of source.tagNames) target.tagNames.add(t);
  for (const m of source.textMarkers) target.textMarkers.add(m);
}

function collectFingerprints(root, sourceFile, moduleClassTokens, results, docFreq) {
  function visit(node) {
    if (ts.isJsxFragment(node)) {
      const full = emptyFull();
      full.tagPropTokens.push("Fragment()");
      full.elementCount = 0; // a fragment itself is not a styled element
      for (const child of node.children) mergeFull(full, visitChild(child));
      results.push({
        node, line: lineOf(sourceFile, node), enclosing: enclosingName(node),
        own: { classSet: new Set(), tagPropToken: "Fragment()", tagName: "Fragment" }, full,
      });
      return full;
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tagName = opening.tagName.getText(sourceFile);
      const propNames = [];
      const ownClassSet = new Set();
      for (const attr of opening.attributes.properties) {
        if (ts.isJsxAttribute(attr)) {
          const pname = attr.name.getText(sourceFile);
          propNames.push(pname);
          if (pname === "className" && attr.initializer) {
            const expr = ts.isJsxExpression(attr.initializer) ? attr.initializer.expression : attr.initializer;
            if (expr) collectClassNameTokens(expr, moduleClassTokens, ownClassSet);
          }
        } else if (ts.isJsxSpreadAttribute(attr)) {
          propNames.push("...spread");
        }
      }
      propNames.sort();
      const ownTagPropToken = `${tagName}(${propNames.join(",")})`;

      docFreq.totalElements++;
      docFreq.tagTotal.set(ownTagPropToken, (docFreq.tagTotal.get(ownTagPropToken) ?? 0) + 1);
      for (const c of ownClassSet) docFreq.classTotal.set(c, (docFreq.classTotal.get(c) ?? 0) + 1);
      // Combo-level document frequency: per-token IDF cannot see that "h-full w-full
      // object-cover" is a stock image-fill idiom (each token individually is fairly rare,
      // but the exact TRIPLE recurs everywhere an <img> covers its box). Tally the exact
      // className SET (not just individual tokens) so scoring can refuse to trust an
      // own-node match when the whole combo, not any one token in it, is itself boilerplate.
      if (ownClassSet.size >= 3) {
        const comboKey = [...ownClassSet].sort().join(" ");
        docFreq.comboTotal.set(comboKey, (docFreq.comboTotal.get(comboKey) ?? 0) + 1);
      }

      const full = emptyFull();
      full.elementCount = 1;
      full.tagPropTokens.push(ownTagPropToken);
      full.tagNames.add(tagName);
      for (const c of ownClassSet) full.classSet.add(c);

      const ownTextMarkers = new Set();
      const children = ts.isJsxElement(node) ? node.children : [];
      for (const child of children) {
        if (ts.isJsxText(child)) {
          collectMarkerWords(child.text, ownTextMarkers);
          continue;
        }
        if (ts.isJsxExpression(child) && child.expression) {
          const words = [];
          collectMarkerLiteralTokens(child.expression, words);
          collectMarkerWords(words.join(" "), ownTextMarkers);
          mergeFull(full, visitChild(child.expression));
          continue;
        }
        mergeFull(full, visitChild(child));
      }
      for (const m of ownTextMarkers) full.textMarkers.add(m);

      results.push({
        node, line: lineOf(sourceFile, node), enclosing: enclosingName(node),
        own: { classSet: ownClassSet, tagPropToken: ownTagPropToken, tagName },
        full,
      });
      return full;
    }
    return null;
  }

  /** Non-JSX node: recurse, propagating up any JSX fingerprints found nested within
   *  (a .map() render callback, a ternary branch, a && guard). */
  function visitChild(node) {
    const direct = visit(node);
    if (direct) return direct;
    let merged = null;
    ts.forEachChild(node, (child) => {
      const childFull = visitChild(child);
      if (childFull) {
        merged = merged || emptyFull();
        mergeFull(merged, childFull);
      }
    });
    return merged;
  }

  return visitChild(root);
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function enclosingName(node) {
  let cur = node.parent;
  while (cur) {
    if (ts.isFunctionDeclaration(cur) && cur.name) return cur.name.text;
    if (ts.isFunctionExpression(cur) && cur.name) return cur.name.text;
    if (
      (ts.isArrowFunction(cur) || ts.isFunctionExpression(cur)) &&
      cur.parent &&
      ts.isVariableDeclaration(cur.parent) &&
      ts.isIdentifier(cur.parent.name)
    ) {
      return cur.parent.name.text;
    }
    cur = cur.parent;
  }
  return "(module scope)";
}

// ---------------------------------------------------------------------------------------
// Registry primitive: find the exact named function within its file, fingerprint it.
// ---------------------------------------------------------------------------------------
function unwrapComponentInit(node) {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node;
  if (ts.isCallExpression(node)) {
    for (const arg of node.arguments) {
      if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) return arg;
      const nested = unwrapComponentInit(arg);
      if (nested) return nested;
    }
  }
  return null;
}

function findFunctionNode(sourceFile, name) {
  let found = null;
  function check(node) {
    if (found) return;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      found = node;
      return;
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === name && decl.initializer) {
          const unwrapped = unwrapComponentInit(decl.initializer);
          if (unwrapped) {
            found = unwrapped;
            return;
          }
        }
      }
    }
    if (!found) ts.forEachChild(node, check);
  }
  ts.forEachChild(sourceFile, check);
  return found;
}

// ---------------------------------------------------------------------------------------
// PASS 1: build the primitive corpus (Signal C's fixed corpus) + tally global docFreq
// PASS 2: walk every candidate .tsx file (excluding the primitive files themselves) and
//         fingerprint every JSX node, tallying into the SAME docFreq maps.
// ---------------------------------------------------------------------------------------
const docFreq = { totalElements: 0, classTotal: new Map(), tagTotal: new Map(), comboTotal: new Map() };

const registryRows = parseRegistryRows();
const primitiveFileSet = new Set(registryRows.map((r) => relRoot(r.absPath)));

const primitives = [];
const unresolvedRows = [];
for (const row of registryRows) {
  const sourceFile = parseSourceFile(row.absPath);
  if (!sourceFile) {
    unresolvedRows.push(`${row.name} (${row.rawPath}: unreadable)`);
    continue;
  }
  const fnNode = findFunctionNode(sourceFile, row.name);
  if (!fnNode) {
    unresolvedRows.push(`${row.name} (${row.rawPath}: no matching function found)`);
    continue;
  }
  const moduleClassTokens = collectModuleClassTokens(sourceFile);
  const results = [];
  const full = collectFingerprints(fnNode.body ?? fnNode, sourceFile, moduleClassTokens, results, docFreq);
  if (!full || full.elementCount === 0) {
    unresolvedRows.push(`${row.name} (${row.rawPath}: no JSX returned)`);
    continue;
  }
  if (full.elementCount > CORPUS_MAX_ELEMENTS) {
    unresolvedRows.push(`${row.name} (${row.rawPath}: ${full.elementCount} elements, over the CORPUS_MAX_ELEMENTS=${CORPUS_MAX_ELEMENTS} shape scope, a page-section orchestrator not a small role)`);
    continue;
  }
  primitives.push({
    name: row.name,
    file: relRoot(row.absPath),
    full,
    ownNodes: results.map((r) => r.own),
    declStart: fnNode.getStart(sourceFile),
    declEnd: fnNode.getEnd(),
  });
}

if (process.env.DUPE_DEBUG_SIZES) {
  const sorted = [...primitives].sort((a, b) => a.full.elementCount - b.full.elementCount);
  for (const p of sorted) console.error(`  ${p.full.elementCount}\t${p.ownNodes.length}\t${p.name}\t${p.file}`);
}

const candidateFiles = walkTsx(join(REPO_ROOT, "app")).concat(
  walkTsx(join(REPO_ROOT, "components")),
  walkTsx(join(REPO_ROOT, "components-legacy")),
);

// Primitive rows keyed by file, so a file that hosts one registered primitive but ALSO
// contains unrelated reimplementations of a DIFFERENT primitive still gets scanned (a file-
// level skip is too broad: CategoryHeroCarousel.tsx is itself a registered primitive, but a
// separate spot in the SAME file hand-rolls PriceFrom's format, one of the mandated true
// positives; skipping the whole file because it hosts ITS OWN primitive silently dropped it).
const primitivesByFile = new Map();
for (const p of primitives) {
  if (!primitivesByFile.has(p.file)) primitivesByFile.set(p.file, []);
  primitivesByFile.get(p.file).push(p);
}

const perFileResults = new Map(); // relPath -> { sourceFile, importMap, results }
for (const abs of candidateFiles) {
  const rel = relRoot(abs);
  const sourceFile = parseSourceFile(abs);
  if (!sourceFile) continue;
  const moduleClassTokens = collectModuleClassTokens(sourceFile);
  const importMap = collectImports(sourceFile, abs);
  const results = [];
  collectFingerprints(sourceFile, sourceFile, moduleClassTokens, results, docFreq);
  // NOTE: self-comparison exclusion (a node inside primitive X's own declaration should
  // never be scored against X itself) happens PER-PRIMITIVE in the scoring loop below, not
  // by filtering this file's results wholesale. A blanket filter here is wrong whenever a
  // file's own registered primitive ALSO independently reimplements a DIFFERENT primitive
  // inside its own body (the mandated true positive: CategoryHeroCarousel.tsx IS the
  // CategoryHeroCarousel primitive, and separately hand-rolls PriceFrom's format inside that
  // same function; filtering out everything inside CategoryHeroCarousel's own declaration
  // range silently dropped that finding during the required self-test).
  if (results.length) perFileResults.set(rel, { sourceFile, importMap, results });
}

// ---------------------------------------------------------------------------------------
// IDF: rarer tokens (repo-wide) carry more weight. log(N / (1 + freq)), floored at 0 so an
// extremely common token never subtracts from a score.
// ---------------------------------------------------------------------------------------
const N = Math.max(1, docFreq.totalElements);
function idfClassRaw(t) {
  const f = docFreq.classTotal.get(t) ?? 0;
  return Math.max(0, Math.log(N / (1 + f)));
}
function idfTag(t) {
  const f = docFreq.tagTotal.get(t) ?? 0;
  return Math.max(0, Math.log(N / (1 + f)));
}

// Pure spacing/sizing/flex-alignment utilities describe LAYOUT POSITION, not visual/semantic
// ROLE, and this repo already draws exactly this line itself (CardText.tsx's own doc comment:
// "className is for LAYOUT only... write raw font-bold text-s-ink and the drift checker flags
// it"). Measured IDF alone cannot separate "flex items-center gap-2" or "h-full w-full
// object-cover" (a stock image-fill idiom) from a genuinely diagnostic combo like "fixed
// inset-0 z-modal-bg" purely by rarity (both land in a similar frequency range in THIS repo,
// confirmed while calibrating). Layout tokens are zeroed for className scoring; POSITION
// (fixed/absolute/relative/inset/top/left/right/bottom/z-*), color, radius, shadow, backdrop,
// and typography tokens are untouched, since those DO carry role information (an overlay
// backdrop is diagnosed by "fixed" + "inset-0" + a high z-index, not by "flex items-center").
const LAYOUT_NEUTRAL_RE =
  /^(m|mx|my|mt|mb|ml|mr|p|px|py|pt|pb|pl|pr|gap|gap-x|gap-y|space-x|space-y)-|^(w|h|max-w|min-w|max-h|min-h|size)-|^(flex|grid|block|inline|inline-block|inline-flex|hidden|table|contents|flow-root)(-\S+)?$|^(items|justify|self|place|content)-|^overflow(-\S+)?$|^(shrink|grow|basis)(-\S+)?$|^object-(cover|contain|fill|none|scale-down)$/;

function isLayoutNeutral(token) {
  const stripped = token.replace(/^[a-z0-9-]+:/, "");
  return LAYOUT_NEUTRAL_RE.test(stripped);
}

function idfClass(t) {
  return isLayoutNeutral(t) ? 0 : idfClassRaw(t);
}

function isBoilerplateCombo(classSet) {
  if (classSet.size < 3) return false;
  const key = [...classSet].sort().join(" ");
  return (docFreq.comboTotal.get(key) ?? 0) >= BOILERPLATE_COMBO_CAP;
}

/** Count tokens that actually carry weight under weightFn. A minimum-token-count floor
 *  checked against the RAW set size is not a real floor once layout-neutral tokens are
 *  zeroed: a set of 7 tokens where 5 are zero-weight (w-[7px], h-[7px], inline-flex, ...)
 *  still passes a "size >= 4" check, but only 2 tokens actually influence the ratio. Caught
 *  during calibration (DashStatusPill's status-dot span: {relative, inline-flex, w-[7px],
 *  h-[7px], rounded-full}, raw size 5, only "relative" + "rounded-full" non-zero, matched
 *  countless unrelated small circular dots at a raw-size-gated ratio of 1.0). */
function nonZeroCount(classSet, weightFn) {
  let n = 0;
  for (const t of classSet) if (weightFn(t) > 0) n++;
  return n;
}

// A typography recipe (size + weight + tracking + color) is reused constantly and
// legitimately for every heading/label in the app, by hand, with no primitive behind it
// at all (Solen's own "H2/H3" convention is exactly this). Measured during calibration:
// DashPanel's internal title row ("text-[18px] font-semibold tracking-[-0.01em] text-s-ink")
// matched dozens of unrelated section headings at a near-perfect own-own ratio, purely
// because ANY correctly-styled 18px semibold ink heading shares this exact recipe. Position
// (fixed/absolute/inset/z), background/border, radius, and shadow tokens are structural and
// stay full-strength; requiring at least one of those alongside any typography overlap
// keeps a typography-only coincidence from clearing the "own" comparison on its own.
const TYPOGRAPHY_ONLY_RE =
  /^(font-|text-|tracking-|leading-|uppercase$|lowercase$|capitalize$|italic$|not-italic$|underline$|no-underline$|line-through$|truncate$|whitespace-|break-|tabular-nums$)/;

function hasStructuralToken(classSet, weightFn) {
  for (const t of classSet) {
    if (weightFn(t) <= 0) continue;
    const stripped = t.replace(/^[a-z0-9-]+:/, "");
    if (!TYPOGRAPHY_ONLY_RE.test(stripped)) return true;
  }
  return false;
}

// A STRICTER bar than hasStructuralToken, used only for the single-element "own" match:
// "border + bg-white/bg-s-bg-base + rounded-full/rounded-*" is the generic archetype for a
// pill/chip/card/framed-box, reused correctly by hand hundreds of times across the app for
// completely unrelated purposes (measured during calibration: SalonAppCta's chip Link and
// countless unrelated pill-shaped buttons/tags share exactly this trio). A first, looser
// version of this check also allowed "top-*/left-*/z-*" individually or any bracket-
// arbitrary value, but z-[1]/top-0/min-h-[280px] turned out to be just as generic as the
// chrome trio (measured: BentoCard's `z-[1]` and `min-h-[Npx]` alone matched broadly).
// The narrow signal that actually holds up is FULL-VIEWPORT OVERLAY positioning: fixed or
// sticky positioning, the exact `inset-0` (not a partial offset), or a backdrop effect,
// the same combination the doctrine's own Modal example is built from.
const ARCHITECTURAL_RE = /^(fixed|sticky|inset-0)$|^backdrop-/;

function hasArchitecturalMarker(classSet, weightFn) {
  for (const t of classSet) {
    if (weightFn(t) <= 0) continue;
    const stripped = t.replace(/^[a-z0-9-]+:/, "");
    if (ARCHITECTURAL_RE.test(stripped)) return true;
  }
  return false;
}

function structuralDistinctiveness(classSet, weightFn) {
  let sum = 0;
  for (const t of classSet) {
    if (weightFn(t) <= 0) continue;
    const stripped = t.replace(/^[a-z0-9-]+:/, "");
    if (TYPOGRAPHY_ONLY_RE.test(stripped)) continue;
    sum += weightFn(t);
  }
  return sum;
}

// Distinctiveness filter can only run once IDF is known (it needs the full repo scan done),
// so it is applied here as a post-filter on the corpus built in PASS 1, not at build time.
for (let i = primitives.length - 1; i >= 0; i--) {
  const p = primitives[i];
  // Structural (non-typography) distinctiveness only: a primitive can have a large TOTAL
  // sum purely from typography tokens (tracking/size/weight variants) while its actual
  // container recipe (border + bg + radius) is the single most generic "framed box" shape
  // in the app (measured during calibration: DashPanel's total sum was ~57, comfortably
  // over a naive floor, entirely because of its internal heading row; its structural-only
  // recipe, border + border-s-border + bg-white + radius, is indistinguishable from
  // hundreds of independently-styled cards). Gating on the structural subset catches this;
  // gating on the raw total sum does not.
  const sum = structuralDistinctiveness(p.full.classSet, idfClass);
  if (process.env.DUPE_DEBUG_DIST) console.error(`  ${sum.toFixed(1)}\t${p.name}\t[${[...p.full.classSet].join(" ")}]`);
  // A primitive whose identity is mostly a literal rendered TEXT format (PriceFrom's "CHF",
  // a format-string primitive) is still findable via the text-marker signal even when its
  // classSet carries almost no distinctive Tailwind vocabulary on its own; exempt it here
  // rather than dropping it from the whole corpus (caught during the required self-test:
  // PriceFrom's classSet sum is ~9, under the floor, and an earlier version of this filter
  // silently deleted it from the corpus, failing one of the three mandated true positives).
  if (sum < MIN_PRIMITIVE_DISTINCTIVENESS && p.full.textMarkers.size === 0) {
    unresolvedRows.push(
      `${p.name} (${p.file}: structural class-token distinctiveness ${sum.toFixed(1)} under MIN_PRIMITIVE_DISTINCTIVENESS=${MIN_PRIMITIVE_DISTINCTIVENESS}, too generic a recipe to anchor a match)`,
    );
    primitives.splice(i, 1);
    continue;
  }
  // Kept ONLY on the strength of its text markers: its classSet is too thin/generic to
  // trust for className (A) or anchor-coverage (C) scoring on its own (verified during
  // calibration: PriceFrom's remaining 3 tokens after layout-neutral filtering, tabular-nums
  // + text-s-ink-2 + font-semibold, is simply "the standard bold-number recipe" and matched
  // ~250 unrelated numeric displays repo-wide at anchor=1.00). classUnreliable routes it to
  // marker-only matching in the scoring loop.
  p.classUnreliable = sum < MIN_PRIMITIVE_DISTINCTIVENESS;
}

// DUPE_DEBUG=1 prints the raw IDF/combo statistics this detector's thresholds were
// calibrated against, for future recalibration when the repo's class-token vocabulary shifts.
if (process.env.DUPE_DEBUG) {
  console.error(`N=${N} indexed JSX elements, ${docFreq.classTotal.size} distinct class tokens, ${docFreq.comboTotal.size} distinct class combos (size>=3)`);
  const comboSorted = [...docFreq.comboTotal.entries()].sort((a, b) => b[1] - a[1]);
  console.error(`\ntop 25 combo frequencies (candidates for BOILERPLATE_COMBO_CAP=${BOILERPLATE_COMBO_CAP}):`);
  for (const [k, v] of comboSorted.slice(0, 25)) console.error(`  ${v}x  ${k}`);
}

function weightedJaccard(setA, setB, weightFn) {
  if (!setA.size && !setB.size) return 0;
  let inter = 0;
  let union = 0;
  const seen = new Set();
  for (const t of setA) {
    seen.add(t);
    const w = weightFn(t);
    union += w;
    if (setB.has(t)) inter += w;
  }
  for (const t of setB) {
    if (seen.has(t)) continue;
    union += weightFn(t);
  }
  return union === 0 ? 0 : inter / union;
}

/** Asymmetric precision: what fraction of the CANDIDATE's own distinctive vocabulary is
 *  also present in the primitive, weighted by rarity. Deliberately NOT symmetric Jaccard:
 *  a sophisticated primitive (Modal's motion states: data-[entering]/[exiting], ease-snap,
 *  duration-200) racks up many primitive-only tokens that a crude hand-rolled candidate
 *  never replicates, so a symmetric ratio divides the genuine "fixed + inset-0" overlap by
 *  a huge union and crushes the score toward zero even on the real true-positive backdrop
 *  match (caught during the required self-test: Modal's dashboard reimplementations
 *  vanished from the report under symmetric weightedJaccard). A partial, cruder
 *  reimplementation is still a reimplementation; the question is "how much of what the
 *  candidate wrote is explained by this primitive," not "how much of the primitive does the
 *  candidate also happen to replicate." Returns { precision, interWeight } so the caller can
 *  additionally require a minimum ABSOLUTE overlap (a 1-token match cannot be a false 1.0). */
function candidatePrecision(candidateSet, primitiveSet, weightFn) {
  let candWeight = 0;
  let interWeight = 0;
  for (const t of candidateSet) {
    const w = weightFn(t);
    if (w <= 0) continue;
    candWeight += w;
    if (primitiveSet.has(t)) interWeight += w;
  }
  return { precision: candWeight === 0 ? 0 : interWeight / candWeight, interWeight };
}

function anchorCoverage(primitiveSet, candidateSet, weightFn, k) {
  const ranked = [...primitiveSet].map((t) => [t, weightFn(t)]).sort((a, b) => b[1] - a[1]).slice(0, k);
  let total = 0;
  let matched = 0;
  for (const [t, w] of ranked) {
    total += w;
    if (candidateSet.has(t)) matched += w;
  }
  return total === 0 ? 0 : matched / total;
}

// ---------------------------------------------------------------------------------------
// Composition-exclusion: does this candidate node's subtree contain a JSX tag imported
// from the SAME file as the primitive under comparison? If so, that is reuse, not a dupe.
// ---------------------------------------------------------------------------------------
function isComposedReuse(entryFull, importMap, primitive) {
  for (const tagName of entryFull.tagNames) {
    const imp = importMap.get(tagName);
    if (imp && imp.file === primitive.file) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------------------
// PASS 3: score every (candidate node, primitive) pair, keep the best hit per (file, primitive)
// ---------------------------------------------------------------------------------------
const hitsByPrimitive = new Map(); // primitive.name -> Map(file -> best hit)

for (const [file, data] of perFileResults) {
  for (const primitive of primitives) {
    let best = null; // best HIGH-CONFIDENCE hit for this (file, primitive) pair
    let bestBroad = null; // best hit regardless of confidence (prevalence accounting + appendix)
    for (const entry of data.results) {
      if (isComposedReuse(entry.full, data.importMap, primitive)) continue;
      // Self-comparison: never score a node against the SAME primitive whose own
      // declaration contains it (per-primitive, not per-file: this file may host its own
      // registered primitive AND separately reimplement a DIFFERENT one, see the note above
      // perFileResults).
      if (file === primitive.file) {
        const start = entry.node.getStart(data.sourceFile);
        if (start >= primitive.declStart && start < primitive.declEnd) continue;
      }

      let combined = 0;
      const reasons = [];
      // Raw (undiscounted) shape evidence, tracked independently of SCORE_THRESHOLD/combined
      // so the precision-redesign gate below (STRUCTURAL_CLONE_MIN / NAME_ROOT_SHAPE_MIN) can
      // judge the shape signal on its own terms instead of the blended ranking score.
      let rawScoreB = 0;
      let markerHit = null;

      const primCount = primitive.full.elementCount || 1;
      const sizeOk =
        entry.full.elementCount >= Math.max(1, Math.floor(primCount * SIZE_WINDOW_MIN)) &&
        entry.full.elementCount <= Math.max(1, Math.ceil(primCount * SIZE_WINDOW_MAX));

      // Same identical-tiny-set trap as the "own" comparison: require a minimum vocabulary
      // on BOTH sides before trusting a className/shape ratio at the "full" granularity too.
      const FULL_MIN_CLASS_TOKENS = 3;
      // A 2-distinct-tag set (a div wrapping a single span, both with only a className prop)
      // is close to the single most common shape in any React codebase; require 3 so a
      // shape match means something more specific than "a wrapper around one child".
      const FULL_MIN_TAG_TOKENS = 3;

      if (sizeOk) {
        const fullShared = new Set([...entry.full.classSet].filter((t) => primitive.full.classSet.has(t)));
        let fullSharedWeight = 0;
        for (const t of fullShared) fullSharedWeight += idfClass(t);
        // Same minimum-ABSOLUTE-overlap requirement as the own-own comparison (a ratio alone
        // cannot separate a genuinely narrow, distinctive overlap from a coincidental one
        // between two otherwise-unrelated, but both design-system-vocabulary-using, subtrees).
        if (
          !primitive.classUnreliable &&
          nonZeroCount(entry.full.classSet, idfClass) >= FULL_MIN_CLASS_TOKENS &&
          nonZeroCount(primitive.full.classSet, idfClass) >= FULL_MIN_CLASS_TOKENS &&
          hasStructuralToken(fullShared, idfClass) &&
          fullSharedWeight >= MIN_OWN_ABS_WEIGHT
        ) {
          const scoreA = weightedJaccard(entry.full.classSet, primitive.full.classSet, idfClass);
          if (scoreA >= SCORE_THRESHOLD && scoreA > combined) {
            combined = scoreA;
          }
          if (scoreA >= SCORE_THRESHOLD) reasons.push(`A:className ${scoreA.toFixed(2)}`);
        }

        // Same identical-tiny-set trap as classSet: PriceFrom's shape is three <span
        // className> elements, which as a DEDUPED SET is one single token ("span(className)")
        // no matter how many spans it repeats. Gate on the deduped SET size, not the raw
        // token-array length, or every lone <span className="..."> in the repo (extremely
        // common) trivially scores a spurious 1.0 against it.
        const entryTagSet = new Set(entry.full.tagPropTokens);
        const primTagSet = new Set(primitive.full.tagPropTokens);
        if (entryTagSet.size >= FULL_MIN_TAG_TOKENS && primTagSet.size >= FULL_MIN_TAG_TOKENS) {
          const scoreB = weightedJaccard(entryTagSet, primTagSet, idfTag);
          rawScoreB = scoreB;
          if (scoreB >= SCORE_THRESHOLD && scoreB > combined) {
            combined = scoreB;
          }
          if (scoreB >= SCORE_THRESHOLD) reasons.push(`B:shape ${scoreB.toFixed(2)}`);
        }

        if (
          !primitive.classUnreliable &&
          nonZeroCount(entry.full.classSet, idfClass) >= 2 &&
          nonZeroCount(primitive.full.classSet, idfClass) >= FULL_MIN_CLASS_TOKENS &&
          hasStructuralToken(fullShared, idfClass)
        ) {
          const anchor = anchorCoverage(primitive.full.classSet, entry.full.classSet, idfClass, ANCHOR_K);
          if (anchor >= SCORE_THRESHOLD && anchor > combined) {
            combined = anchor;
          }
          if (anchor >= SCORE_THRESHOLD) reasons.push(`C:anchor ${anchor.toFixed(2)}`);
        }

        // Only trust a primitive as a MARKER SOURCE when its identity is genuinely a format
        // string (classUnreliable: thin className vocabulary, PriceFrom's actual case) or it
        // is otherwise a very small/focused primitive. A large composite primitive can pick
        // up a text marker as a pure side effect of ALSO containing an internal reimplement-
        // ation of a different, smaller primitive (CategoryHeroCarousel's own body hand-rolls
        // PriceFrom's "CHF" format, which then leaked into CategoryHeroCarousel's OWN marker
        // set, duplicate-flagging the same 41 files against BOTH primitives; caught during the
        // round-2 precision redesign). The marker's real owner is the small, focused primitive
        // whose role IS that text, not a big composite that coincidentally contains it once.
        const isMarkerSource = primitive.classUnreliable || primitive.full.elementCount <= 4;
        // Two structural patterns share PriceFrom's "CHF" marker without sharing its ROLE
        // (a from-price line): an input adornment label (`pointer-events-none` absolute text
        // beside a number input, "CHF" as a currency prefix on a FORM FIELD, not a display),
        // and a legal/definition-list row (`<dt>/<dd>`, an Impressum page's registration
        // details mentioning a CHF revenue threshold in PROSE). Both were confirmed false
        // positives during the 20-sample precision check (round 2) and are cheap, well-
        // justified structural exclusions, not a threshold tweak.
        const isInputAdornment = entry.full.classSet.has("pointer-events-none");
        const isDefinitionListProse = entry.full.tagNames.has("dt") || entry.full.tagNames.has("dd");
        if (isMarkerSource && !isInputAdornment && !isDefinitionListProse) {
          for (const m of primitive.full.textMarkers) {
            if (entry.full.textMarkers.has(m)) {
              markerHit = m;
              break;
            }
          }
        }
        if (markerHit && MARKER_SCORE > combined) {
          combined = MARKER_SCORE;
        }
        if (markerHit) reasons.push(`C:text-marker "${markerHit}"`);
      }

      // "own" (single-element) comparison: catches a small structural fragment (a backdrop
      // div, a wrapper) buried inside a much larger enclosing component, where the "full"
      // accumulated subtree at any single node is either too big (rooted high) or too small
      // (rooted at a leaf) to size-match the primitive. Not gated by the size window: both
      // sides are inherently single elements.
      let bestOwn = 0;
      if (
        !primitive.classUnreliable &&
        primitive.ownNodes.length <= OWN_NODES_CAP &&
        nonZeroCount(entry.own.classSet, idfClass) >= OWN_MIN_TOKENS &&
        !isBoilerplateCombo(entry.own.classSet)
      ) {
        for (const primOwn of primitive.ownNodes) {
          if (nonZeroCount(primOwn.classSet, idfClass) < OWN_MIN_TOKENS) continue;
          if (isBoilerplateCombo(primOwn.classSet)) continue;
          // A primOwn node whose classSet is very large is usually every CVA variant's
          // classes merged into one union (Select's single <select> element resolves ALL
          // size/tone variants into one classSet of ~50 tokens, not what any ONE instance
          // actually renders); asymmetric precision against a giant superset is close to
          // guaranteed to hit 100% for any candidate sharing the same design-token
          // vocabulary. The cutoff sits above Modal's own backdrop node (19 tokens, a real
          // true positive: many simultaneous motion/position classes on one element, not a
          // merged set of mutually-exclusive variants) and below Select's (~50).
          if (primOwn.classSet.size > 22) continue;
          const shared = new Set([...entry.own.classSet].filter((t) => primOwn.classSet.has(t)));
          if (!hasArchitecturalMarker(shared, idfClass)) continue; // generic chrome only, skip
          const { precision, interWeight } = candidatePrecision(entry.own.classSet, primOwn.classSet, idfClass);
          if (interWeight < MIN_OWN_ABS_WEIGHT) continue;
          const s = precision;
          if (s > bestOwn) bestOwn = s;
        }
      }
      const ownScore = bestOwn * 0.9; // slightly discounted vs a full-subtree match
      if (ownScore >= SCORE_THRESHOLD && ownScore > combined) {
        combined = ownScore;
      }
      if (ownScore >= SCORE_THRESHOLD) reasons.push(`shape-anchor ${bestOwn.toFixed(2)}`);

      if (combined < SCORE_THRESHOLD) continue;

      // ---- precision-redesign gate: WHICH kind of evidence fired, not how big the score is ----
      const bestShape = Math.max(rawScoreB, bestOwn); // raw, undiscounted
      const nameRoot = nameRootMatches(entry.enclosing, primitive.name);
      const avatarFp = primitive.name === "Avatar" && looksLikeAvatarShape(entry.full);
      let confidenceReason = null;
      if (markerHit) confidenceReason = `text-marker "${markerHit}"`;
      else if (avatarFp) confidenceReason = "avatar-fingerprint (rounded-full + fixed size + <img>)";
      else if (bestShape >= STRUCTURAL_CLONE_MIN) confidenceReason = `structural-clone (shape ${bestShape.toFixed(2)})`;
      else if (nameRoot && bestShape >= NAME_ROOT_SHAPE_MIN) confidenceReason = `name-root "${entry.enclosing}"~"${primitive.name}" + shape ${bestShape.toFixed(2)}`;
      const isHighConfidence = confidenceReason !== null;

      const candidate = {
        score: combined, reasons, line: entry.line, enclosing: entry.enclosing,
        isHighConfidence, confidenceReason,
      };
      if (!bestBroad || combined > bestBroad.score) bestBroad = candidate;
      if (isHighConfidence && (!best || combined > best.score)) best = candidate;
    }
    if (bestBroad) {
      if (!hitsByPrimitive.has(primitive.name)) hitsByPrimitive.set(primitive.name, new Map());
      hitsByPrimitive.get(primitive.name).set(file, {
        broad: { ...bestBroad, primitiveFile: primitive.file },
        high: best ? { ...best, primitiveFile: primitive.file } : null,
      });
    }
  }
}

// ---------------------------------------------------------------------------------------
// PASS 4: PRIMITIVE-PREVALENCE GUARD, then build the high-confidence findings list.
// A primitive with more than PREVALENCE_GUARD_MAX_FILES broad (SCORE_THRESHOLD-level) matches
// and ZERO high-confidence hits among them is a generic design idiom (a pill, a bordered
// card), not a role a candidate reimplemented; it is excluded from the report entirely and
// named in the Generic idioms section instead. A primitive that clears the same file count
// but DOES have high-confidence evidence (Modal: 59 broad matches, 8+ via name-root+shape)
// keeps ONLY its high-confidence hits; the rest of its broad matches are dropped, same as
// for any other primitive, per "everything below the high-confidence bar is dropped from the
// main report."
// ---------------------------------------------------------------------------------------
const genericIdioms = [];
const findings = [];
const lowConfidenceSummary = [];

for (const [primitiveName, fileMap] of hitsByPrimitive) {
  const broadCount = fileMap.size;
  const highEntries = [...fileMap.entries()].filter(([, hit]) => hit.high);
  const highCount = highEntries.length;

  if (broadCount > PREVALENCE_GUARD_MAX_FILES && highCount === 0) {
    genericIdioms.push({ primitiveName, broadCount });
    continue;
  }

  for (const [file, hit] of highEntries) {
    findings.push({ primitiveName, primitiveFile: hit.high.primitiveFile, file, occurrences: highCount, ...hit.high });
  }
  if (broadCount || highCount) lowConfidenceSummary.push({ primitiveName, broadCount, highCount });
}

// Rule-of-Three ranking WITHIN the now-uniformly-high-confidence findings (all already
// cleared the confidence gate; this only orders them, it is no longer the report's gate).
findings.sort((a, b) => {
  if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
  return b.score - a.score;
});

// ---------------------------------------------------------------------------------------
// Peer-duplication pass ("or each other", GOAL line): components that look like each other
// but matched NO registry primitive above threshold. Lighter-weight, top-level-function
// granularity only, so it stays cheap and does not re-report the primitive-anchored hits
// above. Only clusters of 3+ distinct files are reported (Rule of Three floor).
// ---------------------------------------------------------------------------------------
// Broad (any-confidence) matched files, not just the high-confidence findings: a file that
// already has SOME primitive explanation, even a dropped low-confidence one, should not also
// be re-suggested as "candidate for a brand new shared primitive".
const matchedFiles = new Set();
for (const fileMap of hitsByPrimitive.values()) {
  for (const file of fileMap.keys()) matchedFiles.add(file);
}
const peerCandidates = [];
for (const [file, data] of perFileResults) {
  if (matchedFiles.has(file)) continue;
  // Use each file's single largest "full" fingerprint as its whole-component signature.
  let top = null;
  for (const entry of data.results) {
    if (!top || entry.full.elementCount > top.full.elementCount) top = entry;
  }
  if (top && top.full.elementCount >= 4) {
    peerCandidates.push({ file, entry: top });
  }
}
const peerClusters = [];
const consumed = new Set();
for (let i = 0; i < peerCandidates.length; i++) {
  if (consumed.has(i)) continue;
  const group = [peerCandidates[i]];
  for (let j = i + 1; j < peerCandidates.length; j++) {
    if (consumed.has(j)) continue;
    const a = peerCandidates[i].entry.full;
    const b = peerCandidates[j].entry.full;
    const sizeOk = b.elementCount >= a.elementCount * 0.5 && b.elementCount <= a.elementCount * 2;
    if (!sizeOk) continue;
    const score = weightedJaccard(a.classSet, b.classSet, idfClass);
    if (score >= SCORE_THRESHOLD * 1.5) {
      group.push(peerCandidates[j]);
      consumed.add(j);
    }
  }
  if (group.length >= 3) {
    consumed.add(i);
    peerClusters.push(group);
  }
}

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------
const lines = [];
lines.push("# Near-duplicate component report");
lines.push("");
lines.push(
  "Report-mode only (no gating). Generated by `npm run dupe-check` " +
    "(scripts/detect-near-duplicates.mjs). Doctrine: " +
    "_design-system/research/CONSISTENCY_MISMATCH_R1.md section 3.6.",
);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(
  `Corpus: ${primitives.length} primitives resolved from COMPONENT_REGISTRY.md` +
    (unresolvedRows.length ? `, ${unresolvedRows.length} rows unresolved (see footer)` : "") +
    `. Candidate files scanned: ${perFileResults.size}. Total JSX elements indexed: ${docFreq.totalElements}.`,
);
lines.push("");

if (process.env.DUPE_DEBUG_BYPRIM) {
  const byPrim = new Map();
  for (const f of findings) byPrim.set(f.primitiveName, (byPrim.get(f.primitiveName) ?? 0) + 1);
  for (const [name, count] of [...byPrim.entries()].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${count}\t${name}`);
  }
}

const droppedLowConfidenceCount = lowConfidenceSummary.reduce((n, r) => n + (r.broadCount - r.highCount), 0);

lines.push("## Summary");
lines.push("");
lines.push(`- High-confidence findings (actionable, the report's HIGH count): ${findings.length}`);
lines.push(`- Generic idioms excluded entirely (prevalent, zero high-confidence evidence): ${genericIdioms.length} primitives`);
lines.push(`- Low-confidence matches dropped from the report (see appendix summary): ${droppedLowConfidenceCount}`);
lines.push(`- Peer-duplicate clusters (no primitive match, 3+ mutually similar files): ${peerClusters.length}`);
lines.push("");

function renderFinding(f) {
  const parts = [];
  parts.push(`- **${f.file}:${f.line}** (in \`${f.enclosing}\`)`);
  parts.push(`  likely reimplements **${f.primitiveName}** (\`${f.primitiveFile}\`)`);
  parts.push(`  why high-confidence: ${f.confidenceReason}`);
  parts.push(`  score ${f.score.toFixed(2)} [${f.reasons.join(", ")}]`);
  parts.push(`  high-confidence occurrences of this primitive across the repo: ${f.occurrences}`);
  parts.push(`  suggested fix: import \`${f.primitiveName}\` from \`${f.primitiveFile}\` instead of hand-rolling this shape.`);
  return parts.join("\n");
}

lines.push("## High-confidence findings");
lines.push("");
lines.push(
  "Each entry cleared one of the three high-confidence bars (text-marker, structural-clone " +
    ">= " + STRUCTURAL_CLONE_MIN + ", or name-root + shape >= " + NAME_ROOT_SHAPE_MIN + "). " +
    "This is the report's actionable list; everything else is summarized, not enumerated, below.",
);
lines.push("");
if (!findings.length) {
  lines.push("_none_");
  lines.push("");
} else {
  const groups = new Map();
  for (const f of findings) {
    if (!groups.has(f.primitiveName)) groups.set(f.primitiveName, []);
    groups.get(f.primitiveName).push(f);
  }
  for (const [primitiveName, list] of groups) {
    lines.push(`### ${primitiveName} (${list.length} high-confidence file${list.length === 1 ? "" : "s"})`);
    lines.push("");
    for (const f of list) lines.push(renderFinding(f));
    lines.push("");
  }
}

lines.push("## Peer-duplicate candidates (no registry primitive yet, \"or each other\")");
lines.push("");
if (!peerClusters.length) {
  lines.push("_none_");
} else {
  for (const group of peerClusters) {
    lines.push(`- Cluster of ${group.length} mutually similar components (candidate for a new shared primitive):`);
    for (const g of group) {
      lines.push(`  - ${g.file}:${g.entry.line} (in \`${g.entry.enclosing}\`)`);
    }
  }
}
lines.push("");

lines.push("## Generic idioms (excluded from matching entirely)");
lines.push("");
lines.push(
  `A primitive with more than ${PREVALENCE_GUARD_MAX_FILES} broad (className/shape) matches and ` +
    "ZERO high-confidence hits among them is a generic design idiom (a pill, a bordered card, a " +
    "chevron button), not a reuse-miss: static className/shape similarity cannot separate " +
    "\"independently, correctly using the same shared design-system convention\" from \"reimplementing " +
    "this primitive's specific role\" for a recipe that generic. Excluded so the report stays " +
    "actionable instead of flooding on the same handful of common shapes.",
);
lines.push("");
if (!genericIdioms.length) {
  lines.push("_none_");
} else {
  genericIdioms.sort((a, b) => b.broadCount - a.broadCount);
  for (const g of genericIdioms) lines.push(`- **${g.primitiveName}**: ${g.broadCount} broad matches, 0 high-confidence`);
}
lines.push("");

lines.push("## Low-confidence appendix (collapsed, not actionable)");
lines.push("");
lines.push(
  "Per-primitive counts only, not enumerated: broad = any match at SCORE_THRESHOLD; " +
    "high = cleared the high-confidence bar and is listed above. The gap between the two per " +
    "row is dropped from the report body.",
);
lines.push("");
if (!lowConfidenceSummary.length) {
  lines.push("_none_");
} else {
  lowConfidenceSummary.sort((a, b) => b.broadCount - a.broadCount);
  lines.push("| primitive | broad matches | high-confidence |");
  lines.push("|---|---|---|");
  for (const r of lowConfidenceSummary) lines.push(`| ${r.primitiveName} | ${r.broadCount} | ${r.highCount} |`);
}
lines.push("");

lines.push("## Calibration");
lines.push("");
lines.push(`- SIZE_WINDOW: candidate element count within [${SIZE_WINDOW_MIN}x, ${SIZE_WINDOW_MAX}x] of the primitive's.`);
lines.push(`- SCORE_THRESHOLD: ${SCORE_THRESHOLD} (candidate pool floor only, NOT the report gate; see below).`);
lines.push(`- Class/tag token weight is measured IDF over ${docFreq.totalElements} indexed JSX elements (no hand-typed stoplist).`);
lines.push(
  `- HIGH-CONFIDENCE GATE (the actual report gate, round 2, replaces plain threshold ranking): a finding is ` +
    `reported only if it clears ONE of: (1) an exact text-marker match (score ${MARKER_SCORE}); ` +
    `(2) a raw structural-clone shape signal >= ${STRUCTURAL_CLONE_MIN}; (3) name-root corroboration ` +
    `(the candidate's enclosing function/component name shares a root with the primitive's name) ` +
    `PLUS shape >= ${NAME_ROOT_SHAPE_MIN}. Threshold tuning alone could not separate signal from noise: ` +
    `measured during round 1, the real Avatar true positive scored 0.17, INSIDE the same 0.16-0.5 band as ` +
    `dozens of coincidental matches against generic-idiom primitives. Confidence is now about WHICH kind ` +
    `of evidence fired, not how large the blended score is.`,
);
lines.push(
  `- PRIMITIVE-PREVALENCE GUARD: broadCount > ${PREVALENCE_GUARD_MAX_FILES} AND zero high-confidence hits ` +
    `-> excluded entirely as a generic idiom (see that section above).`,
);
lines.push(
  "- Avatar structural fingerprint (primitive-specific, disclosed extension): rounded-full + an explicit " +
    "h-N/w-N (or h-[Npx]/w-[Npx]) pixel-size class + an <img> tag among descendants. Avatar's own SIZE " +
    "prop renders as an inline style, not a Tailwind class, so the general className-overlap signals " +
    "cannot see it at all; this fingerprint is the same visual pattern a human reviewer would look for.",
);
lines.push(`- Rule-of-Three ranking within the high-confidence list: occurrence count, then score (informational, no longer a report gate).`);
lines.push(
  "- KNOWN REMAINING FALSE-POSITIVE CLASS (disclosed, not silently hidden): a 20-sample manual " +
    "precision check against this report's PriceFrom findings found roughly 60% plausibly-real " +
    "reuse-misses. The recurring false-positive pattern is \"CHF\" appearing near a number in a " +
    "role that is NOT a from-price card/row display: a checkout/payment TOTAL line, a dashboard " +
    "revenue/spend KPI stat, an input-field currency-prefix adornment, or a prose sentence (an " +
    "Impressum legal disclosure, referral copy). Two structural exclusions (input-adornment via " +
    "`pointer-events-none`, legal prose via `<dt>/<dd>`) were added and confirmed to remove real " +
    "false positives, but do not cover every instance of the pattern (a currency-prefix span " +
    "without `pointer-events-none` still passes). Distinguishing \"a from-price display\" from " +
    "\"a KPI/total/prose sentence that happens to mention the same currency\" is a semantic-role " +
    "classification a static AST/className signal cannot fully make; it would need DOM-render " +
    "verification or human review, not further static threshold tuning.",
);
lines.push("");
if (unresolvedRows.length) {
  lines.push("## Registry rows not resolved into the corpus");
  lines.push("");
  for (const r of unresolvedRows) lines.push(`- ${r}`);
  lines.push("");
}

writeFileSync(REPORT_PATH, lines.join("\n"));

// ---------------------------------------------------------------------------------------
// stdout summary
// ---------------------------------------------------------------------------------------
console.log("");
console.log(`Near-duplicate scan: ${primitives.length} primitives x ${perFileResults.size} candidate files`);
console.log(`  High-confidence findings: ${findings.length}   Generic idioms excluded: ${genericIdioms.length}   Peer-clusters: ${peerClusters.length}`);
console.log(`  Report: ${relRoot(REPORT_PATH)}`);
console.log("");
if (findings.length) {
  console.log("Top hits:");
  for (const f of findings.slice(0, 10)) {
    console.log(`  ${f.file}:${f.line}  ~  ${f.primitiveName}  (${f.score.toFixed(2)}, ${f.confidenceReason})`);
  }
  console.log("");
}
if (genericIdioms.length) {
  console.log(`Generic idioms excluded: ${genericIdioms.map((g) => g.primitiveName).join(", ")}`);
  console.log("");
}
