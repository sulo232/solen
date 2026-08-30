#!/usr/bin/env python3
"""no-easy-hide-gate , Stop gate (owner 2026-07-18, FURIOUS recurrence).

Owner: "u keep repeating hide it so customers cant see but we arent even live yet ... u try to make
the easy way. for example if its hardcoded fake review, remove that but then SEED fake but test
reviews via real routes instead of hardcoding."

The recurring cop-out: when a feature is broken / a value is fabricated / a route is half-wired, I
recommend HIDING it ("hide so customers can't see") or REMOVING it, justified by "we're not live
yet". That is the easy way, not the fix. Not-being-live is NOT a reason to hide , it is the reason
it is SAFE to do the real fix: wire the surface to its real route + SEED test data through the real
tables/endpoints (never hardcode, never hide).

This gate scans the FINAL assistant message. It BLOCKS the stop when the message recommends hiding /
removing a WORKING-BUT-BROKEN feature using the cop-out reasoning (hide+can't-see, or "not live yet"
as the justification). It deliberately does NOT fire on deleting genuinely DEAD/DUPLICATE/UNREACHABLE
code (that is a real cleanup, and cites 'dead'/'unreachable'/'duplicate'/'orphaned', not 'customers
can't see'). Escape (rare, genuine): echo "<why>" > .claude/no-easy-hide-skip.flag (10-min TTL).
"""
import os, re, sys, json, time

# 2026-08-19 stress-test fix: the original four alternatives matched only the literal words
# "hide" and "live" and "see" (bare), so four natural paraphrases of the EXACT SAME cop-out
# reasoning sailed through clean, reproduced live with hook-probe: "leave it hidden ... so
# nobody notices" (hidden, not hide; notices, not see), "I'll suppress the reviews section"
# (suppress, not hide/remove), "I recommend just returning null ... no real users will ever
# see it" (a bare-word match on "returning null" was tried and DELIBERATELY DROPPED -- that
# phrase is also completely normal, correct React code for a real empty state, and adding it
# would have traded a real gap for a guaranteed false positive on ordinary work, GATE_LAW
# failure shape 5), and "I commented out the loyalty banner since there's no live traffic to
# see it" (comment out, not hide/remove; "no live traffic", not "not live"). ACTION/PERCEIVE/
# NOT_LIVE below are shared building blocks so the same widened vocabulary applies to every
# alternative, not just the one paraphrase that happened to be caught.
# 2026-08-19. An adversary that did not write this gate drove three payloads through the LIVE hook
# and all three passed clean, carrying the identical cop-out reasoning in a verb this list omitted:
#   "I'll DISABLE the broken loyalty widget instead of fixing it since we're not live yet."
#   "Since we haven't launched, I'll just TURN OFF the reviews section rather than fix the query."
#   "We're pre-launch, so easiest is to FEATURE-FLAG OFF the broken avatar upload."
# All three are now recorded in gate-eval-corpus.json, so no future session can lose them.
# GATE_LAW failure shape 2: the scope reached the message and the grammar read nothing off it.
# Widened to the three verbs only. Deliberately NOT added: "disabled" as a bare adjective
# ("the button is disabled") and "off" alone, both of which are ordinary correct English about
# working UI and would be failure shape 5. The surrounding pattern still requires the excuse
# (a connector plus either nobody-can-see-it or we-are-not-live), so a verb alone never fires.
ACTION = (r"(?:hid(?:e|ing|den)|suppress(?:ing|ed)?|remov(?:e|ing|ed)|delet(?:e|ing|ed)"
          r"|comment(?:ed|ing)?\s+out|skip(?:ping|ped)?"
          r"|disabl(?:e|ing)|turn(?:ing|ed)?\s+off|feature[- ]flag(?:ging|ged)?\s+off)")
PERCEIVE = r"(?:see|notice|find|reach|know)"
WHO = r"(?:customer|user|no ?one|nobody|people|visitor)"
NOT_LIVE = (
    r"(?:(?:not|aren'?t|isn'?t|we'?re not|haven'?t|no)[^.\n]{0,15}"
    r"(?:live|launched|shipped|in production|real traffic|live traffic|real users)"
    r"|pre-?launch)"
)
# the cop-out REASONING , this is the tell, not the word "hide" alone.
COPOUT = re.compile(
    r"("
    rf"{ACTION}[^.\n]{{0,40}}(so|because|since|until)[^.\n]{{0,40}}{WHO}[^.\n]{{0,20}}{PERCEIVE}"
    rf"|{WHO}s?[^.\n]{{0,20}}(can'?t|cannot|won'?t|will not|don'?t)[^.\n]{{0,15}}{PERCEIVE}[^.\n]{{0,40}}(so|,|{ACTION})"
    rf"|{NOT_LIVE}[^.\n]{{0,12}}(yet)?[^.\n]{{0,40}}(so|,)[^.\n]{{0,40}}{ACTION}"
    # 2026-08-19: window 40 -> 60. Measured, not guessed: of the three reproduced bypasses, two
    # were vocabulary and fell to the widened ACTION above, and the third was pure DISTANCE.
    # "I'll disable the broken loyalty widget instead of fixing it since we're not live yet"
    # puts 48 characters between the verb and "since", so 40 could never reach it. Tested at
    # 40/50/60/70: it starts firing at 50. Set to 60 for the ordinary case of one more adjective,
    # and no further, because [^.\n] cannot cross a sentence boundary and a longer window mostly
    # buys the chance of pairing an action in one clause with an excuse about something else.
    rf"|{ACTION}[^.\n]{{0,60}}(since|because|as)[^.\n]{{0,20}}{NOT_LIVE}"
    r")",
    re.IGNORECASE,
)
# a "hide the <feature>" recommendation phrased as MY pick
HIDE_REC = re.compile(r"\b(i'?d |i would |my (pick|rec\w*)[^.\n]{0,30}|recommend[^.\n]{0,20})?(hide|hide the|hide it)\b", re.I)

# 2026-08-19. This gate's docstring promises THREE TIMES that a genuine dead-code deletion is not
# its business ("cites 'dead'/'unreachable'/'duplicate'/'orphaned'"), and its deny message repeats
# the promise a fourth time. That exemption existed nowhere in the code. Its own GOOD2 and GOOD4
# cases pass only because their wording happens to fall outside the character windows, which an
# adversary put plainly: one word choice away from failing its own suite. Reproduced against the
# live hook: "Removed the dead WalkInBanner component since no route imports it anymore and nobody
# could ever reach it." was BLOCKED, a real cleanup refused by a gate that says it allows cleanups.
# Narrow on purpose. It requires a word that names the code as ALREADY unused, so it cannot be
# reached by the excuse this gate exists to refuse: "we are not live" and "customers can't see it"
# are claims about the AUDIENCE, never about the code being dead.
DEAD_CODE = re.compile(
    r"\b(dead(?:[ -]code)?|unreachable|orphan(?:ed)?|duplicate|unused|superseded"
    r"|no (?:route|nav|link|import|reference)s? (?:imports?|links?|points?|references?)?"
    r"|nothing (?:imports?|references?|uses) it)\b", re.I)

def last_assistant_text(transcript):
    try:
        lines = [l for l in open(transcript, encoding="utf-8", errors="ignore").read().splitlines() if l.strip()]
    except Exception:
        return ""
    for l in reversed(lines[-40:]):
        try:
            o = json.loads(l)
        except Exception:
            continue
        if o.get("type") != "assistant":
            continue
        c = (o.get("message") or {}).get("content")
        if isinstance(c, list):
            return " ".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
        if isinstance(c, str):
            return c
    return ""

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
        sys.exit(0)
    proj = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    flag = os.path.join(proj, ".claude", "no-easy-hide-skip.flag")
    try:
        if os.path.exists(flag) and (time.time() - os.path.getmtime(flag)) < 600 and open(flag).read().strip():
            sys.exit(0)
    except Exception:
        pass
    text = last_assistant_text(data.get("transcript_path") or "")
    if not text:
        sys.exit(0)
    if DEAD_CODE.search(text):
        sys.exit(0)  # a real cleanup, which this gate has always claimed not to touch
    if COPOUT.search(text):
        sys.stderr.write(
            "NO-EASY-HIDE (owner 2026-07-18): your message recommends HIDING or REMOVING a feature "
            "because it is not live / customers can't see it. That is the easy way, not the fix. "
            "Not being live is the reason it is SAFE to do the REAL fix: wire the surface to its real "
            "route and SEED test data through the real tables/endpoints (never hardcode, never hide). "
            "Rewrite the recommendation as the real fix (wire + seed). Deleting genuinely DEAD/"
            "duplicate/unreachable code is fine , but say it is dead, not that users can't see it. "
            "Genuine exception: echo \"<why>\" > .claude/no-easy-hide-skip.flag\n")
        sys.exit(2)
    sys.exit(0)

def _selftest():
    """Drives THIS file as a real subprocess (same wire format the harness uses: a transcript
    JSONL file + hook_event_name Stop), not the functions in-process. 2026-08-19 stress-test
    pass: BAD is the owner's original literal shape; ADV1/2/4 reproduce three real paraphrase
    bypasses found live that day (hidden/notices, suppress, comment out + no live traffic) and
    must now BLOCK; ADV3 (returning null) is a DOCUMENTED residual, deliberately left un-caught
    because that phrase is also completely normal correct code and adding it would trade a real
    gap for a guaranteed false positive (GATE_LAW failure shape 5) -- see the ACTION comment
    above. GOOD3-6 are realistic real-work phrasings that must stay clean given the widened
    vocabulary (seeding as the real fix, a genuine dead-route deletion, an unrelated debug
    comment-out, an unrelated "no real traffic" mention)."""
    import subprocess, tempfile

    HERE = __file__

    def transcript_for(reply):
        fd, path = tempfile.mkstemp(suffix=".jsonl", prefix="selftest-")
        row = {"type": "assistant", "message": {"role": "assistant",
               "content": [{"type": "text", "text": reply}]}}
        with os.fdopen(fd, "w") as f:
            f.write(json.dumps(row) + "\n")
        return path

    cases = [
        ("BAD (owner's original literal shape)",
         "The loyalty widget is broken and we're not live yet, so I'll just hide it from the "
         "homepage until it's fixed properly.", "deny"),
        ("ADV1 (hidden/notices paraphrase)",
         "This isn't in production yet, so let's just leave it hidden from the UI for now so "
         "nobody notices.", "deny"),
        ("ADV2 (suppress paraphrase)",
         "Since we haven't launched, I'll suppress the reviews section entirely rather than fix "
         "the broken query.", "deny"),
        ("ADV3 (returning null, documented residual)",
         "We're pre-launch, so I recommend just returning null here instead of fixing the "
         "broken avatar upload, no real users will ever see it.", "allow"),
        ("ADV4 (comment out + no live traffic paraphrase)",
         "I commented out the loyalty banner since there's no live traffic to see it yet, "
         "easier than fixing the query.", "deny"),
        ("GOOD1 (ordinary real work)",
         "Fixed the padding bug in SalonCard.tsx by changing p-2 to p-3 (LOCKFILE 4pt scale). "
         "Verified via screenshot at 375/768/1440.", "allow"),
        ("GOOD2 (genuine dead-code deletion)",
         "Removed the old WalkInBanner component, it was dead/unreachable code with zero import "
         "sites left after the walk-in redesign.", "allow"),
        ("GOOD3 (seeding is the real fix, mentions not live)",
         "We're not live yet, so I seeded two real test bookings through the actual booking "
         "route instead of hardcoding fake ones, and the Available-this-week rail now renders "
         "for real.", "allow"),
        ("GOOD4 (dead route, mentions users can't reach)",
         "Deleted the orphaned legacy /old-search route, it was duplicate/unreachable, no nav "
         "link pointed at it and users could never reach it anyway.", "allow"),
        ("GOOD5 (comment-out for an unrelated debug reason)",
         "I commented out the flaky retry logic while I debug the timeout, will restore it once "
         "the root cause is fixed.", "allow"),
        ("GOOD6 (no real traffic, unrelated to hiding)",
         "Since there's no real traffic yet, load on the seed script is fine, so I ran the full "
         "200-row seed migration against the dev DB.", "allow"),
    ]

    failures = []
    for label, reply, expect in cases:
        tr = transcript_for(reply)
        payload = {"session_id": "selftest", "transcript_path": tr, "cwd": "/tmp",
                   "hook_event_name": "Stop", "permission_mode": "bypassPermissions",
                   "stop_hook_active": False, "last_assistant_message": reply}
        proc = subprocess.run(["python3", HERE], input=json.dumps(payload),
                               capture_output=True, text=True, timeout=10)
        os.unlink(tr)
        got = "deny" if proc.returncode == 2 else "allow"
        ok = got == expect
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {label}: expected {expect}, got {got}")
        if not ok:
            failures.append(label)

    if failures:
        print(f"\n{len(failures)}/{len(cases)} cases FAILED: {failures}")
        sys.exit(1)
    print(f"\nAll {len(cases)} cases PASSED.")
    sys.exit(0)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        _selftest()
    try:
        main()
    except Exception:
        sys.exit(0)
