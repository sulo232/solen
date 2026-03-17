# 🏠 Homepage & Sub-site Overhaul Roadmap — RENEWED
**Last audited: 2026-03-17 14:50 CET**
**For Claude Code — Each numbered section = one prompt. Do not combine.**

---

## 🛑 STOP AND READ BEFORE DOING ANYTHING 🛑

### Pre-Flight Checklist (MANDATORY before every sub-phase)
```
1. Read CLAUDE.md Section 10 (Code Safety Rules) — MANDATORY
2. Read UI_RULES.md — MANDATORY
3. Verify that EVERY import in your code points to a file that EXISTS:
   ls -la components/[Name].tsx    ← if this returns "No such file", DO NOT import it
4. Verify that EVERY fetch("/api/...") calls a route that EXISTS:
   ls -la app/api/[route]/route.ts ← if this returns "No such file", DO NOT call it
5. npm run build MUST pass before git commit
6. ONE commit per sub-phase. NEVER combine multiple phases.
7. After pushing, wait 45s then check: curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
   Must return 200 or 308.
```

### 🚫 BANNED PATTERNS — Instant failure if you do any of these:
| ❌ Banned | ✅ Do Instead |
|-----------|---------------|
| Importing a component that doesn't exist | `ls -la components/[Name].tsx` FIRST. If missing, build inline or create the file FIRST |
| Calling an API route that doesn't exist | `ls -la app/api/[route]/route.ts` FIRST |
| Combining all phases into one mega-commit | ONE commit per sub-phase |
| Ad-libbing features not in the roadmap | Build ONLY what this roadmap specifies |
| Using emoji characters as UI icons | Use `lucide-react` icons ONLY |
| Using `export default` in config files | Use `module.exports` — project has NO `"type"` field in package.json (defaults to CJS) |

### Components That EXIST (safe to import):
```
components/layout/Header.tsx     ✅
components/layout/Footer.tsx     ✅
components/HomePage.tsx          ✅
components/CategoryPage.tsx      ✅
components/SalonCard.tsx         ✅
components/FilterBar.tsx         ✅
components/ui/Spinner.tsx        ✅
components/ui/EmptyState.tsx     ✅
components/ui/GlassCard.tsx      ✅
components/ui/AnimatedButton.tsx ✅
components/ui/Toast.tsx          ✅
components/PostHogProvider.tsx   ✅
```

### API Routes That EXIST (safe to call):
```
/api/salons           ✅ GET — returns { items, total, page, limit }
/api/directory        ✅ GET — returns { items, total, page, limit } (⚠️ currently 500 — needs fix)
/api/analytics/salon/[id]     ✅ GET
/api/analytics/platform       ✅ GET
/api/analytics/track-view     ✅ POST
/api/stripe/*                 ✅ Payment routes
```

---

> **⚠️ DESIGN RULES ⚠️**
> - **Light Mode Only.** Clean glassmorphism only.
> - **Fonts:** Syne (headings), DM Sans (body), Space Grotesk (data/numbers)
> - **Colors:** Teal `#4ECDC4`, Coral `#FF6B6B`, Dark `#1A1A2E`
> - **Icons:** `lucide-react` only. No emojis as UI elements.
> - **Animations:** `framer-motion` only. Smooth 300-400ms transitions.
> - **DO NOT rebuild existing components.** Reuse the ones listed above.
> - **DO NOT touch `supabase/` or `lib/supabase.ts` unless explicitly told.**
> - **Config files MUST use `module.exports` (CJS), NOT `export default` (ESM)**

---

## 🔁 Status Check Protocol
**After EVERY sub-phase:**

```bash
# 1. Build check
npm run build

# 2. If build passes, commit + push
git add -A && git commit -m "phase X.Y: [description]" && git push origin main

# 3. Wait for Vercel deployment
sleep 45
npx vercel ls 2>&1 | head -5
# Confirm status is "● Ready"

# 4. Live site check
curl -s -o /dev/null -w "%{http_code}" -L https://www.solen.ch/de/
# Must return 200
```

> **If any check fails: STOP. Fix the issue before moving to the next sub-phase.**

---

# ✅ PHASE 1 — COMPLETED: Fix Layout & Global Header

| Sub-phase | Status | What was done |
|-----------|--------|---------------|
| 1.1 Fix Layout | ✅ DONE | Removed `overflow: hidden` from body in `layout.tsx` |
| 1.2 Global Header | ✅ DONE | `Header.tsx` is rendered in `layout.tsx` inside `NextIntlClientProvider` |
| 1.3 Header i18n Keys | ✅ DONE | All nav keys present in `messages/de.json` (13 keys) |

---

# ✅ PHASE 2 — COMPLETED: Build Homepage

| Sub-phase | Status | What was done |
|-----------|--------|---------------|
| 2.1 Replace iframe | ✅ DONE | `page.tsx` renders `<HomePage />`, no more iframe |
| 2.2 Hero Section | ✅ DONE | Teal mesh gradient, big heading, subtitle, centered |
| 2.3 Category Grid | ✅ DONE | 6 icon cards in grid, links to each category |
| 2.4 Featured Salons | ✅ DONE | Horizontal swipable carousel using `SalonCard` |
| 2.5 Last-Minute Teaser | ✅ DONE | Coral accent section with CTA link |
| 2.6 Quartier Section | ✅ DONE | Swipable Quartier cards |
| 2.7 Full Footer | ✅ DONE | `Footer.tsx` with 4 columns, dark background |
| 2.8 Mobile Responsiveness | ⚠️ NEEDS AUDIT | Not verified on mobile |

---

# ⚠️ PHASE 3 — PARTIALLY DONE: Fix & Polish Category Sub-sites

| Sub-phase | Status | Details |
|-----------|--------|---------|
| 3.1 API Error Handling | ✅ DONE | Both `/api/salons` and `/api/directory` return graceful empty `{items:[], total:0}` on error |
| 3.2 Directory "Nicht buchbar" Badge | ✅ DONE | Mixed grid, coral badge, muted directory cards |
| 3.3 Sort Dropdown | ✅ DONE | 4 sort options (Beliebteste, Preis, Nächste, Neueste) |
| 3.4 Price Display on SalonCard | ✅ DONE | Shows `Ø CHF X` using Space Grotesk |
| 3.5 Verify All Category Pages | ⚠️ NEEDS FIX | All 7 routes return 200 BUT `/api/directory` returns 500 on live (see 3.6) |

## 3.6 — 🔴 FIX: `/api/directory` Returns 500 on Live [NEW — CRITICAL]
**File: `app/api/directory/route.ts`**

The `/api/directory` endpoint returns 500 on the live site. The graceful error handler catches it and returns `{items:[], total:0}`, but the root cause is that `createAdminSupabaseClient()` may be failing because `SUPABASE_SERVICE_ROLE_KEY` is not set in Vercel environment variables.

- [ ] Check if `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel: go to Vercel Dashboard → Settings → Environment Variables
- [ ] If NOT set: this is a **manual user action** — set the env var in Vercel dashboard
- [ ] If the env var IS set: add better error logging to debug the actual Supabase error:
  ```ts
  try {
    const admin = createAdminSupabaseClient();
    // ... query
  } catch (err) {
    console.error("[api/directory] FATAL:", err);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }
  ```
- [ ] **Alternative fix:** Consider using the regular (anon) Supabase client instead of admin since this is a public endpoint that reads public data — no admin key needed:
  ```ts
  import { createClient } from "@/lib/supabase-server"; // or the anon client
  ```
- [ ] After fix: verify `curl https://www.solen.ch/api/directory?category=barbershop` returns actual data

**After 3.6 → Run Status Check Protocol. Category pages should show real directory entries.**

---

# ✅ PHASE 4 — COMPLETED: Analytics Algorithm + Admin Panel

| Sub-phase | Status | What was done |
|-----------|--------|---------------|
| 4.1 Database: Analytics Tables | ✅ DONE | Migration `017_salon_analytics.sql` created |
| 4.2 API: Analytics Endpoints | ✅ DONE | `/api/analytics/salon/[id]`, `/platform`, `/track-view` exist |
| 4.3 Nightly Analytics Computation | ✅ DONE | Edge function `compute-analytics/index.ts` created |
| 4.4 Admin Panel: Platform Analytics | ✅ DONE | Page at `dashboard/platform-analytics/page.tsx` |
| 4.5 Admin Nav Link | ✅ DONE | "Plattform Statistiken" link in `DashboardLayout.tsx` |

> **Note:** Analytics tables may still need to be migrated to production Supabase. Verify the migration has been applied.

---

# ✅ PHASE 5 — COMPLETED: Page View Tracking + PostHog

| Sub-phase | Status | What was done |
|-----------|--------|---------------|
| 5.1 Track Salon Page Views | ✅ DONE | `salon/[slug]/page.tsx` calls `/api/analytics/track-view` on mount |
| 5.2 PostHog Integration | ✅ DONE | `posthog-js` installed, `PostHogProvider` in layout |

---

# ⚠️ PHASE 6 — PARTIALLY DONE: Payment (TWINT + Apple Pay)

| Sub-phase | Status | Details |
|-----------|--------|---------|
| 6.1 Enable Payment Methods in Stripe | 🟡 MANUAL | User must enable TWINT + Apple Pay in Stripe Dashboard |
| 6.2 Apple Pay Domain Verification | ✅ DONE | File exists at `public/.well-known/apple-developer-merchantid-domain-association` |
| 6.3 Verify Checkout UI | ⚠️ NEEDS CHECK | Trust badges may need updating to include TWINT/Google Pay |
| 6.4 End-to-End Payment Test | ⏳ NOT DONE | Requires manual testing by user |

## 6.3 — Verify Checkout UI Trust Badges
**File: `app/[locale]/checkout/page.tsx`**

- [ ] Open the checkout page and verify `<PaymentElement>` shows all enabled methods
- [ ] Update trust badge text to include "TWINT, Apple Pay, Google Pay" (if not already)
- [ ] Verify the booking summary + deposit info displays correctly

**After 6.3 → Run Status Check Protocol.**

---

# ⏳ PHASE 7 — NOT STARTED: Final Polish & Cross-Page Audit

## 7.1 — Header Consistency Check
- [ ] Open each page type and verify Header renders correctly:
  - `/de/` (Homepage)
  - `/de/barbershop`, `/de/coiffeur`, `/de/nails`, `/de/spa`, `/de/makeup`, `/de/waxing`
  - `/de/last-minute`
  - `/de/salon/[any-slug]`
  - `/de/account`
  - `/de/auth/login`, `/de/auth/register`
  - `/de/dashboard`
- [ ] Active nav link is highlighted teal
- [ ] Scroll: header glass transition works (bg-white/80 + backdrop-blur)

## 7.2 — Mobile Audit
- [ ] Test homepage on mobile (375px):
  - Hero heading responsive
  - Category grid: 2 columns
  - Featured salons: horizontal swipe
  - Quartier cards: horizontal swipe
  - Footer stacks properly
- [ ] Test on tablet (768px)
- [ ] No horizontal page overflow on any page
- [ ] Hamburger menu opens and all links work

## 7.3 — Remove Monolith References
- [ ] `app/[locale]/page.tsx` no longer has iframe ✓ (DONE)
- [ ] Keep `public/home.html` as backup (DO NOT DELETE)
- [ ] Remove `src/react-entry.tsx` if causing 404s
- [ ] Clean up any console errors in browser dev tools

## 7.4 — Final Vercel + PostHog Status Check
```bash
# All routes return 200
for r in "" barbershop coiffeur nails spa makeup waxing last-minute; do
  echo "/de/$r → $(curl -s -o /dev/null -w '%{http_code}' -L https://www.solen.ch/de/$r)"
done

# PostHog: check events flowing
# Stripe: check webhooks
```

---

## 📊 Summary

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 1** — Layout & Header | ✅ DONE | All complete |
| **Phase 2** — Build Homepage | ✅ DONE | Mobile audit still needed (7.2) |
| **Phase 3** — Category Sub-sites | ⚠️ 90% DONE | `/api/directory` 500 on live (3.6) |
| **Phase 4** — Analytics + Admin | ✅ DONE | DB migration may need applying to prod |
| **Phase 5** — Tracking + PostHog | ✅ DONE | All complete |
| **Phase 6** — Payment | 🟡 60% DONE | User manual steps (Stripe) + checkout UI verify |
| **Phase 7** — Final Polish | ⏳ 0% DONE | Header check, mobile audit, cleanup |

---

## File Reference

| File | Status | Phase |
|------|--------|-------|
| `app/[locale]/layout.tsx` | ✅ Fixed | 1.1–1.2 |
| `messages/de.json` etc. | ✅ Done | 1.3 |
| `app/[locale]/page.tsx` | ✅ Done | 2.1 |
| `components/HomePage.tsx` | ✅ Built | 2.2–2.6 |
| `components/layout/Footer.tsx` | ✅ Built | 2.7 |
| `app/api/salons/route.ts` | ✅ Fixed | 3.1 |
| `app/api/directory/route.ts` | ⚠️ 500 on live | 3.6 |
| `components/CategoryPage.tsx` | ✅ Done | 3.2 |
| `components/FilterBar.tsx` | ✅ Done | 3.3 |
| `components/SalonCard.tsx` | ✅ Done | 3.4 |
| `supabase/migrations/017_salon_analytics.sql` | ✅ Created | 4.1 |
| `app/api/analytics/*/route.ts` | ✅ Created | 4.2 |
| `supabase/functions/compute-analytics/` | ✅ Created | 4.3 |
| `app/[locale]/dashboard/platform-analytics/page.tsx` | ✅ Created | 4.4 |
| `components/dashboard/DashboardLayout.tsx` | ✅ Updated | 4.5 |
| `app/[locale]/salon/[slug]/page.tsx` | ✅ Updated | 5.1 |
| `postcss.config.js` | ✅ Fixed | Infra |
| `tailwind.config.js` | ✅ Fixed | Infra |
