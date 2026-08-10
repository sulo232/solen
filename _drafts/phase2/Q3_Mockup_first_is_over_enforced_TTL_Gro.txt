# Q3. Mockup-first, three fixes

Every file below is write-blocked in this sandbox (verified). The orchestrator or the
owner must apply these outside it, and re-verify after applying.

---

## Q3a. The skip flag: file-scoped, not time-scoped

### The measurement (from `/Users/sulo/.claude/state/skip-flag-ledger.log`)

`mockup-preflight-skip.flag` is the most-touched flag in the whole ledger: 81 mentions,
70 parsed touches. Same-session gaps between touches, under one hour, n=57:

| stat | value |
|---|---|
| median gap | 250 s (4.2 min) |
| 75th percentile | 429 s (7.2 min) |
| 90th percentile | 1395 s (23.3 min) |
| touched while the flag was STILL VALID (gap <= 300 s) | **32 of 57** |
| touched after it had expired | 25 of 57 |

Continuous work bursts (a 45-minute idle boundary splits them), 9 multi-touch bursts:
1.3, 12.2, 17.0, 26.3, 39.4, 44.5, 70.0, 75.1, **98.3** minutes.

Two things fall out of that. First, a TTL long enough to outlast a real build would have
to be about 100 minutes, at which point it is not a timer any more, it is "the rest of the
session". Second, and more damning: 32 of 57 re-touches landed inside the still-valid
window. The model is not waiting for expiry and then muting, it re-touches reflexively
before every write. A timer that the subject re-arms on reflex is not restraining the
subject.

So the number is not the fix. The SCOPE is. A skip reason is about one mockup file
(the 2026-08-03 reason names `SearchOverlay.tsx` specifically). Scope it to that file.

**4 hours = 14400 s** as the backstop, and the reason is not roundness: it is 2.4x the
longest continuous mockup burst in the record (98.3 min, 2026-07-31 11:08:07 to 12:46:24,
14 touches, one build), and short enough that a flag left behind at the end of a day
cannot excuse tomorrow morning's first write.

### Patch 1 of 4, `/Users/sulo/.claude/hooks/mockup-preflight-manifest.py`

OLD (line 41, inside the docstring):
```
Fail-open on any error. Skip flag: ~/.claude/mockup-preflight-skip.flag (5-min TTL).
```

NEW:
```
Fail-open on any error. Skip flag: ~/.claude/mockup-preflight-skip.flag. Write the mockup
path you are excusing INTO the flag and the skip follows that path for the working block;
a bare `touch` with no path keeps the old 5-minute window (see TTL note below).
```

---

OLD (lines 45 to 46):
```python
SKIP = os.path.expanduser("~/.claude/mockup-preflight-skip.flag")
TTL = 300
```

NEW:
```python
SKIP = os.path.expanduser("~/.claude/mockup-preflight-skip.flag")

# TTL, rewritten 2026-08-07 (owner decision Q3a). This was a flat 300 seconds.
# Measured against ~/.claude/state/skip-flag-ledger.log, 70 logged touches of this flag:
# the median same-session gap between touches is 250 s, while a continuous mockup build
# runs 12 to 98 minutes, so ONE build re-touched the flag up to 14 times. 32 of the 57
# re-touches landed INSIDE the still-valid window, which means the timer was restraining
# nothing and only generating ledger lines the weekly audit then read as 56 deliberate
# mutes.
#
# A bigger number does not fix that, because the timer measures the wrong thing. A skip
# reason is about ONE mockup file, not about the next five minutes (the logged 2026-08-03
# reason names app/[locale]/_components/search/SearchOverlay.tsx by hand). So: name the
# path in the flag body and the skip follows THAT path; leave the flag bare and you keep
# the old 5-minute window, so no existing habit breaks.
#
# 14400 = 4 hours: 2.4x the longest continuous mockup burst in the ledger (98.3 min,
# 2026-07-31 11:08:07 to 12:46:24, 14 touches, one build), and short enough that a flag
# left behind at the end of a day cannot excuse tomorrow's first write.
TTL = 300            # bare flag, no path named
SCOPED_TTL = 14400   # flag names the file(s) it excuses


def skip_applies(flag_path, target_fp):
    """True when the skip flag excuses THIS write.

    Bare flag (body names no .htm/.html path): the old 300-second timer, unchanged.
    Scoped flag (body names one or more paths): excuses only writes whose file_path ends
    with one of them, for SCOPED_TTL. Fail-closed on any error, so a malformed flag
    enforces rather than mutes.
    """
    try:
        if not os.path.exists(flag_path):
            return False
        age = time.time() - os.path.getmtime(flag_path)
        try:
            with open(flag_path, "r", errors="ignore") as f:
                body = f.read()
        except Exception:
            body = ""
        named = re.findall(r"[\w./\[\]@-]+\.html?\b", body)
        if not named:
            return age < TTL
        if age >= SCOPED_TTL:
            return False
        t = (target_fp or "").replace("\\", "/")
        return any(t.endswith(n.replace("\\", "/").lstrip("./")) for n in named)
    except Exception:
        return False
```

---

OLD (lines 535 to 536, inside `main`):
```python
    if fresh(SKIP):
        sys.exit(0)
```

NEW:
```python
    if skip_applies(SKIP, fp):
        sys.exit(0)
```

---

OLD (lines 571 to 573, the deny message tail):
```python
        "\n\nFix all of the above, then retry this Write once (the individual gates behind this "
        "aggregator stay live as backstops). Skip valve: touch ~/.claude/mockup-preflight-skip.flag "
        "(5-min TTL, use only when you've genuinely already satisfied these another way)."
```

NEW:
```python
        "\n\nFix all of the above, then retry this Write once.\n"
        "Skip valve, only when you have genuinely satisfied these another way: write the path "
        "plus your reason into the flag, which excuses THAT file for the working block:\n"
        "  echo 'public/_mockups/<dir>/index.html , <why>' > ~/.claude/mockup-preflight-skip.flag\n"
        "A bare `touch` with no path keeps the old 5-minute window."
```

### Patch 2 of 4, `/Users/sulo/.claude/hooks/mockup-first-gate.py`

Same 300-second problem, different flag (`mockup-approved-skip.flag`, 18 ledger touches).
This one's scope is a real component, so the flag names the component.

OLD (lines 80 to 90):
```python
    try:
        if os.path.exists(FLAG) and time.time() - os.path.getmtime(FLAG) < 300:
            sys.exit(0)
    except Exception:
        pass
    fp, texts = collect(data)
    if not fp:
        sys.exit(0)
```

NEW:
```python
    fp, texts = collect(data)
    if not fp:
        sys.exit(0)
    # 2026-08-07 (Q3a): the flag was a flat 300-second timer, measured too short for a real
    # apply pass and re-touched on reflex. Name the component you are applying an approved
    # mockup to and the skip follows that file for 4 hours; a bare touch keeps 5 minutes.
    try:
        if os.path.exists(FLAG):
            age = time.time() - os.path.getmtime(FLAG)
            try:
                with open(FLAG, "r", errors="ignore") as f:
                    body = f.read()
            except Exception:
                body = ""
            named = re.findall(r"[\w./\[\]@-]+\.[tj]sx?\b", body)
            t = fp.replace("\\", "/")
            if named:
                if age < 14400 and any(t.endswith(n.lstrip("./")) for n in named):
                    sys.exit(0)
            elif age < 300:
                sys.exit(0)
    except Exception:
        pass
```

**`/Users/sulo/.claude/hooks/mockup-visual-gate.py` line 132 shares this exact flag with a
hard-coded 300.** It must get the identical treatment in the same commit, or the two gates
will disagree about whether the same flag is live.

---

## Q3b. The Grounded-in heuristic

### The exact code that is wrong

Identical in two files. `mockup-preflight-manifest.py:101-107` and
`mockup-grounding-gate.sh:52-58`:

```python
def cite_ok(p):
    p = p.strip().rstrip(",;-")
    if not p or not os.path.exists(os.path.join(proj, p)):
        return False
    if not mockup_toks:
        return True
    return bool(toks(p) & mockup_toks)      # <- the requirement that is wrong
```

`mockup_toks` comes from the mockup's own FILENAME and `<title>`. Our mockups are named for
the CHANGE, not the component: `home-fixes`, `restraint`, `floors-law`, `liftup-home-fs`,
`principles-rethink`. A correct citation therefore shares no token with the file citing it.

### Measured on the 256 real mockups in `public/_mockups`

| | count |
|---|---|
| mockups the gate sniffs as Solen UI | 256 |
| carry a `Grounded-in:` style citation | 169 |
| citation points at a path that really exists | 122 |
| ALSO shares a 4-letter token, so passes today | 109 |
| **denied by the token rule alone** | **13 (11%)** |

All 13 cite the right file. Examples:

- `liftup-home-fs/index.html` cites `app/[locale]/page.tsx`, the real homepage. Every token
  in that path is on the generic-words list, so nothing can ever match. Denied.
- `home-cheap/index.html` cites `SalonCard.tsx` and `BusinessTeaser.tsx`. Denied.
- `sweep-queue-feedback/index.html` cites `app/[locale]/queue/[token]/page.tsx`. Denied.
- `confirmation-redesign.html` cites `components-legacy/booking/BookingConfirmation.tsx:229-258`.
  Denied for a second reason: the line-range suffix makes `os.path.exists` fail, so a MORE
  precise citation is punished.

This is what the skip flag was being used to get past. A heuristic that manufactures its own
bypass is not enforcing anything.

### The replacement, and what it loses

Two objective questions instead of one guess: does the cited path resolve to a real FILE,
and is that file repo plumbing. The motivating bad case still dies, by name.

Verified against the probe set:

| citation | verdict |
|---|---|
| `package.json` | BLOCK |
| `tsconfig.json` | BLOCK |
| `README.md` | BLOCK |
| `index.html` | BLOCK |
| `.` | BLOCK |
| `src/lib` (a directory) | BLOCK |
| `app/[locale]/_components/checkout/CheckoutSummary.tsx` (invented) | BLOCK |
| `app/[locale]/page.tsx` | PASS |
| `app/[locale]/_components/search/SearchOverlay.tsx` | PASS |
| `components-legacy/booking/BookingConfirmation.tsx:229-258` | PASS |

Across the 169 citing mockups: 109 pass today, 120 pass after. All 13 false denials clear,
49 mockups with no valid citation at all stay denied.

**What it loses, stated plainly:** it can no longer catch a citation that names a real,
specific, non-plumbing file that is simply the WRONG one. A checkout mockup citing
`SalonCard.tsx` now passes. That is misdirection, not fabrication. Fabrication, the thing
the gate was built for, is still caught, because an invented path does not exist on disk.
The old rule did not reliably catch misdirection either: it passed whenever the wrong file
happened to share any four-letter word with the mockup's title.

### Patch 3 of 4, `mockup-preflight-manifest.py`

OLD (lines 92 to 115):
```python
    # RELEVANCE (mirrors mockup-grounding-gate.sh's 2026-07-10 fix): an existing path isn't enough
    # on its own (`Grounded-in: package.json` must not pass on a checkout mockup just because
    # package.json exists) , the cited path must share a >=4-char token with the mockup's own
    # identity (filename, or its <title>/<h1>).
    mockup_toks = toks(os.path.basename(fp))
    title_m = re.search(r"<title[^>]*>(.*?)</title>|<h1[^>]*>(.*?)</h1>", content, re.I | re.S)
    if title_m:
        mockup_toks |= toks(re.sub(r"<[^>]+>", " ", title_m.group(1) or title_m.group(2) or ""))

    def cite_ok(p):
        p = p.strip().rstrip(",;-")
        if not p or not os.path.exists(os.path.join(proj, p)):
            return False
        if not mockup_toks:
            return True  # nothing to compare against (no filename/title tokens); existence-only
        return bool(toks(p) & mockup_toks)

    ok = any(cite_ok(p) for p in cites)
    if ok:
        return None
    return ("Grounded-in citation missing, cites a path that doesn't exist, or the citation doesn't "
            "actually match this surface (no shared token with the mockup filename/title , e.g. "
            "`package.json` citing a checkout mockup) , add `Grounded-in: <real/path.tsx>` naming "
            "the ACTUAL surface. [mockup-grounding-gate.sh]")
```

NEW:
```python
    # RELEVANCE, rewritten 2026-08-07 (owner decision Q3b). The rule used to ALSO require the
    # cited path to share a >=4-char token with the mockup's own filename or <title>. Mockups
    # here are named for the CHANGE (home-fixes, restraint, floors-law, liftup-home-fs), never
    # for the component, so a correct citation routinely shares no token with the file citing
    # it. Measured over the 122 mockups on disk whose citation resolves to a real path: 13 of
    # them (11%) were denied by the token rule alone, and all 13 cite the right file, e.g.
    # liftup-home-fs -> app/[locale]/page.tsx (the actual homepage, every token generic) and
    # the search-morph case logged in the skip ledger on 2026-08-03. That false deny is what
    # the skip flag was being used to get past, so the heuristic was manufacturing its own
    # bypass.
    #
    # What replaces it is objective and cheap, per the 2026-08-07 gate-legality rule: the
    # citation must resolve to a real FILE that is not repo plumbing. The motivating bad case
    # (`Grounded-in: package.json` on a checkout mockup) is denied by name rather than by
    # guessing at semantic relatedness from strings. A `path.tsx:229-258` line range is
    # stripped before the existence check, so a MORE precise citation stops being punished.
    def cite_ok(p):
        p = p.strip().rstrip(",;-")
        if not p:
            return False
        bare = re.sub(r":\d+(?:-\d+)?$", "", p.replace("\\", "/").split("#")[0])
        if not os.path.isfile(os.path.join(proj, bare)):
            return False
        return not PLUMBING_CITE.search(bare)

    ok = any(cite_ok(p) for p in cites)
    if ok:
        return None
    return ("Grounded-in citation missing, or it does not resolve to a real file in this repo, "
            "or it names repo plumbing rather than a surface (package.json, tsconfig, README, a "
            "bare directory). Add `Grounded-in: <real/path.tsx>` naming the ACTUAL component or "
            "route this mockup is built from. [mockup-grounding-gate.sh]")
```

Also add next to `CITE_RE` (after line 71):
```python
PLUMBING_CITE = re.compile(
    r"(^|/)(package(-lock)?\.json|tsconfig[^/]*\.json|next\.config\.[^/]+"
    r"|tailwind\.config\.[^/]+|postcss\.config\.[^/]+|eslint[^/]*|\.gitignore"
    r"|\.env[^/]*|README\.md|CLAUDE\.md)$", re.I)
```

`toks()` and `GENERIC_TOKENS` (lines 78 to 84) become unreachable after this and should be
deleted in the same commit.

### Patch 4 of 4, `/Users/sulo/.claude/hooks/mockup-grounding-gate.sh`

OLD (lines 36 to 72):
```python
# RELEVANCE (2026-07-10 fix, token-overlap technique ported from mockup-parity-gate.py:60-76):
# an EXISTING path was accepted no matter what it was , `Grounded-in: package.json` passed on
# a checkout mockup just because package.json exists. Require the cited path to share a
# >=4-char token with the mockup's own identity (filename, or its <title>/<h1>), generic words
# excluded, so the citation actually names the real surface this mockup claims to be grounded in.
GENERIC = {"page","index","component","components","app","dev","mockups","html","tsx","jsx",
           "locale","src","lib","test","spec","real","source","json","config","package","route"}
def toks(s):
    s = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", s or "")
    return {w for w in re.findall(r"[a-zA-Z0-9]+", s.lower()) if len(w) >= 4 and w not in GENERIC}

mockup_toks = toks(os.path.basename(fp))
title_m = re.search(r"<title[^>]*>(.*?)</title>|<h1[^>]*>(.*?)</h1>", c, re.I | re.S)
if title_m:
    mockup_toks |= toks(re.sub(r"<[^>]+>", " ", title_m.group(1) or title_m.group(2) or ""))

def cite_ok(p):
    p = p.strip().rstrip(",;-")
    if not p or not os.path.exists(os.path.join(proj, p)):
        return False
    if not mockup_toks:
        return True  # nothing to compare against (no filename/title tokens); existence-only
    return bool(toks(p) & mockup_toks)

# strip trailing dashes too (an unspaced HTML comment closer "path.html-->" leaves "--" glued
# onto the captured token since "-" isn't excluded by the char class , 2026-07-10 fix).
ok=any(cite_ok(p) for p in cites)
if not ok:
    sys.stderr.write(
      "MOCKUP-GROUNDING GATE (project 'Mockup FIRST'; owner re-flagged 2026-07-06 'you just made these up'):\n"
      "This .html reads as a Solen UI mockup with no valid Grounded-in: citation, or the citation doesn't\n"
      "actually match this surface (no shared token with the mockup filename/title , e.g. `package.json`\n"
      "citing a checkout mockup). A mockup of an EXISTING surface must be built FROM the real page/component\n"
      "(capture the real route + read the real component), NOT hand-drawn. Add `Grounded-in: <real/path.tsx>`\n"
      "naming the ACTUAL surface (a file that EXISTS AND shares a name token with this mockup), or capture\n"
      "the real route first. Override: touch ~/.claude/mockup-grounding-skip.flag\n")
    sys.exit(2)
```

NEW:
```python
# RELEVANCE, rewritten 2026-08-07 (owner decision Q3b). This required the cited path to share
# a >=4-char token with the mockup's filename or <title>. Our mockups are named for the CHANGE
# (home-fixes, restraint, floors-law, liftup-home-fs), not for the component, so a correct
# citation routinely matches nothing. Measured over the 122 mockups on disk whose citation
# resolves to a real path, 13 (11%) were denied by the token rule alone and all 13 cite the
# right file. The skip flag was being used to get past that false deny.
#
# Two objective questions replace the heuristic: does it resolve to a real FILE, and is that
# file repo plumbing. `Grounded-in: package.json` on a checkout mockup, the case this was
# written for, is still denied. A `path.tsx:229-258` line range is stripped first, so a more
# precise citation stops being punished.
PLUMBING = re.compile(
    r"(^|/)(package(-lock)?\.json|tsconfig[^/]*\.json|next\.config\.[^/]+"
    r"|tailwind\.config\.[^/]+|postcss\.config\.[^/]+|eslint[^/]*|\.gitignore"
    r"|\.env[^/]*|README\.md|CLAUDE\.md)$", re.I)

def cite_ok(p):
    p = p.strip().rstrip(",;-")
    if not p:
        return False
    bare = re.sub(r":\d+(?:-\d+)?$", "", p.replace("\\", "/").split("#")[0])
    if not os.path.isfile(os.path.join(proj, bare)):
        return False
    return not PLUMBING.search(bare)

ok=any(cite_ok(p) for p in cites)
if not ok:
    sys.stderr.write(
      "MOCKUP-GROUNDING GATE (project 'Mockup FIRST'; owner re-flagged 2026-07-06 'you just made these up'):\n"
      "This .html reads as a Solen UI mockup and its Grounded-in: citation is missing, does not resolve to\n"
      "a real file in this repo, or names repo plumbing (package.json, tsconfig, README, a bare directory)\n"
      "rather than a surface. A mockup of an EXISTING surface must be built FROM the real page/component\n"
      "(capture the real route + read the real component), NOT hand-drawn. Add `Grounded-in: <real/path.tsx>`\n"
      "naming the ACTUAL component or route, or capture the real route first.\n"
      "Override: touch ~/.claude/mockup-grounding-skip.flag\n")
    sys.exit(2)
```

---

## Q3c. Collapse the family

### Every mockup gate registered independently, all four settings files

`~/.claude/settings.json`, PreToolUse:

| gate | matcher | in the aggregator? | verdict |
|---|---|---|---|
| `mockup-preflight-manifest.py` | Write | it IS the aggregator | keep |
| `mockup-grounding-gate.sh` | Write | mirrored, checks 1+2 | **delete**, delegate |
| `mockup-real-base-gate.py` | Write | no | **delete**, delegate |
| `mockup-content-gate.py` | W/E/ME | mirrored, check 4 | keep, covers Edit |
| `no-decorative-image-gate.py` | W/E/ME | no | keep, not mockup-only |
| `mockup-gate.py` | W/E/ME | no | keep, this is solen-mobile `.tsx`, not a web mockup gate despite the name |
| `no-focus-ring-gate.py` | W/E/ME | mirrored, check 5 | keep, guards real components too |
| `motion-recipe-gate.py` | W/E/ME | no | keep, `.tsx` only |
| `copy-lint-gate.py` | W/E/ME | mirrored, checks 6+7 | keep, repo-wide |
| `mockup-first-gate.py` | W/E/ME | no | keep, opposite direction (real components) |
| `pre-edit-measure-first-gate.py` | W/E/ME | mirrored, check 8 | keep, covers Edit |
| `mockup-visual-gate.py` | W/E/ME | no | keep, opposite direction |
| `mockup-realsize-gate.py` | W/E/ME | no | keep, also covers `.tsx` |
| `mockup-english-gate.py` | W/E/ME | partly, via check 4 | keep, this copy is the superset |
| `mockup-compose-registered-card-gate.py` | W/E/ME | no | **delete**, delegate |

`~/.claude/settings.local.json`, PreToolUse, one group, matcher `Write|Edit|MultiEdit`.
All six are `/_mockups/*.html` only and none is in the aggregator:

`reference-measure-gate.py`, `mockup-type-budget-gate.py`,
`mockup-width-calibration-gate.py`, `no-fake-phone-gate.py`, `mockup-base-gate.py`,
`mockup-floors-gate.py`. **All six delete, all six delegate.**

Project `.claude/settings.json`, PreToolUse:

| gate | matcher | verdict |
|---|---|---|
| `pre-build-exists-check.sh` | Write | keep, its non-mockup arm gates new routes and migrations |
| `mockup-english-gate.py` | Edit | **delete**, a weaker duplicate of the global copy |
| `mockup-english-gate.py` | Write | **delete**, same |
| `mockup-resurrection-gate.py` | Edit, Write, MultiEdit | keep |
| `mockup-depicts-gate.py` | Edit, Write | keep |
| `mockup-fullscreen-gate.py` | Edit, Write | keep |
| `mockup-no-flat-gate.py` | Edit, Write | keep |
| `mockup-diagnosis-gate.py` | Edit, Write | keep |

Project Stop hooks `mockup-lang-stop-gate.py` and `mockup-defer-stop-gate.py`: keep. The
first catches mockups written by a shell script, which no PreToolUse hook can ever see.

Worktree `.claude/settings.local.json`: no hooks at all.

The two `mockup-english-gate.py` copies are DIFFERENT files, and the global one is a strict
superset: German plus French plus Italian plus umlauts, versus German only; a wider path
matcher (`/mockups/`, `*-options*`, `*.mock.*` on top of `/dev/` and `/_mockups/`); and it
covers `.ts`/`.js` too. Deleting the two project registrations cannot let anything through
that passes today.

### Why deleting is safe: the aggregator stops mirroring and starts RUNNING

The aggregator copies each gate's detection logic by hand. Its own comments record two
separate incidents where the copy drifted and contradicted the real gate (both dated
2026-07-12, both described as "sync fix"). Adding eight more mirrors would be adding eight
more chances of that. So it runs the real gates instead, with the identical stdin. A runner
cannot drift, and delegation is behaviour-preserving by construction because the delegated
gate sees exactly the payload it sees today.

Add to `mockup-preflight-manifest.py`, after the check-12 block (before `# glue`):

```python
# =========================================================================================
# 13. DELEGATED GATES , RUN the real gate, never mirror it (2026-08-07, owner decision Q3c).
# Checks 1 to 12 above are hand-copied logic, and this file's own history records two
# occasions (both 2026-07-12) where a copy drifted and the aggregator contradicted the gate
# it was quoting. So the family collapses by EXECUTION, not by more copying: each gate below
# is run as a subprocess with this hook's exact stdin, and whatever it would have said lands
# in the same single deny. Their settings.json registrations are removed in the same commit,
# so each one still runs exactly once, just inside one deny instead of a serial chain.
# =========================================================================================
import subprocess

DELEGATED = (
    "mockup-grounding-gate.sh",
    "mockup-real-base-gate.py",
    "mockup-base-gate.py",
    "mockup-floors-gate.py",
    "mockup-type-budget-gate.py",
    "mockup-width-calibration-gate.py",
    "no-fake-phone-gate.py",
    "reference-measure-gate.py",
    "mockup-compose-registered-card-gate.py",
)
_SELF = os.path.basename(os.path.abspath(__file__))


def run_delegated(raw_payload):
    """Run each delegated gate with the ORIGINAL stdin and collect its deny reason.
    A gate that allows prints nothing and contributes nothing. Never recurses into self.
    Fail-open per gate: a crashed or hung delegate is skipped, never turned into a deny."""
    here = os.path.dirname(os.path.abspath(__file__))
    out = []
    for name in DELEGATED:
        if name == _SELF:
            continue
        path = os.path.join(here, name)
        if not os.path.exists(path):
            continue
        argv = [path] if name.endswith(".sh") else [sys.executable, path]
        try:
            p = subprocess.run(argv, input=raw_payload, capture_output=True,
                               text=True, timeout=15)
        except Exception:
            continue
        reason = ""
        if (p.stdout or "").strip():
            try:
                hso = (json.loads(p.stdout) or {}).get("hookSpecificOutput") or {}
                if hso.get("permissionDecision") == "deny":
                    reason = hso.get("permissionDecisionReason") or ""
            except Exception:
                pass
        if not reason and p.returncode == 2:
            reason = (p.stderr or "").strip() or "denied with no message"
        if reason:
            out.append(re.sub(r"\s+", " ", reason).strip()[:400] + f"  [{name}]")
    return out
```

Then, in `main`:

OLD (lines 509 to 512):
```python
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
```
NEW:
```python
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except Exception:
        sys.exit(0)
```

OLD (lines 523 to 524):
```python
    if data.get("tool_name") != "Write":
        sys.exit(0)
```
NEW:
```python
    # Write|Edit|MultiEdit since 2026-08-07: the delegated gates below already handle Edit
    # correctly on their own, and they only reach them through here now. Checks 1 to 12
    # remain Write-only, exactly as before, because they read tool_input.content.
    tool = data.get("tool_name") or ""
    if tool not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)
```

OLD (line 56, the path scope):
```python
GATED_PATH = re.compile(r"/public/_mockups/.*\.html$|/public/solen-[^/]+\.html$|/dev/.*\.html$", re.I)
```
NEW (a strict superset, widened 2026-08-07 to cover every delegated gate's own scope; the
delegated gates match on a bare `/_mockups/`, and `reference-measure-gate.py` also covers
`/_analysis/`, so the old `/public/_mockups/` prefix would have silently narrowed them):
```python
GATED_PATH = re.compile(
    r"/_mockups/.*\.html?$|/public/solen-[^/]+\.html?$|/dev/.*\.html?$|/_analysis/.*\.html?$",
    re.I)
```

OLD (lines 531 to 533 and the findings loop head):
```python
    content = ti.get("content") or ""
    if not content:
        sys.exit(0)
```
NEW:
```python
    content = ti.get("content") or ""
```

OLD (line 543):
```python
    findings = []
```
NEW:
```python
    findings = run_delegated(raw)
    if tool != "Write" or not content:
        if findings:
            _emit(findings)
        sys.exit(0)
```
(`_emit` is the existing deny-printing tail, lifted out of `main` into a one-line helper so
it can be called from both exits.)

### The exact settings entries to delete

**1. `/Users/sulo/.claude/settings.local.json`**, PreToolUse, the single group with matcher
`"Write|Edit|MultiEdit"`. Delete these six objects (lines 11 to 34), keeping
`white-only-web-gate.py`, `design-law-integrity-gate.py`, `i18n-write-gate.py`,
`stock-photo-gate.py`, `legal-price-gate.py`, `enforcement-in-product-gate.py`:
```json
{ "type": "command", "command": "python3 /Users/sulo/.claude/hooks/reference-measure-gate.py" },
{ "type": "command", "command": "python3 /Users/sulo/.claude/hooks/mockup-type-budget-gate.py" },
{ "type": "command", "command": "python3 /Users/sulo/.claude/hooks/mockup-width-calibration-gate.py" },
{ "type": "command", "command": "python3 /Users/sulo/.claude/hooks/no-fake-phone-gate.py" },
{ "type": "command", "command": "python3 /Users/sulo/.claude/hooks/mockup-base-gate.py" },
{ "type": "command", "command": "python3 /Users/sulo/.claude/hooks/mockup-floors-gate.py" }
```

**2. `/Users/sulo/.claude/settings.json`**, PreToolUse, the group with matcher `"Write"`
(the one that also holds `mockup-preflight-manifest.py`). Delete these two, keep the
aggregator:
```json
{ "type": "command", "command": "$HOME/.claude/hooks/mockup-grounding-gate.sh" },
{ "type": "command", "command": "python3 $HOME/.claude/hooks/mockup-real-base-gate.py" }
```

**3. `/Users/sulo/.claude/settings.json`**, PreToolUse, the `"Write|Edit|MultiEdit"` group
that holds `mockup-english-gate.py`. Delete one, keep `mockup-english-gate.py`:
```json
{ "type": "command", "command": "python3 /Users/sulo/.claude/hooks/mockup-compose-registered-card-gate.py" }
```

**4. Project `.claude/settings.json`**, PreToolUse, matcher `"Edit"`, lines 129 to 132:
```json
{ "type": "command", "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/mockup-english-gate.py" }
```

**5. Project `.claude/settings.json`**, PreToolUse, matcher `"Write"`, lines 210 to 213:
```json
{ "type": "command", "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/mockup-english-gate.py" }
```

Eleven registrations removed. Nine gates keep running, now inside one deny instead of nine
serial ones. Two were true duplicates and stop running twice. None of the nine delegated
files is deleted from disk: they are the aggregator's callees now, and deleting them would
disarm the rules.

### Before this is called done

Per the build-then-integrate rule, all three fixes need a self-test before the settings
edits land, not after:

1. A scoped flag naming file A must skip a write to A and must NOT skip a write to B.
2. A bare flag must still skip for 300 seconds and stop at 301.
3. `Grounded-in: package.json` must still deny; `Grounded-in: app/[locale]/page.tsx` must
   now pass; an invented path must deny.
4. Re-write one of the 13 previously-denied mockups with the aggregator armed and confirm
   the deny is gone.
5. Feed the aggregator a mockup that violates two delegated gates and confirm both reasons
   appear in ONE deny.
