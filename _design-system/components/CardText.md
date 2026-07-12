# CardName / CardMeta

**File:** `app/[locale]/_components/primitives/CardText.tsx`
**Layer:** 1 (chrome — typography)
**Status:** locked
**Added:** V3-D346 (rule) / V3-D348 (primitives), 2026-05-28

## What it is

Two tiny primitives that enforce **LOCKFILE §2.5 rule A13 (card text hierarchy)** by construction. Inside any repeating card or list-item there is exactly ONE ink anchor — the entity name — and everything else recedes to grey. These bake the locked weight + color so a card physically can't over-bold its meta.

```tsx
import { CardName, CardMeta } from "@/app/[locale]/_components/primitives";

<CardName>Salon Maria</CardName>          // the one anchor — 500 / text-s-ink
<CardMeta>14:30 · CHF 80</CardMeta>       // recessive meta — 400 / text-s-ink-2
```

## Why it exists

User, 2026-05-28: *"using too bold ... multiple times that destroys my eye"* + *"these are patches not fixes."* A card with the name bold-ink AND the time bold-ink AND the rating bold-ink has four competing anchors, so the eye has nowhere to rest and the card reads busy / cheap. Uber's cards (measured `public/_pixel-refs/uber/`) carry exactly one darker anchor and let the rest sit in calm grey. This is the AESTHETIC axis (Uber contrast model) per LOCKFILE §10.

## API

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | — | The text. |
| `as` | `ElementType` | `CardName`=`div`, `CardMeta`=`span` | Render element (use `h3` for a semantic card heading, etc.). |
| `className` | `string` | — | **LAYOUT ONLY** — `truncate`, `text-[Npx]` sizes, `leading-*`, `mt-*`, flex. **Never weight or color.** |

## Locked recipes

- **CardName** → `text-s-ink font-medium` (500). The single ink anchor.
- **CardMeta** → `text-s-ink-2 font-normal` (400). Rating, distance, time, price, duration, count, address, availability.

## Use for / Don't reuse for

- **Use:** the name + meta of any salon card, stylist card, service row, review item, package card, venue-nearby card, search result.
- **Don't:** section headings (use an `h2` at 600), CTA button labels (Primary/Secondary CTA recipe), semantic status (use `StatusInline` — color IS the message; `StatusPill` was deleted 2026-06-30, see `StatusPill.md`), or a commerce card's headline price/total (may stay `text-s-ink` but use `font-semibold`, not these).

## Gotcha — cn() is clsx, not tailwind-merge

`cn()` (`lib/utils.ts`) is plain `clsx`. If you pass a conflicting weight/color in `className` (e.g. `font-bold`), it will NOT reliably override the baked class — both land in the attribute and CSS source order decides. So: `className` carries layout only. Anyone who bypasses these primitives and writes raw `font-bold text-s-ink` on small/meta text is flagged by the drift checker (**INFO A13**).

## Enforcement

- **Documented:** LOCKFILE §2.5 rule A13 + this file.
- **Static:** drift checker `INFO A13` flags `font-bold` on `text-[<22px]` or on `text-s-ink-2/3` (the over-bold signal). Hero H1 (`text-[clamp(...)]`) is exempt.
- **Runtime:** the getComputedStyle audit (one dark+bold anchor per card) — the full A13 check, since a line-scanner can't count anchors-per-card structurally.
