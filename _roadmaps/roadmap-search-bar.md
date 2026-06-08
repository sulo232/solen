# Search Bar — Full Implementation Roadmap

> **Scope**: Unified search bar across homepage + all 6 category subpages. Date-based availability, category pills, AI-powered embeddings search, cross-category scoping.
>
> **Decisions locked**: 1A+1C (single-select pills + Gemini auto-detect fallback), 2D (pgvector embeddings), 3C (grey-out + nächster freier Termin), 4C (chips + calendar), 5A (route to existing category page), 6C (full build).

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 0 | 🟢 SAFE | Nothing | Types + migration only |
| Phase 1 | 🟡 MEDIUM | Homepage hero layout | Test after replacing `<SearchBar />` |
| Phase 2 | 🟡 MEDIUM | FilterBar on all category pages | Keep existing FilterBar working, enhance incrementally |
| Phase 3 | 🟢 SAFE | Nothing | New API route only |
| Phase 4 | 🟢 SAFE | Nothing | New API route + cron script only |
| Phase 5 | 🟡 MEDIUM | Salon listing behavior | ⚠️ Existing `?availability=today` pill is DEAD (api/salons never reads it) — replace with `?date=` |
| Phase 6 | 🟢 SAFE | Nothing | UI enhancement only |
| Phase 7 | 🟢 SAFE | Nothing | Documentation only |

---

## 🤖 CLAUDE CODE PHASES

### Phase 0 — Infrastructure (Types, Migration, Utilities)

#### [MODIFY] `lib/types.ts`

Add new types for the search system:

```typescript
// ✅ DO — Add at end of file
export interface SearchEmbedding {
  id: string;
  entity_type: "service" | "salon" | "discovery_item";
  entity_id: string;
  category: SalonCategory;
  text_content: string;
  embedding: number[];
  updated_at: string;
}

export interface SmartSearchResult {
  entity_type: "service" | "salon";
  entity_id: string;
  salon_id: string;
  name: string;
  category: SalonCategory;
  similarity: number;
}

export interface AvailableDate {
  date: string;           // ISO date (YYYY-MM-DD)
  slot_count: number;     // how many open slots
}
```

Also extend the existing `SalonCard` interface (**AUDIT FIX H4**):

```typescript
// ⚠️ MODIFY the existing SalonCard interface (line ~286):
export interface SalonCard extends Salon {
  // ... existing fields
  available_on_date?: boolean;      // returned by api/salons when ?date= is set
  next_available_date?: string;     // ISO date, only when unavailable
}
```

```typescript
// ❌ DON'T — Don't put types in component files
// Types belong in lib/types.ts per Rule 28
```

#### [NEW] `supabase/migrations/074_search_embeddings.sql`

```sql
-- Enable pgvector extension (Supabase supports this natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table for semantic search
CREATE TABLE public.search_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('service', 'salon', 'discovery_item')),
  entity_id UUID NOT NULL,
  category TEXT NOT NULL,
  text_content TEXT NOT NULL,
  embedding vector(768),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast vector similarity search
-- Using hnsw (not ivfflat) because ivfflat needs 1000+ rows to be effective.
-- hnsw works well even with < 100 rows.
CREATE INDEX search_embeddings_embedding_idx
  ON public.search_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Unique constraint: one embedding per entity
CREATE UNIQUE INDEX search_embeddings_entity_uniq
  ON public.search_embeddings (entity_type, entity_id);

-- Category index for scoped searches
CREATE INDEX search_embeddings_category_idx
  ON public.search_embeddings (category);

-- RLS
ALTER TABLE public.search_embeddings ENABLE ROW LEVEL SECURITY;

-- Public read (embeddings are not sensitive)
CREATE POLICY "search_embeddings_select_public"
  ON public.search_embeddings FOR SELECT USING (true);

-- Admin-only writes (populated by cron/backfill)
CREATE POLICY "search_embeddings_insert_admin"
  ON public.search_embeddings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "search_embeddings_update_admin"
  ON public.search_embeddings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_search_embeddings(
  query_embedding vector(768),
  match_category TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  category TEXT,
  text_content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.entity_type,
    se.entity_id,
    se.category,
    se.text_content,
    1 - (se.embedding <=> query_embedding) AS similarity
  FROM public.search_embeddings se
  WHERE
    (match_category IS NULL OR se.category = match_category)
    AND 1 - (se.embedding <=> query_embedding) > match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### [NEW] `lib/search/embeddings.ts`

Utility functions for embedding generation using Gemini:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBEDDING_MODEL = "text-embedding-004";

/**
 * Generate a 768-dim embedding for a text string using Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Build a searchable text representation of a service for embedding.
 */
export function buildServiceEmbeddingText(service: {
  name_de: string;
  name_en?: string;
  category: string;
  price?: number;
}): string {
  const parts = [
    service.name_de,
    service.name_en ?? "",
    `Kategorie: ${service.category}`,
  ];
  if (service.price) parts.push(`${service.price} CHF`);
  return parts.filter(Boolean).join(" | ");
}
```

#### [NEW] `lib/search/category-detect.ts`

AI-powered category detection for queries without a selected category:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SalonCategory } from "@/lib/types";

const VALID_CATEGORIES: SalonCategory[] = [
  "coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"
];

/**
 * Use Gemini to detect which category a search query belongs to.
 * Returns null if ambiguous or not detectable.
 */
export async function detectCategory(
  query: string
): Promise<SalonCategory | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a beauty/wellness category classifier for a Swiss booking platform.
Given a user search query, return ONLY the single most likely category from this list:
coiffeur, barbershop, nails, spa, makeup, waxing

If the query is ambiguous or not related to beauty, return "unknown".

Query: "${query}"

Return ONLY the category word, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().toLowerCase();
    if (VALID_CATEGORIES.includes(text as SalonCategory)) {
      return text as SalonCategory;
    }
    return null;
  } catch {
    return null;
  }
}
```

> ⚠️ **BE CAREFUL**:
> - The migration requires `pgvector` extension. Supabase Free/Pro plans support it, but verify it's enabled in the Supabase dashboard under Database → Extensions → `vector`.
> - Embedding dimension is 768 for `text-embedding-004`. If Gemini changes the model, the dimension may differ — check the API docs.
> - Do NOT create the `search_embeddings` table without RLS. The policies above restrict writes to admin only.
> - ✅ Using `hnsw` index (not `ivfflat`) because hnsw works well with small datasets. No minimum row count needed.
> - ✅ `@google/generative-ai` v0.24.1 supports `embedContent` — confirmed in node_modules.

**Verification:**
```bash
ls -la lib/types.ts lib/search/embeddings.ts lib/search/category-detect.ts
ls -la supabase/migrations/074_search_embeddings.sql
npx tsc --noEmit 2>&1 | grep "search" | head -5  # must be 0 errors
```

**Commit:** `git commit -m "phase 0: search infrastructure — types, migration, embedding utils"`

---

### Phase 1 — Homepage Search Bar

#### [NEW] `components/ui/HomeSearchBar.tsx`

Three-part search bar replacing the current simple `<SearchBar />` on the homepage:

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📅 Datum           │  Category Pills (scroll)  │  🔍 Search   │
│  [Heute ▾]          │  [Coiffeur] [Barber] ...  │  [query...]  │
└─────────────────────────────────────────────────────────────────┘
                            [ 🔍 Suchen ]
```

**Behavior:**
- **Date section**: Quick chips (Heute, Morgen, Diese Woche) + `<SolenDatePicker />` calendar for custom date. Default: "Heute"
- **Category pills**: Horizontal scrollable, single-select. Uses the 6 CATEGORIES from `HomePage.tsx` (coiffeur, barbershop, nails, spa, makeup, waxing). Pill style matches existing `pillBase`/`pillActive`/`pillInactive` from `FilterBar.tsx`
- **Search input**: Text field with lucide `Search` icon. Placeholder: "Service, Stil oder Salon suchen…"
- **Submit**: Routes to `/${locale}/${selectedCategory}?date=${date}&q=${query}`. If no category selected but query exists → call `/api/search/detect-category` to auto-detect, then route
- All tokens from design system: `s-coral`, `rounded-card`, `font-body`, `font-heading`, etc.
- Dark mode pairs on every element

```typescript
// ✅ DO — Use existing SolenDatePicker, existing pill styles, existing design tokens
import SolenDatePicker from "@/components/ui/date-picker";
// Route to existing CategoryPage via URL params

// ❌ DON'T — Don't build a custom calendar from scratch
// ❌ DON'T — Don't create a new results page (5A = route to category page)
```

#### [MODIFY] `components/HomePage.tsx`

- Line 21: Change `import SearchBar from "@/components/ui/SearchBar"` → `import HomeSearchBar from "@/components/ui/HomeSearchBar"`
- Line 233: Change `<SearchBar />` → `<HomeSearchBar />`
- Keep everything else untouched

```typescript
// ✅ DO
import HomeSearchBar from "@/components/ui/HomeSearchBar";
// ...
<motion.div variants={fadeUp} className="mt-8">
  <HomeSearchBar />
</motion.div>

// ❌ DON'T — Don't modify the hero text, animations, or any other section
```

#### [NEW] `app/api/search/detect-category/route.ts`

API route for the 1C fallback — detects category from query when user doesn't pick one:

```typescript
// Uses lib/search/category-detect.ts
// ⚠️ runtime = "nodejs" (NOT edge) — uses Gemini SDK which crashes on Edge
// Security: IP-based rate limit (public route), max query length 200
// Returns: { category: "barbershop" } or { category: null }
```

> ⚠️ **BE CAREFUL**:
> - The homepage is the LIVE production page (Rule 7). Do NOT break the hero layout.
> - Test the date picker integration carefully — `SolenDatePicker` uses `react-aria-components` which needs `DateValue` from `@internationalized/date`, not native `Date`.
> - The submit button must handle the async category detection gracefully — show a loading spinner while Gemini detects.
> - Do NOT remove the old `SearchBar.tsx` file — other components might reference it. Just stop importing it on the homepage.
> - Pill styles must exactly match `FilterBar.tsx` pill classes for visual consistency.

**Verification:**
```bash
ls -la components/ui/HomeSearchBar.tsx
ls -la app/api/search/detect-category/route.ts
grep -n "HomeSearchBar" components/HomePage.tsx  # must find import + usage
npm run build  # must pass
```

**Commit:** `git commit -m "phase 1: homepage 3-part search bar with date + category pills + search"`

---

### Phase 2 — Subpage FilterBar Enhancement

#### [MODIFY] `components/FilterBar.tsx`

Add date picker to the FilterBar (used on all category pages):

**Changes:**
1. Add `SolenDatePicker` at the start of the filter row (before search autocomplete)
2. When date is selected → set `?date=YYYY-MM-DD` URL param
3. Pass `category` prop to FilterBar so search is scoped (see Phase 6)
4. Keep ALL existing filters (quartier, price, rating, payment, sort) — this is additive
5. ⚠️ **REPLACE** the dead `?availability=today` pill with date-based quick chips ("Heute", "Morgen", "Diese Woche"). The current pill sets `?availability=today` but `api/salons` NEVER reads it — it's dead code. Remove it and replace with `?date=${todayISO}` functionality.

```typescript
// ✅ DO — Add date picker BEFORE the search autocomplete
<SolenDatePicker
  label=""
  value={selectedDate}
  onChange={(d) => setParam("date", dateToIso(d))}
  minValue={today(getLocalTimeZone())}
/>

// Quick chips above the calendar
<div className="flex gap-1.5 shrink-0">
  <button onClick={() => setDate("today")} className={...}>Heute</button>
  <button onClick={() => setDate("tomorrow")} className={...}>Morgen</button>
  <button onClick={() => setDate("this_week")} className={...}>Diese Woche</button>
</div>

// ❌ DON'T — Don't remove existing filters, don't change filter URL params
// ❌ DON'T — Don't build a new FilterBar component — modify the existing one
```

#### [MODIFY] `components/CategoryPage.tsx`

Read the `date` URL param and pass it to the salon API:

```typescript
// ✅ DO — Read date from URL params
const selectedDate = searchParams.get("date");
// Pass to buildUrl as &date=2026-03-25

// ❌ DON'T — Don't duplicate the date logic in CategoryPage, keep it in FilterBar
```

> ⚠️ **BE CAREFUL**:
> - `FilterBar.tsx` is used on ALL 6 category pages. Test each one after changes.
> - The `SolenDatePicker` needs `@internationalized/date` imports (`today`, `getLocalTimeZone`, `parseDate`). ✅ Already installed: v3.12.0.
> - ⚠️ The existing `activeAvail === "today"` pill (FilterBar.tsx line 64, 131) is DEAD CODE — `api/salons` never reads `?availability=today`. DELETE the old pill and replace it with the "Heute" quick chip that sets `?date=${todayISO}` instead.
> - Do NOT break the horizontal scroll behavior of the filter row on mobile.
> - Do NOT change any existing URL param names (except replacing `availability` → `date`).

**Verification:**
```bash
grep -n "SolenDatePicker\|date-picker" components/FilterBar.tsx  # must find import
grep -n "date" components/CategoryPage.tsx  # must find param reading
npm run build  # must pass
```

**Commit:** `git commit -m "phase 2: date picker + quick chips in FilterBar for all category pages"`

---

### Phase 3 — Smart Search API (Embeddings)

#### [NEW] `app/api/search/smart/route.ts`

The core AI search endpoint. Generates an embedding for the query, searches `search_embeddings` via pgvector, and returns matching services/salons.

```typescript
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ⚠️ MUST be nodejs — Gemini SDK crashes on edge runtime (see api/ai/recommend as precedent)

// Security stack: IP rate limit (public route), query max 200 chars
// 1. Generate embedding for user query via Gemini text-embedding-004
// 2. Call Supabase RPC match_search_embeddings(embedding, category, threshold, limit)
// 3. Join results with services & salons tables for display data
// 4. Return { results: SmartSearchResult[], detected_category?: string }
```

**Key behavior — category scoping:**
- If `?category=nails` is passed → only search embeddings with `category = 'nails'`
- If no category → search all, but also run category detection and return `detected_category`
- If query matches a DIFFERENT category than the current page → return `suggested_category` field

```typescript
// ✅ DO — Use Supabase RPC for vector search
const { data } = await supabase.rpc("match_search_embeddings", {
  query_embedding: embedding,
  match_category: category ?? null,
  match_threshold: 0.5,
  match_count: 10,
});

// ❌ DON'T — Don't loop through all embeddings in JS, use the pgvector index
```

#### [MODIFY] `components/ui/SearchAutocomplete.tsx`

Upgrade the existing autocomplete to use the smart search API instead of simple `ILIKE`:

```typescript
// ✅ DO — Add smart search as a complement
// 1. First: quick ILIKE search (existing behavior, instant)
// 2. Then: if <2 results from ILIKE, fire smart search (300ms debounce)
// 3. Show smart results in a separate section: "KI-Vorschläge"

// Cross-category suggestion:
// If smart search returns suggested_category !== current category:
// Show a pill: "Meintest du [Barbershop]? → [Button to switch]"

// ❌ DON'T — Don't remove the existing ILIKE search, it's faster for exact matches
```

> ⚠️ **BE CAREFUL**:
> - The smart search API calls Gemini's embedContent → this has latency (~200-500ms). Always show ILIKE results first, then append AI results.
> - Rate limit the smart search endpoint aggressively (10 req/min per IP) — embedding generation costs money.
> - The cross-category suggestion ("Meintest du Barbershop?") should be a gentle pill, not a redirect — user chooses to navigate.
> - ⚠️ `runtime = "nodejs"` is MANDATORY — Gemini SDK uses Node.js APIs that crash on Vercel Edge. All existing AI routes (`/api/ai/recommend`) already use `nodejs`.
> - Use `setTimeout` for debounce (matching existing pattern in SearchAutocomplete), clear on input change, use AbortController for race conditions.
> - Test with German queries ("Herrenhaarschnitt"), English queries ("french crop"), and slang ("buzz cut", "gel nägel").

**Verification:**
```bash
ls -la app/api/search/smart/route.ts
grep -n "smart" components/ui/SearchAutocomplete.tsx  # must find smart search integration
npm run build  # must pass
# Manual test: curl "http://localhost:3000/api/search/smart?q=french+crop&category=barbershop"
```

**Commit:** `git commit -m "phase 3: AI-powered smart search API with pgvector embeddings + autocomplete upgrade"`

---

### Phase 4 — Embedding Generation Pipeline

#### [NEW] `app/api/admin/search/generate-embeddings/route.ts`

Admin-only API route to generate embeddings for all services:

```typescript
// Security: full admin stack (auth + role check + rate limit)
// 1. Fetch all active services from DB
// 2. For each service: build text representation → generate embedding via Gemini
// 3. Upsert into search_embeddings table
// 4. Return { processed: count, errors: count }
// Batch: process 10 at a time to avoid Gemini rate limits
```

#### [NEW] `scripts/backfill-embeddings.ts`

Standalone script for initial backfill (run once):

```typescript
// Reads all services + active salons
// Generates embeddings via Gemini text-embedding-004
// Inserts into search_embeddings
// Usage: npx tsx scripts/backfill-embeddings.ts
```

```typescript
// ✅ DO — Batch requests to avoid Gemini rate limits
for (let i = 0; i < services.length; i += 10) {
  const batch = services.slice(i, i + 10);
  await Promise.all(batch.map(s => processService(s)));
  await new Promise(r => setTimeout(r, 1000)); // 1s cooldown between batches
}

// ❌ DON'T — Don't fire 500 embedding requests simultaneously
```

> ⚠️ **BE CAREFUL**:
> - The backfill script needs `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as env vars.
> - Gemini's embedding API has rate limits (typically 1500 req/min). Batch with cooldowns.
> - The script should be idempotent (upsert, not insert) — safe to run multiple times.
> - Service names may contain special characters (ä, ö, ü) — ensure UTF-8 encoding.
> - Count how many services exist first. If < 50, the ivfflat index won't be useful — that's fine, it won't break.

**Verification:**
```bash
ls -la app/api/admin/search/generate-embeddings/route.ts
ls -la scripts/backfill-embeddings.ts
npm run build  # must pass
```

**Commit:** `git commit -m "phase 4: embedding generation pipeline — admin API + backfill script"`

---

### Phase 5 — Date-Based Availability Filtering

#### [NEW] `app/api/salons/available-on-date/route.ts`

Returns salon IDs that have at least one available slot on a specific date:

```typescript
export const dynamic = "force-dynamic";
export const runtime = "edge";

// Security: IP-based rate limit (public GET)
// Params: ?date=2026-03-25&category=barbershop
// Query: SELECT DISTINCT salon_id FROM availability_slots
//        WHERE status = 'available'
//        AND starts_at::date = $date
//        AND salon_id IN (SELECT id FROM salons WHERE $category = ANY(categories))
// Returns: { salon_ids: string[], date: string }
```

Also returns `next_available_date` per salon when requested:

```typescript
// For 3C (grey out + nächster freier Termin):
// ?date=2026-03-25&category=nails&include_next=true
// For each salon NOT available on the date:
//   Find MIN(starts_at::date) FROM availability_slots
//   WHERE status = 'available' AND starts_at > $date AND salon_id = $salon
// Returns: { available: [...], unavailable: [{ salon_id, next_available_date }] }
```

```typescript
// ✅ DO — Use a single efficient query
const { data } = await supabase
  .from("availability_slots")
  .select("salon_id")
  .eq("status", "available")
  .gte("starts_at", `${date}T00:00:00`)
  .lt("starts_at", `${date}T23:59:59`);
const salonIds = [...new Set(data?.map(s => s.salon_id) ?? [])];

// ❌ DON'T — Don't fetch ALL slots and filter in JS
```

#### [MODIFY] `app/api/salons/route.ts`

Add support for `?date=YYYY-MM-DD` parameter.

> ⚠️ **IMPORTANT**: `CategoryPage.buildUrl` (line 128) copies ALL searchParams to `/api/salons`. So when FilterBar sets `?date=2026-03-25`, it automatically gets forwarded. The salons API just needs to READ it.

> ⚠️ **DROP** the separate `/api/salons/available-on-date` route from Phase 5. It's redundant — `CategoryPage` already fetches from `/api/salons`, so date filtering should live IN that route. The availability data (available/unavailable per salon + next_available_date) should be returned as part of the salon response when `?date=` is set.

- When `date` is set, return ALL salons (not just available ones) but add `available_on_date: boolean` and `next_available_date: string | null` fields per salon
- This replaces the dead `?availability=today` filter with a working date filter

```typescript
// ✅ DO — Add date filtering as an additional WHERE clause
if (date) {
  // Subquery: salon IDs with available slots on that date
  const { data: availIds } = await supabase
    .from("availability_slots")
    .select("salon_id")
    .eq("status", "available")
    .gte("starts_at", `${date}T00:00:00`)
    .lt("starts_at", `${date}T23:59:59`);
  const ids = [...new Set(availIds?.map(s => s.salon_id) ?? [])];
// Also add per-salon availability fields to the response:
const items = (data ?? []).map((salon) => {
  const isAvailable = availableIds.has(salon.id);
  return {
    ...rest,
    avg_price,
    available_on_date: isAvailable,
    next_available_date: isAvailable ? null : nextDates[salon.id] ?? null,
  };
});

// ❌ DON'T — Don't create a SEPARATE /api/salons/available-on-date endpoint
// CategoryPage already fetches from /api/salons — keep it in one call
```

> ⚠️ **BE CAREFUL**:
> - The `availability_slots` table uses `starts_at` as a `timestamptz`. Date filtering must account for the timezone (CET/CEST for Basel).
> - ⚠️ The `?availability=today` pill is DEAD — `api/salons` never read it. The new `?date=` param replaces it entirely.
> - Performance: add an index for fast date queries: `CREATE INDEX idx_slots_date_status ON availability_slots (status, starts_at)` — add this to the migration file.
> - Return `next_available_date` per salon only when `?date=` is set (not always), to avoid expensive queries on default page load.

**Verification:**
```bash
ls -la app/api/salons/available-on-date/route.ts
grep -n "date" app/api/salons/route.ts  # must find date filtering code
npm run build  # must pass
# Manual test: curl "http://localhost:3000/api/salons/available-on-date?date=2026-03-25&category=coiffeur"
```

**Commit:** `git commit -m "phase 5: date-based availability filtering — new API + salon route enhancement"`

---

### Phase 6 — Category-Scoped Search + Cross-Category UX

#### [MODIFY] `components/FilterBar.tsx`

Accept and use a `category` prop for scoped search:

```typescript
// ✅ DO — Add category prop
interface FilterBarProps {
  category?: SalonCategory;
}

export default function FilterBar({ category }: FilterBarProps) {
  // Pass category to SearchAutocomplete for scoping
  <SearchAutocomplete
    category={category}
    onServiceSelect={(service) => setParam("service", service.name_de)}
  />
}
```

#### [MODIFY] `components/CategoryPage.tsx`

Pass `category` to FilterBar:

```typescript
// ✅ DO
<FilterBar category={category} />

// ❌ DON'T — Don't pass category as a string literal, use the enum prop
```

#### [MODIFY] `components/ui/SearchAutocomplete.tsx`

Add category-scoped search + cross-category suggestion:

> ⚠️ **AUDIT FIX (H5)**: `SearchAutocomplete.tsx` currently has NO access to `locale`. You MUST add `import { useLocale } from "next-intl"` and `const locale = useLocale()` inside the component for the cross-category `<Link>` to work.

```typescript
// ✅ DO — Scope search to current category
interface SearchAutocompleteProps {
  category?: SalonCategory;
  onServiceSelect?: (service: SuggestService) => void;
}

// When fetching suggestions, pass category:
const res = await fetch(`/api/search/suggest?q=${q}&category=${category ?? ""}`);

// Smart search with category scoping:
const smartRes = await fetch(`/api/search/smart?q=${q}&category=${category ?? ""}`);
const smartData = await smartRes.json();

// Cross-category suggestion:
// If smartData.suggested_category && smartData.suggested_category !== category
// Show: "Dieser Begriff gehört eher zu [Barbershop] →" with a link button
```

**Cross-category redirect button design:**
```jsx
{suggestedCategory && suggestedCategory !== category && (
  <div className="px-3 py-2.5 flex items-center gap-2 bg-s-coral/5 border-t border-s-ink/5">
    <Search size={14} className="text-s-coral shrink-0" />
    <span className="text-xs text-s-ink/60 font-body">
      Meintest du <strong>{categoryLabels[suggestedCategory]}</strong>?
    </span>
    <Link
      href={`/${locale}/${suggestedCategory}?q=${encodeURIComponent(query)}`}
      className="ml-auto px-3 py-1 rounded-pill bg-s-coral text-white text-xs font-medium hover:bg-s-coral/90 transition-colors shrink-0"
    >
      Wechseln
    </Link>
  </div>
)}
```

#### [MODIFY] `app/api/search/suggest/route.ts`

Add `category` filter to the existing suggest endpoint:

```typescript
// ✅ DO — Add optional category filter
const category = req.nextUrl.searchParams.get("category");

let servicesQuery = supabase
  .from("services")
  .select("id, name_de, name_en, category, price")
  .or(`name_de.ilike.${pattern},name_en.ilike.${pattern}`)
  .eq("is_active", true);

if (category) {
  servicesQuery = servicesQuery.eq("category", category);
}

// ❌ DON'T — Don't remove the existing non-category-filtered behavior (backward compat for homepage)
```

> ⚠️ **BE CAREFUL**:
> - The cross-category suggestion uses a `<Link>` component — make sure `locale` is available in the autocomplete component.
> - The category labels mapping must match `categoryLabels` in `CategoryPage.tsx` exactly.
> - On the homepage (no category), search should NOT be scoped — it should search across all categories.
> - The "Wechseln" button should use `router.push()` or `<Link>`, not a full page reload.
> - Test edge case: user types "nägel" on the barbershop page → should suggest switching to nails.

**Verification:**
```bash
grep -n "category" components/FilterBar.tsx components/ui/SearchAutocomplete.tsx  # must find props
grep -n "category" app/api/search/suggest/route.ts  # must find filter
npm run build  # must pass
```

**Commit:** `git commit -m "phase 6: category-scoped search + cross-category redirect UX"`

---

### Phase 7 — Grey-Out UX + Nächster Freier Termin

#### [MODIFY] `components/SalonCard.tsx`

Add visual states for availability:

```typescript
// ⚠️ AUDIT FIX (C3): Do NOT add more props. SalonCard already has 3 availability props:
// - showAvailability (boolean) — toggles "Verfügbar heute" badge
// - availableToday (number) — shows "X Termine heute frei" pill  
// - next_available_slot (from SalonCard type in lib/types.ts)
// CONSOLIDATE into a single unified prop:
interface SalonCardProps {
  // ... existing props (REMOVE showAvailability, availableToday)
  availability?: {
    status: 'available' | 'unavailable' | 'unknown';
    slotsToday?: number;
    nextDate?: string; // ISO date if unavailable
  };
}

// ⚠️ AUDIT FIX (C4): Grey overlay must use rounded-[inherit], NOT rounded-card.
// SalonCard uses blob-style borderRadius: "40% 60% 55% 45% / 30% 30% 70% 70%"
// A rectangular rounded-card overlay will clip incorrectly on blob shapes.

// Visual treatment when NOT available:
{availability?.status === 'unavailable' && (
  <div className="absolute inset-0 bg-white/60 dark:bg-s-dm-bg/60 rounded-[inherit] z-10 pointer-events-none flex items-end p-3">
    <span className="text-xs font-body text-s-ink/50 dark:text-s-dm-text/50 pointer-events-auto">
      {availability.nextDate
        ? `Nächster Termin: ${formatDate(availability.nextDate)}`
        : "Derzeit keine Termine"}
    </span>
  </div>
)}

// Available badge:
{availability?.status === 'available' && (
  <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-pill bg-s-sage/90 text-white text-[10px] font-medium font-body">
    Verfügbar
  </span>
)}
```

#### [MODIFY] `components/CategoryPage.tsx`

Fetch availability data when a date is selected and pass it to SalonCards:

```typescript
// ✅ DO — Fetch availability when date param exists
const selectedDate = searchParams.get("date");

useEffect(() => {
  if (!selectedDate) return;
  fetch(`/api/salons/available-on-date?date=${selectedDate}&category=${category}&include_next=true`)
    .then(r => r.json())
    .then(data => {
      setAvailableSalonIds(new Set(data.available?.map(s => s.salon_id) ?? []));
      setNextDates(Object.fromEntries(
        (data.unavailable ?? []).map(s => [s.salon_id, s.next_available_date])
      ));
    });
}, [selectedDate, category]);

// Pass to SalonCard:
<SalonCard
  salon={salon}
  locale={locale}
  availableOnDate={selectedDate ? availableSalonIds.has(salon.id) : undefined}
  nextAvailableDate={nextDates[salon.id]}
/>

// Sort: available salons first, then unavailable (3C = grey out, not hide)
const sortedSalons = selectedDate
  ? [...salons].sort((a, b) => {
      const aAvail = availableSalonIds.has(a.id) ? 0 : 1;
      const bAvail = availableSalonIds.has(b.id) ? 0 : 1;
      return aAvail - bAvail;
    })
  : salons;

// ❌ DON'T — Don't HIDE unavailable salons (that's 3A, user chose 3C)
// ❌ DON'T — Don't put the grey overlay on the cover image only — cover the whole card
```

> ⚠️ **BE CAREFUL**:
> - `SalonCard.tsx` is used on the homepage AND category pages. The `availableOnDate` prop must be optional — homepage doesn't use it.
> - The grey overlay must NOT block the salon name or click functionality — user should still be able to click through to the salon page.
> - `formatDate` helper must use `de-CH` locale: `new Date(date).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" })`.
> - The sort should be stable — among available salons, keep the original order (by rating, etc.).
> - Test with a salon that has zero slots at all → should show "Derzeit keine Termine".

**Verification:**
```bash
grep -n "availableOnDate\|nextAvailableDate" components/SalonCard.tsx  # must find props
grep -n "available-on-date" components/CategoryPage.tsx  # must find fetch
npm run build  # must pass
```

**Commit:** `git commit -m "phase 7: grey-out UX for unavailable salons with 'nächster freier Termin' badge"`

---

### Phase 8 — CLAUDE.md + Documentation Updates (R8)

#### [MODIFY] `CLAUDE.md`

1. **Section 3.5 (Key Features)**: Add feature #59:
   ```markdown
   59. **Smart Search**: Unified search bar with date-based availability, category pills, and AI-powered embeddings search (pgvector). Category-scoped results with cross-category suggestions. Homepage 3-part search bar (date + category + AI search). Subpage FilterBar with date picker and availability badges.
   ```

2. **Section 6 (Schema)**: Add `search_embeddings` table:
   ```markdown
   | `search_embeddings` | `id`, `entity_type`, `entity_id`, `category`, `text_content`, `embedding` (vector 768), `updated_at` | pgvector embeddings for AI-powered search. RLS: public read, admin write. |
   ```

3. **Section 2 (Tech Stack)**: Add pgvector:
   ```markdown
   | **Search** | pgvector (Supabase extension) — vector similarity search for AI-powered service matching |
   ```

#### [MODIFY] `_docs/category-system-map.md`

Add search system to §2 (Shared Base Layer):

```markdown
### 2.8 Smart Search
- Tables: `search_embeddings`
- Routes: `api/search/smart`, `api/search/suggest`, `api/search/detect-category`
- Components: `HomeSearchBar`, `SearchAutocomplete` (enhanced)
- Category-scoped: searches within current category, suggests cross-category when wrong match
```

#### [MODIFY] `.env.example`

Already has `GEMINI_API_KEY`. No new env vars needed (pgvector is a Supabase extension, not a separate service).

> ⚠️ **BE CAREFUL**:
> - Only append to CLAUDE.md — do NOT rewrite existing sections.
> - Verify the feature number (59) doesn't already exist — check the last numbered feature.
> - The `_docs/category-system-map.md` addition must follow the existing format exactly.

**Verification:**
```bash
grep -n "search_embeddings" CLAUDE.md  # must find schema entry
grep -n "Smart Search" _docs/category-system-map.md  # must find section
npm run build  # must pass (final build check)
```

**Commit:** `git commit -m "phase 8: update CLAUDE.md, category system map, and documentation"`

---

## 🧑 MANUAL PHASES

### Manual A — Enable pgvector in Supabase

1. Go to Supabase Dashboard → Your Project → Database → Extensions
2. Search for `vector`
3. Click "Enable" on the `vector` extension
4. Verify: run `SELECT * FROM pg_extension WHERE extname = 'vector';` in the SQL Editor — should return 1 row

### Manual B — Run Migration

1. After Phase 0 is committed, run the migration:
   ```bash
   supabase db push
   # OR apply manually via SQL Editor:
   # Copy contents of supabase/migrations/074_search_embeddings.sql
   ```

### Manual C — Run Embedding Backfill

After Phase 4 is committed and the migration is applied:
```bash
npx tsx scripts/backfill-embeddings.ts
```
This populates `search_embeddings` with vectors for all existing services. Takes ~1-5 minutes depending on service count.

### Manual D — Verify Live Search

After all phases are deployed:
1. Go to `solen.ch/de` → the homepage should show the new 3-part search bar
2. Search "french crop" without selecting a category → should auto-detect "barbershop"
3. Go to `/de/nails` → search "french crop" → should show "Meintest du Barbershop? → Wechseln" suggestion
4. Select a date → salons without availability should be greyed out with "Nächster Termin" label

---

## Dependency Ordering (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | Enable pgvector in Supabase | Nothing |
| Phase 0 | 🤖 | Types + migration + utilities | Nothing |
| Manual B | 🧑 | Run migration | Phase 0 |
| Phase 1 | 🤖 | Homepage search bar | Phase 0 |
| Phase 2 | 🤖 | FilterBar date picker | Phase 0 |
| Phase 3 | 🤖 | Smart search API | Phase 0 + Manual B |
| Phase 4 | 🤖 | Embedding pipeline | Phase 0 + Manual B |
| Manual C | 🧑 | Run backfill script | Phase 4 |
| Phase 5 | 🤖 | Date-based availability | Phase 2 |
| Phase 6 | 🤖 | Category scoping + cross-category UX | Phase 3 |
| Phase 7 | 🤖 | Grey-out UX | Phase 5 |
| Phase 8 | 🤖 | Documentation updates | ALL phases |
| Manual D | 🧑 | Live verification | ALL phases + Manual C |

---

## Files Summary

### New Files

| Tag | Path | Purpose |
|---|---|---|
| [NEW] | `components/ui/HomeSearchBar.tsx` | 3-part homepage search bar |
| [NEW] | `lib/search/embeddings.ts` | Embedding generation utilities |
| [NEW] | `lib/search/category-detect.ts` | Gemini category auto-detection |
| [NEW] | `app/api/search/detect-category/route.ts` | Category detection API |
| [NEW] | `app/api/search/smart/route.ts` | AI-powered vector search API (runtime: nodejs) |
| ~~[NEW]~~ | ~~`app/api/salons/available-on-date/route.ts`~~ | ~~DROPPED — merged into api/salons/route.ts~~ |
| [NEW] | `app/api/admin/search/generate-embeddings/route.ts` | Admin: generate embeddings |
| [NEW] | `scripts/backfill-embeddings.ts` | One-time embedding backfill |
| [NEW] | `supabase/migrations/074_search_embeddings.sql` | pgvector table + RPC |

### Modified Files

| Tag | Path | What Changes |
|---|---|---|
| [MODIFY] | `lib/types.ts` | Add `SearchEmbedding`, `SmartSearchResult`, `AvailableDate` types |
| [MODIFY] | `components/HomePage.tsx` | Replace `<SearchBar />` → `<HomeSearchBar />` |
| [MODIFY] | `components/FilterBar.tsx` | Add date picker, category prop |
| [MODIFY] | `components/CategoryPage.tsx` | Read date param, pass category to FilterBar, fetch availability |
| [MODIFY] | `components/ui/SearchAutocomplete.tsx` | Category scoping, smart search, cross-category suggestion |
| [MODIFY] | `components/SalonCard.tsx` | Grey-out overlay, availability badge, nächster Termin |
| [MODIFY] | `app/api/search/suggest/route.ts` | Add category filter |
| [MODIFY] | `app/api/salons/route.ts` | Add date-based availability filter |
| [MODIFY] | `CLAUDE.md` | Add Feature #59, schema, tech stack |
| [MODIFY] | `_docs/category-system-map.md` | Add §2.8 Smart Search |

---

## Verification Plan

### Build Verification (after each phase)
```bash
npm run build          # must pass with 0 errors
npx tsc --noEmit       # must pass with 0 type errors
```

### Smoke Test (after all phases, per Rule 29)
1. ✅ `npm run build` passes
2. ✅ `npx tsc --noEmit` passes
3. ✅ Every new `.tsx` is imported (run dead-code check: `for f in components/ui/HomeSearchBar.tsx; do grep -rn "HomeSearchBar" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l; done`)
4. ✅ All types exist in `lib/types.ts`
5. ✅ No duplicate Header/BottomNav
6. ✅ No banned tokens (Rule 20 grep)
7. ✅ Dark mode pairs on all new elements
8. ✅ Translations: ⚠️ Follow-up task needed — all new strings are hardcoded German ("Heute", "Morgen", "Diese Woche", "Meintest du", "Wechseln", "Verfügbar", "Nächster Termin", "Derzeit keine Termine"). Add i18n keys in a future phase.
9. ✅ Migration documented with `⚠️ RUN MIGRATION FIRST` in Manual B

### Manual Testing (by user)
1. **Homepage**: Visit `/de` → 3-part search bar visible → select date, category, type query → submit → routes to category page
2. **Category page**: Visit `/de/nails` → date picker visible in FilterBar → select a date → salons re-sort by availability
3. **Cross-category**: On `/de/nails`, type "buzzcut" → see "Meintest du Barbershop?" suggestion
4. **Grey-out**: Select a date where some salons have no slots → those cards are greyed with "Nächster Termin" label
5. **AI search**: Type "french crop" → smart results appear after brief delay
