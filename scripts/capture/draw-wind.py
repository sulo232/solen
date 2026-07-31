#!/usr/bin/env python3
"""draw-wind.py , paint the wind arcs ON THE RENDERED FRAMES, in 2D.

REBUILT 2026-07-31 against the owner's own reference image (a hair-dryer line icon), after nine
attempts built from his words alone. What the reference actually shows, read off the image:

  * THREE strokes, not the long wavy squiggles I had been drawing.
  * Each is a SHORT ARC, a shallow C opening back toward the nozzle. Short, not long.
  * They sit OUTSIDE the nozzle with a clear gap, stacked, centred on the nozzle axis.
  * Even weight, even spacing.

His motion note on top of the still: each arc is BORN at the nozzle, travels outward, and fades as
it goes, one after another rather than as a set. So this is an emitter of short arcs, not three
persistent lines. "Morphs in, morphs out."

The nozzle is found per frame from the rendered pixels, using the HANDLE as the landmark: the
handle is the lowest mass in the silhouette and hangs off the rear, so the nozzle is the horizontal
end farther from it. That part survived from the previous version because it measured correctly.

Usage:
  python3 scripts/capture/draw-wind.py <frames-dir> [--hold-in 9] [--hold-out 18]
                                       [--arcs 3] [--weight 5] [--color 154,160,166]
"""
import argparse
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw


def end_profile(alpha, x0, x1):
    band = alpha[:, x0:x1]
    rows = np.nonzero((band > 25).any(axis=1))[0]
    if len(rows) == 0:
        return None, None
    return int(rows.mean()), int(rows.max() - rows.min())


def nozzle_point(alpha, side):
    """Where the nozzle is IN THIS FRAME, measured off the rendered alpha.

    The handle is the stable landmark: it hangs off the rear of the barrel and is always the lowest
    mass in the silhouette, so the nozzle is the horizontal end FARTHER from it.
    """
    cols = np.nonzero((alpha > 25).any(axis=0))[0]
    if len(cols) == 0:
        return None
    lo, hi = int(cols.min()), int(cols.max())
    band = max(4, (hi - lo) // 7)
    ly, lthick = end_profile(alpha, lo, lo + band)
    ry, rthick = end_profile(alpha, hi - band + 1, hi + 1)
    if ly is None or ry is None:
        return None

    if side == "auto":
        rows_all = np.nonzero((alpha > 25).any(axis=1))[0]
        handle_x = None
        if len(rows_all) > 6:
            cut = rows_all.min() + int((rows_all.max() - rows_all.min()) * 0.72)
            low = alpha[cut:, :] > 25
            if low.sum() > 8:
                xs = np.nonzero(low.any(axis=0))[0]
                handle_x = float(xs.mean())
        pick_left = (abs(lo - handle_x) > abs(hi - handle_x)) if handle_x is not None \
            else (lthick <= rthick)
    else:
        pick_left = side == "left"
    return (lo, ly, -1) if pick_left else (hi, ry, 1)


def arc(draw, cx, cy, radius, half_sweep, weight, direction, colour, a255, depth):
    """One short arc: a shallow C opening back toward the nozzle.

    Drawn 3D-ROUNDED rather than flat: a darker wider pass underneath and a lighter narrower pass
    on top give the stroke a lit side and a shaded side, which is what makes a 2D mark read as a
    tube at icon size. Round caps at both ends.
    """
    def pts(r, n=26):
        out = []
        for i in range(n + 1):
            t = -half_sweep + (2 * half_sweep) * (i / n)
            out.append((cx + direction * r * math.cos(t), cy + r * math.sin(t)))
        return out

    shade = tuple(max(0, c - 34) for c in colour)
    light = tuple(min(255, c + 46) for c in colour)

    body = pts(radius)
    draw.line(body, fill=shade + (a255,), width=weight, joint="curve")
    draw.line(body, fill=colour + (a255,), width=max(1, weight - 1), joint="curve")
    # highlight rides slightly outside the curve, like a specular along the top of a tube
    hi = pts(radius + depth)
    draw.line(hi, fill=light + (int(a255 * 0.75),), width=max(1, weight // 2), joint="curve")

    r = weight / 2
    for px, py in (body[0], body[-1]):
        draw.ellipse([px - r, py - r, px + r, py + r], fill=colour + (a255,))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frames")
    ap.add_argument("--hold-in", type=int, default=9)
    ap.add_argument("--hold-out", type=int, default=18)
    ap.add_argument("--side", default="auto", choices=["auto", "left", "right"])
    ap.add_argument("--color", default="154,160,166")
    ap.add_argument("--arcs", type=int, default=3)       # the reference shows three
    ap.add_argument("--weight", type=int, default=5)
    ap.add_argument("--life", type=float, default=0.42)  # how long one arc lives, as clip fraction
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

        # nothing at rest: the still icon is just the dryer
        if i < move_from or i >= move_to:
            continue
        p = (i - move_from) / max(1, (move_to - 1 - move_from))

        np_ = nozzle_point(a, args.side)
        if np_ is None:
            continue
        nx, ny, d = np_
        W, _ = im.size

        overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        near = W * 0.045          # where an arc is born, just off the nozzle
        far = W * 0.20            # where it has faded out
        any_drawn = False

        for k in range(args.arcs):
            # ONE AT A TIME: each arc is born a beat after the one before it, then they repeat, so
            # the stream reads as continuous emission rather than as three lines switching on.
            birth = k * (args.life / args.arcs)
            local = (p - birth) / args.life
            if local < 0:
                continue
            local = local % 1.0 if p - birth < args.life * 2.4 else -1
            if local < 0:
                continue
            # MORPH IN, MORPH OUT: grow quickly, hold, then fade as it travels out
            fade_in = min(1.0, local / 0.22)
            fade_out = min(1.0, (1.0 - local) / 0.45)
            alpha_f = fade_in * fade_out
            if alpha_f <= 0.03:
                continue
            dist = near + (far - near) * local
            radius = 5.4 + local * 3.6                 # opens up a little as it travels
            arc(
                od,
                nx + d * dist,
                ny,
                radius,
                0.95,                                   # shallow C, matching the reference
                args.weight,
                d,
                colour,
                int(245 * alpha_f),
                1.4,
            )
            any_drawn = True

        if not any_drawn:
            continue
        im = Image.alpha_composite(im, overlay)
        im.save(path)
        drawn += 1

    print(f"wind drawn on {drawn} of {total} frames: {args.arcs} short arcs, emitted one at a time, "
          f"each fading as it travels out")


if __name__ == "__main__":
    main()
