---
description: Phase 5 roadmap to resolve the final sweep of missing APIs, specifically critical authentication blockages and the completely dead Discovery subsystem.
---

# Roadmap: Final Discovery & Auth Remediation (Audit 5)

This roadmap remediates the findings in `round4_final_audit.md`. It addresses the critical `/api/auth/login` missing route (which currently prevents all email/password logins), the missing `/api/salons/search` endpoint utilized by the SplitView search, and the dead Discovery system components.

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | Global Authentication | Creating the login route must use the official `@supabase/ssr` client and properly set cookies. Failure to do so will result in infinite redirect loops or failed auth states. |
| Phase 2 | 🔴 HIGH | Core Search | The `SplitView` search is a primary user funnel. Re-wiring `.search` must exactly match the expected JSON structure frontend filters require. |
| Phase 3 | 🟡 MEDIUM | Discovery Feed load | `SimilarStyles` and `StyleNamePills` APIs must be fast. Avoid full table scans for "similar" computing; use indexed tags or Edge caching. |
| Phase 4 | 🟡 MEDIUM | Checkout Flow | `RetailCheckout` adds products. Must validate stock atomically before returning a 200 OK. |
| Phase 5 | 🟢 SAFE | Documentation | Pure markdown and route mismatch string fixes. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Authentication Blocker
`SignIn.tsx` POSTs to `/api/auth/login` to authenticate users via email and password, but this route does not exist (only `/api/auth/callback` exists for OAuth).

**Files:**
- `[NEW]` `app/api/auth/login/route.ts`
- `[MODIFY]` `components/auth/SignIn.tsx`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Failing to set the response cookies properly using `cookies().set(...)` from `getServerSession` logic.
> - **Common mistakes:** Returning simple `{ success: true }` without exchanging the Auth session with Supabase server-side.
> - **Edge cases:** Handle `AuthApiError` safely so the frontend displays "Invalid credentials" rather than a raw 500 error.

**✅ DO:**
```typescript
// Use the official Supabase SSR client for Next.js App Router
const supabase = createClient();
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

**❌ DON'T:**
```typescript
// Trying to use the client component supabase instance in the API route
const supabase = createBrowserClient(); // Fails on server
```

**Verification Steps:**
- Run: `git commit -m "feat: Implement email/password login API route"`
- Test: Open an Incognito window, navigate to `/auth/login`, and sign in with a known valid test account. Verify the session cookies are set and you are redirected to `/dashboard`.

---

### Phase 2: Search API & Service Add-ons
The SplitView text search and the booking cart's service add-on recommendations are making calls to missing endpoints.

**Files:**
- `[NEW]` `app/api/salons/search/route.ts`
- `[MODIFY]` `components/search/SplitView.tsx`
- `[NEW]` `app/api/services/[id]/addons/route.ts`
- `[MODIFY]` `components/booking/ServiceCart.tsx`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** The search API needs to handle URL query params correctly (`?q=zurich&category=nails`).
> - **Common mistakes:** Not utilizing Supabase Text Search (`textSearch()`) and falling back to slow `ilike` operations for the search query.
> - **UI Constraints:** Zone 1 for Search.

**✅ DO:**
```typescript
// Safely parse search params
const { searchParams } = new URL(request.url);
const query = searchParams.get('q');
```

**Verification Steps:**
- Run: `git commit -m "feat: Implement text search API and service addons API"`
- Test: Type "Barber Zurich" into the main search bar and confirm the SplitView populates with data without silently 404ing.

---

### Phase 3: Discovery Subsystem Dead APIs
The `/discover` vertical is missing 3 major routes responsible for population: style names, similar styles, and the admin bulk importer.

**Files:**
- `[NEW]` `app/api/discovery/style-names/route.ts`
- `[NEW]` `app/api/discovery/similar/route.ts`
- `[MODIFY]` `components/discovery/StyleNamePills.tsx`
- `[MODIFY]` `components/discovery/SimilarStyles.tsx`
- `[MODIFY]` `components/discovery/RelatedTikToks.tsx`
- `[NEW]` `app/api/admin/discovery/bulk-import/route.ts`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** `/api/discovery/similar` must handle array shuffling or Edge-cached responses. If this query joins the `salons` and `reviews` tables for every single style load, the DB will crash under load.
> - **Common mistakes:** Leaving the endpoints unprotected. `bulk-import` MUST check if the user is a `solen_admin` before allowing massive writes.

**✅ DO:**
```typescript
// Protect admin routes!
const { data: { user } } = await supabase.auth.getUser();
if (user?.app_metadata?.role !== 'admin') return new Response("Unauthorized", { status: 403 });
```

**Verification Steps:**
- Run: `git commit -m "feat: Implement discovery data routes and protective admin importer"`
- Test: Visit `/discover/nails` and click on an image. In the modal, verify the "Similar Styles" section populates instead of remaining blank.

---

### Phase 4: Route Mismatches & Retail Checkout
Fixes the plural/singular mismatch in `ForYouSection` and solves the missing endpoint for the Nail Retail checkout.

**Files:**
- `[MODIFY]` `components/discovery/ForYouSection.tsx`
- `[NEW]` `app/api/nail/retail/checkout/route.ts`

> ⚠️ **BE CAREFUL**:
> - **What could go wrong:** Retail checkout must decrement stock. If a race condition occurs (2 people buy the last shampoo), stock could go into negatives.
> - **Edge cases:** ForYouSection should be refactored to fetch from `/api/discovery/save` (singular) matching the verified existing route.

**✅ DO:**
```typescript
// ForYouSection.tsx
const { data } = useSWR('/api/discovery/save', fetcher);
```

**❌ DON'T:**
```typescript
// Using the 404 plural route
const { data } = useSWR('/api/discovery/saves', fetcher);
```

**Verification Steps:**
- Run: `git commit -m "fix: Resolve ForYouSection route mismatch and implement retail checkout API"`
- Test: Check out a retail product via the nail dashboard and verify the product stock in the database decreases by 1.

---

### Phase 5: Documentation Update
Ensure all 7 new API routes are added to the official project directory structure mapping.

**Files:**
- `[MODIFY]` `CLAUDE.md`

> ⚠️ **BE CAREFUL**:
- Add the routes strictly to `Section 3.2 Directory Tree`.

**Verification Steps:**
- Run: `git commit -m "docs: Map Audit 5 API routes to CLAUDE.md"`

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Authentication Blocker | Nothing (Highest Priority) |
| Phase 2 | 🤖 | Search & Add-ons | Nothing |
| Phase 3 | 🤖 | Discovery Subsystem APIs | Nothing |
| Phase 4 | 🤖 | Route Mismatches & Checkout | Nothing |
| Phase 5 | 🤖 | Update CLAUDE.md | Phases 1-4 |
