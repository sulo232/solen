---
description: Phase 3 roadmap resolving critical broken APIs in the Dashboard, specifically the Nail administration vertical, route mismatches, and dashboard i18n regressions.
---

# Roadmap: Dashboard & Admin Remediation (Audit 3)

This roadmap remediates the findings in `extended_missing_audit.md`. It focuses heavily on fixing the completely broken Nail Admin dashboard, resolving route mismatches that cause failed fetches, and migrating hardcoded German dashboard strings to standard `next-intl`.

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | Nail Admin State | The `DynamicPricingConfig` and `RetailManager` components are already dead. Adding backend logic must be done incrementally so as not to introduce infinite render loops when checking stock/prices. |
| Phase 2 | 🟡 MEDIUM | Package Creation | Creating `/api/salon/services` must respect RLS so a salon can only fetch their own services. |
| Phase 3 | 🟡 MEDIUM | Reminder Triggers | Moving `SmartReminderConfig` cooldown from `localStorage` to the database requires a migration of existing state (if any) or a safe overwrite. |
| Phase 4 | 🟢 SAFE | German i18n | Hardcoded text replacement is safe, provided keys are registered in all 4 language JSON files. |
| Phase 5 | 🟢 SAFE | Documentation | Pure markdown updates. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Nail Admin Re-activation
The entire Nail Dashboard vertical is dead UI due to missing API endpoints.

**Files:**
- `[NEW]` `app/api/nail/pricing/route.ts`
- `[MODIFY]` `components/dashboard/nail/DynamicPricingConfig.tsx`
- `[NEW]` `app/api/nail/retail/route.ts`
- `[MODIFY]` `components/dashboard/nail/RetailManager.tsx`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Both pricing and retail require complex `GET`, `POST`, `PATCH`, and `DELETE` methods. Implementing them all at once can lead to messy, untestable route files.
> - **Common mistakes:** Returning arrays when the UI expects an object, or vice-versa. Always check the mocked interface in the `tsx` components before defining the API response shape.
> - **Edge cases:** `RetailManager` needs to handle stock reduction when standard appointments consume products (if applicable eventually).

**✅ DO:**
```tsx
// Use proper HTTP methods for CRUD
export async function PATCH(req: Request) { ... }
```

**❌ DON'T:**
```tsx
// Using POST for everything
export async function POST(req: Request) { if (action === 'delete') ... }
```

**Verification Steps:**
- Run: `git commit -m "feat: Implement full CRUD backend for Nail Pricing and Retail admin"`
- Test: Open dashboard > Nail tab. Create a test pricing rule and a test retail product. Refresh the page to ensure they persist via the new APIs.

---

### Phase 2: Package Manager & Referral Dashboard fixes
Resolves missing routes causing the service dropdown to be empty and the referral dashboard to show zeros.

**Files:**
- `[NEW]` `app/api/salon/services/route.ts`
- `[NEW]` `app/api/analytics/referrals/route.ts`
- `[MODIFY]` `components/dashboard/PackageManager.tsx`
- `[MODIFY]` `components/dashboard/ReferralDashboard.tsx`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** The service route needs to cleanly isolate services by `salon_id` derived from the dashboard session. Leaking another salon's services is a critical security bug.
> - **Edge cases:** The package manager previously called `/api/packages/purchases` (plural). We must align the frontend to call the existing singular route, OR rename the singular route if it's currently wrong. Let's fix the frontend to match the backend.

**✅ DO:**
```tsx
// PackageManager.tsx (Fixing the route mismatch)
const { data } = useSWR('/api/packages/purchase', fetcher);
```

**❌ DON'T:**
```tsx
// Keeping the plural mismatch and ignoring the 404
const { data } = useSWR('/api/packages/purchases', fetcher);
```

**Verification Steps:**
- Run: `git commit -m "fix: Resolve Package purchase route mismatch and add missing service/referral APIs"`
- Test: Open the Package Manager and try to create a new package — the service dropdown should now populate with the salon's actual services.

---

### Phase 3: Route Mismatches & Server-Side State
Fix the SolenScoreCard string mismatch (`salonId` vs `slug`) and move `SmartReminderConfig` dedup logic to the database.

**Files:**
- `[MODIFY]` `components/dashboard/SolenScoreCard.tsx`
- `[MODIFY]` `components/dashboard/barber/SmartReminderConfig.tsx`
- `[MODIFY]` `app/api/dashboard/barber-reminders/route.ts`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** If `SolenScoreCard` is passed a raw UUID but the route expects a string slug, the API will 404. We need to normalize how `salon_id` is parsed.
> - **Common mistakes:** Leaving the `localStorage.setItem('solen_reminder_sent')` in the frontend after migrating to the backend. It must be completely ripped out to prevent dual-state desync.

**✅ DO:**
```tsx
// SolenScoreCard.tsx - ensure we pass the correct identifier
fetch(`/api/salons/${salon.slug}/score`) 
```

**Verification Steps:**
- Run: `git commit -m "refactor: Migrate reminder deduplication to server side and fix score route mismatch"`
- Test: Send a smart reminder from the dashboard, verify the cooldown is registered in the DB, log in from an incognito window, and verify the cooldown is still active.

---

### Phase 4: i18n Hardcoded Dashboards
Several barber/admin dashboards bypassed the phase 2 i18n migration and rely on hardcoded German text.

**Files:**
- `[MODIFY]` `components/dashboard/barber/BarberLeaderboard.tsx`
- `[MODIFY]` `components/dashboard/barber/BreakManager.tsx`
- `[MODIFY]` `components/dashboard/ClosureManager.tsx`
- `[MODIFY]` `components/dashboard/WalkInModal.tsx`
- `[MODIFY]` `messages/de.json`, `en.json`, `fr.json`, `it.json`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** `WalkInModal` uses an inline `labels` object. Refactoring it to `useTranslations` requires careful prop-drilling or context mapping if it's called as a pure function.
> - **Edge cases:** Day names in `BreakManager` should preferably use `Intl.DateTimeFormat` dynamically rather than hardcoding static translation keys for "Montag", "Dienstag", etc.

**✅ DO:**
```tsx
// Use native browser i18n for days where possible, or useTranslations
const formatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
```

**❌ DON'T:**
```tsx
// Keeping German text
<th>Umsatz</th>
```

**Verification Steps:**
- Run: `git commit -m "fix: Migrate hardcoded dashboard components to next-intl"`
- Test: Visit the dashboard in `/en` or `/fr` and verify the Leaderboard and Break Manager column headers are correctly translated.

---

### Phase 5: Documentation & AI Registry
Update `CLAUDE.md` to map the newly connected Nail Admin APIs.

**Files:**
- `[MODIFY]` `CLAUDE.md`

> ⚠️ **BE CAREFUL**:
> - **Common mistakes:** Modifying unrelated architecture notes during the update.

**Verification Steps:**
- Run: `git commit -m "docs: Update CLAUDE.md API registry with Nail admin endpoints"`

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Nail Admin (Pricing/Retail) | Nothing |
| Phase 2 | 🤖 | Package & Referral API | Nothing |
| Phase 3 | 🤖 | Mismatches & LocalStorage Sync | Nothing |
| Phase 4 | 🤖 | Dashboard i18n (German removal) | Nothing |
| Phase 5 | 🤖 | Update CLAUDE.md | Phases 1-3 |
