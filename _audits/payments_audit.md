# Payments & Financial — Full Component Audit

**Date**: 2026-03-22
**Scope**: Stripe integration, walk-in payments, tipping, gift cards, service packages, promo codes, price management
**Files analyzed**: 21 (8 API route groups, 8 UI components, 4 customer pages, 1 utility)

---

## Section A: UI Issues

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| 1 | `bg-green-100 text-green-700` on active gift card badge | GiftCardManager.tsx:86 | 🔴 | Replace with `bg-s-sage/10 text-s-sage` + dark pair |
| 2 | `bg-green-100 text-green-600` on success check icon | tip/[bookingId]/page.tsx:63-64 | 🔴 | Replace with `bg-s-coral/10 text-s-coral` |
| 3 | WalkInModal form inputs missing `id` attrs for label association | WalkInModal.tsx:65,72,78,85 | 🟡 | Add `id` + `htmlFor` pairing |
| 4 | PromoManager copy button missing `aria-label` | PromoManager.tsx:236-240 | 🟢 | Add `aria-label="Code kopieren"` |

---

## Section B: Backend / API Issues

| # | Issue | Endpoint | Severity | Fix |
|---|---|---|---|---|
| 1 | Missing feature flag check on walk-in queue routes | POST /api/walkin/queue, GET /api/walkin/queue/status, POST /api/walkin/queue/remote-join | 🔴 | Add `checkFeatureEnabled("barber_features")` |
| 2 | `/api/analytics/gift-card-revenue` references `referrals` table — may not exist | GET /api/analytics/gift-card-revenue | 🟡 | Verify table exists or add error handling |
| 3 | `/api/dashboard/walkin-analytics` missing feature flag check | GET /api/dashboard/walkin-analytics | 🟡 | Add `checkFeatureEnabled("barber_features")` |
| 4 | 3 Stripe routes use manual validation instead of zod schemas | save-card, create-customer, connect/create-account | 🟢 | Acceptable — no user body input on 2 of 3 |
| 5 | Hardcoded `CHF .toFixed(2)` in webhook/confirm-price email templates | webhook/route.ts:148-149, confirm-price/route.ts:79,100-101 | 🟢 | Use `formatCurrency()` for consistency |

---

## Section C: Feature Flow Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | `/salon/[slug]/packages` page "Buy Package" button has no `onClick` handler | 🔴 | Wire up payment modal or checkout redirect |
| 2 | Tip page (`/tip/[bookingId]`) has no auth — anyone can tip any booking ID | 🟡 | Add HMAC token verification like walk-in-pay |
| 3 | Walk-in queue anonymous join has no CAPTCHA or phone verification | 🟡 | Rate limiting exists (generalLimiter) — consider phone OTP for production |

---

## Section D: Data Integrity Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | PriceAdjustmentModal enforces max 150% upcharge (line 41) but CLAUDE.md says max 50% | 🟡 | Align code or documentation |
| 2 | Gift card balance endpoint allows brute-force code guessing (5 req/min/IP = 7,200/day) | 🟢 | Consider exponential backoff after 3 failures |

---

## Section E: i18n Issues (Cross-Component)

| # | Component | Current State | Missing | Severity |
|---|---|---|---|---|
| 1 | tip/[bookingId]/page.tsx | 100% hardcoded German, zero i18n | de/en/fr/it | 🔴 |
| 2 | PriceOfferModal.tsx | Hardcoded German strings | de/en/fr/it labels | 🟡 |
| 3 | WalkInModal.tsx | Hardcoded German strings | de/en/fr/it labels | 🟡 |
| 4 | GiftCardManager.tsx | Hardcoded German, hardcoded `de-CH` locale | de/en/fr/it labels | 🟡 |
| 5 | PromoManager.tsx | Hardcoded German, hardcoded `de-CH` locale | de/en/fr/it labels | 🟡 |
| 6 | PackageManager.tsx | Hardcoded German, imports useLocale but doesn't use translations | de/en/fr/it labels | 🟡 |
| 7 | walk-in-pay/page.tsx | de/en labels object | fr/it missing | 🟡 |
| 8 | PriceAdjustmentModal.tsx | de/en labels object | fr/it missing | 🟡 |

---

## Section F: Security Summary (Positive)

| Check | Status | Notes |
|---|---|---|
| `getSession()` everywhere (no `getUser()`) | ✅ PASS | Zero violations across all 11 auth routes |
| Feature flags on Stripe routes | ✅ PASS | All use `checkFeatureEnabled("payments")` |
| Rate limiting | ✅ PASS | `paymentLimiter` (3/1h) on mutations, `generalLimiter` on reads |
| Zod validation | ✅ PASS | 3/6 mutation routes use zod, 3/6 use manual (acceptable) |
| Webhook idempotency | ✅ PASS | `processed_webhook_events` table prevents replays |
| Stripe signature verification | ✅ PASS | `stripe.webhooks.constructEvent()` on webhook route |
| No hardcoded secrets | ✅ PASS | All from `process.env.*` |
| Commission configurable from DB | ✅ PASS | `platform_settings.commission` table, not hardcoded |

---

## Execution Plan

**Fix order**: 🔴 Critical → 🟡 High → 🟢 Low

| Step | What | Files |
|---|---|---|
| 1 | Design token fixes (green → design system) | GiftCardManager.tsx, tip/page.tsx |
| 2 | i18n: Add full 4-locale labels to all 8 components | 8 component files |
| 3 | a11y: Add form input IDs to WalkInModal | WalkInModal.tsx |
| 4 | Build verification | `npm run build` |

**Deferred (not fixing in this pass — requires separate roadmap):**
- Walk-in queue feature flag additions (backend change, needs testing)
- Package page "Buy" button wiring (needs Stripe Elements integration)
- Tip page auth/HMAC verification (architectural change)
- Referrals table verification (needs Supabase schema check)
