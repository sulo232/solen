#!/usr/bin/env python3
"""SHELVED-NOTE 2026-08-24 (record only, logic below untouched, nothing armed/disarmed here):
owner instruction, his words: "stand down the ones that fire rarely, fix the ones that fire a
lot." Measured across his 49 sessions: 0 real firings. KNOWN DEFECT, verified 2026-08-24: this
gate's own test suite fails even when run from the project directory it expects, i.e. the
directory the probe rule says to check first. Wiring/arming stays the owner's call; see
~/.claude/hooks/SHELVED.txt.

mockup-diagnosis-gate.py , no mockup without a measured, LOCKFILE-cited diagnosis (attacks the ROOT).

WHY (root-cause of 5 rejected rounds, subagent analysis 2026-07-19): the assistant INVENTS the proposed change
instead of DERIVING it from a measured diff between the real rendered page and the locked law. Every round
skipped the diagnosis step and jumped to "here's a direction" , producing fabricated changes, no-ops (the
section was already a card), or re-violations of settled law. The existing gates check the mockup's COPY, not
whether a cited real defect motivates the mockup at all.

WHAT (PreToolUse on Write of public/_mockups/**/*.html , a treatment/improvement mockup): require a `Diagnosis:`
manifest, >=1 line of the form:
    Diagnosis: <what> | measured <current-value> | violates <LOCKFILE/RATIONALE ref> | target <target-value>
BLOCK when: no Diagnosis line, OR a line missing measured/violates/target, OR a NO-OP line where the measured
current value equals the target (current == target = nothing to fix, this is the R4 failure).

Exempt: the gallery / link-index (a MOCKS list). Override: echo "<reason>" > .claude/diagnosis-skip.flag (15-min TTL).
"""
import json
import os
import re
import sys as _sys

_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from _nonsolen_surface import is_non_solen_surface
except Exception:  # helper missing or broken: fail CLOSED, keep gating as before
    def is_non_solen_surface(content, project_root):
        return False, "helper unavailable"
import sys
import time


def main():
    try:
        p = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if (p.get("tool_name") or "") not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)
    ti = p.get("tool_input") or {}
    path = (ti.get("file_path") or "").replace("\\", "/")
    if "public/_mockups/" not in path or not path.lower().endswith((".html", ".htm")):
        sys.exit(0)
    content = ti.get("content") or ""
    if not content.strip():   # Edit fragments: create-time Write owns this check
        sys.exit(0)
    # index pages exempt
    if re.search(r"\bMOCKS\s*=", content) or content.count("/_mockups/") >= 3:
        sys.exit(0)

    project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    # LOCKFILE governs Solen product surfaces. A mockup for a surface outside
    # this repo has no LOCKFILE row to diff against, so demanding one asks for a
    # citation that cannot exist. Exempt it ONLY when the mockup cites real files
    # that exist outside the repo. See _nonsolen_surface.py for why this is a
    # falsifiable claim rather than another skip flag.
    if is_non_solen_surface(content, project)[0]:
        _sys.exit(0)

    flag = os.path.join(project, ".claude", "diagnosis-skip.flag")
    if os.path.isfile(flag):
        try:
            reason = open(flag).readline().strip()
        except Exception:
            reason = ""
        if (time.time() - os.path.getmtime(flag)) < 900 and reason:
            sys.exit(0)

    lines = re.findall(r"Diagnosis:\s*(.+)", content)
    problems = []
    if not lines:
        problems.append(
            "NO `Diagnosis:` MANIFEST. A mockup must be DERIVED from a measured defect, not invented. Add >=1 line:\n"
            "    Diagnosis: <what> | measured <current value> | violates <LOCKFILE/RATIONALE line/section> | target <value>\n"
            "  Measure the REAL rendered page (getBoundingClientRect / getComputedStyle) and cite the exact law it breaks."
        )
    else:
        for d in lines:
            dl = d.lower()
            if not ("measured" in dl and "violates" in dl and "target" in dl):
                problems.append("INCOMPLETE Diagnosis line (need measured + violates + target): %r" % d[:110].strip())
            # v2, 2026-08-05, fix-up-me sweep. The three WORDS were the whole test, so a line could
            # name a class ("rounded-3xl") as its measurement and a section number as its citation
            # without either being a measured value. A diagnosis is a NUMBER against a LOCKED
            # NUMBER: require a digit on the measured side and a digit on the target side, which is
            # what distinguishes a measurement from a description of one.
            # A digit alone is not a measurement: "rounded-3xl" and "rounded-24" both contain one,
            # which is how the original beating line got through my first patch. Require a real
            # VALUE, meaning a number that is not glued into a class name: either carrying a unit,
            # or standing on its own.
            elif not (re.search(r"measured[^|]*(?<![\w-])\d+(?:\.\d+)?\s*(?:px|pt|%|rem|em|ms|s|x)?(?![\w-])", d, re.I)
                      and re.search(r"target[^|]*(?<![\w-])\d+(?:\.\d+)?\s*(?:px|pt|%|rem|em|ms|s|x)?(?![\w-])", d, re.I)):
                problems.append(
                    "UNMEASURED Diagnosis line (measured and target must each carry a NUMBER, "
                    "not a class name or a description): %r" % d[:110].strip())
                continue
            # no-op check: measured value == target value
            m = re.search(r"measured\s+(.+?)\s*\|\s*violates\s+.+?\|\s*target\s+(.+)$", d, re.I)
            if m:
                def _norm(s):
                    s = s.split("-->")[0]  # drop an HTML comment close if the line sits in a comment
                    return re.sub(r"[^a-z0-9]+", "", s.lower())
                cur = _norm(m.group(1))
                tgt = _norm(m.group(2))
                if cur and cur == tgt:
                    problems.append(
                        "NO-OP Diagnosis line (measured == target, nothing to fix): %r\n"
                        "  If current already equals target, this mockup changes nothing (the R4 failure). Drop it "
                        "or find the real defect." % d[:110].strip()
                    )

    if problems:
        sys.stderr.write(
            "MOCKUP-DIAGNOSIS GATE (root-cause of 5 rejected rounds, 2026-07-19): you are about to build a mockup\n"
            "that is NOT derived from a measured, cited defect , the exact thing that got rejected 5x.\n\n"
            + "\n\n".join("  " + x for x in problems)
            + "\n\nDERIVE the change from a measured diff (real page value vs the LOCKFILE lock), never invent it.\n"
            "Often the honest finding is that this is a CODE DRIFT fix (sweep the component to the lock), not a mockup.\n"
            "Override: echo \"<reason>\" > .claude/diagnosis-skip.flag (15-min TTL)\n"
        )
        sys.exit(2)
    sys.exit(0)


def selftest():
    import subprocess

    def check(content):
        payload = {"tool_name": "Write", "tool_input": {"file_path": "public/_mockups/x/index.html", "content": content}}
        return subprocess.run([sys.executable, os.path.abspath(__file__)], input=json.dumps(payload), capture_output=True, text=True).returncode

    none = "<iframe>no diagnosis here</iframe>"
    good = "<iframe></iframe><!-- Diagnosis: team card | measured rounded-3xl+shadow-float | violates LOCKFILE:427 | target rounded-24+border+shadow-whisper -->"
    noop = "<iframe></iframe><!-- Diagnosis: team card | measured rounded-24 | violates LOCKFILE:427 | target rounded-24 -->"
    idx = "<script>var MOCKS=[{a:1}]</script>"
    r1, r2, r3, r4 = check(none), check(good), check(noop), check(idx)
    print(f"no diagnosis      : {'BLOCK' if r1 == 2 else 'MISS(' + str(r1) + ')'}")
    print(f"cited diagnosis   : {'PASS' if r2 == 0 else 'FALSE-BLOCK(' + str(r2) + ')'}")
    print(f"no-op (cur==tgt)  : {'BLOCK' if r3 == 2 else 'MISS(' + str(r3) + ')'}")
    print(f"gallery index     : {'PASS(exempt)' if r4 == 0 else 'FALSE-BLOCK(' + str(r4) + ')'}")
    ok = r1 == 2 and r2 == 0 and r3 == 2 and r4 == 0
    print("SELFTEST", "OK" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    main()
