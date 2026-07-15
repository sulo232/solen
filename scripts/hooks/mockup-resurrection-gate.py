#!/usr/bin/env python3
"""mockup-resurrection-gate.py : blocks owner-REJECTED treatments from re-entering mockups.

Born 2026-07-15 (owner: "you keep reading from the source code and you just keep
making it in over and over again... you need to harden the gate or make a gate
for that"), after the dormant rose DiscountBadge (SalonCard.tsx V3-D85, never
renders live) was copied into the taste-lab mockup and rejected on sight.

Root cause this closes mechanically: SOURCE CODE IS NOT RENDER TRUTH. Dormant
branches carry treatments the owner already rejected; copying source into a
mockup resurrects them. The rejected-treatment signatures live in the data file
_design-system/REJECTED_TREATMENTS.json (extend THAT on every new rejection,
same turn, like REMOVED.md; this script never needs to change).

Scope: PreToolUse on Write|Edit|MultiEdit for any path containing /_mockups/.
Fail-open on any internal error (a gate bug must never brick editing).

Override (owner confirmed the treatment is wanted again):
  echo "<reason>" > .claude/rejected-treatment-skip.flag   (30-min TTL, needs a non-blank reason)

Wiring (.claude/settings.json, hooks.PreToolUse, matchers Edit + Write + MultiEdit):
  python3 $CLAUDE_PROJECT_DIR/scripts/hooks/mockup-resurrection-gate.py

Self-test:
  python3 scripts/hooks/mockup-resurrection-gate.py --selftest
"""
import json
import os
import re
import sys
import time

def project_dir() -> str:
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

def load_entries(pdir: str):
    path = os.path.join(pdir, "_design-system", "REJECTED_TREATMENTS.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f).get("entries", [])

def flag_ok(pdir: str) -> bool:
    flag = os.path.join(pdir, ".claude", "rejected-treatment-skip.flag")
    try:
        if not os.path.isfile(flag):
            return False
        age = time.time() - os.stat(flag).st_mtime
        with open(flag, encoding="utf-8") as f:
            reason = f.readline().strip()
        return age < 1800 and bool(reason)
    except OSError:
        return False

def check(content: str, file_path: str, entries) -> list:
    hits = []
    for e in entries:
        if any(x and x in file_path for x in e.get("exclude_paths", [])):
            continue
        try:
            if not all(re.search(p, content, re.I) for p in e.get("all_of", [])):
                continue
            any_of = e.get("any_of", [])
            if any_of and not any(re.search(p, content, re.I) for p in any_of):
                continue
        except re.error:
            continue
        hits.append(e)
    return hits

def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    tool_input = data.get("tool_input") or {}
    file_path = tool_input.get("file_path") or ""
    if "/_mockups/" not in file_path:
        return 0
    content = tool_input.get("content") or tool_input.get("new_string") or ""
    if not content:
        edits = tool_input.get("edits") or []
        content = "\n".join(e.get("new_string", "") for e in edits)
    if not content:
        return 0
    pdir = project_dir()
    if flag_ok(pdir):
        return 0
    try:
        entries = load_entries(pdir)
    except Exception:
        return 0  # fail-open: missing/broken data file never bricks editing
    hits = check(content, file_path, entries)
    if not hits:
        return 0
    lines = ["RESURRECTION GATE: this mockup edit re-introduces an owner-REJECTED treatment."]
    for e in hits:
        lines.append(f"  [{e['id']}] {e['why']}")
        lines.append(f"    record: {e.get('record','')}")
    lines.append("Source code containing a treatment is NOT proof it is current: dormant branches carry rejected taste.")
    lines.append("Ground mockups in what RENDERS on the live page, and check REJECTED_TREATMENTS.json + REMOVED.md + TASTE_LOG.md first.")
    lines.append('Owner re-approved it? echo "<reason>" > .claude/rejected-treatment-skip.flag (30-min TTL) and retry.')
    print("\n".join(lines), file=sys.stderr)
    return 2

def selftest() -> int:
    pdir = project_dir()
    entries = load_entries(pdir)
    bad = '<span class="badge" style="background:#FAD2DA">-15%</span>'
    good = '<div class="card"><h3>Atelier Marie</h3><span>4.8 (54)</span></div>'
    dark_lab = "background:#0B0B0D dark tray"
    r1 = check(bad, "public/_mockups/x/index.html", entries)
    r2 = check(good, "public/_mockups/x/index.html", entries)
    r3 = check(dark_lab, "public/_mockups/taste-lab/index.html", entries)   # excluded path
    r4 = check(dark_lab, "public/_mockups/new-dark/index.html", entries)    # must trip
    ok = bool(r1) and not r2 and not r3 and bool(r4)
    print(f"should-block badge: {'BLOCK' if r1 else 'MISS'} ({[e['id'] for e in r1]})")
    print(f"should-pass clean card: {'PASS' if not r2 else 'FALSE-POSITIVE'}")
    print(f"taste-lab dark (excluded): {'PASS' if not r3 else 'FALSE-POSITIVE'}")
    print(f"new dark mockup: {'BLOCK' if r4 else 'MISS'} ({[e['id'] for e in r4]})")
    print("SELFTEST", "OK" if ok else "FAILED")
    return 0 if ok else 1

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(main())
