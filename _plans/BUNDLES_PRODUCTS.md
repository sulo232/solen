# Bundles + Products (A5) , owner scope: A AND B (2026-07-03) , PLAN v2 (council-amended)

> Decision trail: research -> /dev/bundles-products mockup -> owner "make a and b" (B = sanctioned un-kill, REMOVED.md line + memory updated). Council wf_988cb592 (4 lenses, 2026-07-03) returned 6 BLOCKERS + 10 SHOULD_FIX , ALL folded in below. v1 scope: pickup-only products, quantity 1 per SKU per purchase, no memberships, no free-pricing bundles, PDP sections only (search-card surface explicitly out, mockup said so).
> Binding rules: additive idempotent migrations ONLY (apply_migration MCP; NEVER assume repo migrations match live , this table has proven drift); prove behavior not existence (curl/SQL every predicate + RLS path); UNITS ARE PER-TABLE, see the currency table below; i18n de/en/fr/it; SENIOR_SCORECARD + design-verifier on customer surfaces; frontend after the R4 coder (serialization).

## CURRENCY UNITS (council blocker , do not mix)
| column | unit |
|---|---|
| services.price | numeric(8,2) CHF DECIMAL (proof: 014_new_schema.sql:160; bookings route rounds to 2dp; lib/stripe.ts multiplies *100 only at the Stripe boundary) |
| nail_retail_products.price, retail_purchases.paid_amount, service_packages.price | INTEGER RAPPEN (fed to Stripe with no *100) |
| service_bundles.custom_price (NEW) | numeric(8,2) CHF DECIMAL , matches services.price, which it sums/discounts. Convert *100 ONLY at the Stripe boundary. |
LATENT BUG (separate, added to ACTIVE.md): staff_services.price_override INTEGER vs services.price numeric mixed at bookings route ~:259 , verify unit + fix independently of this plan.

## Ground truth (live snapshot 2026-06-30 + council verification)
- nail_retail_products (5 rows): cols verified; category CHECK is nail-only IN MIGRATION 072 but the LIVE constraint is UNKNOWN (stock_count/low_stock_threshold exist live with no migration = out-of-band drift). PROBE BEFORE MIGRATING.
- retail_purchases (0 rows): Stripe path BUILT + orphaned. Server-authoritative pricing verified SAFE by council (client sends only ids; totals computed from DB; transfer routed by salon's own stripe_account_id). Webhook writes vat_amount/net_amount/vat_rate , columns ABSENT from the 2026-06-30 snapshot: PROBE live; if missing, add in A-1.
- retail_sales (11 stray rows): phantom/drift, nothing writes it. inventory, discovery_products: dead.
- service_packages/package_purchases: SESSION-PACKS, legacy, refund plumbing intact. NOT the bundle shape.
- waxing_zone_packages (0 rows, RLS on): council catch , exists-check hit under "package". RECONCILED: it is a ZONES-ARRAY single-category discount table (name + zones text[] + discount_percent) from the removed waxing feature , NOT a multi-service bundle (no service references, no pricing modes). Unsuitable to repurpose. DECISION: leave as inert DB debris for now; DROP it in a later cleanup migration + graveyard line (do not block A5 on it).
- bookings.group_booking_id EXISTS but is the multi-PERSON group feature , bundles do NOT reuse it; bundles extend the single-customer extras path.
- bookings.service_id is NOT NULL -> a bundle booking rides service_id (primary) + extra_service_ids, bundle_id is a nullable tag. Verified additive-safe.
- BOOKING TIME MODEL (council blocker , the B-4 premise in v1 of this plan was STALE): extras fold into PRICE ONLY; ends_at = the primary slot's end (bookings route never extends duration; BUG_HUNT.md verified this is BY DESIGN for add-ons, NOT an open bug). So bundle DURATION SUMMING IS NET-NEW WORK, not a bug fix.

## Phase A , PRODUCTS
- [ ] A-0 PROBES (before any migration; MCP execute_sql): (1) `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.nail_retail_products'::regclass AND contype='c'`; (2) `SELECT DISTINCT category FROM nail_retail_products`; (3) `SELECT column_name FROM information_schema.columns WHERE table_name='retail_purchases'`; then refresh _db-columns/_db-snapshot + `npm run inventory`.
- [ ] A-1 MIGRATION (additive, written against PROBED reality): widen the category CHECK as a strict UNION (all live values + hair_care, styling, skin_care, nails, tools, other) via `DROP CONSTRAINT IF EXISTS <probed conname>` + ADD; add retail_purchases vat columns IF the probe shows them missing. Keep table name (zero data risk); general endpoints just use it.
- [ ] A-2 API: general product read for a salon (verify /api/salon/retail GET is not nail-gated). De-gate = REMOVE checkFeatureEnabled("nail_features") from the RETAIL handlers ONLY (enumerated call sites) , NEVER flip the global flag (~14 unrelated nail endpoints hang off it). Add the council guard: if products.length !== product_ids.length -> 400 (never silently charge a subset). Curl-prove purchase end-to-end in Stripe test mode (row flips pending->paid with paid_amount set).
- [ ] A-3 PDP customer UI (approved grammar): "Products" section , rows (photo, name, size, CHF via formatCurrency from Rappen), neutral-outline "Add", pick-up-at-visit note, purchase via the built path. i18n x4.
- [ ] A-4 dashboard: generalize RetailManager out of nail-admin (same de-gate rule as A-2).
- [ ] A-5 stock (NET-NEW, council-hardened): decrement in the WEBHOOK with an atomic guarded UPDATE (`SET stock_count = stock_count - 1 WHERE id=? AND stock_count >= 1`, check rowCount), idempotent off the pending->paid transition; RE-INCREMENT on refund; v1 quantity = 1 per SKU per purchase. DELETE the orphaned /api/nail/retail/checkout (a second Stripe-bypassing stock-mutating path; graveyard line on deletion).
- [ ] A-6 DECIDED (council): the sales dashboard swaps to READ retail_purchases (unnest product_ids per row, unit price re-read at render); NOTHING writes retail_sales; no third table.

## Phase B , BUNDLES
- [ ] B-1 MIGRATION (additive): `service_bundles` (id uuid pk, salon_id fk, name text, pricing_mode text CHECK IN ('sum','custom','percent') , 'free' EXPLICITLY OUT for v1, custom_price numeric(8,2) null, percent_off smallint null CHECK (percent_off IS NULL OR percent_off BETWEEN 1 AND 99), is_active bool default false, sort_order int, created_at) + `service_bundle_items` (bundle_id fk cascade, service_id fk cascade, sort_order, PK(bundle_id, service_id)).
  RLS (council-corrected, do NOT copy services verbatim): service_bundles SELECT = `is_active = true AND salon_id IN (SELECT id FROM salons WHERE <the exact visibility predicate the public salon query uses: listed_on_marketplace IS NOT FALSE AND is_active AND NOT is_test , confirm from code>)`; manage = owner via salons.owner_id. service_bundle_items gets ITS OWN policies (child-join pattern from 034_service_addons.sql): SELECT joined through a visible parent bundle; manage joined through owner.
  \>=2-items: DB trigger gates is_active=true (or app-side gate) AND every read/price path treats <2 items as unbookable , never a 0 CHF bundle.
- [ ] B-2 dashboard: bundle builder (pick >=2 services, pricing mode, live preview struck-sum + bundle price + pale-green -X% pill).
- [ ] B-3 PDP customer UI (approved grammar): "Bundles" section , included service rows (name + duration), struck summed price (s-ink-3), bold bundle price, -X% pill. Price computed at read from live services.price (CHF decimal), never denormalized.
- [ ] B-4 booking integration (RE-SCOPED, both council blockers):
  - (a) DURATION (net-new): bundle booking must reserve the SUMMED duration of its services (incl. buffer_minutes) , extend the booking write so ends_at = slot start + total bundle duration (today extras never extend time, by design). Availability check must use the summed duration when a bundle is selected.
  - (b) PRICE (net-new): the server IGNORES client totals and recomputes from services , so extend createBookingSchema + /api/bookings/route.ts to accept bundle_id, load the bundle server-side, VERIFY items match the selected services, compute price from pricing_mode; mirror the same bundle-aware recompute in /api/stripe/booking-pay-intent BEFORE promo/member discounts. Never trust a client-sent bundle price.
- [ ] B-5 bookings write: additive `bookings.bundle_id uuid null` fk; confirmation + dashboard show the bundle name.
- [ ] B-6 refunds: bundle bookings refund via the EXISTING booking refund path (they are bookings, not prepaid packs).

## Sequencing (DAG fixed per council)
1. [x] Council review (wf_988cb592) -> this v2.
2. A-0 probes -> A-1 + B-1 migrations (apply_migration MCP) -> snapshot refresh + `npm run inventory`.
3. Backend: A-2 de-gate + guard + curl proofs; B-4a/B-4b server logic + SQL/curl proofs (bundle price + duration correctness, RLS probes incl. a hidden-salon leak test). Backend may run while the R4 frontend coder finishes.
4. Frontend (AFTER R4 lands): A-3 PDP products, A-4 dashboard retail, B-2 builder, B-3 PDP bundles. Coder-built, SENIOR_SCORECARD + design-verifier per surface.
5. E2E on the test salon: seed 3 products + 1 bundle; buy a product (Stripe test; stock decrements once, idempotent); book a bundle (price = bundle price, ends_at = summed duration, both slots blocked); refund re-increments stock.

## Parked / out of v1
- Delivery shipping; memberships/recurring; product size-variants; multi-quantity carts; 'free' pricing mode; bundles on search cards (mockup explicitly excluded , new ask if wanted).
- waxing_zone_packages DROP cleanup migration + graveyard line (do with the next housekeeping migration).
- Latent bugs handed to the bug-hunt loop: staff_services.price_override unit mismatch; retail_purchases VAT columns vs snapshot.
