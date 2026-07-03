# Bundles + Products (A5) , owner scope: A AND B (2026-07-03)

> Decision trail: research (Fresha model + Solen backend audit, 2026-07-03) -> /dev/bundles-products decision mockup -> owner: "for A5 make a and b". B is a SANCTIONED un-kill of the 2026-06-11 packages removal (REMOVED.md UN-KILLED line + memory updated). C (variants + add-ons) already ships in booking , untouched.
> Rules that bind this build: additive idempotent migrations ONLY (apply_migration MCP, never db push/reset); prove behavior not existence (curl every new predicate/RLS path); reuse before build (rule 12); prices in Rappen ints + formatCurrency; i18n de/en/fr/it; approved mockup grammar = /dev/bundles-products; SENIOR_SCORECARD on customer surfaces; frontend work serialized after the R4 coder.

## Ground truth (from the 2026-07-03 backend audit , verified live snapshot)
- `nail_retail_products` (5 rows): salon_id, name, description, price, image_url, category CHECK (nail-only list), is_active, stock_count, low_stock_threshold. Dashboard CRUD wired (/api/nail/retail + RetailManager) behind the `nail_features` flag (DISABLED).
- `retail_purchases` (0 rows): full Stripe money-path BUILT and orphaned , /api/salon/retail (GET), /api/salon/retail/purchase (creates PI, inserts pending), webhook purchase-handler settles, refund via lib/purchases CAS. NO customer UI anywhere.
- `retail_sales` (11 rows): schema-drift table, NOTHING writes it; the nail sales dashboard reads it (always-empty KPIs). `inventory`, `discovery_products` = dead.
- `service_packages`/`package_purchases` = SESSION-PACKS (ONE service x N sessions) , wrong shape for Fresha bundles; stay legacy (refund plumbing intact).
- `service_options` (variants) + `service_addons` = LIVE in booking (ServicesStaffStep). Bundles must not duplicate them.
- Fresha bundle mechanics (researched): >= 2 services, pricing modes sum/custom/percent-off/free, booked as one appointment group (sequence; parallel later), price changes not retroactive.

## Phase A , PRODUCTS (retail on the store page)
- [ ] A-1 backend generalize (MIGRATION, additive): widen products to all salons. DEFAULT direction: keep `nail_retail_products` as the physical table (zero data risk), ALTER the category CHECK to a general list (hair_care, styling, skin_care, nails, tools, other; keep old values valid), and expose a general-name VIEW or just use the table as-is from general endpoints. COUNCIL: sanity-check vs a fresh `retail_products` table + 5-row copy.
- [ ] A-2 API: general read endpoint for a salon's products (the built /api/salon/retail GET may already do this , verify it is NOT nail-gated; de-gate from `nail_features` where needed). Purchase path: reuse /api/salon/retail/purchase + webhook AS-IS (it is built); curl-prove end-to-end in Stripe test mode.
- [ ] A-3 PDP customer UI (approved mockup grammar): "Products" section on the salon page , product rows (photo square, name, size/desc, CHF, neutral-outline "Add"), pick-up-at-your-visit note, cart -> the built purchase path. i18n keys de/en/fr/it.
- [ ] A-4 dashboard: generalize RetailManager out of nail-admin into the general dashboard (products CRUD + stock). De-gate from nail_features for the general case.
- [ ] A-5 stock: decrement on paid purchase (webhook), low-stock badge in dashboard. The orphaned /api/nail/retail/checkout route: fold or delete (graveyard line if deleted).
- [ ] A-6 retail_sales: either write it on settle (so the sales dashboard stops lying) or swap the dashboard to read retail_purchases. COUNCIL pick. No third table.

## Phase B , BUNDLES (Fresha-style, NET-NEW shape)
- [ ] B-1 backend (MIGRATION, additive): `service_bundles` (id uuid, salon_id fk, name text, pricing_mode check sum|custom|percent, custom_price int null, percent_off smallint null, is_active bool, sort_order int, created_at) + `service_bundle_items` (bundle_id fk cascade, service_id fk cascade, sort_order, PK(bundle_id, service_id), CHECK >= 2 items enforced app-side). RLS mirroring services (public read where salon is customer-visible; salon manage own). Computed price = sum of item service prices with mode applied , computed at read/booking time, never denormalized (no retroactive drift).
- [ ] B-2 dashboard: bundle builder in the services area , pick >= 2 services, pricing mode, live preview of struck sum + bundle price + the pale-green -X% pill (approved grammar).
- [ ] B-3 PDP customer UI (approved mockup): "Bundles" section , bundle card with included service rows (name + duration), struck summed price (s-ink-3), bold bundle price, pale-green -X% pill.
- [ ] B-4 booking integration: choosing a bundle = its services enter the EXISTING multi-service booking selection as one group with the bundle price override; duration = existing multi-service math (incl. buffers); slots/staff = existing path. DEPENDENCY: the known multi-service slot-locking bug (ACTIVE.md FIX-careful: only the primary service slot locks) must be fixed BEFORE bundles ship, or bundles inherit double-booking. Sequence it first.
- [ ] B-5 bookings write: additive column `bookings.bundle_id uuid null` (+ price already per-booking); confirmation + dashboard show the bundle name. No schema rewrite.
- [ ] B-6 refunds: bundle bookings refund via the EXISTING booking refund path (they are bookings, not prepaid packs). Explicitly NOT reusing package_purchases.

## Sequencing
1. COUNCIL review of THIS plan (dedup vs existing tables/endpoints, schema shape, RLS/security, product sanity) , before any migration.
2. Migrations A-1 + B-1 (apply_migration MCP, additive, then live-snapshot refresh + `npm run inventory`).
3. Backend endpoints + curl proofs (A-2, B-1 RLS probes) , can run while the R4 frontend coder finishes (backend parallel OK).
4. Frontend (A-3/A-4, B-2/B-3/B-4) , AFTER R4 lands, coder-built, one pass per surface, SENIOR_SCORECARD + design-verifier on the PDP sections.
5. E2E on test salon 97c04291: seed 3 products + 1 bundle, buy a product (Stripe test), book a bundle, verify prices/stock/rows.
6. B-4 pre-req: fix the multi-service slot-locking bug first (already queued in ACTIVE.md).

## Open items (parked, non-blocking)
- Delivery shipping (Fresha has it) , v1 is pickup-only per the approved mockup.
- Memberships / recurring , explicitly OUT (Fresha is merging them into packages; not asked).
- Product variants (sizes) , Fresha doesn't document them either; v1 = one row per SKU.
