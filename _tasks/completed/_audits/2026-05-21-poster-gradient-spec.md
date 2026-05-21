# poster-gradient — Screenshot spec

**Source:** `public/_screenshot-spec/poster-gradient/source.png`
**Measured:** 2026-05-21 via `screenshot-spec` skill (Playwright + Canvas pixel sampling on the annotation page)
**Image dimensions:** 814 × 456 px (DPR 1× — raw poster screenshot)

## Method correction (important)

Previous Python k-means measurement (`_audits/2026-05-21-grain-poster-measured.json`) reported cluster centroids — but **cluster centroid POSITIONS don't represent where those cluster COLORS visibly appear** in the image. K-means averages many pixels into a single "cluster color" and assigns each pixel to one cluster; the geometric center of all pixels in a cluster can land on a pixel that visually displays a DIFFERENT color (the blend of multiple overlapping clusters).

The Canvas-based pixel sampler (this skill's actual tool) reads RAW PIXEL VALUES at specific (x, y) positions. That's ground truth. This spec uses ground-truth samples, not k-means cluster averages.

## Colors — 9-grid ground truth (raw pixel samples)

| Position | Pixel (raw) | Hex | Interpretation |
|---|---|---|---|
| top-left | (122, 68) | `#0C7BAC` | Saturated blue-teal |
| top-center | (407, 68) | `#0D90A1` | **Deep cyan-teal** (the actual dominant top color) |
| top-right | (692, 68) | `#466AAE` | Medium blue |
| mid-left | (122, 228) | `#B2B1BC` | Cool grey |
| mid-center | (407, 228) | `#AAC0B3` | Pale sage-grey |
| mid-right | (692, 228) | `#015FA2` | **DEEP SATURATED BLUE** (darkest spot in poster) |
| bot-left | (122, 388) | `#889ABD` | Cool grey-blue |
| bot-center | (407, 388) | `#D6CCC3` | Warm cream-grey |
| bot-right | (692, 388) | `#9FD2C5` | Mint-cream (slight green warmth) |

## Color zones — interpretation

Based on the 9-grid + radial samples around the dominant cluster positions:

### Top region (y 0–35%)
**Dominated by cyan-teal + blue blobs.** Top-center is the most saturated cyan-teal (`#0D90A1`); flanked by blue at left (`#0C7BAC`) and medium blue at right (`#466AAE`). No actual "deep navy blue" up here — earlier I was misreading the cluster name.

### Mid region (y 35–65%)
**Cool grey-sage transition.** Mid-left grey (`#B2B1BC`), mid-center pale sage (`#AAC0B3`). **Critical accent: mid-right `#015FA2` — the deepest saturated blue in the entire poster.** This is the dark spot k-means missed.

### Bottom region (y 65–100%)
**Warm peach-cream dominant.** `#D6CCC3` at bot-center (not the cooler `#D2CCC6` k-means averaged). `#E6D5C4` at the 64% y centroid I sampled. Slight mint hint at bot-right (`#9FD2C5`) — bottom-right has a faint green tint distinguishable from the cooler greys above.

### Special note
The "cream-grey" k-means cluster (largest area at 43.4%) was reported at hex `#D2CCC6` — but actual pixel sampling at the cluster centroid shows `#E6D5C4` (warmer + peachier). The cluster average is COOLER than the actual visible color at that position because the cluster averages pixels at the BOUNDARY (mid-region grey transitions) with the WARMER bottom-half core.

## Blob extents (color-walk method)

Walking outward from each centroid until color distance > 40 (subjective edge):

| Region | Width % | Height % | Note |
|---|---|---|---|
| Top blue/cyan zone | ~30% | ~25% | Tight cluster |
| Mid-right deep blue | ~13% | ~6% | Small but saturated pocket |
| Bottom cream-grey | ~99% | ~43% | **Dominant — covers ~all bottom half** |
| Bottom-right mint | ~58% | ~24% | Soft right-side wash |

## Grain

Measured separately via `_audits/2026-05-21-grain-poster-measured.json`:
- Poster grain `std = 5.76` ("film-grain visible")
- Flower grain `std = 2.25` ("subtle grain") — **user's target**

## Suggested CSS — rewrite of blob recipe

Using actual ground-truth pixel positions (the 9-grid), not k-means centroids:

```css
.blobs {
  background:
    /* TOP cluster — cyan/teal/blue trio matching 9-grid samples */
    radial-gradient(ellipse 38% 25% at 50% 15%, rgba(13, 144, 161, 0.85) 0%, transparent 70%),   /* #0D90A1 top-center cyan-teal */
    radial-gradient(ellipse 28% 22% at 15% 15%, rgba(12, 123, 172, 0.75) 0%, transparent 70%),   /* #0C7BAC top-left blue */
    radial-gradient(ellipse 28% 22% at 85% 15%, rgba(70, 106, 174, 0.70) 0%, transparent 70%),   /* #466AAE top-right blue */
    /* MID accent — the saturated dark blue spot at mid-right */
    radial-gradient(ellipse 22% 18% at 85% 50%, rgba(1, 95, 162, 0.60) 0%, transparent 65%),     /* #015FA2 deep blue accent */
    /* MID transition */
    radial-gradient(ellipse 35% 25% at 50% 50%, rgba(170, 192, 179, 0.35) 0%, transparent 70%),  /* #AAC0B3 pale sage center */
    /* BOTTOM — warm cream-peach dominant, mint hint at right */
    radial-gradient(ellipse 30% 22% at 85% 85%, rgba(159, 210, 197, 0.45) 0%, transparent 70%),  /* #9FD2C5 mint bot-right */
    radial-gradient(ellipse 80% 40% at 50% 85%, rgba(214, 204, 195, 0.70) 0%, transparent 75%);  /* #D6CCC3 warm cream-grey dominant */
}
```

## What I had wrong before

1. **Used k-means cluster color at k-means cluster centroid position** — these don't correspond. Cluster colors are correct, cluster centroid positions can land on visually-mixed pixels.
2. **Missed the saturated deep blue pocket at mid-right** (`#015FA2`) — k-means absorbed it into the `#536EAA` medium-blue cluster average.
3. **Used cool cream-grey `#D2CCC6` for bottom** — actual bottom-center is warmer `#D6CCC3` (slight peach shift).
4. **Top blob was labeled "deep blue" but actually reads as cyan-teal** (`#0D90A1`) — I was matching the k-means cluster NAME, not the actual visible color at that screen position.
