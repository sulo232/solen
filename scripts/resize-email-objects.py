#!/usr/bin/env python3
"""
scripts/resize-email-objects.py , shrink the three 3D object renders for email, with PIL.

WHY THIS IS A SEPARATE SCRIPT AND NOT sharp() INSIDE build-email-art.mjs (moved out 2026-08-26):
`npm ls sharp` reports `sharp@0.34.5 extraneous -> ../../../node_modules/sharp` , it is not in
package.json, it was only ever there because this worktree's node_modules sits under a parent
checkout that happens to have it installed for something else. A fresh `npm ci` on a clean clone
would not have it, and build-email-art.mjs would fail on the one step that imported it. The fix
is not to declare it for one call site; this repo already resizes PNGs with PIL for the exact
same job (scripts/build-email-assets.py's build_category_icons()), so the object-icon step moves
here instead. build-email-art.mjs invokes this as a subprocess (Playwright plus Python, both
already real dependencies of this repo) and reads back one JSON line from stdout. Do not re-add
sharp to fix this again , if the day comes to render richer than PIL can do, extend this script.

QUANTIZER, measured before picking it: PIL's default `Image.ADAPTIVE` palette at the same 128
colours sharp used landed at 83.8 KB and 87.9 KB for two of the three objects, over the 60 KB
budget these are given. `Image.quantize(method=Image.Quantize.FASTOCTREE)` at the same 128
colours landed all three at 9.1-13.4 KB, checked by eye against the un-quantized resize for
banding on the smooth clay gradients (none visible) before picking it , octree quantization
suits these flat-region matte-clay renders the same way sharp's palette pass did.

Run: python3 scripts/resize-email-objects.py
In:  public/_email-assets/generated/obj-{confirmed,cancelled,reminder}.png (untouched)
Out: public/_email-assets/art/obj-{confirmed,cancelled,reminder}.png (420px wide, quantized)
     one JSON line on stdout: [{"file","bytes","width","height"}, ...] for the caller to read
"""
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC_DIR = os.path.join(ROOT, "public", "_email-assets", "generated")
OUT_DIR = os.path.join(ROOT, "public", "_email-assets", "art")

OBJECTS = ["obj-confirmed.png", "obj-cancelled.png", "obj-reminder.png"]
TARGET_WIDTH = 420
COLORS = 128
MAX_BYTES = 60 * 1024  # kept equal to build-email-art.mjs's OBJECT_MAX_BYTES on purpose


def resize_and_quantize(name):
    src = Image.open(os.path.join(SRC_DIR, name)).convert("RGB")
    w, h = src.size
    new_h = round(h * TARGET_WIDTH / w)
    resized = src.resize((TARGET_WIDTH, new_h), Image.LANCZOS)
    quantized = resized.quantize(
        colors=COLORS, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG
    )
    out_path = os.path.join(OUT_DIR, name)
    quantized.save(out_path, format="PNG", optimize=True)
    return {
        "file": name,
        "bytes": os.path.getsize(out_path),
        "width": quantized.width,
        "height": quantized.height,
    }


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    results = [resize_and_quantize(name) for name in OBJECTS]

    for r in results:
        print(f"  {r['bytes'] / 1024:6.1f} KB  {r['file']}", file=sys.stderr)

    over = [r for r in results if r["bytes"] > MAX_BYTES]
    if over:
        print(
            "asset too heavy for email: "
            + ", ".join(f"{r['file']} ({r['bytes'] / 1024:.1f} KB, budget {MAX_BYTES / 1024:.0f} KB)" for r in over),
            file=sys.stderr,
        )
        sys.exit(1)

    # The one line a caller should parse; everything else above goes to stderr on purpose.
    print(json.dumps(results))
