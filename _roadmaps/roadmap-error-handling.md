> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap: Error Handling & Silent Catch Audit
> **Priority**: 🟢 P2 — Run IN PARALLEL with any other roadmap (touches different code paths)
> **Parallelism**: SAFE alongside ALL other roadmaps. Only modifies `.catch()` patterns, not layout/UI.
> **Estimated Time**: ~30 minutes
> **Scope**: Replace 60+ `.catch(() => {})` calls with proper error handling across ALL dashboard and app pages

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Read-only audit |
| Phase 2 | 🟢 SAFE | Nothing | Adding console.error only — no behavior change |
| Phase 3 | 🟡 MEDIUM | Toast could cover content on mobile | Test toast placement |
| Phase 4 | 🟢 SAFE | Nothing | CLAUDE.md update only |

---

## 🤖 Phase 1: Full Audit of Silent Catches

**Goal**: Categorize every `.catch(() => {})` into: (A) fire-and-forget (acceptable), (B) user-facing error (needs toast), (C) critical failure (needs redirect/retry).

Run this command to get the full list:
```bash
grep -rn "\.catch(() => {})" app/ components/ --include="*.tsx" --include="*.ts" | sort
```

Expected count: ~60+ files. Categorize them:

**Category A — Fire-and-forget (keep silent but add logging)**:
These are telemetry/analytics calls where failure doesn't affect UX:
- `analytics/track-view` calls
- `posthog.capture` calls
- View tracking calls

**Category B — User-facing (needs error handling)**:
These are data-fetching calls where the user should know something failed:
- Salon detail page fetches
- Booking list fetches
- Staff/service list fetches
- Dashboard data fetches

**Category C — Critical (needs redirect/retry)**:
These are auth or payment flows:
- Profile fetches that gate auth
- Payment intent creation
- Booking creation/cancellation

> ⚠️ **BE CAREFUL**: Do NOT modify files in Phase 1. Read only.

---

## 🤖 Phase 2: Add console.error to ALL silent catches

**Goal**: Replace EVERY `.catch(() => {})` with `.catch((err) => console.error("[ComponentName] description:", err))`.

**Pattern**:
```diff
- .catch(() => {})
+ .catch((err) => console.error("[DashboardBookings] Failed to load bookings:", err))
```

**Files to modify** (exact list from grep — do them ALL):

### Dashboard pages (salon owner facing):
- [MODIFY] `app/[locale]/dashboard/bookings/page.tsx` — line 149
- [MODIFY] `app/[locale]/dashboard/nail-admin/page.tsx` — line 43
- [MODIFY] `app/[locale]/dashboard/setup/page.tsx` — line 36
- [MODIFY] `app/[locale]/dashboard/settings/page.tsx` — lines 891, 1048, 1120
- [MODIFY] `app/[locale]/dashboard/waxing-admin/page.tsx` — line 43
- [MODIFY] `app/[locale]/dashboard/spa-admin/page.tsx` — line 40
- [MODIFY] `app/[locale]/dashboard/staff/page.tsx` — lines 54, 373, 427
- [MODIFY] `app/[locale]/dashboard/services/page.tsx` — line 340
- [MODIFY] `app/[locale]/dashboard/reviews/page.tsx` — line 47
- [MODIFY] `app/[locale]/dashboard/messages/page.tsx` — line 53
- [MODIFY] `app/[locale]/dashboard/revenue/page.tsx` — line 51
- [MODIFY] `app/[locale]/dashboard/queue-display/page.tsx` — line 23
- [MODIFY] `app/[locale]/dashboard/page.tsx` — line 110
- [MODIFY] `app/[locale]/dashboard/nail-clients/page.tsx` — line 22
- [MODIFY] `app/[locale]/dashboard/marketing/page.tsx` — line 25
- [MODIFY] `app/[locale]/dashboard/makeup-admin/page.tsx` — line 39
- [MODIFY] `app/[locale]/dashboard/homepage-admin/page.tsx` — line 46
- [MODIFY] `app/[locale]/dashboard/earnings/page.tsx` — line 85
- [MODIFY] `app/[locale]/dashboard/coiffeur-crm/page.tsx` — lines 49, 59
- [MODIFY] `app/[locale]/dashboard/calendar/page.tsx` — line 399
- [MODIFY] `app/[locale]/dashboard/clients/page.tsx` — lines 74, 223, 230
- [MODIFY] `app/[locale]/dashboard/barber-clients/page.tsx` — line 22
- [MODIFY] `app/[locale]/dashboard/approvals/page.tsx` — line 32
- [MODIFY] `app/[locale]/dashboard/barber-ops/page.tsx` — line 42
- [MODIFY] `app/[locale]/dashboard/analytics/page.tsx` — lines 91, 125
- [MODIFY] `app/[locale]/dashboard/admin-sandbox/page.tsx` — line 66

### Customer-facing pages:
- [MODIFY] `app/[locale]/tip/[bookingId]/page.tsx` — line 37
- [MODIFY] `app/[locale]/salon/[slug]/packages/page.tsx` — line 220
- [MODIFY] `app/[locale]/salon/[slug]/gift-card/page.tsx` — line 31
- [MODIFY] `app/[locale]/profile/referral/page.tsx` — line 24
- [MODIFY] `app/[locale]/onboarding/salon/page.tsx` — lines 381, 473
- [MODIFY] `app/[locale]/checkout/page.tsx` — line 182
- [MODIFY] `app/[locale]/bookings/[id]/approve-increase/page.tsx` — line 37
- [MODIFY] `app/[locale]/bookings/[id]/respond-adjustment/page.tsx` — line 40

### Salon detail page:
Skip `app/[locale]/salon/[slug]/page.tsx` — this is handled by `roadmap-salon-i18n.md` Phase 2.

**Naming convention for log labels**:
Use the format `[PageName] Action description:`. Examples:
- `[DashboardBookings] Failed to load bookings:`
- `[GiftCard] Failed to load salon:`
- `[Checkout] Failed to create payment intent:`
- `[OnboardingSalon] Failed to submit salon draft:`

✅ DO:
```tsx
.catch((err) => console.error("[DashboardStaff] Failed to load staff:", err))
```

❌ DON'T:
```tsx
// DON'T remove the catch entirely — that would cause unhandled promise rejections
// DON'T add user-visible error handling in this phase — that's Phase 3
// DON'T change any other code in the file — ONLY the .catch() line
```

**How to do this efficiently**: Use a multi-file search-and-replace approach. For each file:
1. Open the file
2. Find the `.catch(() => {})` line
3. Read the surrounding context to understand what's being fetched
4. Replace with a descriptive `console.error` call

```bash
git add app/ components/
git commit -m "fix: replace 60+ silent .catch(() => {}) with descriptive console.error logging"
```

> ⚠️ **BE CAREFUL**:
> - Do NOT touch `.catch(() => {})` in test files or scripts
> - Some `.catch(() => {})` have a comment like `// fire-and-forget` — still add logging but keep the comment
> - The `onboarding/salon/page.tsx` line 473 is intentionally fire-and-forget (deleting a draft on unmount) — add logging but keep the delete call
> - SKIP `app/[locale]/salon/[slug]/page.tsx` — that file is being handled by the i18n roadmap
> - Do NOT change the actual error handling behavior — just add logging

---

## 🤖 Phase 3: Add Error Toast for Critical User-Facing Failures (OPTIONAL)

**This phase is OPTIONAL — only run if time permits.**

For the most critical user-facing pages (checkout, booking cancellation, tip), add a toast notification when an error occurs:

Check if a toast system already exists:
```bash
grep -rn "toast\|Toast\|Toaster" components/ --include="*.tsx" | head -10
```

If a toast system exists, use it. If not, use a simple state-based error banner.

> ⚠️ **BE CAREFUL**: This phase adds USER-VISIBLE behavior changes. Test thoroughly.

---

## 🤖 Phase 4: Update CLAUDE.md

Add to CLAUDE.md, Section 11 or a new "Error Handling" section:

```markdown
### Error Handling Rules
- NEVER use `.catch(() => {})` — always log with `console.error("[ComponentName] description:", err)`
- For fire-and-forget calls (analytics, tracking): log silently with console.error
- For user-facing fetches (data loading): log + show error state
- For auth flows: log + redirect to login
- For payment flows: log + show user-visible error with retry option
```

```bash
git add CLAUDE.md
git commit -m "docs: add error handling rules to CLAUDE.md"
```

---

## 🔍 SELF-CHECK PROTOCOL

```bash
# 1. No remaining silent catches (except salon page which is handled elsewhere)
grep -rn "\.catch(() => {})" app/ components/ --include="*.tsx" --include="*.ts" | grep -v "salon/\[slug\]/page.tsx" | wc -l
# Expected: 0

# 2. TypeScript
npx tsc --noEmit 2>&1 | tail -5

# 3. Build
npm run build 2>&1 | tail -10
```

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Audit (read-only) | Nothing |
| Phase 2 | 🤖 | Add console.error to all catches | Phase 1 |
| Phase 3 | 🤖 | Add error toasts (OPTIONAL) | Phase 2 |
| Phase 4 | 🤖 | Update CLAUDE.md | Phase 2 |
