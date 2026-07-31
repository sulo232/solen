#!/usr/bin/env python3
"""draw-wind.py , paint the wind lines ON THE RENDERED FRAMES, in 2D.

Written 2026-07-31 after six rounds of trying to place the air in 3D. Owner, repeatedly:
"the air is coming out of fucking middle of nowhere... you keep complicating... it cannot be
that fucking hard."

He is right, and the complication was self-inflicted. Every previous attempt put the air in the
3D scene and hoped it would land next to the nozzle after projection. It could not: the mesh has
no nozzle to anchor to, so the anchor was always an inference, and an inference from a bounding
box is only correct at one camera angle.

This does the obvious thing instead. It looks at the RENDERED PIXELS, finds where the nozzle
actually is in that exact frame, and draws three wavy strokes starting there. No projection, no
guessing, no 3D. Where the strokes begin is measured, per frame, from the image itself.

The strokes are the drawn wind glyph: constant weight, a shallow sine, a small curl at the tip.

Usage:
  python3 scripts/capture/draw-wind.py <frames-dir> [--hold-in 9] [--hold-out 18]
                                       [--side left|right] [--color 154,160,166]
"""
import argparse
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw


def nozzle_point(alpha, side):
    """Where the nozzle is IN THIS FRAME, read off the rendered alpha.

    The nozzle is the extreme of the silhouette on the side the dryer points. Take the outermost
    few columns and use the vertical centre of the material there: that is the mouth, measured,
    not assumed.
    """
    cols = np.nonzero((alpha > 25).any(axis=0))[0]
    if len(cols) == 0:
        return None
    if side == "left":
        x0 = cols.min()
        band = alpha[:, x0:x0 + 7]
    else:
        x0 = cols.max()
        band = alpha[:, max(0, x0 - 6):x0 + 1]
    rows = np.nonzero((band > 25).any(axis=1))[0]
    if len(rows) == 0:
        return None
    return int(x0), int(rows.mean())


def stroke(draw, x0, y0, length, amp, weight, direction, phase, colour, alpha_255):
    """One wind stroke: constant weight, shallow sine, a curl at the tip."""
    pts = []
    n = 46
    for i in range(n + 1):
        u = i / n
        x = x0 + direction * u * length
        curl = max(0.0, (u - 0.80) / 0.20)
        y = y0 + math.sin(u * math.pi * 2.0 + phase) * amp * (0.30 + u * 0.85) - curl * curl * amp * 2.1
        pts.append((x, y))
    draw.line(pts, fill=colour + (alpha_255,), width=weight, joint="curve")
    # rounded caps, so it reads as an ink stroke rather than a cut ribbon
    r = weight / 2
    for px, py in (pts[0], pts[-1]):
        draw.ellipse([px - r, py - r, px + r, py + r], fill=colour + (alpha_255,))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frames")
    ap.add_argument("--hold-in", type=int, default=9)
    ap.add_argument("--hold-out", type=int, default=18)
    ap.add_argument("--side", default="left", choices=["left", "right"])
    ap.add_argument("--color", default="154,160,166")
    ap.add_argument("--lines", type=int, default=3)
    args = ap.parse_args()

    colour = tuple(int(v) for v in args.color.split(","))
    files = sorted(f for f in os.listdir(args.frames) if f.endswith(".png"))
    if not files:
        print("no frames", file=sys.stderr)
        sys.exit(1)
    total = len(files)
    move_from, move_to = args.hold_in, total - args.hold_out
    drawn = 0

    for i, name in enumerate(files):
        path = os.path.join(args.frames, name)
        im = Image.open(path).convert("RGBA")
        a = np.array(im)[:, :, 3]

        # AIR ONLY WHILE IT MOVES. At rest the icon is just the dryer, which is what he asked for.
        if i < move_from or i >= move_to:
            continue
        p = (i - move_from) / max(1, (move_to - 1 - move_from))
        # in fast, out slow, so it never pops and never lingers past the settle
        fade = min(1.0, p / 0.15) * min(1.0, (1.0 - p) / 0.28)
        if fade <= 0.02:
            continue

        np_ = nozzle_point(a, args.side)
        if np_ is None:
            continue
        nx, ny = np_

        W, H = im.size
        gap = 5
        d = -1 if args.side == "left" else 1
        x0 = nx + d * gap
        overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        span = W * 0.20
        for k in range(args.lines):
            row = k - (args.lines - 1) / 2
            stroke(
                od,
                x0,
                ny + row * 9.5,
                span * (1.0 - 0.13 * abs(row)),
                5.2,
                3,
                d,
                p * math.pi * 2.0 + k * 0.9,
                colour,
                int(235 * fade),
            )
        im = Image.alpha_composite(im, overlay)
        im.save(path)
        drawn += 1

    print(f"wind drawn on {drawn} of {total} frames, anchored to the measured nozzle in each one")


if __name__ == "__main__":
    main()
