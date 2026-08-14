#!/usr/bin/env python3
"""
taste-r3-rules-pointer.py  (UserPromptSubmit)

Owner 2026-07-22 (verbatim): "add in taste and design rules ... make gates so it forces em to read
that part so it acc makes that ... while building."

On any UI / design / mockup prompt, inject a pointer to the Round-3 taste rules so the build
actually applies them (imagery-as-zone, chunk ceiling, container selector, empty-state anatomy,
accessibility domain) and grounds in the real components instead of redrawing from scratch.

UserPromptSubmit hook: stdout (exit 0) is added to the model's context.
Self-test: pipe {"prompt":"redesign the salon card"} on stdin -> prints the pointer; a non-UI
prompt prints nothing.
"""
import json, sys, re

UI = re.compile(
    r"mockup|redesign|\bui\b|\bux\b|component|\bpage\b|screen|layout|salon\s*card|\bpdp\b|homepage|"
    r"\bhero\b|search results|booking|empty[ -]?state|hierarchy|spacing|typograph|richness|imagery|"
    r"before[ /]?after|taste|design",
    re.I,
)

POINTER = (
    "TASTE ROUND-3 RULES (owner 2026-07-22, enforce during builds): before building or changing any "
    "UI/mockup, READ the Round-3 taste rules in _design-system/RATIONALE.md (section "
    "'# ROUND 3 (2026-07-22)', around line 854) and apply them. Key ones: imagery is a ZONE by task "
    "(hero/PDP ~35-45% of first viewport, browse cards ~1/3, checkout/booking-step ~0%); 4-7 grouped "
    "chunks above the fold; the list vs grid vs carousel vs bento selector (same-kind sets = list, "
    "never bento); page-rhythm hero-height bands; the four-part empty-state anatomy; and the "
    "accessibility domain in SOURCE.md section 23. Ground every surface in the REAL components "
    "(real photos, real structure), never a from-scratch redraw. Full tension list: "
    "_design-system/QUESTIONS.md 'Round-3 tensions'."
)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    prompt = data.get("prompt") or data.get("user_prompt") or data.get("message") or ""
    if not isinstance(prompt, str) or not prompt.strip():
        sys.exit(0)
    if UI.search(prompt):
        sys.stdout.write(POINTER + "\n")
    sys.exit(0)


if __name__ == "__main__":
    main()
