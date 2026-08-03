#!/usr/bin/env python3
"""reply-repeat-gate.py , Stop gate.

OWNER, 2026-07-31: "You keep repeating the same thing twice. Fix that."

THE MECHANISM, and it is not forgetfulness. A Stop gate blocks the closing reply over one small
thing, for example "name the branch next to the link". The correct response is a one-line fix. What
I do instead is re-send the WHOLE message with the branch added, so he reads five near-identical
paragraphs to find the six new words. Across a handful of gate blocks in one turn he read the same
reply four or five times.

The gates are right to block. The repetition is mine.

THE RULE. If this closing message is largely the same as ANY message already sent this turn, block.
Send only what changed. He already read the rest.

v4, 2026-08-03, from the preference audit. v3 compared only against the IMMEDIATELY previous reply,
so [A, B, A] , a verbatim re-send two replies apart , scored 0.02 and passed while he read A twice.
Measured, not theorised: the real transcripts for 2026-07-27..08-03 carry 402 blocked stop attempts,
76% of them blocked by two or more gates at once and 181 by three or more, which is exactly the
reply / gate / delta / gate / full-reply shape that hides a repeat behind one intervening message.
v4 compares against every reply still in the rolling history (_replymemory keeps 6).

Similarity is measured on normalised prose with difflib, ignoring links, code and whitespace, so
that adding a branch name or a measurement to an otherwise identical message still reads as a
repeat, which it is.

Deliberately NOT blocked: a genuinely new reply, a short reply (under 400 chars, where repetition
costs him nothing), or the first reply of a turn with nothing to repeat.

Self-test: `--selftest`. Skip: ~/.claude/reply-repeat-skip.flag (non-empty reason, 30 min).
"""
import difflib
import json
import os
import re
import sys
import time

try:
    from _turnboundary import is_owner_turn
except Exception:  # never wedge a turn over a missing helper
    def is_owner_turn(c):
        return isinstance(c, str) and bool(c.strip())

FLAG = os.path.expanduser("~/.claude/reply-repeat-skip.flag")
TTL = 1800
SIMILAR = 0.72     # above this, it is the same message wearing a correction
# Third calibration, and each one was too high. 400 let every real case through. 250 let through the
# repeat he caught on 2026-07-31, because by then I had shortened my replies to about 100 characters
# and was repeating THOSE. The floor kept excusing exactly the case being complained about.
# A repeat is annoying at any length. 80 is low enough that only a genuine one-liner is exempt.
MIN_LEN = 80

CODE = re.compile(r"```.*?```", re.DOTALL)
LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
URL = re.compile(r"https?://\S+")


def norm(text):
    t = CODE.sub(" ", text or "")
    t = LINK.sub(r"\1", t)
    t = URL.sub(" ", t)
    t = re.sub(r"[`*_#>|-]", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip().lower()


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


def load_lines(tp):
    out = []
    with open(tp, encoding="utf-8", errors="ignore") as f:
        for ln in f:
            ln = ln.strip()
            if not ln:
                continue
            try:
                out.append(json.loads(ln))
            except Exception:
                pass
    return out


# THE BUG THAT MADE v1 USELESS, found 2026-07-31 after the owner counted four identical replies.
# A reply that a Stop gate BLOCKS is discarded, not written to the transcript. So this gate looked
# back for "the previous reply", found nothing, and passed. Its logic scored the real repeats at
# 0.79 against a 0.72 threshold, so the comparison was right and the INPUT was always empty. It
# could not see the thing it existed to catch.
#
# The fix: remember each closing reply on disk. Blocked or not, it gets recorded, so the next
# attempt has something real to compare against.
SEEN = os.path.expanduser("~/.claude/.reply-repeat-state.json")


# Use the SHARED memory, not a private copy. On 2026-07-31 I built _replymemory.py, wired it into
# reply-length-gate, and left THIS gate on its own half-working store. He caught the very next
# repeat. Two stores meant two histories, and the one this gate read was not the one being written.
# One store, or the bug comes back through whichever copy nobody updated.
try:
    from _replymemory import remember as _shared_remember
except Exception:
    _shared_remember = None


def remember(reply, owner_key):
    """Append this reply to the shared on-disk history for the current owner turn."""
    if _shared_remember is not None:
        return _shared_remember(reply, owner_key)
    try:
        state = {}
        if os.path.exists(SEEN):
            with open(SEEN, encoding="utf-8") as f:
                state = json.load(f)
        if state.get("turn") != owner_key:
            state = {"turn": owner_key, "replies": []}
        state["replies"] = (state.get("replies") or [])[-4:] + [reply]
        tmp = SEEN + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f)
        os.replace(tmp, SEEN)
        return state["replies"]
    except Exception:
        return [reply]


def last_owner_message(lines):
    """The owner's most recent genuine message, used to key the on-disk history to one turn."""
    for e in reversed(lines):
        if e.get("type") != "user":
            continue
        c = (e.get("message") or {}).get("content")
        if is_owner_turn(c):
            return c
    return ""


def turn_replies(lines):
    """Every assistant text message since the owner's last real message, oldest first.

    Kept for the case where replies DO persist. The on-disk history in remember() is what actually
    carries a blocked reply forward, because the transcript never receives it.
    """
    out = []
    for e in reversed(lines):
        if e.get("type") == "user" and is_owner_turn((e.get("message") or {}).get("content")):
            break
        if e.get("type") != "assistant":
            continue
        c = (e.get("message") or {}).get("content")
        if isinstance(c, str) and c.strip():
            out.append(c)
        elif isinstance(c, list):
            for b in c:
                if isinstance(b, dict) and b.get("type") == "text" and b.get("text", "").strip():
                    out.append(b["text"])
    return list(reversed(out))


def verdict(replies):
    """(block, ratio). Pure, so the self-test drives it directly."""
    if len(replies) < 2:
        return False, 0.0
    cur = norm(replies[-1])
    if len(cur) < MIN_LEN:
        return False, 0.0

    # v4, 2026-08-03. THE HOLE THAT KEPT THIS GATE LOSING, measured against the real transcripts:
    # v3 compared the new reply ONLY against the one immediately before it. Feed it [A, B, A] and
    # it scores the verbatim re-send of A at 0.02 and passes, because it never looks past B. That
    # is not a corner case, it is the normal shape of a blocked turn: reply, gate, a short delta
    # reply, another gate, and then the full message again. He read A twice; the gate saw nothing.
    #
    # He is not comparing consecutive messages. He is reading down the screen. Anything he has
    # ALREADY read this turn is a repeat, however many replies ago it was. So compare against every
    # earlier reply in the turn and take the worst match.
    prevs = [norm(r) for r in replies[:-1]]
    prevs = [p for p in prevs if p]
    if not prevs:
        return False, 0.0

    worst = 0.0
    for prev in prevs:
        # THE OPENING IS WHAT HE READS. v1 could not see blocked replies at all. v2 saw them and
        # compared WHOLE replies, so on 2026-07-31 two messages opening with the identical sentence
        # scored 0.47 and passed, because the second had appended new material further down. That
        # appended material helps him not at all: he reads the first line, recognises it, stops.
        head_ratio = difflib.SequenceMatcher(None, prev[:220], cur[:220]).ratio()
        if head_ratio >= 0.80:
            return True, head_ratio
        worst = max(worst, difflib.SequenceMatcher(None, prev, cur).ratio())

    return worst >= SIMILAR, worst


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    tp = data.get("transcript_path")
    if not tp or not os.path.exists(tp):
        sys.exit(0)
    try:
        lines = load_lines(tp)
        replies = turn_replies(lines)
        # The transcript loses blocked replies, so fold in the on-disk history keyed by the owner's
        # current message. Without this the gate is blind, which is exactly how v1 shipped.
        owner_key = (last_owner_message(lines) or "")[:160]
        if replies:
            replies = remember(replies[-1], owner_key)
    except Exception:
        sys.exit(0)

    block, ratio = verdict(replies)
    if not block:
        sys.exit(0)

    state = check_skip_flag(FLAG, TTL)
    if state == "skip":
        sys.exit(0)
    extra = ""
    if state == "empty":
        extra = ('\n(Your skip flag is EMPTY. Put the reason in it: '
                 'echo "why the repeat is necessary" > ~/.claude/reply-repeat-skip.flag)')

    print(
        "REPLY-REPEAT GATE (owner 2026-07-31: \"You keep repeating the same thing twice. Fix "
        "that.\").\n"
        "\n"
        "This closing message is %d%% identical to the one you just sent him.\n"
        "\n"
        "HOW THIS HAPPENS, so you can stop doing it: a Stop gate blocks over one small thing, say\n"
        "\"name the branch next to the link\". The right answer is a one-line correction. Instead\n"
        "the whole message gets re-sent with the branch added, so he reads five near-identical\n"
        "paragraphs hunting for six new words. Over a few blocks in one turn he read the same\n"
        "reply four times. The gates were right to block; the repetition is yours.\n"
        "\n"
        "SEND ONLY WHAT CHANGED. He has already read the rest. If a gate wanted a branch name, the\n"
        "entire reply is the branch name. If it wanted a measurement, the reply is that number.\n"
        "Do not re-state the link, the summary, the caveats or the apology a second time."
        % round(ratio * 100)
        + extra,
        file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        A = ("Your homepage, phone size. Open it at the tunnel link. No salon appears on the whole "
             "first screen at all, which is the thing worth noticing here. Tell me what to change "
             "and I will mock it up for you next. The gate for long replies is built and armed now.")
        A_PLUS_BRANCH = A.replace("phone size.", "phone size, branch claude/principles-audit.")
        DIFFERENT = ("Direction A wins on the numbers. It gives search 358 pixels instead of 243, "
                     "and it costs exactly one row of vertical height, which is the whole trade "
                     "you are making. B keeps one row but adds a tap before any search happens.")
        SHORT = "Committed as abc1234."
        DIFFERENT2 = ("The nail icon is regenerated with the cap tilted and the brush attached "
                      "inside the bottle, and the pink is sampled from the reference rather than "
                      "picked by eye. It is the third file in the icon set now.")
        CASES = [
            ("1  REAL: same reply, branch added -> BLOCK", True, [A, A_PLUS_BRANCH]),
            ("2  a genuinely different reply -> PASS", False, [A, DIFFERENT]),
            ("3  only one reply so far -> PASS", False, [A]),
            ("4  no replies -> PASS", False, []),
            ("5  short replies cost nothing -> PASS", False, [SHORT, SHORT]),
            ("6  verbatim resend -> BLOCK", True, [A, A]),
            # v4 , the hole that made v3 lose. He reads down the screen, not pairwise.
            ("7  v4 verbatim repeat ONE reply apart -> BLOCK", True, [A, DIFFERENT, A]),
            ("8  v4 near-repeat one apart, branch added -> BLOCK", True, [A, DIFFERENT, A_PLUS_BRANCH]),
            ("9  v4 repeat THREE apart -> BLOCK", True, [A, DIFFERENT, DIFFERENT2, A]),
            ("10 v4 three genuinely different replies -> PASS", False, [A, DIFFERENT, DIFFERENT2]),
            ("11 v4 short delta between two long ones -> PASS on the delta", False, [A, SHORT]),
        ]
        ok = bad = 0
        for name, expect, replies in CASES:
            got, ratio = verdict(replies)
            good = got == expect
            ok += good
            bad += (not good)
            print(("  PASS  " if good else "  FAIL  ") + name
                  + ("" if good else "   expected %s got %s (ratio %.2f)" % (expect, got, ratio)))
        print("\n%d/%d passed" % (ok, ok + bad))
        sys.exit(1 if bad else 0)
    try:
        main()
    except Exception:
        sys.exit(0)  # fail-open, always
