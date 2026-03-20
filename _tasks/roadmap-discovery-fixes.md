# Discovery v1 — Fix Roadmap (All 21 Gaps)

> Execute AFTER manual steps 1-2 are complete.
> Follows CLAUDE.md R1-R10 + new Rules 26-29.

---

## ⚠️ RUN MIGRATION FIRST — NOTHING WORKS WITHOUT THIS

The user MUST run `supabase/migrations/067_discovery.sql` in the Supabase SQL Editor before Phase 0.
Without it: no tables, no API routes, no admin, no feed, no likes, no saves — zero functionality.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| Manual 1 | 🟢 SAFE | Nothing | Supabase SQL Editor only |
| Manual 2 | 🟢 SAFE | Nothing | Feature flag toggle |
| Phase 0 | 🟢 SAFE | Nothing | Add middleware path, fix locale |
| Phase 1 | 🟢 SAFE | Nothing | New components only |
| Phase 2 | 🟡 MEDIUM | Discover page | Modifying page.tsx — read file first |
| Phase 3 | 🟡 MEDIUM | Detail page, ItemCard | Modifying existing components |
| Phase 4 | 🟢 SAFE | Nothing | New algorithm logic |
| Phase 5 | 🟡 MEDIUM | Admin page | Adding dnd-kit, modifying admin tabs |
| Phase 6 | 🟡 MEDIUM | Profile page | Modifying validations + profile save |
| Phase 7 | 🟢 SAFE | Nothing | Localization only |
| Phase 8 | 🟢 SAFE | Nothing | Smoke test + cleanup |

---

# PART 1: 🧑 MANUAL STEPS

### Manual 1 — Run Migration 067

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Open `supabase/migrations/067_discovery.sql` from your project
3. Copy entire contents → paste → click **"Run"**
4. Verify: go to Table Editor → you should see `discovery_items`, `discovery_staging`, `discovery_likes`, `discovery_saves`, `discovery_comments`, `discovery_interactions`, `discovery_boards`, `discovery_collections`, `discovery_products`

### Manual 2 — Enable Feature Flag

In SQL Editor, run:
```sql
INSERT INTO feature_flags (key, enabled, description)
VALUES ('discovery', true, 'Discovery platform feature')
ON CONFLICT (key) DO UPDATE SET enabled = true;
```

---

# PART 2: 🤖 CLAUDE CODE PHASES

## Phase 0 — Security + Infrastructure Fixes

**Gap #3, #14, #20, #21**

### [MODIFY] `middleware.ts`
Add `/discovery-admin` to `adminOnlyPaths` array:
```typescript
// Find the adminOnlyPaths array and add:
"/discovery-admin",
```

### [MODIFY] `components/layout/Header.tsx`
The `discover` key is already in NAV_LINKS. Verify the translation key `navigation.discover` exists in all locale files and renders correctly. If it shows wrong language, the fix is already deployed — verify on Vercel.

### [MODIFY] `.env.example`
Add these lines:
```
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
GEMINI_API_KEY=
```

> ⚠️ **BE CAREFUL**: Only APPEND to `.env.example`. Never delete existing lines. Never put real keys here.

**Commit**: `"phase 0: add discovery-admin to middleware + update .env.example"`

---

## Phase 1 — Missing Filter Components

**Gap #4, #5, #6, #7, #8**

### [NEW] `components/discovery/PatternSelector.tsx`
Horizontal scrollable pill selector for hair texture:
- Options: `All`, `Straight`, `Wavy`, `Curly`, `Coily`, `Protective`, `Bald`
- When category is `beard`: show `Full`, `Goatee`, `Stubble`, `Fade`, `Line-up` instead
- Props: `category: DiscoveryCategory`, `selected: string | null`, `onSelect: (texture: string | null) => void`
- Styled same as CategoryPills (same class pattern)

### [NEW] `components/discovery/StyleNamePills.tsx`
Auto-generated scrollable pills from distinct `style_name` values in DB:
- Fetch distinct style names: `GET /api/discovery/style-names`
- Horizontal scroll, pill style, show first 20
- Props: `selected: string | null`, `onSelect: (style: string | null) => void`
- Empty state: hide component entirely if no styles returned

### [NEW] `app/api/discovery/style-names/route.ts`
```typescript
// GET — returns distinct style_name values from published items
// Group by style_name, count items, return top 30 ordered by count desc
// Security: rate limit (IP-based), feature flag check
```

### [NEW] `components/discovery/FeaturedBoards.tsx`
Horizontal scroll of board cards:
- Fetch from `GET /api/discovery/boards`
- Each card: 2x2 cover image collage, board name, pin count
- Click → filter grid by board's category/gender/texture
- Props: `onBoardSelect: (filters: DiscoveryFilters) => void`

### [NEW] `app/api/discovery/boards/route.ts`
```typescript
// GET — returns active boards ordered by sort_order
// Include cover_images (first 4 items matching board filters)
// Security: rate limit, feature flag
```

### [NEW] `components/discovery/FilterDrawer.tsx`
Mobile slide-up drawer (framer-motion):
- Contains: CategoryPills, GenderToggle, PatternSelector, StyleNamePills
- Trigger: filter icon button (visible on mobile only, hidden md+)
- Backdrop overlay, drag-to-close
- "Apply" button at bottom
- "Reset" link to clear all filters

### [NEW] `components/discovery/DiscoveryErrorState.tsx`
Error state with retry:
- Icon: `AlertTriangle` from lucide-react
- Text: "Something went wrong"
- Retry button that calls `onRetry` prop
- Styled same as DiscoveryEmptyState

> ⚠️ **BE CAREFUL**: After creating each component, verify it's NOT dead code (Rule 26). Each component MUST be imported in Phase 2.

**Commit**: `"phase 1: create PatternSelector, StyleNamePills, FeaturedBoards, FilterDrawer, DiscoveryErrorState"`

---

## Phase 2 — Wire All Components to Discover Page

**Gap #12, #18 + wiring Phase 1 components**

### [MODIFY] `app/[locale]/discover/page.tsx`

This is the critical phase. READ the file first (Rule 8). The page already has CategoryPills, GenderToggle, SearchBar. Add:

1. Import and add `PatternSelector` below the existing filter row
2. Import and add `StyleNamePills` below PatternSelector
3. Import and add `FeaturedBoards` above the grid (only when no filters active)
4. Import and add `FilterDrawer` for mobile (triggered by a filter icon next to search)
5. Import and add `DiscoveryErrorState` in the error catch path
6. Import and add `PostFromDiscover` as a floating "+" button (bottom-right, above BottomNav)
7. Add `texture` and `style` state variables and pass to `fetchItems`
8. Pass `isAuthenticated` state to the grid/cards (fetch from `/api/profile`)
9. Add error state handling (try/catch around fetch, show DiscoveryErrorState)

**DO NOT** add `<Header />` or `<BottomNav />` (Rule 27).
**DO NOT** wrap in a fragment with layout elements.

**Updated filter state:**
```typescript
const [texture, setTexture] = useState<string | null>(null);
const [style, setStyle] = useState<string | null>(null);
```

**Updated fetchItems:**
```typescript
if (texture) params.set("texture", texture);
if (style) params.set("style", style);
```

> ⚠️ **BE CAREFUL**: This is the highest-risk phase. Read the existing file in FULL before editing. Don't rewrite — modify the existing code. Verify all 7 new imports resolve before committing. Run `npx tsc --noEmit` after editing.

**Commit**: `"phase 2: wire all filter components + floating post button + error state to discover page"`

---

## Phase 3 — Fix Video + Card Behavior

**Gap #10, #11, #12**

### [MODIFY] `components/discovery/VideoCard.tsx`

Add mute/unmute toggle button on grid cards:
- 🔊 speaker icon (bottom-right of video area)
- Default: muted
- Click toggles mute state
- Use `lucide-react` Volume2 / VolumeX icons

Add one-at-a-time behavior:
- Export a global `activeVideoId` signal (simple module-level variable)
- When this VideoCard becomes visible (IntersectionObserver), set `activeVideoId` to its item ID
- Other VideoCards check if they're active — if not, show thumbnail instead of iframe
- Result: only one TikTok iframe loads at a time → better performance

### [MODIFY] `components/discovery/ItemCard.tsx`

Fix auth prop passthrough:
- Currently `isAuthenticated` defaults to `false` and is never overridden
- Modify `DiscoveryGrid.tsx` to accept `isAuthenticated` prop and pass it to each ItemCard and VideoCard
- The discover page already has auth check — pipe it through

> ⚠️ **BE CAREFUL**: Don't break the existing card layout. Only ADD the mute button and modify the observer logic. Don't restructure the JSX.

**Commit**: `"phase 3: video one-at-a-time + mute toggle on grid + auth passthrough"`

---

## Phase 4 — Recommendation Algorithm

**Gap #16, #17**

### [MODIFY] `lib/discovery-algorithm.ts`

Replace basic sorting with weighted recommendation:

```
Score = (profileMatch * 0.5) + (popularity * 0.2) + (recency * 0.2) + (diversity * 0.1)
```

- **profileMatch**: boost items matching user's `disc_gender`, `disc_hair_texture`, suppress beard for female
- **popularity**: `like_count + save_count + (view_count * 0.1)` normalized to 0-1
- **recency**: exponential decay, items from last 7 days score 1.0, older items decay
- **diversity**: penalty for showing 3+ items of same category in a row
- **Cold start**: if no profile → sort by popularity + recency only

### [NEW] `lib/guest-saves.ts`

Guest saves via localStorage:
```typescript
export function getGuestSaves(): string[] { /* read from localStorage */ }
export function addGuestSave(itemId: string): void { /* write to localStorage */ }
export function removeGuestSave(itemId: string): void { /* write to localStorage */ }
export function syncGuestSaves(userId: string): Promise<void> { /* POST to /api/discovery/save/sync */ }
```

### [MODIFY] `components/discovery/SaveButton.tsx`

If user is NOT authenticated:
- Save to localStorage via `addGuestSave()`
- Show save animation anyway
- On next login → `syncGuestSaves()` is called from auth callback

> ⚠️ **BE CAREFUL**: The algorithm must NEVER crash if the user has no profile. Always fallback to popularity sort.

**Commit**: `"phase 4: weighted recommendation algorithm + guest saves via localStorage"`

---

## Phase 5 — Admin Improvements

**Gap #9**

### Install dnd-kit:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### [MODIFY] `app/[locale]/dashboard/discovery-admin/page.tsx`

In the "Published" tab (`PublishedTab`):
- Wrap the grid with `DndContext` + `SortableContext` from `@dnd-kit/sortable`
- Each item card becomes a `useSortable` draggable
- On drag end: reorder items, call `PATCH /api/admin/discovery` with new `sort_order` values
- Drag handle: small grip icon (GripVertical from lucide-react) top-left of each card

> ⚠️ **BE CAREFUL**: `@dnd-kit` must be installed first. Don't import before installing. The admin page is 600 lines — READ IT FIRST. Only modify the PublishedTab function, not the entire file.

**Commit**: `"phase 5: add drag-and-drop reorder to admin published tab"`

---

## Phase 6 — Profile Integration

**Gap #13, #19**

### [MODIFY] `lib/validations.ts`

Add `disc_*` fields to `updateProfileSchema`:
```typescript
disc_gender: z.enum(["male", "female", "unisex"]).nullable().optional(),
disc_hair_texture: z.string().max(30).nullable().optional(),
disc_hair_length: z.string().max(30).nullable().optional(),
disc_face_shape: z.string().max(30).nullable().optional(),
disc_profile_set: z.boolean().optional(),
```
Add these BEFORE `.strict()`.

### [MODIFY] Profile API (`app/api/profile/route.ts`)

Verify the PATCH handler accepts `disc_*` fields. If it uses `.strict()` from the Zod schema and the fields aren't there, profile preferences will be silently stripped.

> ⚠️ **BE CAREFUL**: READ the existing `updateProfileSchema` in full. Place new fields BEFORE `.strict()`. Don't change existing fields.

**Commit**: `"phase 6: add disc_* fields to profile validation + API"`

---

## Phase 7 — Localization Fixes

**Gap #14, #15**

### [MODIFY] `app/[locale]/terms/discovery/page.tsx`

Replace hardcoded German content with `next-intl` translations:
- Import `useTranslations` or use server-side `getTranslations`
- Add `discovery_tos` section to all 4 locale files with translated content
- Key sections: title, preamble, content guidelines, prohibited content, moderation, rights, removal, liability

### [MODIFY] `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`

Add `discovery_tos` section with all ToS paragraphs in each language.

> ⚠️ **BE CAREFUL**: Don't change existing translation keys. Only ADD the new `discovery_tos` section. Verify all 4 files have identical key structure.

**Commit**: `"phase 7: localize discovery ToS page in all 4 locales"`

---

## Phase 8 — Smoke Test + Cleanup

**Rule 29 compliance**

Run ALL checks:

```bash
# 1. Build
npm run build

# 2. Type check
npx tsc --noEmit 2>&1 | grep "has no exported member" | head -10

# 3. Dead code check
for f in components/discovery/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l)
  [ "$count" -eq 0 ] && echo "⚠️ DEAD CODE: $f"
done

# 4. Layout duplication check
grep -rn "import.*Header\|import.*BottomNav" app/\[locale\]/ --include="*.tsx" | grep -v layout.tsx

# 5. Middleware check
grep "discovery-admin" middleware.ts

# 6. Translation key check
for locale in en de fr it; do
  grep -c "discover" messages/$locale.json
done

# 7. Banned tokens check (Rule 20)
grep -Ern "text-dark|bg-black|bg-gray-|text-gray-" components/discovery/ --include="*.tsx" | head -5
```

Fix ANY failures before pushing.

### Clean up duplicate files

Delete all `"Component 2.tsx"` duplicate files in `components/discovery/`:
```bash
rm components/discovery/*\ 2.tsx
```

**Commit**: `"phase 8: smoke test pass + cleanup duplicate files"`

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual 1 | 🧑 | Run migration 067 in Supabase | Nothing |
| Manual 2 | 🧑 | Enable feature flag `discovery` | Manual 1 |
| Phase 0 | 🤖 | Middleware + .env.example | Manual 1 |
| Phase 1 | 🤖 | Create 5 missing components | Phase 0 |
| Phase 2 | 🤖 | Wire components to discover page | Phase 1 |
| Phase 3 | 🤖 | Fix video + card behavior | Phase 2 |
| Phase 4 | 🤖 | Recommendation algorithm + guest saves | Phase 2 |
| Phase 5 | 🤖 | Admin drag-and-drop (install @dnd-kit) | Phase 0 |
| Phase 6 | 🤖 | Profile disc_* validation | Phase 0 |
| Phase 7 | 🤖 | Localize ToS page | Phase 0 |
| Phase 8 | 🤖 | Smoke test + cleanup | ALL above |
