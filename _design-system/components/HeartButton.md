# HeartButton

**File:** [app/[locale]/_components/homepage/HeartButton.tsx](../../app/[locale]/_components/homepage/HeartButton.tsx)
**Layer:** 3 (semantic UI — color IS the meaning: pink `#FF3366` = saved, ink stroke = unsaved. Universal "save/love" hue per §1.)
**Locked since:** V3-D73 (44px hit area), V3-D103 (universal pink fill `#FF3366`)
**SOURCE.md links:** [§11 Clickable Surface Contract](../SOURCE.md#§11--clickable-surface-contract) · [§16 a11y](../SOURCE.md#§16--accessibility-rules) · [§6 Motion](../SOURCE.md#§6--motion-vocabulary)

---

## Purpose

The single canonical "save" interaction primitive. Used on every salon-shaped surface where a user can favourite. Sits in the top-right corner of the photo area.

Two variants live in the codebase:

1. **`HeartButton`** (this file) — 44×44 hit area + 28×28 visible glass circle. Used on `SalonCard` and any surface where the 44px hit zone fits.
2. **`SaveHeart`** (private to `FeaturedStylists`) — 28×28 compact variant for the 72px stylist photo. See [HeartButton.md#variants](#variants).

If you need a third variant, ask in [QUESTIONS.md](../QUESTIONS.md) — don't clone-and-tweak.

---

## Public API

```ts
export function HeartButton({
  isSaved?: boolean;          // Initial saved state (default false)
  salonName: string;          // Required — used in aria-label + live region announcement
  className?: string;         // Outer button override (e.g. text color for dark photos)
  salonId?: string;           // Reserved for future /api/favorites/toggle wiring
  tone?: string;              // Optional visual hint (e.g. "spa" / "warm") — currently unused
}): JSX.Element
```

**Internal state:**

- `isSaved` — local boolean. Initialized from prop. Toggled on click.
- `announcement` — string for `aria-live="polite"` screen reader announcement.
- `popKey` — increments on UNSAVED→SAVED transition only. Re-mounts SVG so the `@keyframes heart-pop` animation restarts cleanly.

**Persistence:** None yet. Local state only. See [Q11 in QUESTIONS.md](../QUESTIONS.md#q11) for backend wiring timeline.

---

## Visual signature

```
┌────────────────┐
│                │
│      ◯  ←─── 28×28 frosted-glass circle (80% white + 4px backdrop blur)
│   ♡           │
│                │   The 44×44 invisible button hit area extends beyond the
│                │   glass circle in all directions. The button is transparent;
└────────────────┘   the glass circle inside it carries all the visual styling.
```

**Default (unsaved):**
- Heart icon: `lucide-react` Heart, size 16, strokeWidth 2.25, stroke `var(--color-heading)` (ink).
- Inner span: 28×28, `rounded-full`, white-glass at 80% alpha + 4px backdrop-blur + 1px white inner border + soft 0/1/3 black drop-shadow + inset 0/1/0 white highlight.

**Saved:**
- Heart icon: fill `#FF3366` (universal `--heart-active`, V3-D103). No stroke.
- Inner span: unchanged (the heart fills, the glass circle stays).
- A one-shot `animate-heart-pop` keyframe plays (scale 0.5 → 1.15 → 1.0, ~300ms spring).

**Dark-photo variant:** Pass `className="text-white/85"` from parent (e.g. spa cat). Heart stroke uses currentColor → renders white-85 on dark backgrounds. Glass circle is unchanged (white-on-anything reads as glass).

**Geometry locks:**

- Outer button: `h-11 w-11` (44×44). Position `absolute right-[2px] top-[2px]`. Background `bg-transparent`.
- Inner glass: `h-7 w-7` (28×28), `rounded-full`. Centered via `grid place-items-center`.
- Heart icon: `size={16}` (16px lucide spec), `strokeWidth={2.25}`.

---

## Motion (component-specific)

| Trigger | Property | Duration | Easing | Notes |
|---|---|---|---|---|
| Hover | `scale` (inner glass) | 200ms | `ease-glide` | scale-110 — visible bump on the visible circle, NOT the invisible hit area |
| Active (press) | `scale` (inner glass) | 80ms | `ease-glide` | scale-[0.97] — press feedback |
| Save (UNSAVED → SAVED) | `transform` (heart SVG) | ~300ms | spring-style | `@keyframes heart-pop` (defined in `app/globals.css`); 0.5 → 1.15 → 1.0 scale |
| Unsave (SAVED → UNSAVED) | none | — | — | Heart fill/stroke flip is instant — pop animation only on save direction |

The pop-only-on-save is intentional: saves are the celebratory action; unsaves are admin. Asymmetric motion communicates that.

---

## Accessibility

| Attribute | Value | Why |
|---|---|---|
| `aria-label` | "Gespeichert" if saved, "Speichern" if not | German-first per [§17 i18n](../SOURCE.md#§17--i18n-rules) |
| `aria-pressed` | `isSaved` boolean | Toggle-button semantics |
| `aria-live="polite"` (sr-only span) | `"{salonName} gespeichert"` or `"{salonName} entfernt"` | Confirms save to screen-reader users without blocking focus |
| Focus ring | `focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-full` | 2px ink outline matches [§16 focus ring](../SOURCE.md#§16--accessibility-rules) (pending [Q5](../QUESTIONS.md#q5) for color confirm) |

**Hit area:** 44×44 — meets WCAG 2.5.5 ideal. The 28×28 visible glass + ~8px halo of invisible padding gives mis-tap forgiveness without enlarging the visual footprint.

**Event handling:**

- `onClick={toggle}` — calls `e.preventDefault()` AND `e.stopPropagation()`. The card's outer `<Link>` would otherwise navigate. Saves are local to the heart.

---

## Do / Don't

### Do

- Pass `salonName` always — it powers both the aria-label AND the announcement live region. Empty string makes the heart invisible to screen readers.
- Pass `className="text-white/85"` when the parent photo is dark (spa cat). Heart stroke inherits via currentColor.
- Trust the 44px hit area — don't add `pointer-events-auto` or wrappers thinking it's too small. It IS 44px (the inner glass just looks like 28px).

### Don't

- Don't add a circle background to the parent — the glass styling lives on the inner span. A circle on the parent (e.g. `bg-white rounded-full`) creates a double-circle visual bug.
- Don't change the size by passing inline styles — variants exist for that reason. See [§14 component authoring contract](../SOURCE.md#§14--component-authoring-contract). If you need a smaller heart, write a `SaveHeart`-style 28px variant in the consuming component (see [FeaturedStylists.tsx:243](../../app/[locale]/_components/homepage/FeaturedStylists.tsx:243) as the pattern).
- Don't wire to `/api/favorites/toggle` without first checking that the endpoint accepts the relevant entity type. Today it accepts `salon_id` only. `stylist_id` is pending (Q11).
- Don't use `<div onClick>` instead of `<button>` — keyboard users can't activate the save without a real button.
- Don't omit the `e.preventDefault()` + `e.stopPropagation()` in the onClick handler. The parent Link will navigate to `/salon/[slug]` otherwise.

---

## Variants

### SaveHeart (compact, 28×28)

Lives in [FeaturedStylists.tsx:243](../../app/[locale]/_components/homepage/FeaturedStylists.tsx:243). Same semantic role but:

- Hit area: 32×32 (just under WCAG 44px ideal — acceptable trade-off for 72px avatar).
- Visible glass: 32×32 (entire button is the glass, no inner-vs-outer split).
- Position: `-right-1 -top-1` (slight overflow off photo corner for "applied sticker" feel).
- Heart size: 14px (smaller than the main 16px).
- Border: `border border-white/60` (visible white ring; HeartButton's main variant uses an inset).

**When to use SaveHeart over HeartButton:**

| Photo size | Use |
|---|---|
| ≥160px (SalonCard, search results) | `HeartButton` (44×44 hit area, 28×28 glass) |
| 72-100px (FeaturedStylists, dense lists) | `SaveHeart` (32×32 hit, 32×32 glass) |
| <72px | Probably wrong — surface a card-shaped wrapper instead |

---

## Edge cases

| Case | Behavior |
|---|---|
| `salonName` is empty string | Heart still renders; aria-label becomes "Speichern" (no name part). Announcement also blank-leading. Pass a name always. |
| User logs out mid-session | Local state persists; backend wiring (when present) will need to handle 401. Today: no-op. |
| Save→unsave→save rapid taps | popKey increments on every save direction. Animation restarts cleanly. No queue, no debounce. |
| `prefers-reduced-motion` | Pop animation is `@keyframes heart-pop` in globals.css — should have a `@media (prefers-reduced-motion)` override that makes it instant. Verify on next pass. (Q14 covers skeleton shimmer; heart-pop motion-reduce is a separate audit.) |
| Parent is not a Link / Button | Heart still works (the toggle is internal). But `preventDefault` does nothing if no parent owns the event — harmless. |

---

## Provenance

- **V2-D43** (Emil polish) — popKey re-mount pattern for spring-feel heart-pop animation.
- **V2-D52** Tier 1 #15 — `salonId` prop added for future `/api/favorites/toggle` wiring.
- **V3-D72** (2026-05-18) — frosted-glass circle wrapper spec finalized: 80% white + 4px backdrop-blur + 1px white inner border.
- **V3-D73** (2026-05-18) — touch-target expansion: 44×44 hit area + visible glass circle. Hover/focus/active states scale the inner glass, not the outer button. (Glass circle is 28×28 + 16px icon per CANON 2026-06-01; the V3-D73-era 32×32/18px values were tightened.)
- **V3-D103** (2026-05-23) — saved fill aligned to universal `--heart-active` `#FF3366` (was held over at V2 muted `#CC4A60`).

---

## Related

- **SalonCard** — hosts HeartButton in its top-right slot. See [SalonCard.md](SalonCard.md).
- **FeaturedStylists** SaveHeart (private) — 28px variant for stylist photos.
- **Universal `--heart-active` token** — `#FF3366`, defined in `app/globals.css`. Heart pink is a signal color per [§9.4](../SOURCE.md#§9--photography--user-content-under-bw-lock), NOT in the 3% accent band.
