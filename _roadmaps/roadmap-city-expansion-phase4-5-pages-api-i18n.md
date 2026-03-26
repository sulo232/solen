# City Expansion — Phase 4: City Sub-Pages & Phase 5: API + i18n Polish

> **Scope:** City page refinements, API updates for city filtering, full i18n wiring, stock images.
> **Standard:** Solen V3 — `CLAUDE.md` + `UI_RULES.md`.
> **Depends On:** Phases 0-3.
> **Strategy:** One step = one commit + `npm run build`.

---

## PHASE 4 — City Sub-Pages

### Breakage Risk Assessment

| Step | Risk | Reason |
|---|---|---|
| S1 — City SEO metadata | 🟢 Low | Additive metadata |
| S2 — City page head.tsx | 🟡 Medium | Opengraph images per city |
| S3 — City page i18n keys | 🟢 Low | Translation additions |

---

### Step 1 — City Page SEO Metadata

> **Goal:** Each city page gets proper meta title, description, and OpenGraph.

#### [MODIFY] `app/[locale]/[city]/page.tsx`

Update `generateMetadata`:

```tsx
import type { Metadata } from "next";
import { getCityName, isValidCitySlug, type CitySlug } from "@/lib/cities";

export function generateMetadata({ params }: Props): Metadata {
  if (!isValidCitySlug(params.city)) return {};

  const cityName = getCityName(params.city as CitySlug, params.locale);
  const descriptions: Record<string, string> = {
    de: `Finde die besten Salons in ${cityName}. Coiffeur, Barber, Nails & mehr — jetzt buchen auf Solen.ch`,
    en: `Find the best salons in ${cityName}. Hairdresser, barber, nails & more — book now on Solen.ch`,
    fr: `Trouvez les meilleurs salons à ${cityName}. Coiffeur, barbier, ongles & plus — réservez sur Solen.ch`,
    it: `Trova i migliori saloni a ${cityName}. Parrucchiere, barbiere, unghie & altro — prenota su Solen.ch`,
  };

  return {
    title: `Salons in ${cityName} | Solen`,
    description: descriptions[params.locale] ?? descriptions.de,
    openGraph: {
      title: `Salons in ${cityName} | Solen`,
      description: descriptions[params.locale] ?? descriptions.de,
      url: `https://solen.ch/${params.locale}/${params.city}`,
      siteName: "Solen",
      locale: params.locale === "de" ? "de_CH" : params.locale,
      type: "website",
    },
    alternates: {
      languages: {
        "de": `/de/${params.city}`,
        "en": `/en/${params.city}`,
        "fr": `/fr/${params.city}`,
        "it": `/it/${params.city}`,
      },
    },
  };
}
```

**Git commit:** `git add app/[locale]/[city]/page.tsx && git commit -m "CITY-P4-S1: city page SEO metadata with OpenGraph + hreflang alternates"`

---

### Step 2 — City + Category SEO

> **Goal:** Each city+category page gets proper SEO.

#### [MODIFY] `app/[locale]/[city]/[category]/page.tsx`

```tsx
export function generateMetadata({ params }: Props): Metadata {
  if (!isValidCitySlug(params.city)) return {};

  const cityName = getCityName(params.city as CitySlug, params.locale);
  const catLabels: Record<string, Record<string, string>> = {
    coiffeur:   { de: "Coiffeur", en: "Hairdresser", fr: "Coiffeur", it: "Parrucchiere" },
    barbershop: { de: "Barber",   en: "Barber",      fr: "Barbier",  it: "Barbiere" },
    nails:      { de: "Nagelstudio", en: "Nail Salon", fr: "Salon de manucure", it: "Salone unghie" },
    makeup:     { de: "Make-up",  en: "Makeup",      fr: "Maquillage", it: "Trucco" },
    waxing:     { de: "Waxing",   en: "Waxing",      fr: "Épilation", it: "Depilazione" },
  };

  const catLabel = catLabels[params.category]?.[params.locale] ?? params.category;

  return {
    title: `${catLabel} in ${cityName} | Solen`,
    description: `Die besten ${catLabel}-Salons in ${cityName}. Jetzt buchen auf Solen.ch`,
    openGraph: {
      title: `${catLabel} in ${cityName} | Solen`,
      url: `https://solen.ch/${params.locale}/${params.city}/${params.category}`,
    },
  };
}
```

**Git commit:** `git add app/[locale]/[city]/[category]/page.tsx && git commit -m "CITY-P4-S2: city+category SEO metadata with localized category names"`

---

### Step 3 — City Page i18n Keys

> **Goal:** Add all city page translation keys.

**Add to all 4 locale files:**

```json
// de.json
"cityPage": {
  "title": "Salons in {city}",
  "subtitle": "Finde deinen perfekten Salon in {city}",
  "allCategories": "Alle",
  "emptyTitle": "Noch keine Salons",
  "emptyMessage": "In {city} sind noch keine Salons registriert. Schau bald wieder vorbei!"
}

// en.json
"cityPage": {
  "title": "Salons in {city}",
  "subtitle": "Find your perfect salon in {city}",
  "allCategories": "All",
  "emptyTitle": "No salons yet",
  "emptyMessage": "No salons registered in {city} yet. Check back soon!"
}

// fr.json
"cityPage": {
  "title": "Salons à {city}",
  "subtitle": "Trouvez votre salon parfait à {city}",
  "allCategories": "Tous",
  "emptyTitle": "Pas encore de salons",
  "emptyMessage": "Aucun salon enregistré à {city} pour le moment. Revenez bientôt !"
}

// it.json
"cityPage": {
  "title": "Saloni a {city}",
  "subtitle": "Trova il tuo salone perfetto a {city}",
  "allCategories": "Tutti",
  "emptyTitle": "Nessun salone ancora",
  "emptyMessage": "Nessun salone registrato a {city} ancora. Torna presto!"
}
```

**Git commit:** `git add messages/ && git commit -m "CITY-P4-S3: city page i18n keys for all 4 locales"`

---

## PHASE 5 — API Updates + i18n Polish

### Breakage Risk Assessment

| Step | Risk | Reason |
|---|---|---|
| S1 — /api/salons city filter | 🟡 Medium | Modifying core API endpoint |
| S2 — /api/salons/trending | 🟢 Low | Adding optional param |
| S3 — /api/cities endpoint | 🟢 Low | New endpoint |
| S4 — Salon registration city | 🟢 Low | Auto-detect from address |
| S5 — Full i18n audit | 🟢 Low | Translation additions |
| S6 — Stock images | 🟢 Low | Asset additions |
| S7 — UI_RULES.md update | 🟢 Low | Documentation update |

---

### Step 1 — `/api/salons` City Filter

> **Goal:** Add `?city=zuerich` param to the salons API.

#### [MODIFY] `app/api/salons/route.ts`

Add city filtering to the query:

```typescript
// Parse city param
const city = searchParams.get("city");

// In the Supabase query:
let query = supabase
  .from("salons")
  .select("*, cities!inner(slug)")
  .eq("is_active", true);

// Add city filter if provided
if (city) {
  query = query.eq("cities.slug", city);
}

// OR simpler approach without join:
if (city) {
  // Get city_id from slug
  const { data: cityData } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", city)
    .single();

  if (cityData) {
    query = query.eq("city_id", cityData.id);
  }
}
```

### ⚠️ BE CAREFUL
- The `city` param is OPTIONAL — if not provided, return all salons (backward compatible).
- Do NOT break existing API consumers. All existing query params (`sort`, `limit`, `category`, `quartier`) still work.
- The city filter can be combined with category filter: `?city=basel&category=coiffeur`.
- Server-side: if the request has a `solen-city` cookie and no explicit `city` param, do NOT auto-inject the cookie value into the API. Let the client control this.

**Git commit:** `git add app/api/salons/route.ts && git commit -m "CITY-P5-S1: /api/salons city filter param (backward compatible)"`

---

### Step 2 — City-Aware Trending & Counts

> **Goal:** `/api/salons/trending` and count endpoints accept city filter.

#### [MODIFY] `app/api/salons/trending/route.ts`

Add the same `?city=slug` → `city_id` filter logic.

#### [MODIFY] API endpoints that return counts

Any endpoint that counts salons (category-counts, stats) should accept `?city=slug`.

**Git commit:** `git add app/api/salons/ && git commit -m "CITY-P5-S2: trending and count APIs city-aware"`

---

### Step 3 — `/api/cities` Endpoint

> **Goal:** New endpoint that returns the list of active cities.

#### [NEW] `app/api/cities/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cities: data });
}
```

### ⚠️ BE CAREFUL
- This is a public, unauthenticated endpoint (city list is public data).
- No rate limiting needed (low-traffic, cacheable).
- Add `Cache-Control: public, max-age=3600` header for CDN caching.

**Git commit:** `git add app/api/cities/route.ts && git commit -m "CITY-P5-S3: /api/cities endpoint with CDN caching"`

---

### Step 4 — Salon Registration City Auto-Detect

> **Goal:** When a salon registers, auto-detect city from their address coordinates.

#### [MODIFY] Salon registration API (wherever it creates the salon record)

```typescript
import { findNearestCity } from "@/lib/cities";

// After getting latitude/longitude from the address:
const citySlug = findNearestCity(latitude, longitude);

// Get city_id:
const { data: city } = await supabase
  .from("cities")
  .select("id")
  .eq("slug", citySlug)
  .single();

// Set city_id on the new salon:
const { data: salon } = await supabase
  .from("salons")
  .insert({
    // ...other fields...
    city_id: city?.id ?? null,
  });
```

### ⚠️ BE CAREFUL
- `findNearestCity` uses the Haversine formula from `lib/cities.ts` (Phase 0).
- If the salon address is outside all city radius zones, still assign the nearest city.
- Salon owners can manually change their city in dashboard settings (future feature).

**Git commit:** `git add app/api/ && git commit -m "CITY-P5-S4: salon registration auto-detects city from address coordinates"`

---

### Step 5 — Full i18n Audit

> **Goal:** Ensure all new translation keys exist in all 4 locale files.

**Required keys checklist:**

| Namespace | Key | de | en | fr | it |
|---|---|---|---|---|---|
| `cities` | `label` | Stadt | City | Ville | Città |
| `cities` | `select` | Stadt wählen | Select city | Choisir une ville | Seleziona città |
| `cities` | `all` | Alle Städte | All cities | Toutes les villes | Tutte le città |
| `cityPage` | `title` | Salons in {city} | Salons in {city} | Salons à {city} | Saloni a {city} |
| `cityPage` | `subtitle` | ... | ... | ... | ... |
| `cityPage` | `allCategories` | Alle | All | Tous | Tutti |
| `cityPage` | `emptyTitle` | Noch keine Salons | No salons yet | Pas encore de salons | Nessun salone ancora |
| `cityPage` | `emptyMessage` | ... | ... | ... | ... |
| `hero` | `byline` | Deine Schweizer Salon-Plattform | Your Swiss Salon Platform | Votre plateforme suisse de salons | La tua piattaforma svizzera dei saloni |
| `deals` | `eyebrow` | Angebote | Deals | Offres | Offerte |
| `deals` | `title` | Aktuelle Deals | Current Deals | Offres actuelles | Offerte attuali |
| `discover` | `eyebrow` | Entdecken | Discover | Découvrir | Scopri |
| `discover` | `title` | Finde deine Inspiration | Find your inspiration | Trouve ton inspiration | Trova la tua ispirazione |
| `discover` | `cta` | Alle entdecken | Discover all | Tout découvrir | Scopri tutto |
| `map` | `eyebrow` | In deiner Nähe | Near you | Près de toi | Vicino a te |
| `map` | `title` | Salons auf der Karte | Salons on the map | Salons sur la carte | Saloni sulla mappa |
| `map` | `cta` | Karte öffnen | Open map | Ouvrir la carte | Apri la mappa |
| `footer` | `cities` | Städte | Cities | Villes | Città |
| `trust` | `paymentMethods` | Kreditkarte · Apple Pay · Google Pay | Credit Card · Apple Pay · Google Pay | ... | ... |

**Verification:**
```bash
# Check all keys exist:
for locale in de en fr it; do
  echo "=== $locale ==="
  grep -c "cities\|cityPage\|deals\|discover\|map\." messages/$locale.json
done
```

**Git commit:** `git add messages/ && git commit -m "CITY-P5-S5: full i18n audit — all city expansion keys in 4 locales"`

---

### Step 6 — Stock Images

> **Goal:** Source placeholder images from Unsplash for city pages and categories.

**Strategy:** Use Unsplash URLs directly (no download needed). Recommended search queries:

| Usage | Unsplash Query | Size |
|---|---|---|
| Basel city hero | `zurich salon interior` | 1200x800 |
| Zürich city hero | `zurich cityscape` | 1200x800 |
| Bern city hero | `bern switzerland` | 1200x800 |
| Category: Coiffeur | `hair salon interior` | 800x600 |
| Category: Barber | `barbershop` | 800x600 |
| Category: Nails | `nail salon` | 800x600 |
| Category: Makeup | `makeup artist` | 800x600 |

### ⚠️ BE CAREFUL
- Use Unsplash's free API or direct hotlinking (they allow it with attribution).
- All images need `loading="lazy"` and `alt` text.
- Images must use `object-cover` + `aspect-[3/2]` per UI_RULES §6.

---

### Step 7 — UI_RULES.md Update

> **Goal:** Document the 6 design system changes from the concept doc.

#### [MODIFY] `_rules/UI_RULES.md`

Add a new section after §20:

```markdown
## 21. Multi-City Design Rules (v3.1)

### Category Illustrations
Custom SVG illustrations are used for category tiles ONLY (Coiffeur, Barber, Nails, etc.).
These live in `components/icons/category/` and use `currentColor` for theming.
lucide-react remains the standard for ALL other UI icons.

### Homepage Search Bar
The landing page search bar uses a 3-field layout:
- Field 1: Service (text input + autocomplete)
- Field 2: City (dropdown with active cities)
- Field 3: Date (date picker, default "Heute")
Container: `rounded-search` (18px), `shadow-warm-md` → `shadow-warm-lg` on :focus-within.

### City Selector
Header (desktop): pill dropdown next to auth buttons.
Hamburger menu (mobile): dropdown above language selector.
Footer: city text links (all devices).
Persists via `solen-city` cookie + localStorage.

### RETIRED: Quartier System
The quartier/neighborhood filtering system is RETIRED as of v3.1.
City-level filtering replaces all neighborhood-level features.

### Deals (formerly Last Minute)
The "Last Minute" section is rebranded to "Deals" across all UI.
Route: `/{locale}/deals` (301 redirect from `/last-minute`).

### Language Switcher
Moved from header to footer. Remains in mobile hamburger menu.
```

**Git commit:** `git add _rules/UI_RULES.md && git commit -m "CITY-P5-S7: UI_RULES.md updated with multi-city design rules"`

---

## FINAL Smoke Test (All Phases)

After all 6 phases are complete:

1. ✅ `npm run build` — 0 errors
2. ✅ `npx tsc --noEmit` — 0 errors
3. ✅ `cities` table has 3 rows
4. ✅ All existing salons have `city_id` set to Basel
5. ✅ Homepage hero: "BEAUTY.BUCHEN."
6. ✅ Homepage search: 3-field (Service, City, Date)
7. ✅ Category tiles: custom SVG icons, no hardcoded counts
8. ✅ Discover preview section works
9. ✅ "Deals" branding (not "Last Minute")
10. ✅ City selector in header (desktop) and hamburger (mobile)
11. ✅ Language switcher in footer
12. ✅ Footer has city links
13. ✅ `/de/basel` shows salon grid
14. ✅ `/de/zuerich` shows empty state
15. ✅ `/de/zuerich/coiffeur` shows empty state with category
16. ✅ `/de/coiffeur?quartier=gundeli` → 301 → `/de/basel/coiffeur`
17. ✅ `/de/last-minute` → 301 → `/de/deals`
18. ✅ `/api/salons?city=basel` returns filtered results
19. ✅ `/api/cities` returns 3 cities
20. ✅ All 4 locale files have complete translations
21. ✅ Banned token grep returns 0 results
22. ✅ No dead components (every new file imported somewhere)
23. ✅ UI_RULES.md updated with multi-city rules
