# Roadmap B — Discovery API Cleanup (Deferred)

> **Execute ONLY after `roadmap-discover-unified-tabs.md` is live and stable in production.**
> **Purpose:** Clean up the orphaned `api/nail-discovery` route created for the old `/discover/nails` page.
> **Risk:** 🟡 MEDIUM — must verify zero callers before deleting any route.

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | How to Prevent |
|---|---|---|---|
| P0 — Audit callers | 🟢 SAFE | Nothing | Read-only grep |
| P1 — Delete orphan route | 🟡 MEDIUM | Any undiscovered caller of `api/nail-discovery` | Full grep audit in P0 |
| P2 — Add category param to `api/discover` | 🟡 MEDIUM | Existing category-filter callers | Read route first, test locally |

---

## P0 — Audit: Who Calls `api/nail-discovery`?

```bash
# Search for all callers of the nail-discovery API:
grep -rn "nail-discovery" app/ components/ lib/ --include="*.tsx" --include="*.ts"

# Also check for fetch calls by URL:
grep -rn "/api/nail-discovery" app/ components/ lib/ --include="*.tsx" --include="*.ts"
```

**Expected after `roadmap-discover-unified-tabs.md` is done:**
- 0 results (the old `/discover/nails` page was the only caller and is now a redirect)

**If results > 0:** STOP. Do not proceed. Fix those callers first.

---

## P1 — [DELETE] `app/api/nail-discovery/route.ts`

Only execute if P0 grep returns 0 results.

```bash
# Confirm zero callers one final time:
grep -rn "nail-discovery" app/ components/ lib/ --include="*.tsx" --include="*.ts"
# Must be 0 before deleting

# Delete:
rm app/api/nail-discovery/route.ts
# If directory is now empty:
rmdir app/api/nail-discovery/
```

> ✅ **DO:** Delete only after confirming zero callers.
> ❌ **DON'T:** Don't delete `api/discover/route.ts` or `api/discovery/route.ts` — those are active.

**Git commit:** `git add -A && git commit -m "DISC-API-P1: [DELETE] api/nail-discovery — orphaned after discover unification"`

---

## P2 — [MODIFY] Add `?category` server-side filter to `app/api/discover/route.ts` (optional)

**If P0 confirms `api/discover` already supports `?category`:** Skip this phase entirely.

**If it does NOT support `?category`:** Add server-side filtering so the client doesn't need to receive and filter the full feed:

```typescript
// Inside route.ts GET handler — add after parsing searchParams:
const category = url.searchParams.get("category");

// Add to Supabase query (adjust table/column names to match actual schema):
let query = supabase.from("discovery_items").select("*").order("created_at", { ascending: false });

if (category && category !== "alle") {
  query = query.eq("category", category);
}
```

> ⚠️ **BE CAREFUL P2:**
> Must read `app/api/discover/route.ts` fully before touching it. The column name may not be `category` — check the actual Supabase schema (`_rules/DB_SCHEMA.md`).

**Git commit:** `git add app/api/discover/route.ts && git commit -m "DISC-API-P2: add ?category server-side filter to api/discover"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| P0 | 🤖 Read | Grep for all nail-discovery callers | Roadmap A complete + stable |
| P1 | 🤖 Code | Delete orphan route | P0 = 0 results |
| P2 | 🤖 Code | Add ?category filter to api/discover | P0 confirms it's missing |

---

## Final Check

```bash
npm run build

# Route deleted:
ls app/api/nail-discovery/ 2>&1
# Expected: "No such file or directory"

# api/discover still exists:
ls app/api/discover/route.ts
# Expected: file present

# No lingering nail-discovery refs:
grep -rn "nail-discovery" app/ components/ lib/
# Expected: 0 results
```
