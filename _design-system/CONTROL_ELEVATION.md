# Control elevation & emphasis: when white-elevated vs flat vs ink

**V3-D420 (2026-06-01).** Council-ratified (3 lenses: Uber-fidelity, Solen-brand, affordance/a11y, unanimous).
Researched against 6 real Uber Eats iOS screens (Mobbin). Companion to LOCKFILE §3 (shadow tokens) +
SOURCE §14 (color decision tree). **Read before styling any add-button, quantity stepper, or action pill.**

---

## THE PHILOSOPHY (one line)

> **Elevation is earned by the background, not by the button.** A control wears white + shadow ONLY when it
> sits on a photo it must stay legible over; on Solen's flat white/stone chrome, emphasis comes from FILL,
> quiet controls go soft-grey (text) or bordered-white (icon), the single primary goes ink, and shadow is
> reserved for that one ink lift and for glass-over-photo. **White-elevated-on-white is not a third button; it's noise.**

### Why (so we don't cargo-cult the look)
Uber Eats is ~60% photography; every control floats over unpredictable pixels, so elevation does real
**legibility** work (a white pad manufactures a guaranteed local-contrast field). Solen is the inverse: B&W
chrome on white, photos confined to ~4 framed slots. Porting "elevation everywhere" onto white chrome makes
shadows accumulate as grey haze, inverts hierarchy (if everything lifts, the one primary can't be found), and
adds a 4th visual dialect the LOCKFILE exists to prevent. **The look the user likes (A) comes from the photo
contrast, not the shadow, so keep A unmistakably the over-photo treatment, and let calm surfaces stay flat.**

---

## THE DECISION TREE (first match wins)

**Q1: Is it THE one primary commit action of the region?** (pay / confirm / book)
→ **(C) INK-FILLED** `bg-s-ink text-white`, `rounded-btn`/pill. Max ONE per region (CTA lock). Fill, not
  elevation, encodes "the destination." Ink CTAs MAY carry `shadow-elevation-2` (the one deliberate lift).

**Q2: Does the control sit OVER a photo / image / non-flat surface?** (hero, gallery, Entdecken thumb, lightbox)
→ **(A) ELEVATED WHITE GLASS.** Use the canonical `FROST_GLASS` recipe (frosted white `rgba(255,255,255,.80)`
  + `blur(4px)` + 1px white inner border + soft shadow), already in `SalonHero.tsx`. Over a *light* photo,
  bump to `shadow-elevation-2` (elevation-1 under-reads on small circles). This is the ONLY place A is allowed.

**Q3: Calm control on a flat white / `s-bg-sunken` surface** (steppers, secondary pills, the `(i)`, filters)
→ **(B) FLAT**, split by whether text carries the affordance:
  - **Text control** (Anstehen, Buchen, TabPill) → `bg-s-bg-sunken` fill, ink text, **no shadow**. Hover deepens
    fill to `bg-s-border` (never adds a shadow). The text carries legibility, so the low-contrast fill is fine.
  - **Icon-only / shape control** (a "+", a stepper end-cap) → `bg-white border border-s-border` (bordered-white),
    OR live inside a bordered/elevated shell. **NEVER borderless `bg-s-bg-sunken` on white** (see contrast trap).
  - Inline `−/+` over a no-image add-on row → bare **ink glyph** (Uber's inline circles); ink does the contrast
    job on plain white. Lightest possible.

**(D) hybrid, REJECTED as a resting treatment.** Fill + shadow + border = three separation mechanisms doing one
job. The only legit "hybrid moment" is a **pressed state**: an elevated control swaps shadow → inset on `:active`.

**Compressed:** `primary → C (ink)` · `over imagery → A (frosted white)` · `calm → B (flat: text=soft-grey, icon=bordered-white)`.

---

## HARD RULES (a11y + tokens)

1. **Contrast trap, the big one.** `s-bg-sunken #F5F5F4` on white `#FFFFFF` is **~1.03:1**, an invisible edge,
   AND it's already the codebase's "inert/placeholder" signal (avatars, disabled). So a borderless grey *icon/shape*
   control on white reads as dead. Any control whose boundary is the affordance must clear **≥3:1** (WCAG 1.4.11)
   → border it (`border-s-border`) or shell it. Text controls are exempt (text carries it).
2. **Tap target ≥ 44×44.** Visible glyph circle may be 32-40px, but the hit area is ≥44px (HeartButton 44-hit/32-visible).
3. **Shadow lives in exactly two places:** the one ink primary, and glass-over-photo. Zero box-shadow on any control
   resting on white or `s-bg-sunken`. (Drift-check candidate: `bg-white` + `shadow-*` NOT over an image/hero/modal.)
4. **Stepper state:** qty 1 shows a **trash** glyph; qty ≥2 shows **−**. Same chrome, swap glyph + `aria-label` only.
   Quantity numeral = `tabular-nums text-s-ink` (calm, not bold). Disabled `−/+` at min/max = `text-s-ink-3 opacity-30`.
5. **No blue.** These controls never use `s-accent` as a resting fill; accent appears only on `:focus-visible` (ring).

---

## AUDIT + SWEEP LOG (V3-D420, swept 2026-06-01)

Verified against the codebase by an inventory agent. ✅ = fixed this pass · ✓ = already correct · ⏸️ = deferred.

| Component | Was | Verdict | Action |
|---|---|---|---|
| `SalonHero` back/share/heart | frosted glass over photo | ✓ correct (A) | promoted recipe to `lib/frost-glass.ts` |
| `SalonWalkInPanel` `(i)` button | `bg-white shadow-[…]` on a sunken strip | ❌ degraded-A | ✅ flat bare-glyph (B) |
| `TabPill` inactive (registered primitive) | `hover:shadow-[…]` lift on white | ❌ lift on calm | ✅ flat hover (text+border deepen), propagates app-wide |
| `Header` mobile hamburger | `bg-white shadow-[0_6px_18px…]` on frosted bar | ❌ heavy shadow on white | ✅ bare icon (matches sibling bell) |
| `CardFilterRow` filter pill | `shadow-elevation-1` resting on white (both states) | ❌ resting shadow | ✅ dropped (kept border) |
| `FeaturedSalonCarousel` arrows | `hover:shadow-elevation-1` on white | ❌ hover lift | ✅ `hover:bg-s-bg-sunken` (flat) |
| `CityTopBar` city picker | `shadow-[0_1px_2px…]` resting on white | ❌ resting shadow | ✅ dropped (kept border + hover translate) |
| `FeaturedStylists` SaveHeart | verbatim FROST_GLASS re-derive over photo | ⚠️ ad-hoc A | ✅ repointed to shared `FROST_GLASS` |
| `Anstehen` / `Buchen` text pills | flat `bg-s-bg-sunken` + text | ✓ correct (B-text) | keep |
| `WalkInPaymentForm` pay CTA | `bg-s-ink text-white` | ✓ correct (C) | keep |
| `SalonServicesSheet` / `ToggleCircle` add-toggles | bordered-white ↔ ink-fill, no shadow | ✓ already compliant | follow-up: unify as `IconToggleButton` |
| `BentoBusiness` white+shadow (`:485`/`:591`) | white-fill on a `bg-s-ink` surface | ✓ correct INVERSE-primary (first audit was wrong) | keep |
| `MarketplaceVisual` faux-card (`:55`/`:60`) | decorative `aria-hidden` mimic | ✓ surface, not a control | keep |
| discovery `VideoCard` / `ItemCard` circles | ad-hoc frosted-A over photo | ⏸️ DEFERRED (user excluded discovery) | adopt `FROST_GLASS` in a later pass |

**Enforcement (new this pass):** drift-checker rule **A14** flags `rounded-full/btn/pill` + `bg-white` + `shadow-*` not-over-image (INFO, heuristic). The scanner now also covers `components-legacy/**` (was `app/**`-only, so it had been blind to most shared components).

**Structural root (still open):** there is no shared `QuantityStepper` primitive, BUT the inventory found ZERO quantity-stepper callsites in the app (you add a service once, you don't buy N of it), so building one now would be dead code. The live add-control is the already-compliant toggle (`SalonServicesSheet` / `ToggleCircle`); its only real debt is duplication, fixable as an `IconToggleButton` primitive. `QuantityStepper` stays a documented spec (the mockup) until a multi-quantity surface needs it.

**Dashboard (`/dashboard/*`) is EXEMPT:** it has its own vibrant skin (LOCKFILE §12). **Discovery (`components-legacy/discovery/**`) is DEFERRED, not exempt:** the rule applies, the user just excluded it from this sweep.
