import json
m = json.load(open("frame-metrics.json"))
def eq(a,b,tol=0.35): return abs(a-b) <= tol
print(f"{'clip':26} {'frames':>6} {'dur':>7} | {'lead-in hold':>13} {'motion':>15} {'tail hold':>11} | rest w/h -> end w/h | peak w @t | settle")
for name in sorted(m):
    r = [x for x in m[name] if x.get("x0") is not None]
    n = len(r); dur = n/30*1000
    w0, cx0 = r[0]["w"], r[0]["cx"]
    # lead-in: frames identical to frame 0
    lead = 0
    for x in r[1:]:
        if x["w"]==w0 and eq(x["cx"],cx0,0.05) and eq(x["cy"],r[0]["cy"],0.05): lead += 1
        else: break
    wl, cxl = r[-1]["w"], r[-1]["cx"]
    tail = 0
    for x in reversed(r[:-1]):
        if x["w"]==wl and eq(x["cx"],cxl,0.05): tail += 1
        else: break
    mstart = (lead+1)/30*1000
    mend = (n-1-tail)/30*1000
    pk = max(r, key=lambda x: x["w"])
    # settle = first frame after peak where w stays within 1px of final for the rest
    settle = None
    for i,x in enumerate(r):
        if i <= r.index(pk): continue
        if all(abs(y["w"]-wl) <= 1 for y in r[i:]): settle = i/30*1000; break
    print(f"{name:26} {n:6} {dur:6.0f}ms | {mstart:6.0f}ms ({lead+1}f) {mstart:5.0f}-{mend:.0f}ms {(n-1-tail-lead)/30*1000:5.0f}ms {(tail)/30*1000:8.0f}ms | {w0}x{r[0]['h']} -> {wl}x{r[-1]['h']} | {pk['w']}px @{pk['t']}ms | {settle if settle is None else round(settle)}ms")

print("\n=== width trace (rest-normalised %) every 2 frames ===")
for name in ["house-twirl","balloon-twirl","consierge-twirl","house-selected","balloon-selected","consierge-selected"]:
    r = [x for x in m[name] if x.get("x0") is not None]
    base = r[0]["w"]
    s = " ".join(f"{round(x['w']/base*100):3}" for x in r[::2])
    print(f"{name:20} {s}")
