# SalonMobileBookBar — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4728.png` (Fresha — bottom "Jetzt buchen" black pill, full width)
**Component:** `app/[locale]/_components/salon/SalonMobileBookBar.tsx`
**Layer:** 1 (chrome)

## Layout

Fixed bottom, mobile + tablet only (`lg:hidden`). Desktop uses `SalonSidebar`'s collapse-on-scroll bar instead.

```
─── (s-border hairline) ─────────────────────────
│
│        [    Termin buchen     >    ]
│
└─────────────────────────────────────────────────
```

- Container: `fixed bottom-0 left-0 right-0 z-30 border-t border-s-border bg-white px-4 py-3`
- CTA pill: `flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white hover:bg-black active:bg-black`
- ChevronRight: `16px strokeWidth={2.5}`

## Tokens
- Bg: `bg-white` (V3-D202 — dropped `bg-white/95 backdrop-blur-md` per §13 mobile-perf)
- Border: `border-t border-s-border` hairline
- CTA: `bg-s-ink` (Layer 1 — V3-D192-fix primary CTAs stay ink)

## Interaction
- Click → `/{locale}/salon/{slug}/booking`
- z-30 sits below the salon sticky tab nav (`z-[60]`, V3-D206) and below the site header (`z-50`) — no conflict (it lives at viewport bottom)

## Intentional deviations
- Full-width edge-to-edge pill (Fresha uses smaller centered pill); Solen mobile target benefits from larger tap target
- Solid white bg (Fresha frosts the bar w blur); Solen drops blur for compositor-layer perf

## Edge cases
- None — always renders on mobile

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A20) — drop `bg-white/95 backdrop-blur-md` → `bg-white`
