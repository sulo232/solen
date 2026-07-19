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
.d.ts, node_modules, _audits, /dev/). NET-NEW only (Write content / Edit new_string /
MultiEdit new_strings); pre-existing drift never blocks an unrelated edit.

Escape hatches:
  - Per line:  add `radius-ok: <reason>` (or `drift-ok:`) on/near the offending line
    (also clears the rare case of a doc-comment that juxtaposes another bracket radius
    with the word shadow-whisper within ~90 chars).
  - This turn: touch ~/.claude/card-radius-skip.flag        # 5-minute TTL
FAIL-OPEN on any parse error.
"""
import json, os, re, sys, time

WHISPER_RADIUS = 24  # the grouped list-card grammar (shadow-whisper). Change ONLY with an owner yes.

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
# skip non-design-surface files
if any(s in low for s in ("/public/", "_mockups/", "/_audits/", "node_modules", ".d.ts", "/generated", "/dev/")):
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
