#!/usr/bin/env python3
"""install.py , arm the 2026-08-03 preference-audit gate changes. Run from a NORMAL shell.

WHY THIS FILE EXISTS INSTEAD OF THE CHANGES BEING LIVE ALREADY. The session that produced them
ran sandboxed: ~/.claude/hooks/, ~/.claude/settings.json and both project settings files are all
write-denied there (measured PermissionError, not assumed). So the gates were written, self-tested
and validated against the real corpus in ~/.claude/pending-gates/, and this script does the one
thing the sandbox forbids. Same shape as wire-pending-gates.py, which exists for the same reason.

WHAT IT DOES

  1. reply-repeat-gate.py  , REPLACE the live file with v4. Already wired; no settings change.
     v3 compared each reply only against the immediately previous one, so a verbatim re-send two
     replies apart scored 0.02 and passed. v4 compares against every reply still in the turn
     history. 11/11 self-test, including the 6 v3 cases unchanged.

  2. link-family-aggregator.py , NEW, registered on Stop, and the ELEVEN member gates it wraps
     are UNREGISTERED from Stop in the same edit. The member FILES stay on disk untouched; the
     aggregator runs them, unchanged, in parallel, and returns ONE combined deny instead of up
     to eleven serial ones. Net wired hooks: MINUS 10.

  3. owner-correction-ledger.py , NEW, registered on UserPromptSubmit, inject-only, never blocks.
     Gives the self-improvement ladder the input channel IMPROVE_SYSTEM section 6 admits it
     lacks: it currently only counts mistakes I admit, never the ones HE names.

  4. no-plumbing-in-reply-gate.py , NOT new. Written 2026-07-26 and orphan ever since, because it
     shipped without a --selftest. It is the gate that answers 2026-08-03T16:29 ("Edit the gate so
     you just become silent and doesn't do anything or tell me anything ... I already see the
     fucking text"). A self-test was added, 7/7, and it is now armed.

  Net change to the wired-hook count: 157 -> 150, at the ceiling in LAW_SYSTEM 6.8 rather than
  five past it, which is what that section requires before any net-new gate.

SAFETY

  - every gate must pass its own --selftest before anything is installed (rule 12.5, enforced
    here rather than promised; wire-pending-gates.py learned this the hard way)
  - settings.json is backed up to settings.json.bak-<stamp> first
  - --dry-run prints the whole plan and writes nothing
  - idempotent: running it twice is a no-op the second time
  - --revert restores the newest backup and puts the live gate files back from .bak copies
"""
import json
import os
import shutil
import subprocess
import sys
import time

HOME = os.path.expanduser("~")
PENDING = os.path.join(HOME, ".claude", "pending-gates")
HOOKS = os.path.join(HOME, ".claude", "hooks")
SETTINGS = os.path.join(HOME, ".claude", "settings.json")

REPLACE = ["reply-repeat-gate.py"]                       # already wired, file swap only
NEW_STOP = [
    "link-family-aggregator.py",       # new: one deny for the whole link family
    "no-plumbing-in-reply-gate.py",    # NOT new: written 2026-07-26, orphan ever since, now armed
]
NEW_PROMPT = ["owner-correction-ledger.py"]              # new UserPromptSubmit registration

# Unregistered from Stop when the aggregator goes in. Files stay; only the settings entries go.
RETIRE_FROM_STOP = [
    "always-give-link-gate.py",
    "link-gate.py",
    "lan-ip-preview-gate.py",
    "cloudflare-link-gate.py",
    "no-localhost-handoff-gate.py",
    "link-verified-gate.py",
    "link-load-succeeded-gate.py",
    "promised-visual-health-gate.py",
    "link-relevance-gate.py",
    "preview-link-branch-gate.py",
    "tunnel-kill-relink-gate.py",
]

DRY = "--dry-run" in sys.argv


def say(*a):
    print(*a)


def selftest(path):
    try:
        p = subprocess.run([sys.executable, path, "--selftest"],
                           capture_output=True, text=True, timeout=180)
        return p.returncode == 0, (p.stdout or p.stderr or "").strip().splitlines()[-1:]
    except Exception as e:
        return False, [str(e)]


def load_settings():
    with open(SETTINGS, encoding="utf-8") as f:
        return json.load(f)


def count_wired(s):
    return sum(len(g.get("hooks", [])) for arr in s.get("hooks", {}).values() for g in arr)


def has_registration(s, event, name):
    for g in s.get("hooks", {}).get(event, []):
        for h in g.get("hooks", []):
            if name in h.get("command", ""):
                return True
    return False


def drop_registration(s, event, name):
    dropped = 0
    groups = s.get("hooks", {}).get(event, [])
    for g in groups:
        keep = [h for h in g.get("hooks", []) if name not in h.get("command", "")]
        dropped += len(g.get("hooks", [])) - len(keep)
        g["hooks"] = keep
    s["hooks"][event] = [g for g in groups if g.get("hooks")]
    return dropped


def add_registration(s, event, name):
    cmd = "python3 $HOME/.claude/hooks/" + name
    arr = s.setdefault("hooks", {}).setdefault(event, [])
    for g in arr:
        if g.get("matcher", "") == "":
            g.setdefault("hooks", []).append({"type": "command", "command": cmd})
            return
    arr.append({"matcher": "", "hooks": [{"type": "command", "command": cmd}]})


def revert():
    baks = sorted(f for f in os.listdir(os.path.dirname(SETTINGS))
                  if f.startswith("settings.json.bak-"))
    if not baks:
        say("no settings backup found, nothing to revert")
        return 1
    newest = os.path.join(os.path.dirname(SETTINGS), baks[-1])
    shutil.copy2(newest, SETTINGS)
    say("settings.json restored from", newest)
    for name in REPLACE:
        bak = os.path.join(HOOKS, name + ".bak-preference-audit")
        if os.path.exists(bak):
            shutil.copy2(bak, os.path.join(HOOKS, name))
            say("restored", name)
    return 0


def main():
    if "--revert" in sys.argv:
        return revert()

    if not os.path.isdir(PENDING):
        say("nothing staged at", PENDING)
        return 1

    say("=" * 74)
    say("PREFERENCE-AUDIT GATE INSTALL  %s" % ("(DRY RUN, nothing will be written)" if DRY else ""))
    say("=" * 74)

    # 1. every gate proves itself first
    say("\n[1/4] self-tests")
    all_gates = REPLACE + NEW_STOP + NEW_PROMPT
    failed = []
    for name in all_gates:
        path = os.path.join(PENDING, name)
        if not os.path.exists(path):
            say("  MISSING  %s" % name)
            failed.append(name)
            continue
        ok, tail = selftest(path)
        say("  %-8s %-32s %s" % ("PASS" if ok else "FAIL", name, " ".join(tail)))
        if not ok:
            failed.append(name)
    if failed:
        say("\nREFUSING TO INSTALL , these did not pass: %s" % ", ".join(failed))
        return 1

    s = load_settings()
    before = count_wired(s)

    # 2. files
    say("\n[2/4] gate files -> %s" % HOOKS)
    for name in all_gates:
        src, dst = os.path.join(PENDING, name), os.path.join(HOOKS, name)
        action = "replace" if os.path.exists(dst) else "install"
        if action == "replace" and not DRY:
            shutil.copy2(dst, dst + ".bak-preference-audit")
        say("  %-8s %s" % (action, name))
        if not DRY:
            shutil.copy2(src, dst)
            os.chmod(dst, 0o755)

    # 3. registrations
    say("\n[3/4] settings.json")
    planned = 0
    for name in NEW_STOP:
        if has_registration(s, "Stop", name):
            say("  already registered (Stop)          %s" % name)
        else:
            say("  + register   Stop                  %s" % name)
            planned += 1
            if not DRY:
                add_registration(s, "Stop", name)
    for name in NEW_PROMPT:
        if has_registration(s, "UserPromptSubmit", name):
            say("  already registered (UserPrompt)    %s" % name)
        else:
            say("  + register   UserPromptSubmit      %s" % name)
            planned += 1
            if not DRY:
                add_registration(s, "UserPromptSubmit", name)
    removed = 0
    for name in RETIRE_FROM_STOP:
        if not has_registration(s, "Stop", name):
            say("  already unregistered (Stop)        %s" % name)
            continue
        say("  - unregister Stop  (aggregated)    %s" % name)
        removed += 1
        if not DRY:
            drop_registration(s, "Stop", name)

    after = before + planned - removed
    say("\n  wired hooks: %d -> %d   (ceiling is 150, LAW_SYSTEM 6.8)" % (before, after))

    # 4. write
    say("\n[4/4] commit")
    if DRY:
        say("  dry run, nothing written. Re-run without --dry-run to apply.")
        return 0
    stamp = time.strftime("%Y%m%d-%H%M%S")
    bak = SETTINGS + ".bak-" + stamp
    shutil.copy2(SETTINGS, bak)
    tmp = SETTINGS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=2)
    json.load(open(tmp, encoding="utf-8"))          # never leave a corrupt settings.json
    os.replace(tmp, SETTINGS)
    say("  settings.json written (backup: %s)" % os.path.basename(bak))
    say("\ndone. Revert with:  python3 %s --revert" % os.path.abspath(__file__))
    return 0


if __name__ == "__main__":
    sys.exit(main())
