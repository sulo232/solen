#!/usr/bin/env python3
"""fabricated-value-gate.py : taste rule 1 (no fabricated data) as a GATE.

Born 2026-07-16, owner: "isnt ths maiking up fake sh a reccuring pattern". It was.
The recorded trail: "Frei in 15 Min" fake times (2026-06-05), hardcoded homepage
ratings/prices/addresses that contradicted the live DB for weeks (fixed 82c288691),
"42 Salons" category counts vs 20 real salons total (fixed df234a21d), fake
distances "200 m", a never-shown fabricated-discount list, isSaved: true hardcodes.
Rule 1 existed the whole time as ADVICE; advice gets outranked under task focus.
This gate moves the machine-checkable core of the class to runtime.

BLOCKS an Edit/Write/MultiEdit that introduces a NET-NEW hardcoded display-value
literal in a customer design surface (app/components/components-legacy *.tsx,
excluding app/[locale]/dev/ preview harnesses):

  F1  rating: 4.9 / rating={4.9}            (a literal star rating)
  F2  reviewCount: 12 (literal)             (an invented review count)
  F3  distance: "200 m" / "1.2 km"          (an invented distance)
  F4  availability/slot/frei key holding a quoted clock time ("Heute 16:00")
  F5  discount / discountPercent: 20 (literal)
  F6  priceFromCHF / price: 45 (literal)    (an invented price)
  F7  address: "Augustinergasse 22"         (a quoted street string with a digit)
  F8  isSaved: true / isSaved={true}        (an invented saved state)

Identifier-fed values (rating={real?.rating ?? null}, price: s.min_price) never
match: every check requires a NUMBER or QUOTED literal. The wiring pattern that
replaces a fabrication is app/[locale]/_components/homepage/salonCardData.ts
(server batch fetch, null-safe omission, never an invented fallback).

Net-new only: if the OLD text already exhibits the same class, an unrelated edit
to that region never blocks (drift-gate rule).

Escape hatches (a false positive must never trap you):
  - Per line:  `live-data-ok: <reason>` on or just above the offending line
  - This turn: touch .claude/fab-gate-skip.flag           # 30-minute TTL
  - Session:   export SOLEN_FAB_GATE=0

FAIL-OPEN: any internal error -> allow. Registered in .claude/settings.json under
hooks.PreToolUse Edit/Write/MultiEdit. Exit 2 + stderr = BLOCK.
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


CHECKS = [
    ("F1 rating literal", re.compile(
        r"\b(?:rating|averageRating|average_rating)\s*[:=]\s*\{?\s*[0-5]\.\d")),
    ("F2 reviewCount literal", re.compile(
        r"\breviewCount\s*[:=]\s*\{?\s*\d+")),
    ("F3 distance literal", re.compile(
        r"\bdistance\s*[:=]\s*\{?\s*[\"']\d+(?:[.,]\d+)?\s*k?m\b")),
    ("F4 quoted clock time in an availability field", re.compile(
        r"\b(?:availability\w*|nextSlot\w*|slotLabel|freeToday|frei\w*)\s*[:=][^,\n]{0,40}"
        r"[\"'](?:Heute|Morgen)?\s*\d{1,2}:\d{2}")),
    ("F5 discount literal", re.compile(
        r"\bdiscount(?:Percent)?\s*[:=]\s*\{?\s*\d+")),
    ("F6 price literal", re.compile(
        r"\bprice(?:FromCHF|From|CHF)?\s*[:=]\s*\{?\s*\d+")),
    ("F7 quoted street address", re.compile(
        r"\baddress\s*[:=]\s*\{?\s*[\"'][^\"']*\d[^\"']*[\"']")),
    ("F8 isSaved hardcoded true", re.compile(
        r"\bisSaved\s*[:=]\s*\{?\s*true\b")),
]


def line_has_ok(text, idx):
    start = text.rfind("\n", 0, idx) + 1
    end = text.find("\n", idx)
    if end == -1:
        end = len(text)
    cur = text[start:end]
    prev_start = text.rfind("\n", 0, start - 1) + 1 if start > 0 else 0
    prev = text[prev_start:start]
    return "live-data-ok:" in cur.lower() or "live-data-ok:" in prev.lower()


def violations(text):
    out = []
    for name, pat in CHECKS:
        for m in pat.finditer(text):
            if not line_has_ok(text, m.start()):
                out.append((name, m.group(0)[:60]))
    return out


def main():
    if os.environ.get("SOLEN_FAB_GATE", "1") == "0":
        allow()
    flag = os.path.join(PROJECT_DIR, ".claude", "fab-gate-skip.flag")
    try:
        if os.path.exists(flag) and (time.time() - os.path.getmtime(flag)) <= 1800:
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
    low = path.lower()
    if not re.search(r"(app/|components/|components-legacy/).*\.tsx?$", low):
        allow()
    if any(s in low for s in ("/dev/", "/_audits/", "/node_modules/", ".d.ts", ".test.", ".spec.")):
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

    new_v = violations(new)
    if not new_v:
        allow()
    old_classes = {name for name, _ in violations(old)}
    net_new = [(n, s) for n, s in new_v if n not in old_classes]
    if not net_new:
        allow()

    lines = "\n".join(f"  - {n}: `{s}`" for n, s in net_new[:6])
    block(
        "FABRICATED-VALUE GATE (taste rule 1; owner 2026-07-16: 'isnt ths maiking up fake sh a "
        "reccuring pattern'). This edit introduces a hardcoded display-value literal on a customer "
        f"surface:\n{lines}\n"
        "A fake value is worse than a gap: wire the REAL value (pattern: app/[locale]/_components/"
        "homepage/salonCardData.ts, server batch fetch + null-safe omission) or OMIT the element and "
        "flag it for wiring. If this literal is genuinely not display data, add `live-data-ok: "
        "<reason>` on or above the line. Turn escape: touch .claude/fab-gate-skip.flag (30 min).\n"
    )


def selftest():
    import subprocess
    import tempfile

    def run(tool, path, new, old=""):
        ti = {"file_path": path}
        if tool == "Edit":
            ti["new_string"], ti["old_string"] = new, old
        else:
            ti["content"] = new
        payload = json.dumps({"tool_name": tool, "tool_input": ti})
        env = {**os.environ, "CLAUDE_PROJECT_DIR": tempfile.mkdtemp(), "SOLEN_FAB_GATE": "1"}
        return subprocess.run([sys.executable, __file__], input=payload,
                              capture_output=True, text=True, env=env).returncode

    p = "/x/app/[locale]/_components/homepage/Foo.tsx"
    cases = [
        ("rating-literal", run("Edit", p, 'rows = [{ rating: 4.93, name: "X" }]'), 2),
        ("rating-jsx", run("Edit", p, "<SalonCard rating={4.9} />"), 2),
        ("distance", run("Edit", p, 'distance: "200 m",'), 2),
        ("clock-time", run("Edit", p, 'availabilityRow: "Heute 16:00",'), 2),
        ("discount", run("Edit", p, "discountPercent: 20,"), 2),
        ("price", run("Edit", p, "priceFromCHF: 80,"), 2),
        ("address", run("Edit", p, 'address: "Augustinergasse 22",'), 2),
        ("isSaved", run("Edit", p, "isSaved: true,"), 2),
        ("live-wired", run("Edit", p, "rating={real?.rating ?? null} priceFromCHF={real?.priceFromCHF ?? null}"), 0),
        ("identifier-fed", run("Edit", p, "price: s.min_price, address: row.address,"), 0),
        ("ok-marker", run("Edit", p, "// live-data-ok: test fixture for storybook\nrating: 4.9,"), 0),
        ("dev-route", run("Edit", "/x/app/[locale]/dev/harness/page.tsx", "rating: 4.9,"), 0),
        ("out-of-scope", run("Edit", "/x/scripts/seed.ts", "rating: 4.9,"), 0),
        ("pre-existing-class", run("Edit", p, "rating: 4.8, size: 12,", "rating: 4.9, size: 10,"), 0),
        ("write-new-file", run("Write", p, "const DEMO = [{ rating: 4.95 }]"), 2),
    ]
    bad = [(n, rc, want) for n, rc, want in cases if rc != want]
    for n, rc, want in cases:
        print(f"  {n}: {'OK' if rc == want else f'FAIL (got {rc}, want {want})'}")
    print("SELFTEST", "OK" if not bad else "FAILED")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
