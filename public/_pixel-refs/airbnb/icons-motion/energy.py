import os, json
import numpy as np
from PIL import Image
out = {}
for name in sorted(os.listdir("frames")):
    d = os.path.join("frames", name)
    if not os.path.isdir(d): continue
    fs = sorted(f for f in os.listdir(d) if f.endswith(".png"))
    arr = [np.asarray(Image.open(os.path.join(d,f)).convert("RGBA"), dtype=np.float32) for f in fs]
    e = []
    for i in range(1, len(arr)):
        e.append(float(np.abs(arr[i]-arr[i-1]).mean()))
    out[name] = e
json.dump(out, open("motion-energy.json","w"), indent=1)

for name, e in out.items():
    mx = max(e) or 1
    n = len(e)+1
    # motion window: frames where energy > 2% of peak
    idx = [i for i,v in enumerate(e) if v > 0.02*mx]
    start = (idx[0]+1)/30*1000 if idx else None
    end = (idx[-1]+1)/30*1000 if idx else None
    pk = e.index(mx)+1
    # 90% of cumulative energy spent by
    c = np.cumsum(e); tot = c[-1]
    t50 = (int(np.searchsorted(c, tot*0.5))+1)/30*1000
    t90 = (int(np.searchsorted(c, tot*0.9))+1)/30*1000
    print(f"{name:26} frames={n:3} motion {start:>5.0f} -> {end:<5.0f}ms  peak@{pk/30*1000:5.0f}ms  50%@{t50:5.0f}ms 90%@{t90:5.0f}ms  tail-still={((n-1)-(idx[-1]+1))/30*1000:4.0f}ms")
    spark = "".join(" ▁▂▃▄▅▆▇█"[min(8, int(v/mx*8.99))] for v in e)
    print(f"{'':26} {spark}")
