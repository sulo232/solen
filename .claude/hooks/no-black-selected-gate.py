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

2026-08-18 stress-test fix, two defects MEASURED: (1) the booking date/slot/calendar/time
exception was a whole-word `\b...\b` match, so `selectedSlot === t` (camelCase) and
`selected_slot` (snake_case, underscore counts as \w so no boundary) both missed it and got
wrongly blocked; replaced with camelCase/snake_case-aware lookaround matching in
is_booking_exempt(). (2) `bg-black`, `bg-[#0A0A0A]`, `bg-[#000]`, `bg-[#000000]`, and an inline
`style={{background:'#0A0A0A'}}` all painted the exact banned ink fill and passed, only the
`bg-s-ink` token spelling was caught; extended is_ink_fill() and FILL to the literal spellings.
Also added the file's first `--selftest`, this gate never had one.
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


def _drive(file_path, content, tool="Write"):
    """Selftest helper: re-run this file as a subprocess with a synthetic PreToolUse payload,
    the same black-box shape hook-probe.py uses."""
    import subprocess
    payload = {"tool_name": tool, "tool_input": {"file_path": file_path, "content": content}}
    p = subprocess.run([sys.executable, os.path.abspath(__file__)], input=json.dumps(payload),
                        capture_output=True, text=True, timeout=10,
                        env={**os.environ, "SOLEN_SELECTED_GATE": "1"})
    return p.returncode


def selftest():
    """2026-08-18: this gate never had a self-test. Added with the booking-exemption +
    literal-black fix."""
    fp = "/Users/sulo/Documents/solen/components/BookingSlots.tsx"
    cases = [
        ("booking date/slot exception (camelCase) must pass",
         'const cls = selectedSlot === t ? "bg-s-accent text-white" : "bg-white";', 0),
        ("bg-black on a selected pill must block",
         'const cls = selected ? "bg-black text-white" : "bg-white";', 2),
        ("bg-[#0A0A0A] on a selected pill must block",
         'const cls = selected ? "bg-[#0A0A0A] text-white" : "bg-white";', 2),
        ("existing token-spelling case must still block",
         'const cls = selected ? "bg-s-ink text-white" : "bg-white";', 2),
    ]
    ok = 0
    for name, content, expect_rc in cases:
        rc = _drive(fp, content)
        good = rc == expect_rc
        ok += good
        print(f"  {'PASS' if good else 'FAIL'}  {name}  (exit={rc}, expected={expect_rc})")
    print(f"\n{ok}/{len(cases)} passed")
    return 0 if ok == len(cases) else 1


if "--selftest" in sys.argv:
    sys.exit(selftest())

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
    # 2026-08-18: added the literal-black spellings (bg-black, bg-[#0A0A0A], bg-[#000],
    # bg-[#000000]) , without these here, is_ink_fill()'s BLACK_TW check below could never fire
    # on a ternary at all, this capture group is the gate that decides what reaches it.
    r"[`\"']([^`\"']*?(?:bg-s-ink|bg-s-accent|border-s-accent|bg-black|bg-\[#0a0a0a\]|bg-\[#000000\]|bg-\[#000\])[^`\"']*?)[`\"']",
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
    r"|pending|error|invalid|danger|destructive|today|isToday)\b",
    re.IGNORECASE,
)

# LOCKED design-contract exception: booking date / slot / calendar / time selection stays BLUE
# (not gray) , never flag it. (2026-07-11: ported the global gate's date-blue carve-out.)
# 2026-08-18 fix: this used to live inline in NOT_SELECTION as `\bdate|slot|calendar|time\b`, a
# WHOLE-WORD match. MEASURED it missed the codebase's actual identifiers , `selectedSlot === t`
# never matched `\bslot\b` because "d" and "S" share no word boundary (camelCase), and
# `selected_slot` never matched either because `_` counts as a \w char so no boundary exists
# there. Three lookaround-based alternatives cover: a standalone/leading word or camelCase/
# snake_case LEADING segment (`slot`, `slotIndex`, `slot_index`), a capitalized camelCase
# CONTINUATION segment (`selectedSlot`, `activeDate` , case-sensitive on purpose so an unrelated
# lowercase-embedded "date" inside e.g. "Update" never matches), and a snake_case continuation
# (`selected_slot`).
_BOOK = r"(?:date|slot|calendar|time)"
_BOOK_CAP = r"(?:Date|Slot|Calendar|Time)"
BOOKING_LEADING = re.compile(r"\b" + _BOOK + r"(?=[A-Z_]|\b)", re.IGNORECASE)
BOOKING_SNAKE = re.compile(r"(?<=_)" + _BOOK + r"(?=[A-Z_]|\b)", re.IGNORECASE)
BOOKING_CAMEL = re.compile(r"(?<=[a-z])" + _BOOK_CAP + r"(?=[A-Z_]|\b)")  # case-sensitive


def is_booking_exempt(text):
    return bool(BOOKING_LEADING.search(text) or BOOKING_SNAKE.search(text) or BOOKING_CAMEL.search(text))


# 2026-08-18 fix: MEASURED `bg-black`, `bg-[#0A0A0A]`, `bg-[#000]`, `bg-[#000000]` all passed on a
# selected pill , only the `bg-s-ink` TOKEN spelling was caught, not the literal black spellings
# that paint the exact same banned ink fill.
BLACK_TW = re.compile(r"bg-black\b|bg-\[#0a0a0a\]|bg-\[#000000\]|bg-\[#000\]", re.IGNORECASE)

# The true branch must actually be a fill (bg-s-ink + white text), not e.g. `text-s-ink`
# or a border-only treatment.
def is_ink_fill(branch):
    b = branch.lower()
    ink = "bg-s-ink" in b and ("text-white" in b or "text-s-bg" in b)
    blue = "bg-s-accent" in b or "border-s-accent" in b  # blue-selected also banned (owner 2026-07-02)
    black_literal = bool(BLACK_TW.search(branch))
    return ink or blue or black_literal


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
        if NOT_SELECTION.search(cond) or is_booking_exempt(cond):
            continue
        if not SELECTION_COND.search(cond):
            continue
        out.append(m)
    # Const-based selected class (blue/ink off the ternary line). Same date/slot/commit exemption.
    for m in SEL_CONST.finditer(text):
        lo, hi = max(0, m.start() - 60), min(len(text), m.end() + 80)
        window = text[lo:hi]
        if NOT_SELECTION.search(window) or is_booking_exempt(window):
            continue
        out.append(m)
    return out


# ---- ported from the stranded claude/context-compact-architecture-5d1ace branch (commit
# 5904c18ec): a selection token co-occurring with a banned fill OUTSIDE a ternary (a helper
# function's return value, a multi-expression className) and a CSS selected-state rule in a
# mockup .html file. INK_TERNARY/SEL_CONST above never see either shape. ----

# 2026-08-18 fix: MEASURED literal-black spellings (`bg-black`, `bg-[#0A0A0A]`, an inline
# `style={{background:'#0A0A0A'}}`) all passed on a selected element , only the `bg-s-ink` token
# was in FILL. The bracket alternatives use a lookahead for the closing `]` instead of consuming
# it literally, because the caller appends a mandatory `\b` right after this group (see
# SEL_NONTERNARY below) and `\b` cannot fire right after a `]` when the char after THAT is also
# non-word (a quote) , ending the match on the hex digit keeps the boundary check meaningful.
FILL = (
    r"bg-s-ink|border-s-ink|bg-s-accent|border-s-accent"
    r"|bg-black|bg-\[#0a0a0a(?=\])|bg-\[#000000(?=\])|bg-\[#000(?=\])"
    r"|background(?:Color)?\s*[:=]\s*['\"]?\s*(?:#0a0a0a\b|#000000\b|#000\b|black\b)"
)
# (?!:) on the bare `active`/`checked` tokens: Tailwind's `active:`/`checked:` pseudo-class
# variant prefix (e.g. `active:scale-[0.98]` on an ordinary button) is not a selection-state
# signal and must not co-occurrence-match a nearby bg-s-ink/bg-s-accent CTA fill (false
# positive found spot-checking this port against app/[locale]/queue/[token]/page.tsx).
SEL_TOKEN = r"isSelected|isActive|aria-pressed|\bselected\b|\bactive\b(?!:)|\bpicked\b|isPicked|isOn|\bchecked\b(?!:)|isChecked|\bcurrent\b"

# A selection token co-occurring with a banned fill within ~80 chars, EITHER order , not
# confined to a ternary, so a helper function or a multi-expression className is also caught.
SEL_NONTERNARY = re.compile(
    r"(" + SEL_TOKEN + r")[^\n;{}]{0,80}(" + FILL + r")\b"
    r"|(" + FILL + r")\b[^\n;{}]{0,80}(" + SEL_TOKEN + r")",
    re.IGNORECASE,
)

# CSS (mockup .html scope): a `.selected`/`.active`/`[aria-selected]` rule whose body paints a
# black/ink OR blue/accent background.
SEL_CSS = re.compile(
    r"(\.(on|selected|active|sel|is-active|is-selected)\b|\[aria-selected|\[data-[a-z-]*active)"
    r"[^{}:]{0,40}\{[^{}]{0,200}background[^;{}]{0,40}:(?:[^;{}]{0,30})"
    r"(var\(--ink\)|var\(--accent\)|#0a0a0a\b|#000000\b|#000\b|\bblack\b|#276ef1\b|#1e54b7\b)",
    re.IGNORECASE,
)

# Window exclusion for the non-ternary/CSS checks: commit-button context. The booking date/slot/
# calendar/time exception moved to is_booking_exempt() (2026-08-18, same camelCase/snake_case fix
# as NOT_SELECTION above , this list had the identical `\bdate\b|\bslot\b|...` whole-word bug).
WINDOW_EXCLUDE = re.compile(
    r"\bcommit\b|\bsubmit\b|\bpay\b|\bpayment\b|\bbezahlen\b|\bbuchen\b|\bcheckout\b|\bconfirm\b|"
    r"\bprimary\b|\bcta\b|\bweiter\b|\bcontinue\b|\bnext-step\b|\bplace.?order\b|\.submit\b|"
    r"\bbutton\b|\bbtn\b|role=[\"']button[\"']",
    re.IGNORECASE,
)


def window_offenders(text):
    out = []
    for rx in (SEL_NONTERNARY, SEL_CSS):
        for m in rx.finditer(text):
            lo = max(0, m.start() - 80)
            hi = min(len(text), m.end() + 80)
            window = text[lo:hi]
            if WINDOW_EXCLUDE.search(window) or is_booking_exempt(window):
                continue
            out.append(m)
    return out


# net-new only: if the replaced/old text already had the same class of violation,
# an unrelated edit to that region must not block.
if offenders(old) or window_offenders(old):
    allow()

hits = [m for m in offenders(new) if not line_has_ok(new, m.start())]
nonternary_hits = [m for m in window_offenders(new) if not line_has_ok(new, m.start())]
if not hits and not nonternary_hits:
    allow()

if hits:
    m = hits[0]
    found = m.group(0).strip()[:120]
else:
    m = nonternary_hits[0]
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
