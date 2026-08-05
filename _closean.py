#!/usr/bin/env python3
"""Analyze a close capture frame by frame.

Answers exactly the three questions the ask names, per frame:
  1. timestamp (ms relative to the close press)
  2. is the page behind SHARP (pixel evidence, not the DOM's opinion)
  3. rect + ink fraction of any remaining WHITE OVERLAY SURFACE

Detector notes, because two earlier passes measured this wrong:
  - The white surface is found with the flat-near-white-RUN test this repo already
    validated (H2): a row counts only if its longest run of near-white is a large
    fraction of the sheet's own width. A translucent card fails it, because the
    blurred page keeps varying through it.
  - Search is bounded by the sheet's own DOM rect for that frame, so the page
    de-blurring into white (scrim fading) cannot be mistaken for the overlay.
  - "Sharp" is mean abs difference from the SETTLED closed frame over the pixels
    OUTSIDE the sheet rect. Scrim up = blurred + tinted = large diff.
"""
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw

OUT = sys.argv[1]
WHITE = 244      # near-white floor
RUNFRAC = 0.55   # a row is "surface" if its longest near-white run covers this much of the sheet width
INK = 230        # "ink" = darker than this
SHARP = 2.0      # mean abs diff below this = page behind is sharp


def longest_run(rowmask):
    if not rowmask.any():
        return 0, 0, 0
    idx = np.flatnonzero(np.diff(np.concatenate(([0], rowmask.view(np.int8), [0]))))
    starts, ends = idx[0::2], idx[1::2]
    k = int(np.argmax(ends - starts))
    return int(ends[k] - starts[k]), int(starts[k]), int(ends[k])


meta = json.load(open(os.path.join(OUT, "meta.json")))
settled = np.asarray(Image.open(os.path.join(OUT, "settled.png")).convert("RGB")).astype(np.int16)
pill = meta["pillRect"]
VW, VH = meta["viewport"]["w"], meta["viewport"]["h"]
tr = meta["trace"]


def trace_at(t):
    return min(tr, key=lambda r: abs(r["t"] - t))


rows, montage = [], []
for fr in meta["frames"]:
    img = np.asarray(Image.open(os.path.join(OUT, fr["file"])).convert("RGB")).astype(np.int16)
    img = img[:VH, :VW]
    d = np.abs(img - settled[:VH, :VW]).max(axis=2)
    tinfo = trace_at(fr["t"])
    sh = tinfo["sheet"]

    if sh and sh["h"] > 0.5:
        y0 = max(0, int(np.floor(sh["y"]))); y1 = min(VH, int(np.ceil(sh["y"] + sh["h"])))
        x0 = max(0, int(np.floor(sh["x"]))); x1 = min(VW, int(np.ceil(sh["x"] + sh["w"])))
        outside = np.ones(d.shape, bool); outside[y0:y1, x0:x1] = False
        page = float(d[outside].mean()) if outside.any() else float(d.mean())
        band = img[y0:y1, x0:x1]
        nw = band.min(axis=2) >= WHITE
        need = RUNFRAC * (x1 - x0)
        keep, lo, hi = [], VW, 0
        for i in range(band.shape[0]):
            L, a, b = longest_run(nw[i])
            if L >= need:
                keep.append(i); lo = min(lo, a); hi = max(hi, b)
        if keep:
            ry0, ry1 = y0 + keep[0], y0 + keep[-1] + 1
            rx0, rx1 = x0 + lo, x0 + hi
            sub = img[ry0:ry1, rx0:rx1]
            ink = float((sub.max(axis=2) < INK).mean())
            rect = (int(rx0), int(ry0), int(rx1 - rx0), int(ry1 - ry0))
        else:
            rect, ink = None, None
    else:
        page = float(d.mean()); rect, ink = None, None

    if rect:
        excess = rect[3] - pill["h"]
        above = pill["y"] - rect[1]
    else:
        excess = above = 0.0
    rows.append({"t": fr["t"], "rect": rect, "ink": ink, "pageDiff": round(page, 2),
                 "sharp": page < SHARP, "excessH": round(float(excess), 1),
                 "aboveTop": round(float(above), 1), "scrim": tinfo["scrimOp"],
                 "domH": (round(sh["h"], 1) if sh else None), "file": fr["file"]})

print(f"== {OUT}  viewport {VW}x{VH}  resting pill x{pill['x']} y{pill['y']} w{pill['w']} h{pill['h']}")
print(f"{'t(ms)':>6} {'sharp':>5} {'pageDiff':>8} {'white overlay rect':>22} {'exH':>6} {'abv':>6} {'ink':>7} {'scrim':>7} {'domH':>7}")
last_surface = first_sharp = None
for r in rows:
    if r["rect"]:
        last_surface = r["t"]
    if r["sharp"] and first_sharp is None:
        first_sharp = r["t"]
    rect = f"{r['rect']}" if r["rect"] else "none"
    ink = f"{r['ink']:.4f}" if r["ink"] is not None else "-"
    sc = f"{r['scrim']:.3f}" if isinstance(r["scrim"], (int, float)) else "-"
    print(f"{r['t']:>6.0f} {str(r['sharp']):>5} {r['pageDiff']:>8.2f} {rect:>22} {r['excessH']:>6.1f} {r['aboveTop']:>6.1f} {ink:>7} {sc:>7} {str(r['domH']):>7}")

print()
print(f"LAST frame with a white overlay surface : {last_surface} ms")
print(f"FIRST frame the page behind is sharp    : {first_sharp} ms")
bad = [r for r in rows if r["rect"] and r["sharp"]]
if last_surface is not None and first_sharp is not None:
    ok = first_sharp > last_surface
    print(f"ORDER: {'PASS, surface gone before the page is sharp' if ok else 'FAIL, page sharp while a surface still exists'} (gap {round(first_sharp - last_surface, 1)} ms)")
print(f"OVERLAP frames (page sharp AND a white overlay surface): {len(bad)}")
for r in bad:
    print(f"   t={r['t']:.0f}ms rect={r['rect']} excessH={r['excessH']} aboveTop={r['aboveTop']} ink={r['ink']:.4f} pageDiff={r['pageDiff']}")

# Near-sharp window: the eye reads a mostly-cleared page as "back", so report the tail too.
print()
print("TAIL (scrim below 0.30, i.e. the page is already mostly legible):")
for r in rows:
    if isinstance(r["scrim"], (int, float)) and r["scrim"] < 0.30 and r["rect"]:
        print(f"   t={r['t']:.0f}ms scrim={r['scrim']:.3f} rect={r['rect']} excessH={r['excessH']} aboveTop={r['aboveTop']} ink={r['ink']:.4f}")

# Montage of the tail so the numbers can be eyeballed.
sel = [r for r in rows if r["t"] >= 140][:12]
if sel:
    tiles = []
    for r in sel:
        im = Image.open(os.path.join(OUT, r["file"])).convert("RGB").crop((0, 0, VW, 260))
        dr = ImageDraw.Draw(im)
        dr.rectangle([pill["x"], pill["y"], pill["x"] + pill["w"], pill["y"] + pill["h"]], outline=(0, 160, 0), width=2)
        if r["rect"]:
            x, y, w, h = r["rect"]
            dr.rectangle([x, y, x + w, y + h], outline=(255, 0, 0), width=2)
        dr.text((6, 6), f"{r['t']:.0f}ms sharp={r['sharp']} ex={r['excessH']}", fill=(200, 0, 0))
        tiles.append(im)
    cols = 4
    rowsn = (len(tiles) + cols - 1) // cols
    sheet_img = Image.new("RGB", (cols * VW, rowsn * 260), (20, 20, 20))
    for i, t in enumerate(tiles):
        sheet_img.paste(t, ((i % cols) * VW, (i // cols) * 260))
    p = os.path.join(OUT, "MONTAGE_tail.png")
    sheet_img.save(p)
    print(f"\nmontage: {p}")
