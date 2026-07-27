# Structural Consistency Rules (MANDATORY)

> PARTIAL RETIREMENT (2026-07-03): references to _tasks/SOLEN_DESIGN.md (rules 43, 46, 47) are superseded by _design-system/SOURCE.md + LOCKFILE.md. The rule 46 dark-mode CSS variable requirement is superseded: Solen web is light-mode only. All other rules stay live.
>
> TOMBSTONE, ZONE LANGUAGE (2026-07-11): Rule 42's "Page component MUST determine its **zone** (1-4) and pass it to child components as `zone` prop" and Rule 46's sub-section C ("Zone Compliance") are RETIRED. "V2" / "Zone 1/2/3/4" language is retired project-wide per `_design-system/SOURCE.md` (line ~318) and `_rules/I18N_ROUTING.md`; nothing in the live codebase implements a `zone` prop. Do not require or grep for it. The rest of rules 42 and 46 (directory structure, i18n, a11y, accessibility, pre-commit checklist) stay live.

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
>
> This is the file-tree TEMPLATE for a new feature page. It covers the same ground as the 8-layer
> completeness CHECKLIST in Rule 40 (types/DB/API/component/page/i18n/import/nav) , Rule 40 is
> canonical for "is this feature done", this rule is canonical for "where do the files go". Don't
> restate Rule 40's checklist here if it changes; point back to it.

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
- ~~Page component MUST determine its **zone** (1-4) and pass it to child components as `zone` prop~~ RETIRED 2026-07-11, see banner at top of file , no `zone` prop exists in the live codebase
- All user-facing text MUST use `useTranslations()` — zero hardcoded strings
- All interactive elements MUST have `aria-label` props
- Navigation entry point (link/button) MUST exist to reach the page — no hidden pages
- API routes MUST use Zod validation (`lib/validations.ts`)

---

## Rule 43: INTERACTION STANDARD — IN FLUX

The hover / active / focus patterns are being iterated alongside the design system. **Don't cite the previous locked patterns** (`hover:brightness-[1.06]`, `hover:-translate-y-[5px]`, specific `s-coral` references, etc.) as authoritative — ask before assuming, or read `_tasks/SOLEN_DESIGN.md` for current rules.

Previous spec archived at `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

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

> **INCIDENT**: On 2026-03-26, a scan found ~145 components without `useTranslations()`, 45+ hardcoded white `rgba(255,255,255,...)` glass backgrounds that broke dark mode, and inconsistent hover/interaction patterns.

**EVERY new `.tsx` component file MUST satisfy ALL of these requirements before committing. No exceptions.**

### A. Internationalization (i18n) — ALL 4 LANGUAGES
- Import and use `useTranslations()` (client) or `getTranslations()` (server) — NEVER hardcode text
- Add keys to ALL 4 locale files with ACTUAL translations (not empty strings or German copies)

### B. Dark Mode Support — USE CSS VARS FOR GLASS
- Use `var(--glass-bg)` for glass backgrounds, NOT `rgba(255,255,255,...)`
- Use `text-s-ink dark:text-s-dm-text` and `bg-[--raised] dark:bg-s-dm-surface`
- BANNED: `text-black`, raw `bg-white`

### C. Zone Compliance, RETIRED 2026-07-11
> This entire sub-section is retired, see the banner at the top of this file. "Zone 1-4" language
> is retired project-wide; glass/animation scoping now lives in `_design-system/LOCKFILE.md`
> (`CONTROL_ELEVATION.md` decision tree) instead of a per-component zone number.
- ~~Every component that renders visible UI must know its zone (1-4)~~
- ~~Zone 1-2: Glass on floating UI, animations allowed~~
- ~~Zone 3-4: NO glass, NO animations~~

### D. Design System Compliance
- Read `_tasks/SOLEN_DESIGN.md` before writing ANY styling (system is in flux — confirm current values)
- Only use design tokens for colors, fonts, radii, shadows, icons; no arbitrary hex

### E. Interaction Standard
- Follow current interaction patterns from `_tasks/SOLEN_DESIGN.md` (Rule 43 above is currently a stub while the system is in flux)

### F. Accessibility
- Every interactive element needs `aria-label={t('...')}`
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`

### G. Pre-Commit Checklist
```
Design:
□ DESIGN INTENT stated: "This component should feel ___ because ___"
□ Uses useTranslations() — ZERO hardcoded strings
□ Keys added to all 4 locale files with actual translations
□ ~~Has zone prop or inherits zone from parent~~ RETIRED 2026-07-11, no zone prop exists
□ No rgba(255,255,255,...) — uses var(--glass-*) tokens
□ Hover states follow Rule 43
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

## Rule 47: HOMEPAGE SPEC — IN FLUX

The homepage spec (V5) is being replaced. **Don't cite specific hex values, font sizes, or component patterns from the previous V5 spec as authoritative.** Ask the user, or read `_tasks/SOLEN_DESIGN.md` for current rules.

Previous V5 spec archived at `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

---

## Rule 48: STATE OWNERSHIP ORDER (fe-03, 2026-07-27)

> **WHY THIS RULE EXISTS**: 296 of 799 `.ts`/`.tsx` files under `app/` are `"use client"` (37%),
> and 171 files combine `useEffect` with `fetch(` for client-side data loading, against only 190
> files that call `fetch(` anywhere in the whole tree, meaning almost every fetch call in the
> codebase is a client-side one, not a server-fetched prop. Rule 42's file-tree template already
> implies server-fetch-then-pass-props for a BRAND NEW feature page, and it is a real, working
> pattern on the salon PDP and the booking-wizard shell (both RSC-fetch-then-client-render, see
> `_docs/FRONTEND.md`) — but nothing generalizes it into a standing rule for EXISTING surfaces,
> so each new client component re-derives its own fetch/loading/error boilerplate independently
> instead of reading data the server already fetched.

State picks exactly **one** owner, in this priority order:

1. **URL (`searchParams`)** — anything that should be shareable, back-button-safe, or survive a
   refresh: a filter, an active tab, a search query, a selected date. Never hold this in
   component state.
2. **Server Component prop** — anything known at request time and not re-computed per
   interaction is fetched ONCE in the nearest Server Component and passed down as a prop. Never
   re-fetch it client-side with `useEffect` just because the consuming component happens to be
   `"use client"`.
3. **Page-scoped Context/reducer** — anything shared by more than two sibling client components
   on one page (the existing `BookingProvider` pattern, `lib/booking-context.tsx`). Never
   duplicate the same fetched value across sibling components instead of sharing one source.
4. **Local `useState`** — everything else.

**The violation to watch for**: a new client component that calls `fetch()` inside `useEffect`
for data that was ALREADY available on the server at request time. This is a violation unless
the file states why in a comment (e.g. it genuinely depends on a client-only value like
geolocation, or data produced by a just-completed client action that the server never saw).

```tsx
// ❌ VIOLATION — client component re-fetches data the server already had
"use client";
function SalonHoursWidget({ salonId }: { salonId: string }) {
  const [hours, setHours] = useState(null);
  useEffect(() => {
    fetch(`/api/salons/${salonId}/hours`).then(r => r.json()).then(setHours);
  }, [salonId]);
  // ...
}

// ✅ CORRECT — server fetches once, passes down as a prop
// page.tsx (Server Component)
const salon = await getSalon(slug); // includes opening_hours
return <SalonHoursWidget hours={salon.opening_hours} />;

// ✅ CORRECT — a client-only value is a stated exception
"use client";
function NearbySalons() {
  // Exception: geolocation is only available client-side, cannot be
  // fetched server-side at request time.
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => fetchNearby(pos.coords));
  }, []);
}
```

This is a checklist item today (part of Rule 40/46's pre-commit review), not yet a lint rule.
A future gate could flag `useEffect` + `fetch(` in a client component whose parent Server
Component already has access to the same data, but that needs per-case judgment (is the parent
actually a Server Component with the data in scope?) that a mechanical grep can't safely make.

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

### Pattern B.1: Auth-Required Interrupt Preserves the Destination (ia-navigation-03, 2026-07-27)
Every place that redirects an unauthenticated user to `/auth/login` because they attempted a
gated action (heart a look, look up a booking by code, open an intake form, and Pattern B's
profile fetches) MUST append `?redirect=<the current path>`, URL-encoded, exactly like Pattern
B above. `components-legacy/auth/SignIn.tsx` already reads it back and validates it's an
internal relative path before honoring it (open-redirect protection is solved once, centrally).

```tsx
// CORRECT — any auth-required interrupt, not just profile fetches
router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(currentPathAndQuery)}`);
```

A login redirect with no `redirect=` param is acceptable ONLY when the user explicitly
navigated to a generic auth entry point (a "Log in" menu link), never when their own
in-context action is what triggered the redirect. This generalizes Pattern B beyond
`/api/profile` fetches because the same defect (bounce to homepage after login, losing
the action that prompted it) recurred 3 separate times outside Pattern B's scope: Inspo's
save-while-logged-out heart, the guest booking lookup's "log in instead" link, and the
intake-forms page's session check, all fixed in the same pass this rule was written in.

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

---

## Rule 49: SALON SLUG STABILITY (ia-navigation-06, 2026-07-27)

> **STATUS**: a landmine, not a live defect. `app/api/salons/[slug]/route.ts`'s PATCH handler
> performs no slug regeneration today, and no salon-name-edit UI exists yet (grepped, no
> `app/api/dashboard/salon/settings` route, no `salon_slug_redirects`-equivalent table). This
> rule exists so the FIRST such feature is built correctly instead of 404ing every external
> reference to a renamed salon on day one.

A salon's slug, once published, is the load-bearing identifier for every customer-facing
surface: bookmarked PDPs, shared booking links, walk-in queue QR codes, tip-sheet deep links,
and every review/SEO backlink pointing at `/salon/[slug]`. Before ANY feature ships that lets
an owner rename their business, the slug question must be answered as one of exactly two options:

1. **Immutable**: the slug never changes once published, full stop (renaming the display name
   does NOT regenerate the slug), or
2. **Editable with a redirect trail**: an edit flow writes the OLD slug into a
   `salon_slug_redirects` table (old_slug, salon_id, created_at) and every request to an old
   slug serves a 301/`permanentRedirect()` to the current one, forever.

Do not let a `slugify(newName)` default silently regenerate the slug on a name-edit save. This
is the same principle Rule 32 (`_rules/I18N_ROUTING.md`) already applies to killed discovery
routes, extended from route-level URLs to entity-level ones. Enforcement: this is a doc-only
law until a salon-name-edit endpoint exists; that PR must cite this rule and state which of
the two options it implements before it can merge.

---

## Rule 50: REDIRECT OUTCOME IS A NAMED CHOICE, NOT AN ACCIDENT (ia-navigation-08, 2026-07-27)

> **INCIDENT**: three killed Solen features got three different URL outcomes with no record of
> why. `app/[locale]/inspo/nails/page.tsx:9` uses `permanentRedirect()` to the new location
> (matches Rule 32). `app/[locale]/profile/gift-cards/page.tsx:13` uses a plain `redirect()` to
> a parent page. The Pakete/packages feature (`_design-system/REMOVED.md:29`) has no surviving
> page anywhere and falls through to the bare 404 chain with zero explicit routing decision ever
> made for it, just deletion. Rule 32 already mandates `permanentRedirect()`, but only for
> discovery-category routes; nothing generalized it.

When a route is killed, its outcome is chosen from exactly ONE decision tree, not improvised:

- **(a) The concept moved and still exists under a new URL** -> `permanentRedirect()` (308) to
  the new location. This is Rule 32's existing case, generalized beyond discovery categories.
- **(b) The concept is gone but a nearby page is still the right landing spot** -> a plain
  `redirect()` to that page.
- **(c) The concept is entirely gone with no landing spot** -> the route is deleted outright and
  MUST produce the locked 404 page (`app/[locale]/not-found.tsx`, Rule 36), never a bare
  unstyled Next.js default 404 and never silent fall-through with no record of the choice.

Every `_design-system/REMOVED.md` entry for a route deletion must state which of the three
outcomes it chose and why, as a required field in the `npm run removed -- ...` template (see
`_design-system/REMOVED.md`'s entry-format header). Enforcement: the `pre-commit-graveyard.sh`
hook that already blocks a route deletion without a REMOVED.md line should also require that
line to name its redirect outcome.

---

## Rule 51: FILE-SIZE / COMPONENT-SIZE CEILING (fe-05, 2026-07-27)

> **WHY THIS RULE EXISTS**: nothing anywhere in the system stated a size ceiling, and the
> largest files in the tree are 3-6x the size of the next tier down (`SearchTemplate.tsx` at
> ~2400 lines, `dashboard/settings/page.tsx` at ~1580, `dev/primitives/page.tsx` at ~1300) — the
> classic shape of a file that started focused and had every subsequent feature bolted onto the
> same file instead of decomposed. A single file with no stopping point accumulates
> responsibilities indefinitely, and it gets progressively harder for any agent (bounded context
> window) to safely edit without regressions.

A page or component file **exceeding 400 lines** must either:
- be split into named sub-components with single responsibilities (the same way the old
  1145-line salon-detail monolith was split into `SalonDetailV3.tsx` + 17 colocated section
  files, each under 200 lines — see that file's own header comment), or
- carry a one-line comment at the top of the file naming WHY it stays one file (e.g. "this
  composes N tightly-coupled layout regions that share local state X").

A file **exceeding 800 lines** gets its own line in `_tasks/INCOMPLETE_FEATURES.md` as
decomposition debt, with an owner and the reason it hasn't been split yet — the same way any
other incomplete-feature gap is tracked today. Do not silently let an 800+ line file exist with
no record.

This is a checklist item today (part of Rule 40/46's pre-commit review). A future gate could be
a simple `wc -l` check in a PreToolUse hook or CI step that WARNS (not blocks, given the existing
outliers above 800 lines already in the tree) once a file crosses 800.
