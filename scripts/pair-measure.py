#!/usr/bin/env python3
"""pair-measure , does an app screen read as the same product as its web counterpart?

Six builders are copying six different web pages at once, so the risk is not that any one screen
misses. It is that they come back inconsistent with EACH OTHER: six versions of the same card. This
answers both questions from the same numbers.

Usage:
    python3 pair-measure.py <dir-with-screenshots>

It pairs files by a shared stem: anything ending -app.png against the same name ending -web.png.

Per pair it reports, and every number is measured, none inferred:
    ground       the background colour at five points (4 corners inset 24px, plus centre-top)
    top          mean brightness of the top 400 rows, which is where the header and the first
                 heading live and where a wrong surface shows first
    ink          share of pixels darker than 96, a proxy for how much type and photo is on screen
    warm         share of pixels whose channels spread more than 18, which catches a screen that
                 has gone grey and dead against one carrying photography

Then, across ALL app screens, the spread of each number. A tight spread means the six builders
converged. A wide one names which screen walked off on its own.
"""
import os
import sys
from collections import defaultdict

try:
    from PIL import Image
except ImportError:
    sys.exit("PIL is not available here")


def sample(im, n=5):
    w, h = im.size
    pts = [(24, 24), (w - 25, 24), (24, h - 25), (w - 25, h - 25), (w // 2, 24)]
    return [im.getpixel((min(max(x, 0), w - 1), min(max(y, 0), h - 1)))[:3] for x, y in pts]


def measure(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    top = im.crop((0, 0, w, min(400, h)))
    tp = list(top.getdata())
    mean_top = sum(sum(p) / 3 for p in tp) / len(tp)
    allp = list(im.resize((w // 3 or 1, h // 3 or 1)).getdata())
    ink = sum(1 for p in allp if sum(p) / 3 < 96) / len(allp)
    warm = sum(1 for p in allp if max(p) - min(p) > 18) / len(allp)
    return {"size": (w, h), "ground": sample(im), "top": mean_top, "ink": ink, "warm": warm}


def spread(name, vals):
    if not vals:
        return
    lo, hi = min(vals, key=lambda kv: kv[1]), max(vals, key=lambda kv: kv[1])
    print("  %-6s %6.1f (%s)  to  %6.1f (%s)   spread %.1f"
          % (name, lo[1], lo[0], hi[1], hi[0], hi[1] - lo[1]))


def main():
    d = sys.argv[1] if len(sys.argv) > 1 else "."
    stems = defaultdict(dict)
    for f in sorted(os.listdir(d)):
        for suffix, side in (("-app.png", "app"), ("-web.png", "web")):
            if f.endswith(suffix):
                stems[f[: -len(suffix)]][side] = os.path.join(d, f)

    if not stems:
        sys.exit("no <stem>-app.png / <stem>-web.png pairs in %s" % d)

    app_top, app_ink, app_warm = [], [], []
    print("PAIRS")
    for stem in sorted(stems):
        pair = stems[stem]
        if "app" not in pair or "web" not in pair:
            print("  %-22s MISSING the %s side" % (stem, "web" if "app" in pair else "app"))
            continue
        a, b = measure(pair["app"]), measure(pair["web"])
        app_top.append((stem, a["top"]))
        app_ink.append((stem, a["ink"] * 100))
        app_warm.append((stem, a["warm"] * 100))
        white_a = sum(1 for p in a["ground"] if min(p) > 246)
        white_b = sum(1 for p in b["ground"] if min(p) > 246)
        print("  %-22s top %6.1f vs %6.1f (%+5.1f)   ink %4.1f%% vs %4.1f%%   "
              "warm %4.1f%% vs %4.1f%%   white %d/5 vs %d/5"
              % (stem, a["top"], b["top"], a["top"] - b["top"],
                 a["ink"] * 100, b["ink"] * 100, a["warm"] * 100, b["warm"] * 100,
                 white_a, white_b))

    print("\nACROSS THE APP SCREENS , do the six builders agree with each other?")
    spread("top", app_top)
    spread("ink%", app_ink)
    spread("warm%", app_warm)
    print("\n  A wide spread names the screen that walked off on its own. Open that one first.")


if __name__ == "__main__":
    main()
