# SalonHero — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4728.png` (Fresha mobile — Petit Bout d'Nails) · `_audits/screenshots/salon-detail/03-mobile-top.png` (Solen)
**Component:** `app/[locale]/_components/salon/SalonHero.tsx`
**Layer:** 1 (chrome) + Layer 3 child (HeartButton)

## Layout

### Mobile (`<md:`)
- Full-bleed photo, `aspect-[4/3]` (375 × 281.25 px at 375 viewport — measured)
- Background fallback: `bg-s-bg-sunken` with monogram initial in `font-display 120px font-black text-s-ink-disabled`
- Overlay icons: top-left `ArrowLeft` (24px), top-right cluster of `Share` (22px) + `HeartButton` (44px hit / 32px visible)
- All overlay icons use `stroke="rgba(255, 255, 255, 0.95)"` + drop-shadow filter for legibility on any photo
- When `photos.length > 1`: bottom-right pill `bg-s-ink/85 text-white rounded-full px-3.5 py-2 text-[12px] font-semibold` reads "Alle Fotos ansehen (N)"

### Desktop (`md:` and up)
- `aspect-[16/7]` 3-photo gallery wrapped in `rounded-3xl` outer
- 1 photo: single full-width image
- 2 photos: 2-col grid
- 3+ photos: Fresha pattern — large left (`col-span-2 row-span-2`) + 2 stacked right + bottom-right "Alle Fotos ansehen" white pill

## Tokens
- Photo bg fallback: `bg-s-bg-sunken`
- Overlay icon stroke: inline `rgba(255, 255, 255, 0.95)` (drop-shadow-anchored to photo)
- Pill bg: `bg-s-ink/85` (mobile) / `bg-white/95` (desktop)
- Radius: `rounded-3xl` (24px) on desktop outer — flagged in legacy spec for `rounded-card-lg` migration; deferred (cosmetic only, no clipping change)

## Interaction
- Click photo → `onOpenLightbox(0)` opens `SalonLightbox` modal
- Click "Alle Fotos ansehen" pill → `onOpenLightbox(0)`
- Click ArrowLeft → `router.back()`
- Click Share → `navigator.share()` w fallback to clipboard
- Click HeartButton → toggles saved state + toast

## Intentional deviations
- Fresha uses iOS native share sheet; we use Web Share API with clipboard fallback
- Hero radius is `rounded-3xl` (24px) on desktop instead of the §5 `rounded-card-lg` token — pre-existing pattern, low-impact, deferred fix

## Provenance
- V3-D202 — atmosphere washes deleted, `bg-s-ink/85` for photo-count pill (was white-glass)
- V3-D202 (A2) — drop `backdrop-blur-md` on photo-count pill per §13 mobile-perf
