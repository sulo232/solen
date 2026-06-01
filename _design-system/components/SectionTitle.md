# Section / SectionFrame / SectionTitle / SectionMeta / ScrollRow / FeedZone

**File:** [app/[locale]/_components/homepage/SectionHeader.tsx](../../app/[locale]/_components/homepage/SectionHeader.tsx)
**Layer:** 1 chrome (Section / Frame / ScrollRow / FeedZone / SectionMeta). The SectionMeta eyebrow is plain `text-s-ink-3` with no dot — accent is functional-only and NEVER on eyebrows per CANON §2.
**Locked since:** V2-D41-rising-panel-3 (architecture), V3-D132 (spacing), V3-D156 (chevron-draws-stem)
**SOURCE.md links:** [§4 Spatial rhythm](../SOURCE.md#§4--spatial-rhythm) · [§8 Card grammar](../SOURCE.md#§8--card-grammar) · [§13 Mobile perf](../SOURCE.md#§13--mobile-perf-rules)

---

## Purpose

The **composition primitives** every homepage feed uses. Together they define how every section on the homepage looks, breathes, and scrolls. Each piece is small; the discipline is that all 6 sections use the same set.

Anatomy of one section:

```
Section (outer wrapper, max-w + section spacing)
└─ FeedZone (heavy rising-panel container, ONE per homepage block of sections)
   └─ SectionMeta (eyebrow row)
   └─ SectionFrame (structural padding + overflow clip)
      └─ SectionTitle (h2 + optional chevron→arrow link + optional desktop scroll buttons)
      └─ ScrollRow (horizontal scroll-snap row with stagger entrance)
         └─ SalonCard × N
```

Server components where possible (Section, SectionMeta, SectionFrame). Client components where interactivity is needed (SectionTitle for scroll state, ScrollRow for ref-forwarding).

---

## Public APIs

### `<Section>`

```ts
export function Section({ children, className }: { children: React.ReactNode; className?: string })
```

- Outer wrapper. Provides:
  - `mb-2 md:mb-4` between sections (V3-D132 — Airbnb-matched ~24 CSS gap).
  - `mx-auto max-w-[1280px] px-1 py-2 md:px-3 md:py-3` inner content frame.
- `className` is for **background only** (e.g. `bg-s-bg-sunken` on a tinted section). Outer is transparent + zero own padding.

### `<SectionMeta>`

```ts
export function SectionMeta({ eyebrow }: { eyebrow: string })
```

- Eyebrow label. Renders OUTSIDE the section frame, above the title.
- Style: 11-12px Inter 600 uppercase, tracking `0.08em`, color `s-ink-3`, NO leading dot (CANON §3 eyebrow recipe).
- Mobile padding: `px-2 mb-2`.

### `<SectionTitle>`

```ts
export function SectionTitle({
  title: string;
  link?: { label: string; href: string };
  scrollRef?: React.RefObject<HTMLDivElement | null>;
})
```

- H2 + optional inline chevron→arrow link + optional desktop scroll-arrow controls.
- Style: `font-body text-[clamp(20px,2.2vw,26px)] font-semibold leading-[1.2] tracking-[-0.025em] text-s-ink` (section H2 weight = 600 per CANON §3, was font-bold/700).
- **3 modes:**
  - `link` only → mobile + desktop both show inline chevron→arrow on the right.
  - `link + scrollRef` → mobile shows nothing; desktop shows two circle scroll buttons (Airbnb pattern).
  - No link → just the h2.

### `<SectionFrame>`

```ts
export function SectionFrame({ children, className }: { children: React.ReactNode; className?: string })
```

- **Invisible** container. No fill/blur/border/shadow — `FeedZone` owns the surface.
- Provides structural padding (`px-3 pt-1 pb-2 md:px-4 md:pt-2 md:pb-3`) for ScrollRow's negative-margin bleed.
- `overflow-hidden` so cards clipping/translating during hover don't escape.

### `<ScrollRow>` (ref-forwarded)

```ts
export const ScrollRow = React.forwardRef<HTMLDivElement, { children, className? }>
```

- Horizontal scroll-snap row.
- `mt-1` from SectionTitle (V3-D132).
- `gap-3` between children. `py-1` vertical so photo hover translateY(-3px) doesn't clip.
- Scroll style: `scroll-snap-type: x mandatory`, hidden scrollbar, `-webkit-overflow-scrolling: touch`.
- `-mx-3 px-3 md:-mx-5 md:px-5` negative-margin bleed so cards align to the frame's rounded border edge.
- `scroll-padding` aligns scroll-snap-align:start to padding edge.
- Last child gets `mr-2` trailing margin so it has rest space at scroll-end.
- Applies `salon-card-stagger` global class for staggered first-paint entrance.

### `<FeedZone>`

```ts
export function FeedZone({ children, className }: { children: React.ReactNode; className?: string })
```

- The "rising panel" that contains all section feeds below the hero.
- `mt-10 md:mt-8` from hero (V3-D170b — panel sits 32-40px below SearchCard so rounded-t edge is visible).
- `rounded-t-[28px] md:rounded-t-[40px]`.
- `border-t border-white/40` + `shadow-[0_-12px_32px_rgba(26,18,9,0.04)]` (upward shadow emphasizes "rising").
- `pt-2 pb-4 md:pt-4 md:pb-6` inner padding.
- Transparent background — atmosphere reads at full chroma below the cards.

---

## Visual signature (composed)

```
─────────────────────────  ← (no rule today; eyebrow handles the visual delineation)
BEI DIR ZULETZT           ← SectionMeta — plain eyebrow (no dot), ABOVE the frame

Zuletzt angesehen     →   ← SectionTitle inside SectionFrame; chevron→arrow link
┌─────┐ ┌─────┐ ┌─────┐    ← ScrollRow — SalonCards w 12px gap, scroll-snap-x
│  📸  │ │  📸  │ │  📸  │
└─────┘ └─────┘ └─────┘
```

---

## Motion (component-specific)

| Component | Trigger | Property | Duration | Easing | Notes |
|---|---|---|---|---|---|
| SectionTitle chevron→arrow | Hover | `stroke-dashoffset` on stem path + `translate-x` on group | 200ms | `ease-glide` | Stem "draws in" left-to-right via stroke dasharray trick (V3-D156). Group also nudges 0.5 to the right. |
| ScrollCircleButton (desktop) | Hover | `border-color` + `text-color` | 200ms | `ease-glide` | white surface + ink/10 → ink/30 hairline + ink text. |
| ScrollCircleButton (desktop) | Active | `scale` | 80ms | `ease-glide` | scale-[0.94]. |
| ScrollRow (first paint) | Mount | opacity + translateY | 50ms stagger | (global keyframes) | `.salon-card-stagger` global class. Children fade+rise 50ms after previous. Respects `prefers-reduced-motion`. |

---

## Spatial rhythm (the spacing locks)

Per [SOURCE.md §4](../SOURCE.md#§4--spatial-rhythm), the canonical homepage gaps:

| Element gap | Value | Source |
|---|---|---|
| Section to section (outer `mb`) | 8px mobile / 16px desktop | `Section` `mb-2 md:mb-4` |
| Section own padding (outer `py`) | 8px mobile / 12px desktop | `Section` `py-2 md:py-3` |
| **Total visible inter-section** | ~24 CSS px | (V3-D132 Airbnb-matched) |
| Eyebrow to title | 8px (mb-2) | `SectionMeta` `mb-2` |
| Title to first card row | 4px | `ScrollRow` `mt-1` |
| Card to card horizontal | 12px (gap-3) | `ScrollRow` `gap-3` |
| FeedZone to hero | 40px mobile / 32px desktop | `FeedZone` `mt-10 md:mt-8` (V3-D170b) |
| FeedZone internal pt | 8px mobile / 16px desktop | `FeedZone` `pt-2 md:pt-4` |

Do not tweak any of these without a measurement-backed PR. They were dialed against Airbnb's gap rhythm + verified on real device widths.

---

## Do / Don't

### Do

- Use the full stack — Section → FeedZone → SectionMeta → SectionFrame → SectionTitle → ScrollRow → cards. Skipping any breaks the rhythm.
- Pass `scrollRef` to BOTH `<SectionTitle>` AND `<ScrollRow>` (same ref). Desktop arrow buttons need to control the row programmatically.
- Use `<SectionTitle>` for non-scrolling sections too — e.g. vertical-list FeaturedStylists uses just `<SectionTitle title={...} />` with no `link`, no `scrollRef`.

### Don't

- Don't put a wrapper `<div className="bg-...">` between FeedZone and its children. FeedZone's transparent bg is intentional — atmosphere should bleed through.
- Don't nest `<Section>` inside `<Section>`. The mb stacking will create a 32px gap. Use the inner `<div>` wrapper that Section already provides for content frame.
- Don't add per-section box shadows. FeedZone is the only container with a shadow (upward).
- Don't strip the V3-D{n} comments — they're load-bearing per [§15](../SOURCE.md#§15--provenance--changelog-rules).
- Don't use `scroll-snap-align: center` on cards — `start` is the spec. Center makes the leading-edge alignment unpredictable on mobile peek-views.
- Don't add a horizontal mask-image fade on ScrollRow — V3-D138 explicitly removed it (32px fade was wider than mobile card peek = broke the design). Hard-cut at frame edge is the rule now.

---

## Edge cases

| Case | Behavior |
|---|---|
| `scrollRef.current` is `null` (initial render) | `useEffect` early-returns; arrows are hidden until ref resolves. Re-runs when ref hydrates. |
| ScrollRow content overflows viewport but fits exactly | `canScrollLeft = false`, `canScrollRight = false`. Both arrows render disabled (`opacity-30 pointer-events-none`). |
| Async images load and change scrollWidth | `ResizeObserver` on the el re-runs `update()` so arrow state stays correct. |
| User toggles browser zoom | `clientWidth` and `scrollWidth` recompute via ResizeObserver. Arrow state stays correct. |
| `prefers-reduced-motion` | salon-card-stagger animation skipped (defined in globals.css). Chevron stem-draw still plays — it's a deliberate interaction signal, not a decoration. |
| Empty children in ScrollRow | Renders empty div. No error. Calling-side should conditionally render whole `<Section>` instead. |

---

## Provenance

- **V2-D41-rising-panel-3** (2026-05-09) — architecture lock: FeedZone owns the surface, SectionFrame is structural only. Removed per-section slabs.
- **V2-D49m** (2026-05-10) — `scrollRef` mode for SectionTitle. Desktop swaps text link for two circle scroll buttons (Airbnb pattern).
- **V2-D66** (2026-05-15) — title becomes plain text again; only the circled arrow is hover-affordant. Killed the mobile bare-arrow duplicate.
- **V3-D72** (2026-05-18) — Aurex floating shadow unified across cards + SearchBar (FeedZone shadow stays upward).
- **V3-D132** (2026-05-24) — section-to-section gap shrunk to Airbnb-matched ~24 CSS. SectionFrame pb-4 → pb-2.
- **V3-D138** (2026-05-25) — mask-image horizontal fade REMOVED from ScrollRow. Hard-cuts at frame edge now.
- **V3-D140** (2026-05-25) — stripped dusty-blue circle bg from SectionTitle arrow. Plain ink chevron only (80/17/3 rule — arrows are nav affordances, not 3% accent).
- **V3-D145** (2026-05-25) — FeedZone negative margin REMOVED (was `-mt-6 md:-mt-8`). Rising-panel-overlap intent obsolete with WHITE SearchCard.
- **V3-D156** (2026-05-25) — chevron-only at rest; stem draws in on hover via stroke-dasharray trick. Compounds with translate-x nudge.
- **V3-D170b** (2026-05-26) — FeedZone mt-10 md:mt-8 lock so rounded-t edge is visible below SearchCard.

---

## Related

- **SalonCard** — primary child of ScrollRow. See [SalonCard.md](SalonCard.md).
- **SearchBar** — sits above FeedZone in the hero. See [SearchBar.md](SearchBar.md).
- **Loading states** — when feed data is loading, skeleton cards go in ScrollRow place. See [LoadingStates.md](LoadingStates.md).
