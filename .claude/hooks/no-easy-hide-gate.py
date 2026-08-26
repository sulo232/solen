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

# the cop-out REASONING , this is the tell, not the word "hide" alone.
COPOUT = re.compile(
    r"("
    r"hide[^.\n]{0,40}(so|because|since|until)[^.\n]{0,40}(customer|user|no ?one|nobody|people|visitor)[^.\n]{0,20}(see|notice|find|reach)"
    r"|(customer|user|no ?one|nobody|visitor)s?[^.\n]{0,20}(can'?t|cannot|won'?t|will not|don'?t)[^.\n]{0,15}see[^.\n]{0,40}(so|,|hide|remove)"
    r"|(not|aren'?t|isn'?t|we'?re not)[^.\n]{0,15}live[^.\n]{0,12}(yet)?[^.\n]{0,40}(so|,)[^.\n]{0,40}(hide|remove|delete|leave|skip)"
    r"|(hide|remove|delete)[^.\n]{0,40}(since|because|as)[^.\n]{0,20}(not|aren'?t|we'?re not)[^.\n]{0,12}live"
    r")",
    re.IGNORECASE,
)
# a "hide the <feature>" recommendation phrased as MY pick
HIDE_REC = re.compile(r"\b(i'?d |i would |my (pick|rec\w*)[^.\n]{0,30}|recommend[^.\n]{0,20})?(hide|hide the|hide it)\b", re.I)

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

if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
