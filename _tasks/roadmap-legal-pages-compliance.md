# Plan: Legal Pages & Compliance

## Context
solen.ch needs to comply with its own Terms of Service (T&S) document (effective 23 March 2026) and Swiss nDSG/DSG law before taking real money. The T&S references a `/privacy` page that doesn't exist (terms footer links to it — currently 404). TOS versioning has zero DB support. The cookie banner works but points to a placeholder page. This plan closes all gaps.

---

## Phase A Audit Results

| Item | Status | Notes |
|---|---|---|
| `/terms` page | ✅ EXISTS | Full content matches T&S doc, sidebar, bilingual |
| `/privacy` page | ❌ MISSING | Terms footer links to `/privacy` — currently 404 |
| `/datenschutz` | ⚠️ PARTIAL | German placeholder with `[PLATZHALTER]` sections |
| `/cookies` page | ❌ MISSING | Inline reference only |
| Cookie banner | ✅ EXISTS | Consent-gated PostHog, but links to `/datenschutz` |
| PostHog | ✅ EXISTS | EU server, opt-in only |
| Impressum | ✅ EXISTS | `app/[locale]/impressum/page.tsx` |
| TOS versioning | ❌ MISSING | No `tos_accepted_version` on `profiles` |
| TOS notifications | ❌ MISSING | No email/banner system for TOS updates |

---

## Breakage Risk Table (R1)

| Phase | Risk | Could Break | How to Prevent |
|---|---|---|---|
| 1 — DB migration | 🟡 MEDIUM | profiles table | Run via Supabase MCP, verify column added |
| 2 — `/privacy` page | 🟢 SAFE | Nothing | New file only |
| 3 — Redirect `/datenschutz` | 🟢 SAFE | Nothing | Simple redirect, no data change |
| 4 — TOS version constants | 🟢 SAFE | Nothing | New lib file only |
| 5 — `/api/tos/accept` | 🟢 SAFE | Nothing | New API route |
| 6 — `TOSUpdateBanner` | 🟡 MEDIUM | Layout if import fails | Verify import before mounting |
| 7 — CookieBanner link fix | 🟢 SAFE | Nothing | Single string change |
| 8 — Admin TOS notify API | 🟢 SAFE | Nothing | New admin-only route |

---

## 🧑 MANUAL Phase 0 — Prerequisites (User must do these)

1. In Supabase Dashboard → verify migration runs successfully after Phase 1
2. Verify `RESEND_API_KEY` env var is set in Vercel for all environments (needed for Phase 8)
3. In Vercel Dashboard → ensure all envs (Production + Preview + Development) have `RESEND_API_KEY`

---

## 🤖 Phase 1 — DB Migration: TOS Versioning [NEW]
**File**: `supabase/migrations/075_tos_versioning.sql`

```sql
-- Add TOS versioning columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tos_accepted_version TEXT,
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.tos_accepted_version IS 'Version string of T&S user last accepted, e.g. 2026-03-23-v1';
COMMENT ON COLUMN public.profiles.tos_accepted_at IS 'Timestamp when user accepted the current T&S version';
```

> ⚠️ **BE CAREFUL**: Run this via `mcp__claude_ai_Supabase__apply_migration`. After running, verify with `SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tos_accepted_version'`. Do NOT modify any existing columns.

**Verification**: `SELECT tos_accepted_version, tos_accepted_at FROM profiles LIMIT 1;` — should return NULL (existing users haven't accepted yet).

---

## 🤖 Phase 2 — `/privacy` Page [NEW]
**Files**:
- `app/[locale]/privacy/page.tsx` [NEW]
- `app/[locale]/privacy/components/PrivacyContent.tsx` [NEW]
- `app/[locale]/privacy/components/PrivacySidebar.tsx` [NEW]

Same structure as the existing `/terms` page (sidebar + content + BackToTopButton). German primary, English secondary. Contains the full privacy policy.

> ⚠️ **BE CAREFUL**: Do NOT import `<Header>` or `<BottomNav>` in the page — they're already in `app/[locale]/layout.tsx` (Rule 27). The page must only render `<main>` content. Reuse `BackToTopButton` from `../terms/components/BackToTopButton` — do NOT create a new one.

---

## 🤖 Phase 3 — Redirect `/datenschutz` → `/privacy` [MODIFY]
**File**: `app/[locale]/datenschutz/page.tsx` [MODIFY]

Replace the full page with a simple redirect:
```typescript
import { redirect } from "next/navigation";
export default function DatenschutzPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/privacy`);
}
```

> ⚠️ **BE CAREFUL**: The CookieBanner currently links to `/${locale}/datenschutz` — after this redirect it will still work (redirect → `/privacy`). But Phase 7 will fix the link directly.

---

## 🤖 Phase 4 — TOS Version Constant [NEW]
**File**: `lib/tos-version.ts` [NEW]

```typescript
// Current T&S version string. Update this when publishing new T&S.
// Format: YYYY-MM-DD-vN
export const CURRENT_TOS_VERSION = "2026-03-23-v1";

// Human-readable effective date for display
export const TOS_EFFECTIVE_DATE = "23. März 2026 / 23 March 2026";
```

> ⚠️ **BE CAREFUL**: This is the single source of truth for the TOS version. The TOSUpdateBanner (Phase 6) imports from here. When the user updates the T&S in the future, they change ONLY this string — no other file needs to change.

---

## 🤖 Phase 5 — `/api/tos/accept` Route [NEW]
**File**: `app/api/tos/accept/route.ts` [NEW]

```typescript
// POST — records that the current user accepted the current TOS version
// Security: auth required, rate limited, validates version string
// Updates: profiles.tos_accepted_version, profiles.tos_accepted_at
```

Full security stack: feature flag check → auth → ban check → rate limit (bookingLimiter) → validate body (version string must match CURRENT_TOS_VERSION) → upsert to profiles.
Returns `{ success: true }` on success.

> ⚠️ **BE CAREFUL**: Use `getSession()` NOT `getUser()` (Rule 25). Validate that the version string in the request body matches `CURRENT_TOS_VERSION` — reject any other value with 400.

---

## 🤖 Phase 6 — `TOSUpdateBanner` Component [NEW]
**Files**:
- `components/ui/TOSUpdateBanner.tsx` [NEW] — client component
- `app/[locale]/layout.tsx` [MODIFY] — add `<TOSUpdateBanner />` after `<CookieBanner />`

**Logic**:
1. On mount, fetch current user session from Supabase client
2. If no session → return null (not logged in, no banner needed)
3. Fetch user's `tos_accepted_version` from `profiles`
4. If `tos_accepted_version === CURRENT_TOS_VERSION` → return null (up to date)
5. If `tos_accepted_version` is null or outdated → show banner

**Banner UI** (fixed top, full-width, warm amber/coral):
- Text: "Wir haben unsere AGB aktualisiert. Bitte akzeptiere die neuen Bedingungen, um fortzufahren. / We've updated our Terms of Service. Please accept the new terms to continue."
- Link to `/terms` (opens in new tab)
- "Akzeptieren / Accept" button → calls `/api/tos/accept` → hides banner on success

> ⚠️ **BE CAREFUL**: This is a `"use client"` component. Do NOT call Supabase server client here — use the browser client (`createBrowserClient`). The banner should NOT block navigation (no modal overlay) — it's a dismissible top strip. Import `CURRENT_TOS_VERSION` from `@/lib/tos-version`.

---

## 🤖 Phase 7 — CookieBanner Cleanup [MODIFY]
**File**: `components/ui/CookieBanner.tsx` [MODIFY]

Two changes:
Fix link: `/datenschutz` → `/privacy`
Remove Marketing toggle entirely — it doesn't exist yet

```typescript
// ✅ AFTER
type ConsentState = { necessary: true; analytics: boolean };
// Remove: marketing state, setMarketing, marketing toggle JSX block
// acceptAll: { necessary: true, analytics: true }
// rejectAll: { necessary: true, analytics: false }
// saveSettings: { necessary: true, analytics }
```

> ⚠️ **BE CAREFUL**: The ConsentState type is stored in localStorage as JSON under key `solen_cookie_consent`. Removing marketing is backwards-compatible — stored objects with marketing key will still parse fine; the new code just ignores it. Do NOT change the `CONSENT_KEY` constant. Do NOT restructure any other part of the component.

---

## 🤖 Phase 8 — Admin TOS Notify API [NEW]
**File**: `app/api/admin/tos-notify/route.ts` [NEW]

POST endpoint (admin-only). Sends Resend emails to all users whose `tos_accepted_version != CURRENT_TOS_VERSION` OR is NULL.
Pagination: processes 100 users per call to avoid timeout. Returns `{ sent: N, skipped: M, nextOffset: K }` for the caller to paginate.

Email content (via Resend):
- Subject: "solen.ch — Unsere AGB wurden aktualisiert / Terms of Service Updated"
- Body: brief bilingual notice + link to `/terms`

> ⚠️ **BE CAREFUL**: This must check `profile.role === 'admin'` from the database (not from JWT claim). Never send to users who already have `tos_accepted_version === CURRENT_TOS_VERSION`. Log the admin action to `audit_log`.

---

## 🤖 Phase 9 — CLAUDE.md + Smoke Test [MODIFY]
**File**: `CLAUDE.md` [MODIFY]

Add to Section 3.2 (Key Directories):
- `lib/tos-version.ts` — TOS version constant

Add to Section 6 (Schema):
- `profiles` table: new columns `tos_accepted_version TEXT`, `tos_accepted_at TIMESTAMPTZ`

> ⚠️ **BE CAREFUL**: Add to Section 3.5 (Key Features):
- "T&S Versioning: `tos_accepted_version` on profiles, `TOSUpdateBanner` shown to users with outdated acceptance, admin notify API at `/api/admin/tos-notify`"

---

## Dependency Ordering (R6)
| Step | Type | What | Depends On |
|---|---|---|---|
| Manual 0 | 🧑 | Verify RESEND_API_KEY in Vercel | Nothing |
| Phase 1 | 🤖 | DB migration | Nothing |
| Phase 2 | 🤖 | `/privacy` page | Nothing |
| Phase 3 | 🤖 | Redirect `/datenschutz` | Phase 2 |
| Phase 4 | 🤖 | `lib/tos-version.ts` | Nothing |
| Phase 5 | 🤖 | `/api/tos/accept` | Phase 1 + Phase 4 |
| Phase 6 | 🤖 | `TOSUpdateBanner` | Phase 5 |
| Phase 7 | 🤖 | CookieBanner link fix | Phase 2 |
| Phase 8 | 🤖 | Admin TOS notify API | Phase 1 + Phase 4 |
| Phase 9 | 🤖 | CLAUDE.md update | All above |
