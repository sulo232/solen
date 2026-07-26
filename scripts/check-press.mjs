#!/usr/bin/env node
// scripts/check-press.mjs
//
// STATIC press-tier animation checker (source scan, no browser - contrast this
// with scripts/check-motion.mjs, which is runtime-only for a DIFFERENT reason:
// that file hunts a defect with no reliable source signature at all. This one
// hunts the opposite shape - a defect that IS fully legible in the source, the
// moment you know where to look).
//
// WHY THIS EXISTS
// --------------------------------------------------------------------------
// The 2026-07-25 press-tier sweep found 17 controls whose press animation was
// DEAD, and the defect is invisible on a normal read of the source.
// `active:scale-[0.97]` only animates if the element's CSS `transition-property`
// list actually contains `transform`. `transition-colors` does not contain it.
// `transition-opacity` does not. `transition-[filter]` does not. On those
// elements the scale snaps with no tween, and an `active:duration-[80ms]`
// written right beside it is a no-op that changes nothing at all - the eye
// reads "there's a duration, there's a scale, must be animated" and is wrong.
//
// Both PDP commit buttons were in that state. So were five profile-settings
// rows and two payment-method rows. It was found by MEASURING: the PDP
// sidebar CTA reported a computed `transitionProperty` of
// `color, background-color, border-color, text-decoration-color, fill, stroke`
// - no transform anywhere. This is the project's named #1 failure mode, a
// control that looks wired and does nothing (CLAUDE.md "Silent no-ops"), and
// it is exactly the class that becomes a gate rather than advice
// (feedback_rules_are_hooks memory).
//
// WHAT IT CHECKS
// --------------------------------------------------------------------------
// Scans every .tsx file under app/, components/, components-legacy/. For every
// className/class STRING UNIT containing `active:scale-` or
// `group-active:scale-`, every `transition-<x>` token in that SAME unit is
// classified:
//   A) DEAD           at least one transition-* is declared and NONE of them
//                      covers transform. The scale cannot animate. BLOCKING.
//   B) NO-TRANSITION  no transition-* at all. The press snaps with no tween.
//                      Report-only - an instant press can be a legitimate
//                      choice, it is just usually unintentional.
//   C) OFF-LADDER      an active:scale-[N] whose N is not one of the three
//                      locked rungs (0.97 primary CTA, 0.98 row, 0.94 icon
//                      button). Report-only.
//   D) UNCERTAIN       the className expression contains non-literal
//                      (dynamic) content this scanner cannot resolve at parse
//                      time, so the real transition-property list cannot be
//                      confirmed. NEVER blocks - see "SAFE DIRECTION" below.
//   OK                everything else.
//
// A "unit" is not always one JS string literal. Tailwind concatenates every
// argument `cn()`/`clsx()` hands it onto ONE element's class attribute, so
// `cn("transition-colors", isActive && "active:scale-[0.97]")` is ONE unit
// even though the two tokens live in two separate string literals. A NAIVE
// scan that only ever looks inside a single string literal at a time gets
// fooled by exactly this shape and reports a false DEAD - the false-positive
// case the task brief calls out as the one that matters most. parseClassExpr()
// below recurses through cn()/clsx() call arguments, `&&`/`||` gates, and
// ternaries to reassemble the real per-element unit before classifying it.
//
// SAFE DIRECTION: missing a real hit >> flagging a fine control
// --------------------------------------------------------------------------
// Getting this wrong in the safe direction (missing a real hit) is much
// better than flagging a control that is actually fine. So the instant a
// className expression contains ANY content this scanner cannot statically
// resolve to a literal (a bare identifier, an imported constant, a function
// call this scanner doesn't recognise) alongside an active:scale token, the
// whole unit is reported UNCERTAIN rather than DEAD/NO-TRANSITION/OFF-LADDER -
// the unresolved part might carry the very transition-transform that would
// clear it, and this scanner has no way to know. UNCERTAIN never fails --gate.
//
// /dev/ PATHS
// --------------------------------------------------------------------------
// Anything under a `/dev/` path segment is a prototype route, not a customer
// surface, so it is scanned (the number stays visible) but bucketed
// separately and excluded from both the main totals and the gate by default.
// --include-dev folds dev-path findings into the normal buckets and gate.
//
// SHAPE (mirrors scripts/check-motion.mjs / scripts/check-geometry.mjs)
// --------------------------------------------------------------------------
// Usage banner, single main(), report file + stdout, a --gate flag that exits
// 1 on blocking (DEAD, non-allowlisted, non-dev-unless---include-dev) findings
// only, and a shrink-only RATCHET allowlist (PRESS_ALLOWLIST) with a reason
// string per entry, same spirit as MOTION_ALLOWLIST / FLOORS_ALLOWLIST. This
// checker is STATIC and needs no browser, so it is fast enough for a
// pre-commit path later.
//
// Usage:
//   node scripts/check-press.mjs
//   node scripts/check-press.mjs --gate
//   node scripts/check-press.mjs --include-dev
//   node scripts/check-press.mjs --gate --include-dev
//   npm run check:press
//   npm run gate:press
//
// Exit code: 0 in report-only mode, always. --gate exits 1 the moment any
// non-allowlisted, non-dev-excluded DEAD finding exists. NO-TRANSITION,
// OFF-LADDER, and UNCERTAIN never fail the gate, by design (see above).

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from "node:fs";
import { dirname, resolve, join, relative, sep } from "node:path";
import { tmpdir } from "node:os";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
const SCAN_ROOTS = ["app", "components", "components-legacy"];
const SKIP_DIR_NAMES = new Set(["node_modules", ".next", ".git", ".claude"]);
const OUTPUT_PATH = resolve(process.cwd(), "_plans/motion-audit/_press-report.md");

// The three locked press rungs (CLAUDE.md design contract / LOCKFILE), read
// with a small float tolerance since values arrive as parsed decimals.
const LOCKED_RUNGS = [0.97, 0.98, 0.94];
const RUNG_TOLERANCE = 0.001;

// ----------------------------------------------------------------------------
// PRESS_ALLOWLIST (ratchet, same spirit as check-motion.mjs's MOTION_ALLOWLIST
// / check-geometry.mjs's FLOORS_ALLOWLIST). Empty by design: the 2026-07-25
// press sweep fixed all 17 known-dead controls and the estate measured at
// ZERO remaining DEAD sites. Add a row here ONLY for a newly discovered,
// deliberately-deferred DEAD site, with a reason string naming why it isn't
// fixed yet - and delete the row the instant it is fixed. Never add a row to
// route around a fresh regression; that is what --gate is FOR catching.
// ----------------------------------------------------------------------------
const PRESS_ALLOWLIST = [
  // e.g. { pattern: /components\/Foo\.tsx:42/, reason: "tracked in _tasks/..., blocked on X" },
];

function matchAllowlist(fileLineText) {
  for (const entry of PRESS_ALLOWLIST) {
    if (entry.pattern.test(fileLineText)) return entry;
  }
  return null;
}

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  let gate = false;
  let includeDev = false;
  for (const a of argv) {
    if (a === "--gate") gate = true;
    else if (a === "--include-dev") includeDev = true;
  }
  return { gate, includeDev };
}

// ----------------------------------------------------------------------------
// Low-level string tokenizer helpers. All of parseClassExpr's confidence rests
// on these being right: they let the rest of the file treat "skip over a
// string/template literal" as one call, instead of re-deriving quote/escape
// handling at every call site (the exact kind of copy-paste drift that made
// the previous scan of this defect fooled by multi-argument cn() calls).
// ----------------------------------------------------------------------------

// Advances past a quoted string starting at text[i] (text[i] is the opening
// quote char). Returns the index just past the closing quote, or text.length
// if the string never closes (malformed input - callers treat that as a
// parse failure, not a crash).
function skipQuoted(text, i, quote) {
  i++; // step over the opening quote
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2; // an escaped char (incl. an escaped quote) can never end the string
      continue;
    }
    if (text[i] === quote) return i + 1;
    i++;
  }
  return i;
}

// Advances past a template literal starting at text[i] (text[i] is the
// backtick). ${...} interpolations are skipped via a small depth counter of
// their OWN (strings/templates inside an interpolation are themselves
// skipped recursively) so a `}` inside an interpolated expression never gets
// mistaken for the template's own close.
function skipTemplate(text, i) {
  i++; // step over the opening backtick
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === "`") return i + 1;
    if (text[i] === "$" && text[i + 1] === "{") {
      i += 2;
      let depth = 1;
      while (i < text.length && depth > 0) {
        const ch = text[i];
        if (ch === '"' || ch === "'") {
          i = skipQuoted(text, i, ch);
          continue;
        }
        if (ch === "`") {
          i = skipTemplate(text, i);
          continue;
        }
        if (ch === "{") {
          depth++;
          i++;
          continue;
        }
        if (ch === "}") {
          depth--;
          i++;
          continue;
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return i;
}

// Blanks out // and /* */ comments (replacing every char with a space, except
// newlines which are kept so line numbers stay identical to the source) while
// leaving string/template literal CONTENTS completely untouched - a comment
// character sequence can never appear "inside" a string here because strings
// are skipped as one atomic unit before the comment check ever runs. This
// matters for real code in this repo: SearchBar.tsx has a `cn(...)` call with
// a trailing `// mockup-ok: ...` line comment sitting between two class
// string arguments (line ~691) - without this pass that comment text would
// sit inside the "argument text" a naive comma-split would produce.
function stripComments(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      const end = skipQuoted(text, i, ch);
      out += text.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "`") {
      const end = skipTemplate(text, i);
      out += text.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      let j = i;
      while (j < text.length && text[j] !== "\n") j++;
      out += " ".repeat(j - i);
      i = j;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      let j = i + 2;
      while (j < text.length - 1 && !(text[j] === "*" && text[j + 1] === "/")) j++;
      j = Math.min(j + 2, text.length);
      out += text.slice(i, j).replace(/[^\n]/g, " ");
      i = j;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

// Finds the matching `}` for the `{` at text[openIdx], skipping over strings
// and templates so a brace inside a string is never mistaken for structure.
// Returns -1 if the braces never balance (malformed/truncated input).
function scanBalancedBraces(text, openIdx) {
  let depth = 0;
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(text, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(text, i);
      continue;
    }
    if (ch === "{") {
      depth++;
      i++;
      continue;
    }
    if (ch === "}") {
      depth--;
      i++;
      if (depth === 0) return i - 1;
      continue;
    }
    i++;
  }
  return -1;
}

// Splits `text` on every TOP-LEVEL (depth 0, outside strings/templates)
// occurrence of `op` (a literal 2-char operator: "&&" or "||"). Used instead
// of a regex split because a naive split would also cut inside a nested
// string like "a && b" that's part of a class list, or inside a nested call.
function splitTopLevelOp(text, op) {
  const parts = [];
  let depth = 0;
  let i = 0;
  let last = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(text, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(text, i);
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      i++;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      i++;
      continue;
    }
    if (depth === 0 && text.startsWith(op, i)) {
      parts.push(text.slice(last, i));
      i += op.length;
      last = i;
      continue;
    }
    i++;
  }
  parts.push(text.slice(last));
  return parts;
}

// Splits `text` on every TOP-LEVEL comma (depth 0, outside strings/templates)
// - i.e. call-argument splitting, without a full JS parser.
function splitTopLevelCommas(text) {
  const parts = [];
  let depth = 0;
  let i = 0;
  let last = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(text, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(text, i);
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      i++;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      i++;
      continue;
    }
    if (depth === 0 && ch === ",") {
      parts.push(text.slice(last, i));
      i++;
      last = i;
      continue;
    }
    i++;
  }
  const tail = text.slice(last);
  if (tail.trim().length > 0 || parts.length > 0) parts.push(tail);
  return parts;
}

// Finds a TOP-LEVEL `cond ? a : b`, respecting nested ternaries (each nested
// `?` needs its own `:`) and skipping `?.` (optional chaining) and `??`
// (nullish coalescing), neither of which is a ternary opener. Returns
// { a, b } (the two branches) or null if there's no top-level ternary here.
function splitTernary(text) {
  let depth = 0;
  let i = 0;
  let qIndex = -1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(text, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(text, i);
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      i++;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      i++;
      continue;
    }
    if (depth === 0 && ch === "?" && text[i + 1] !== "." && text[i + 1] !== "?") {
      qIndex = i;
      break;
    }
    i++;
  }
  if (qIndex === -1) return null;

  let depth2 = 0;
  let nestedQ = 0;
  let colonIndex = -1;
  i = qIndex + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(text, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(text, i);
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") {
      depth2++;
      i++;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth2--;
      i++;
      continue;
    }
    if (depth2 === 0 && ch === "?" && text[i + 1] !== "." && text[i + 1] !== "?") {
      nestedQ++;
      i++;
      continue;
    }
    if (depth2 === 0 && ch === ":") {
      if (nestedQ > 0) {
        nestedQ--;
        i++;
        continue;
      }
      colonIndex = i;
      break;
    }
    i++;
  }
  if (colonIndex === -1) return null;
  return { a: text.slice(qIndex + 1, colonIndex), b: text.slice(colonIndex + 1) };
}

// text[0..] is a quoted string that spans the ENTIRE (trimmed) input - i.e.
// this whole expression IS just a string literal, not a string literal
// followed by trailing code.
function quotedSpansWhole(text) {
  if (text[0] !== '"' && text[0] !== "'") return false;
  return skipQuoted(text, 0, text[0]) === text.length;
}
function templateSpansWhole(text) {
  if (text[0] !== "`") return false;
  return skipTemplate(text, 0) === text.length;
}

// Parses a call expression `name(args)` sitting at the very start of `text`
// and spanning to its very end (i.e. the whole expression IS one call, not a
// call followed by more code, e.g. `foo().bar`). Returns { name, argsText }
// or null. Written by hand (not a regex) because a regex closing paren match
// can't reliably tell "the paren that matches THIS open paren" from "the last
// paren character in the string" once nested calls/strings are involved.
function parseCallExpr(text) {
  const m = /^([A-Za-z_$][A-Za-z0-9_$.]*)\s*\(/.exec(text);
  if (!m) return null;
  const openIdx = m[0].length - 1;
  let depth = 0;
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(text, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(text, i);
      continue;
    }
    if (ch === "(") {
      depth++;
      i++;
      continue;
    }
    if (ch === ")") {
      depth--;
      i++;
      if (depth === 0) break;
      continue;
    }
    i++;
  }
  if (depth !== 0) return null; // unterminated call
  const closeIdx = i - 1;
  if (closeIdx !== text.length - 1) return null; // trailing content after the call - not a bare call expr
  return { name: m[1], argsText: text.slice(openIdx + 1, closeIdx) };
}

// Helper names Tailwind's class-merge ecosystem ships under in this codebase
// (and elsewhere) - a call to one of these concatenates all of its resolved
// arguments onto ONE element, which is exactly the "one unit" this whole
// checker is built around.
const CLASS_HELPER_NAMES = new Set(["cn", "clsx", "classnames", "classNames", "cx", "twMerge"]);

// ----------------------------------------------------------------------------
// parseClassExpr: the core "reassemble the real per-element unit" recursion.
// Returns { literalParts: string[], dynamic: boolean }.
//   literalParts  every class-string fragment this scanner could resolve
//                 with full confidence (plain strings, template literal text
//                 outside ${}, both branches of a ?: or &&/||, every argument
//                 of a recognised class-helper call).
//   dynamic       true the instant ANY part of the expression could NOT be
//                 resolved to a literal (a bare identifier, a member
//                 expression, a call to something that isn't a known class
//                 helper). See the SAFE DIRECTION note at the top of the
//                 file for why this flag, not a best-effort guess, is what
//                 the classifier keys UNCERTAIN off of.
// ----------------------------------------------------------------------------
function parseClassExpr(rawText) {
  const text = rawText.trim();
  if (text.length === 0) return { literalParts: [], dynamic: false };

  // (expr) - a parenthesized wrapper spanning the whole input.
  if (text[0] === "(") {
    let depth = 0;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"' || ch === "'") {
        i = skipQuoted(text, i, ch);
        continue;
      }
      if (ch === "`") {
        i = skipTemplate(text, i);
        continue;
      }
      if (ch === "(") {
        depth++;
        i++;
        continue;
      }
      if (ch === ")") {
        depth--;
        i++;
        if (depth === 0) break;
        continue;
      }
      i++;
    }
    if (depth === 0 && i === text.length) {
      return parseClassExpr(text.slice(1, -1));
    }
    // fall through: not a whole-span wrapper (e.g. "(a) + (b)") - treat as dynamic below
  }

  if (quotedSpansWhole(text)) {
    return { literalParts: [unquote(text)], dynamic: false };
  }

  if (templateSpansWhole(text)) {
    return parseTemplateLiteral(text);
  }

  // Top-level `&&`: short-circuit means the VALUE is whatever the LAST
  // operand is (`cond && "x"` - cond is a boolean gate, "x" is the payload;
  // `a && b && "x"` - same idea, chain of gates ending in the payload). Only
  // the last segment is recursed into; earlier segments are assumed to be
  // plain booleans, which is the overwhelmingly common shape for a
  // conditional Tailwind class and is exactly the shape of the real
  // false-positive case this file exists to not flag (test 7 below).
  const andParts = splitTopLevelOp(text, "&&");
  if (andParts.length > 1) {
    return parseClassExpr(andParts[andParts.length - 1]);
  }

  // Top-level `||`: either branch could be the live value, so both are
  // unioned in (conservative - matches the SAFE DIRECTION: over-collecting
  // literal text never causes a false DEAD, it can only ever help find a
  // covering transition that's really there).
  const orParts = splitTopLevelOp(text, "||");
  if (orParts.length > 1) {
    const result = { literalParts: [], dynamic: false };
    for (const part of orParts) {
      const r = parseClassExpr(part);
      result.literalParts.push(...r.literalParts);
      result.dynamic = result.dynamic || r.dynamic;
    }
    return result;
  }

  // Top-level ternary: both branches are possible, union them.
  const ternary = splitTernary(text);
  if (ternary) {
    const ra = parseClassExpr(ternary.a);
    const rb = parseClassExpr(ternary.b);
    return {
      literalParts: [...ra.literalParts, ...rb.literalParts],
      dynamic: ra.dynamic || rb.dynamic,
    };
  }

  // A call expression spanning the whole input - recurse into its arguments
  // ONLY if it's a recognised class-merge helper; any other function call's
  // return value is unknown, so it's dynamic.
  const call = parseCallExpr(text);
  if (call) {
    const baseName = call.name.split(".").pop();
    if (CLASS_HELPER_NAMES.has(baseName)) {
      const args = splitTopLevelCommas(call.argsText);
      const result = { literalParts: [], dynamic: false };
      for (const arg of args) {
        const r = parseClassExpr(arg);
        result.literalParts.push(...r.literalParts);
        result.dynamic = result.dynamic || r.dynamic;
      }
      return result;
    }
    return { literalParts: [], dynamic: true };
  }

  // Fallback: a bare identifier, member expression, spread, or anything else
  // this scanner doesn't specifically understand. Its content is genuinely
  // unknown - dynamic, per the SAFE DIRECTION policy.
  return { literalParts: [], dynamic: true };
}

function unquote(text) {
  // text is a full quoted literal (verified by the caller); strip the
  // surrounding quotes and unescape the one escape sequence that matters for
  // token-matching purposes - the escaped version of the quote char itself.
  const quote = text[0];
  const inner = text.slice(1, -1);
  return inner.split("\\" + quote).join(quote);
}

// A template literal spanning the whole input. Literal text outside ${...}
// is kept (interpolations are replaced with a single space so adjacent
// literal chunks never accidentally fuse into one token, e.g.
// `text-${color}-500` must not read as one blob "text--500"). Any
// interpolation marks the result dynamic - conservative, since an
// interpolated expression could in principle inject a whole utility class,
// even though in practice it's far more often a single dynamic word.
function parseTemplateLiteral(text) {
  let i = 1;
  let literal = "";
  let hasSubstitution = false;
  while (i < text.length - 1) {
    if (text[i] === "\\") {
      literal += text[i + 1];
      i += 2;
      continue;
    }
    if (text[i] === "$" && text[i + 1] === "{") {
      hasSubstitution = true;
      i += 2;
      let depth = 1;
      while (i < text.length && depth > 0) {
        const ch = text[i];
        if (ch === '"' || ch === "'") {
          i = skipQuoted(text, i, ch);
          continue;
        }
        if (ch === "`") {
          i = skipTemplate(text, i);
          continue;
        }
        if (ch === "{") {
          depth++;
          i++;
          continue;
        }
        if (ch === "}") {
          depth--;
          i++;
          continue;
        }
        i++;
      }
      literal += " ";
      continue;
    }
    literal += text[i];
    i++;
  }
  return { literalParts: [literal], dynamic: hasSubstitution };
}

// ----------------------------------------------------------------------------
// Token-level classification. Operates on the reassembled unit's tokens
// (whitespace-split, since Tailwind utilities never contain unescaped
// whitespace - even arbitrary-value brackets like transition-[colors,transform]
// use commas, not spaces, as the internal separator).
// ----------------------------------------------------------------------------
function baseUtility(token) {
  const parts = token.split(":");
  return parts[parts.length - 1];
}

// True only when the variant IMMEDIATELY before the base utility is
// active/group-active - i.e. this is really a press-state scale, not some
// other variant's scale (e.g. hover:scale-105, which this checker has no
// opinion about).
function isScaleToken(token) {
  const parts = token.split(":");
  if (parts.length < 2) return false;
  const base = parts[parts.length - 1];
  const lastVariant = parts[parts.length - 2];
  return (lastVariant === "active" || lastVariant === "group-active") && base.startsWith("scale-");
}

function isTransitionToken(token) {
  const base = baseUtility(token);
  return base === "transition" || base.startsWith("transition-");
}

// Tailwind's bare `transition` utility already covers transform (its DEFAULT
// transition-property list is color/background-color/border-color/
// text-decoration-color/fill/stroke/opacity/box-shadow/transform/filter/
// backdrop-filter) - only the NAMED narrower utilities (transition-colors,
// transition-opacity, transition-shadow, transition-none) exclude it.
function transitionCoversTransform(token) {
  const base = baseUtility(token);
  if (base === "transition") return true;
  if (base === "transition-all") return true;
  if (base === "transition-transform") return true;
  const bracket = /^transition-\[([^\]]*)\]$/.exec(base);
  if (bracket) {
    const parts = bracket[1].split(",").map((s) => s.trim());
    return parts.includes("transform");
  }
  return false; // transition-colors / transition-opacity / transition-shadow / transition-none / anything else named
}

function parseScaleValue(token) {
  const bracket = /scale-\[([^\]]+)\]/.exec(token);
  if (bracket) {
    let v = bracket[1].trim();
    if (v.endsWith("%")) return parseFloat(v) / 100;
    return parseFloat(v);
  }
  const plain = /scale-(\d+)$/.exec(token);
  if (plain) return parseInt(plain[1], 10) / 100;
  return null;
}

function isOnLadder(value) {
  if (value === null || Number.isNaN(value)) return true; // unparsable - don't invent an off-ladder finding
  return LOCKED_RUNGS.some((rung) => Math.abs(rung - value) <= RUNG_TOLERANCE);
}

// The single source of truth for the four-way classification described in
// the file header. Returns null when the unit has no active/group-active
// scale token at all (not relevant to this checker).
function classifyUnit(literalParts, dynamic) {
  const tokens = literalParts.join(" ").split(/\s+/).filter(Boolean);
  const scaleTokens = tokens.filter(isScaleToken);
  if (scaleTokens.length === 0) return null;

  const scaleValues = scaleTokens.map((t) => ({ token: t, value: parseScaleValue(t) }));
  const transitionTokens = tokens.filter(isTransitionToken);

  // SAFE DIRECTION (see file header): unresolved content anywhere in this
  // unit means the real transition-property list can't be confirmed, so this
  // NEVER resolves to the blocking DEAD class - it is reported UNCERTAIN
  // regardless of what the literal-only tokens would otherwise suggest.
  if (dynamic) {
    return { classification: "UNCERTAIN", scaleTokens: scaleValues, transitionTokens };
  }

  if (transitionTokens.length === 0) {
    return { classification: "NO-TRANSITION", scaleTokens: scaleValues, transitionTokens };
  }

  const covers = transitionTokens.some(transitionCoversTransform);
  if (!covers) {
    return { classification: "DEAD", scaleTokens: scaleValues, transitionTokens };
  }

  const offLadder = scaleValues.filter((s) => !isOnLadder(s.value));
  if (offLadder.length > 0) {
    return { classification: "OFF-LADDER", scaleTokens: scaleValues, transitionTokens, offLadder };
  }

  return { classification: "OK", scaleTokens: scaleValues, transitionTokens };
}

// ----------------------------------------------------------------------------
// File-level extraction: find every className=/class= attribute in a file
// and hand its expression text to parseClassExpr + classifyUnit.
// ----------------------------------------------------------------------------
const CLASSNAME_ATTR_RE = /\b(?:className|class)\s*=\s*/g;

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}

function scanFileContent(content, relPath, isDev) {
  const findings = [];
  const codeView = stripComments(content); // comments blanked, length/newlines preserved (see stripComments doc)
  CLASSNAME_ATTR_RE.lastIndex = 0;
  let m;
  while ((m = CLASSNAME_ATTR_RE.exec(codeView)) !== null) {
    const afterEq = m.index + m[0].length;
    const line = lineNumberAt(content, m.index);
    const ch = codeView[afterEq];

    let literalParts = [];
    let dynamic = false;
    let parseFailed = false;

    if (ch === '"' || ch === "'") {
      const end = skipQuoted(codeView, afterEq, ch);
      if (end > codeView.length) {
        parseFailed = true;
      } else {
        literalParts = [unquote(codeView.slice(afterEq, end))];
      }
    } else if (ch === "{") {
      const closeIdx = scanBalancedBraces(codeView, afterEq);
      if (closeIdx === -1) {
        parseFailed = true;
      } else {
        const inner = codeView.slice(afterEq + 1, closeIdx);
        const parsed = parseClassExpr(inner);
        literalParts = parsed.literalParts;
        dynamic = parsed.dynamic;
      }
    } else {
      // Neither a quoted string nor a `{expr}` - not valid JSX for this
      // attribute (or the regex matched something that isn't actually a JSX
      // attribute, e.g. inside an unrelated string this scanner didn't skip).
      // Treated as a parse failure rather than silently ignored, so it still
      // surfaces as UNCERTAIN instead of vanishing.
      parseFailed = true;
    }

    if (parseFailed) {
      // Can't tell if there's even an active:scale token here without a
      // resolved unit - only worth reporting if there's a LEXICAL hint of one
      // nearby, otherwise every "class=" false match (e.g. TS `class Foo {`,
      // which this regex's `=`-requirement mostly already excludes) would
      // spam UNCERTAIN. Cheap heuristic: look at a bounded window right after
      // the attribute for the literal substring.
      const window = codeView.slice(afterEq, Math.min(afterEq + 4000, codeView.length));
      if (/active:scale-|group-active:scale-/.test(window)) {
        findings.push({
          file: relPath,
          line,
          isDev,
          classification: "UNCERTAIN",
          scaleTokens: [],
          transitionTokens: [],
          note: "className expression did not parse cleanly (unbalanced quote/brace) - could not confirm the transition list",
        });
      }
      continue;
    }

    const result = classifyUnit(literalParts, dynamic);
    if (!result) continue; // no active/group-active scale token in this unit at all
    findings.push({ file: relPath, line, isDev, ...result });
  }
  return findings;
}

// ----------------------------------------------------------------------------
// Directory walk
// ----------------------------------------------------------------------------
function listTsxFiles(rootDir) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // root doesn't exist (e.g. no components-legacy in some checkout) - fine, just yields nothing
    }
    for (const entry of entries) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
        out.push(full);
      }
    }
  }
  walk(rootDir);
  return out;
}

function isDevPath(relPath) {
  return relPath.split(sep).includes("dev");
}

// Runs the full pipeline (walk + scan + isDev tagging) over one or more root
// directories. Shared by the real run (SCAN_ROOTS) and the self-test (a temp
// dir), so the self-test exercises the EXACT same code path a real run does,
// not a parallel hand-simulated version of it.
function scanRoots(roots, cwd) {
  let filesScanned = 0;
  const findings = [];
  for (const root of roots) {
    const rootDir = resolve(cwd, root);
    const files = listTsxFiles(rootDir);
    for (const file of files) {
      filesScanned++;
      const relPath = relative(cwd, file);
      const content = readFileSync(file, "utf8");
      const dev = isDevPath(relPath);
      findings.push(...scanFileContent(content, relPath, dev));
    }
  }
  return { findings, filesScanned };
}

// ----------------------------------------------------------------------------
// Embedded self-test (rule 12.5: build, self-test, THEN integrate). Writes
// real synthetic fixture files under a temp dir (so the FULL pipeline - walk,
// read, comment-strip, parse, classify - is exercised, not just the pure
// classify() function in isolation) and asserts the 7 required shapes, plus
// an 8th covering the /dev/ exclusion behaviour. Cleans up after itself.
// ----------------------------------------------------------------------------
function selfTestPressLogic() {
  const assertions = [];
  function assert(name, cond) {
    assertions.push({ name, pass: !!cond });
  }

  const testDir = join(process.env.TMPDIR || tmpdir(), `check-press-selftest-${process.pid}-${Date.now()}`);
  const componentsDir = join(testDir, "components");
  const devDir = join(testDir, "app", "dev");
  mkdirSync(componentsDir, { recursive: true });
  mkdirSync(devDir, { recursive: true });

  // Cases 1-4, 5, 6 - one JSX button per case, in source order, plus case 7
  // (the multi-argument cn() false-positive case) as the last button. All
  // seven share one file so the self-test also proves file-level scanning
  // returns findings in a stable order matching source order.
  const fixture = `
import { cn } from "@/lib/cn";

export function Fixture({ cond }: { cond: boolean }) {
  return (
    <div>
      <button className="transition-colors duration-150 active:scale-[0.97]">A</button>
      <button className="transition-[colors,transform] duration-150 active:scale-[0.97]">B</button>
      <button className="transition-transform active:scale-[0.98]">C</button>
      <button className="transition-all active:scale-[0.94]">D</button>
      <button className="active:scale-[0.97]">E</button>
      <button className="transition-[colors,transform] active:scale-[0.90]">F</button>
      <button
        className={cn(
          "transition-[colors,transform] duration-150", // mockup-ok: comment between args, must not break the split
          cond && "active:scale-[0.97]",
        )}
      >
        G
      </button>
    </div>
  );
}
`;
  writeFileSync(join(componentsDir, "Fixture.tsx"), fixture, "utf8");

  // Case 8: the same real DEAD shape (case 1), but under a /dev/ path segment -
  // proves the default run buckets it separately and --include-dev folds it in.
  const devFixture = `
export function DevFixture() {
  return <button className="transition-colors active:scale-[0.97]">Z</button>;
}
`;
  writeFileSync(join(devDir, "DevFixture.tsx"), devFixture, "utf8");

  try {
    const { findings } = scanRoots(["components", "app"], testDir);
    const nonDev = findings.filter((f) => !f.isDev).sort((a, b) => a.line - b.line);
    const devFindings = findings.filter((f) => f.isDev);

    assert("self-test found exactly 7 non-dev findings (cases A-G)", nonDev.length === 7);

    const byLetter = nonDev; // already sorted by line, matches A..G source order
    assert("case 1 (transition-colors, scale-0.97): classified DEAD", byLetter[0] && byLetter[0].classification === "DEAD");
    assert(
      "case 2 (transition-[colors,transform], scale-0.97): classified OK",
      byLetter[1] && byLetter[1].classification === "OK",
    );
    assert("case 3 (transition-transform, scale-0.98): classified OK", byLetter[2] && byLetter[2].classification === "OK");
    assert("case 4 (transition-all, scale-0.94): classified OK", byLetter[3] && byLetter[3].classification === "OK");
    assert(
      "case 5 (no transition at all, scale-0.97): classified NO-TRANSITION, non-blocking",
      byLetter[4] && byLetter[4].classification === "NO-TRANSITION",
    );
    assert(
      "case 6 (transition-[colors,transform], scale-0.90): classified OFF-LADDER, non-blocking",
      byLetter[5] && byLetter[5].classification === "OFF-LADDER",
    );
    assert(
      "case 7 (cn() split across two literals + trailing comment): classified OK, NOT DEAD - the false-positive case that matters most",
      byLetter[6] && byLetter[6].classification === "OK",
    );

    assert(
      "case 8 (/dev/ path, real DEAD shape): excluded from the default (non-dev) bucket",
      devFindings.length === 1 && devFindings[0].classification === "DEAD" && devFindings[0].isDev === true,
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }

  const failed = assertions.filter((a) => !a.pass);
  if (failed.length > 0) {
    console.error("[check-press] SELF-TEST FAILED - press-tier scan logic is not sound:");
    for (const f of failed) console.error(`  - ${f.name}`);
    process.exit(1);
  }
  console.log(`[check-press] self-test passed (${assertions.length} assertions, real fixture files, full scan pipeline)`);
}

// ----------------------------------------------------------------------------
// Report formatting
// ----------------------------------------------------------------------------
function formatFinding(f) {
  const loc = `${f.file}:${f.line}`;
  const scaleText = (f.scaleTokens || []).map((s) => s.token).join(" ") || "(none)";
  const transitionText = (f.transitionTokens || []).length > 0 ? f.transitionTokens.join(" ") : "(none)";
  const hit = matchAllowlist(loc);
  const allowTail = hit ? ` - ALLOWLISTED (${hit.reason})` : "";
  const devTail = f.isDev ? " - dev-path" : "";
  const noteTail = f.note ? ` - ${f.note}` : "";
  return `\`${loc}\`${devTail} - scale: ${scaleText} - transition: ${transitionText}${allowTail}${noteTail}`;
}

function formatSection(title, items) {
  const lines = [`### ${title} (${items.length})`, ""];
  if (items.length === 0) lines.push("none found");
  else for (const f of items) lines.push("- " + formatFinding(f));
  lines.push("");
  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
function main() {
  selfTestPressLogic();

  const { gate, includeDev } = parseArgs(process.argv.slice(2));
  console.log(`[check-press] scanning .tsx under: ${SCAN_ROOTS.join(", ")} (include-dev=${includeDev})`);

  const { findings: allFindings, filesScanned } = scanRoots(SCAN_ROOTS, process.cwd());

  // Dev-path findings are bucketed separately by default (report-only,
  // visible count) and only folded into the main buckets/gate with
  // --include-dev - see file header.
  const devFindings = allFindings.filter((f) => f.isDev);
  const mainFindings = includeDev ? allFindings : allFindings.filter((f) => !f.isDev);
  const devSkippedFindings = includeDev ? [] : devFindings;

  const byClass = { DEAD: [], "NO-TRANSITION": [], "OFF-LADDER": [], UNCERTAIN: [], OK: [] };
  for (const f of mainFindings) byClass[f.classification].push(f);

  const header = [
    "# Press-tier animation checker",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Files scanned: ${filesScanned}  Roots: ${SCAN_ROOTS.join(", ")}`,
    "",
    "Static source scan (no browser) for the class of press control whose active:scale- cannot",
    "actually animate because its own transition-property list doesn't include transform. See",
    "the file header of scripts/check-press.mjs for the full reasoning and the SAFE DIRECTION policy",
    "(unresolved dynamic content -> UNCERTAIN, never DEAD).",
    "",
    `Totals (excl. /dev/ unless --include-dev): DEAD=${byClass.DEAD.length}  NO-TRANSITION=${byClass["NO-TRANSITION"].length}  ` +
      `OFF-LADDER=${byClass["OFF-LADDER"].length}  UNCERTAIN=${byClass.UNCERTAIN.length}  OK=${byClass.OK.length}  ` +
      `DEV-SKIPPED=${devSkippedFindings.length}${includeDev ? " (folded into totals above via --include-dev)" : ""}`,
    "",
    "---",
    "",
  ].join("\n");

  const body =
    formatSection("DEAD (blocking)", byClass.DEAD) +
    "\n" +
    formatSection("NO-TRANSITION (report-only)", byClass["NO-TRANSITION"]) +
    "\n" +
    formatSection("OFF-LADDER (report-only)", byClass["OFF-LADDER"]) +
    "\n" +
    formatSection("UNCERTAIN (report-only, never blocks --gate)", byClass.UNCERTAIN) +
    "\n" +
    formatSection(
      includeDev ? "DEV-SKIPPED (none - folded into totals via --include-dev)" : "DEV-SKIPPED (report-only, run --include-dev to check)",
      devSkippedFindings,
    );

  const report = header + body;
  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(OUTPUT_PATH, report);

  console.log("");
  console.log(
    `[check-press] DEAD=${byClass.DEAD.length} NO-TRANSITION=${byClass["NO-TRANSITION"].length} OFF-LADDER=${byClass["OFF-LADDER"].length} ` +
      `UNCERTAIN=${byClass.UNCERTAIN.length} OK=${byClass.OK.length} DEV-SKIPPED=${devSkippedFindings.length}`,
  );
  console.log(`[check-press] report written to ${OUTPUT_PATH}`);

  if (gate) {
    console.log("");
    console.log("[check-press] --gate: checking every DEAD finding against PRESS_ALLOWLIST...");
    let gateFailed = false;
    for (const f of byClass.DEAD) {
      const loc = `${f.file}:${f.line}`;
      if (matchAllowlist(loc)) continue;
      gateFailed = true;
      console.error(
        `[check-press] GATE FAIL: ${loc} - active:scale (${f.scaleTokens.map((s) => s.token).join(" ")}) has no transition covering ` +
          `transform (declared: ${f.transitionTokens.join(" ") || "(none)"}). The scale snaps with no tween. Not in PRESS_ALLOWLIST ` +
          "(top of scripts/check-press.mjs). Fix shape: WIDEN THAT ELEMENT'S OWN transition property list so it includes transform - " +
          "transition-colors becomes transition-[colors,transform], transition-opacity becomes transition-[opacity,transform]. Do NOT " +
          "reach for transition-all - that animates every property and is a blunt instrument. Shipping examples: " +
          "app/[locale]/_components/homepage/SearchBar.tsx and app/[locale]/_components/homepage/SalonCard.tsx.",
      );
    }
    if (gateFailed) {
      console.error("");
      console.error("[check-press] GATE: FAILED - one or more controls have a DEAD press animation.");
      process.exit(1);
    }
    console.log("[check-press] GATE: PASSED - no un-allowlisted DEAD press animation found.");
    process.exit(0);
  }

  process.exit(0);
}

main();
