# Remotion Promo Reel — Design Spec

**Date:** 2026-04-04  
**Status:** Approved  
**Output:** `remotion/out/PromoReel.mp4`

---

## Overview

A 15-second vertical promo video (1080×1920, 9:16) for Solen.ch, styled as an Instagram Reel / TikTok-native social ad. Fast cuts, bold typography, brand colors. Built with Remotion as a standalone project inside the existing monorepo.

---

## Project Structure

```
solen/
└── remotion/
    ├── package.json
    ├── remotion.config.ts
    └── src/
        ├── index.ts                     # Registers compositions
        ├── Root.tsx                     # Root composition entry
        ├── tokens.ts                    # Brand design tokens
        └── compositions/
            └── PromoReel/
                ├── index.tsx            # Main 15s composition (450 frames @ 30fps)
                ├── Scene1Logo.tsx       # Logo reveal (frames 0–90)
                ├── Scene2Headline.tsx   # Headline slam (frames 90–210)
                ├── Scene3Cards.tsx      # Service cards flash (frames 210–360)
                └── Scene4CTA.tsx        # CTA end card (frames 360–450)
```

---

## Technical Specs

| Property | Value |
|---|---|
| Width | 1080px |
| Height | 1920px |
| FPS | 30 |
| Duration | 15 seconds (450 frames) |
| Output format | MP4 (H.264) |
| Fonts | Bebas Neue (display), DM Sans (body) via `@remotion/google-fonts` |
| Animation | Remotion `interpolate()` + `spring()` — no external animation libs |

---

## Brand Tokens (`src/tokens.ts`)

```ts
export const tokens = {
  coral:   '#E8624A',
  cream:   '#FAF6EF',
  ink:     '#1A1209',
  white:   '#FFFFFF',
  fontDisplay: 'Bebas Neue',
  fontBody:    'DM Sans',
};
```

---

## Scenes

### Scene 1 — Logo Reveal (0–3s, frames 0–90)
- Background: cream `#FAF6EF`
- "SOLEN" wordmark centered, Bebas Neue, 120px, ink color
- Entry: `spring()` scale from 0.6 → 1.0 + opacity fade in over 20 frames
- Subtle coral underline wipes in from left after wordmark settles (frames 30–60)

### Scene 2 — Headline Slam (3–7s, frames 90–210)
- Background: ink `#1A1209` (dark, high contrast)
- "BOOK YOUR\nSALON IN\nBASEL" — Bebas Neue, 140px, white, full-width
- Each line slams in from bottom with `spring({ stiffness: 300, damping: 20 })`, staggered 12 frames apart
- Coral rectangle accent bar flashes on behind text at frame 160 (quick 8-frame flash)

### Scene 3 — Service Cards (7–12s, frames 210–360)
- Background: cream `#FAF6EF`
- Three cards appear in rapid succession, each visible for ~35 frames:
  - **Hair** (frames 210–245): coral bg, white "HAIR" label, scissors icon placeholder
  - **Nails** (frames 245–290): ink bg, cream "NAILS" label, nail icon placeholder
  - **Barber** (frames 290–345): coral bg, white "BARBER" label, razor icon placeholder
- Each card: `spring()` scale from 0.85 → 1.0 + slide up 40px on entry
- Cards fill 80% of frame width, centered, `border-radius: 24px`

### Scene 4 — CTA End Card (12–15s, frames 360–450)
- Background: cream `#FAF6EF`
- "solen.ch" centered, Bebas Neue, 100px, ink
- Coral oval pulses behind text: `interpolate()` scale 1.0 → 1.08 → 1.0, loops every 30 frames
- Subtitle: "Dein Salon in Basel" — DM Sans, 28px, ink/60 opacity, fades in at frame 390
- Coral oval pulse uses `opacity: 0.15` so text remains readable

---

## Dependencies

```json
{
  "remotion": "^4.0.0",
  "@remotion/cli": "^4.0.0",
  "@remotion/google-fonts": "^4.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5.0.0"
}
```

> React 19 is used to match the parent Next.js project version.

---

## Scripts

```json
{
  "scripts": {
    "dev": "npx remotion studio",
    "render": "npx remotion render PromoReel out/PromoReel.mp4",
    "build": "npx remotion render PromoReel out/PromoReel.mp4 --overwrite"
  }
}
```

---

## Render Instructions

```bash
cd remotion
npm install
npm run dev       # Opens Remotion Studio at localhost:3000 — preview in browser
npm run render    # Renders to remotion/out/PromoReel.mp4
```

---

## Success Criteria

- [ ] `npm run dev` launches Remotion Studio with the PromoReel composition visible
- [ ] All 4 scenes play in correct order with no visual glitches
- [ ] `npm run render` produces `out/PromoReel.mp4` at 1080×1920, 15s
- [ ] Brand colors match exactly: coral `#E8624A`, cream `#FAF6EF`, ink `#1A1209`
- [ ] Fonts load correctly: Bebas Neue for display, DM Sans for body
- [ ] Video plays smoothly at 30fps with no dropped frames

---

## Out of Scope

- Audio / music track (can be added later via `<Audio>`)
- Real salon photography (placeholder colors used for now)
- Localization (German copy only for initial version)
- Automatic upload to social platforms
