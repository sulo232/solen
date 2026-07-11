#!/usr/bin/env python3
"""no-black-selected-gate.py : Solen selected-state GATE (built 2026-07-08).
============================================================================

Why this exists: CLAUDE.md:53, _design-system/LOCKFILE.md:1215 and
_design-system/REMOVED.md:41 have all cited a gate named `no-black-selected`
since 2026-06-29. It was never actually built. Three canonical docs asserted an
enforcement that did not exist, so nobody was stopped, and the 2026-07-08
full-estate frontend audit found 62 banned selected-states across 44 files.
This file makes the citation true.

The law (owner voice, 2026-06-29, supersedes ink-fill V3-D421 and blue-border
V3-D450): every selected / active state is the calm gray TabPill treatment,
`bg-s-bg-sunken` (#F4F4F5) + `text-s-ink` + semibold, over a white unselected.
Never a black/ink fill. Approved mockup: public/_mockups/selected-states-redesign.html

Named exceptions from the design contract, all encoded below:
  - the ONE primary commit button stays ink (it is not a selected state)
  - booking date / time slot stays blue
  - the avatar `SelectedCheckBadge` stays ink for photo contrast (parked)

Check (net-new only, same discipline as pre-edit-drift-gate.sh and
pre-edit-psychology-gate.py: pre-existing drift never blocks an unrelated edit):

  S1  a conditional whose TRUE branch paints an ink fill (`bg-s-ink` together
      with `text-white`) and whose CONDITION reads as a selection test
      (on / active / selected / picked / checked / `x === y` tab compare).
      Variant tests (variant === "primary", isPrimary) and state tests
      (disabled, loading) are not selection and never match.

Scope: app|components|components-legacy *.tsx, plus public/_mockups *.html
(CLAUDE.md copy rule 5: the mockup rules bind mockups too).

Escape hatches (a false positive must never trap you):
  - Per line:  add `selected-ok: <reason>` on or just above the offending line.
  - This turn: touch .claude/selected-gate-skip.flag       # 30-minute TTL
  - Session:   export SOLEN_SELECTED_GATE=0

Fail-open: any error allows the edit. A gate bug must never brick editing.
Exit 2 + stderr = block (PreToolUse convention).
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


if os.environ.get("SOLEN_SELECTED_GATE", "1") == "0":
    allow()
FLAG = os.path.join(PROJECT_DIR, ".claude", "selected-gate-skip.flag")
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

low = path.lower()
is_design_tsx = bool(re.search(r"(app/|components/|components-legacy/).*\.tsx$", low))
is_mockup_html = "/_mockups/" in low and low.endswith((".html", ".htm"))
if not (is_design_tsx or is_mockup_html):
    allow()
if any(s in low for s in ("/_audits/", "/node_modules/", ".d.ts")):
    allow()

# Named contract exception: the avatar check-badge is ink on purpose (photo contrast).
if re.search(r"selectedcheckbadge|/avatar\.tsx$", low):
    allow()

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

# A ternary true-branch string literal that paints an ink fill.
# Captures the condition text immediately preceding the `?`.
# 2026-07-10 fix: was same-line-only ([^\n?]), so a prettier-formatted multiline ternary
#   isSelected
#     ? "bg-s-ink text-white"
#     : "bg-white"
# (condition, newline, THEN `?`) never matched. [^?] lets the condition span across the
# newline(s) prettier inserts (bounded to ~140 chars, non-greedy, so it still stops at the
# nearest `?` and does not runaway-match across an unrelated distant one).
INK_TERNARY = re.compile(
    r"([^?]{0,140}?)\?\s*"           # condition (may span 1-2 newlines) then ?
    # true-branch literal containing an ink OR blue/accent fill/border. 2026-07-11: added blue
    # (bg-s-accent / border-s-accent) , the owner rejects BOTH black-when-selected AND
    # blue-when-selected (2026-07-02); this gate was previously blind to blue (audit finding).
    r"[`\"']([^`\"']*?(?:bg-s-ink|bg-s-accent|border-s-accent)[^`\"']*?)[`\"']",
    re.IGNORECASE,
)

# Const-based selected classes: `const SEL = "border-s-accent bg-s-accent ..."` then
# `selected ? SEL : REST` , the token is off the ternary line, so INK_TERNARY misses it.
SEL_CONST = re.compile(
    r"\b(SEL|SELECTED|ACTIVE|SEL_CLS|SELECTED_CLS|selectedCls|activeCls|selClass)\b\s*=\s*"
    r"[\"'`][^\"'`]*\b(bg-s-ink|border-s-ink|bg-s-accent|border-s-accent)\b",
    re.IGNORECASE,
)

# Condition reads as a SELECTION test.
SELECTION_COND = re.compile(
    r"\b(on|active|isActive|selected|isSelected|picked|isPicked|isOn|checked|isChecked|current)\b"
    r"|===|==\s*[\w\"'`]",
    re.IGNORECASE,
)

# Condition is a variant / lifecycle test, not a selection. Never a violation.
NOT_SELECTION = re.compile(
    r"\b(variant|primary|isPrimary|commit|submit|cta|disabled|isDisabled|loading|isLoading"
    r"|pending|error|invalid|danger|destructive|today|isToday"
    # LOCKED design-contract exception: booking date / slot / calendar / time selection stays
    # BLUE (not gray) , never flag it. (2026-07-11: ported the global gate's date-blue carve-out.)
    r"|date|slot|calendar|time)\b",
    re.IGNORECASE,
)

# The true branch must actually be a fill (bg-s-ink + white text), not e.g. `text-s-ink`
# or a border-only treatment.
def is_ink_fill(branch):
    b = branch.lower()
    ink = "bg-s-ink" in b and ("text-white" in b or "text-s-bg" in b)
    blue = "bg-s-accent" in b or "border-s-accent" in b  # blue-selected also banned (owner 2026-07-02)
    return ink or blue


def line_has_ok(text, idx):
    start = text.rfind("\n", 0, idx) + 1
    end = text.find("\n", idx)
    if end == -1:
        end = len(text)
    cur = text[start:end]
    prev_start = text.rfind("\n", 0, start - 1) + 1 if start > 0 else 0
    prev = text[prev_start:start]
    return "selected-ok:" in cur.lower() or "selected-ok:" in prev.lower()


def offenders(text):
    out = []
    for m in INK_TERNARY.finditer(text):
        cond, branch = m.group(1), m.group(2)
        if not is_ink_fill(branch):
            continue
        if NOT_SELECTION.search(cond):
            continue
        if not SELECTION_COND.search(cond):
            continue
        out.append(m)
    # Const-based selected class (blue/ink off the ternary line). Same date/slot/commit exemption.
    for m in SEL_CONST.finditer(text):
        lo, hi = max(0, m.start() - 60), min(len(text), m.end() + 80)
        if NOT_SELECTION.search(text[lo:hi]):
            continue
        out.append(m)
    return out


# net-new only: if the replaced/old text already had the same class of violation,
# an unrelated edit to that region must not block.
if offenders(old):
    allow()

hits = [m for m in offenders(new) if not line_has_ok(new, m.start())]
if not hits:
    allow()

m = hits[0]
found = m.group(0).strip()[:120]

msg = [
    "\U0001F6D1 no-black/blue-selected gate (design contract, owner voice 2026-06-29 + 2026-07-02):", "",
    "  A selected/active state is being painted with an ink/black OR blue/accent fill/border.",
    "    found: " + found,
    "    fix:   selected = the calm gray TabPill treatment instead:",
    "             bg-s-bg-sunken  +  text-s-ink  +  font-semibold",
    "           over a white unselected. Approved mockup:",
    "             public/_mockups/selected-states-redesign.html", "",
    "  This supersedes ink-fill (V3-D421) and blue-border (V3-D450) selection.",
    "  Contract exceptions, which never reach this message: the ONE primary",
    "  commit button (ink), the booking date/time slot (blue), and the avatar",
    "  SelectedCheckBadge (ink, for photo contrast).", "",
    "  Genuine false positive? add `selected-ok: <reason>` on the line, or",
    "  `touch .claude/selected-gate-skip.flag` for this turn.",
]
block("\n".join(msg) + "\n")
