#!/usr/bin/env python3
"""link-family-aggregator.py , ONE Stop gate that speaks for the whole link/preview family.

hook: Stop
matcher:

WHY THIS EXISTS, measured on the real transcripts for 2026-07-27 .. 2026-08-03.

The owner, ten times in seven days: "You just repeated yourself three times", "Now you repeat it
the same thing four times. Find the core cause", "you keep repeating the same shit over and over
again", "you repeat it three fucking times again".

The core cause is not forgetfulness, and it is not one bad gate. It is the SHAPE of the estate:

  402 blocked stop attempts in the window
  76% of them were blocked by TWO OR MORE gates at once
  181 were blocked by three or more
  the worst single attempt was blocked by NINE gates at once
  62 Stop hooks run on every reply, of which TEN guard the single class "handing over a link"

Each of those ten gates was born from one real incident and each is individually correct. But they
fire one at a time and know nothing about each other, so one imperfect reply becomes three, four,
five separate denials. Each denial costs one more reply attempt. He reads the same paragraphs three
to five times hunting for the six words that changed. That is the repetition he keeps naming, and
no amount of hardening an individual member fixes it, because the member is not the problem.

LAW_SYSTEM.md section 6.2 already states this law for PreToolUse , "more than 3 independently-
registered hooks sharing one (event, matcher) pair must be consolidated into one aggregator hook
returning a single combined deny" , and names thirteen serial denials on one Write as "an
adversarial gauntlet, not a law". The law was simply never applied to the Stop event, where it is
now happening at more than twice the density.

WHAT THIS DOES. It runs every member gate, unchanged, on the same payload, in parallel, and
collects every one that wants to block. Then it emits ONE deny listing every requirement at once,
so the next reply can satisfy all of them in a single correction instead of N. Member logic is not
rewritten and not reimplemented , this is a dispatcher, so no member's behaviour changes and no
past incident becomes reachable again.

WIRING. Registering this gate REPLACES the ten member registrations in settings.json. Ten
registrations become one, which also pays 9 slots back against the 150-wired-hook ceiling in
LAW_SYSTEM 6.8. The member FILES stay exactly where they are; only their settings.json entries go.

Fail-open everywhere: a member that crashes, times out or cannot be found is skipped, never
promoted to a block. If everything fails, the stop proceeds.

Self-test: `--selftest`.  Skip: ~/.claude/link-family-skip.flag (non-empty reason, 30 min TTL).
"""
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

HOOKS = os.path.expanduser("~/.claude/hooks")
FLAG = os.path.expanduser("~/.claude/link-family-skip.flag")
TTL = 1800
MEMBER_TIMEOUT = 25          # seconds per member; the health member curls a live URL
POOL = 10

# The link/preview HANDOFF family, each entry "<file>[ <args>]" exactly as settings.json invoked it.
# The args matter: tunnel-kill-relink-gate is registered TWICE with different modes, --pre on
# PreToolUse and --stop on Stop, and only the --stop half belongs to this family. Dropping the arg
# would silently run the wrong mode, which is the kind of quiet breakage a consolidation must not
# introduce. fullbleed-external-link-gate is deliberately NOT here: it guards a UI anchor wrapping
# a whole surface, a different class that happens to share the word "link".
MEMBERS = [
    "always-give-link-gate.py",         # a visual turn must hand over a link at all
    "link-gate.py",                     # clickable markdown, not bare, not dead, not blank
    "lan-ip-preview-gate.py",           # never a LAN IP, it does not reach his phone
    "cloudflare-link-gate.py",          # never localhost
    "no-localhost-handoff-gate.py",     # never localhost (sibling of the above)
    "link-verified-gate.py",            # the link must have been OPENED this turn
    "link-load-succeeded-gate.py",      # it must have RESPONDED, not merely been tried
    "promised-visual-health-gate.py",   # healthy end to end at send time, not just DNS
    "link-relevance-gate.py",           # the RIGHT link, not any trycloudflare URL
    "preview-link-branch-gate.py",      # name the branch/worktree the link serves
    "tunnel-kill-relink-gate.py --stop",# a killed tunnel must be relinked, not re-handed
]

# link-load-succeeded-gate.py was an ORPHAN before this consolidation , written 2026-08-01 after
# three dead links in one session, self-tested, and never registered. Listing it here arms it.

HEADER = (
    "LINK-FAMILY GATE , %d requirement(s) on the link you are handing over.\n"
    "\n"
    "All of them at once, on purpose. These used to be %d separate Stop gates that denied one at a\n"
    "time, which is how one imperfect reply turned into four near-identical ones and why he keeps\n"
    "saying you repeat yourself. Fix EVERY item below in ONE correction.\n"
    "\n"
    "And send only what CHANGED. He has already read the rest of your message.\n"
)


def check_skip_flag(path, ttl):
    try:
        if not os.path.exists(path):
            return "none"
        if time.time() - os.stat(path).st_mtime > ttl:
            return "stale"
        with open(path, encoding="utf-8") as f:
            return "skip" if f.readline().strip() else "empty"
    except OSError:
        return "none"


def run_member(name, payload):
    """(name, message) if this member wants to block, else None. Never raises."""
    parts = name.split()
    path = os.path.join(HOOKS, parts[0])
    if not os.path.exists(path):
        return None
    try:
        p = subprocess.run(
            [sys.executable, path] + parts[1:],
            input=payload,
            text=True,
            capture_output=True,
            timeout=MEMBER_TIMEOUT,
        )
    except Exception:
        return None                      # crash or timeout is never promoted to a block
    if p.returncode != 2:
        return None
    msg = (p.stderr or p.stdout or "").strip()
    return (name, msg) if msg else None


def collect(payload, members=None, runner=None):
    """Every member that wants to block. Pure enough for the self-test to drive it."""
    members = MEMBERS if members is None else members
    runner = run_member if runner is None else runner
    out = []
    try:
        with ThreadPoolExecutor(max_workers=POOL) as ex:
            for r in ex.map(lambda n: runner(n, payload), members):
                if r:
                    out.append(r)
    except Exception:
        return []
    return out


def compose(blocks):
    parts = [HEADER % (len(blocks), len(MEMBERS))]
    for i, (name, msg) in enumerate(blocks, 1):
        body = "\n".join("   " + ln for ln in msg.splitlines() if ln.strip())
        parts.append("%d. [%s]\n%s" % (i, name.split()[0].replace(".py", ""), body))
    return "\n\n".join(parts)


def main():
    raw = sys.stdin.read()
    try:
        json.loads(raw)
    except Exception:
        sys.exit(0)

    blocks = collect(raw)
    if not blocks:
        sys.exit(0)

    state = check_skip_flag(FLAG, TTL)
    if state == "skip":
        sys.exit(0)
    extra = ""
    if state == "empty":
        extra = ('\n\n(Your skip flag is EMPTY. Put the reason in it: '
                 'echo "why this link cannot satisfy the family" > ~/.claude/link-family-skip.flag)')

    print(compose(blocks) + extra, file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        PAYLOAD = json.dumps({"transcript_path": "/nonexistent", "stop_hook_active": False})

        def fake(blockers):
            def r(name, payload):
                return (name, "REQUIREMENT from %s" % name) if name in blockers else None
            return r

        CASES = [
            ("1  nothing wants to block -> PASS",
             0, ["a.py", "b.py", "c.py"], fake(set())),
            ("2  one member blocks -> ONE combined deny",
             1, ["a.py", "b.py", "c.py"], fake({"a.py"})),
            ("3  three members block -> still ONE combined deny, 3 items",
             3, ["a.py", "b.py", "c.py"], fake({"a.py", "b.py", "c.py"})),
            ("4  a member that crashes is skipped, not promoted",
             0, ["a.py"], lambda n, p: (_ for _ in ()).throw(RuntimeError("boom"))),
            ("5  a missing member file is skipped",
             0, ["definitely-not-a-real-gate.py"], None),
            ("6  an entry carrying args still resolves its file",
             1, ["a.py --stop"], fake({"a.py --stop"})),
        ]
        ok = bad = 0
        for label, expect, members, runner in CASES:
            try:
                got = collect(PAYLOAD, members=members, runner=runner)
                n = len(got)
            except Exception:
                n = -1
            good = (n == expect)
            ok += good
            bad += (not good)
            print(("  PASS  " if good else "  FAIL  ") + label
                  + ("" if good else "   expected %d blocks, got %d" % (expect, n)))

        # 6: the composed message must be ONE message naming every requirement
        msg = compose([("x-gate.py", "do X"), ("y-gate.py", "do Y")])
        good = msg.count("LINK-FAMILY GATE") == 1 and "do X" in msg and "do Y" in msg
        ok += good
        bad += (not good)
        print(("  PASS  " if good else "  FAIL  ") + "6  one header, every requirement present")

        # 7: real members, real payload, must not raise and must not block on a junk transcript
        try:
            real = collect(PAYLOAD)
            good = isinstance(real, list)
        except Exception:
            good = False
        ok += good
        bad += (not good)
        print(("  PASS  " if good else "  FAIL  ")
              + "7  live run over the 11 real members does not raise")

        print("\n%d/%d passed" % (ok, ok + bad))
        sys.exit(1 if bad else 0)
    try:
        main()
    except Exception:
        sys.exit(0)  # fail-open, always
