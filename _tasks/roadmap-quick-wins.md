# R15: Quick Wins & Platform Polish

## Context
Implementation of four quick-win features to improve UX and data accuracy on Solen.ch:
1. Data-driven dynamic pricing indicators on salon cards.
2. "Similar Salons" section on the salon detail page.
3. Loading skeletons for all card grids to prevent layout shift.
4. Consistent, premium hover states across all interactive elements.

## ⚠️ BEHAVIOR RULES (MANDATORY)
1. **NO GLOBAL OPACITY FADES**: Do not add `opacity-50` or `transition-opacity` on hover. Use the premium design system tokens (`hover:brightness-[1.06]`, `shadow-card-hover`).
2. **NO HARDCODED BADGES**: The pricing indicator must pull from the database.
3. **NO UI_RULES VIOLATIONS**: Ensure all spacing uses the 8pt grid (`gap-4`, `gap-6`) and all borders use standard tokens (`rounded-card`, `rounded-pill`).

## Phases

### Phase 1: Database Migration (Pricing Rules)
- Create a new migration file `supabase/migrations/XXX_pricing_rules.sql` (use the next available number).
- Create table `pricing_rules`:
  - `id` (uuid, pk)
  - `salon_id` (uuid, fk to salons)
  - `rule_type` (text) - e.g., 'weekend_surcharge', 'last_minute_discount'
  - `day_of_week` (int) - 0-6 (Sunday-Saturday)
  - `modifier_type` (text) - 'fixed_chf', 'percentage'
  - `modifier_value` (numeric)
  - `is_active` (boolean)
- Enable RLS: Public read, owners manage their own rules.
- Update `lib/types.ts` to include the `PricingRule` interface.
- Add `pricing_rules` to `_rules/DB_SCHEMA.md`.

### Phase 2: Loading Skeletons & Suspense Boundaries
- Identify all instances of dynamic salon grids (e.g., Homepage, Discover, Search).
- Implement Next.js `loading.tsx` or React `<Suspense fallback={<SalonGridSkeleton />}>` wrappers.
- Use the existing `<Skeleton variant="card" />` component to build a perfect visual match of the cards (preventing layout shift).

### Phase 3: Dynamic Pricing Indicators
- Update `<SalonCard />` (and any related card components) to accept a `pricingRule` or `surcharge` prop.
- If a weekend surcharge applies, display a badge: `+CHF 10 Wochenend-Aufschlag`.
- Use `formatCurrency()` from `lib/format-currency.ts`.
- Style the badge using `bg-s-yellow-subtle text-s-yellow-text` or `bg-s-coral-subtle text-s-coral-text`. **No raw tailwind colors.**

### Phase 4: "Similar Salons" Section
- Create a new component `components/salon/SimilarSalons.tsx`.
- Fetch logic: `SELECT * FROM salons WHERE quartier = $quartier AND category = $category AND id != $current_id AND is_active = true ORDER BY solen_score DESC LIMIT 3`.
- Render a grid of 3 `<SalonCard />` components.
- Place this component at the bottom of the salon detail page (`app/[locale]/salon/[slug]/page.tsx`). Ensure it is separated by standard spacing (`py-12` or `py-16`).

### Phase 5: Global Hover States Audit & Fix
- Audit the codebase (`components/` and `app/`) for clickable elements missing hover states.
- For Cards: Add `hover:-translate-y-[5px] hover:shadow-card-hover transition-all duration-[250ms]`.
- For CTAs/Buttons: Ensure they use `<InteractiveHoverButton>` or `hover:brightness-[1.06] shadow-warm-sm`.
- **DO NOT** apply `opacity` fades as a hover state. Only use elevation (shadows/translate) or brightness.

### Phase 6: Rule Documentation Updates
- Update `CLAUDE.md` and `_rules/UI_RULES.md` to prevent these omissions in the future:
  1. Add rule: "All data-fetching grids must implement a `loading.tsx` or Suspense fallback using `<Skeleton variant="card" />`. No blank white screens during data fetch."
  2. Add rule: "All pricing indicators and badges must be data-driven and correctly formatted using `formatCurrency()`. Never hardcode static price modifiers like '+CHF 10'."
