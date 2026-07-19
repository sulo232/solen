#!/usr/bin/env python3
"""card-radius-gate , PreToolUse (Edit|Write|MultiEdit).

Owner 2026-07-19 ("look at the border there is none in stylist choosing but there is
in selecting the haircut ... many other places inconsistencies and we even made gates
for it ... first we need to make a new gate"): cross-page CARD treatment drifted. The
booking flow alone renders three different card radii , services rounded-[24px], stylist
rounded-[16px], pay/hair rounded-[12px] , and inconsistent borders. No gate checked card
radius, so the drift shipped.

THE RULE (LOCKFILE design-contract, `radius` row): a CARD/block container is `rounded-card`
(16px). This gate BLOCKS a NET-NEW card container that uses any OTHER radius, so cross-page
cards stay one radius.

What counts as a CARD container (kept narrow to stay false-positive-free): a `rounded-[Npx]`
that co-occurs (same className, within ~90 chars) with a CARD signal , `border border-s-border`
or `shadow-whisper` or `shadow-elevation`. That is the bordered/shadowed block treatment, NOT
an input (rounded-[12px] fill, no border-s-border+shadow pair), NOT a pill (rounded-full), NOT
a sheet (rounded-t-[28px], handled by the `-t-` exclusion), NOT an image (rounded-[12px] alone).

Scope: design-surface .tsx/.jsx under app|components (NOT mockups/public, generated, .d.ts,
node_modules, _audits). NET-NEW only (Write content / Edit new_string / MultiEdit new_strings);
pre-existing drift never blocks an unrelated edit.

Escape hatches:
  - Per line:  add `radius-ok: <reason>` on/near the offending line (within ~120 chars).
  - This turn: touch ~/.claude/card-radius-skip.flag        # 5-minute TTL
FAIL-OPEN on any parse error.
"""
import json, os, re, sys, time

CANON_RADIUS = 16  # LOCKFILE `radius` row: card/block = rounded-card (16px). Change ONLY with an owner yes.

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

CARD_SIGNAL = re.compile(r"border border-s-border|shadow-whisper|shadow-elevation")
RADIUS = re.compile(r"rounded-\[(\d+)px\]")

offenders = []
for m in RADIUS.finditer(blob):
    n = int(m.group(1))
    if n == CANON_RADIUS:
        continue
    # sheet corners (rounded-t-[28px] / rounded-b-...) are not a card block
    pre = blob[max(0, m.start() - 12):m.start()]
    if re.search(r"rounded-[tbrl]{1,2}-\[$", pre) or pre.rstrip().endswith("-t") or pre.rstrip().endswith("-b"):
        continue
    # is this a CARD? require a card signal within the same className window
    window = blob[max(0, m.start() - 90):m.end() + 90]
    if not CARD_SIGNAL.search(window):
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
                "CARD RADIUS DRIFT (owner 2026-07-19, cross-page consistency): a card/block container "
                "(border-s-border / shadow-whisper / shadow-elevation) must use `rounded-card` (16px) per "
                "the LOCKFILE `radius` row , so cross-page cards stay ONE radius. This edit adds a card at "
                "rounded-[" + "px], rounded-[".join(str(n) for n in uniq) + "px]. The booking flow already "
                "drifted (services rounded-24, stylist rounded-16, pay/hair rounded-12); that is exactly the "
                "inconsistency the owner flagged. Use `rounded-card` (or rounded-[16px]). If this is a "
                "genuinely-different element (a sheet, a real exception the owner approved), add "
                "`radius-ok: <reason>` on the line, or touch ~/.claude/card-radius-skip.flag (5-min TTL)."
        }
    }))
    sys.exit(0)

sys.exit(0)
