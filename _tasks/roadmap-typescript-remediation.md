# Roadmap: Solen Platform TypeScript Remediation (Phase 2)

> **CONTEXT**: This roadmap aims to eliminate the remaining ~130 legacy TypeScript errors across the Solen platform. It follows the manual and automated fixes deployed in Phase 1 that reduced errors from 250+ down to ~130. These remaining errors are primarily focused on broken Supabase Postgrest type calls, missing `next-intl` translation namespaces causing `useTranslations` strict-type failures, and missing interface definitions in API routes.

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Purely adding empty TS keys to `de.json`, `en.json`, `fr.json`, `it.json` |
| Phase 2 | 🟡 MEDIUM | Runtime API routes if types are forced incorrectly | Verify Supabase `.select()` and `.execute()` query formats |
| Phase 3 | 🟡 MEDIUM | Build process / Vercel Edge functions | Do not use Node-specific types like `Request` vs `NextRequest` improperly |
| Phase 4 | 🟢 SAFE | Nothing | Strict type checks inside React components |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Resolve `next-intl` Missing Namespace Errors
The most persistent UI error is `useTranslations("namespace")` throwing `Argument of type '"namespace"' is not assignable to parameter of type 'MessageKeys...'`. This happens because `messages/de.json` is missing several dashboard namespaces.

- **[MODIFY]** `messages/de.json`
- **[MODIFY]** `messages/en.json`
- **[MODIFY]** `messages/fr.json`
- **[MODIFY]** `messages/it.json`

**Actions**:
1. Scan the `tsc --noEmit` output for components using `useTranslations("nail_dashboard")` (or similar missing keys) and add an empty object for that namespace in all locale files to satisfy the TypeScript literal checker. e.g., `"nail_dashboard": {}`.

> ⚠️ **BE CAREFUL**: Do not delete existing translation keys in the `messages/*.json` files. Do not format the JSON file incorrectly. After this phase, run `npx tsc --noEmit` to ensure translation generic errors disappear.

**Code Example**:
✅ **DO**
```json
  "nail_dashboard": {
    "loading": "Lade...",
    "timeline_no_designs": "Keine Designs gefunden"
  }
```
❌ **DON'T**
```typescript
  // Don't cast to any if the namespace simply doesn't exist in the JSON schema.
  const t = useTranslations("nail_dashboard") as any;
```

---

### Phase 2: Supabase Postgrest API Syntax & Type Fixes
Several server routes have errors related to `PostgrestBuilder` (e.g., `Expected 4-6 arguments, but got...` or `Property 'catch' does not exist on type 'PostgrestBuilder'`).

- **[MODIFY]** `app/api/admin/help/route.ts`
- **[MODIFY]** `lib/strikes.ts`
- **[MODIFY]** `app/api/auth/callback/route.ts`
- **[MODIFY]** `app/api/bookings/[id]/inspo/route.ts`
- **[MODIFY]** `app/api/admin/nail/generate/route.ts`

**Actions**:
1. Review the Supabase `.from()` and `.select()` chained modifiers.
2. If the error is `Property 'catch' does not exist`, ensure the query is `await`-ed before calling `.catch()` or use proper `try/catch` syntax.
3. Fix mismatched column parameters when doing `.update()` or `.insert()`.

> ⚠️ **BE CAREFUL**: Modifying API routes can break customer logic. Ensure the output object structural integrity matches the previous implementation exactly. Do not change business logic, only type annotations and basic syntax structure.

**Code Example**:
✅ **DO**
```typescript
  try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
  } catch (err) {
    console.error(err);
  }
```
❌ **DON'T**
```typescript
  // PostgrestBuilder does not have a native Promise .catch before awaited!
  const { data } = supabase.from('table').select('*').catch(console.error);
```

---

### Phase 3: Component State and Prop Interface Remediation
Several legacy components have implicit `any` parameters in their `onChange` or `map` functions, or are missing properties in their mapped type structures.

- **[MODIFY]** `components/nail/DesignHistoryTimeline.tsx`
- **[MODIFY]** `components/nail/TechPortfolio.tsx`
- **[MODIFY]** `components/dashboard/nail/DynamicPricingConfig.tsx`
- **[MODIFY]** `components/barber/LoyaltyCardList.tsx`

**Actions**:
1. Define explicitly typed `interface` contracts for props and map functions.
2. For Event types, use `React.ChangeEvent<HTMLInputElement>` rather than `any`.
3. If an API returns an untyped object, type it as `Record<string, any>` if a strict type is not immediately available, rather than throwing implicit any errors.

> ⚠️ **BE CAREFUL**: Do not assume optional props are guaranteed. Add `?` or default fallbacks where necessary. Keep the glassmorphism and structural aesthetic untouched.

---

## 🧑 MANUAL PHASES

None required for this remediation roadmap. All changes are pure codebase typing updates.

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Fix Locale Namespaces | Nothing |
| Phase 2 | 🤖 | Database API Type Syntax | Phase 1 |
| Phase 3 | 🤖 | React Interface Remediation | Phase 2 |

---

## VERIFICATION STEPS PER PHASE

For each phase completed, run:
```bash
npx tsc --noEmit
```
The error count must deterministically drop. The final commit should look like:
`git commit -m "chore: resolve remaining 130 typescript definitions across dashboard and api"`
