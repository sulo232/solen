# SearchBar

**File:** [app/[locale]/_components/homepage/SearchBar.tsx](../../app/[locale]/_components/homepage/SearchBar.tsx)
**Layer:** 1 chrome (bar surface is white card + ink CTAs per V3-D192-fix; no Layer 3 surfaces here)
**Locked since:** V2-D41-fu (Dynamic-Island morph), V3-D144 (mobile height 280)
**SOURCE.md links:** [§6 Motion](../SOURCE.md#§6--motion-vocabulary) · [§14 Component authoring contract](../SOURCE.md#§14--component-authoring-contract) · [§13 Mobile perf](../SOURCE.md#§13--mobile-perf-rules) · [§17 i18n](../SOURCE.md#§17--i18n-rules)

---

## Purpose

The hero search bar. Single most important interactive surface on the homepage — it's the entry into the 30-second booking promise. Drives every search query to `/[locale]/search`.

**Three segments:** Service / Stadt / Zeit. Each is independently optional; empty fields are omitted from the resulting query string. Tapping any segment expands the bar into a full-screen-feel picker via Dynamic-Island-style morph animation.

This is the canonical INPUT primitive. Form patterns elsewhere should look at how SearchBar handles morph, dim-backdrop, focus-trap, esc-to-close — not invent new ones.

---

## Public API

```ts
export function SearchBar(): JSX.Element
```

No props. State is self-contained (no caller customization needed).

**Internal state (React.useState):**

- `active: Segment | null` — which segment is expanded. `null` = collapsed.
- `service: string` — service name selection.
- `stadt: string` — city selection.
- `zeitDate: CalendarDate | null` — picked date.
- `zeitPeriod: string` — picked time-of-day (`"morning"` / `"noon"` / `"afternoon"` / `"evening"`).
- `zeit: string` (derived, useMemo) — display label e.g. "Sa. 26. Mai · Mittags".
- `isDesktop: boolean` — viewport tracking (`matchMedia("min-width: 768px")`).
- `prefersReducedMotion: boolean` — `useReducedMotion()` from motion/react.

**External effects:**

- Locks `document.body.style.overflow = "hidden"` when expanded.
- Listens for `Escape` keydown when expanded.
- Submit → `router.push(/${locale}/search?...)` with URLSearchParams.

---

## Visual signature

### Collapsed (mobile — stacked card)

```
┌─────────────────────────────┐  ← rounded-[11px], white bg, p-4
│  🔍  Service               │  ← row 1: input shape h-12 rounded-2xl border #D3D3D3
├─────────────────────────────┤
│  📍  Stadt                 │  ← row 2: same shape
├─────────────────────────────┤
│  📅  Zeit                  │  ← row 3: same shape
│                             │
│  [   Termine finden   ]    │  ← full-width CTA, h-12 rounded-full bg-s-ink
└─────────────────────────────┘
Total height: 280px (V3-D144 lock)
```

### Collapsed (desktop — horizontal pill)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔍 Service │ 📍 Stadt │ 📅 Zeit │  [Termine finden]  │  ← single 60px row, rounded-full
└──────────────────────────────────────────────────────────────────────┘
max-w-[540px] / max-w-none (full container width)
```

### Expanded (any viewport — picker card)

```
┌─────────────────────────────────────────────┐  ← rounded-[11px], 600px tall, z-[70]
│ [Service] [Stadt] [Zeit]              [×]  │  ← segment tabs + close
├─────────────────────────────────────────────┤
│                                             │
│  Picker content for active segment:        │
│   - service: input + chip list             │
│   - stadt: "Aktueller Standort" + cities   │
│   - zeit: <DateTimePicker> + period chips  │
│                                             │
├─────────────────────────────────────────────┤
│  Zurücksetzen              [   Suchen   ]  │
└─────────────────────────────────────────────┘
Behind: full-viewport rgba(0,0,0,0.30) dim, z-[60]
```

---

## Motion (the architecture, not just specs)

### Container morph
- ONE container, animated between explicit `height` and `borderRadius` values (NOT `layout: true` — explicit is smoother + predictable).
- Mobile: collapsed 280px / expanded 600px.
- Desktop: collapsed 60px / expanded 600px.
- Tween curve: `cubic-bezier(0.22, 1, 0.36, 1)` over `0.5s`. Same as the user-supplied DynamicIslandTOC reference.

### Cross-fade with stagger
- TWO content layers (collapsed + expanded), stacked absolutely inside the morphing container.
- collapsed→expanded transition: collapsed fades out at 0s, expanded fades in at 0.1s.
- expanded→collapsed transition: expanded fades out at 0s, collapsed fades in at 0.1s.
- The 0.1s stagger creates the "hand-off" feel — neither layer fights the other for visibility during morph.

### `overflow-hidden` on the morphing container clips content during morph

Without this, picker content shows at half-height mid-morph.

### Reduced motion
- `useReducedMotion()` hook from motion/react.
- When true: transition becomes `{ duration: 0 }`. State still changes; animation curve is bypassed.
- Picker AnimatePresence inside expanded layer also respects this.

### Anti-pattern: `will-change` / `translateZ(0)` permanently
- Removed in V2-D41-fu — forced a permanent GPU compositor layer that rasterized text at the layer's resolution (often less than device DPR) → blurry text in resting collapsed state.
- Motion library promotes layers DURING animation on its own. Don't force it permanently.

---

## Sub-components (private)

### `CollapsedRow`
- The h-12 rounded-2xl row shape for the mobile stacked card.
- On desktop: same row converts to a flex-1 segment inside the horizontal pill (rounded-full, no border, h-auto).
- Props: `icon` + `ariaLabel` + `value` + `isPlaceholder` + `isFirst?` + `onClick`.

### `SegmentTab`
- The pill tab inside the expanded header.
- States: active (`bg-s-ink text-white`), placeholder (`text-s-ink-3`), filled-not-active (`text-s-ink`).

### `IconSearch` / `IconPin` / `IconCalendar`
- Inline SVGs (custom, not lucide) for the three segments. 18×18, stroke ink-2.
- These are inline because they predate the §7 Iconography lock that says use lucide for all icons. **Open question:** migrate to lucide `Search` / `MapPin` / `Calendar` for consistency? (Will add to QUESTIONS.md as Q21 next pass.)

---

## Do / Don't

### Do

- Use this primitive — don't write a new search bar. If a sub-route needs a search bar, import or extend.
- Use the picker pattern (segment tabs + content cross-fade in `AnimatePresence mode="wait"`) for any segmented selection UI. It's a proven motion vocabulary.
- Respect the 540px max-width — the SearchBar is centered + capped on mobile so it doesn't span the full viewport.

### Don't

- Don't add a fourth segment. The 30-second promise rests on 3 inputs being the cap.
- Don't render the expanded layer outside the morphing container — both layers MUST be siblings inside one `motion.div` so the morph + cross-fade align.
- Don't blur the dim backdrop. V2-D41-fu deliberately removed `backdrop-filter` from the dim — plain rgba dim is 90% as visually effective and dramatically cheaper to paint.
- Don't pass `layout: true` to `motion.div` — explicit `height`/`borderRadius` values produce a smoother morph than letting motion library measure layouts.
- Don't add `will-change: transform` permanently. Motion library handles compositor promotion during animation. Permanent will-change forces a low-DPR raster → blurry text.
- Don't strip the body-overflow lock. Without it, the picker page can scroll behind the morph — feels broken.
- Don't introduce a 4th picker variant (e.g. "anywhere"). The 3-segment lock is intentional product scope.

---

## Edge cases

| Case | Behavior |
|---|---|
| Submit with all 3 segments empty | URLSearchParams is empty → `router.push("/{locale}/search")` (no query string). Search page shows all venues. |
| User picks service then closes via Esc | `setActive(null)` runs; `service` value persists. Bar returns to collapsed; service segment shows the picked label. |
| User picks date but no period | `zeit` derived label = just the date string ("Sa. 26. Mai"). |
| User picks period but no date | `zeit` = just the period label ("Mittags"). |
| `useReducedMotion()` returns true | All `motion.div` transitions use `{ duration: 0 }`. State changes instantly. No morph, no cross-fade, no entrance animations on picker content. |
| User has slow connection — DateTimePicker JS chunks lazy-loading | The picker shows briefly empty mid-load. Acceptable — no skeleton yet. Add if user complains. |
| Mobile keyboard opens on input focus (service / stadt) | Viewport height shrinks; the 600px expanded height might exceed visible viewport. Body-scroll-lock prevents background scroll but picker can still scroll internally (`overflow-y-auto` on content). Acceptable. |
| User taps backdrop dim | `onClick={() => setActive(null)}` collapses. Selections persist. |
| User taps `Zurücksetzen` | Clears `service` / `stadt` / `zeitDate` / `zeitPeriod`. Bar stays expanded on active segment. |

---

## Provenance

- **V2-D41-fu.3** (early) — reduced-motion path: all morph/crossfade transitions become instant.
- **V2-D49** — period-of-day chips replace loose "Jetzt/Heute/Morgen" list. Day + period granularity (not hour-by-hour). Real `DateTimePicker` primitive reused.
- **V2-D49b** — service chips get lucide icons (Scissors / Sparkles / Leaf / Hand / Footprints / Palette).
- **V2-D67-fu3** (2026-05-15) — mobile collapsed 248 → 304 for taller row paddings.
- **V2-D70** (2026-05-18) — warm-minimal architecture: rows flush-stacked w hairline divider; mobile 246 → 280.
- **V3-D89** (2026-05-20) — Fresha-exact row STRUCTURE: outlined pills with gap-3.
- **V3-D90** (2026-05-21) — pixel-spec-auto Fresha measurements applied (16px padding, 12px gap, 1px hairline #D3D3D3).
- **V3-D111** (2026-05-23) — CTA bg `s-brand-deep` → `s-ink` to match top banner.
- **V3-D125** (2026-05-24) — h-12 → h-14 inputs (Fresha rounded-square). HEIGHT 280 → 308.
- **V3-D129** (2026-05-24) — h-14 → h-12 inputs (measured Fresha is 47px not 56px).
- **V3-D131** (2026-05-24) — button h-14 → h-12, container 284 → 264.
- **V3-D144** (2026-05-25) — mobile collapsed 264 → 280 for CTA breathing room. **Current lock.**
- **V3-D146** (2026-05-25) — bg-s-brand → bg-s-ink for B&W palette pivot Phase 1.
- **V3-D178** (2026-05-26) — CTA copy "Solen durchsuchen" → "Termine finden" (council item #5). Rhetorical echo with H1 + "finden" implies result is waiting vs. "suchen" implying effort.

---

## Related

- **DateTimePicker** — primitive reused in the Zeit picker. Path: `app/[locale]/_components/primitives/DateTimePicker.tsx`.
- **Hero** — wraps SearchBar in the homepage. See `app/[locale]/_components/homepage/Hero.tsx`.
- **/[locale]/search** — destination of submit. URLSearchParams: `service`, `city`, `date`, `period`.
- **§14 Component authoring contract** — pattern for sub-components (CollapsedRow, SegmentTab) as private function components, not exported. See [SOURCE.md §14](../SOURCE.md#§14--component-authoring-contract).
