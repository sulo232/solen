#!/usr/bin/env python3
"""card-radius-gate , PreToolUse (Edit|Write|MultiEdit).

Owner 2026-07-19: cross-page CARD treatment drifted (the booking flow rendered the
services grouped-card at rounded-24 but the stylist step as a borderless rounded-16
row list). No gate checked card radius, so the drift shipped. The owner set the canon
by pointing at the SERVICES step ("pick whichever the services use"): the grouped
list-card grammar is rounded-[24px].

THE ONE ENFORCED INVARIANT , the GROUPED LIST-CARD grammar:
    `overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper`
This exact grammar is shared, verified 2026-07-19, across the salon Services,
Produkte, Pakete, the service sheet, staff profiles, the dashboard, and the booking
services + stylist steps , 12 call-sites, ALL rounded-[24px]. It is the ONE card
family that is genuinely a single radius, and `shadow-whisper` is its reliable
marker. This gate BLOCKS a NET-NEW `shadow-whisper` card written at any radius other
than 24, so that family can never split again.

Deliberately NOT gated (would be false positives):
  - `shadow-elevation-N` is a GENERAL elevation utility, not a card family. It is used
    at many radii by design , SalonCard (locked primitive) at 22, carousels at 22,
    sidebars/referral/partner tiles at 12/14/18, form cards at rounded-card(16). An
    audit found 21 such legitimate radii; gating them would be noise. Left alone.
  - Form/summary cards use the `rounded-card` TOKEN (16px), not a bracket radius, so
    they are outside this gate's `rounded-[Npx]` match anyway.
  - Bordered-no-shadow bracket radii (inputs, tiles, chips, rows) span 8..24 by design.
  - Sheets (rounded-t-/rounded-b-), images, inputs.

Scope: design-surface .tsx/.jsx under app|components (NOT mockups/public, generated,
.d.ts, node_modules, _audits). NET-NEW only (Write content / Edit new_string /
MultiEdit new_strings); pre-existing drift never blocks an unrelated edit.

Escape hatches:
  - Per line:  add `radius-ok: <reason>` (or `drift-ok:`) on/near the offending line
    (also clears the rare case of a doc-comment that juxtaposes another bracket radius
    with the word shadow-whisper within ~90 chars).
  - This turn: touch ~/.claude/card-radius-skip.flag        # 5-minute TTL
FAIL-OPEN on any parse error.

2026-08-18 stress-test fix: MEASURED that this gate exempted `/dev/`, and since
2026-08-07 the real mockups live at `app/[locale]/dev/**/*.tsx`, not `public/_mockups/
**.html` , so a shadow-whisper card at the wrong radius written into a `/dev/` route
sailed straight through, exactly where the radius call is made now. `/dev/` dropped
from the skip list; `app/[locale]/dev/**` files are `/app/` paths already, so they were
always in scope by the app|components check, only the blanket `/dev/` exclusion below it
was standing them down. Also added the file's first `--selftest`, it never had one.
"""
import json, os, re, sys, time

WHISPER_RADIUS = 24  # the grouped list-card grammar (shadow-whisper). Change ONLY with an owner yes.


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
    """2026-08-18: proves /dev/ is back in scope without breaking the exemptions around it.
    2026-08-21: proves a reword that leaves an already-offending radius+shadow-whisper pair
    untouched is forgiven, while a genuine addition or a genuine radius change still blocks."""
    WRONG = '<div className="overflow-hidden rounded-[16px] border border-s-border bg-white shadow-whisper">'
    cases = [
        ("a /dev/ mockup route at the WRONG radius must now block",
         "/Users/sulo/Documents/solen/app/[locale]/dev/airbnb-01-home/page.tsx",
         '<div className="overflow-hidden rounded-[16px] border border-s-border bg-white shadow-whisper">x</div>',
         True, None),
        ("a /dev/ mockup route at the CORRECT radius (24) must pass",
         "/Users/sulo/Documents/solen/app/[locale]/dev/airbnb-01-home/page.tsx",
         '<div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">x</div>',
         False, None),
        ("a real app page at the wrong radius still blocks (pre-existing behavior)",
         "/Users/sulo/Documents/solen/app/[locale]/salon/[slug]/page.tsx",
         '<div className="overflow-hidden rounded-[16px] border border-s-border bg-white shadow-whisper">x</div>',
         True, None),
        ("public/_mockups/*.html stays out of scope (not .tsx/.jsx)",
         "/Users/sulo/Documents/solen/public/_mockups/salon.html",
         '<div class="overflow-hidden rounded-[16px] border border-s-border bg-white shadow-whisper">x</div>',
         False, None),
        ("a shadow-elevation card at any radius is not gated at all",
         "/Users/sulo/Documents/solen/app/[locale]/dev/airbnb-02-search/page.tsx",
         '<div className="rounded-[12px] shadow-elevation-2 bg-white">x</div>',
         False, None),
        ("2026-08-21: a text-only reword that leaves the offending radius+shadow-whisper "
         "pair BYTE-IDENTICAL on both sides must be forgiven, not refused",
         "/Users/sulo/Documents/solen/app/[locale]/salon/[slug]/page.tsx",
         WRONG + "Neue Uberschrift</div>",
         False, WRONG + "Alte Uberschrift</div>"),
        ("2026-08-21 narrowness: a genuine ADDITION of the wrong-radius card (old had none) "
         "must still block",
         "/Users/sulo/Documents/solen/app/[locale]/salon/[slug]/page.tsx",
         WRONG + "x</div>",
         True, '<div className="p-4">x</div>'),
        ("2026-08-21 narrowness: a genuine radius CHANGE (16 -> 18, still wrong) must still "
         "block even though shadow-whisper itself did not move",
         "/Users/sulo/Documents/solen/app/[locale]/salon/[slug]/page.tsx",
         '<div className="overflow-hidden rounded-[18px] border border-s-border bg-white shadow-whisper">x</div>',
         True, WRONG + "x</div>"),
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

SKIP = os.path.expanduser("~/.claude/card-radius-skip.flag")
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

if not fp.endswith((".tsx", ".jsx")):
    sys.exit(0)
low = fp.lower()
if not (("/app/" in low or low.startswith("app/")) or "/components" in low or low.startswith("components")):
    sys.exit(0)
# skip non-design-surface files , "/dev/" removed 2026-08-18: real mockups now live at
# app/[locale]/dev/**/*.tsx and this exclusion was standing the radius check down exactly there.
if any(s in low for s in ("/public/", "_mockups/", "/_audits/", "node_modules", ".d.ts", "/generated")):
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

RADIUS = re.compile(r"rounded-\[(\d+)px\]")

# 2026-08-21 stress-test fix: this gate used to read only the ADDED text, so a reword that
# leaves an already-offending `rounded-[Npx] ... shadow-whisper` pair untouched on both sides
# of an Edit got refused as if it had just introduced the violation. Byte-identical fix: if the
# exact radius token AND the shadow-whisper token were both already present, unchanged, in the
# text this edit replaces, the edit did not add them, so forgive. Fails closed on any import
# error, meaning the gate keeps refusing exactly as it did before this fix.
try:
    sys.path.insert(0, os.path.expanduser("~/.claude/hooks/_lib"))
    from unchanged_by_this_edit import co_located
except Exception:
    def co_located(_data, _offenders, window=400):
        return False

offenders = []
for m in RADIUS.finditer(blob):
    n = int(m.group(1))
    if n == WHISPER_RADIUS:
        continue
    # sheet corners (rounded-t-[28px] / rounded-b-...) are not a card block
    pre = blob[max(0, m.start() - 12):m.start()]
    if re.search(r"rounded-[tbrl]{1,2}-\[$", pre) or pre.rstrip().endswith("-t") or pre.rstrip().endswith("-b"):
        continue
    # ONLY the shadow-whisper grouped-card grammar is gated
    window = blob[max(0, m.start() - 90):m.end() + 90]
    if "shadow-whisper" not in window:
        continue
    # per-line escape
    esc_win = blob[max(0, m.start() - 120):m.end() + 120]
    if re.search(r"radius-ok\s*:", esc_win, re.I) or re.search(r"drift-ok\s*:", esc_win, re.I):
        continue
    # 2026-08-21, CORRECTED WITHIN THE HOUR by an adversary. This first read
    # any_already_present(), which asks whether each token exists ANYWHERE in the old text,
    # independently. The offense here is the PAIRING, a wrong radius next to shadow-whisper, so
    # two harmless decoy lines (a chip that says rounded-[16px], a caption that says
    # shadow-whisper) forgave a genuinely brand new violating card elsewhere in the same edit.
    # Reproduced with plain readable JSX, no cleverness needed. co_located asks the old text the
    # same question this gate asks the new one: are these two things near each other.
    if co_located(data, [m.group(0), "shadow-whisper"], window=200):
        continue
    offenders.append(n)

if offenders:
    uniq = sorted(set(offenders))
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason":
                "CARD RADIUS DRIFT (owner 2026-07-19, cross-page consistency): the GROUPED LIST-CARD "
                "grammar , `border border-s-border bg-white shadow-whisper` , is rounded-[24px] "
                "everywhere (salon Services / Produkte / Pakete / service sheet / staff / dashboard + "
                "the booking services & stylist steps, 12 call-sites). This edit adds a shadow-whisper "
                "card at rounded-[" + "px], rounded-[".join(str(n) for n in uniq) + "px]. Use "
                "rounded-[24px] so the grouped-card family stays one radius. (shadow-elevation cards "
                "are NOT gated , that utility is used at many radii by design.) If this is a genuine "
                "owner-approved exception, add `radius-ok: <reason>` on the line, or touch "
                "~/.claude/card-radius-skip.flag (5-min TTL)."
        }
    }))
    sys.exit(0)

sys.exit(0)
