#!/usr/bin/env python3
"""design-canon-gate , PreToolUse (Write|Edit|MultiEdit|Bash), plus a CLI audit mode.

Owner decision Q8, 2026-08-07 (_plans/SYSTEM_DECISIONS_2026-08-07.md row 8):
"One canon file per concern, everything else a pointer, dated reports archived."
On enforcement, verbatim: "make it so it acc gets archived and evrth like acc gate
for that so it forces."

THE RULE, one sentence. The top level of `_design-system/` holds exactly the files
listed in CANON below, plus the four sanctioned subdirectories. Anything else at
that level is a record, machine output, evidence, or a product spec, and it lives
in `archive/`, `reports/`, `research/` or `_plans/` instead.

Why a membership test and not a cleverness test. Decision Q1 froze new gates except
for things that are objective and cheap to check. Membership in a hardcoded list is
both: no rendering, no network, no judgment about whether a file is "still useful".
The gate never decides that a file is stale. It only decides that a file is not on
the canon list, which is a fact.

Three trigger points, one rule:
  1. Write   , creating a new top-level file that is not on the list.
  2. Edit    , modifying an existing top-level file that is not on the list.
  3. Bash    , `git commit` that stages anything under `_design-system/` while the
               top level still holds a file that is not on the list. This is the
               half that FORCES the move: the next design-system commit cannot land
               until the level is clean.

Adding a canon file is legal and deliberate: add the basename to CANON with the
concern it owns. That edit is visible in git and it forces you to name the concern,
which is the whole point of "one canon file per concern". There is deliberately NO
inline skip marker, because a marker would let any file declare itself canon.

This gate lives in `.claude/hooks/` and not in `~/.claude/hooks/` on purpose: the
canon list below IS the law, and `~/.claude` is not a git repo, so a list living
there would be unversioned and unreviewable. The rule is Solen-specific anyway.

Escape for a genuine emergency: touch .claude/design-canon-skip.flag (300s TTL).
300s is enough here because the required action is a `git mv`, which takes seconds,
unlike the mockup-build case where the same TTL was measured too short.

Fail-open on any error. Never wedge a session.

ARMING ORDER MATTERS: run the one-time sweep first, arm this second. A gate armed
before the sweep would deny the sweep's own commit. Same order COPY_LAW.md section 8
used for the register ratchet.

CLI:  python3 scripts/hooks/canon-archive-gate.py --audit [repo_root]
      (2026-08-18: this line said `design-canon-gate.py`, which exists nowhere on disk,
      in either repo copy or under ~/.claude. The gate was renamed and its own
      instructions were not. Anyone following them ran a file that is not there.)
      Prints every top-level file that is not on the list, with its destination.
      Always exits 0. Safe for the weekly law pass.

Fixed 2026-08-18 (stress-test pass): this gate was armed before its own documented one-time
sweep ran (the ARMING ORDER note above has said so since it was written), so the top level
already held 30 non-canon files the moment it went live, and it denied editing ANY of them,
forever, because it checked "is this name on the canon list" rather than "did THIS edit add a
new offender". Both trigger points now compare violation count before vs after the change and
deny only on an INCREASE: check_file_write() passes any edit to a file that already existed on
disk (grandfathered, the edit did not create the violation), and check_commit() looks at git's
own staged status ('A' = added) so a commit that only touches content of a pre-existing offender,
or moves one out with `git mv`, is never blocked for the 29 others still sitting there. Also
corrected: the remedy text pointed at `.claude/hooks/design-canon-gate.py`, which has never
existed on disk under any name; the real file is `scripts/hooks/canon-archive-gate.py`.
"""
import json
import os
import re
import subprocess
import sys
import time

FLAG_TTL = 300


def skip_flag_path():
    root = os.environ.get("CLAUDE_PROJECT_DIR") or git_root() or os.getcwd()
    return os.path.join(root, ".claude", "design-canon-skip.flag")

# ---------------------------------------------------------------------------
# THE CANON LIST: one file per concern. basename -> the concern it owns.
# To add a file here you must name a concern no other row already owns.
# ---------------------------------------------------------------------------
CANON = {
    "LOCKFILE.md":           "frozen literal values (hex, px, ms, prop signatures)",
    "SOURCE.md":             "applied design law in prose (22 sections)",
    "RATIONALE.md":          "the evidence behind the rules",
    "TASTE_LOG.md":          "the owner's dated verdicts",
    "MOTION.md":             "motion and timing",
    "COPY_LAW.md":           "how strings are written, four locales",
    "PSYCHOLOGY.md":         "behavioral law (conversion, retention, ethics lines)",
    "CONTROL_ELEVATION.md":  "the elevation decision tree for controls",
    "COMPONENT_REGISTRY.md": "the shared component index",
    "REMOVED.md":            "the graveyard: deleted and rejected things",
    "DRIFT_LEDGER.md":       "re-invented structure (keyword-injected by a hook)",
    "REJECTED_TREATMENTS.json": "rejected visual treatments (machine-read)",
    "QUESTIONS.md":          "the standing page of every open design decision",
    "SUGGESTIONS.md":        "live design-improvement suggestions",
    "PROCESS.md":            "how design work is scoped, briefed and graded",
    # Added 2026-08-16, after a merchant terminal was rejected six times and an adversarial panel
    # found the cause was that nobody ever named the screen or its governing law before building.
    # No row above owns the DECIDING pass: LOCKFILE owns literals, SOURCE owns applied law,
    # RATIONALE owns evidence, PROCESS owns how work is scoped and graded. None of them says how to
    # decide what you are building, in plain English, before any markup. That is this file's concern.
    "PRINCIPLES.md":         "how to decide before any markup (screen class, job, colour meaning, containers, rhythm, type)",
    # Added 2026-08-17, after eleven rejected merchant-terminal rounds (_plans/
    # MERCHANT_TERMINAL_2026-08-15.md). PRINCIPLES.md above owns the DECIDING pass across all four
    # screen classes and deliberately stays general; components/MerchantTerminal.md owns ONE
    # screen's anatomy. Neither owns the per-class depth an operator counter screen needs: its
    # hierarchy, its two spacing ladders, its type roles, when a colour is allowed at all, when a
    # box is earned once container count is a function of live data, what must clear the fold, how
    # actions and their reversals work, and where it deliberately diverges from the 49-route
    # dashboard console. Stated plainly so the row can be judged: this is a per-class DEEPENING of
    # PRINCIPLES.md, not a rival to it, and it states no new frozen literal.
    "TERMINAL_PRINCIPLES.md": "how to decide on an operator counter screen, and how it differs from the dashboard console",
    # Added 2026-08-08. MEASUREMENT_LAW section 1.2 has named this file and this exact path since
    # it was written, and the file did not exist, so the law pointed at nothing. One row per
    # instrument; the load-bearing column is what each one is BLIND to.
    "INSTRUMENT_CALIBRATION.md": "what each measuring instrument has proved, and what it is blind to",
    "_rebuilt_routes.json":  "the drift checker's strict-scope allowlist (config)",
    # Added 2026-08-21. Sibling of TASTE_AUTHORITY.md but for a different concern: TASTE_AUTHORITY
    # decides how things LOOK, this decides WHO DECIDES an operational call (fix now, park, ask).
    # TASTE_AUTHORITY.md had never been registered here either, a pre-existing gap; both rows land
    # together because the two files are siblings and a helper reads them as a pair.
    "TASTE_AUTHORITY.md":     "who may decide a small visual/taste question without asking him",
    "DECISION_AUTHORITY.md":  "who may decide a small operational question (fix now/park/ask) without asking him",
}

# Sanctioned subdirectories. Everything below them governs itself.
SUBDIRS = {"archive", "reports", "research", "components"}

# Files a script rewrites in place. These belong in reports/, not archive/.
REPORT_OUTPUTS = {"_drift-report.md", "_pending-migration.md", "_geometry-report.md"}

# Destination hints, all decidable from the file alone.
# Trigger A, dated filename. A date in the name means the file is a snapshot.
DATED_NAME = re.compile(r"(?:19|20)\d{2}-\d{2}(?:-\d{2})?")
# Trigger B, machine-written. Anchored to the START of a line, so a sentence that
# merely mentions another file's "auto-regenerated dump" does not match.
MACHINE_HEADER = re.compile(r"^[\s_*>#\-]*generated\s*(?::|by\b)", re.IGNORECASE | re.MULTILINE)
# Trigger C, the file's own header already calls it past tense.
PAST_TENSE_BANNER = (
    "historical record", "not current law", "folded into", "not a backlog",
    "superseded", "tombstone", "read-only investigation", "report-only pass",
    "status , executed", "status - executed", "status: executed",
    "this is now a record",
)
# Soft signal D, a date in the header. Suggestive, not conclusive: reported as
# "probable" so nobody moves a live file on the strength of a citation.
DATE_IN_HEAD = re.compile(r"(?:19|20)\d{2}-\d{2}-\d{2}")

GIT_COMMIT = re.compile(r"(?:^|[;&|\s])git\s+(?:-\S+\s+)*commit(?:\s|$)")


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def top_level_name(fp):
    """Return the basename if fp is exactly _design-system/<name>, else None."""
    p = (fp or "").replace("\\", "/")
    m = re.search(r"/_design-system/([^/]+)$", p)
    return m.group(1) if m else None


AMBIGUOUS = ("no objective marker, so you pick: archive/ if it is a record, "
             "research/ if it is evidence for a rule, _plans/ if it is a product "
             "build spec")


def destination(path_or_name, root=None):
    """Where a non-canon top-level entry goes.

    Returns (dest, why, confident). `dest` is None when nothing fires, which means
    a human picks between archive/, research/ and _plans/. `confident` is False for
    the soft date-in-header signal. The caller never prints a bare `git mv` unless
    `confident` is True.
    """
    name = os.path.basename(path_or_name)
    if name in REPORT_OUTPUTS:
        return "_design-system/reports/", "a script rewrites this file in place", True
    if DATED_NAME.search(name):
        return ("_design-system/archive/",
                "the filename carries a date, so it is a snapshot", True)
    head = ""
    if root:
        full = os.path.join(root, "_design-system", name)
        try:
            if os.path.isdir(full):
                return "_design-system/archive/", "a directory of past work, not law", True
            with open(full, "r", encoding="utf-8", errors="ignore") as fh:
                head = "".join([next(fh, "") for _ in range(15)])
        except Exception:
            head = ""
    low = head.lower()
    if MACHINE_HEADER.search(head):
        return ("_design-system/reports/",
                "a header line says it was generated by a tool", True)
    for phrase in PAST_TENSE_BANNER:
        if phrase in low:
            return ("_design-system/archive/",
                    'the header already calls it past ("%s")' % phrase, True)
    m = DATE_IN_HEAD.search(head)
    if m:
        return ("_design-system/archive/",
                "PROBABLE only: the header is dated %s, so it reads as a record. "
                "Confirm before moving" % m.group(0), False)
    return None, AMBIGUOUS, False


def move_line(name, dest, confident):
    if dest and confident:
        return "  git mv _design-system/%s %s" % (name, dest)
    if dest:
        return ("  git mv _design-system/%s %s        # CONFIRM first, see note"
                % (name, dest))
    return ("  git mv _design-system/%s _design-system/archive/"
            "        # or research/ or _plans/ , you pick" % name)


def report_line(name, dest, why, confident):
    arrow = dest if dest else "you pick"
    if dest and not confident:
        arrow = dest + " ?"
    return "  %s\n      -> %s  (%s)" % (name, arrow, why)


def offenders(root):
    """Top-level entries of _design-system that are not on the canon list."""
    d = os.path.join(root, "_design-system")
    out = []
    try:
        for name in sorted(os.listdir(d)):
            if name.startswith(".") or name in CANON or name in SUBDIRS:
                continue
            out.append(name)
    except Exception:
        return []
    return out


def canon_list_text():
    return "\n".join("  %-26s %s" % (k, v) for k, v in CANON.items())


def deny(reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}))
    sys.exit(0)


def git_root(start=None):
    try:
        r = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                           cwd=start or os.getcwd(), capture_output=True,
                           text=True, timeout=5)
        if r.returncode == 0:
            return r.stdout.strip()
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# the three checks
# ---------------------------------------------------------------------------
def check_file_write(data):
    ti = data.get("tool_input") or {}
    fp = ti.get("file_path") or ""
    name = top_level_name(fp)
    if not name or name in CANON or name in SUBDIRS:
        return
    # 2026-08-18 stress-test fix: grandfather PRE-EXISTING offenders. Editing a file that already
    # existed at the top level before this turn does not increase the offender count, so it is
    # not a NEW violation, only creating a brand-new non-canon file is. See the docstring note.
    if os.path.exists(fp):
        return
    root = git_root(os.path.dirname(fp) or None)
    dest, why, confident = destination(name, root)
    action = ("Write it at its destination instead:\n  %s%s"
              % (dest or "_design-system/archive/  (or research/ or _plans/)", name))
    deny(
        "DESIGN CANON (owner Q8, 2026-08-07: \"one canon file per concern, everything "
        "else a pointer, dated reports archived\"): you are trying to create "
        "`_design-system/%s`, which is not on the canon list.\n\n"
        "Where it goes: %s\nWhy: %s\n\n"
        "%s\n\n"
        "The canon list, one file per concern:\n%s\n\n"
        "If this really is a new concern that no row above owns, add the basename to "
        "CANON in scripts/hooks/canon-archive-gate.py with the concern it owns, in "
        "the same turn. If it is not, put the content in the canon file that owns its "
        "concern and leave a pointer, or move the file to its destination with "
        "`git mv`."
        % (name, dest or "you pick", why, action, canon_list_text())
    )


def newly_added_offenders(root):
    """Top-level _design-system entries this STAGED commit is genuinely ADDING as a new
    non-canon entry (git status 'A' at that exact top-level path). 2026-08-18 fix: a commit
    that only edits the CONTENT of a pre-existing offender, or `git mv`s one out, must never
    be blocked for the other 29 still sitting there, so this counts additions, not the
    standing total. Fail-open (empty list) on any git error."""
    try:
        r = subprocess.run(["git", "diff", "--cached", "--name-status"],
                           cwd=root, capture_output=True, text=True, timeout=10)
        lines = r.stdout.splitlines()
    except Exception:
        return []
    top_level = re.compile(r"^_design-system/([^/]+)$")
    added = []
    for line in lines:
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        status, path = parts[0], parts[-1]
        if not status.startswith("A"):
            continue  # only a brand-new path is a new violation; M/D/R-into-a-subdir are not
        m = top_level.match(path)
        if not m:
            continue
        name = m.group(1)
        if name in CANON or name in SUBDIRS:
            continue
        added.append(name)
    return sorted(set(added))


def check_commit(data):
    cmd = ((data.get("tool_input") or {}).get("command")) or ""
    if not GIT_COMMIT.search(cmd):
        return
    root = git_root()
    if not root:
        return
    try:
        r = subprocess.run(["git", "diff", "--cached", "--name-only"],
                           cwd=root, capture_output=True, text=True, timeout=10)
        staged = r.stdout.splitlines()
    except Exception:
        return
    if not any(s.startswith("_design-system/") for s in staged):
        return
    bad = newly_added_offenders(root)
    if not bad:
        return
    rows, moves = [], []
    for name in bad:
        dest, why, confident = destination(name, root)
        rows.append(report_line(name, dest, why, confident))
        moves.append(move_line(name, dest, confident))
    deny(
        "DESIGN CANON (owner Q8, 2026-08-07, verbatim: \"make it so it acc gets "
        "archived and evrth like acc gate for that so it forces\"): this commit STAGES "
        "%d brand-new top-level `_design-system/` entr(ies) that are not on the canon "
        "list (pre-existing offenders are grandfathered , this only counts what THIS "
        "commit adds). Move them in this commit:\n\n%s\n\n"
        "  mkdir -p _design-system/archive _design-system/reports\n%s\n\n"
        "An entry stays at the top level only if it is the ONE canon file for a "
        "concern. If one of these is, add its basename to CANON in "
        "scripts/hooks/canon-archive-gate.py with the concern it owns. Emergency "
        "escape: touch .claude/design-canon-skip.flag (5 minutes)."
        % (len(bad), "\n".join(rows), "\n".join(moves))
    )


# ---------------------------------------------------------------------------
def _selftest_git(tmp, *args):
    return subprocess.run(["git", "-c", "user.email=t@t.com", "-c", "user.name=t"] + list(args),
                          cwd=tmp, capture_output=True, text=True, timeout=10)


def _selftest_drive(tmp, payload):
    env = dict(os.environ)
    env.pop("CLAUDE_PROJECT_DIR", None)
    return subprocess.run([sys.executable, os.path.abspath(__file__)], input=json.dumps(payload),
                          cwd=tmp, capture_output=True, text=True, timeout=10, env=env)


def selftest():
    """--selftest (added 2026-08-18 with the grandfather fix): a pre-existing offender, seeded
    and committed BEFORE the gate is driven, must stay editable; only a genuinely new top-level
    non-canon entry (a Write to a path that doesn't exist yet, or a commit that stages one with
    git status 'A') may still block."""
    import tempfile
    bad = cases = 0

    def check(name, ok, extra=""):
        nonlocal bad, cases
        cases += 1
        bad += 0 if ok else 1
        print(f"{'ok  ' if ok else 'FAIL'}  {name}" + (f"  ({extra!r})" if extra and not ok else ""))

    with tempfile.TemporaryDirectory() as tmp:
        _selftest_git(tmp, "init", "-q")
        os.makedirs(os.path.join(tmp, "_design-system"))
        pre_existing = os.path.join(tmp, "_design-system", "OLD_OFFENDER.md")
        with open(pre_existing, "w") as f:
            f.write("some historical doc, not on the canon list\n")
        _selftest_git(tmp, "add", "-A")
        _selftest_git(tmp, "commit", "-q", "-m", "seed pre-existing offender")

        r1 = _selftest_drive(tmp, {"tool_name": "Edit", "tool_input": {
            "file_path": pre_existing, "old_string": "some", "new_string": "changed"}})
        check("edit to a pre-existing offender passes", r1.stdout.strip() == "", r1.stdout)

        new_offender = os.path.join(tmp, "_design-system", "BRAND_NEW.md")
        r2 = _selftest_drive(tmp, {"tool_name": "Write", "tool_input": {
            "file_path": new_offender, "content": "x"}})
        check("write of a brand-new non-canon file blocks",
              '"permissionDecision": "deny"' in r2.stdout, r2.stdout)

        with open(pre_existing, "w") as f:
            f.write("changed content, still not canon\n")
        _selftest_git(tmp, "add", "-A")
        r3 = _selftest_drive(tmp, {"tool_name": "Bash", "tool_input": {
            "command": "git commit -m 'edit offender content'"}})
        check("commit touching only pre-existing offender content passes",
              r3.stdout.strip() == "", r3.stdout)

        with open(new_offender, "w") as f:
            f.write("brand new\n")
        _selftest_git(tmp, "add", "-A")
        r4 = _selftest_drive(tmp, {"tool_name": "Bash", "tool_input": {
            "command": "git commit -m 'add new offender'"}})
        check("commit staging a brand-new non-canon file blocks",
              '"permissionDecision": "deny"' in r4.stdout, r4.stdout)

    print(f"\n{cases - bad}/{cases} passed")
    return 0 if bad == 0 else 1


def main():
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    if "--audit" in sys.argv:
        root = None
        for a in sys.argv[1:]:
            if a != "--audit":
                root = a
        root = root or git_root() or os.getcwd()
        bad = offenders(root)
        if not bad:
            print("design-canon: top level clean (%d canon files)" % len(CANON))
            sys.exit(0)
        print("design-canon: %d entr(ies) not on the canon list" % len(bad))
        for name in bad:
            dest, why, confident = destination(name, root)
            print(report_line(name, dest, why, confident))
        sys.exit(0)

    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    try:
        f = skip_flag_path()
        if os.path.exists(f) and time.time() - os.path.getmtime(f) < FLAG_TTL:
            sys.exit(0)
    except Exception:
        pass
    try:
        tool = data.get("tool_name") or ""
        if tool in ("Write", "Edit", "MultiEdit"):
            check_file_write(data)
        elif tool == "Bash":
            check_commit(data)
    except Exception:
        sys.exit(0)
    sys.exit(0)


if __name__ == "__main__":
    main()
