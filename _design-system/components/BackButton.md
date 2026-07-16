# BackButton: the ONE back affordance (CONTRADICTIONS.md §4, 2026-06-08)

**File:** `app/[locale]/_components/primitives/BackButton.tsx`
**Layer:** 1 (chrome). Variant follows **CONTROL_ELEVATION (V3-D420)**: elevation is earned by the background, not the button.

## Why this exists
The frosted `ArrowLeft` back button was hand-rolled per surface **4×** (`SalonHero`, `SalonStickyTabNav`, `BookingWizard`, `Breadcrumb`). This collapses them to one, and the glass variant shares the canonical `FROST_GLASS` recipe so there's a single over-photo treatment. **Do NOT hand-roll another frosted back button.**

## Two variants (CONTROL_ELEVATION)
- **`variant="glass"`**: sits OVER a photo (hero, gallery). Frosted white via shared `FROST_GLASS` (`lib/frost-glass.ts`), applied as inline `style`.
- **`variant="flat"`** (default): on calm white/stone chrome. `border-s-border bg-white`, sinks to `bg-s-bg-sunken` on hover, **no shadow** (white+shadow on a calm surface is the banned "grey-haze" drift).

Both: 40×40 round, centred 18px `ArrowLeft` (`strokeWidth 2.2`, `text-s-ink`), `active:scale-[0.96]`, `transition-[transform,background-color] duration-150`.

**Open question, flagged 2026-07-12 (A3 registry audit finding 2c):** this ships at 40px (`h-10 w-10`), under the locked 44px touch-target floor (design contract: "icon-button `h-11 w-11`" / "touch target ≥ 44px"). Registry + this doc + the code all agree with each other at 40px, but all three disagree with the LOCKFILE floor. Not silently changed here: flagged as an open owner question (bump to 44px, or add a named exception like `SelectedCheckBadge`/`HeartButton`'s 32px save variant).

## API (props)
`variant?: "glass" | "flat"` (default `flat`) · `label?: string` (accessible label → `aria-label`; defaults German "Zurück": pass your i18n string) · plus all native `<button>` attributes (`onClick`, `type` overridden to `"button"`, etc.) via `React.ButtonHTMLAttributes`. `forwardRef` to the `<button>`. `className` composes (cn).

## Use for
The back affordance on any surface: photo hero / gallery (`glass`), sticky tab nav / breadcrumb / wizard / calm chrome (`flat`).

## Don't reuse for
A generic icon-only action button (use the flat icon-button recipe directly, or a purpose-named control). A close/dismiss "X" (that's a different glyph + a different affordance). Forward/next navigation: single-purpose back glyph.

## Status
new, 2026-06-08, not yet migrated into call-sites.
