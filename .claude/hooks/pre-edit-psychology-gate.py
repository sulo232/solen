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
"""
import json
import os
import re
import sys
import time

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()


def allow():
    sys.exit(0)


def block(reason):
    sys.stderr.write(reason)
    sys.exit(2)


# ---- global bypasses ----
if os.environ.get("SOLEN_PSYCH_GATE", "1") == "0":
    allow()
FLAG = os.path.join(PROJECT_DIR, ".claude", "psych-gate-skip.flag")
try:
    if os.path.exists(FLAG) and (time.time() - os.path.getmtime(FLAG)) <= 1800:
        allow()
except Exception:
    pass

try:
    data = json.load(sys.stdin)
except Exception:
    allow()

tool = data.get("tool_name") or ""
ti = data.get("tool_input") or {}
path = str(ti.get("file_path") or "")
if not path:
    allow()

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
    allow()
if any(s in low for s in ("/_audits/", "/node_modules/", ".d.ts")):
    allow()

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
        allow()
except Exception:
    allow()

if not new.strip():
    allow()

COUNT_TOKEN = re.compile(r"count|review|bewertung|\bcnt\b|_count", re.IGNORECASE)


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


# net-new = the OLD text (Edit: the replaced snippet; Write: the whole prior
# file) did NOT already exhibit the same CLASS of violation. If old was already
# broken, an unrelated edit to that region must not block (drift-gate rule:
# "pre-existing drift never blocks an unrelated edit").
RATINGSTARS_TAG = re.compile(r"<RatingStars\b[^>]*>")
RATING_TOFIXED = re.compile(r"\b(?:rating|average_rating|averageRating|avgRating)\b\s*!?\s*\.\s*toFixed")
HARDCODED_COUNT = re.compile(r"(?<![\w{.])\d{2,}\s+(Salons?|Bewertungen?|reviews?|Ergebnisse?|results?)\b")


def bare_ratingstars(text):
    out = []
    for m in RATINGSTARS_TAG.finditer(text):
        tag = m.group(0)
        if ("value" in tag or "rating" in tag.lower()) and not COUNT_TOKEN.search(tag):
            out.append(m)
    return out


def bare_star_tofixed(text):
    if re.search(r"<Star\b", text) and not COUNT_TOKEN.search(text):
        return RATING_TOFIXED.search(text)
    return None


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

# ---- P2: hardcoded count literal (fabricated number) ----
if not HARDCODED_COUNT.search(old):  # old had no hardcoded count -> net-new
    for m in HARDCODED_COUNT.finditer(new):
        if line_has_ok(new, m.start()):
            continue
        violations.append(("P2 (law 9: real numbers only)",
                           "a hardcoded count literal: \"" + m.group(0).strip() + "\"",
                           "compute it from live data ({items.length} " + m.group(1)
                           + ") or drop the number, never hardcode a count"))
        break

if not violations:
    allow()

lines = ["\U0001F6D1 psychology-gate (net-new violation of _design-system/PSYCHOLOGY.md):", ""]
for law, what, fix in violations:
    lines.append(f"  {law}")
    lines.append(f"    found: {what}")
    lines.append(f"    fix:   {fix}")
    lines.append("")
lines.append("This is a hard, machine-checkable law (not a suggestion). Fix it, or if")
lines.append("this is a genuine false positive: add `psych-ok: <reason>` on the line,")
lines.append("or `touch .claude/psych-gate-skip.flag` for this turn.")
block("\n".join(lines) + "\n")
