# Earthen Wellness — beta palette concept

> **Status:** BETA — NOT LIVE. Preserved as a future palette option.
> **Date saved:** 2026-05-09
> **Why beta:** user reaction was "looks better but a bit too dark" —
> needs a lighter / brighter iteration before it could replace the
> current locked V3 dark-teal palette (V2-D15-3).

This file is **not part of the principal spec** (`_tasks/SOLEN_LIVE_TRUTH.md`).
It's a parked concept to revisit if/when V3 dark-teal feels wrong or if a
brand pivot is on the table. V2-D33 doc-consolidation rule still applies:
this doc does not compete with LIVE_TRUTH; it's an alternative to consider
swapping LIVE_TRUTH §1-§2 with, in a future V2-D## decision.

---

## Visual reference

Static mockup: [`public/solen-v2-color-psychology.html`](../../public/solen-v2-color-psychology.html)
(open via `npx serve public -p 4747` then `localhost:4747/solen-v2-color-psychology.html`,
or directly at `localhost:3000/solen-v2-color-psychology.html` while `npm run dev` runs).

Mockup shows:
- 6-swatch palette legend with per-color psychology rationale
- Phone-width homepage rendering (Solen logo + hero + search + 4 cat cards + B2B panel)
- Earthen atmosphere wash (no teal/ice-blue)
- Re-mapped cat colorways using the new palette

---

## Palette tokens

| Role | Token name | Hex | Psychology rationale |
|---|---|---|---|
| Primary brand | `--moss` | `#2D3F33` | Grounded, trustworthy, natural. Forest canopy not hospital corridor — replaces dark-teal `#043338`. Carries "serious booking platform" cue without coldness. |
| Heartbeat / accent | `--terracotta` | `#C97A57` | Warmth, intimacy, beauty industry alignment. Earthen instead of pop-coral so it invites rather than screams. Used for CTAs + highlight words ("schneller **buchen**"). |
| Page background | `--cream` | `#F5EBDD` | Open, low-stress, soft. Off-white reduces eye-strain vs pure white during prolonged browsing. Replaces "white + cold teal wash" with a warm neutral. |
| Wellness accent | `--sage` | `#A8B89A` | Calm, wellness, natural premium. Aesop / Necessaire / Glossier-Beyond use sage as their "we're good for you" cue. Whispered in bg, never loud. |
| Alt surface | `--bone` | `#E8DDC9` | Differentiates cards from cream bg without harsh contrast. |
| Ink (text) | `--ink` | `#2A1F18` | Warm charcoal — pure black fights with the warm bg. Same readability, softer feel. |

**Tints / mid-tones available in mockup CSS:**
- `--moss-mid: #3F5847` — softer moss for hover / secondary surfaces
- `--moss-pale: #C8D4C9` — very pale moss for atmosphere wash blobs
- `--terra-soft: #E8B89B` — light terracotta for badges/pills needing warmth without saturation
- `--terra-deep: #8E4A2D` — darker terracotta for ink accents / category letters
- `--cream-warm: #FAF2E5` — slightly warmer cream variant (Coiffeur cat)
- `--sage-pale: #D4DDC8` — pale sage for Nails cat bg
- `--ink-2: #5C4A3A` — secondary text
- `--ink-3: #8A7A68` — tertiary text / placeholders

---

## Cat colorway re-mappings (4 categories)

| Cat | Photo bg | Letter color | Replaces V3 combo |
|---|---|---|---|
| Coiffeur | `--cream-warm` `#FAF2E5` | `--terracotta` `#C97A57` | Combo Z (cream + cherry) |
| Barbershop | `--bone` `#E8DDC9` | `--ink` `#2A1F18` | Combo G (bone + black) |
| Nails | `--sage-pale` `#D4DDC8` | `--terra-deep` `#8E4A2D` | Combo A (ice + magenta) |
| Spa & Wellness | `--moss` `#2D3F33` | `--cream` `#F5EBDD` | Combo I (forest + sandy beige) |

The earthen mapping is more "tonal cohesion" (everything belongs to the same warm-earth family) vs V3's "deliberate contrast" (each combo is a strong color pair). Trade-off: less visual energy per card, more brand cohesion across the feed.

---

## Why this beats V3 (kept for revisit)

1. **Less category-stereotype.** Dark-teal-on-pale-blue is what every booking app does (Booksy, Fresha tendencies). Earth + sage + terracotta is distinctive in DACH market.
2. **Psychologically warmer.** Terracotta CTA reads as "treat yourself"; V3 dark-teal reads as "checkout button on a banking app".
3. **Wellness-aligned.** Sage + cream + moss is the visual language of premium-natural beauty (Aesop, Tata Harper, Necessaire). Solen positions as "the trusted way to find beauty" — palette delivers that emotionally.
4. **Gender-neutral.** Warm earth doesn't lean masculine (deep navy) or feminine (millennial pink). Coiffeur, barber, nails, spa — all fit comfortably.
5. **Photo-friendly.** Salon photos (replacing placeholder letters in production) photograph richer against cream/bone than against pale teal.
6. **Same brand discipline.** 5 tokens + 2 tints. Same "1 saturated accent ≤10%" rule (terracotta is the accent), same dot-cue, same Peace Sans + Open Sauce One typography (V2-D42 stays).

---

## Why it's beta (user feedback)

- "Looks better but a bit too dark" (2026-05-09).
- Mockup as built leans heavier than ideal — moss is a deep value, terracotta is mid-saturation, ink is dark.
- For a public-facing marketplace homepage, the **average lightness** of the page surface should be higher (~85%+ of the visible viewport should be light tones). Current Earthen Wellness has the cream bg lightening it but the moss panels + terracotta accents pull average lightness down.

---

## Required tuning before promotion to live

If this palette gets reconsidered, these adjustments would address the "too dark" feedback:

1. **Lighten primary brand.** `--moss #2D3F33` → either:
   - Soft-moss `#5C7765` (lighter, warmer, less heavy)
   - Or keep dark moss but use sparingly (only on Spa cat panel + headers, not as full B2B panel bg)

2. **Drop the dark moss B2B panel** in favor of a cream panel with terracotta + sage accents. Dark panels read editorial-magazine; cream panels read marketplace-home. (See LUMIÈRE adaptation pattern in `_tasks/V2_REBUILD_LOG.md` V2-D46 — same story, different palette.)

3. **Raise atmosphere wash lightness.** Current alphas (0.30-0.55 range) on saturated earth tones still cumulatively darken the page. Drop to 0.15-0.30.

4. **Optional: introduce an actual lighter tone like buttery yellow `#F2D77B`** as a secondary accent next to terracotta — adds brightness without breaking earth-tone family.

5. **Test photo legibility.** Salon photos against cream + ink readability vs cream + terracotta caption — verify no contrast failure (WCAG AA minimum).

---

## How to revisit this concept

1. Read this file + open the visual mockup
2. Decide if the "too dark" feedback can be addressed via the tuning items above
3. If yes, build a new mockup `public/solen-v2-earthen-wellness-light.html` with the lightened values
4. If user approves the lighter version, log a V2-D## entry overriding the V3 dark-teal palette (parallel to V2-D15-3 brand pivot but in earthen direction)
5. Patch tokens in `tailwind.config.js`, body wash in `app/globals.css`, blobs in `app/[locale]/_components/homepage/AtmosphereBlobs.tsx`, and update the LIVE_TRUTH §1 brand + §2 categories sections

**Estimated effort:** ~1-2 hours for full token + atmosphere migration once palette values are locked.

---

## Out of scope for this beta

- Typography (Peace Sans + Open Sauce One stay — V2-D42)
- Layout / structure (FeedZone rising panel, atmosphere blobs structure, grain — all stay)
- Component anatomy (cards, headers, search bar) — colors swap, structure unchanged
- B2B / consumer voice (copy unchanged)
