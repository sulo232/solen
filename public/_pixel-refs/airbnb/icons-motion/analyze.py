import os, json, math
from PIL import Image
import numpy as np

BASE = "frames"
out = {}
for name in sorted(os.listdir(BASE)):
    d = os.path.join(BASE, name)
    if not os.path.isdir(d): continue
    files = sorted(f for f in os.listdir(d) if f.endswith(".png"))
    rows = []
    for i, f in enumerate(files):
        im = Image.open(os.path.join(d, f)).convert("RGBA")
        a = np.array(im)[:, :, 3].astype(np.float32) / 255.0
        mass = float(a.sum())
        ys, xs = np.nonzero(a > 0.10)
        if len(xs) == 0:
            rows.append(dict(f=i, t=round(i/30*1000), mass=0, x0=None)); continue
        x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
        w, h = x1-x0+1, y1-y0+1
        tot = a.sum()
        cx = float((a.sum(axis=0) * np.arange(a.shape[1])).sum() / tot)
        cy = float((a.sum(axis=1) * np.arange(a.shape[0])).sum() / tot)
        rows.append(dict(f=i, t=round(i/30*1000), mass=round(mass,1), x0=x0, x1=x1, y0=y0, y1=y1,
                         w=w, h=h, cx=round(cx,2), cy=round(cy,2)))
    out[name] = rows

json.dump(out, open("frame-metrics.json","w"), indent=1)

def fmt(name, rows, keys=("w","h","cx","cy","mass")):
    print(f"\n### {name}  ({len(rows)} frames, {len(rows)/30*1000:.0f}ms @30fps)")
    print("  f  t(ms)   w    h     cx     cy      mass   note")
    prev = None
    for r in rows:
        if r.get("x0") is None:
            print(f"{r['f']:3} {r['t']:5}   (empty frame)"); continue
        note = ""
        if prev:
            dw = r["w"]-prev["w"]; dcy = r["cy"]-prev["cy"]
            note = f"dw{dw:+3d} dcy{dcy:+5.1f}"
        print(f"{r['f']:3} {r['t']:5} {r['w']:4} {r['h']:4} {r['cx']:6.1f} {r['cy']:6.1f} {r['mass']:8.0f}   {note}")
        prev = r

for n in ["house-twirl", "house-selected", "house-twirl-selected"]:
    fmt(n, out[n])
