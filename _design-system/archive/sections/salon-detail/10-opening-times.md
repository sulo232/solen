# SalonOpeningTimes — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4734.png` + `IMG_4735.png` (Fresha — "Öffnungszeiten" h2 + day rows w green dot for open / grey dot for closed + bold today + time-range right-aligned)
**Component:** `app/[locale]/_components/salon/SalonOpeningTimes.tsx`
**Layer:** 1 chrome + Layer 3 open/closed dot

## Layout

```
H2 "Öffnungszeiten"          (Inter Tight 700 clamp 18-23px)

● Montag                     09:00 – 18:00
● Dienstag (TODAY, bold)     09:00 – 18:00       ← bolded font-semibold
● Mittwoch                   09:00 – 18:00
…
○ Sonntag                    Geschlossen          ← grey dot
```

- List spacing: `space-y-2.5`
- Day row: `flex items-center justify-between text-[14px] font-body`
- Today's row: `font-semibold text-s-ink`
- Other rows: `text-s-ink-2`
- Open dot: `h-2 w-2 rounded-full bg-s-success`
- Closed dot: `h-2 w-2 rounded-full bg-s-ink-3/40`

## Tokens
- Open dot: `bg-s-success` (`#16A34A` — V3-D197 §1 universal green for "go/open")
- Closed dot: `bg-s-ink-3/40` (muted ink at 40% — chrome, no semantic meaning beyond "off")
- Today bold: `font-semibold text-s-ink`

## Interaction
- None (display-only) — to expand into the SalonSidebar's collapsible variant, see SalonSidebar §18

## Intentional deviations
- Fresha shows TWO time slots per day (morning + afternoon split for French salons that close midday); our schema currently stores one `{open, close}` pair → we render as single range. Schema enhancement deferred (would require migration + UI re-spec).
- Closed dot is `bg-s-ink-3/40` (chrome ink) rather than `bg-s-error` red — closed is "not active", not "failure". §1 universal-color picks: closed = muted grey.

## Edge cases
- `hours == null`: returns null entirely (orchestrator handles)
- Day missing from `hours` map: renders "Geschlossen" w grey dot

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A13) — H2 swap; open dot `bg-emerald-500` (Tailwind default) → `bg-s-success` (Solen token); closed dot uses `bg-s-ink-3/40` ramp
