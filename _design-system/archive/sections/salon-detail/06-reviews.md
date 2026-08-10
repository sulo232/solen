# SalonReviews — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4731.png` + `IMG_4732.png` (Fresha — Bewertungen summary "★★★★★ 5,0 (19)" + cards w avatar initial + name + date + 5-star row + comment) · `/Users/sulo/solen/screenshots/IMG_4733.png` ("Mehr erfahren" toggle + "Alle anzeigen")
**Component:** `app/[locale]/_components/salon/SalonReviews.tsx`
**Layer:** 1 chrome + Layer 3 star + Layer 3 avatar B&W tone

## Layout

```
H2 "Bewertungen" (Inter Tight 700 clamp 18-23px)

★★★★★ 4.8 (4)         (20px filled / empty stars + 18px bold rating + 13px count)

Review card grid (mobile: 1 col, desktop: 2 col):
  [Avatar 40px] Name (13px font-semibold)
                Date (11px text-s-ink-3)
  ★★★★★ (13px row)
  Comment text (14px line-clamp-3)
  Mehr lesen → (13px font-semibold text-s-ink — when line-clamped)

Up to 6 cards shown, then:
[Alle ansehen]   (outline pill, full-width center)
```

## Measured (375 mobile)
- Summary stars: 20px (5 across)
- Rating number: `18px font-bold tracking-tight text-s-ink` (desktop bumps to 20px)
- Count: `13px text-s-ink-3`
- Card avatar: 40×40 round w deterministic-hash B&W tone (4-step palette)
- Comment: `14px leading-relaxed text-s-ink-2 line-clamp-3`

## Tokens
- Star filled: `#FFC32B` (V3-D200)
- Star empty: `#E7E5E4` (s-border)
- Avatar palette (V3-D202 `AVATAR_PALETTE`): 4-tone B&W ranging from `#F5F5F4 + #0A0A0A` to `#A8A29E + #FFFFFF` — chrome only, no color invention
- "Mehr lesen" link: `text-s-ink font-semibold hover:underline`

## Interaction
- Click "Mehr lesen" → expand line-clamp on that card
- Click "Alle ansehen" → expand the full list inline (no separate route — pagination handled by `expanded` state)

## Intentional deviations
- Fresha uses warm purple/pink avatar tones; we use B&W (avatar initial is chrome per Q19, not user content — initials are deterministic from name)
- Fresha "+ Mehr erfahren" pattern → we use "Mehr lesen" (Solen voice register)

## Empty state
- 0 reviews: `<p>Noch keine Bewertungen.</p>` italic `text-s-ink-3`

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A9) — H2 swap; star fills `#FFC32B`; empty-star `#E7E5E4` (was retired cream `#E8DFD2`); avatar palette migrated to B&W
