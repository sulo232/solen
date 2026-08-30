#!/usr/bin/env python3
"""recurrence-harden-gate.py : a flagged RECURRING pattern must produce a GATE, not a promise.

Born 2026-07-15, owner verbatim: "I literally told you that it's a recurring pattern, and you
didn't even make a hook or a gate or improve anything. You said, oh, it's gonna be better next
time, and you're gonna forget after the context expires... Do we have a gate that you actually
improve or make a gate or hook once I tell you it's a reoccurring pattern?" Until now: no, the
recurrence flag only INJECTED advice at prompt time; nothing blocked a turn that ended with a
memory file and a promise. This is that gate.

Fires (Stop, exit 2) when a USER message in this turn window contains recurrence language
(recurring/reoccurring pattern, "keep doing/making/forgetting", "again and again", "every time",
"told you (multiple|many) times") AND no ENFORCEMENT surface changed after that message:
scripts/hooks/**, .claude/hooks/**, ~/.claude/hooks/**, _design-system/REJECTED_TREATMENTS.json,
or a settings.json hooks array; AND the final assistant message does not explicitly declare
"not mechanically hookable because <reason>".

Memory files and skill edits do NOT count as enforcement (the estate's own doctrine: advice
gets outranked under task focus; a gate does not).

Fail-open on any internal error. Escape: echo "<reason>" > .claude/recurrence-harden-skip.flag
(30-min TTL, non-blank reason required).
"""
import json
import os
import re
import sys
import time

RECUR_PAT = re.compile(
    r"(re[- ]?(cc?urr?ing|occurr?ing)\s+pattern|keep (doing|making|forgetting|reading|adding)|"
    r"again and again|every ?time|over and over|told (you|u) (multiple|many|\d+) times)", re.I)
# Harness/hook feedback is stored as user-role lines; it quotes recurrence phrases and must NEVER
# count as the owner flagging a pattern (first live firing 2026-07-15 was exactly this false positive:
# the checkbox gate's own text "you keep forgetting" re-triggered this gate).
HARNESS_PAT = re.compile(
    r"(Stop hook|hook feedback|hook additional context|hook success|hook error|system-reminder|"
    r"CHECKBOX WITHOUT EVIDENCE|UNFINISHED-BATCH|GATE v?\d|[a-z-]+-gate\.py|task-notification)", re.I)
# v2, 2026-08-05, fix-up-me sweep. This was satisfied by the words "not mechanically hookable
# because" with NOTHING after them , the escape from the harden mandate required no reason at all,
# only the shape of one. It now needs a real clause: at least a few words naming why, and it may
# not simply trail off. This is the escape from the rule that turns a repeat into a gate, so it is
# the last place an empty "because" should have been legal.
NOT_HOOKABLE_PAT = re.compile(
    r"not mechanically hookable because\s+(?=\S)(?:\w+\W+){3,}", re.I)

# 2026-08-07, owner: "you tell me this problem, right, and your behavioral problems, but then you
# don't make any fix, you don't make any hooks, you don't make any gates... that's also something
# we need a gate for."
#
# The original gate fires only when HE names a recurrence. This arm fires when *I* diagnose my own
# behaviour in the closing message and ship nothing that changes it. That was the whole shape of
# 2026-08-07: several long, accurate self-diagnoses handed over as prose, with the diagnosis itself
# presented as the deliverable. A named problem with no enforcement change is a confession, not a
# fix, and it costs him a turn to discover that.
#
# Deliberately narrow so it stays objective: it needs a FIRST-PERSON statement about my own
# pattern, not any admission of a one-off mistake. "I got that wrong" does not trip it. "I keep
# doing X" does.
SELF_DIAGNOSIS_PAT = re.compile(
    r"\b(i|my)\b[^.\n]{0,60}\b("
    r"keep (doing|making|writing|sending|treating|reading|stopping|repeating|forgetting)"
    r"|kept (doing|treating|reading|repeating)"
    r"|(have|had|has) been (treating|using|reading|doing|writing|sending)"
    r"|the (loop|pattern|behaviou?r|failure mode) (is|was)"
    r"|that is (the|my) (pattern|behaviou?r|failure)"
    r"|root cause (is|was) (me|my|mine)"
    r")", re.I)

def project_dir():
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

def flag_ok(pdir):
    f = os.path.join(pdir, ".claude", "recurrence-harden-skip.flag")
    try:
        if not os.path.isfile(f):
            return False
        age = time.time() - os.stat(f).st_mtime
        reason = open(f, encoding="utf-8").readline().strip()
        return age < 1800 and bool(reason)
    except OSError:
        return False

def scan_transcript(path):
    """Return (ts_of_last_recurrence_user_msg, final_assistant_text)."""
    recur_ts, final = None, ""
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                try:
                    j = json.loads(line)
                except Exception:
                    continue
                m = j.get("message") or {}
                role = m.get("role")
                content = m.get("content")
                text = ""
                if isinstance(content, str):
                    text = content
                elif isinstance(content, list):
                    text = " ".join(c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text")
                if role == "user" and text and RECUR_PAT.search(text) and not HARNESS_PAT.search(text):
                    ts = j.get("timestamp")
                    if ts:
                        recur_ts = ts
                elif role == "assistant" and text.strip():
                    final = text
    except OSError:
        return None, ""
    return recur_ts, final

def parse_ts(ts):
    import datetime
    try:
        return datetime.datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
    except Exception:
        return None

PENDING_ARM_REL = os.path.join("_plans", "PENDING_ARM.md")


def _settings_blobs(pdir):
    """Every settings file that can arm a hook, as raw text. Missing files are skipped."""
    out = []
    for p in (os.path.expanduser("~/.claude/settings.json"),
              os.path.expanduser("~/.claude/settings.local.json"),
              os.path.join(pdir, ".claude", "settings.json"),
              os.path.join(pdir, ".claude", "settings.local.json")):
        try:
            out.append(open(p, encoding="utf-8").read())
        except OSError:
            continue
    return out


def _aggregator_members(pdir):
    """Every hook dispatched BY an aggregator that is itself armed.

    A check can be live without appearing in any settings file. Four aggregators now dispatch
    their members by subprocess, so the member's name is inside the aggregator's source, not in
    settings.json. Added 2026-08-24 after this gate reported finish-autonomously-gate.py as
    "NOTHING RUNS IT" in the same turn that that very file refused the message, through
    batch-family-aggregator.py. It runs. This gate could not see how.
    """
    named = set()
    blobs = _settings_blobs(pdir)
    hooks_dir = os.path.expanduser("~/.claude/hooks")
    try:
        entries = os.listdir(hooks_dir)
    except OSError:
        return named
    for fn in entries:
        if "aggregator" not in fn or not fn.endswith(".py"):
            continue
        # the aggregator itself must be armed, or its members are not live either
        if not any(fn in blob for blob in blobs):
            continue
        try:
            src = open(os.path.join(hooks_dir, fn), encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        # only the MEMBERS list, never the whole file, so a name merely discussed in a comment
        # (several aggregators explain by name which hooks they deliberately EXCLUDE) is not
        # mistaken for a member.
        m = re.search(r"MEMBERS\s*=\s*\[(.*?)\]", src, re.S)
        if m:
            named.update(re.findall(r"([\w-]+\.py)", m.group(1)))
    return named


def _settings_commands(pdir):
    """Only the strings a settings file will actually EXECUTE, never its prose.

    A NAME IS NOT A WIRE. The old check asked whether the basename appeared anywhere in the
    settings text, so a hook mentioned in a comment counted as armed. Found 2026-08-24 with a
    control: no-irreversible-delete-gate.py was deliberately left OFF that day and the reason was
    written into a note inside settings.json. That note made the gate report it as armed. A check
    whose whole job is spotting enforcement that does not run was being fooled by prose about
    enforcement that does not run.
    """
    cmds = []
    for p in (os.path.expanduser("~/.claude/settings.json"),
              os.path.expanduser("~/.claude/settings.local.json"),
              os.path.join(pdir, ".claude", "settings.json"),
              os.path.join(pdir, ".claude", "settings.local.json")):
        try:
            conf = json.load(open(p, encoding="utf-8"))
        except Exception:
            continue
        for groups in (conf.get("hooks") or {}).values():
            for g in groups or []:
                for h in g.get("hooks", []) or []:
                    cmds.append(str(h.get("command", "")))
    return cmds


def is_armed(basename, pdir):
    """Enforcement if a settings file EXECUTES it, or an armed aggregator dispatches it."""
    if any(basename in c for c in _settings_commands(pdir)):
        return True
    return basename in _aggregator_members(pdir)


def recorded_pending_arm(pdir, basename):
    """An un-armable gate counts ONLY if it is written down where the next session will see it."""
    try:
        return basename in open(os.path.join(pdir, PENDING_ARM_REL), encoding="utf-8").read()
    except OSError:
        return False


def enforcement_built_since(pdir, since_epoch):
    """What enforcement did THIS session actually build, and is it live?

    Returns (path, armed) or (None, False).

    Rewritten 2026-08-07 after the owner asked why hardening never sticks. Three measured holes
    in the mtime version this replaces:

      1. RELEVANCE WAS NEVER CHECKED, AND THE DIRS ARE SHARED. It accepted any file in
         scripts/hooks, .claude/hooks or ~/.claude/hooks whose mtime beat the message. This repo
         has 33 live worktrees all sharing ~/.claude/hooks, so a completely unrelated edit in
         another session silently satisfied this gate here. A sibling's work is not my harden.
      2. MTIME IS NOT AUTHORSHIP. Same bug found the same day in visual-deliverable-gate and
         mockup-lang-stop-gate: a worktree checkout restamps every file, so 9 files in
         .claude/hooks carried an identical fresh stamp nobody had written. Project-side
         detection now comes from git via _session_files.
      3. IT NEVER CHECKED THE GATE WAS ARMED. This is the actual answer to "we keep forgetting".
         A hook file on disk that no settings.json runs enforces NOTHING, and 48 of the 211
         global hooks are in exactly that state. The old gate accepted the file and let the turn
         close, so the pattern recurred in the next session with a dead gate sitting next to it.

    A sandboxed session cannot write settings.json at all (PermissionError, measured on both the
    global and the project file). So an un-armable gate is not treated as a failure. It is only
    accepted once it is recorded in _plans/PENDING_ARM.md, which is committed and therefore
    reaches the session that CAN arm it. Silent loss is the thing being removed, not the
    sandbox limitation.
    """
    sys.path.insert(0, os.path.join(pdir, "scripts", "hooks"))
    try:
        from _session_files import files_written_this_session
        written = files_written_this_session(pdir, since_epoch)
    except Exception:
        written = set()

    # Collect every candidate, then PREFER a live one. Returning the first alphabetical match
    # would report an unrelated helper as "the harden, unarmed" while a properly wired gate sat
    # further down the list, which is how a correct turn would get blocked.
    ENFORCEMENT = ("scripts/hooks/", ".claude/hooks/", ".claude/settings")
    candidates = []
    for rel in sorted(written):
        if not (rel.endswith("REJECTED_TREATMENTS.json") or rel.startswith(ENFORCEMENT)):
            continue
        if rel.startswith(".claude/settings") or rel.endswith("REJECTED_TREATMENTS.json"):
            return rel, True
        base = os.path.basename(rel)
        if base.startswith("_") or base.startswith("test"):
            continue  # a shared helper or a test probe is not itself enforcement
        candidates.append((rel, is_armed(base, pdir) or recorded_pending_arm(pdir, base)))
    for rel, live in candidates:
        if live:
            return rel, True
    if candidates:
        return candidates[0]

    # ~/.claude/hooks is not a git repo, so git cannot attribute it. mtime is the only signal
    # available there, and it stays gated on being armed so a dead file cannot close the turn.
    home_hooks = os.path.expanduser("~/.claude/hooks")
    if os.path.isdir(home_hooks):
        for fn in sorted(os.listdir(home_hooks)):
            p = os.path.join(home_hooks, fn)
            try:
                if os.path.isfile(p) and os.stat(p).st_mtime > since_epoch:
                    return p, is_armed(fn, pdir) or recorded_pending_arm(pdir, fn)
            except OSError:
                continue
    return None, False

def main():
    try:
        data = json.load(sys.stdin)
        # One refusal per turn (2026-08-23). `stop_hook_active` is true on every re-run
        # after this check already blocked, so returning success here is what stops the
        # same objection being raised against message after message. The product force-
        # ends the turn after 8 consecutive blocks anyway, so a run past one is wasted.
        if data.get("stop_hook_active"):
            sys.exit(0)
    except Exception:
        return 0
    pdir = project_dir()
    if flag_ok(pdir):
        return 0
    tp = data.get("transcript_path", "")
    if not tp:
        return 0
    recur_ts, final = scan_transcript(tp)

    # ARM 2 (2026-08-07): I diagnosed my OWN behaviour pattern in the closing message. Same demand
    # as when he names it, because a named problem with no enforcement change is a confession and
    # not a fix. Anchored to the last user message rather than to a recurrence flag, since there
    # may not be one.
    self_diag = bool(SELF_DIAGNOSIS_PAT.search(final or ""))
    if not recur_ts and self_diag:
        last_user_ts = None
        try:
            for line in open(tp, encoding="utf-8"):
                try:
                    j = json.loads(line)
                except Exception:
                    continue
                m = j.get("message") or {}
                if m.get("role") == "user" and j.get("timestamp"):
                    last_user_ts = j["timestamp"]
        except OSError:
            pass
        recur_ts = last_user_ts

    if not recur_ts:
        return 0
    since = parse_ts(recur_ts)
    if since is None:
        return 0
    if time.time() - since > 6 * 3600:
        return 0  # stale flag from an old part of a long transcript, do not re-litigate forever
    if NOT_HOOKABLE_PAT.search(final or ""):
        return 0
    hit, armed = enforcement_built_since(pdir, since)
    if hit and armed:
        return 0
    if hit and not armed:
        print(
            "RECURRENCE-HARDEN GATE, HALF DONE: you built enforcement (" + str(hit) + ") but NOTHING "
            "RUNS IT. No settings.json references it, so it sits on disk enforcing zero, which is how "
            "the pattern comes back next session with a dead gate beside it (48 of the 211 global "
            "hooks are already in that state). Either (1) wire it into a settings.json hooks array, "
            "or (2) if this session cannot write settings.json, add one line naming the file to "
            "_plans/PENDING_ARM.md and COMMIT it, so the session that can arm it will see it. A gate "
            "nobody runs is a promise with a .py extension. Escape: "
            'echo "<reason>" > .claude/recurrence-harden-skip.flag (30-min).',
            file=sys.stderr,
        )
        return 2
    print(
        "RECURRENCE-HARDEN GATE (owner 2026-07-15: 'you didn't even make a hook or a gate'): the owner "
        "flagged a RECURRING pattern this turn, and THIS SESSION built no enforcement since that "
        "message (git-proven changes under scripts/hooks/**, .claude/hooks/**, .claude/settings*, "
        "REJECTED_TREATMENTS.json, or a fresh ~/.claude/hooks file). A memory file or a promise is NOT "
        "a harden: advice gets outranked under task focus, a gate does not. Either (1) build/extend "
        "the gate NOW, self-test it (one should-block + one should-pass), and wire it or record it in "
        "_plans/PENDING_ARM.md, or (2) state in the closing message: 'not mechanically hookable "
        "because <concrete reason>' plus the non-gate reinforcement you did instead. Escape: "
        'echo "<reason>" > .claude/recurrence-harden-skip.flag (30-min).',
        file=sys.stderr,
    )
    return 2

def selftest():
    import datetime
    import subprocess
    import tempfile
    pdir = project_dir()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    old_iso = "2026-07-10T00:00:00+00:00"
    def transcript(user_text, assistant_text, ts):
        tf = tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False)
        tf.write(json.dumps({"timestamp": ts, "message": {"role": "user", "content": [{"type": "text", "text": user_text}]}}) + "\n")
        tf.write(json.dumps({"message": {"role": "assistant", "content": [{"type": "text", "text": assistant_text}]}}) + "\n")
        tf.close()
        return tf.name
    def run(user_text, assistant_text, ts=now_iso, extra_env=None):
        payload = json.dumps({"transcript_path": transcript(user_text, assistant_text, ts)})
        env = {**os.environ, "CLAUDE_PROJECT_DIR": extra_env or pdir}
        r = subprocess.run([sys.executable, __file__], input=payload, capture_output=True, text=True, env=env)
        return r.returncode
    def git_project():
        """A real git repo, because enforcement is now proven by git and not by mtime."""
        d = tempfile.mkdtemp()
        for a in (["init", "-q"], ["config", "user.email", "t@t.t"], ["config", "user.name", "t"]):
            subprocess.run(["git", "-C", d, *a], capture_output=True)
        os.makedirs(os.path.join(d, "scripts", "hooks"), exist_ok=True)
        os.makedirs(os.path.join(d, ".claude"), exist_ok=True)
        open(os.path.join(d, "readme.md"), "w").write("x")
        subprocess.run(["git", "-C", d, "add", "-A"], capture_output=True)
        subprocess.run(["git", "-C", d, "commit", "-q", "-m", "base"], capture_output=True)
        # the helper must be importable from the fake project
        import shutil
        shutil.copy(os.path.join(pdir, "scripts", "hooks", "_session_files.py"),
                    os.path.join(d, "scripts", "hooks", "_session_files.py"))
        subprocess.run(["git", "-C", d, "add", "-A"], capture_output=True)
        subprocess.run(["git", "-C", d, "commit", "-q", "-m", "helper"], capture_output=True)
        return d

    # Case 1 SHOULD BLOCK: recurrence flagged NOW, no enforcement built
    empty = git_project()
    c1 = run("this is a reccuring pattern, you keep doing it", "sorry, I saved a memory so next time is better", extra_env=empty)
    # Case 1b SHOULD BLOCK (the hole this rewrite closes): a gate file written but ARMED NOWHERE
    open(os.path.join(empty, "scripts", "hooks", "new-gate.py"), "w").write("# gate")
    c1b = run("this is a reccuring pattern, you keep doing it", "gate built", extra_env=empty)
    # Case 2 SHOULD PASS: the same gate, now actually referenced by a settings.json
    with open(os.path.join(empty, ".claude", "settings.json"), "w") as fh:
        json.dump({"hooks": {"Stop": [{"hooks": [{"command": "python3 scripts/hooks/new-gate.py"}]}]}}, fh)
    c2 = run("this is a reccuring pattern, you keep doing it", "gate built and wired", extra_env=empty)
    # Case 2c SHOULD PASS: un-armable session, but the gate is recorded in the committed PENDING_ARM list
    empty4 = git_project()
    open(os.path.join(empty4, "scripts", "hooks", "pending-gate.py"), "w").write("# gate")
    os.makedirs(os.path.join(empty4, "_plans"), exist_ok=True)
    with open(os.path.join(empty4, "_plans", "PENDING_ARM.md"), "w") as fh:
        fh.write("- pending-gate.py : Stop, needs arming\n")
    c2c = run("this is a reccuring pattern, you keep doing it", "gate built, cannot arm here", extra_env=empty4)
    # Case 2b SHOULD PASS: harness feedback quoting recurrence language is NOT an owner flag
    empty3 = git_project()
    c2b = run("Stop hook feedback: CHECKBOX WITHOUT EVIDENCE, this is the mechanism behind you keep forgetting", "boxes fixed", extra_env=empty3)
    # Case 3 SHOULD PASS: no recurrence language at all
    c3 = run("looks good, continue with the next item", "done", extra_env=empty)
    # Case 4 SHOULD PASS: recurrence + explicit not-hookable declaration
    empty2 = git_project()
    c4 = run("you keep forgetting this, recurring pattern", "this one is not mechanically hookable because it is a judgment call; reinforced via the reviewer checklist instead", extra_env=empty2)

    cases = [
        ("flagged, nothing built", c1, 2),
        ("flagged, gate built but ARMED NOWHERE", c1b, 2),
        ("flagged, gate built and wired", c2, 0),
        ("flagged, un-armable but in PENDING_ARM.md", c2c, 0),
        ("harness feedback, not an owner flag", c2b, 0),
        ("no recurrence language", c3, 0),
        ("declared not mechanically hookable", c4, 0),
    ]
    good = True
    for name, got, want in cases:
        hit = got == want
        good = good and hit
        print(f"{name}: exit {got} (want {want}) {'ok' if hit else ('MISS' if want == 2 else 'FALSE-POSITIVE')}")
    print("SELFTEST", "OK" if good else "FAILED")
    return 0 if good else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
