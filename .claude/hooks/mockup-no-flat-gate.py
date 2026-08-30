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


def find_flat_all(text: str):
    return [m.group(0) for m in FLAT.finditer(text or "")]


def should_block(payload):
    """Returns the matched offender text if this tool call should be blocked, else None.
    Pure over the parsed payload (no stdin, no flag file) so --selftest can drive it directly."""
    if (payload.get("tool_name") or "") not in ("Write", "Edit", "MultiEdit"):
        return None
    ti = payload.get("tool_input") or {}
    path = (ti.get("file_path") or "").replace("\\", "/")
    if "public/_mockups/" not in path or not path.lower().endswith((".html", ".htm")):
        return None
    content = ti.get("content") or ti.get("new_string") or ""
    if not content.strip():
        edits = ti.get("edits") or []
        content = "\n".join(e.get("new_string", "") for e in edits)
    if not content.strip():
        return None

    hit = find_flat(content)
    if not hit:
        return None

    # 2026-08-21: this gate read only the replacement text, so a reword that left an
    # unrelated pre-existing "flat section"-style phrase untouched elsewhere on the same
    # line was refused as if the phrase had just been typed. If every match found here is
    # byte-identical in the text being replaced, this edit did not add it, and refusing
    # does not remove it, it only blocks the unrelated work passing through.
    try:
        sys.path.insert(0, os.path.expanduser("~/.claude/hooks/_lib"))
        from unchanged_by_this_edit import any_already_present
        if any_already_present(payload, find_flat_all(content)):
            return None
    except Exception:
        pass  # fail closed: if the helper is missing, keep refusing

    return hit


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
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

    hit = should_block(payload)
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

    # 2026-08-21: old_string-blind cases, worked example is no-focus-ring-gate.py. should_block()
    # is the function that must know old vs new; go through it, not find_flat() alone.
    def edit(path, old, new):
        return {"tool_name": "Edit", "tool_input": {
            "file_path": path, "old_string": old, "new_string": new}}

    MOCK = "public/_mockups/salon-pdp/change.html"
    # reproduce case: the actual bug hit today. A pre-existing, untouched "flat section" phrase
    # sits in the same string as an unrelated price edit and must NOT block.
    reproduce = should_block(edit(MOCK,
        "<!-- keep the flat section proof-of-concept comment untouched --><p>Price: CHF 45</p>",
        "<!-- keep the flat section proof-of-concept comment untouched --><p>Price: CHF 50</p>"))
    # narrowness 1: a genuine ADDITION of the phrase must still block.
    add = should_block(edit(MOCK,
        "<p>Price: CHF 45</p>",
        "<!-- After: flatten the Team wrapper --><p>Price: CHF 45</p>"))
    # narrowness 2: a genuine CHANGE of the phrase itself (rhythm -> section) must still block.
    change = should_block(edit(MOCK,
        "<!-- keep the flat rhythm proof-of-concept comment untouched --><p>Price: CHF 45</p>",
        "<!-- keep the flat section proof-of-concept comment untouched --><p>Price: CHF 50</p>"))
    # narrowness 3: a whole-file Write carrying the phrase is never forgiven, Write has no old side.
    write_hit = should_block({"tool_name": "Write", "tool_input": {
        "file_path": "public/_mockups/salon-pdp/whole.html",
        "content": "<!-- keep the flat section note untouched --><p>Price: CHF 45</p>"}})

    r4 = reproduce is None
    r5 = bool(add)
    r6 = bool(change)
    r7 = bool(write_hit)
    print(f"reword, phrase untouched (allow) : {'PASS' if r4 else 'FALSE-BLOCK(' + str(reproduce) + ')'}")
    print(f"genuine addition (block)         : {'BLOCK' if r5 else 'MISS'} ({add})")
    print(f"genuine change of phrase (block) : {'BLOCK' if r6 else 'MISS'} ({change})")
    print(f"Write, phrase present (block)    : {'BLOCK' if r7 else 'MISS'} ({write_hit})")

    ok = ok and r4 and r5 and r6 and r7
    print("SELFTEST", "OK" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    main()
