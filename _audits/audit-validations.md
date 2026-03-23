# Audit: Validation Schemas (`lib/validations.ts`)

**Date:** 2026-03-22
**Scope:** All 52 Zod schemas, `validateBody()`/`validateQuery()` helpers, and validation coverage across 219 API routes

---

## Summary

| Metric | Count |
|---|---|
| Total schemas defined | 52 |
| Schemas actively used | 46 |
| Dead schemas (never imported) | 5 |
| Total API routes (`route.ts`) | 219 |
| Routes WITH `validateBody`/`validateQuery` | 59 (27%) |
| Routes that parse JSON WITHOUT validation | **65** (30%) 🔴 |
| Duplicate `route 2.ts` files (dead code) | 5 |

**Risk Level:** 🔴 CRITICAL — 65 API routes parse `req.json()` without Zod validation, violating CLAUDE.md Rule S1.

---

## Section A: Dead Schemas (never imported outside `lib/validations.ts`)

| # | Schema | Line | Verdict | Notes |
|---|---|---|---|---|
| 1 | `createCheckoutSchema` | 183-192 | 🔴 Remove | Orphaned — Stripe checkout uses `createPaymentIntentSchema` instead |
| 2 | `directorySearchSchema` | 70-76 | 🔴 Remove | Never used — directory search uses ad-hoc params |
| 3 | `discoveryTikTokImportSchema` | 176-179 | 🔴 Remove | `admin/discovery/import-tiktok/route.ts` doesn't import it |
| 4 | `guestBookingSchema` | 194-198 | 🟡 Wire up | Schema exists but guest booking routes don't use it |
| 5 | `priceAdjustmentSchema` | 200-203 | 🟡 Wire up | Schema exists but dispute/refund routes don't use it |

**`barberProfileSchema`** is imported in `app/api/staff/[id]/slug/route.ts` — NOT dead (used via the duplicate `route 2.ts` too).

---

## Section B: Unvalidated API Routes (65 total)

### B1: Admin Routes (17) — 🔴 CRITICAL (privilege escalation risk)

| # | Route | Method | Data Parsed | Existing Schema? |
|---|---|---|---|---|
| 1 | `admin/badges/assign/route.ts` | POST | badge_id, user_ids | ❌ Need new |
| 2 | `admin/badges/route.ts` | POST | name, description, icon | ❌ Need new |
| 3 | `admin/badges/[id]/route.ts` | PATCH | badge fields | ❌ Need new |
| 4 | `admin/commission/route.ts` | POST | salon_id, rate | ❌ Need new |
| 5 | `admin/content/[key]/route.ts` | PUT | content block | ❌ Need new |
| 6 | `admin/discovery/route.ts` | POST | discovery item | ❌ Need new |
| 7 | `admin/discovery/analyze/route.ts` | POST | item_id | ❌ Need new |
| 8 | `admin/discovery/backfill/route.ts` | POST | ids, action | ❌ Need new |
| 9 | `admin/discovery/bulk-import/route.ts` | POST | items array | ❌ Need new |
| 10 | `admin/discovery/import-tiktok/route.ts` | POST | urls, category | ✅ `discoveryTikTokImportSchema` exists! |
| 11 | `admin/discovery/moderation/route.ts` | POST | item_id, action | ❌ Need new |
| 12 | `admin/discovery/smart-import/route.ts` | POST | query, source | ❌ Need new |
| 13 | `admin/disputes/route.ts` | POST | dispute fields | ❌ Need new |
| 14 | `admin/feature-flags/route.ts` | POST | key, enabled | ❌ Need new |
| 15 | `admin/help/route.ts` | POST | article fields | ❌ Need new |
| 16 | `admin/nail/generate/route.ts` | POST | AI params | ❌ Need new |
| 17 | `admin/notify-new-salon/route.ts` | POST | salon_id | ❌ Need new |
| 18 | `admin/reviews/[id]/route.ts` | PATCH | status | ❌ Need new |
| 19 | `admin/salon-of-month/route.ts` | POST | salon_id, month | ❌ Need new |
| 20 | `admin/salons/[id]/reject/route.ts` | POST | reason | ❌ Need new |
| 21 | `admin/users/route.ts` | PATCH | user fields | ❌ Need new |

### B2: Auth Routes (3) — 🔴 CRITICAL (injection risk)

| # | Route | Method | Data Parsed | Existing Schema? |
|---|---|---|---|---|
| 1 | `auth/login/route.ts` | POST | email, password | ❌ Inline schema (anti-pattern) |
| 2 | `auth/signup/route.ts` | POST | email, password, name | ❌ Need new |
| 3 | `auth/verify-otp/route.ts` | POST | email, otp | ❌ Need new |

### B3: Booking Routes (7) — 🟠 HIGH

| # | Route | Method | Data Parsed | Existing Schema? |
|---|---|---|---|---|
| 1 | `bookings/[id]/cancel/route.ts` | POST | reason | ❌ Need new |
| 2 | `bookings/[id]/dispute/route.ts` | POST | amounts, reason | ✅ `priceAdjustmentSchema` exists! |
| 3 | `bookings/[id]/inspo/route.ts` | POST | image_ids | ❌ Need new |
| 4 | `bookings/[id]/refund/route.ts` | POST | amount, reason | ❌ Need new |
| 5 | `bookings/[id]/reschedule/route.ts` | POST | new_slot_id | ❌ Need new |
| 6 | `bookings/express-rebook/route.ts` | POST | salon_id, service_id | ❌ Need new |
| 7 | `bookings/express-rebook/confirm/route.ts` | POST | slot_id | ❌ Need new |
| 8 | `bookings/recurring/route.ts` | POST | recurrence config | ❌ Need new |

### B4: Payment Routes (3) — 🟠 HIGH

| # | Route | Method | Data Parsed | Existing Schema? |
|---|---|---|---|---|
| 1 | `stripe/save-card/route.ts` | POST | salon_id | ❌ Need new |
| 2 | `loyalty/award/route.ts` | POST | customer_id, card_id | ❌ Need new |
| 3 | `loyalty/redeem/route.ts` | POST | card_id | ❌ Need new |

### B5: Staff/Salon Mgmt Routes (8) — 🟡 MEDIUM

| # | Route | Method | Data Parsed | Existing Schema? |
|---|---|---|---|---|
| 1 | `staff/breaks/route.ts` | POST | break fields | ❌ Need new |
| 2 | `staff/time-off/route.ts` | POST | time-off fields | ❌ Need new |
| 3 | `staff/accept-invite/route.ts` | POST | token | ❌ Need new |
| 4 | `staff/services/route.ts` | POST | service_ids | ❌ Need new |
| 5 | `services/route.ts` | POST | service fields | ❌ Need new |
| 6 | `services/[id]/route.ts` | PATCH | service fields | ❌ Need new |
| 7 | `availability/manage/route.ts` | POST | slots | ❌ Need new |
| 8 | `notifications/off-peak/route.ts` | POST | notification config | ❌ Need new |

### B6: Client/Chat Routes (6) — 🟡 MEDIUM

| # | Route | Method | Data Parsed | Existing Schema? |
|---|---|---|---|---|
| 1 | `client-notes/route.ts` | POST | note fields | ❌ Need new |
| 2 | `clients/[id]/intake/route.ts` | POST | template_key, responses | ❌ Need new |
| 3 | `conversations/[id]/price-offer/route.ts` | POST | amount, description | ❌ Need new |
| 4 | `reviews/reply/route.ts` | POST | review_id, reply_text | ❌ Need new |
| 5 | `reviews/[id]/respond/route.ts` | PATCH | response fields | ❌ Need new |
| 6 | `ai/intake-recommendation/route.ts` | POST | form data | ❌ Need new |

### B7: Other Routes (8) — 🟢 LOW-MEDIUM

| # | Route | Method | Data Parsed | Existing Schema? |
|---|---|---|---|---|
| 1 | `nail-discovery/publish/route.ts` | POST | design_history_id | ❌ Need new |
| 2 | `nail-inspo/boards/route.ts` | POST | board fields | ❌ Need new |
| 3 | `salon/retail/purchase/route.ts` | POST | product_id, qty | ❌ Need new |
| 4 | `translate/route.ts` | POST | text, target_locale | ❌ Need new |
| 5 | `waitlist/route.ts` | POST | email, salon_id | ❌ Need new |
| 6 | `quartier/subscribe/route.ts` | POST | email, quartier | ❌ Need new |
| 7 | `directory/[id]/claim/route.ts` | POST | claim_code | ❌ Need new |
| 8 | `analytics/track-view/route.ts` | POST | salon_id, type | ❌ Need new |
| 9 | `dashboard/barber-reminders/send/route.ts` | POST | client_ids | ❌ Need new |
| 10 | `profile/favorites/route.ts` | POST | salon_id | ❌ Need new |
| 11 | `salons/[slug]/ai-info/route.ts` | POST | prompt | ❌ Need new |
| 12 | `salons/[slug]/route.ts` | PATCH | salon fields | ❌ Need new |
| 13 | `discover/nails/route.ts` | POST | filter params | ❌ Need new |

---

## Section C: Existing Schema Issues

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| 1 | `updateProfileSchema` allows only `de`/`en` locales — missing `fr`/`it` | validations.ts:47 | 🔴 | Add `fr`, `it` to locale enum |
| 2 | `guestBookingSchema` phone regex `^\+41[0-9]{9}$` too strict — no international | validations.ts:196 | 🟡 | Consider relaxing for non-Swiss guests |
| 3 | `walkInSchema` same phone regex issue | validations.ts:212 | 🟡 | Same fix |
| 4 | `nailDynamicPricingSchema` `rule_type` has `peak`/`off_peak` but DB has `peak_hour`/`off_peak` | validations.ts:317 | 🔴 | Align with DB enum |
| 5 | `discoveryTikTokImportSchema` exists but isn't used in `admin/discovery/import-tiktok/route.ts` | validations.ts:176 | 🟡 | Wire it up |

---

## Section D: Duplicate Route Files (Dead Code)

| # | File | Action |
|---|---|---|
| 1 | `app/api/admin/badges/auto-assign/route 2.ts` | 🔴 Delete |
| 2 | `app/api/admin/badges/assign/route 2.ts` | 🔴 Delete |
| 3 | `app/api/staff/[id]/slug/route 2.ts` | 🔴 Delete |
| 4 | `app/api/analytics/track-view/route 2.ts` | 🔴 Delete |
| 5 | `app/api/stripe/connect/status/route 2.ts` | 🔴 Delete |

---

## Section E: `validateQuery()` Usage

`validateQuery()` is defined but used in very few places. GET routes with search params (e.g., `discovery/feed`, `salons/route`) should use it for:
- Pagination params (`page`, `limit`)
- Filter params (`category`, `quartier`)
- Search strings (length limits)

---

## Fix Priority

| Priority | Action | Count | Risk |
|---|---|---|---|
| P0 | Fix `updateProfileSchema` locale enum (missing fr/it) | 1 | 🔴 Breaks French/Italian users |
| P0 | Wire `discoveryTikTokImportSchema` into import-tiktok route | 1 | 🔴 Schema exists, not used |
| P0 | Wire `priceAdjustmentSchema` into dispute route | 1 | 🔴 Schema exists, not used |
| P1 | Add validation to auth routes (login, signup, verify-otp) | 3 | 🔴 Injection risk |
| P1 | Add validation to admin routes | 21 | 🔴 Privilege escalation |
| P2 | Add validation to booking mutation routes | 8 | 🟠 Data integrity |
| P2 | Add validation to payment routes | 3 | 🟠 Financial risk |
| P3 | Add validation to staff/salon mgmt routes | 8 | 🟡 |
| P3 | Add validation to client/chat routes | 6 | 🟡 |
| P4 | Remove dead schemas | 3 | 🟢 Cleanup |
| P4 | Delete duplicate `route 2.ts` files | 5 | 🟢 Cleanup |
