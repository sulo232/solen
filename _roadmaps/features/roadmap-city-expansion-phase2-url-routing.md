# City Expansion — Phase 2: URL Routing

> **Scope:** Next.js App Router routes for `/{locale}/{city}` and `/{locale}/{city}/{category}`, middleware, redirects.
> **Standard:** Solen V3 — `CLAUDE.md` + `UI_RULES.md`.
> **Depends On:** Phase 0 (cities table, types) + Phase 1 (city cookie).
> **Strategy:** One step = one commit + `npm run build`.

---

## Breakage Risk Assessment

| Step | Risk | Reason |
|---|---|---|
| S1 — City route `[city]` | 🟡 Medium | New dynamic route — must not conflict with existing routes |
| S2 — City+category route | 🟡 Medium | Nested dynamic segments — param resolution critical |
| S3 — Middleware | 🔴 High | Middleware affects EVERY request — must be tested thoroughly |
| S4 — Static params | 🟢 Low | `generateStaticParams` is additive |
| S5 — Redirects | 🟡 Medium | 301 redirects from old quartier routes |

---

## Step 1 — City Route: `app/[locale]/[city]/page.tsx`

> **Goal:** Create the city sub-page that shows a filtered salon list.

### ⚠️ BE CAREFUL — ROUTE CONFLICTS
The `[city]` segment is at the same level as existing routes like `coiffeur`, `barbershop`, `nails`, `salon`, `discover`, `search`, `last-minute`, `dashboard`, etc. You MUST:

1. Check if the `city` param is a valid city slug BEFORE rendering
2. If it's NOT a valid city slug, return `notFound()` so Next.js falls through to other routes

#### [NEW] `app/[locale]/[city]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { isValidCitySlug, getCityName, type CitySlug } from "@/lib/cities";
import CityPage from "@/components/CityPage";

interface Props {
  params: { locale: string; city: string };
}

export default function CityRoute({ params }: Props) {
  if (!isValidCitySlug(params.city)) {
    notFound();
  }

  return <CityPage city={params.city as CitySlug} locale={params.locale} />;
}

export function generateStaticParams() {
  const cities = ["basel", "zuerich", "bern"];
  return cities.map((city) => ({ city }));
}

export function generateMetadata({ params }: Props) {
  if (!isValidCitySlug(params.city)) return {};

  const cityName = getCityName(params.city as CitySlug, params.locale);
  return {
    title: `Salons in ${cityName} | Solen`,
    description: `Finde die besten Salons in ${cityName}. Coiffeur, Barber, Nails & mehr — jetzt buchen auf Solen.`,
  };
}
```

#### [NEW] `components/CityPage.tsx`

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { MapPin, Scissors } from "lucide-react";
import { getCityName, CITY_SLUGS, type CitySlug } from "@/lib/cities";
import type { SalonCard as SalonCardType, SalonCategory } from "@/lib/types";

const CATEGORIES: { key: SalonCategory; label: string }[] = [
  { key: "coiffeur", label: "Coiffeur" },
  { key: "barbershop", label: "Barber" },
  { key: "nails", label: "Nails" },
  { key: "makeup", label: "Makeup" },
  { key: "waxing", label: "Waxing" },
];

interface CityPageProps {
  city: CitySlug;
  locale: string;
}

export default function CityPage({ city, locale }: CityPageProps) {
  const t = useTranslations("cityPage");
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<SalonCategory | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const cityName = getCityName(city, locale);

  const fetchSalons = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ city, limit: "24", sort: "rating" });
    if (activeCategory) params.set("category", activeCategory);

    fetch(`/api/salons?${params}`)
      .then((r) => r.json())
      .then((data) => setSalons(data.items ?? []))
      .catch(() => setSalons([]))
      .finally(() => setLoading(false));
  }, [city, activeCategory]);

  useEffect(() => { fetchSalons(); }, [fetchSalons]);

  // Fetch favorites
  useEffect(() => {
    fetch("/api/profile/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const favs = data?.favorites ?? [];
        setFavoriteIds(new Set(favs.map((f: { salon_id: string }) => f.salon_id)));
      })
      .catch(() => {});
  }, []);

  const handleFavoriteToggle = useCallback((salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch(() => {});
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      {/* City header */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-s-coral" />
          <span className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber">
            {cityName}
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
          style={{ fontSize: "clamp(26px, 4vw, 48px)", letterSpacing: "-0.02em" }}>
          {t("title", { city: cityName })}
        </h1>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
          {t("subtitle", { city: cityName })}
        </p>
      </section>

      {/* Category filter chips */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-pill text-sm font-heading font-bold uppercase tracking-[.04em] transition-all duration-150 ${
              activeCategory === null
                ? "bg-s-coral text-white shadow-coral-glow"
                : "bg-[--raised] dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-ink/20"
            }`}
          >
            {t("allCategories")}
          </button>
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={`shrink-0 px-4 py-2 rounded-pill text-sm font-heading font-bold uppercase tracking-[.04em] transition-all duration-150 ${
                activeCategory === key
                  ? "bg-s-coral text-white shadow-coral-glow"
                  : "bg-[--raised] dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-ink/20"
              }`}
              aria-pressed={activeCategory === key}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Salon grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : salons.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title={t("emptyTitle")}
            message={t("emptyMessage", { city: cityName })}
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {salons.map((salon) => (
              <motion.div
                key={salon.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              >
                <SalonCard
                  salon={salon}
                  locale={locale}
                  isFavorited={favoriteIds.has(salon.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </main>
  );
}
```

**Git commit:** `git add app/[locale]/[city]/page.tsx components/CityPage.tsx && git commit -m "CITY-P2-S1: city route with filtered salon grid, category chips, empty states"`

---

## Step 2 — City+Category Route: `app/[locale]/[city]/[category]/page.tsx`

> **Goal:** Create nested route for category-filtered city pages.

#### [NEW] `app/[locale]/[city]/[category]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { isValidCitySlug, getCityName, type CitySlug } from "@/lib/cities";
import type { SalonCategory } from "@/lib/types";
import CityPage from "@/components/CityPage";

const VALID_CATEGORIES: SalonCategory[] = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];

interface Props {
  params: { locale: string; city: string; category: string };
}

export default function CityCategoryRoute({ params }: Props) {
  if (!isValidCitySlug(params.city)) notFound();
  if (!VALID_CATEGORIES.includes(params.category as SalonCategory)) notFound();

  return (
    <CityPage
      city={params.city as CitySlug}
      locale={params.locale}
      initialCategory={params.category as SalonCategory}
    />
  );
}

export function generateStaticParams() {
  const cities = ["basel", "zuerich", "bern"];
  const categories = ["coiffeur", "barbershop", "nails", "makeup", "waxing"];
  return cities.flatMap((city) =>
    categories.map((category) => ({ city, category }))
  );
}

export function generateMetadata({ params }: Props) {
  if (!isValidCitySlug(params.city)) return {};
  const cityName = getCityName(params.city as CitySlug, params.locale);
  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  return {
    title: `${categoryName} in ${cityName} | Solen`,
    description: `Die besten ${categoryName}-Salons in ${cityName}. Jetzt buchen auf Solen.`,
  };
}
```

### ⚠️ BE CAREFUL
- The `CityPage` component needs to accept an optional `initialCategory` prop (update from Step 1).
- `generateStaticParams` creates 15 static pages (3 cities × 5 categories). `spa` is excluded if the feature flag is off.

**Git commit:** `git add app/[locale]/[city]/[category]/page.tsx && git commit -m "CITY-P2-S2: city+category nested route with static params"`

---

## Step 3 — Middleware Update

> **Goal:** Add city slug validation to middleware so invalid city slugs 404 cleanly.

#### [MODIFY] `middleware.ts`

Add city slug check BEFORE the locale redirect logic:

```typescript
import { CITY_SLUGS } from "@/lib/cities";

// In the middleware function, after locale extraction:
const pathSegments = pathname.split("/").filter(Boolean);
// pathSegments[0] = locale, pathSegments[1] = potential city or route

// If segment[1] looks like a city slug but is invalid, let Next.js handle 404
// (No middleware intervention needed — the page.tsx `notFound()` handles it)
```

### ⚠️ BE CAREFUL
- The middleware should NOT block valid routes like `/de/coiffeur` or `/de/salon/amara`.
- The `[city]` route's `notFound()` call handles invalid slugs — middleware just needs to pass them through.
- Do NOT add heavy logic to middleware — it runs on EVERY request (per CLAUDE.md Rule 25).
- Do NOT use `getUser()` in middleware (CLAUDE.md Rule 25).

**Git commit:** `git add middleware.ts && git commit -m "CITY-P2-S3: middleware passes city routes through, notFound handles validation"`

---

## Step 4 — Quartier Redirect (301)

> **Goal:** Redirect old quartier-based URLs to city routes.

#### [MODIFY] `vercel.json` or `next.config.js`

Add redirects:

```javascript
// next.config.js
module.exports = {
  // ...existing config...
  async redirects() {
    return [
      // Quartier routes → Basel city page
      {
        source: "/:locale/coiffeur",
        has: [{ type: "query", key: "quartier" }],
        destination: "/:locale/basel/coiffeur",
        permanent: true,
      },
      {
        source: "/:locale/barbershop",
        has: [{ type: "query", key: "quartier" }],
        destination: "/:locale/basel/barbershop",
        permanent: true,
      },
      {
        source: "/:locale/nails",
        has: [{ type: "query", key: "quartier" }],
        destination: "/:locale/basel/nails",
        permanent: true,
      },
    ];
  },
};
```

### ⚠️ BE CAREFUL
- Only redirect when `quartier` query param is present — generic `/de/coiffeur` should still work (shows all cities).
- These are 301 (permanent) redirects for SEO equity transfer.
- Check `next.config.js` for existing redirects and merge, don't overwrite.

**Git commit:** `git add next.config.js && git commit -m "CITY-P2-S4: 301 redirects from quartier routes to city pages"`

---

## Step 5 — Smart Category Links on Homepage

> **Goal:** When a user has a city cookie, category tile links on the homepage route to `/{locale}/{city}/{category}` instead of the generic `/{locale}/{category}`.

#### [MODIFY] `components/HomePage.tsx`

**In the category grid section**, import the cookie utility and adjust links:

```tsx
import { getPersistedCity } from "@/lib/city-cookie";

// Inside the component:
const persistedCity = typeof window !== "undefined" ? getPersistedCity() : null;

// In the category grid:
<Link
  href={persistedCity
    ? `/${locale}/${persistedCity}/${key}`
    : `/${locale}/${key}`
  }
  // ...rest of props
>
```

### ⚠️ BE CAREFUL
- `getPersistedCity()` reads from cookies/localStorage — only call this on the client.
- Use a state variable initialized in `useEffect` to avoid SSR/client mismatch.
- If no city is set, fall back to the generic route (all cities mixed).

```tsx
const [persistedCity, setPersistedCity] = useState<CitySlug | null>(null);
useEffect(() => {
  setPersistedCity(getPersistedCity());
}, []);
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "CITY-P2-S5: category links respect city cookie, route to city sub-pages"`

---

## Smoke Test (Phase 2)

1. ✅ `npm run build` passes
2. ✅ `npx tsc --noEmit` passes
3. ✅ `/de/basel` shows filtered salon list
4. ✅ `/de/zuerich` shows empty state (no salons yet)
5. ✅ `/de/zuerich/coiffeur` shows empty state with category pre-selected
6. ✅ `/de/coiffeur?quartier=gundeli` redirects to `/de/basel/coiffeur`
7. ✅ Category tiles on homepage link to city sub-pages when cookie is set
8. ✅ Invalid city slug `/de/fake-city` shows 404
9. ✅ Existing routes (`/de/salon/amara`, `/de/discover`) still work
