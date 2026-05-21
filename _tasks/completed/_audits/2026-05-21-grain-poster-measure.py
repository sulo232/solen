"""
Measure grain intensity (flower) + extract dominant blob colors + positions (poster).
PIL + stdlib only — no numpy / sklearn.
"""
import json
import math
from pathlib import Path
from PIL import Image, ImageFilter, ImageStat

WORKTREE = Path("/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7")
POSTER = WORKTREE / "public/_screenshot-spec/poster-gradient/source.png"
FLOWER = WORKTREE / "public/_screenshot-spec/flower-grain/source.webp"

# ────────── GRAIN ESTIMATION ──────────

def estimate_grain(img):
    """Estimate grain by comparing original to blurred — std of residual."""
    img_rgb = img.convert("RGB")
    blurred = img_rgb.filter(ImageFilter.GaussianBlur(radius=2))
    # Compute difference pixel-by-pixel
    w, h = img_rgb.size
    orig_pix = list(img_rgb.getdata())
    blur_pix = list(blurred.getdata())
    # Compute standard deviation of residual (per channel, average)
    residuals = []
    n = len(orig_pix)
    # Sample stride for speed (every 4th pixel ≈ ~16x speedup)
    stride = 4
    for i in range(0, n, stride):
        o = orig_pix[i]
        b = blur_pix[i]
        for c in range(3):
            residuals.append(o[c] - b[c])
    mean = sum(residuals) / len(residuals)
    var = sum((r - mean) ** 2 for r in residuals) / len(residuals)
    std = math.sqrt(var)
    return {
        "raw_std": round(std, 2),
        "interpretation": (
            "very smooth (digital)" if std < 1.5 else
            "subtle grain" if std < 3.5 else
            "film-grain visible" if std < 6.5 else
            "heavy film grain"
        ),
    }

# ────────── DOMINANT COLOR via PIL quantize ──────────

def dominant_colors(img, n=6):
    """PIL's quantize() does color clustering. Returns palette + counts."""
    img_rgb = img.convert("RGB")
    q = img_rgb.quantize(colors=n, method=Image.Quantize.FASTOCTREE)
    palette = q.getpalette()[:n*3]
    pixels = list(q.getdata())
    counts = {}
    for p in pixels:
        counts[p] = counts.get(p, 0) + 1
    total = len(pixels)
    result = []
    for idx in sorted(counts, key=counts.get, reverse=True):
        if idx * 3 + 2 >= len(palette):
            continue
        r, g, b = palette[idx*3], palette[idx*3+1], palette[idx*3+2]
        result.append({
            "hex": "#{:02X}{:02X}{:02X}".format(r, g, b),
            "rgb": [r, g, b],
            "area_pct": round(counts[idx] / total * 100, 1),
            "idx": idx,
        })
    return result, q

# ────────── BLOB POSITION via centroid (PIL-only) ──────────

def blob_centroids(q_img, palette_list):
    """For each color index, compute centroid + spread by iterating pixels."""
    w, h = q_img.size
    pixels = list(q_img.getdata())  # flat list of indices
    out = []
    for entry in palette_list:
        idx = entry["idx"]
        xs, ys = [], []
        for i, p in enumerate(pixels):
            if p == idx:
                xs.append(i % w)
                ys.append(i // w)
        if len(xs) < 30:
            continue
        mx = sum(xs) / len(xs)
        my = sum(ys) / len(ys)
        # std
        vx = sum((x - mx) ** 2 for x in xs) / len(xs)
        vy = sum((y - my) ** 2 for y in ys) / len(ys)
        sx = math.sqrt(vx)
        sy = math.sqrt(vy)
        out.append({
            **entry,
            "centroid_pct": [round(mx / w * 100, 1), round(my / h * 100, 1)],
            "spread_pct": [round(sx / w * 100, 1), round(sy / h * 100, 1)],
        })
    return out

# ────────── 9-GRID SAMPLE ──────────

def grid_samples(img):
    w, h = img.size
    img_rgb = img.convert("RGB")
    out = []
    for ry, ny in [(0.15, "top"), (0.5, "mid"), (0.85, "bot")]:
        for rx, nx in [(0.15, "left"), (0.5, "center"), (0.85, "right")]:
            x, y = int(w * rx), int(h * ry)
            r, g, b = img_rgb.getpixel((x, y))[:3]
            out.append({
                "pos": f"{ny}-{nx}",
                "x": x, "y": y,
                "hex": "#{:02X}{:02X}{:02X}".format(r, g, b),
            })
    return out

# ────────── ANALYZE POSTER ──────────

print("=" * 72)
print("POSTER (download.png — Grads. blue/green blob gradient with grain)")
print("=" * 72)
poster_img = Image.open(POSTER).convert("RGB")
# Resize for faster centroid calc — keep aspect ratio
pw, ph = poster_img.size
if pw > 400:
    new_w = 400
    new_h = int(ph * 400 / pw)
    poster_small = poster_img.resize((new_w, new_h), Image.LANCZOS)
else:
    poster_small = poster_img
print(f"Original dimensions: {poster_img.size}")
print(f"Analysis dimensions: {poster_small.size}")
print()

pal, q_img = dominant_colors(poster_small, n=6)
centroids = blob_centroids(q_img, pal)

print("DOMINANT COLORS + BLOB CENTROIDS (k=6 octree quantize)")
print(f"{'rank':<5}{'hex':<10}{'rgb':<18}{'area %':<9}{'centroid (x%, y%)':<22}{'spread (x%, y%)':<20}")
print("-" * 90)
for i, c in enumerate(centroids):
    cx, cy = c["centroid_pct"]
    sx, sy = c["spread_pct"]
    print(f"{i+1:<5}{c['hex']:<10}{str(c['rgb']):<18}{str(c['area_pct'])+'%':<9}({cx}%, {cy}%){'':<8}({sx}%, {sy}%)")
print()

print("9-GRID GRID SAMPLES (raw pixel colors at strategic positions)")
samples = grid_samples(poster_img)
for s in samples:
    print(f"  {s['pos']:<14} {s['hex']}  (x={s['x']}, y={s['y']})")
print()

g_poster = estimate_grain(poster_img)
print(f"POSTER GRAIN: std={g_poster['raw_std']}  → {g_poster['interpretation']}")
print()

# ────────── ANALYZE FLOWER ──────────

print("=" * 72)
print("FLOWER (download.webp — yellow flowers with film grain)")
print("=" * 72)
flower_img = Image.open(FLOWER).convert("RGB")
print(f"Dimensions: {flower_img.size}")
print()

g_flower = estimate_grain(flower_img)
print(f"FLOWER GRAIN: std={g_flower['raw_std']}  → {g_flower['interpretation']}")
print()

pal_f, _ = dominant_colors(flower_img, n=5)
print("FLOWER DOMINANT COLORS (for context)")
print(f"{'rank':<5}{'hex':<10}{'rgb':<18}{'area %':<10}")
print("-" * 50)
for i, c in enumerate(pal_f):
    print(f"{i+1:<5}{c['hex']:<10}{str(c['rgb']):<18}{str(c['area_pct'])+'%':<10}")
print()

# ────────── COMPARISON ──────────

print("=" * 72)
print("GRAIN COMPARISON")
print("=" * 72)
print(f"  POSTER grain std: {g_poster['raw_std']}  ({g_poster['interpretation']})")
print(f"  FLOWER grain std: {g_flower['raw_std']}  ({g_flower['interpretation']})")
print()
ratio = g_flower['raw_std'] / g_poster['raw_std'] if g_poster['raw_std'] > 0 else 0
print(f"  Flower grain is {ratio:.2f}× the poster's grain intensity")
print()
print(f"  Target for solen mockup: match the FLOWER (std ≈ {g_flower['raw_std']})")

# Save JSON
out = {
    "poster": {
        "dims": list(poster_img.size),
        "dominant_blobs": centroids,
        "grid_samples": samples,
        "grain": g_poster,
    },
    "flower": {
        "dims": list(flower_img.size),
        "palette": pal_f,
        "grain": g_flower,
    },
    "rebuild_target": {
        "grain_std": g_flower['raw_std'],
        "interpretation": g_flower['interpretation'],
    },
}
out_path = WORKTREE / "_audits/2026-05-21-grain-poster-measured.json"
out_path.write_text(json.dumps(out, indent=2))
print(f"\nSaved measurement JSON: {out_path}")
