# CategoryHero

**File:** [app/[locale]/_components/landings/CategoryHero.tsx](../../app/[locale]/_components/landings/CategoryHero.tsx)
**Layer:** 1 chrome (full-width split-hero composition with photo + text)
**Locked since:** V3-D340 (W11, 2026-05-28)
**LOCKFILE links:** §11 Imagery Pattern 1 (Split-hero), §10.5 dual-axis conflict resolution (no Fresha equivalent → Solen precedent), V3-D205 universal-components rule

---

## Purpose

Editorial split-hero for the 6 category landing routes (`/coiffeur`, `/barbershop`, `/nails`, `/spa`, `/makeup`, `/waxing`). Sits ABOVE the existing SearchTemplate to provide a marketing-style intro before the search/grid surfaces below.

Universal-components rule (V3-D205): single component renders correctly for all 6 categories via props + lookup tables. NO `if category === 'X'` branches. Validated across 6 routes simultaneously.

---

## Public API

```ts
import type { Category } from "@/lib/category-photos";

export default async function CategoryHero({
  category,
}: {
  category: Category; // "coiffeur" | "barbershop" | "nails" | "spa" | "makeup" | "waxing"
}): Promise<JSX.Element>;
```

Server component. Uses `next-intl/server.getTranslations`.

---

## Pattern source

**LOCKFILE §11 Pattern 1 — "Split-hero"**:
- Text+CTA LEFT, 1:1 or 3:2 visual RIGHT
- No overlay
- Text on its own surface (not overlaid on photo)

**§11 non-negotiables applied:**
- aspect-[3/2] on the photo (canonical set)
- rounded-none on the img (0 border-radius)
- No rgba scrim, no gradient overlay

---

## Why NOT Pattern 2 (full-bleed editorial)

§11 Pattern 2 ("1440×700 art-directed photo, text in natural empty negative space, no rgba scrim") REQUIRES photos chosen for their negative-space composition. Tonight's run uses Unsplash placeholders (T6 photo strategy doc DEFERRED for user AM). Placeholders cannot guarantee an art-directed empty zone for text legibility.

Pattern 2 is the right end-state once real Solen photos arrive. For now Pattern 1 is the safer fallback that survives any photo (text on its own surface, no contrast risk).

The §10.8 Q1-Q5 pre-edit check caught this at Q4 (MATCH-or-DIVERGE) and reframed before shipping. Documented in `_design-system/_compliance-receipts.md` W11 entry.

---

## Photos

Hardcoded in `lib/category-photos.ts` as the `CATEGORY_PHOTOS` constant (Unsplash placeholders). Real photo strategy decision deferred to user AM (T6 in plan). Swap path = update the URLs in `category-photos.ts`, no component edit needed.

---

## i18n keys (per V3-D339 i18n REVERSED rule — full per-wave translations)

For each category, `messages/{de,en,fr,it}.json` carries:
- `categoryLanding.<category>.title` — main H1
- `categoryLanding.<category>.sub` — supporting subtitle

Example: `categoryLanding.coiffeur.title` renders as "Coiffeur in der Schweiz" (DE) / "Hair salons in Switzerland" (EN) / "Coiffeurs en Suisse" (FR) / "Parrucchieri in Svizzera" (IT).

No em-dashes. No `ß` (always `ss`). Verified per V3-D339 i18n rule.

---

## Structure decision (§10.5 dual-axis conflict resolution)

Fresha has NO equivalent `/coiffeur` standalone landing route — they use search results pages. STRUCTURE source = Solen precedent (the 6 routes already exist with shape `[SearchTemplate] + [AboveGrid] + [BelowGrid]`). This hero is ADDED ABOVE SearchTemplate.

The existing SearchTemplate `hero` prop is preserved unchanged (still renders its `{ title: "Coiffeur in Basel" }` sub-header below). This means each route now has TWO header zones:
1. CategoryHero (editorial, this component)
2. SearchTemplate internal hero (operational: "X Salons gefunden")

If visual stack is too heavy AM, the cleanup is to either remove the SearchTemplate hero prop OR drop CategoryHero from a route. Reversible with `git checkout`.

---

## Use for / Don't reuse for

**Use:** the 6 category landing routes only.

**Don't reuse for:**
- `/search` results pages (they have their own SearchTemplate hero, not a category)
- Salon detail pages (`/salon/[slug]` uses SalonHero — different pattern entirely)
- Other Solen-originals (`/entdecken`, `/loyalty`, `/referral` — route-specific patterns)
- B2B marketing pages (`/fuer-salons`, `/warum-solen` — those have BentoBusiness / SignatureLockup heroes)
