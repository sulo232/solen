# SalonLightbox — section spec

**Reference:** (standard full-screen photo modal; Fresha behaves similarly when tapping any photo) · no Solen audit screenshot (modal not captured during the audit pass)
**Component:** `app/[locale]/_components/salon/SalonLightbox.tsx`
**Layer:** 1 (chrome — full-screen modal)

## Layout

Full-screen modal portal at z-[80] (above sticky tab nav z-[60] and site header z-50).

```
┌─────────────────────────────────────────┐
│ [X]                          [Counter]  │
│                                          │
│        ◀  [   Photo (contain)   ]  ▶    │
│                                          │
│                                          │
└─────────────────────────────────────────┘
```

- Backdrop: `bg-black/95`
- Photo: object-contain to preserve aspect
- Controls: floating `bg-white/10 backdrop-blur-md` glass buttons (`backdrop-blur` acceptable here — modal not scrolling)
- Counter: top-right, `text-white/85 text-[13px]`
- ESC key closes; left/right keys navigate; clicking backdrop closes

## Tokens
- Backdrop: `bg-black/95` (warm-ink-friendly true black)
- Glass controls: `bg-white/10 backdrop-blur-md` (perf OK — modal, not scrolling chrome)

## Interaction
- Click backdrop → close
- Click X → close
- Click ◀ / ▶ → navigate prev/next
- ESC key → close
- Arrow keys → navigate

## Intentional deviations
- None — standard accessible lightbox

## Edge cases
- `photos.length === 0`: no render (orchestrator handles)
- `startIndex >= photos.length`: clamp to 0

## Provenance
- V2-D53.3 — initial impl (existing, clean)
- V3-D202 — no changes (already on-spec for B&W chrome)
