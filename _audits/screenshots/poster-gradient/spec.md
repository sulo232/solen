# poster-gradient — Screenshot spec

**Source:** `public/_screenshot-spec/poster-gradient/source.png`
**Measured:** 2026-05-21 via `screenshot-spec` skill (Playwright + `addMark` / `sampleHex` / ruler tool)
**Image dimensions:** 814 × 456 (DPR 1× — original screenshot)
**Calibration:** raw px = CSS px (1:1)

## Colors

### 9-grid ground-truth samples

| Label | Hex | RGBA | Coords |
|---|---|---|---|
| top-left-blue | `#0C7BAC` | rgba(12, 123, 172, 255) | (122, 68) |
| top-center-cyan | `#0D90A1` | rgba(13, 144, 161, 255) | (407, 68) |
| top-right-blue | `#466AAE` | rgba(70, 106, 174, 255) | (692, 68) |
| mid-left-grey | `#B2B1BC` | rgba(178, 177, 188, 255) | (122, 228) |
| mid-center-sage | `#AAC0B3` | rgba(170, 192, 179, 255) | (407, 228) |
| **mid-right-deep-blue** | `#015FA2` | rgba(1, 95, 162, 255) | (692, 228) |
| bot-left-bluegrey | `#889ABD` | rgba(136, 154, 189, 255) | (122, 388) |
| bot-center-cream | `#D6CCC3` | rgba(214, 204, 195, 255) | (407, 388) |
| bot-right-mint | `#9FD2C5` | rgba(159, 210, 197, 255) | (692, 388) |

### Key blob centers

| Label | Hex | Coords |
|---|---|---|
| blob-cyan-saturated | `#179694` | (400, 100) — heart of top cyan-teal |
| blob-deepblue-pocket | `#3199A1` | (700, 250) — slightly off, actually teal here |
| blob-warm-cream-center | `#EAD6C6` | (400, 320) — warm peach-cream |

## Measurements

| Label | px | % of image |
|---|---|---|
| image-width | 814 | 100 |
| image-height | 456 | 100 |
| **cyan-blob-width** | 360 | 44.2% |
| **cyan-blob-height** | 160 | 35.1% |
| topleft-blue-width | 200 | 24.6% |
| topright-blue-width | 230 | 28.3% |
| deepblue-spot-width | 200 | 24.6% |
| deepblue-spot-height | 110 | 24.1% |
| **cream-zone-vertical** | 176 | 38.6% (y=280 → 456, bottom 39% of image) |
| cream-zone-horizontal | 720 | 88.5% |

## Color zones (interpretation from data)

### Top region (y 0–35% / 0–160px)
**Cyan-teal `#0D90A1` is the dominant top color** — not "deep blue" as k-means earlier suggested. The cyan-teal blob spans ~44% width × ~35% height centered around (400, 100). Flanked by blue at left (`#0C7BAC`) and medium blue at right (`#466AAE`).

### Mid region (y 35–65% / 160–296px)
Cool grey-sage transition: `#B2B1BC` at left, `#AAC0B3` pale sage in center. **Critical accent at mid-right: `#015FA2` — the deepest saturated blue in the entire poster.** This is a small but visible blue pocket roughly 25% × 24% of the image, centered around (692, 228).

### Bottom region (y 65–100% / 296–456px)
**Warm cream-peach** `#D6CCC3` at center, getting warmer toward `#EAD6C6` at the y=320 sample. Slight mint hint at bot-right (`#9FD2C5`). Note the cream is WARM (peachy), not cool grey.

## What the user wants for the Solen mockup

Per user direction:
- **Background base = PURE WHITE `#FFFFFF`** (locked V3-D94)
- Gradient blobs FROM this poster but on white substrate
- **NO cream-grey/peach wash filling the bottom** — that was the poster's substrate, not a blob to copy
- Grain at flower-level (separate measurement, std 2.25 = subtle)

## Suggested CSS (pure-white substrate, blobs only at top half)

```css
.blobs {
  background:
    /* TOP — cyan-teal dominant, blues at flanks */
    radial-gradient(ellipse 44% 35% at 50% 22%, rgba(13, 144, 161, 0.85) 0%, transparent 65%),     /* #0D90A1 cyan-teal (dominant) */
    radial-gradient(ellipse 25% 22% at 15% 15%, rgba(12, 123, 172, 0.78) 0%, transparent 65%),     /* #0C7BAC top-left blue */
    radial-gradient(ellipse 28% 22% at 85% 15%, rgba(70, 106, 174, 0.72) 0%, transparent 65%),     /* #466AAE top-right blue */
    /* MID-RIGHT — deep saturated blue pocket */
    radial-gradient(ellipse 25% 24% at 85% 45%, rgba(1, 95, 162, 0.65) 0%, transparent 65%),       /* #015FA2 deep blue */
    /* MID — pale sage transition */
    radial-gradient(ellipse 35% 28% at 40% 50%, rgba(170, 192, 179, 0.35) 0%, transparent 70%);    /* #AAC0B3 sage center */
  /* NO cream wash. Bottom 60% of page = pure white substrate showing through. */
}
```
