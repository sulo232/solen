# City Expansion — Phase 0: Infrastructure (DB + Types)

> **Scope:** Database schema changes, TypeScript type definitions, and utility functions for multi-city support.
> **Standard:** Solen V3 — `CLAUDE.md` + `UI_RULES.md`.
> **Strategy:** Phase by phase. One phase = one git commit + `npm run build`.
> **Concept:** See `_roadmaps/../.gemini/antigravity/.../solen_expansion_concept.md`

---

## ⚠️ RUN MIGRATION FIRST

This phase requires SQL migrations on Supabase before any TypeScript code will work.

---

## Breakage Risk Assessment

| Step | Risk | Reason |
|---|---|---|
| S1 — `cities` table | 🟢 Low | New table, no existing code affected |
| S2 — `salons.city_id` column | 🟡 Medium | Adds column, seed data needed for Basel |
| S3 — TypeScript types | 🟢 Low | Additive types, no breaking changes |
| S4 — Utility functions | 🟢 Low | New lib file, no existing code changed |
| S5 — Profile `preferred_city` | 🟡 Medium | Adds column to profiles table |

---

## Step 1 — Create `cities` Reference Table

> **Goal:** Create the `cities` reference table with multilingual names.

### Migration SQL

```sql
-- Migration: create_cities_table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_it TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial cities
INSERT INTO public.cities (slug, name_de, name_en, name_fr, name_it, display_order, latitude, longitude, radius_km) VALUES
  ('basel',   'Basel',   'Basel',   'Bâle',   'Basilea', 1, 47.5596, 7.5886, 12),
  ('zuerich', 'Zürich',  'Zurich',  'Zurich',  'Zurigo',  2, 47.3769, 8.5417, 20),
  ('bern',    'Bern',    'Berne',   'Berne',   'Berna',   3, 46.9480, 7.4474, 15);

-- RLS: Public read access
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are publicly readable" ON public.cities FOR SELECT USING (true);

-- Index for slug lookups
CREATE INDEX idx_cities_slug ON public.cities (slug);
CREATE INDEX idx_cities_active ON public.cities (is_active) WHERE is_active = true;
```

### ⚠️ BE CAREFUL
- The `latitude`/`longitude` fields on cities are for geolocation-based city detection (finding the nearest city to a user's coordinates). The `radius_km` defines the geo-fence.
- This is a **reference table** — rows are rarely changed. No update/delete RLS policies needed initially.

**Verification:** Run `SELECT * FROM public.cities;` → should show 3 rows.

---

## Step 2 — Add `city_id` to `salons` Table

> **Goal:** Link every salon to a city. Seed Basel for all existing salons.

### Migration SQL

```sql
-- Migration: add_city_id_to_salons
ALTER TABLE public.salons ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Seed: All existing salons → Basel
UPDATE public.salons SET city_id = (SELECT id FROM public.cities WHERE slug = 'basel');

-- After seed, make NOT NULL (optional — can leave nullable for gradual migration)
-- ALTER TABLE public.salons ALTER COLUMN city_id SET NOT NULL;

-- Index for city filtering
CREATE INDEX idx_salons_city_id ON public.salons (city_id);
CREATE INDEX idx_salons_city_category ON public.salons (city_id, categories) WHERE is_active = true;
```

### ⚠️ BE CAREFUL
- Do NOT make `city_id` NOT NULL immediately — existing salons need to be seeded first.
- The `categories` column is an array (`SalonCategory[]`), so the composite index is on `(city_id, categories)`.
- Existing API queries that filter by `quartier` still work — `quartier` is NOT removed yet (backward compat).

**Verification:** Run `SELECT s.name, c.slug FROM salons s JOIN cities c ON s.city_id = c.id LIMIT 5;` → all show `basel`.

---

## Step 3 — TypeScript Type Definitions

> **Goal:** Add City types and update Salon type to include `city_id`.

### Files to modify

#### [NEW] `lib/cities.ts`

```typescript
// =============================================================================
// lib/cities.ts — City constants, types, and utilities
// =============================================================================

import type { SupportedLocale } from "@/lib/types";

export type CitySlug = "basel" | "zuerich" | "bern";

export interface City {
  id: string;
  slug: CitySlug;
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  is_active: boolean;
  display_order: number;
  latitude: number;
  longitude: number;
  radius_km: number;
  created_at: string;
}

/** Static city data for client-side usage (no DB call needed) */
export const CITIES: Record<CitySlug, { name_de: string; name_en: string; name_fr: string; name_it: string; lat: number; lng: number }> = {
  basel:   { name_de: "Basel",  name_en: "Basel",  name_fr: "Bâle",   name_it: "Basilea", lat: 47.5596, lng: 7.5886 },
  zuerich: { name_de: "Zürich", name_en: "Zurich", name_fr: "Zurich", name_it: "Zurigo",  lat: 47.3769, lng: 8.5417 },
  bern:    { name_de: "Bern",   name_en: "Berne",  name_fr: "Berne",  name_it: "Berna",   lat: 46.9480, lng: 7.4474 },
};

export const CITY_SLUGS: CitySlug[] = ["basel", "zuerich", "bern"];

/** Get localized city name */
export function getCityName(slug: CitySlug, locale: string): string {
  const city = CITIES[slug];
  if (!city) return slug;
  const key = `name_${locale}` as keyof typeof city;
  return (city[key] as string) ?? city.name_de;
}

/** Find nearest city from coordinates using Haversine distance */
export function findNearestCity(lat: number, lng: number): CitySlug {
  let nearest: CitySlug = "basel";
  let minDist = Infinity;

  for (const [slug, city] of Object.entries(CITIES)) {
    const dist = haversine(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = slug as CitySlug;
    }
  }
  return nearest;
}

/** Haversine distance in km */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Check if a CitySlug is valid */
export function isValidCitySlug(slug: string): slug is CitySlug {
  return CITY_SLUGS.includes(slug as CitySlug);
}
```

#### [MODIFY] `lib/types.ts`

**Add at line ~17** (after `SalonCategory` type):

```typescript
export type CitySlug = "basel" | "zuerich" | "bern";
```

**Modify `Salon` interface (line ~111)** — add `city_id`:

```typescript
export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  // ... existing fields ...
  city_id: string | null;  // References cities.id — null during migration only
  // ... rest of interface ...
}
```

**Modify `SalonCard` interface (line ~380)** — add city info:

```typescript
export interface SalonCard extends Salon {
  // ... existing fields ...
  city_slug?: CitySlug;     // Joined from cities table
  city_name?: string;       // Localized city name
}
```

**Modify `Profile` interface (line ~83)** — add preferred city:

```typescript
export interface Profile {
  // ... existing fields ...
  preferred_city?: CitySlug | null;  // User's preferred city for filtering
}
```

**Git commit:** `git add lib/cities.ts lib/types.ts && git commit -m "CITY-P0-S3: city types, constants, and utility functions"`

---

## Step 4 — Profile `preferred_city` Column

> **Goal:** Add `preferred_city` to the profiles table for logged-in user persistence.

### Migration SQL

```sql
-- Migration: add_preferred_city_to_profiles
ALTER TABLE public.profiles ADD COLUMN preferred_city TEXT DEFAULT NULL;
```

### ⚠️ BE CAREFUL
- This is a `TEXT` column, not a foreign key — we store the slug directly for simplicity and to avoid extra joins on every profile read.
- Valid values: `'basel'`, `'zuerich'`, `'bern'`, `NULL` (no preference / show all).

**Verification:** Run `SELECT preferred_city FROM profiles LIMIT 3;` → all should be `NULL`.

---

## Step 5 — City Cookie Utility

> **Goal:** Create client-side cookie utility for city persistence.

#### [NEW] `lib/city-cookie.ts`

```typescript
"use client";

import type { CitySlug } from "@/lib/cities";
import { isValidCitySlug } from "@/lib/cities";

const COOKIE_NAME = "solen-city";
const STORAGE_KEY = "solen-city";
const MAX_AGE_DAYS = 365;

/** Get the persisted city from cookie or localStorage */
export function getPersistedCity(): CitySlug | null {
  // 1. Try cookie
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (match && isValidCitySlug(match[1])) return match[1];
  }

  // 2. Fallback to localStorage
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidCitySlug(stored)) return stored as CitySlug;
  }

  return null;
}

/** Set the city in both cookie and localStorage */
export function setPersistedCity(slug: CitySlug): void {
  // Cookie (accessible server-side too)
  if (typeof document !== "undefined") {
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${slug};path=/;max-age=${maxAge};SameSite=Lax`;
  }

  // localStorage backup
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, slug);
  }
}

/** Clear the city cookie (revert to "all cities") */
export function clearPersistedCity(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
```

**Git commit:** `git add lib/city-cookie.ts && git commit -m "CITY-P0-S5: city cookie persistence utility"`

---

## Smoke Test (Phase 0)

After all steps:

1. ✅ `cities` table exists with 3 rows
2. ✅ `salons.city_id` column exists, all Basel salons seeded
3. ✅ `profiles.preferred_city` column exists
4. ✅ `npm run build` passes
5. ✅ `npx tsc --noEmit` passes
6. ✅ No banned tokens introduced

```bash
npx tsc --noEmit 2>&1 | grep "has no exported member" | head -5
# Must return 0 results
```
