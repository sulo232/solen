<!-- exists-check: net-new vs SalonReviews.tsx, pdp/reviews-directions/page.tsx because
     both are salon-review UI, not a scaffold README for this comparison harness. -->

# directions-0905 shared scaffold

Building a surface? Create `../<surface>/page.tsx` (e.g. `../confirmation/page.tsx`).

1. Read `?v=` from `searchParams` (`a` | `b` | `c`, default `a`).
2. Wrap your rendered screen in `<DirectionFrame surface="<surface>" directions={[...]} active={v}>`.
3. Get real data from `seedSalon.ts` (`getSeedSalon(locale)`) or `seedBooking.ts`
   (`getSeedBooking(locale)`). Never fabricate a salon, booking, price or review.
4. Never edit `DirectionFrame.tsx`, `seedSalon.ts`, `seedBooking.ts` or `VariantSwitcher.tsx`.
   They are shared across every surface; a change here breaks someone else's page.
5. Copy is English only, no em-dashes.
6. Each direction must be a genuinely different structure or strategy, not a paint swap.
