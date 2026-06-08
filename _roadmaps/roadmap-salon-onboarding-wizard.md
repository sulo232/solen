# Salon Onboarding Wizard — Roadmap

> **Status**: ✅ COMPLETE (implemented 2026-03-21)
> **Owner**: Antigravity agent
> **Branch**: `main`

---

## Phase 1: Setup Progress API ✅
- `app/api/salon/setup-progress/route.ts` — GET returns 7-step completion status
- Checks: profile (name, description, phone), opening_hours, services ≥1, staff ≥1, schedules ≥1, stripe_account_id, go_live composite

## Phase 2: 7-Step Onboarding Wizard UI ✅
- `app/[locale]/dashboard/setup/page.tsx` — Wizard page
- `components/onboarding/SetupWizard.tsx` — Animated container with progress bar, step navigation
- Step components in `components/onboarding/steps/`:
  1. `SalonProfileStep.tsx` — Name, descriptions (DE/EN), phone, cover photo → `PATCH /api/salons/{id}`
  2. `OpeningHoursStep.tsx` — Weekly day toggles + time inputs → `PATCH /api/salons/{id}`
  3. `ServicesStep.tsx` — Inline add/remove services → `POST/DELETE /api/services`
  4. `TeamStep.tsx` — Email invite flow → `POST /api/staff/invite`
  5. `ScheduleStep.tsx` — Informational (auto-inherits opening hours)
  6. `PaymentsStep.tsx` — Payment mode selector + Stripe Connect → `PATCH /api/salons/{id}`
  7. `GoLiveStep.tsx` — Checklist review + activation

## Phase 3: Dashboard Welcome State ✅
- `components/dashboard/SetupBanner.tsx` — SVG progress ring, incomplete step chips, "Continue" CTA
- Integrated into `app/[locale]/dashboard/page.tsx`
- Auto-hides when setup is 100% complete, dismissible per session

## Phase 4: Tutorial System ⏳
- Deferred to post-launch polish
- Planned: `TutorialTooltip.tsx`, guided tour via driver.js

## Phase 5: Stripe Connect Routes ✅
- `app/api/stripe/connect/create-account/route.ts` — Creates Standard Connect account
- `app/api/stripe/connect/status/route.ts` — Returns connect status

## Phase 6: Empty States ⏳
- Deferred to post-launch polish
- Planned: `EmptyState.tsx` with lucide-react icons + illustration prop

---

## Bug Fixes (discovered during audit)
- **CREATED** `/api/services/route.ts` (GET + POST) — was completely missing
- **CREATED** `/api/services/[id]/route.ts` (GET + PATCH + DELETE) — was completely missing
- **FIXED** wizard API calls: `PATCH /api/salons` → `PATCH /api/salons/{salonId}`
- **FIXED** salons PATCH whitelist: added `payment_mode`, `deposit_percent`, `cancellation_hours`, `late_cancel_fee_percent`, `sms_reminder_24h/1h`, `vacation_start/end`, social URLs

## CLAUDE.md Compliance Fixes
- V1: Replaced banned `bg-amber-*` tokens with `bg-s-warning-bg`
- V2: Added `dark:` variants to all components
- V3: Replaced raw emojis with lucide-react icons
- V5: Used `InteractiveHoverButton` for Go Live CTA
- V6: Changed setup-progress runtime to `edge`
