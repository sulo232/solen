#!/usr/bin/env python3
"""entity-card-gate , PreToolUse (Edit|Write|MultiEdit).

Owner 2026-07-19: "in choosing stylist page why one group not individual ... services
there is group (mens cut / colors / bleaching) ... but stylists are individual not
groups. make a principle and make a gate." A list of DISTINCT ENTITIES (people/stylists,
salons) must render as INDIVIDUAL cards (one card per entity, gap-separated,
`rounded-card border border-s-border bg-white`, the SalonResultCard grammar), NOT merged
into one GROUPED list-card (`overflow-hidden ... shadow-whisper` with hairline rows), which
is only for CATEGORY members (services under "Colors", products).

THE RULE this gate enforces (heuristic, name-based , semantics can't be fully mechanized):
An ENTITY-LIST component (filename matches Staff/Stylist/Team/Barber/Therapist/Employee/
Provider/People/Member) must NOT introduce the GROUPED list-card grammar (`shadow-whisper`
co-occurring with `overflow-hidden`). Those components render a list of distinct people, so
each belongs in its own individual card.

KNOWN LEGIT EXCEPTION (use the escape): a single-entity PAGE that GROUPS that entity's
CATEGORY items , e.g. StaffProfilePage grouping ONE stylist's SERVICES in a group card ,
is correct. Add `entity-ok: <reason>` on the line.

Scope: design-surface .tsx/.jsx under app|components (NOT mockups/public, generated, .d.ts,
node_modules, _audits, /dev/). NET-NEW only (Write content / Edit/MultiEdit new_string).

Escape hatches:
  - Per line:  add `entity-ok: <reason>` on/near the offending line.
  - This turn: touch ~/.claude/entity-card-skip.flag        # 5-minute TTL
FAIL-OPEN on any parse error.

2026-08-18 stress-test fix: rule 2 (doubled chrome) refused the contract's own LOCKED grouped
list-card grammar (radius 24 + shadow-whisper + divided rows) and any card carrying a single
`border-b` header. See the dated comments at rule 2 below for the measurements. Also added the
file's first `--selftest`, this gate never had one.

2026-08-18 stress-test fix 2: that exemption only recognised the literal `rounded-[24px]`, so the
SAME locked grouped list-card written with Tailwind's own 24px token measured BLOCK
(`rounded-3xl shadow-whisper bg-white divide-y divide-s-border` -> deny), and it ran over a plus or
minus 400-character window, so a genuine entity-card violation nested inside an unrelated
`rounded-[24px] shadow-whisper` section measured pass. The exemption now accepts the token spellings
of the same radius and is scoped to the container the match actually sits in.
"""
import json, os, re, sys, time

ENTITY_NAME = re.compile(r"(staff|stylist|team|barber|therapist|employee|provider|people|member)", re.I)


def _drive(file_path, content, tool="Write", old_string=None):
    """Selftest helper: re-run this file as a subprocess with a synthetic PreToolUse payload,
    same black-box shape hook-probe.py uses, so the test exercises the real stdin-driven path.
    When old_string is given, drives an Edit (content becomes new_string) so the
    already-present-in-old-text forgiveness path can be exercised too (2026-08-21)."""
    import subprocess
    if old_string is not None:
        payload = {"tool_name": "Edit", "tool_input": {
            "file_path": file_path, "old_string": old_string, "new_string": content}}
    else:
        payload = {"tool_name": tool, "tool_input": {"file_path": file_path, "content": content}}
    p = subprocess.run([sys.executable, os.path.abspath(__file__)], input=json.dumps(payload),
                        capture_output=True, text=True, timeout=10)
    return p.returncode, p.stdout


def selftest():
    """2026-08-18: this gate never had a self-test. Added with the grouped-list-card + border-b fix.
    2026-08-21: proves a reword that leaves an already-offending rule-1 or rule-2 pair untouched
    is forgiven, while a genuine addition still blocks for both rules."""
    ENTITY_OFFEND = '<div className="overflow-hidden rounded-[24px] shadow-whisper">{staff.map(s => <Row key={s.id} {...s}/>)}<p>%s</p></div>'
    BOXED_OFFEND = '<div className="border border-s-border bg-white">{items.map(i => <div key={i.id} className="border-b border-s-border">%s</div>)}</div>'
    cases = [
        ("LOCKED grouped list-card (radius 24 + shadow-whisper + divided rows) must pass",
         "/Users/sulo/Documents/solen/components/ServicesList.tsx",
         '<div className="rounded-[24px] shadow-whisper bg-white divide-y divide-s-border">'
         '<div className="p-4">Cut</div><div className="p-4">Color</div></div>',
         False, None),
        ("genuine entity-card violation (radius-16 + border container carrying row dividers) must block",
         "/Users/sulo/Documents/solen/components/SalonCard.tsx",
         '<div className="rounded-card border border-s-border bg-white divide-y divide-s-border">'
         '<div className="p-4">A</div><div className="p-4">B</div></div>',
         True, None),
        ("a single border-b HEADER inside a card must pass",
         "/Users/sulo/Documents/solen/components/ReviewSummaryCard.tsx",
         '<div className="rounded-card border border-s-border p-4">'
         '<div className="border-b border-s-border pb-2 font-semibold">Reviews</div>'
         '<p>Great salon</p></div>',
         False, None),
        ("the original entity-list rule (Staff list rendering a grouped card) must still block",
         "/Users/sulo/Documents/solen/components/StaffList.tsx",
         '<div className="overflow-hidden rounded-[24px] shadow-whisper">'
         '{staff.map(s => <Row key={s.id} {...s}/>)}</div>',
         True, None),
        # 2026-08-18 fix 2: token spelling of the same radius + container-scoped exemption
        ("the SAME locked grouped list-card written as rounded-3xl (Tailwind's own 24px) must pass",
         "/Users/sulo/Documents/solen/components/ServicesList.tsx",
         '<div className="rounded-3xl shadow-whisper bg-white divide-y divide-s-border">'
         '<div className="p-4">Cut</div><div className="p-4">Color</div></div>',
         False, None),
        ("a genuine entity-card violation NESTED inside a legal grouped section must still block",
         "/Users/sulo/Documents/solen/components/SalonCard.tsx",
         '<section className="rounded-[24px] shadow-whisper bg-white">'
         '<h2 className="p-4 font-semibold">Services</h2>'
         '<div className="rounded-card border border-s-border bg-white divide-y divide-s-border">'
         '<div className="p-4">A</div><div className="p-4">B</div></div></section>',
         True, None),
        ("a grouped list-card whose rows sit in a child element must pass",
         "/Users/sulo/Documents/solen/components/ServicesList.tsx",
         '<div className="rounded-3xl shadow-whisper bg-white">'
         '<ul className="divide-y divide-s-border"><li className="p-4">Cut</li></ul></div>',
         False, None),
        ("a class-list-only edit of the locked grouped card (no tag in the blob) must pass",
         "/Users/sulo/Documents/solen/components/ServicesList.tsx",
         'className="rounded-3xl shadow-whisper bg-white divide-y divide-s-border"',
         False, None),
        ("2026-08-21 rule 1: a text-only reword inside an already-offending entity-list grouped "
         "card (shadow-whisper + overflow-hidden untouched) must be forgiven",
         "/Users/sulo/Documents/solen/components/StaffList.tsx",
         ENTITY_OFFEND % "Neue Beschreibung",
         False, ENTITY_OFFEND % "Alte Beschreibung"),
        ("2026-08-21 rule 1 narrowness: a genuine ADDITION of the grouped-card grammar (old had "
         "none) must still block",
         "/Users/sulo/Documents/solen/components/StaffList.tsx",
         '<div className="overflow-hidden rounded-[24px] shadow-whisper">'
         '{staff.map(s => <Row key={s.id} {...s}/>)}</div>',
         True, '<div className="p-4">{staff.map(s => <Row key={s.id} {...s}/>)}</div>'),
        ("2026-08-21 rule 2: a text-only reword inside an already-doubled-chrome list (container "
         "border + border-b row divider untouched) must be forgiven",
         "/Users/sulo/Documents/solen/components/SettingsList.tsx",
         BOXED_OFFEND % "{i.newLabel}",
         False, BOXED_OFFEND % "{i.oldLabel}"),
        ("2026-08-21 rule 2 narrowness: a genuine ADDITION of the row-divider (old had none) "
         "must still block",
         "/Users/sulo/Documents/solen/components/SettingsList.tsx",
         '<div className="border border-s-border bg-white">{items.map(i => '
         '<div key={i.id} className="border-b border-s-border">{i.label}</div>)}</div>',
         True, '<div className="border border-s-border bg-white">{items.map(i => '
         '<div key={i.id}>{i.label}</div>)}</div>'),
    ]
    ok = 0
    for name, fp, content, expect, old_string in cases:
        _, out = _drive(fp, content, old_string=old_string)
        got = bool(out.strip())
        good = got == expect
        ok += good
        print(f"  {'PASS' if good else 'FAIL'}  {name}  (blocked={got}, expected={expect})")
    print(f"\n{ok}/{len(cases)} passed")
    return 0 if ok == len(cases) else 1


if "--selftest" in sys.argv:
    sys.exit(selftest())

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

SKIP = os.path.expanduser("~/.claude/entity-card-skip.flag")
try:
    if os.path.exists(SKIP) and (time.time() - os.path.getmtime(SKIP)) < 300:
        sys.exit(0)
except Exception:
    pass

tool = data.get("tool_name", "")
if tool not in ("Edit", "Write", "MultiEdit"):
    sys.exit(0)
inp = data.get("tool_input", {}) or {}
fp = (inp.get("file_path") or "").replace("\\", "/")

if not fp.endswith((".tsx", ".jsx", ".html")):
    sys.exit(0)
low = fp.lower()
if any(s in low for s in ("node_modules", ".d.ts", "/generated", "/_audits/")):
    sys.exit(0)

base = fp.rsplit("/", 1)[-1]

# Rule 1 (grouped vs individual) keeps its original narrow scope: real entity-list components only.
in_app = ("/app/" in low or low.startswith("app/")) or "/components" in low or low.startswith("components")
rule1_applies = (
    fp.endswith((".tsx", ".jsx"))
    and in_app
    and not any(s in low for s in ("/public/", "_mockups/", "/dev/"))
    and bool(ENTITY_NAME.search(base))
    # a "*ProfilePage" / "*Profile" single-entity page legitimately groups its OWN category items
    and not re.search(r"profile", base, re.I)
)
# Rule 2 (doubled chrome) applies to every design surface INCLUDING mockups, because a mockup is
# where he sees the boxing first and it is the copy he reacts to.
rule2_applies = in_app or "_mockups/" in low or "/public/" in low
if not (rule1_applies or rule2_applies):
    sys.exit(0)

# the text being ADDED (net-new only)
added = []
if tool == "Write":
    added.append(inp.get("content") or "")
elif tool == "Edit":
    added.append(inp.get("new_string") or "")
else:
    for e in inp.get("edits", []) or []:
        added.append((e or {}).get("new_string") or "")
blob = "\n".join(a for a in added if a)
if not blob.strip():
    sys.exit(0)

# 2026-08-21 stress-test fix: both rules in this file used to read only the ADDED text (Write
# content / Edit new_string), so a reword that leaves an already-offending pair of tokens
# byte-identical on both sides of an Edit got refused as if the edit had just introduced them.
# Fails closed: if the helper cannot be imported, the gate keeps refusing exactly as before.
try:
    sys.path.insert(0, os.path.expanduser("~/.claude/hooks/_lib"))
    from unchanged_by_this_edit import co_located
except Exception:
    def co_located(_data, _offenders, window=400):
        return False

# the GROUPED list-card signature: shadow-whisper co-occurring with overflow-hidden
offend = False
for m in (re.finditer(r"shadow-whisper", blob) if rule1_applies else []):
    window = blob[max(0, m.start() - 120):m.end() + 120]
    if "overflow-hidden" not in window:
        continue
    esc = blob[max(0, m.start() - 160):m.end() + 160]
    if re.search(r"entity-ok\s*:", esc, re.I):
        continue
    # 2026-08-21, CORRECTED WITHIN THE HOUR by an adversary. any_already_present asks whether each
    # token exists ANYWHERE in the old text, independently, so two unrelated comment lines
    # mentioning shadow-whisper and overflow-hidden three hundred lines apart forgave a grouped
    # card that had never existed. The offense is the PAIRING, so ask the old text the same
    # proximity question this rule asks the new one.
    if co_located(data, [m.group(0), "overflow-hidden"], window=120):
        continue
    offend = True
    break

# ---- RULE 2, 2026-08-10: DOUBLED CHROME, the boxing he keeps flagging. ----
# Owner twice in one week: "why the fuck is this still boxing?" and "i dont like how evrth is boxed
# yk i told you you keep doing that". The law already said it in two places and nothing enforced it,
# which is exactly why it kept shipping: LOCKFILE 17.2 (a card carrying elevation drops its border,
# never both) and the no-container section (a container PLUS a hairline between every row is two
# devices claiming one boundary). This fires when a container edge and per-row dividers land within
# a few lines of each other in the SAME added block.
# Setting a border or a radius to ZERO is the OPPOSITE of boxing, so every numeric branch below
# requires a non-zero value. Caught on the first real edit after this rule shipped: removing the
# boxing from the reviews mockup wrote `borderRadius = '0'` and the rule blocked the fix it existed
# to encourage. A check that blocks the correction is worse than no check.
CONTAINER = re.compile(
    r"(border\s+border-s-border"
    r"|border\s*[:=]\s*['\"]?\s*[1-9]\d*px"      # CSS `border: 1px` AND JS `style.border = "1px ...`
    r"|borderRadius\s*[:=]\s*['\"]?\s*[1-9]"     # the JS form a mockup injection uses
    r"|rounded-\[?2[04]px\]?|rounded-card"
    r"|shadow-whisper|shadow-elevation)", re.I)
# 2026-08-18 fix: this rule refused the contract's OWN locked grouped list-card grammar. MEASURED
# `rounded-[24px] shadow-whisper bg-white divide-y divide-s-border` (category members in one card,
# hairline-divided rows) returned BLOCK , a container carrying row dividers is exactly what that
# shape IS, not doubled chrome. Radius-24 + shadow-whisper together is the grouped-list-card
# signature (LOCKFILE "grouped LIST-card 24"); when both co-occur, skip , this rule still governs
# the INDIVIDUAL entity-card shape (radius 16 + border, LOCKFILE "individual entity-card 16").
# 2026-08-18: `rounded-3xl` is Tailwind's OWN 24px token (1.5rem) and 13 sites in app/components
# already spell it that way, so the identical locked card passed or blocked on spelling alone.
GROUPED_LIST_SHAPE = re.compile(r"(rounded-\[?24px\]?|rounded-3xl|rounded-\[1\.5rem\])", re.I)
ROWLINES_STRONG = re.compile(r"(divide-y|divide-s-border)", re.I)
# a single `border-b`/`border-t` is a HEADER (or footer) divider inside one card, not a per-row
# divider , MEASURED it blocked a card carrying a border-b header. A genuine per-row divider is
# written once in source but rendered per-row via `.map(`; only count it as a row-divider signal
# when a `.map(` sits just before it, the way this codebase actually renders repeated rows.
ROWLINES_WEAK = re.compile(r"(border-b[\s\"'`]|borderBottom|border-t[\s\"'`])", re.I)
MAP_NEARBY = re.compile(r"\.map\s*\(")


def _container_scope(blob, m):
    """2026-08-18: the grouped-list exemption below read a plus or minus 400-character window, so a
    legal grouped card ANYWHERE nearby exempted an unrelated card nested inside it (MEASURED: a
    `rounded-card border border-s-border ... divide-y` entity card inside a `rounded-[24px]
    shadow-whisper` section passed). Scope it to the element the match actually sits in: the
    enclosing JSX/HTML opening tag, else the enclosing class string when an edit replaces only a
    class list. None = neither was found, and the caller keeps the old window (fail-open)."""
    start = blob.rfind("<", 0, m.start())
    if start != -1:
        i = m.end()
        while True:
            j = blob.find(">", i)
            if j == -1:
                break
            if j and blob[j - 1] in "=!<":   # `=>` / `>=` inside an attribute expression
                i = j + 1
                continue
            if j - start <= 1200:
                return blob[start:j + 1]
            break
    quoted = []
    for q in ('"', "'", "`"):
        a = blob.rfind(q, 0, m.start())
        b = blob.find(q, m.end())
        if a != -1 and b != -1 and b - a <= 600:
            quoted.append(blob[a:b + 1])
    return min(quoted, key=len) if quoted else None


def _has_row_signal(blob, m):
    win_start = max(0, m.start() - 400)
    window = blob[win_start:m.end() + 400]
    scope = _container_scope(blob, m) or window
    if GROUPED_LIST_SHAPE.search(scope) and re.search(r"shadow-whisper", scope, re.I):
        return False, window, None  # the LOCKED grouped list-card shape, legal by design
    sm = ROWLINES_STRONG.search(window)
    if sm:
        return True, window, sm.group(0)
    for wm in ROWLINES_WEAK.finditer(window):
        abs_pos = win_start + wm.start()
        if MAP_NEARBY.search(blob[max(0, abs_pos - 300):abs_pos]):
            return True, window, wm.group(0)
    return False, window, None


boxed = None
if rule2_applies and not offend:
    for m in CONTAINER.finditer(blob):
        rowsig, window, row_text = _has_row_signal(blob, m)
        if not rowsig:
            continue
        if re.search(r"(entity-ok|boxed-ok)\s*:", window, re.I):
            continue
        # Same correction as rule 1: the offense is a bordered container NEXT TO a row divider,
        # not either token existing somewhere in the file.
        if co_located(data, [m.group(0), row_text], window=200):
            continue
        boxed = m.group(0).strip()
        break

if boxed and not offend:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason":
                "DOUBLED CHROME , the boxing he keeps flagging (owner, twice this week: 'why the "
                "fuck is this still boxing?' and 'i dont like how evrth is boxed yk i told you you "
                "keep doing that'). This edit puts a container edge (" + boxed + ") within a few "
                "lines of per-row dividers. Two devices claiming the same boundary, and the law "
                "already forbids it: LOCKFILE 17.2 says a card carrying elevation drops its border, "
                "never both, and the no-container section says a container plus a hairline between "
                "every row is doubled chrome. PICK ONE: either rows sit inside a container and are "
                "hairline-divided with NO outer border, or they are borderless rows separated by "
                "whitespace with no container at all. A settings list, a form section, a menu of "
                "destinations and an account hub are named as surfaces that get NO container. If "
                "this genuinely needs both, add `boxed-ok: <reason>` on the line, or touch "
                "~/.claude/entity-card-skip.flag (5-min TTL)."
        }
    }))
    sys.exit(0)

if offend:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason":
                "ENTITY-CARD PRINCIPLE (owner 2026-07-19): this is an ENTITY-LIST component ("
                + base + ") and the edit adds the GROUPED list-card grammar (`overflow-hidden` + "
                "`shadow-whisper`). Distinct ENTITIES (people/stylists, salons) must be INDIVIDUAL "
                "cards , one card per entity, gap-separated, `rounded-card border border-s-border "
                "bg-white` (the SalonResultCard grammar) , NOT merged into one group card. A group "
                "card is only for CATEGORY members (services under a heading, products). See the "
                "LOCKFILE 'individual entity-card' row + TASTE_LOG 'group card vs individual card'. "
                "If this group card genuinely wraps this entity's OWN CATEGORY items (e.g. one "
                "stylist's services), add `entity-ok: <reason>` on the line, or touch "
                "~/.claude/entity-card-skip.flag (5-min TTL)."
        }
    }))
    sys.exit(0)

sys.exit(0)
