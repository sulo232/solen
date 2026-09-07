#!/usr/bin/env python3
"""
color-tokens-01 (2026-07-27): a retired-token-sync check.

check.py's RETIRED_TOKENS set is the only mechanical thing standing between
"_design-system/LOCKFILE.md says this token is dead" and a new PR quietly
reusing it. The two lists had drifted silently for months: LOCKFILE named
`s-amber` retired while RETIRED_TOKENS listed three fictional names
(`s-atm-warm/cool/base`) that never existed in tailwind.config.js, so the
drift-checker enforced nothing for either. This script makes that drift
impossible to ship unnoticed again: it parses LOCKFILE.md's RETIRED section
bullet-by-bullet for every concrete `s-*` token name each bullet actually
claims is retired, and fails, naming the exact token, if that name has no
exact match in check.py's RETIRED_TOKENS set.

Direction: LOCKFILE -> check.py only. A token check.py retires ahead of a
LOCKFILE update (a same-day fix landing in code before the doc) is not
flagged; the reverse (LOCKFILE claims retired, enforcement silent) is
exactly the failure mode this exists to catch.

Parsing rules (deliberately narrow, not a general markdown/prose parser):
  - A bullet wrapped in ~~strikethrough~~ (or whose retirement claim is
    struck through) documents something that is NOT actually retired
    (un-retired, or a corrected-stale claim) -- its tokens are informational,
    not a live claim, and are skipped entirely.
  - Only the text BEFORE the bullet's first em-dash ("...") is the
    retirement claim itself; text after it is free-form explanation that
    routinely names OTHER, live tokens as migration targets ("use `s-warning`
    instead"), which must not be mistaken for a second retirement claim.
  - A wildcard family bullet ("`s-atm-*` family (cream / terra / ...)")
    expands to one concrete token per parenthesized member. A trailing
    ", and their `-text` variants" clause (appears on the `s-cat-*` bullet)
    additionally expands each member to a second `-text`-suffixed token.

Run from project root:
    python3 .agents/skills/solen-drift-check/scripts/check-retired-sync.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
LOCKFILE = ROOT / "_design-system" / "LOCKFILE.md"
CHECK_PY = ROOT / ".agents" / "skills" / "solen-drift-check" / "scripts" / "check.py"

TOKEN_RE = re.compile(r"^s-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$")
BACKTICK_TOKEN_RE = re.compile(r"`(s-[a-zA-Z0-9-]+)`")
WILDCARD_FAMILY_RE = re.compile(r"`s-([a-zA-Z0-9]+)-\*`\s*family\s*\(([^)]*)\)")
STRIKETHROUGH_RE = re.compile(r"~~(.*?)~~", re.DOTALL)
EM_DASH = "—"


def extract_retired_section(text: str) -> str:
    marker = "### RETIRED — never use in new code"
    start = text.find(marker)
    if start == -1:
        raise SystemExit(f"[retired-token-sync] could not find '{marker}' in {LOCKFILE}")
    rest = text[start + len(marker):]
    next_heading = re.search(r"\n### ", rest)
    return rest[: next_heading.start()] if next_heading else rest


def bullets(section: str) -> list[str]:
    lines = [ln for ln in section.split("\n") if ln.strip().startswith("- ")]
    return lines


def wildcard_family_tokens(head: str, full_bullet: str) -> set[str]:
    tokens: set[str] = set()
    m = WILDCARD_FAMILY_RE.search(head)
    if not m:
        return tokens
    prefix, members_raw = m.group(1), m.group(2)
    has_text_variant = "-text` variant" in full_bullet or "-text variant" in full_bullet
    for member in re.split(r"[/,]", members_raw):
        member = member.strip().strip("`")
        if not member or not re.match(r"^[a-zA-Z0-9]+$", member):
            continue
        tokens.add(f"s-{prefix}-{member}")
        if has_text_variant:
            tokens.add(f"s-{prefix}-{member}-text")
    return tokens


def plain_backtick_tokens(head: str) -> set[str]:
    tokens: set[str] = set()
    # Remove the wildcard-family match from head first so its `s-atm-*` fragment
    # (which would otherwise partially match as "s-atm-") never gets collected.
    head_without_wildcard = WILDCARD_FAMILY_RE.sub("", head)
    for m in BACKTICK_TOKEN_RE.finditer(head_without_wildcard):
        tok = m.group(1)
        if TOKEN_RE.match(tok):
            tokens.add(tok)
    return tokens


def lockfile_retired_tokens(section: str) -> set[str]:
    tokens: set[str] = set()
    for bullet in bullets(section):
        # A fully (or partially) struck-through bullet documents a NON-retirement;
        # drop the struck-through span before doing anything else.
        live_bullet = STRIKETHROUGH_RE.sub("", bullet)
        if not live_bullet.strip("- ").strip():
            continue
        head = live_bullet.split(EM_DASH, 1)[0]
        tokens |= wildcard_family_tokens(head, live_bullet)
        tokens |= plain_backtick_tokens(head)
    return tokens


def check_py_retired_tokens(text: str) -> set[str]:
    m = re.search(r"RETIRED_TOKENS\s*=\s*\{(.*?)\n\}", text, re.DOTALL)
    if not m:
        raise SystemExit(f"[retired-token-sync] could not find RETIRED_TOKENS = {{...}} in {CHECK_PY}")
    body = m.group(1)
    return set(re.findall(r'"(s-[a-zA-Z0-9-]+)"', body))


def main() -> int:
    lockfile_text = LOCKFILE.read_text(encoding="utf-8")
    check_py_text = CHECK_PY.read_text(encoding="utf-8")

    section = extract_retired_section(lockfile_text)
    lockfile_tokens = lockfile_retired_tokens(section)
    check_py_tokens = check_py_retired_tokens(check_py_text)

    missing = sorted(lockfile_tokens - check_py_tokens)

    if missing:
        print("\n[FAIL] LOCKFILE.md names token(s) RETIRED that check.py's RETIRED_TOKENS does not enforce:\n")
        for tok in missing:
            print(f"  {tok}")
        print(
            f"\nAdd the exact name(s) above to RETIRED_TOKENS in {CHECK_PY.relative_to(ROOT)}, "
            "or if the LOCKFILE bullet is stale (the token is actually live now), fix the LOCKFILE "
            "bullet instead of adding a live token to the retired set.",
        )
        return 1

    print(f"check-retired-sync: OK ({len(lockfile_tokens)} LOCKFILE-retired token(s), all present in RETIRED_TOKENS)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
