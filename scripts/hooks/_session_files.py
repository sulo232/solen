#!/usr/bin/env python3
"""_session_files.py : the one honest answer to "what did THIS session actually write?"

Born 2026-08-07, from a measured false positive. `visual-deliverable-gate.py` decided a turn
had written owner-facing design knowledge by reading filesystem mtime inside a 3600s window.
In a git worktree that is not a measure of authorship at all: creating or syncing a worktree
restamps every file. Measured on this worktree, `_design-system/RATIONALE.md`, `TASTE_LOG.md`,
`research/PRINCIPLES_50.md` and `research/TASTE_RANGE.md` all carried mtime 11:23:57 while
`git status --porcelain` reported every one of them CLEAN. The gate fired on four files nobody
had touched, and it would have kept firing on every turn for an hour of every worktree session.

That is the same failure the owner named in the fourteen-attempt animation case: the instrument
was real, the number was real, and the number was not measuring the thing. So the fix is not a
bigger lookback window. It is to stop using a proxy and ask git, which actually knows.

A file counts as written by this session when EITHER:
  (a) it is dirty in the working tree (modified, added, untracked, staged), or
  (b) it landed in a commit made after the session started.

Neither is true of a file that a checkout merely restamped, which is the whole point.

Usage from a hook:

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from _session_files import files_written_this_session
    touched = files_written_this_session(pdir, since_epoch)   # set of repo-relative paths

`since_epoch` is optional. Pass the session start when you know it (a transcript's first
timestamp works); omit it and only the working tree is consulted, which is the conservative
answer and never invents a hit.

Fail-open by contract: any git failure returns an empty set, so a gate built on this stays
silent rather than blocking on a guess. A gate that cannot prove its trigger must not fire.
"""
from __future__ import annotations

import os
import subprocess


def _git(pdir: str, *args: str, timeout: float = 5.0) -> str:
    try:
        r = subprocess.run(
            ["git", "-C", pdir, *args],
            capture_output=True, text=True, timeout=timeout,
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    if r.returncode != 0:
        return ""
    return r.stdout


def dirty_files(pdir: str) -> set[str]:
    """Repo-relative paths with uncommitted changes, including untracked."""
    out = _git(pdir, "status", "--porcelain", "-z", "--untracked-files=all")
    if not out:
        return set()
    paths: set[str] = set()
    parts = [p for p in out.split("\0") if p]
    i = 0
    while i < len(parts):
        entry = parts[i]
        if len(entry) < 4:
            i += 1
            continue
        status, path = entry[:2], entry[3:]
        # a rename carries its source as the following NUL-separated field
        if "R" in status or "C" in status:
            i += 1
        paths.add(path)
        i += 1
    return paths


def committed_since(pdir: str, since_epoch: float | None) -> set[str]:
    """Repo-relative paths touched by commits made at or after `since_epoch`."""
    if not since_epoch:
        return set()
    out = _git(pdir, "log", f"--since=@{int(since_epoch)}", "--name-only", "--pretty=format:")
    return {line.strip() for line in out.splitlines() if line.strip()}


def files_written_this_session(pdir: str, since_epoch: float | None = None) -> set[str]:
    """Every repo-relative path this session actually wrote. Empty set on any git failure."""
    if not _git(pdir, "rev-parse", "--is-inside-work-tree").strip():
        return set()
    return dirty_files(pdir) | committed_since(pdir, since_epoch)


def _selftest() -> int:
    import tempfile

    ok = True
    with tempfile.TemporaryDirectory() as d:
        env_git = lambda *a: subprocess.run(["git", "-C", d, *a], capture_output=True, text=True)
        env_git("init", "-q")
        env_git("config", "user.email", "t@t.t")
        env_git("config", "user.name", "t")
        clean = os.path.join(d, "clean.md")
        with open(clean, "w") as fh:
            fh.write("committed and untouched\n")
        env_git("add", "-A")
        env_git("commit", "-q", "-m", "base")

        # THE CASE THIS EXISTS FOR: restamp a committed file, exactly what a worktree checkout does.
        os.utime(clean, None)
        touched = files_written_this_session(d)
        if "clean.md" in touched:
            print("FAIL: a restamped but unmodified file was reported as written")
            ok = False
        else:
            print("pass: restamped-but-clean file is NOT reported as written")

        # a genuinely edited file must be reported
        with open(clean, "a") as fh:
            fh.write("edited\n")
        touched = files_written_this_session(d)
        if "clean.md" not in touched:
            print("FAIL: a genuinely modified file was NOT reported")
            ok = False
        else:
            print("pass: modified file IS reported")

        # a new untracked file must be reported
        with open(os.path.join(d, "new.md"), "w") as fh:
            fh.write("brand new\n")
        touched = files_written_this_session(d)
        if "new.md" not in touched:
            print("FAIL: an untracked new file was NOT reported")
            ok = False
        else:
            print("pass: untracked new file IS reported")

        # non-repo path must fail open (empty), never guess
        with tempfile.TemporaryDirectory() as nd:
            if files_written_this_session(nd):
                print("FAIL: non-repo path did not fail open")
                ok = False
            else:
                print("pass: non-repo path fails open to empty")

    print("SELFTEST", "OK" if ok else "FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    import sys

    sys.exit(_selftest())
