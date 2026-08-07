#!/usr/bin/env python3
"""_park_marker.py : the ONE definition of what a parked decision looks like on disk.

Imported by BOTH `scripts/hooks/plan-park-gate.py` (which refuses a stop when a park was
announced and no such line exists) and `scripts/build-open-decisions.py` (which renders every
such line onto the standing page). One definition, two consumers, on purpose.

Why they must share it: if the gate accepted a shape the page did not render, the agent could
satisfy the gate with a line the owner never sees, and the whole point of decision 11 is that an
open decision cannot go invisible. Coupling them makes that failure unrepresentable.

THE CANONICAL LINE, and nothing else counts:

    - [ ] PARKED 2026-08-07 · Is the spaced en-dash legal in de/fr/it prose? · from: COPY_LAW 4.2

  * `PARKED` is a literal uppercase marker token, not the English word. Prose that happens to say
    "parked" does not qualify. That is deliberate: `_plans/ACTIVE.md` already carries lowercase
    "parked:" inside narrative table cells, and those are precisely the items that went 40 days
    unseen. A marker you have to type on purpose is the difference between a record and a mention.
  * The ISO date is required. It is what makes the standing page able to sort by age, which is the
    only column that has ever embarrassed anyone into answering.
  * The `·` separators are convention, not enforced. Only the marker and the date are.

HOW A DECISION LEAVES: the same line gains a resolution stamp.

    - [x] PARKED 2026-08-07 · Is the spaced en-dash legal? · ANSWERED 2026-08-09: yes, de only
    - [x] PARKED 2026-07-01 · Geolocation city detection · DROPPED 2026-08-09: no inventory data

A `- [x]` tick on its own does NOT retire it. A tick is a claim, and this estate has already
learned that a tick with no proof behind it is how a queue empties itself without the work
happening. Only ANSWERED or DROPPED, each with a date, takes a row off the page.
"""
from __future__ import annotations

import re

# A parked decision, open. `PARKED` is case-SENSITIVE on purpose (see the module docstring).
PARK_LINE_RE = re.compile(r"\bPARKED\s+(\d{4}-\d{2}-\d{2})\b")

# The resolution stamp that retires a row from the standing page.
RESOLVED_RE = re.compile(r"\b(ANSWERED|DROPPED)\s+(\d{4}-\d{2}-\d{2})\b")


def is_park_line(line: str) -> bool:
    """True when the line records a parked decision, whether or not it is resolved."""
    return bool(PARK_LINE_RE.search(line))


def is_open_park_line(line: str) -> bool:
    """True when the line records a parked decision that is still waiting on the owner."""
    return bool(PARK_LINE_RE.search(line)) and not RESOLVED_RE.search(line)


def park_date(line: str) -> str | None:
    m = PARK_LINE_RE.search(line)
    return m.group(1) if m else None


def question_text(line: str) -> str:
    """The human-readable question, with the checkbox, the marker and the date stripped off."""
    body = PARK_LINE_RE.sub("", line, count=1)
    body = re.sub(r"^\s*[-*+]\s*(\[[ xX]\]\s*)?", "", body)
    return body.strip(" ·|\t")