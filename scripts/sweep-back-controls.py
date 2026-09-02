"""Read every back control out of shipped source. READ ONLY, writes one report.

Shipped means: not a /dev/ route, not a mockup, not a test. A back control is a
button whose surrounding lines carry a back word in any of the four languages,
or a router.back() call, with an ArrowLeft or ChevronLeft glyph inside it.

Deliberately reports the raw SITES and lets a human collapse them into variants,
because the last two regex sweeps I ran on this both produced numbers I could
not defend: one over-counted carousel arrows at 44, the next missed the global
header entirely at 16. A number I cannot defend is worse than no number.
"""
import os
import io
import re
import json
import collections

ROOT = "/Users/sulo/Documents/solen/.claude/worktrees/stress-test-gates-hooks-6dc8e8"
DIRS = ["app", "components", "components-legacy"]
SKIP = ("/dev/", "/_mockups/", ".test.", ".spec.")

BACK_WORD = re.compile(r"\b(Zur(ü|ue)ck|Back|Retour|Indietro)\b")
GLYPH = re.compile(r"<(ArrowLeft|ChevronLeft)\b([^>]*)>")
SIZE = re.compile(r"size=\{(\d+)\}")
BOX = re.compile(r"\bh-(\d+|\[\d+px\])\s+w-(\d+|\[\d+px\])")

sites = []
for d in DIRS:
    base = os.path.join(ROOT, d)
    for dirpath, _, names in os.walk(base):
        for n in names:
            if not n.endswith(".tsx"):
                continue
            fp = os.path.join(dirpath, n)
            rel = os.path.relpath(fp, ROOT)
            if any(s in "/" + rel for s in SKIP):
                continue
            lines = io.open(fp, encoding="utf-8").read().split("\n")
            for i, line in enumerate(lines):
                m = GLYPH.search(line)
                if not m:
                    continue
                # Window of 12 lines above: is this glyph inside a back control?
                ctx = "\n".join(lines[max(0, i - 12):i + 2])
                is_back = bool(BACK_WORD.search(ctx)) or "router.back()" in ctx
                if not is_back:
                    continue
                icon = SIZE.search(m.group(2))
                box = BOX.search(ctx)
                sites.append({
                    "file": rel,
                    "line": i + 1,
                    "glyph": m.group(1),
                    "iconSize": icon.group(1) if icon else "?",
                    "box": (box.group(1) + "x" + box.group(2)) if box else "?",
                })

print("BACK CONTROLS IN SHIPPED SOURCE: %d sites in %d files\n"
      % (len(sites), len({s["file"] for s in sites})))
print("  glyph:      ", dict(collections.Counter(s["glyph"] for s in sites)))
print("  icon size:  ", dict(collections.Counter(s["iconSize"] for s in sites)))
print("  box class:  ", dict(collections.Counter(s["box"] for s in sites)))
print()
for s in sorted(sites, key=lambda x: (x["file"], x["line"])):
    print("  %-62s :%-5d %-12s icon %-3s box %s"
          % (s["file"], s["line"], s["glyph"], s["iconSize"], s["box"]))

out = os.path.join(ROOT, "_design-system", "_back-controls.json")
io.open(out, "w", encoding="utf-8").write(json.dumps(sites, indent=2) + "\n")
print("\nwrote", os.path.relpath(out, ROOT))
