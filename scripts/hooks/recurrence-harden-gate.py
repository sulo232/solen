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

def enforcement_changed_since(pdir, since_epoch):
    roots = [
        os.path.join(pdir, "scripts", "hooks"),
        os.path.join(pdir, ".claude", "hooks"),
        os.path.expanduser("~/.claude/hooks"),
    ]
    singles = [
        os.path.join(pdir, "_design-system", "REJECTED_TREATMENTS.json"),
        os.path.join(pdir, ".claude", "settings.json"),
        os.path.expanduser("~/.claude/settings.json"),
    ]
    for root in roots:
        if not os.path.isdir(root):
            continue
        for fn in os.listdir(root):
            p = os.path.join(root, fn)
            try:
                if os.path.isfile(p) and os.stat(p).st_mtime > since_epoch:
                    return os.path.relpath(p, pdir) if p.startswith(pdir) else p
            except OSError:
                continue
    for p in singles:
        try:
            if os.path.isfile(p) and os.stat(p).st_mtime > since_epoch:
                return p
        except OSError:
            continue
    return None

def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    pdir = project_dir()
    if flag_ok(pdir):
        return 0
    tp = data.get("transcript_path", "")
    if not tp:
        return 0
    recur_ts, final = scan_transcript(tp)
    if not recur_ts:
        return 0
    since = parse_ts(recur_ts)
    if since is None:
        return 0
    if time.time() - since > 6 * 3600:
        return 0  # stale flag from an old part of a long transcript, do not re-litigate forever
    if NOT_HOOKABLE_PAT.search(final or ""):
        return 0
    hit = enforcement_changed_since(pdir, since)
    if hit:
        return 0
    print(
        "RECURRENCE-HARDEN GATE (owner 2026-07-15: 'you didn't even make a hook or a gate'): the owner "
        "flagged a RECURRING pattern this turn, and no enforcement surface changed since that message "
        "(scripts/hooks/**, .claude/hooks/**, ~/.claude/hooks/**, REJECTED_TREATMENTS.json, settings "
        "hooks). A memory file or a promise is NOT a harden: advice gets outranked under task focus, a "
        "gate does not. Either (1) build/extend the gate NOW, self-test it (one should-block + one "
        "should-pass), and wire it, or (2) state in the closing message: 'not mechanically hookable "
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
    # Case 1 SHOULD BLOCK: recurrence flagged NOW, empty project (no enforcement files newer than the message)
    empty = tempfile.mkdtemp()
    c1 = run("this is a reccuring pattern, you keep doing it", "sorry, I saved a memory so next time is better", extra_env=empty)
    # Case 2 SHOULD PASS: same, but an enforcement file in the fake project is newer than the message
    hooks_dir = os.path.join(empty, "scripts", "hooks"); os.makedirs(hooks_dir, exist_ok=True)
    time.sleep(0.05); open(os.path.join(hooks_dir, "new-gate.py"), "w").write("# gate")
    c2 = run("this is a reccuring pattern, you keep doing it", "gate built and wired", extra_env=empty)
    # Case 2b SHOULD PASS: harness feedback quoting recurrence language is NOT an owner flag
    empty3 = tempfile.mkdtemp()
    c2b = run("Stop hook feedback: CHECKBOX WITHOUT EVIDENCE, this is the mechanism behind you keep forgetting", "boxes fixed", extra_env=empty3)
    # Case 3 SHOULD PASS: no recurrence language at all
    c3 = run("looks good, continue with the next item", "done", extra_env=empty)
    # Case 4 SHOULD PASS: recurrence + explicit not-hookable declaration
    empty2 = tempfile.mkdtemp()
    c4 = run("you keep forgetting this, recurring pattern", "this one is not mechanically hookable because it is a judgment call; reinforced via the reviewer checklist instead", extra_env=empty2)
    print(f"flagged+no-gate: {'BLOCK' if c1 == 2 else 'MISS'} | flagged+gate-built: {'PASS' if c2 == 0 else 'FALSE-POSITIVE'} | harness-feedback: {'PASS' if c2b == 0 else 'FALSE-POSITIVE'} | no-flag: {'PASS' if c3 == 0 else 'FALSE-POSITIVE'} | declared-unhookable: {'PASS' if c4 == 0 else 'FALSE-POSITIVE'}")
    good = c1 == 2 and c2 == 0 and c2b == 0 and c3 == 0 and c4 == 0
    print("SELFTEST", "OK" if good else "FAILED")
    return 0 if good else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
