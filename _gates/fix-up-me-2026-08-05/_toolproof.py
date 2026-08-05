"""_toolproof , shared helper: did the work actually HAPPEN this turn?

Born 2026-08-05 from the fix-up-me sweep. All 190 live checks were tested against LAW_SYSTEM
section 2's own admission test , "could the agent satisfy this check by writing a string without
doing the real work?" , and **103 of them could**. Eight were taken to execution: build a payload
that correctly blocks, add nothing but the magic phrase, run again. Eight of eight let it through.

The shape of the defect is identical in nearly every case. The gate wants to know whether a real
action happened (a probe was run, a link was opened, a measurement was taken, a file was read) and
it asks the ASSISTANT'S OWN PROSE whether it happened. Prose is free. So the check tests vocabulary,
not history, and an agent that knows the vocabulary passes with the work undone. I did exactly that
to one of them, in the session that found this, without noticing.

The fix, and it is the same fix every time: the transcript already contains the truth. Stop hooks
get `transcript_path`, the transcript records every `tool_use` block, and the owner's last real
message marks where this turn began. So "did I actually run it" is a structural fact sitting in a
file, not a claim in a sentence.

    from _toolproof import ran_this_turn
    if not ran_this_turn(transcript_path, bash=r"curl|wget", tools={"WebFetch"}):
        block("you said you checked the link, and nothing in this turn opened one")

Fail-open on everything. A missing transcript, a parse error, an unreadable record: the answer is
"cannot tell", and a gate must never block on cannot-tell. That is deliberate , these gates guard
honesty, and a gate that wedges a turn over its own IO error teaches the owner to mute it.
"""
import json
import os
import re

__all__ = ["turn_tool_calls", "ran_this_turn", "owner_turn_start"]


def _records(transcript_path):
    try:
        with open(transcript_path, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    yield json.loads(line)
                except Exception:
                    continue
    except Exception:
        return


def _is_owner_message(rec):
    """A real typed message from the owner, not hook output and not a tool result.

    Hook denials and tool results arrive in the user role too. Counting them as the start of the
    turn would shrink the window to nothing, which would make every gate think no tool ran.
    """
    if rec.get("type") != "user":
        return False
    content = (rec.get("message") or {}).get("content")
    if isinstance(content, list):
        texts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        if not texts:
            return False                      # tool_result only
        content = "\n".join(texts)
    if not isinstance(content, str) or not content.strip():
        return False
    head = content.lstrip()[:200]
    for marker in ("Stop hook feedback:", "[python3 ", "<system-reminder>", "PreToolUse:",
                   "PostToolUse:", "UserPromptSubmit:", "<task-notification>",
                   "<launch-selected-element>", "Caveat: The messages below"):
        if marker in head:
            return False
    return True


def owner_turn_start(transcript_path):
    """Index of the last genuine owner message. -1 when there is none."""
    recs = list(_records(transcript_path))
    for i in range(len(recs) - 1, -1, -1):
        if _is_owner_message(recs[i]):
            return i
    return -1


def turn_tool_calls(transcript_path):
    """[(tool_name, input_dict)] for every tool call since the owner last spoke."""
    recs = list(_records(transcript_path))
    if not recs:
        return []
    start = 0
    for i in range(len(recs) - 1, -1, -1):
        if _is_owner_message(recs[i]):
            start = i
            break
    out = []
    for rec in recs[start:]:
        if rec.get("type") != "assistant":
            continue
        content = (rec.get("message") or {}).get("content")
        if not isinstance(content, list):
            continue
        for b in content:
            if isinstance(b, dict) and b.get("type") == "tool_use":
                out.append((b.get("name") or "", b.get("input") or {}))
    return out


def ran_this_turn(transcript_path, bash=None, tools=None, input_pattern=None, calls=None):
    """Did a real action of this shape happen since the owner's last message?

    bash          regex matched against the command of any Bash call
    tools         set of tool names, any one of which counts on its own
    input_pattern regex matched against the JSON of any call's input, for tool-agnostic proof
    calls         pass a precomputed turn_tool_calls() list to avoid re-reading the transcript

    Returns True only on positive evidence. Anything unreadable returns False, so a caller must
    treat False as "no proof" and decide for itself whether that is worth blocking on.
    """
    try:
        if calls is None:
            calls = turn_tool_calls(transcript_path)
        if not calls:
            return False
        names = {n for n, _ in calls}
        if tools and (set(tools) & names):
            return True
        if bash:
            rx = re.compile(bash, re.I)
            for n, inp in calls:
                if n == "Bash" and rx.search(str(inp.get("command", ""))):
                    return True
        if input_pattern:
            rx = re.compile(input_pattern, re.I)
            for n, inp in calls:
                try:
                    if rx.search(json.dumps(inp)):
                        return True
                except Exception:
                    continue
        return False
    except Exception:
        return False


if __name__ == "__main__":
    import sys
    import tempfile

    def transcript(records):
        fd, path = tempfile.mkstemp(suffix=".jsonl")
        with os.fdopen(fd, "w") as fh:
            for r in records:
                fh.write(json.dumps(r) + "\n")
        return path

    def owner(text):
        return {"type": "user", "timestamp": "t", "message": {"role": "user", "content": text}}

    def hookfeedback(text):
        return {"type": "user", "timestamp": "t",
                "message": {"role": "user", "content": "Stop hook feedback:\n" + text}}

    def toolresult():
        return {"type": "user", "timestamp": "t", "message": {"role": "user", "content": [
            {"type": "tool_result", "content": "ok"}]}}

    def call(name, inp):
        return {"type": "assistant", "timestamp": "t", "message": {"role": "assistant",
                "content": [{"type": "tool_use", "name": name, "input": inp}]}}

    def say(text):
        return {"type": "assistant", "timestamp": "t", "message": {"role": "assistant",
                "content": [{"type": "text", "text": text}]}}

    CASES = []

    t1 = transcript([owner("check the link"), call("Bash", {"command": "curl -I https://x.test"}),
                     say("it responds")])
    CASES.append(("1  a real curl this turn -> proof", True,
                  ran_this_turn(t1, bash=r"\bcurl\b")))

    t2 = transcript([owner("check the link"), say("I checked it, it responds")])
    CASES.append(("2  prose only, no call -> NO proof", False,
                  ran_this_turn(t2, bash=r"\bcurl\b")))

    t3 = transcript([owner("check the link"), call("Bash", {"command": "curl -I https://x.test"}),
                     owner("now do something else"), say("done")])
    CASES.append(("3  the curl was BEFORE his latest message -> NO proof", False,
                  ran_this_turn(t3, bash=r"\bcurl\b")))

    t4 = transcript([owner("look at it"), call("WebFetch", {"url": "https://x.test"}), say("ok")])
    CASES.append(("4  a named tool counts on its own", True,
                  ran_this_turn(t4, tools={"WebFetch"})))

    t5 = transcript([owner("look at it"), hookfeedback("SOME GATE: do better"),
                     call("Bash", {"command": "curl -I https://x.test"}), say("ok")])
    CASES.append(("5  a hook denial does NOT start a new turn", True,
                  ran_this_turn(t5, bash=r"\bcurl\b")))

    t6 = transcript([owner("look at it"), call("Bash", {"command": "curl x"}), toolresult(),
                     say("ok")])
    CASES.append(("6  a tool_result does NOT start a new turn", True,
                  ran_this_turn(t6, bash=r"\bcurl\b")))

    CASES.append(("7  missing transcript -> False, never an exception", False,
                  ran_this_turn("/definitely/not/here.jsonl", bash=r"\bcurl\b")))

    t8 = transcript([owner("measure it"),
                     call("mcp__Claude_Browser__computer", {"action": "screenshot"}), say("ok")])
    CASES.append(("8  input_pattern matches any tool's payload", True,
                  ran_this_turn(t8, input_pattern=r"screenshot")))

    t9 = transcript([owner("hi"), say("no tools at all")])
    CASES.append(("9  a turn with no tool calls -> False", False,
                  ran_this_turn(t9, bash=r".")))

    ok = bad = 0
    for name, expect, got in CASES:
        good = (got == expect)
        ok += good
        bad += (not good)
        print(("  PASS  " if good else "  FAIL  ") + name
              + ("" if good else "   expected %s got %s" % (expect, got)))
    print("\n%d/%d passed" % (ok, ok + bad))
    sys.exit(1 if bad else 0)
