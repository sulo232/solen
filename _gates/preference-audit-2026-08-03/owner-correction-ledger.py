#!/usr/bin/env python3
"""owner-correction-ledger.py , UserPromptSubmit. Inject-only, NEVER blocks.

hook: UserPromptSubmit
matcher:

THE HOLE THIS FILLS, named by the estate's own doctrine.

~/.claude/IMPROVE_SYSTEM.md section 6, "Honest limits", verbatim:

    "Detection keys off ADMISSIONS and self-announced findings; a mistake never admitted in text
     is invisible to this ladder."

The whole self-improvement ladder , durable ledger, 2-session warning, 3-session block, the
harden mandate , hangs off `repeat-mistake-detector.py`, a Stop hook that reads MY OWN closing
message and looks for MY OWN admission. So the counter only ever moves when I confess. A mistake
I do not name is a mistake the estate cannot see, no matter how many times the owner names it.

Measured over 2026-07-27 .. 2026-08-03: the owner corrected the same handful of behaviours more
than thirty times in his own words, and the durable ledger recorded 9 themes for the whole week,
because it was only ever listening to me. The person who actually notices the mistakes had no
write access to the ledger about them.

WHAT THIS DOES. It listens to HIM. When his message carries a correction marker ("you keep",
"i told you", "again", "why did you", "stop", "harden", "how many times") AND a known mistake
theme, it records that theme into the SAME durable ledger the Stop detector writes, keyed by
session exactly the same way. Nothing else changes: the existing escalation ladder, the warning
tier, the 3-session block and the harden mandate all keep working, they simply gain the input
channel they were missing. This is an extension of the existing system, not a second one.

Then it injects one short line naming the theme and its session count, so the current turn knows
it is on repeat N and not on a fresh mistake.

DELIBERATELY NOT A BLOCK. This runs on HIS message. Blocking his prompt to lecture me would be
the single most annoying thing in the estate. It records, it injects one line, it exits.

FALSE POSITIVES, measured rather than hoped. A correction marker and a theme must both be present
AND sit within 240 characters of each other, and slash-command expansions are excluded. Run over
the real corpus of 218 owner messages from that week (`--validate <corpus.json>`) it flags 14, of
which 12 are unambiguous corrections and 2 are marginal: one where "u keep forgetting" genuinely
does attach to previews, and one where the word "link" is dictation garble ("you job link
subregions"). That is the honest rate on real input, which no synthetic self-test can tell you.
It is acceptable here only because this hook never blocks , it records and injects one line.

Self-test: `--selftest`.  Corpus check: `--validate <owner_messages.json>`.
Skip: ~/.claude/owner-correction-skip.flag (non-empty reason, 30 min TTL).
"""
import importlib.util
import json
import os
import re
import sys
import time

STATE_DIR = os.path.expanduser("~/.claude/state")
# Overridable so the self-test can never write into the real durable ledger. Nothing else sets it.
LEDGER = os.environ.get("OWNER_CORRECTION_LEDGER") or os.path.join(STATE_DIR, "mistake-themes-global.json")
FLAG = os.path.expanduser("~/.claude/owner-correction-skip.flag")
TTL = 1800
# MIRROR the detector exactly, or the two halves corrupt each other's history. It STORES for 30
# days and COUNTS over 14. An earlier draft of this file pruned storage at 14 and silently dropped
# five 14-to-30-day-old 'link' sessions on its first run. They were outside the counting window so
# no escalation changed, but a writer to a shared ledger does not get to invent its own retention.
WINDOW_DAYS = 14      # counted toward escalation
PRUNE_DAYS = 30       # retained on disk
DETECTOR = os.path.expanduser("~/.claude/hooks/repeat-mistake-detector.py")


# ONE vocabulary. Importing the detector's THEMES rather than copying them is the point: a theme
# added there gains owner-side eyes for free, and the two halves can never drift apart.
def load_themes():
    try:
        spec = importlib.util.spec_from_file_location("_rmd", DETECTOR)
        mod = importlib.util.module_from_spec(spec)
        sys.argv = [sys.argv[0]]          # the detector self-tests on argv
        spec.loader.exec_module(mod)
        themes = getattr(mod, "THEMES", None)
        if themes:
            return themes
    except Exception:
        pass
    return {}


# A correction marker, not merely a negative word. "show me the link" must never register the
# 'link' theme; "why do you keep giving me a dead link" must.
CORRECTION = re.compile(
    r"\b("
    r"you keep|u keep|ur keep|"
    r"i told (you|u)|i(?:'| a)?ve told (you|u)|told (you|u) (this|that|so many|ten|\d+)|"
    r"how many times|keeps? (happening|forgetting|doing)|"
    r"again and again|same (shit|thing|stuff|mistake)|over and over|"
    r"why (did|do|are) (you|u|ur)|"
    r"you (didn'?t|did not|never|forgot|failed)|u (didn'?t|did not|never|forgot)|"
    r"stop (being|doing|repeating|making|saying)|"
    r"harden|make (a|the) (hook|gate)|fix (that|this|it) (too|now)|"
    r"still (not|isn'?t|doesn'?t|wrong|broken)|"
    r"that'?s not what|not what i (said|asked|meant)|"
    r"dont ever|don'?t ever|never ever"
    r")\b",
    re.IGNORECASE,
)

# Themes whose regex is too loose to trust on the owner's side without a second, tighter cue.
# 'link' matches any mention of the word; 'measure' matches a bare "px". On MY admission text the
# admission phrase is the guard; on HIS text the correction marker alone is not enough for these.
LOOSE = {
    "link": re.compile(r"dead|error|broken|open|cant|can'?t|localhost|lan|tunnel|give me", re.I),
    "measure": re.compile(r"measure|didn'?t measure|frame by frame|compare", re.I),
    "font": re.compile(r"font|geist|inter", re.I),
    "dots": re.compile(r"dot|separator|pip|middot", re.I),
}


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


# Not his words. A slash command's expansion, a pasted plan, a pasted skill body: these are echoes
# of MY text arriving in the user role, and classifying them as owner corrections would let the
# estate escalate against itself.
NOT_HIS_WORDS = re.compile(
    r"^\s*(The user invoked `/|<!--|#{1,3} |Base directory for this skill:|Goal:|Steps:)")

# Proximity, the pattern stat-source-gate already proved: a theme word only counts when it sits
# NEAR the complaint. Without this, a 900-word feature spec that happens to contain "previews"
# registers as a correction about promised visuals because the word "again" appears elsewhere.
WINDOW = 240


def classify(text, themes):
    """Themes the OWNER is correcting in this message. Empty set when it is not a correction."""
    if not text or not text.strip():
        return set()
    if NOT_HIS_WORDS.match(text):
        return set()
    marks = [m.span() for m in CORRECTION.finditer(text)]
    if not marks:
        return set()
    out = set()
    for name, rx in (themes or {}).items():
        for hit in rx.finditer(text):
            hs, he = hit.span()
            if not any(hs - WINDOW <= ms and me <= he + WINDOW for ms, me in marks):
                continue
            tight = LOOSE.get(name)
            if tight and not tight.search(text[max(0, hs - WINDOW):he + WINDOW]):
                continue
            out.add(name)
            break
    return out


def load_ledger():
    try:
        with open(LEDGER, encoding="utf-8") as f:
            d = json.load(f)
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def record(themes, session_id):
    """Write into the SAME durable ledger the Stop detector uses. Returns {theme: session_count}."""
    counts = {}
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        led = load_ledger()
        sid = (session_id or "unknown")[:12]
        now = time.time()
        for t in themes:
            entry = led.get(t) or {}
            entry = {k: v for k, v in entry.items()
                     if isinstance(v, (int, float)) and now - v <= PRUNE_DAYS * 86400}
            entry[sid] = now
            led[t] = entry
            counts[t] = sum(1 for v in entry.values() if now - v <= WINDOW_DAYS * 86400)
        tmp = LEDGER + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(led, f)
        os.replace(tmp, LEDGER)
    except Exception:
        return {t: 0 for t in themes}
    return counts


def message(counts):
    items = sorted(counts.items(), key=lambda kv: -kv[1])
    lines = ["OWNER-FLAGGED REPEAT (owner-correction-ledger, recorded in the durable ledger):"]
    for t, n in items:
        if n >= 3:
            tail = "%d distinct sessions in 14 days. This is the harden tier, not the promise tier." % n
        elif n == 2:
            tail = "2 distinct sessions in 14 days. Warning tier: it recurred, so fix the CAUSE."
        else:
            tail = "first session on record for this theme."
        lines.append("  - %s , %s" % (t, tail))
    lines.append(
        "He is naming a BEHAVIOUR, not just this instance. IMPROVE_SYSTEM section 2: the answer "
        "is a gate or a gate EDIT, executed this turn, not 'I'll be careful'. And check first "
        "whether a gate for this theme already exists and simply failed to bind , the estate's "
        "three most-repeated themes all already had gates."
    )
    return "\n".join(lines)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    prompt = data.get("prompt") or ""
    session_id = data.get("session_id") or ""
    if check_skip_flag(FLAG, TTL) == "skip":
        sys.exit(0)
    themes = classify(prompt, load_themes())
    if not themes:
        sys.exit(0)
    counts = record(themes, session_id)
    print(message(counts))
    sys.exit(0)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        T = load_themes()
        if not T:
            print("  FAIL  0  could not import THEMES from repeat-mistake-detector.py")
            sys.exit(1)
        CASES = [
            ("1  plain request, no correction -> nothing",
             "show me the homepage link on my phone", set()),
            ("2  owner names a repeat about links -> link",
             "why do you keep giving me a dead link bro it doesnt open", {"link"}),
            ("3  correction marker but no theme -> nothing",
             "i told you to do it in one go", set()),
            ("4  theme word with no correction -> nothing",
             "make the selected state gray and the font inter tight", set()),
            ("5  explicit harden request about stopping -> stopped-early",
             "harden the gate abt u stopping w every checkpoint", {"stopped-early"}),
            ("6  loose theme without its tight cue -> nothing",
             "you keep forgetting the px", set()),
            ("7  loose theme WITH its tight cue -> measure",
             "i told you to compare it frame by frame and you didn't measure anything",
             {"measure"}),
            ("8  empty prompt -> nothing", "", set()),
            ("9  never blocks: main() exits 0 even on a match", None, None),
        ]
        ok = bad = 0
        for label, text, expect in CASES:
            if text is None:
                payload = json.dumps({"prompt": "you keep giving me a dead link", "session_id": "x"})
                import subprocess, tempfile
                sandbox_ledger = os.path.join(tempfile.mkdtemp(), "ledger.json")
                p = subprocess.run([sys.executable, __file__], input=payload, text=True,
                                   capture_output=True, timeout=30,
                                   env=dict(os.environ,
                                            OWNER_CORRECTION_LEDGER=sandbox_ledger))
                got_ok = (p.returncode == 0)
                ok += got_ok
                bad += (not got_ok)
                print(("  PASS  " if got_ok else "  FAIL  ") + label
                      + ("" if got_ok else "   exit was %d, must be 0" % p.returncode))
                continue
            got = classify(text, T)
            good = got == expect
            ok += good
            bad += (not good)
            print(("  PASS  " if good else "  FAIL  ") + label
                  + ("" if good else "   expected %s got %s" % (sorted(expect), sorted(got))))
        print("\n%d/%d passed" % (ok, ok + bad))
        sys.exit(1 if bad else 0)

    if "--validate" in sys.argv:
        # Run over the REAL owner corpus. A synthetic self-test cannot tell you the false-positive
        # rate; this can, because every one of these messages is something he actually typed.
        path = sys.argv[sys.argv.index("--validate") + 1]
        T = load_themes()
        msgs = json.load(open(path))
        hits, per = [], {}
        for m in msgs:
            t = m.get("text", "")
            got = classify(t, T)
            if got:
                hits.append((m.get("ts", ""), sorted(got), re.sub(r"\s+", " ", t)[:110]))
                for g in got:
                    per[g] = per.get(g, 0) + 1
        print("corpus messages: %d" % len(msgs))
        print("flagged as owner corrections: %d (%.0f%%)"
              % (len(hits), 100 * len(hits) / max(1, len(msgs))))
        print("\nthemes by owner-side count:")
        for k, v in sorted(per.items(), key=lambda kv: -kv[1]):
            print("  %4d  %s" % (v, k))
        print("\nevery flagged message, for eyeballing false positives:")
        for ts, g, txt in hits:
            print("  [%s] %-28s %s" % (ts, ",".join(g), txt))
        sys.exit(0)

    try:
        main()
    except Exception:
        sys.exit(0)  # fail-open, always
