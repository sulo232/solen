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

2026-08-18 audit: `start` injected the top TWO entries in full on every session, no matter how
old they were, up to 2,770 bytes of narrative text that stops being "recent work" once it is a
week-plus old. Tightened per the audit's own instruction: parse the date off the newest entry's
`## YYYY-MM-DD` heading; if it is within RECENT_DAYS, inject that ONE entry in full (was two);
otherwise inject a single-line pointer (title + how many days old) instead of the full text.
Age is measured against the wall clock, not committed anywhere, so this never goes stale itself.

Root cause found while measuring the "8-day-stale" case named in the audit: it was not that
the newest entry (2026-08-17) was actually 8 days old, it was that the OLD entry-splitting
logic (`text.split("\n## ")`, then discard `parts[0]` as "the file header") silently threw the
real newest entry away every time, because the real _plans/WORKLOG.md has no separate header
line before its first `## ` entry , that first entry IS `parts[0]`, and treating it as a header
made the hook always show the SECOND-newest entry as if it were the newest. Fixed by finding
every `## ` heading directly (regex, line-anchored) instead of assuming a header exists.
"""
import datetime
import json
import os
import re
import subprocess
import sys
import time

# how many days old the newest entry can be and still count as "recent work" worth showing
# in full , past this it becomes a one-line pointer instead (2026-08-18).
RECENT_DAYS = 3
ENTRY_DATE_RE = re.compile(r"^##\s*(\d{4}-\d{2}-\d{2})")
HEADING_RE = re.compile(r"(?m)^## ")


def split_worklog_entries(text):
    """Every `## `-headed entry in text, in file order. Finds heading START positions directly
    instead of splitting on "\n## " and discarding the first chunk as a file header , the real
    _plans/WORKLOG.md has no leading header at all (its first line IS the first `## ` entry),
    so the old split-and-drop-parts[0] approach silently threw the real newest entry away every
    time (2026-08-18 audit)."""
    starts = [m.start() for m in HEADING_RE.finditer(text)]
    return [text[s:e] for s, e in zip(starts, starts[1:] + [len(text)])]


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


def render_start_context(worklog_path, today=None):
    """The SessionStart additionalContext for the newest WORKLOG.md entry, or None. Pure (no
    I/O beyond reading worklog_path); shared by `main` and --selftest so they exercise the
    exact same decision path. `today` is injectable for the selftest, defaults to the real date."""
    if not os.path.exists(worklog_path):
        return None
    text = open(worklog_path, encoding="utf-8").read()
    entries = split_worklog_entries(text)
    if not entries:
        return None
    newest = entries[0]
    title = newest.splitlines()[0].lstrip("# ").strip()
    m = ENTRY_DATE_RE.match(newest)
    age_days = None
    if m:
        try:
            entry_date = datetime.date.fromisoformat(m.group(1))
            age_days = ((today or datetime.date.today()) - entry_date).days
        except ValueError:
            age_days = None

    if age_days is not None and age_days > RECENT_DAYS:
        return (f"WORK LOG: newest entry is {age_days} days old (\"{title}\"). "
                "See _plans/WORKLOG.md for what shipped.")
    body = newest
    if len(body) > 2500:
        body = body[:2500] + "\n... (truncated; see _plans/WORKLOG.md)"
    return ("RECENT WORK LOG (_plans/WORKLOG.md, newest first) , what was done "
            "recently, plain English:\n\n" + body)


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
        # surface the newest entry , in full if it's recent, a one-line pointer if it's stale
        try:
            ctx = render_start_context(worklog)
            if ctx:
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


def _selftest():
    import tempfile

    failed = 0
    tmp = tempfile.mkdtemp(prefix="worklog-selftest-")
    path = os.path.join(tmp, "WORKLOG.md")
    today = datetime.date(2026, 8, 18)

    def write(entries_text):
        with open(path, "w") as f:
            f.write("# Work log\n\n" + entries_text)

    def check(label, ok):
        nonlocal failed
        print(("PASS" if ok else "FAIL") + f": {label}")
        if not ok:
            failed += 1

    # recent entry (1 day old): full text, not a pointer.
    write("## 2026-08-17 , the actual work that happened yesterday\n\nDetail paragraph.\n")
    ctx = render_start_context(path, today=today)
    check("recent entry (1 day old) injects the FULL entry", ctx is not None and "RECENT WORK LOG" in ctx and "the actual work that happened yesterday" in ctx)
    check("recent entry does not degrade to a one-line pointer", "days old" not in (ctx or ""))

    # exactly at the RECENT_DAYS boundary: still full.
    write(f"## {(today - datetime.timedelta(days=RECENT_DAYS)).isoformat()} , boundary entry\n\nx\n")
    ctx = render_start_context(path, today=today)
    check(f"entry exactly {RECENT_DAYS} days old still counts as recent (full text)", ctx is not None and "RECENT WORK LOG" in ctx)

    # the audit's own case: 8-day-stale entry -> one-line pointer, not the full 2,770-byte dump.
    write("## 2026-08-10 , weekly design-law improvement pass\n\n" + ("Detail. " * 400) + "\n")
    ctx = render_start_context(path, today=today)
    check("8-day-stale entry (the audit's own case) becomes a ONE-LINE pointer",
          ctx is not None and ctx.startswith("WORK LOG: newest entry is 8 days old"))
    check("stale pointer is short (a one-liner, not the full narrative dump)",
          ctx is not None and len(ctx) < 200)
    check("stale pointer names the title", ctx is not None and "weekly design-law improvement pass" in ctx)

    # empty / missing file -> nothing injected.
    ctx = render_start_context(os.path.join(tmp, "does-not-exist.md"), today=today)
    check("missing WORKLOG.md injects nothing", ctx is None)

    write("# Work log\n\n")
    ctx = render_start_context(path, today=today)
    check("a WORKLOG.md with a header but zero entries injects nothing", ctx is None)

    # the ROOT CAUSE case: the real _plans/WORKLOG.md has NO leading header at all, its first
    # line IS the first entry. The old split("\n## ")[1:] logic discarded this entry as if it
    # were a header and showed the SECOND entry as "newest" , this is what actually produced
    # the audit's "8-day-stale" symptom (2026-08-10 shown as newest when 2026-08-17 was real).
    with open(path, "w") as f:
        f.write(
            "## 2026-08-17 , the real newest entry, no header line before it\n\nDetail.\n"
            "## 2026-08-10 , an older entry\n\nOlder detail.\n"
        )
    ctx = render_start_context(path, today=today)
    check("no-leading-header file: the TRUE newest entry is found, not silently dropped",
          ctx is not None and "the real newest entry, no header line before it" in ctx)
    check("no-leading-header file: the older entry is NOT shown as newest",
          ctx is not None and "an older entry" not in ctx)

    import shutil
    shutil.rmtree(tmp, ignore_errors=True)

    total = 10
    print(f"\n{total - failed}/{total} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(_selftest())
    try:
        main()
    except Exception:
        sys.exit(0)
