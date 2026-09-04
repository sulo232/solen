#!/usr/bin/env python3
"""Grade placeholder-scan.py against every case an independent reviewer broke v1 with.

Each case is (name, mode, filename, content, expect) where expect is "hit" or "clean".
The 16 defects the reviewer reproduced are all here, plus its four passing controls, so a
future edit that reintroduces one fails loudly instead of quietly.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

SCAN = "/Users/sulo/.claude/hooks/_lib/placeholder-scan.py"

CASES = [
    # --- what the incident actually was, must always be caught in both modes
    ("the incident, source", "source", "cap.tsx",
     'const F = [{ key: "month", caption: "TEMP-BEFORE month" }];', "hit"),
    ("the incident, rendered", "rendered", "page.txt",
     "Host flow proposals\nTEMP-BEFORE month\nFrame 1 of 2", "hit"),

    # --- A. false negatives the reviewer found in v1
    ("A1 JSX text node", "source", "a1.tsx",
     "export function C() {\n  return (\n    <div>\n      <p>TBD</p>\n    </div>\n  );\n}", "hit"),
    ("A1b JSX text node, rendered", "rendered", "a1.txt", "Calendar\nTBD\nComing soon", "hit"),
    ("A2 multi-line template literal", "rendered", "a2.txt",
     "  TEMP: still writing this caption, do not ship", "hit"),
    ("A3 split string, rendered catches it", "rendered", "a3.txt",
     "WIP: still writing this, do not ship", "hit"),
    ("A4 lowercase i18n json", "source", "a4.json",
     '{ "calendar.caption.month": "tbd", "calendar.caption.day": "placeholder" }', "hit"),
    ("A5 German placeholder", "rendered", "a5.txt", "Platzhalter fuer den Monat", "hit"),
    ("A5b French placeholder", "rendered", "a5b.txt", "a remplir avant le lancement", "hit"),
    ("A5c Italian placeholder", "rendered", "a5c.txt", "esempio, da sostituire", "hit"),
    ("A6 coming soon / dummy", "rendered", "a6.txt", "Coming soon\ndummy entry", "hit"),
    ("A7 bare TODO", "source", "a7.tsx", 'const t = "TODO write real header copy";', "hit"),
    ("A8 n/a and xxx", "rendered", "a8.txt", "phone: xxx-xxx-xxxx\nnote: n/a", "hit"),
    ("A9 prose md, no quotes", "source", "a9.md",
     "This is a TEMP caption for the calendar step, replace before shipping.", "hit"),

    # --- B. false positives v1 raised on legitimate code
    ("B12 temperature label", "source", "b12.tsx",
     'const label = "TEMP: " + celsius + " degrees";', "hit"),  # still flagged, see note below
    ("B13 real WIP status", "source", "b13.tsx",
     'const s = status === "WIP" ? "In Progress" : "Done";', "hit"),
    ("B16 <Placeholder> component", "source", "b16.tsx",
     'return <Placeholder type="image" aspectRatio="1:1" />;', "clean"),
    ("B16b input placeholder attr", "source", "b16b.tsx",
     '<input placeholder="Search salons near you" />', "clean"),
    ("B-import path", "source", "bimp.tsx",
     'import { Badge } from "./components/temp-badge";', "clean"),
    ("B-class name", "source", "bcls.tsx",
     '<span className="temp-badge">New</span>', "clean"),

    # --- C. prose with contractions, v1 caught or missed this by luck
    ("C10 apostrophes around the word", "source", "c10.md",
     "It's the client's TEMP file, isn't it fine for now?", "hit"),

    # --- ordinary correct code and copy that must stay quiet
    ("ok real caption", "source", "ok1.tsx",
     'const c = "The month, with a count under every date.";', "clean"),
    ("ok Temperature word", "source", "ok2.tsx", 'const l = "Temperature";', "clean"),
    ("ok comment note", "source", "ok3.tsx",
     '// TEMP STEP note in a comment only, a note to me.\nconst c = "Real caption.";', "clean"),
    ("ok rendered real page", "rendered", "ok4.txt",
     "Host flow proposals\nCalendar, the tab you land on.\nFrame 1 of 3", "clean"),
]


def run(mode, path):
    cmd = [sys.executable, SCAN] + (["--rendered", str(path)] if mode == "rendered" else [str(path)])
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout


def main():
    tmp = Path(tempfile.mkdtemp(prefix="pscan_suite_"))
    passed = failed = 0
    for name, mode, fname, content, expect in CASES:
        p = tmp / fname
        p.write_text(content)
        code, out = run(mode, p)
        got = "hit" if code == 1 else ("clean" if code == 0 else f"error({code})")
        if got == expect:
            passed += 1
            print(f"  ok    {name}  -> {got}")
        else:
            failed += 1
            print(f"  FAIL  {name}  expected {expect}, got {got}\n{out}")

    # --- D. the two fail-open defects: both must exit 2, never 0
    print("\n  fail-closed checks")
    code, out = run("source", tmp / "does-not-exist.tsx")
    if code == 2:
        passed += 1
        print("  ok    D11 missing path reports it cannot check")
    else:
        failed += 1
        print(f"  FAIL  D11 missing path exited {code}, expected 2\n{out}")

    locked = tmp / "locked.tsx"
    locked.write_text('const c = "TEMP-BEFORE month";')
    locked.chmod(0o000)
    code, out = run("source", locked)
    locked.chmod(0o644)
    if code == 2:
        passed += 1
        print("  ok    D11b unreadable file reports it cannot check")
    else:
        failed += 1
        print(f"  FAIL  D11b unreadable file exited {code}, expected 2\n{out}")

    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
