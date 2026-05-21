# Fresha SearchBar — Measured Spec (from IMG_4117.png)

**Source**: `public/_screenshot-spec/fresha-searchbar/source.png`
**Image dimensions**: 1206 × 2622 raw px (iOS Safari screenshot)
**DPR**: 3.07 (back-calculated from iPhone 393pt CSS width)
**Method**: Programmatic horizontal-line detection (Python PIL, finds grey hairlines spanning >50% of card width)
**Date**: 2026-05-21

---

## ✅ Confidence: HIGH on all values below — direct pixel measurements

### Card (white container with halo)

| Property | Raw px | CSS px @ DPR 3.07 |
|---|---|---|
| Top edge (straight, at center) | y=1240 | — |
| Top-left corner where white begins (at x=78) | y=1260 | — |
| Bottom edge | y=2003 | — |
| Left edge | x=78 | 25.4 from viewport edge |
| Right edge | x=1127 | 25.7 from right viewport edge |
| Width | 1049 | **342** |
| Total height (straight top → straight bottom) | ~763 | **~248** |
| Border-radius (from corner curve detection) | ~20 | **~7** |
| Border | none — drop shadow + halo only | — |
| Background | rgb(255, 255, 255) | white |
| Halo color (bleed from gradient) | tinted lavender → pink | — |

### Input rows (3 outlined fully-rounded pills, all IDENTICAL geometry)

**Row 1 ("All treatments")**: y=1260 → y=1403 = **143 raw = 46.6 CSS px tall**
**Row 2 ("Current location")**: y=1440 → y=1583 = **143 raw = 46.6 CSS px tall**
**Row 3 ("Any time")**: y=1620 → y=1763 = **143 raw = 46.6 CSS px tall**

| Property | Value |
|---|---|
| Row height | **46.6 CSS** (143 raw) — consistent across all 3 rows ✓ |
| Row border-radius | fully-rounded pill (= half height = **~23 CSS**) |
| Row border weight | 3 raw px = **~1 CSS px hairline** |
| Row border color | `rgb(211, 211, 211)` = `#D3D3D3` ✓ exact RGB sampled |
| Row background | white |
| Row left edge offset from card-left (horizontal padding) | 65 raw = **~21 CSS** |
| Row width | 1049 - 2×65 = 919 raw = **~300 CSS** |

### Gaps

| Property | Raw px | CSS px |
|---|---|---|
| Card-top (straight) → row 1 top border | ~20 | **~6.5** |
| Row 1 bottom → row 2 top | 37 | **~12** ✓ |
| Row 2 bottom → row 3 top | 37 | **~12** ✓ |
| Row 3 bottom → submit top | 49 | **~16** |

### Submit button (black pill)

| Property | Raw px | CSS px |
|---|---|---|
| Top y | 1812 | — |
| Bottom y | 1955 | — |
| Height | 143 | **46.6** (SAME as row pills) ✓ |
| Width | 953 | **310** |
| Border-radius | fully-rounded pill (= half height = **~23 CSS**) |
| Background | `rgb(13, 13, 13)` = `#0D0D0D` ✓ |
| Horizontal inset from card-left | ~96 raw = **~31 CSS** (vs 21 for row pills — submit has WIDER horizontal padding) |
| Text "Search Fresha" | white, bold |

### Card bottom padding

Submit bottom (y=1955) → card bottom (y=2003) = 48 raw = **~16 CSS** below submit before card ends.

---

## Translation to Solen at 375 CSS viewport

Image is at ~393 CSS viewport. Scale factor for 375 viewport = 375/393 = 0.954.

| Property | Fresha @ 393 viewport | Solen target @ 375 viewport |
|---|---|---|
| Card width | 342 CSS | **~326 CSS** (or just `calc(100vw - 50px)`) |
| Card horizontal padding inside | 21 CSS | **~20 CSS** (`p-5` left/right) |
| Card border-radius | ~7 CSS | **~7-8 CSS** (`rounded-[8px]`) |
| Card top padding | ~6.5 CSS | **~6-8 CSS** |
| Card bottom padding (below submit) | ~16 CSS | **~15-16 CSS** |
| Row height | 46.6 CSS | **~46-48 CSS** |
| Row border-radius | fully-rounded pill = ~23 CSS | **`rounded-full`** (Tailwind) |
| Row border | 1 CSS px `#D3D3D3` | **`border border-[#D3D3D3]`** |
| Row horizontal inside card | 21 CSS each side | already counted in card padding |
| Gap between rows | 12 CSS | **`gap-3`** (12px) |
| Gap from last row to submit | 16 CSS | **`mt-4`** (16px) on submit |
| Submit height | 46.6 CSS | **~46-48 CSS** |
| Submit width | 310 CSS (vs row 300 — wider) | actually rows and submit should be near-equal width; allow submit to share container padding |
| Submit border-radius | fully-rounded pill | **`rounded-full`** |
| Submit bg | `#0D0D0D` | **`bg-[#0D0D0D]`** |

### Summary in Tailwind

```tsx
<div className="rounded-[8px] bg-white px-5 pt-1.5 pb-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
  {/* 3 input rows */}
  <div className="flex flex-col gap-3">
    <button className="flex items-center gap-3 h-12 rounded-full border border-[#D3D3D3] px-4 text-[16px] text-s-ink-2">
      <SearchIcon className="h-5 w-5" />
      All treatments
    </button>
    <button className="flex items-center gap-3 h-12 rounded-full border border-[#D3D3D3] px-4 text-[16px] text-s-ink-2">
      <PinIcon className="h-5 w-5" />
      Current location
    </button>
    <button className="flex items-center gap-3 h-12 rounded-full border border-[#D3D3D3] px-4 text-[16px] text-s-ink-2">
      <CalendarIcon className="h-5 w-5" />
      Any time
    </button>
  </div>
  {/* Submit */}
  <button className="mt-4 w-full h-12 rounded-full bg-[#0D0D0D] text-[16px] font-bold text-white">
    Search Fresha
  </button>
</div>
```

**Key numbers**:
- Card padding: top=6, right=20, bottom=16, left=20 (CSS)
- Row height: 48 (close enough to 46.6)
- Row gap: 12
- Submit gap from rows: 16
- Submit height: 48
- All radii: full pill for rows + submit, 8px for card
