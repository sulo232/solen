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


def smoothstep(t):
    """Ease with zero slope at both ends, so a ramp never starts or stops with a visible step."""
    t = 0.0 if t < 0 else (1.0 if t > 1 else t)
    return t * t * (3.0 - 2.0 * t)


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


def wave(draw, x0, y0, length, amp, cycles, weight, direction, phase, colour, a255, depth):
    """One LONG SMOOTH wave, drawn from the owner's own annotation.

    He drew it on the page in red: a single flowing line that rises, dips and rises again over a
    generous width. Gentle amplitude, about one and a half cycles, constant weight. Not the short
    arcs I built from his earlier description, which he then read as "a little arrow": three short
    Cs stacked up look like a chevron, and a chevron is an arrow.

    Rendered 3D-rounded: a darker wider pass underneath, the base colour inside it, and a lighter
    narrower highlight riding just above, plus round caps. That is what makes a 2D stroke read as a
    tube at icon size.
    """
    def pts(dy=0.0):
        out = []
        n = 64
        for i in range(n + 1):
            u = i / n
            x = x0 + direction * u * length
            # taper the amplitude at both ends so the stroke eases in and out instead of starting
            # mid-swing, which is what made the old version look like it was jumping
            env = math.sin(math.pi * min(1.0, max(0.0, u))) ** 0.6
            y = y0 + math.sin(u * math.pi * 2 * cycles + phase) * amp * env + dy
            out.append((x, y))
        return out

    shade = tuple(max(0, c - 34) for c in colour)
    light = tuple(min(255, c + 46) for c in colour)

    body = pts()
    draw.line(body, fill=shade + (a255,), width=weight, joint="curve")
    draw.line(body, fill=colour + (a255,), width=max(1, weight - 1), joint="curve")
    draw.line(pts(-depth), fill=light + (int(a255 * 0.7),), width=max(1, weight // 2), joint="curve")

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
    ap.add_argument("--arcs", type=int, default=3)       # three strokes, as he drew
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

    # THE TELEPORT. Deciding the nozzle side independently on each frame let it FLIP: measured 10
    # flips across 210 frames, including six frames in a row alternating every single frame. That
    # is the air jumping from one side of the dryer to the other mid-turn.
    # Fix in two parts. First, smooth the per-frame decision with a median filter so a single noisy
    # frame cannot flip it. Second, LOCK the side to whatever the icon shows at rest, and simply
    # fade the air out on the frames where the nozzle has turned to the other side, rather than
    # moving the air across. The air now only ever appears on one side of the icon.
    raw = []
    for name in files:
        al = np.array(Image.open(os.path.join(args.frames, name)).convert("RGBA"))[:, :, 3]
        r = nozzle_point(al, args.side)
        raw.append(None if r is None else r[2])
    W_MED = 9
    smoothed = []
    for i in range(len(raw)):
        win = [v for v in raw[max(0, i - W_MED // 2):i + W_MED // 2 + 1] if v is not None]
        smoothed.append(max(set(win), key=win.count) if win else None)
    locked = smoothed[move_from] if smoothed[move_from] is not None else (smoothed[0] or -1)
    agree = [1.0 if v == locked else 0.0 for v in smoothed]
    # ease the gate so the air fades out and back rather than blinking
    gate = []
    for i in range(len(agree)):
        win = agree[max(0, i - 6):i + 7]
        gate.append(sum(win) / len(win))

    for i, name in enumerate(files):
        path = os.path.join(args.frames, name)
        im = Image.open(path).convert("RGBA")
        a = np.array(im)[:, :, 3]

        # nothing at rest: the still icon is just the dryer
        if i < move_from or i >= move_to:
            continue
        p = (i - move_from) / max(1, (move_to - 1 - move_from))

        g = gate[i]
        if g <= 0.02:
            continue                                  # nozzle is facing the other way: no air
        np_ = nozzle_point(a, "left" if locked < 0 else "right")
        if np_ is None:
            continue
        nx, ny, d = np_
        d = locked                                    # never let the side move
        W, _ = im.size

        overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        near = W * 0.045          # where an arc is born, just off the nozzle
        far = W * 0.20            # where it has faded out
        any_drawn = False

        for k in range(args.arcs):
            # ONE AT A TIME, but WITHOUT the popping. The previous version restarted each stroke's
            # life with a modulo, so a stroke could vanish and reappear mid-clip. That is what he saw
            # as lagging and bugging out. Each stroke now lives exactly once, start to finish.
            # MEASURED THE AIR ON ITS OWN, which I had never done: isolating it against a no-air
            # render showed three jumps where the whole-frame number looked smooth. Two were
            # BIRTHS, +127px of area in a single frame, and one was the last stroke being cut off
            # at the end of the window, -264px. Both are fixed by ramping over a much longer
            # fraction of each stroke's life and by finishing every stroke before the window ends.
            # EVERY stroke gets the SAME life length, so a later stroke is not compressed into a
            # shorter span and forced to die in a couple of frames. Measured: with the old
            # birth-dependent span, all three ended within f141 to f142 and the air's area fell
            # 434 to 232 to 94 to 0 in four frames, which is the cut he was seeing.
            LIFE = 0.55
            birth = k * 0.14
            if birth + LIFE > 0.99:
                continue
            local = (p - birth) / LIFE
            if local <= 0 or local >= 1:
                continue
            # morph in, morph out, both slow enough that no single frame carries a visible step
            alpha_f = smoothstep(local / 0.30) * smoothstep((1.0 - local) / 0.62) * smoothstep(g)
            if alpha_f <= 0.002:
                continue
            dist = near + (far - near) * local * 0.55
            row = (k - (args.arcs - 1) / 2)
            x_start = nx + d * dist
            # KEEP IT INSIDE THE FRAME. 20 of 75 frames were running the wind off the canvas edge,
            # which is what he saw going out of the corner. Clamp the length to the room actually
            # left between the stroke's start and the border, with a small margin.
            room = (x_start - 6) if d < 0 else (W - 6 - x_start)
            # GROW FROM NOTHING. Measured at 60fps: the only remaining stutter in the clip was
            # frame 19, the exact frame the first stroke was born, because it appeared at 80% of
            # full length in one step. Starting near zero removes the pop.
            grow = 0.02 + smoothstep(local / 0.34) * 0.30 + local * 0.85
            length = min(W * 0.19 * grow, max(0.0, room))
            if length < 2:
                continue
            wave(
                od,
                x_start,
                ny + row * 10.5,
                length,
                5.0,
                1.5,                                    # about one and a half cycles
                args.weight,
                d,
                k * 0.7,                                # fixed per stroke: a phase that changes
                                                        # every frame is what made it look laggy
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
