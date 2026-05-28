# SalonTeam — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4730.png` + `IMG_4731.png` (Fresha — Team section w large round avatar "M" + ★ 5.0 floating badge + "Marjory" name)
**Component:** `app/[locale]/_components/salon/SalonTeam.tsx`
**Layer:** 1 chrome + Layer 3 rating badge

## Layout

```
H2 "Team" (Inter Tight 700 clamp 18-23px)

[Avatar 88px] [Avatar 88px] [Avatar 88px] →
   Name             Name            Name
   DE/EN (uppercase) ...
```

- Horizontal carousel (`flex gap-5 overflow-x-auto snap-x snap-mandatory`)
- Mobile: 88×88 round avatar, desktop: 112×112
- Each card: `w-[112px] shrink-0 snap-start` (mobile) / `w-[136px]` (desktop)
- Avatar ring: `ring-2 ring-white shadow-elevation-1`
- Floating rating badge (bottom-left of avatar): `bg-white rounded-full px-2 py-0.5 text-[11px] font-bold` w `<Star fill="#FFC32B" size={10}>` + numeric
- Name: `font-body 13px font-semibold` (mobile) / `14px` (desktop)
- Languages: `font-body 11px uppercase tracking-[0.04em] text-s-ink-3`

## Tokens
- Avatar ring shadow: `shadow-elevation-1` (V3-D202 — was tinted emerald `rgba(31,92,66,0.10)`)
- Star: `#FFC32B` (V3-D200 universal yellow)
- Initial monogram fallback: `font-display 28px md:36px font-black text-s-ink` (Hanken Grotesk → wait that's font-display so Inter Tight) on `bg-white`
- Languages: `text-s-ink-3` muted

## Interaction
- None currently (per-staff portfolio page deferred — clicking does nothing). Open Q: wire to `/staff/{id}` once that route exists.

## Intentional deviations
- Fresha shows "Marjory" only (no language line); we add DE/EN languages because Solen seed data carries them — adds value for multi-lingual matching
- Fresha avatar is purple-tinted; ours is white w light grey for B&W chrome consistency

## Edge cases
- 0 staff: section returns null (orchestrator's `availableSections` flag prevents tab nav showing it)
- Staff w no review yet: fall back to salon's `average_rating` w `opacity-60` on badge (visually mutes the inferred rating)
- Staff w no avatar URL: initial monogram in B&W

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A8) — H2 swap; tinted emerald shadow → `shadow-elevation-1`; star fill `#FFC32B`
