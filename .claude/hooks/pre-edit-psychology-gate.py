#!/usr/bin/env python3
"""pre-edit-psychology-gate.py : Solen behavioral-law GATE (2026-07-07).
============================================================================

Purpose: BLOCK an Edit/Write that introduces a NET-NEW, machine-checkable
violation of a _design-system/PSYCHOLOGY.md law. Docs and skills are advice
and get forgotten as context packs up (owner: "AIs take suggestions but wont
do it acc or forget as contexts pack up"). This moves the checkable laws to
runtime, the same move that took the drift rules and the exists-check to gates.

Only the laws a machine can check FALSE-POSITIVE-FREE live here. The judgment
laws (peak-end warmth, comparability, effort-over-delight) can't be gated;
those go to the loop-reviewer psychology lens instead (fresh context, not the
main thread's fading memory).

Checks (all NET-NEW only: a violation already in the old text never blocks an
unrelated edit, exactly like pre-edit-drift-gate.sh):

  P1  law 6, stars never render bare. A rating display with no review count:
      (a) <RatingStars .../> whose tag has value/rating but no count, or
      (b) a <Star> icon plus a (rating|average_rating).toFixed(...) with no
          count/review/Bewertung token anywhere in the inserted block.
      The exact audit finding that hit 5 surfaces (bare "4.8", no "(54)").

  P2  law 9, real numbers only. A HARDCODED count literal like "14 Salons"
      or "23 Bewertungen" (a literal 2+ digit number directly before a
      count noun). Computed counts ({entries.length} Salons, {n} reviews)
      never match. The exact audit finding (fake "14 Salons in der Naehe").

Scope: only app|components|components-legacy *.tsx (design surfaces).
Skips mockups/public, _audits, node_modules, .d.ts, generated.

Escape hatches (a false positive must never trap you):
  - Per line:  add `psych-ok: <reason>` on or just above the offending line.
  - This turn: touch .claude/psych-gate-skip.flag        # 30-minute TTL
  - Session:   export SOLEN_PSYCH_GATE=0

FAIL-OPEN: any error -> allow. A gate bug must never brick editing.
Registered via .claude/settings.json under hooks.PreToolUse "Edit" + "Write".
Exit 2 + stderr = BLOCK (PreToolUse convention, same as the drift gate).

2026-08-19 fix (adversarial pass, three reproduced defects; a fourth item the
plan named but whose text was cut off before it was written out was left
unaddressed -- not fabricated):

  (1) GATE_LAW shape 3, "the stand-down is shorter than a sentence". COUNT_TOKEN
      had no word boundary on "count"/"review", so the substring merely
      APPEARING inside an unrelated identifier ("Preview", "Discount",
      "discountPct", "accountId", "countryCode") satisfied the has-a-count-
      nearby escape and silently disarmed P1b/P1c (a real SalonCard rating row
      stopped blocking the moment a "-20% discount" pill sat in the same edit).
      has_count_signal() now requires a real word boundary, with CAMEL_COUNT
      covering the camelCase suffix spelling (reviewCount, ratingCount) that a
      bare \\bcount\\b would otherwise miss, and "_count" kept as an explicit
      literal since underscore is a \\w char and \\b can't see it
      (review_count, staff_review_count are this repo's actual naming).

  (2) GATE_LAW shape 2, "scope widened and the grammar did not". HARDCODED_COUNT
      had no re.IGNORECASE and a de/en-only noun list on a de/en/fr/it product:
      "14 Salons" blocked, "14 salons" / "14 Reviews" / "23 avis" / "23
      Recensioni" all passed untouched. Now case-insensitive with avis/
      recensioni added. Closing this uncovered a second-order false positive:
      case-insensitivity also started matching casual lowercase mentions
      inside developer CODE COMMENTS ("Self-hides at < 2 salons"), which
      pre-date this fix and are not rendered UI copy. hardcoded_count_hits()
      now drops any match inside a `//` or `/* */` comment span.

  (3) The lookbehind excluded "{" as well as word chars and ".", so a digit
      wrapped in a JSX expression container with NOTHING else in it, `{14}
      Salons`, was excused as if it were a computed value like `{items.length}
      Salons` -- it is not, `{14}` is the exact hardcoded-literal shape the
      law exists to catch, just disguised in braces. The pattern now has a
      second alternative that matches a brace containing ONLY digits
      (optionally padded with whitespace); it does not match a real computed
      expression that merely ends in a digit, e.g. `{SALONS.length * 5}
      salons` (there is more than a number between the braces).
"""
import json
import os
import re
import sys
import time

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

# 2026-08-19 fix (1): see module docstring. "review"/"bewertung"/"cnt" get a leading \b (still
# matches "review_count", "Bewertungen", since nothing after the word needs a boundary; it only
# excludes the word being embedded after a letter, e.g. "Preview"). "_count" stays a literal
# substring (underscore is a \w char, so \b can't see it) for "review_count" / "salon_count".
# "count" as its own bare word needs both boundaries (\bcount\b) so "Discount"/"accountId"/
# "countryCode" don't match; CAMEL_COUNT separately covers the camelCase suffix spelling
# ("reviewCount", "ratingCount") that \bcount\b alone would miss.
COUNT_TOKEN = re.compile(r"\breview|_count|\bcount\b|bewertung|\bcnt\b", re.IGNORECASE)
CAMEL_COUNT = re.compile(r"(?<=[a-z])Count\b")  # reviewCount, ratingCount, salonCount

RATINGSTARS_TAG = re.compile(r"<RatingStars\b[^>]*>")
RATING_TOFIXED = re.compile(r"\b(?:rating|average_rating|averageRating|avgRating)\b\s*!?\s*\.\s*toFixed")

# 2026-08-19 fix (2) + (3): see module docstring. IGNORECASE covers case, avis/recensioni close
# the two missing locales, and the second alternative reaches `{14} Salons` (a bare literal
# wrapped in braces with nothing else inside) without also matching a real computed expression
# that happens to end in a digit, e.g. `{SALONS.length * 5} salons`.
HARDCODED_COUNT = re.compile(
    r"(?:(?<![\w.])\d+\s+|\{\s*\d+\s*\}\s*)(Salons?|Bewertungen?|reviews?|Ergebnisse?|results?|"
    r"Kunden?|Mitarbeiter|Fotos?|Termine?|avis|recensioni)\b",
    re.IGNORECASE
)
COMMENT_SPAN = re.compile(r"//[^\n]*|/\*.*?\*/", re.S)

# P1c (HTML mockups only): a star MARKER (glyph, amber fill, or star class) followed
# within a short window by a bare decimal rating (N.N) and NO count next to it. Real
# mockups render this as `<span class="star">★</span> 4.8`. Verified against the live
# mockups 2026-07-07. Decorative stars with no trailing decimal (`★ Start here`) never
# match; a rating with a parenthesised count (`4.8 (54)`) is allowed by has_count_signal.
STAR_MARKER = re.compile(r"★|fill=[\"']#FFC32B[\"']|lucide-star|class=[\"'][^\"']*\bstar\b", re.I)
RATING_DECIMAL = re.compile(r"\b[0-5]\.\d\b")  # a star-rating range value, not a version/price
COUNT_PAREN = re.compile(r"\(\s*\d")  # a parenthesised count, e.g. "4.8 (54)"
PRICEISH = re.compile(r"chf|€|\$|\bab\b|\bfrom\b|\bpreis\b|/\s*(mo|monat|month)", re.I)


def has_count_signal(text):
    return bool(COUNT_TOKEN.search(text) or CAMEL_COUNT.search(text))


def hardcoded_count_hits(text):
    spans = [(c.start(), c.end()) for c in COMMENT_SPAN.finditer(text)]
    out = []
    for m in HARDCODED_COUNT.finditer(text):
        if any(s <= m.start() < e for s, e in spans):
            continue
        out.append(m)
    return out


def line_has_ok(text, idx):
    """psych-ok: escape on the matched line or the line just above it."""
    start = text.rfind("\n", 0, idx) + 1
    end = text.find("\n", idx)
    if end == -1:
        end = len(text)
    cur = text[start:end]
    prev_start = text.rfind("\n", 0, start - 1) + 1 if start > 0 else 0
    prev = text[prev_start:start]
    return "psych-ok:" in cur.lower() or "psych-ok:" in prev.lower()


def bare_star_html(text):
    """A star marker with a rating-range decimal in the next 60 chars and no count next
    to it (and not a price). Matches the real mockup pattern `★</span> 4.8` / an amber
    <svg fill="#FFC32B">...</svg> 4.9."""
    out = []
    for m in STAR_MARKER.finditer(text):
        window = text[m.end():m.end() + 60]
        if RATING_DECIMAL.search(window) and not COUNT_PAREN.search(window) \
                and not has_count_signal(window) and not PRICEISH.search(window):
            out.append(m)
    return out


def bare_ratingstars(text):
    out = []
    for m in RATINGSTARS_TAG.finditer(text):
        tag = m.group(0)
        if ("value" in tag or "rating" in tag.lower()) and not has_count_signal(tag):
            out.append(m)
    return out


def bare_star_tofixed(text):
    if re.search(r"<Star\b", text) and not has_count_signal(text):
        return RATING_TOFIXED.search(text)
    return None


def evaluate(data):
    """Given the parsed hook-event dict, return a block message string, or None to allow."""
    if os.environ.get("SOLEN_PSYCH_GATE", "1") == "0":
        return None
    flag = os.path.join(PROJECT_DIR, ".claude", "psych-gate-skip.flag")
    try:
        if os.path.exists(flag) and (time.time() - os.path.getmtime(flag)) <= 1800:
            return None
    except Exception:
        pass

    tool = data.get("tool_name") or ""
    ti = data.get("tool_input") or {}
    path = str(ti.get("file_path") or "")
    if not path:
        return None

    # ---- scope: design-surface tsx (real code + dev-route mockups) OR public/_mockups
    # HTML mockups (owner 2026-07-07: "the UI/UX one must trigger on mockups too, harden
    # everything"). CLAUDE.md binds the no-fabrication / stars-with-count laws to mockups.
    # On HTML the React-specific P1 checks (<RatingStars>, rating.toFixed) simply don't
    # match; the load-bearing one for mockups is P2 (a hardcoded count like "14 Salons"),
    # which is exactly the invented-count rule mockups already have to obey. ----
    low = path.lower()
    is_design_tsx = bool(re.search(r"(app/|components/|components-legacy/).*\.tsx$", low))
    is_mockup_html = "/_mockups/" in low and (low.endswith(".html") or low.endswith(".htm"))
    if not (is_design_tsx or is_mockup_html):
        return None
    if any(s in low for s in ("/_audits/", "/node_modules/", ".d.ts")):
        return None

    # ---- build (new, old) by tool ----
    try:
        if tool == "Edit":
            new = ti.get("new_string") or ""
            old = ti.get("old_string") or ""
        elif tool == "Write":
            new = ti.get("content") or ""
            old = ""
            if os.path.exists(path):
                with open(path, encoding="utf-8", errors="ignore") as f:
                    old = f.read()
        elif tool == "MultiEdit":
            edits = ti.get("edits") or []
            new = "\n".join(e.get("new_string", "") for e in edits)
            old = "\n".join(e.get("old_string", "") for e in edits)
        else:
            return None
    except Exception:
        return None

    if not new.strip():
        return None

    # net-new = the OLD text (Edit: the replaced snippet; Write: the whole prior
    # file) did NOT already exhibit the same CLASS of violation. If old was already
    # broken, an unrelated edit to that region must not block (drift-gate rule:
    # "pre-existing drift never blocks an unrelated edit").
    violations = []

    # ---- P1a: <RatingStars ...> without count ----
    if not bare_ratingstars(old):  # old wasn't already violating -> net-new
        for m in bare_ratingstars(new):
            if line_has_ok(new, m.start()):
                continue
            violations.append(("P1 (law 6: stars never bare)",
                               "<RatingStars> renders without a `count` prop: " + m.group(0).strip(),
                               "pass count={reviewCount} so it shows \"4.8 (54)\", never a bare average"))
            break

    # ---- P1b: <Star> icon + rating.toFixed with no count token in the block ----
    if not bare_star_tofixed(old):
        tf = bare_star_tofixed(new)
        if tf and not line_has_ok(new, tf.start()):
            violations.append(("P1 (law 6: stars never bare)",
                               "a <Star> icon plus rating.toFixed(...) with no review count in the block",
                               "render the count next to it, e.g. `{rating.toFixed(1)} ({reviewCount})`"))

    # ---- P1c: HTML mockup star marker + bare rating with no count (mockups only) ----
    if is_mockup_html and not bare_star_html(old):
        for m in bare_star_html(new):
            if line_has_ok(new, m.start()):
                continue
            violations.append(("P1 (law 6: stars never bare, mockup)",
                               "a star + bare rating with no review count in the mockup",
                               "put the count next to it (e.g. \"4.8 (54)\"), never a lone star + average"))
            break

    # ---- P2: hardcoded count literal (fabricated number) ----
    if not hardcoded_count_hits(old):  # old had no hardcoded count -> net-new
        for m in hardcoded_count_hits(new):
            if line_has_ok(new, m.start()):
                continue
            violations.append(("P2 (law 9: real numbers only)",
                               "a hardcoded count literal: \"" + m.group(0).strip() + "\"",
                               "compute it from live data ({items.length} " + m.group(1)
                               + ") or drop the number, never hardcode a count"))
            break

    if not violations:
        return None

    lines = ["\U0001F6D1 psychology-gate (net-new violation of _design-system/PSYCHOLOGY.md):", ""]
    for law, what, fix in violations:
        lines.append(f"  {law}")
        lines.append(f"    found: {what}")
        lines.append(f"    fix:   {fix}")
        lines.append("")
    lines.append("This is a hard, machine-checkable law (not a suggestion). Fix it, or if")
    lines.append("this is a genuine false positive: add `psych-ok: <reason>` on the line,")
    lines.append("or `touch .claude/psych-gate-skip.flag` for this turn.")
    return "\n".join(lines) + "\n"


def _selftest():
    F = "/Users/sulo/Documents/solen/app/[locale]/salon/[slug]/page.tsx"

    def payload(new, old="UNRELATED_OLD_xyz", tool="Edit", file_path=F):
        return {"tool_name": tool, "tool_input": {"file_path": file_path, "old_string": old, "new_string": new}}

    cases = [
        # (label, payload, expect_block)
        ("control: hardcoded German count", payload('<p className="text-s-ink-2">14 Salons in der Nähe</p>'), True),
        ("defect1: Star+toFixed with no count at all", payload(
            '<div>Vorschau<Star className="h-3 w-3 fill-s-star" /><span>{rating.toFixed(1)}</span></div>'), True),
        ("defect1: 'Preview' substring must no longer stand the gate down", payload(
            '<div>Preview<Star className="h-3 w-3 fill-s-star" /><span>{rating.toFixed(1)}</span></div>'), True),
        ("defect1: a -20% discount pill in the same edit must no longer disarm P1b", payload(
            '<div><span>-20% Discount</span><Star className="h-3 w-3 fill-s-star" />'
            '<span>{rating.toFixed(1)}</span></div>'), True),
        ("defect2: lowercase '14 salons' (case-sensitivity hole)", payload('<p>14 salons near you</p>'), True),
        ("defect2: capital '14 Reviews' (case-sensitivity hole)", payload('<p>14 Reviews</p>'), True),
        ("defect2: French '23 avis' (missing locale)", payload('<p>23 avis</p>'), True),
        ("defect2: Italian '23 Recensioni' (missing locale)", payload('<p>23 Recensioni</p>'), True),
        ("defect3: brace-wrapped literal '{14} Salons'", payload('<p>{14} Salons in der Nähe</p>'), True),
        ("correct: reviewCount camelCase satisfies the count requirement", payload(
            '<div><Star className="h-3 w-3 fill-s-star" /><span>{rating.toFixed(1)}</span>'
            '<span>({reviewCount})</span></div>'), False),
        ("correct: review_count snake_case satisfies the count requirement", payload(
            '<div><Star className="h-3 w-3 fill-s-star" /><span>{rating.toFixed(1)} '
            '({salon.review_count})</span></div>'), False),
        ("correct: computed {items.length} count is not hardcoded", payload(
            '<p>{items.length} Salons in der Nähe</p>'), False),
        ("correct: a real multiplier expression is not a bare brace literal", payload(
            '<p>{SALONS.length * 5} salons in this area</p>'), False),
        ("correct: RatingStars with a count prop", payload('<RatingStars value={4.8} count={54} />'), False),
        ("correct: psych-ok escape on the offending line", payload(
            '<div><Star className="h-3 w-3" />{rating.toFixed(1)} {/* psych-ok: decorative, '
            'not a live rating */}</div>'), False),
        ("correct: a developer comment mentioning a count is not rendered copy", payload(
            '// Self-hides at < 2 salons, same floor CategoryMobileRails.tsx uses\n'
            'export const X = 1;'), False),
        ("correct: pre-existing violation in old text is not net-new", payload(
            '<p>14 Salons in der Nähe, unrelated edit below</p>',
            old='14 Salons in der Nähe'), False),
        ("correct: out-of-scope path (not app/components*)", payload(
            '<p>14 Salons in der Nähe</p>', file_path="/Users/sulo/Documents/solen/scripts/seed.ts"), False),
    ]

    passed = 0
    for label, data, expect_block in cases:
        result = evaluate(data)
        got_block = result is not None
        ok = got_block == expect_block
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        print(f"[{status}] {label}  (expect block={expect_block}, got block={got_block})")
    print(f"\n{passed}/{len(cases)} passed")
    sys.exit(0 if passed == len(cases) else 1)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        _selftest()

    try:
        _data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    _result = evaluate(_data)
    if _result is None:
        sys.exit(0)
    sys.stderr.write(_result)
    sys.exit(2)
