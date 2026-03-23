# 🔍 Search Bar Rules — Solen.ch

> **Every AI agent MUST read this file before modifying any search-related component.**

---

## 1. Search Bar Hierarchy

| Context | Component | File | Category-Scoped? |
|---|---|---|---|
| **Homepage** | `HomeSearchBar` | `components/ui/HomeSearchBar.tsx` | No (search all, auto-detect) |
| **Category pages** | `FilterBar` → `SearchAutocomplete` | `components/FilterBar.tsx` | Yes (scoped to page category) |

---

## 2. Category Scoping Rules (MANDATORY)

### Rule S-1: Subpage search MUST be scoped to the current category

When searching on a category page (e.g., `/nails`), the search API MUST filter results to only that category's services, salons, and discovery items.

```typescript
// ✅ CORRECT — pass category to search API
fetch(`/api/search/suggest?q=${query}&category=${category}`);
fetch(`/api/search/smart?q=${query}&category=${category}`);

// ❌ WRONG — unscoped search on a category page
fetch(`/api/search/suggest?q=${query}`);
```

### Rule S-2: Cross-category queries MUST show a redirect suggestion, NOT results

If a user searches "buzzcut" on the Nails page:
- Do NOT show barbershop results on the nails page
- DO show a gentle redirect pill: "Meintest du **Barbershop**? → [Wechseln]"
- The redirect navigates to `/${locale}/barbershop?q=buzzcut`

```tsx
// ✅ CORRECT — redirect pill for cross-category match
{suggestedCategory && suggestedCategory !== currentCategory && (
  <div className="px-3 py-2.5 flex items-center gap-2 bg-s-coral/5 border-t border-s-ink/5">
    <Search size={14} className="text-s-coral shrink-0" />
    <span className="text-xs text-s-ink/60 font-body">
      Meintest du <strong>{categoryLabels[suggestedCategory]}</strong>?
    </span>
    <Link
      href={`/${locale}/${suggestedCategory}?q=${encodeURIComponent(query)}`}
      className="ml-auto px-3 py-1 rounded-pill bg-s-coral text-white text-xs font-medium"
    >
      Wechseln
    </Link>
  </div>
)}

// ❌ WRONG — showing barbershop results on the nails page
```

### Rule S-3: Homepage search is unscoped but uses auto-detection

On the homepage (`HomeSearchBar`):
- If user selects a category pill → route to that category page
- If user types a query without selecting a category → use Gemini to detect the category, then route
- NEVER show results inline on the homepage (decision 5A)

---

## 3. Date Picker Rules

### Rule S-4: Date picker must include quick chips AND calendar

Every date picker (homepage + subpages) must show:
1. Quick chips: "Heute", "Morgen", "Diese Woche" (above the calendar)
2. Full `<SolenDatePicker />` calendar (from `components/ui/date-picker.tsx`)
3. Default: no date selected (shows all salons)

### Rule S-5: Date-based filtering shows availability state, never hides salons

When a date is selected:
- Available salons → shown normally with a green "Verfügbar" badge
- Unavailable salons → greyed out with overlay + "Nächster Termin: [date]" label
- Unavailable salons are pushed to the bottom of the list, NOT hidden
- The grey overlay must NOT prevent clicking the salon card

```tsx
// ✅ CORRECT — grey overlay with inherited blob borderRadius + click-through
// SalonCard uses blob shapes (40% 60% 55% 45%...) so overlay MUST use rounded-[inherit]
<div className="absolute inset-0 bg-white/60 dark:bg-s-dm-bg/60 rounded-[inherit] z-10 pointer-events-none" />
// Card itself remains clickable underneath

// ✅ CORRECT — unified availability prop (replaces showAvailability + availableToday + next_available_slot)
<SalonCard availability={{ status: 'unavailable', nextDate: '2026-04-01' }} />

// ❌ WRONG — hiding unavailable salons
{availability?.status !== 'unavailable' && <SalonCard ... />}
// ❌ WRONG — using rounded-card on blob-shaped cards
<div className="rounded-card" /> // Will clip incorrectly on blob shapes
```

---

## 4. Embeddings / AI Search Rules

### Rule S-6: Always show instant results first, AI results second

Search must follow a two-tier approach:
1. **Instant** (0ms): ILIKE text search from `/api/search/suggest` — show immediately
2. **Smart** (200-500ms): Vector similarity from `/api/search/smart` — append below under "KI-Vorschläge" section

Never make the user wait for AI results to see any results.

### Rule S-7: Embedding generation is admin-only and batched

- Embeddings are generated via `/api/admin/search/generate-embeddings`
- Admin-only route (auth + role check per Rule S6 in CLAUDE.md)
- Batch: max 10 concurrent Gemini requests, 1s cooldown between batches
- Model: `text-embedding-004` (768 dimensions)

### Rule S-8: The smart search API must handle Gemini failures gracefully

If the embedding generation fails (API down, rate limit, timeout):
- Return empty `results: []`
- Do NOT throw a 500 — the frontend should gracefully show "no AI results"
- Log the error server-side

---

## 5. API Route Requirements

All search API routes MUST include these security layers (per CLAUDE.md S1):

| Route | Auth | Rate Limit | Validation |
|---|---|---|---|
| `GET /api/search/suggest` | None (public) | IP: `generalLimiter` | Query max 100 chars |
| `GET /api/search/smart` | None (public) | IP: 10 req/min (stricter) | Query max 200 chars |
| `GET /api/search/detect-category` | None (public) | IP: 10 req/min | Query max 200 chars |
| `POST /api/admin/search/generate-embeddings` | Auth + Admin role | User: `adminLimiter` | None |
| `GET /api/salons/available-on-date` | None (public) | IP: `generalLimiter` | Date ISO format, category enum |

---

## 6. Component Ownership

| Component | Owner | May Modify |
|---|---|---|
| `HomeSearchBar.tsx` | Dev 2 (customer frontend) | Homepage team |
| `FilterBar.tsx` | Dev 2 (customer frontend) | Category page team |
| `SearchAutocomplete.tsx` | Dev 2 (customer frontend) | Search team |
| `SalonCard.tsx` | Dev 2 (customer frontend) | Card display team |
| `app/api/search/*` | Dev 1 (backend) | Backend team |
| `lib/search/*` | Dev 1 (backend) | Backend team |
| `search_embeddings` (table) | Dev 1 (infra) | Migration required |

---

## 7. Testing Checklist

After ANY change to search components, verify:

- [ ] Homepage search routes to correct category page
- [ ] Category page search shows only category-scoped results
- [ ] Cross-category query shows redirect suggestion, not results
- [ ] Date picker works with quick chips AND calendar
- [ ] Selecting a date greys out unavailable salons (does NOT hide them)
- [ ] "Nächster Termin" label appears on greyed-out cards
- [ ] ILIKE results appear instantly, AI results appear after delay
- [ ] No banned design tokens (run Rule 20 grep)
- [ ] Dark mode pairs on all new elements
- [ ] `npm run build` passes
