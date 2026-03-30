---
description: Phase 2 roadmap to resolve missing API routes, hardcoded data, and dead UI features identified in missing_connections_audit.md.
---

# Roadmap: Missing Connections Remediation (Audit 2)

This roadmap remediates the 🔴 MISSING and 🟡 PARTIAL backend connections identified in `missing_connections_audit.md`. These are high-priority issues because front-end components are currently making failed fetch calls (silent 404s) or relying on static/fake data.

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | Booking Calendar Flow | Do not alter existing slot selection state when injecting the waitlist logic. Keep waitlist API calls isolated in a `try/catch`. |
| Phase 2 | 🟡 MEDIUM | Homepage Load Time | Heavy DB queries for trending/category counts can lag the homepage. Enforce strict 24h caching on the Next.js routes. |
| Phase 3 | 🟡 MEDIUM | Profile/Referral Page | Missing referral data could throw undefined errors. Render fallback UI (e.g., standard "Generate Code" button) instead of crashing. |
| Phase 4 | 🟢 SAFE | Search Bar | Just enhances search with AI category detection; search functions normally if it fails. |
| Phase 5 | 🟢 SAFE | Nothing | Pure documentation updates |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Waitlist System (Critical)
The "Auf Warteliste setzen" button in `BookingCalendar.tsx` silently fails by calling a non-existent route (`POST /api/bookings/waitlist`).

**Files:**
- `[NEW]` `app/api/bookings/waitlist/route.ts`
- `[MODIFY]` `components/booking/BookingCalendar.tsx`
- `[MODIFY]` `supabase/schema.sql` (if table creation script needed, otherwise use Supabase dashboard, see Manual phase assumption)

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Breaking `BookingCalendar.tsx` could prevent all users from booking appointments.
> - **Common mistakes:** Blocking the calendar render while waiting for a waitlist API response.
> - **UI Constraints:** Zone 3 (Booking). Strict adherence to standard modal/toast success messages upon waitlist join. No glassmorphism.

**✅ DO:**
```tsx
// Fire and forget, or non-blocking await with toast
const handleWaitlist = async () => {
  setIsLoading(true);
  await fetch('/api/bookings/waitlist', { method: 'POST', body: JSON.stringify(data) }).catch(console.error);
  toast.success(t('waitlistSuccess'));
  setIsLoading(false);
};
```

**❌ DON'T:**
```tsx
// Navigating away or throwing unhandled errors in calendar
const res = await fetch('/api/bookings/waitlist', ...);
if (!res.ok) throw new Error("Failed"); // Crashes calendar!
```

**Verification Steps:**
- Run: `git commit -m "feat: Implement waitlist API and connect to BookingCalendar"`
- Test: Open a heavily booked salon, click the waitlist button, verify 200 OK in network tab, and verify row added to Supabase `waitlist_entries` table.

---

### Phase 2: Homepage Dynamic Data & Trending Fixes
Resolves missing `/api/salons/trending` and hardcoded category counts in `HomePage.tsx`. Removes fake client-side shuffling in `DiscoverCarousel.tsx`.

**Files:**
- `[NEW]` `app/api/salons/trending/route.ts`
- `[NEW]` `app/api/analytics/platform/route.ts`
- `[MODIFY]` `components/HomePage.tsx`
- `[MODIFY]` `components/DiscoverCarousel.tsx`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Uncached counts querying the whole database on every homepage load will paralyze the DB.
> - **Common mistakes:** Forgetting Next.js caching standard `export const revalidate = 86400;` on the API route.
> - **Edge cases:** If trending salons returns empty array, hide the trending section rather than showing an empty carousel.

**✅ DO:**
```typescript
// in app/api/analytics/platform/route.ts
export const revalidate = 86400; // Cache for 24 hours
export async function GET() { ... }
```

**❌ DON'T:**
```tsx
// Client-side fake trending shuffle
const shuffled = [...salons].sort(() => 0.5 - Math.random());
```

**Verification Steps:**
- Run: `git commit -m "feat: Connect HomePage to real trending and platform analytics APIs"`
- Test: Load homepage, inspect Network tab for `trending` and `analytics` route calls. Verify numbers match the database.

---

### Phase 3: Profile Page - Referral Sync & UI Freezes
Resolves the missing `/api/referral` endpoint which causes the referral section to spin forever or show 0. Disables unimplemented notification toggles explicitly.

**Files:**
- `[NEW]` `app/api/referral/route.ts`
- `[MODIFY]` `app/[locale]/profile/page.tsx`
- `[MODIFY]` `messages/de.json` (Add "Demnächst" or "Coming Soon" for toggles)

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** `GET /api/referral` needs to auto-generate a code if the user doesn't have one yet, otherwise the UI stays empty.
> - **Common mistakes:** Leaving standard toggles active when no backend handler exists (leads to user frustration).

**✅ DO:**
```tsx
// Mark unsupported toggles visually
<Switch disabled /> <Badge variant="secondary">{t('comingSoon')}</Badge>
```

**❌ DON'T:**
```tsx
// Leaving phantom features actionable
<Switch onChange={() => console.log('does nothing')} />
```

**Verification Steps:**
- Run: `git commit -m "fix: Implement profile referral stats API and freeze unimplemented toggles"`
- Test: Visit `/profile` and verify the referral code and "invited friends" counter loads correctly. Verify Deals toggle is disabled with a "Coming soon" badge.

---

### Phase 4: AI Search Category Detection
Resolves silent 404 on `/api/search/detect-category`.

**Files:**
- `[NEW]` `app/api/search/detect-category/route.ts`
- `[MODIFY]` `components/search/HomeSearchBar.tsx`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Passing search keystrokes to an AI endpoint on every keypress costs major $$$.
> - **Common mistakes:** Fetching the endpoint without debouncing. Only fetch on "Enter" or form submit.

**✅ DO:**
```tsx
// Only detect category on actual submission
const performSearch = async (query: string) => { ... }
```

**❌ DON'T:**
```tsx
// Calling detection on active typing changes
onChange={(e) => fetchDetectCategory(e.target.value)}
```

**Verification Steps:**
- Run: `git commit -m "feat: Implement OpenAI category detection for HomeSearchBar"`
- Test: Type "gel nails" in search, intercept network, ensure category gets auto-assigned to "Nails" before routing to standard search results.

---

### Phase 5: Documentation & Standards Update
Finalize additions in the master reference.

**Files:**
- `[MODIFY]` `CLAUDE.md`

> ⚠️ **BE CAREFUL**:
> - **Common mistakes:** Putting API routes in the wrong sub-section of the Directory Tree.

**✅ DO:**
Add `app/api/bookings/waitlist/route.ts` to the `Active Routes` listing.

**Verification Steps:**
- Run: `git commit -m "docs: Update CLAUDE API registry from Audit 2"`

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Waitlist API & Integration | Nothing |
| Phase 2 | 🤖 | Homepage Dynamic Data | Nothing |
| Phase 3 | 🤖 | Profile Referral API & Toggles | Nothing |
| Phase 4 | 🤖 | Search Category Detection | Nothing |
| Phase 5 | 🤖 | Update CLAUDE.md | Phases 1-4 |
