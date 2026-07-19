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
"""
import json, os, re, sys, time

ENTITY_NAME = re.compile(r"(staff|stylist|team|barber|therapist|employee|provider|people|member)", re.I)

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

if not fp.endswith((".tsx", ".jsx")):
    sys.exit(0)
low = fp.lower()
if not (("/app/" in low or low.startswith("app/")) or "/components" in low or low.startswith("components")):
    sys.exit(0)
if any(s in low for s in ("/public/", "_mockups/", "/_audits/", "node_modules", ".d.ts", "/generated", "/dev/")):
    sys.exit(0)

# only entity-list components (by filename)
base = fp.rsplit("/", 1)[-1]
if not ENTITY_NAME.search(base):
    sys.exit(0)
# ...but a "*ProfilePage" / "*Profile" single-entity page legitimately groups its OWN
# category items (a stylist's services) , don't gate those by default.
if re.search(r"profile", base, re.I):
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

# the GROUPED list-card signature: shadow-whisper co-occurring with overflow-hidden
offend = False
for m in re.finditer(r"shadow-whisper", blob):
    window = blob[max(0, m.start() - 120):m.end() + 120]
    if "overflow-hidden" not in window:
        continue
    esc = blob[max(0, m.start() - 160):m.end() + 160]
    if re.search(r"entity-ok\s*:", esc, re.I):
        continue
    offend = True
    break

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
