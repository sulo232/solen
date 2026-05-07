# Structural Consistency Rules (MANDATORY)

> **CONTEXT**: On 2026-03-25, a deep audit found 7 orphaned components never rendered anywhere, 3 features with backend APIs but no complete UI flow, 40+ files using a banned hover token, and a critical naming collision between an old and new `FilterBar.tsx`. These rules prevent structural chaos from recurring.

---

## Rule 40: FEATURE COMPLETENESS CHECKLIST (MANDATORY FOR ALL NEW FEATURES)

> **INCIDENT**: Gift Cards, Loyalty, Referral, and Salon Comparison all had backend APIs built but incomplete frontend flows. `WaitlistModal.tsx` was built but never rendered on any page.

Every new feature MUST have ALL of these layers completed before being considered "done". If any layer is missing, add the feature to `_tasks/INCOMPLETE_FEATURES.md`.

**Checklist — every feature needs:**

| Layer | What | Example |
|---|---|---|
| 1 **Types** | Interface/type in `lib/types.ts` | `CustomerPreferences`, `PricingRule` |
| 2 **DB** | Migration in `supabase/migrations/` | `add_customer_preferences.sql` |
| 3 **API** | Route(s) in `app/api/` | `app/api/preferences/route.ts` |
| 4 **Component** | UI in `components/` | `PreferencesForm.tsx` |
| 5 **Page** | Rendered in `app/[locale]/` | `app/[locale]/profile/preferences/page.tsx` |
| 6 **i18n** | Keys in ALL 4 locale files | `messages/{de,en,fr,it}.json` |
| 7 **Import** | Component imported + rendered in a page | `import PreferencesForm from "@/components/..."` |
| 8 **Navigation** | Entry point exists (link/button to reach the page) | Nav link, settings button, CTA on profile |

```bash
# Verification — find orphaned components (imported nowhere):
for f in components/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "$name.tsx" | wc -l)
  if [ "$count" -eq 0 ]; then echo "ORPHANED: $f"; fi
done
```

**If you build a component but its page/route isn't ready yet:**
1. Do NOT leave it in `components/` silently
2. Add it to `_tasks/INCOMPLETE_FEATURES.md` with a note: "Component built, page pending"
3. Move it to `components/_staging/` until it's wired

---

## Rule 41: COMPONENT LIFECYCLE — NO ORPHANS

> **INCIDENT**: 7 components (`CompareBar`, `CompareDrawer`, `WeatherBanner`, `WaitlistModal`, `TutorialTour`, `RecommendedSalons`, `QuartierTile`) existed for months without being imported by any page.

**Rules:**
1. **NEVER** create a component without simultaneously creating or modifying the page that renders it.
2. If a component must be created ahead of its page (infrastructure work), place it in `components/_staging/` — NOT in the main `components/` directory.
3. When removing a component's page or render, also move the component to `components/_archive/` and remove it from `components/index.ts`.
4. **Barrel exports** in `components/index.ts`: only include components that are actively imported by at least one page. Dead exports bloat the barrel.

---

## Rule 42: SUB-SITE / FEATURE PAGE TEMPLATE (MANDATORY STRUCTURE)

> **INCIDENT**: Different features used wildly different structures — some had API routes but no page, some had pages but no navigation entry point, some had components with hardcoded German.

When building a **new feature page** (e.g., `/profile/referral`, `/loyalty/stamp`, `/salon/[slug]/gift-card`), follow this exact structure:

```
Feature: [Name]
├── app/[locale]/[feature]/page.tsx          ← Server Component (data fetching)
│   └── imports FeatureClient.tsx            ← Client Component (interactivity)
├── components/[feature]/FeatureClient.tsx   ← "use client", uses useTranslations()
├── app/api/[feature]/route.ts              ← API route with Zod validation
├── lib/types.ts                            ← Types/interfaces (append, don't replace)
├── messages/de.json                        ← German translation keys
├── messages/en.json                        ← English translation keys
├── messages/fr.json                        ← French translation keys
├── messages/it.json                        ← Italian translation keys
└── supabase/migrations/XXX_[feature].sql   ← DB migration (if new table/column)
```

**Mandatory rules for every new page:**
- Page component MUST follow the layout grammar in `_tasks/SOLEN_DESIGN.md` §20 (Q-locks); zone language retired (CLAUDE.md retired list)
- All user-facing text MUST use `useTranslations()` — zero hardcoded strings
- All interactive elements MUST have `aria-label` props
- Navigation entry point (link/button) MUST exist to reach the page — no hidden pages
- API routes MUST use Zod validation (`lib/validations.ts`)

---

## Rule 43: INTERACTION STANDARD — HOVER, ACTIVE, FOCUS

> **INCIDENT**: Cards used 5 different hover patterns. Buttons used `hover:bg-s-brand/90` everywhere (banned) instead of `hover:brightness-[1.06]`.

> For complete interaction patterns with code examples, see `_tasks/SOLEN_LIVE_TRUTH.md` §5b (depth) + §5c (motion) + `_rules/SOLEN_UI.md`. (V3 lock: V2-D15-3 — `s-brand` is the V3 token, `s-coral` retained as backward-compat alias resolving to the same teal value.)

**Quick reference (V3):**
- **Cards**: `hover:-translate-y-[5px]` + shadow lift. NEVER: `hover:scale-*`, `hover:opacity-*`
- **CTA Buttons**: `hover:brightness-[1.06] active:scale-[0.98]`. NEVER: `hover:bg-s-brand/90` or opacity-modulated brand bg
- **Ghost Buttons**: `hover:border-s-brand/40 hover:text-s-brand active:scale-[0.98]`
- **Text Links**: `hover:text-s-brand transition-colors duration-150`
- **Filter Pills (general)**: Active = weight 700 + `text-s-ink` (selection by weight + ink, NOT brand-color flood — per LIVE_TRUTH §5h.7 + SOLEN_UI). Inactive = `font-medium text-s-ink-2 bg-s-ink/[0.05] hover:bg-s-ink/[0.09]`. **EXCEPTION:** filter pills on category pages use the category combo per LIVE_TRUTH §25.5.
- **Images in cards**: No separate hover effect — card elevation handles it

---

## Rule 44: NAMING COLLISION PREVENTION

> **INCIDENT**: `components/FilterBar.tsx` (287 lines, old) existed when a roadmap tried to create a NEW `components/ui/FilterBar.tsx`. Import ambiguity and barrel export conflicts followed.

**Rules:**
1. Before creating a new component, **ALWAYS search** for an existing component with the same name:
   ```bash
   find components/ -name "YourComponentName*" -type f
   grep -rn "YourComponentName" components/index.ts
   ```
2. If a component with the same name exists:
   - If it's **legacy/non-compliant** → rename it first and update all imports BEFORE creating the new one
   - If it's **active and working** → extend it instead of creating a duplicate (Rule 8: NEVER REBUILD)
3. **File naming**: Component names must be unique across ALL of `components/` (including subdirectories).
4. **Barrel exports**: `components/index.ts` must have ZERO duplicate export names.

---

## Rule 45: INCOMPLETE FEATURES DOCUMENTATION

> **INCIDENT**: Gift Cards, Loyalty, Referral, Comparison, Weather, and Waitlist all had backend code built but no one documented what was done vs. what was missing.

**Rules:**
1. `_tasks/INCOMPLETE_FEATURES.md` is the **mandatory registry** for any feature that has been partially built.
2. When you build an API route without a complete UI flow → add it to this file immediately.
3. When you build a component that isn't rendered yet → add it to this file immediately.
4. Format:
   ```markdown
   ## [Feature Name]
   - **Backend**: [what exists — API routes, DB tables]
   - **Frontend**: [what exists — components, pages]
   - **Missing**: [specific gaps — "no checkout integration", "no navigation entry point"]
   - **Priority**: [HIGH/MEDIUM/LOW]
   ```
5. Before starting a NEW roadmap for a feature, **ALWAYS check `_tasks/INCOMPLETE_FEATURES.md` first** to avoid rebuilding what already exists.
6. When a feature becomes complete (all 8 layers from Rule 40 done), remove it from this file and add a `[x] Completed` note.

---

## Rule 46: NEW COMPONENT / SUB-SITE CREATION STANDARD (MANDATORY)

> **INCIDENT**: On 2026-03-26, a scan found ~145 components without `useTranslations()`, 45+ hardcoded white `rgba(255,255,255,...)` glass backgrounds (glass-everywhere violation per §6), and inconsistent hover/interaction patterns.

**EVERY new `.tsx` component file MUST satisfy ALL of these requirements before committing. No exceptions.**

### A. Internationalization (i18n) — ALL 4 LANGUAGES
- Import and use `useTranslations()` (client) or `getTranslations()` (server) — NEVER hardcode text
- Add keys to ALL 4 locale files with ACTUAL translations (not empty strings or German copies)

### B. Single Light Theme (dark mode retired)
- Page bg = white `#FFFFFF` per Q15 (NOT banned — `bg-white` is correct on the page surface)
- BANNED: `text-black` (use `text-s-ink` `#1A1209` warm-ink), `dark:*` utility classes (dark mode killed per Q62)
- Glass restricted to §6 sanctioned contexts only (nav pill / hero card overlay / trust strip) — NOT a default surface treatment

### C. Layout Grammar (zone language retired)
- Every component follows the section grammar in `_tasks/SOLEN_DESIGN.md` §20 (Q15/Q23/Q49/Q50/Q51/Q52)
- Glass: §6 3-place cap (nav, hero card overlay, trust strip)
- Hover: Q40 4-class scope only (CTAs, links, cards, nav-icons)
- Motion: Q35 timing scale (200ms slide / 400ms morph for shared-element)

### D. UI Rules Compliance
- Read `_tasks/SOLEN_DESIGN.md` (Q-locks §20) before writing ANY styling; supplemental: `_rules/SOLEN_UI.md`
- Only use design tokens for colors, fonts, radii, shadows, icons

### E. Interaction Standard
- Follow the interaction patterns in Rule 43 and `_tasks/SOLEN_DESIGN.md` §20 (Q40 hover, Q47 focus, Q46 hit area)

### F. Accessibility
- Every interactive element needs `aria-label={t('...')}`
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`

### G. Pre-Commit Checklist
```
Design:
□ DESIGN INTENT stated: "This component should feel ___ because ___"
□ Uses useTranslations() — ZERO hardcoded strings
□ Keys added to all 4 locale files with actual translations
□ Layout follows the relevant Q-lock(s) in `_tasks/SOLEN_DESIGN.md` §20
□ Glass only in §6 sanctioned contexts (nav / hero card overlay / trust strip); everywhere else use solid `--raised`/`--bg`
□ Hover states follow Rule 43 + Q40 4-class scope
□ Only lucide-react icons
□ Interactive elements have aria-label
□ npm run build passes
□ Component is imported + rendered by a page (Rule 41)

Animation (anti-slop):
□ Entering elements start from scale(0.95+) not scale(0)
□ Transitions name specific properties — never transition-all
□ Easing is ease-out — never ease-in for entering elements
□ All UI animation durations ≤ 300ms
□ Every pressable element has active:scale-[0.97] or active:scale-[0.98]
```

If you cannot satisfy all items, move to `components/_staging/` and log in `_tasks/INCOMPLETE_FEATURES.md`.

---

## Rule 47: HOMEPAGE LAYOUT — see SOLEN_LIVE_TRUTH.md

> **V3 LOCK (V2-D15-3, 2026-05-07):** Homepage spec is locked in `_tasks/SOLEN_LIVE_TRUTH.md` §13 (Hero) + §15 (Section header pattern) + §16 (Salon card) + §19 (City tiles) + §20 (B2B card) + §21 (Footer) + §22 (Browse-by-city link wall) + §23 (Homepage flow). Live preview: `public/solen-v2-republik-teal.html`.
>
> **V3 foundation:**
> - Page bg: white `#FFFFFF` (substrate is permanent)
> - Brand: dark teal `#043338` (V0 coral, V1 forest green, V2 orange all retired)
> - Fonts: Cooper BT (display ONLY — hero h1, logo, feature h2, category panel h1) + ITC Avant Garde Gothic Std (everything else). Free fallbacks: Sansita 900 + League Spartan + Inter Tight. (Anton, Figtree, Bricolage, Inter Tight as primary, Bebas Neue, Fraunces, DM Sans, Peace Sans, Open Sauce Sans all retired)
> - Hero pattern: white substrate + atmospheric wash (cyan core + navy framing) + Cooper-display h1 + ONE accent word in brand teal + Avant Garde body deck + brand-teal CTA pill
> - 4 categories: Coiffeur Z, Barbershop G, Nails A, Spa & Wellness I (Makeup retired, Wellness merged)
> - Dark mode: retired (single light theme)
>
> **Retired V5 spec:** Warm Beige `#F5F0EB`, Bebas Neue 42px, glass-frost header, Coral `#E8735A`, footer `#2C2825` — all gone. Q-locks Q15/Q23/Q48/Q49/Q50/Q51/Q62 from SOLEN_DESIGN.md §20 are historical context only; V3 lock supersedes any conflict.

For homepage layout decisions, **read `_tasks/SOLEN_DESIGN.md` §20** (Q15, Q23, Q48–Q51).

---

## Established Patterns (MANDATORY)

### Pattern A: Coming Soon Page
`app/[locale]/coming-soon/page.tsx` is the standard template for features not yet ready for production.
- New features that aren't complete should redirect here via `middleware.ts` using the `COMING_SOON_ROUTES` array.
- Add `?feature=featureName` to the redirect URL so the page shows the correct icon, color, and description.
- Email capture POSTs to `/api/coming-soon-notify` (does NOT require auth).

### Pattern B: Auth Guard on Profile Fetches
Always check `r.ok` BEFORE calling `r.json()` on any `/api/profile` fetch. Never `.catch(() => {})` silently on auth flows.

```tsx
// CORRECT — redirect immediately, log errors
fetch("/api/profile")
  .then((r) => {
    if (!r.ok) {
      if (!cancelled) router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return null;
    }
    return r.json();
  })
  .then((p) => { if (cancelled || !p) return; /* use p */ })
  .catch((err) => {
    console.error("[PageName] Auth fetch error:", err);
    if (!cancelled) router.push(`/${locale}/auth/login`);
  });
```

### Pattern C: Page Transition Crossfade
Use `PageTransitionWrapper` to add smooth opacity crossfade (200ms) between route navigations.
- **Location**: `components/layout/PageTransitionWrapper.tsx` + `components/layout/PageTransition.tsx`
- Wrap page content in the layout.tsx. Uses `usePathname()` to detect route changes and triggers 200ms opacity fade via Framer Motion's `AnimatePresence`.

### Pattern D: Account Deletion (GDPR Soft Delete + Grace Period)
- API sets `deletion_requested_at` timestamp + suspends account immediately
- Cron job (`app/api/cron/process-deletions/route.ts`) runs daily and permanently deletes accounts after 30 days
- User can cancel deletion by logging in during grace period
- Modal requires exact confirmation text "DELETE MY ACCOUNT"
- Block deletion if user has active bookings
- **Location**: `app/api/profile/delete/route.ts` (API), `components/profile/DeleteAccountModal.tsx` (UI)

### Pattern E: Modal-Based Settings Actions
For destructive or sensitive profile actions, use a dedicated modal component rather than inline confirmations.
- Create a separate memo component accepting `open` and `onClose` props
- Manage modal state in parent component
- Render modal after all other UI elements to maintain layering
