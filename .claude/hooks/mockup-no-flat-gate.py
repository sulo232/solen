#!/usr/bin/env python3
"""mockup-no-flat-gate.py , block mockups that re-propose the DITCHED flat / borderless direction.

WHY (owner 2026-07-18 revert + 2026-07-19 repeat, furious): the "borderless / flat / chrome-off" direction
(Model B) was REVERTED , the CARDED salon-page tier-card 'service selection' style WON (REMOVED.md:85). The
owner: "i do not want this flat sh, we lit ditched the whole thing w the service selection and i want more of
the principle of it there." Yet a mockup was built proposing to FLATTEN the salon PDP sections , re-proposing
the exact ditched direction. Advice ("remember borderless is dead") kept getting forgotten under task focus, so
it becomes a gate.

WHAT: PreToolUse on Write of public/_mockups/**/*.html , if the mockup's CHANGE proposes flat / borderless /
chrome-off / flatten-sections / shadows-off, BLOCK. The winning direction is MORE cards (the service-selection
tier-card principle), not fewer.

Override (a genuine, owner-approved exception): echo "<reason>" > .claude/no-flat-skip.flag (15-min TTL).
"""
import json
import os
import re
import sys
import time

# Phrases that mean "propose the ditched flat/borderless direction" (as the CHANGE, not incidental).
FLAT = re.compile(
    r"\b("
    r"flatten|flat section|flat rhythm|flat sections|section rhythm \(flat\)|"
    r"borderless|chrome[ -]?off|take the box off|"
    r"remove the card|remove card chrome|drop the card|de-?card|"
    r"shadows? off|no shadow|box-shadow ?: ?none|remove the shadow|strip the shadow|"
    r"un-?card"
    r")\b",
    re.IGNORECASE,
)


def find_flat(text: str):
    m = FLAT.search(text or "")
    return m.group(0) if m else None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if (payload.get("tool_name") or "") not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)
    ti = payload.get("tool_input") or {}
    path = (ti.get("file_path") or "").replace("\\", "/")
    if "public/_mockups/" not in path or not path.lower().endswith((".html", ".htm")):
        sys.exit(0)
    content = ti.get("content") or ti.get("new_string") or ""
    if not content.strip():
        edits = ti.get("edits") or []
        content = "\n".join(e.get("new_string", "") for e in edits)
    if not content.strip():
        sys.exit(0)

    project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    flag = os.path.join(project, ".claude", "no-flat-skip.flag")
    if os.path.isfile(flag):
        try:
            reason = open(flag).readline().strip()
        except Exception:
            reason = ""
        if (time.time() - os.path.getmtime(flag)) < 900 and reason:
            sys.exit(0)

    hit = find_flat(content)
    if hit:
        sys.stderr.write(
            "MOCKUP-NO-FLAT GATE (owner 2026-07-18 revert + 2026-07-19, furious): this mockup re-proposes the\n"
            f"  DITCHED flat / borderless direction , matched: {hit!r}.\n"
            "  The borderless 'chrome off' Model B was REVERTED; the CARDED salon-page tier-card 'service\n"
            "  selection' style WON (REMOVED.md:85). Owner: 'i do not want this flat sh ... i want more of the\n"
            "  principle of it [the carded service selection] there.' Propose MORE cards / the tier-card\n"
            "  treatment, never flattening sections or removing card chrome.\n"
            "  Override (genuine owner-approved exception): echo \"<reason>\" > .claude/no-flat-skip.flag\n"
        )
        sys.exit(2)
    sys.exit(0)


def selftest():
    bad = "<!-- change --> var CHANGE_LABEL='After: flat section rhythm'; // flatten the Team wrapper, shadows off"
    bad2 = "the borderless treatment removes the card chrome"
    good = "var CHANGE_LABEL='After: discount as a green pill'; // recolor the badge, keep the card"
    r1 = find_flat(bad)
    r2 = find_flat(bad2)
    r3 = find_flat(good)
    ok = bool(r1) and bool(r2) and (r3 is None)
    print(f"flat-section proposal : {'BLOCK' if r1 else 'MISS'} ({r1})")
    print(f"borderless proposal   : {'BLOCK' if r2 else 'MISS'} ({r2})")
    print(f"carded change (keep)  : {'PASS' if r3 is None else 'FALSE-BLOCK(' + str(r3) + ')'}")
    print("SELFTEST", "OK" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    main()
