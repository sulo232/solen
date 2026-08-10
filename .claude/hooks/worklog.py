#!/usr/bin/env python3
"""worklog.py , persistent plain-English "what got done" log across sessions.

Owner 2026-07-07: "make a hook to always explain / make a summary even in new
sessions, plain English but detailed, because right now I don't know what you did."

Two modes (argv[1]):
  start  (SessionStart): print the newest _plans/WORKLOG.md entries as context, so
         a NEW session (and the owner) immediately sees recent work in plain English.
         Also stash the current git HEAD so `stop` can tell if work shipped.
  stop   (Stop): if commits were made this session but WORKLOG.md was NOT updated,
         BLOCK with a reminder to append a plain-English entry (escape: the skip flag).
         That is what makes the log stay fed instead of going stale.

Fail-open everywhere: a worklog bug must never brick a session or trap a stop.
"""
import json
import os
import subprocess
import sys
import time


def read_stdin():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def git(proj, args):
    try:
        r = subprocess.run(["git", "-C", proj] + args,
                           capture_output=True, text=True, timeout=5)
        return r.stdout.strip()
    except Exception:
        return ""


def git_ok(proj, args):
    """True when the command exits 0. `git` above returns stdout and swallows the exit code, which
    is fine for `log` but useless for `merge-base --is-ancestor`, whose whole answer IS the exit
    code and whose stdout is empty either way."""
    try:
        r = subprocess.run(["git", "-C", proj] + args,
                           capture_output=True, text=True, timeout=5)
        return r.returncode == 0
    except Exception:
        return False


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "start"
    data = read_stdin()
    proj = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    worklog = os.path.join(proj, "_plans", "WORKLOG.md")
    sid = (data.get("session_id") or "nosid")[:16]
    statedir = os.path.expanduser("~/.claude/state")
    headfile = os.path.join(statedir, f"worklog-head-{sid}.txt")
    skipflag = os.path.expanduser("~/.claude/worklog-skip.flag")

    if mode == "start":
        # stash HEAD for the stop comparison, ONLY if not already stashed for
        # this session_id. A SessionStart can re-fire on /compact or /resume;
        # overwriting the head then would erase the true session-start baseline
        # and let pre-compaction commits escape the worklog-stop check.
        try:
            os.makedirs(statedir, exist_ok=True)
            if not os.path.exists(headfile):
                head = git(proj, ["rev-parse", "HEAD"])
                if head:
                    with open(headfile, "w") as f:
                        f.write(head)
        except Exception:
            pass
        # surface the newest entries
        try:
            if not os.path.exists(worklog):
                sys.exit(0)
            text = open(worklog, encoding="utf-8").read()
            parts = text.split("\n## ")
            entries = ["## " + p for p in parts[1:]]  # skip the file header
            newest = entries[:2]  # top of file = newest (2 max: context diet 2026-07-08)
            if not newest:
                sys.exit(0)
            body = "\n\n".join(newest)
            if len(body) > 2500:
                body = body[:2500] + "\n... (truncated; see _plans/WORKLOG.md)"
            ctx = ("RECENT WORK LOG (_plans/WORKLOG.md, newest first) , what was done in "
                   "recent sessions, plain English:\n\n" + body)
            print(json.dumps({"hookSpecificOutput": {
                "hookEventName": "SessionStart", "additionalContext": ctx}}))
        except Exception:
            pass
        sys.exit(0)

    if mode == "stop":
        try:
            if os.path.exists(skipflag) and (time.time() - os.path.getmtime(skipflag)) < 1800:
                sys.exit(0)
            start_head = ""
            if os.path.exists(headfile):
                start_head = open(headfile, encoding="utf-8").read().strip()
            if not start_head:
                sys.exit(0)  # no baseline -> cannot tell -> allow
            # 2026-08-08. The baseline is stashed once at SessionStart and reused all session, but
            # `proj` is re-resolved on every fire from CLAUDE_PROJECT_DIR / cwd / getcwd. This
            # machine runs 30 worktrees off ONE shared object store, so a hash stashed in worktree A
            # still resolves in worktree B and quietly measures the divergence between two unrelated
            # branches. An audit reproduced it: "this session shipped 101 commit(s)".
            #
            # 101 is the dangerous kind of wrong, because it is not impossible. The impossible-number
            # gate would never catch it, and neither would I. So the check is not a ceiling here, it
            # is a provenance test: the baseline has to actually be an ancestor of this HEAD, or it
            # is not a baseline for this history and the count means nothing.
            if not git_ok(proj, ["merge-base", "--is-ancestor", start_head, "HEAD"]):
                sys.exit(0)  # baseline belongs to another history: no honest count, so no claim
            commits = git(proj, ["log", f"{start_head}..HEAD", "--oneline"])
            if not commits:
                sys.exit(0)  # no work shipped this session -> nothing to log
            changed = git(proj, ["diff", "--name-only", f"{start_head}..HEAD"])
            if "_plans/WORKLOG.md" in changed:
                sys.exit(0)  # already logged this session
            n = len([c for c in commits.splitlines() if c.strip()])
            msg = (
                f"WORKLOG REMINDER: this session shipped {n} commit(s) but _plans/WORKLOG.md "
                "was not updated. Append ONE new entry at the TOP (under the file header): "
                "a dated `## YYYY-MM-DD , <title>` with a plain-English, detailed 'what + why' "
                "of what you did this session, so a future session understands it without "
                "reading code. Then commit it. (Genuinely nothing worth logging? "
                "touch ~/.claude/worklog-skip.flag)"
            )
            sys.stderr.write(msg + "\n")
            sys.exit(2)  # block the stop until logged
        except Exception:
            sys.exit(0)

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
