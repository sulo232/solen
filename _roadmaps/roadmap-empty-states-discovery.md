> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap: Empty States, Search UX & Discovery Polish
> **Priority**: 🟡 P1 — Run IN PARALLEL with roadmap-salon-i18n (no file conflicts)
> **Parallelism**: SAFE alongside roadmap-critical-fixes and roadmap-salon-i18n. Touches DIFFERENT files.
> **Estimated Time**: ~40 minutes
> **File Lock**: `app/[locale]/last-minute/`, `app/[locale]/angebote/`, `components/SearchResults.tsx`, `app/[locale]/search/`

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Adding translation keys only |
| Phase 2 | 🟡 MEDIUM | Search page layout | Test search with empty & populated results |
| Phase 3 | 🟡 MEDIUM | Last-minute page | Test with no data + with data |
| Phase 4 | 🟢 SAFE | Nothing | Adding a new component |
| Phase 5 | 🟢 SAFE | Nothing | Adding a display feature |

---

## 🤖 Phase 1: Add Empty State Translation Keys

**Files**:
- [MODIFY] `messages/de.json` — Add `"emptyStates"` section
- [MODIFY] `messages/en.json` — Same
- [MODIFY] `messages/fr.json` — Same
- [MODIFY] `messages/it.json` — Same

Add these keys to all 4 locale files:

For `de.json`:
```json
"emptyStates": {
  "searchNoResults": "Keine Ergebnisse",
  "searchSuggestion": "Versuche andere Suchbegriffe oder ändere deine Filter.",
  "searchTryRemoveFilters": "Filter zurücksetzen",
  "searchPopularTitle": "Beliebte Salons in deiner Nähe",
  "searchTrySuggestions": "Oder probiere:",
  "lastMinuteNoSlots": "Gerade keine Last-Minute Slots",
  "lastMinuteNotifyMe": "Benachrichtigen wenn verfügbar",
  "lastMinuteSuggestedTitle": "Diese Salons bieten oft Last-Minute Slots an",
  "offersEmpty": "Aktuell keine Angebote",
  "offersEmptyMessage": "Neue Angebote kommen bald. Schau regelmässig vorbei!",
  "offersSubscribe": "Über neue Angebote informiert werden",
  "recentlyViewedTitle": "Zuletzt besucht",
  "instantBookBadge": "Sofort buchbar"
}
```

For `en.json`:
```json
"emptyStates": {
  "searchNoResults": "No results",
  "searchSuggestion": "Try different search terms or adjust your filters.",
  "searchTryRemoveFilters": "Reset filters",
  "searchPopularTitle": "Popular salons near you",
  "searchTrySuggestions": "Or try:",
  "lastMinuteNoSlots": "No last-minute slots right now",
  "lastMinuteNotifyMe": "Notify me when available",
  "lastMinuteSuggestedTitle": "These salons often have last-minute slots",
  "offersEmpty": "No current offers",
  "offersEmptyMessage": "New offers are coming soon. Check back regularly!",
  "offersSubscribe": "Get notified about new offers",
  "recentlyViewedTitle": "Recently viewed",
  "instantBookBadge": "Instant book"
}
```

FR/IT translations follow the same pattern (translate each string).

```bash
git add messages/
git commit -m "feat: add empty state + discovery i18n keys"
```

> ⚠️ **BE CAREFUL**: Do NOT modify keys added by `roadmap-salon-i18n` or `roadmap-critical-fixes`. Only ADD the `emptyStates` key.

---

## 🤖 Phase 2: Search Empty State Overhaul

**Problem**: When search returns "Keine Ergebnisse", users reach a dead end. Airbnb never dead-ends.

**Goal**: When search results are empty, show: (1) "Try removing filters" link, (2) popular category suggestion pills, (3) a "Popular nearby" mini-carousel.

**Files to find and modify**:
First, find the search results component:
```bash
grep -rn "Keine Ergebnisse\|no-results\|emptyState" app/[locale]/search/ components/ --include="*.tsx" | head -20
```

Then find the component that renders the empty state. It likely uses `<EmptyState>` component.

**What to do**:
After the `<EmptyState>` component in the search results, add a fallback section:

```tsx
{/* Fallback: popular salons when search is empty */}
{results.length === 0 && !loading && (
  <div className="mt-8">
    {/* Suggestion pills */}
    <p className="text-sm text-s-ink/50 mb-3">{t("searchTrySuggestions")}</p>
    <div className="flex flex-wrap gap-2 mb-6">
      {["Coiffeur", "Nails", "Barbershop", "Spa", "Makeup", "Waxing"].map((cat) => (
        <Link
          key={cat}
          href={`/${locale}/${cat.toLowerCase()}`}
          className="px-4 py-2 rounded-pill bg-s-ink/[0.05] text-s-ink/60 text-sm font-heading font-semibold hover:bg-s-ink/[0.09] hover:text-s-ink transition-all duration-150"
        >
          {cat}
        </Link>
      ))}
    </div>

    {/* Reset filters button */}
    <button
      onClick={() => {/* Reset all search params */}}
      className="text-sm text-s-coral hover:underline"
    >
      {t("searchTryRemoveFilters")}
    </button>
  </div>
)}
```

✅ DO: Use existing `<Link>` components for category navigation
❌ DON'T: Fetch additional data on the search page — use static category links

**Verification**:
1. Search for "xyznonexistent" — should show suggestion pills
2. Search for "Coiffeur" — normal results should show (no fallback)

```bash
git add app/[locale]/search/ components/
git commit -m "feat: search empty state with category suggestions and filter reset"
```

> ⚠️ **BE CAREFUL**:
> - Find the ACTUAL search component by grepping — don't assume a file path
> - The search page may use `useSearchParams()` — do NOT break URL-based filtering
> - Category names in the pills should match the ACTUAL route slugs (lowercase)

---

## 🤖 Phase 3: Last-Minute Empty State

**Problem**: `/de/last-minute` shows "Gerade keine Last-Minute Slots" with no fallback. Dead end.

**Files**:
Find the last-minute page:
```bash
ls app/[locale]/last-minute/
cat app/[locale]/last-minute/page.tsx | head -10
```

**What to do**: After the "no slots" empty state, add a "Salons that often have last-minute" section using a static list of salon categories:

```tsx
{/* When no slots: show suggested salons */}
{slots.length === 0 && !loading && (
  <div className="mt-6">
    <h3 className="font-heading font-semibold text-base text-s-ink mb-3">
      {t("lastMinuteSuggestedTitle")}
    </h3>
    <div className="flex flex-wrap gap-2">
      {["coiffeur", "nails", "barbershop"].map((cat) => (
        <Link
          key={cat}
          href={`/${locale}/${cat}`}
          className="px-4 py-2.5 rounded-pill bg-white border border-s-ink/10 text-sm text-s-ink/70 hover:border-s-coral/30 hover:text-s-coral transition-all duration-150"
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </Link>
      ))}
    </div>
  </div>
)}
```

Also add a "Notify me" button that posts to `/api/waitlist`:
```tsx
<button
  onClick={async () => {
    const email = prompt(t("lastMinuteNotifyMe"));
    if (email && email.includes("@")) {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feature: "last-minute" }),
      }).catch((err) => console.error("[LastMinute] Waitlist error:", err));
    }
  }}
  className="mt-4 text-sm text-s-coral hover:underline"
>
  {t("lastMinuteNotifyMe")}
</button>
```

```bash
git add app/[locale]/last-minute/
git commit -m "feat: last-minute empty state with category suggestions and notify button"
```

> ⚠️ **BE CAREFUL**: 
> - The last-minute page has a filter system (category pills, price range). Do NOT break the filter state.
> - The `prompt()` for email is temporary — replace with a proper modal in a future roadmap
> - `/api/waitlist` already exists — verify it accepts `{ email, feature }` body

---

## 🤖 Phase 4: Recently Viewed Carousel on Homepage

**Problem**: `trackSalonView()` is called on every salon page visit, storing data in localStorage. But "Recently Viewed" is never surfaced.

**Files**:
- [MODIFY] `components/HomePage.tsx` — Add "Zuletzt besucht" carousel section
- Check `components/RecentlyViewed.tsx` for the existing storage logic

**What to do**:
1. First, check what `trackSalonView` stores:
```bash
grep -A 20 "export function trackSalonView\|export function getRecentlyViewed" components/RecentlyViewed.tsx
```

2. In `HomePage.tsx`, import the getter function and render a carousel AFTER the category carousels:

```tsx
import { getRecentlyViewed } from "@/components/RecentlyViewed";

// Inside the component, in a useEffect:
const [recentSalons, setRecentSalons] = useState<any[]>([]);

useEffect(() => {
  const recent = getRecentlyViewed();
  if (recent.length > 0) setRecentSalons(recent);
}, []);

// Before the closing </div> of the carousels section:
{recentSalons.length > 0 && (
  <div className="mt-4">
    <CityCarouselSection
      title={t("emptyStates.recentlyViewedTitle")}
      salons={recentSalons}
      locale={locale}
      favoriteIds={favoriteIds}
      onFavoriteToggle={handleFavoriteToggle}
    />
  </div>
)}
```

✅ DO: Use the existing `CityCarouselSection` component for consistency
❌ DON'T: Make localStorage calls outside `useEffect` — this breaks SSR

**Verification**:
1. Visit a salon page, then return to homepage — should see "Zuletzt besucht" carousel
2. In incognito (no history) — carousel should NOT appear

```bash
git add components/HomePage.tsx
git commit -m "feat: add Recently Viewed carousel to homepage"
```

> ⚠️ **BE CAREFUL**:
> - localStorage reads MUST be inside `useEffect` — never in the render body (SSR crash)
> - The `recentSalons` data shape might differ from the `salons` prop shape expected by `CityCarouselSection` — check and map if needed
> - Do NOT add this carousel before the main category carousels — it goes AFTER
> - Claude Code is currently editing `HomePage.tsx` (category anchor strip). Check for merge conflicts before committing.
> - If `getRecentlyViewed` doesn't exist, look for the function name by grepping the RecentlyViewed file

---

## 🤖 Phase 5: "Instant Book" Badge on SalonCard

**Problem**: Solen has `booking_confirmation_mode: "instant" | "manual_approval"` but doesn't surface this to users.

**Files**:
- [MODIFY] `components/SalonCard.tsx` — Add "⚡ Sofort buchbar" badge

**What to do**:
1. First, check if the salon data includes `booking_confirmation_mode`:
```bash
grep -n "booking_confirmation_mode" lib/types.ts components/SalonCard.tsx app/[locale]/page.tsx
```

2. If the field is available in the salon card data, add a badge:
```tsx
{/* Inside SalonCard, after the rating */}
{(salon as any).booking_confirmation_mode === "instant" && (
  <span className="inline-flex items-center gap-1 text-[11px] text-s-coral/80 font-heading font-semibold">
    <Zap size={10} className="fill-s-coral/60 text-s-coral/60" />
    {t("instantBookBadge")}
  </span>
)}
```

3. If the field is NOT in the SSR query, check `app/[locale]/page.tsx` and add it to the `SALON_COLS` select:
```sql
booking_confirmation_mode
```

✅ DO: Import `Zap` from lucide-react (already imported in many files)
❌ DON'T: Add the badge if the field isn't in the data — check first

```bash
git add components/SalonCard.tsx app/[locale]/page.tsx
git commit -m "feat: add Instant Book badge to salon cards"
```

> ⚠️ **BE CAREFUL**:
> - `SalonCard.tsx` is being actively edited by another Claude Code instance (dots and review count). 
> - **Wait for the other roadmap-homepage-v6 to finish before touching SalonCard.tsx** — or coordinate via git pull
> - If `booking_confirmation_mode` isn't in `SALON_COLS`, you must add it to the SSR query AND verify it exists in the DB
> - The badge should be small and subtle — NOT a full-width banner

---

## 🔍 SELF-CHECK PROTOCOL

```bash
# 1. Search page fallback works
# (manual: search for something that returns 0 results)

# 2. TypeScript
npx tsc --noEmit 2>&1 | tail -5

# 3. Build
npm run build 2>&1 | tail -10

# 4. No localStorage in render body
grep -n "getRecentlyViewed\|localStorage" components/HomePage.tsx | head -10
# Verify it's only inside useEffect

# 5. JSON validity
node -e "JSON.parse(require('fs').readFileSync('messages/de.json'))" && echo "OK"
```

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Add i18n keys | Nothing |
| Phase 2 | 🤖 | Search empty state | Phase 1 |
| Phase 3 | 🤖 | Last-minute empty state | Phase 1 |
| Phase 4 | 🤖 | Recently Viewed carousel | Phase 1 |
| Phase 5 | 🤖 | Instant Book badge | Phase 1, wait for SalonCard.tsx to be free |
