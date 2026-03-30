# R08: Dead Code & Scope Cleanup

> **Wave 1** — Parallel-safe. No dependencies on other roadmaps.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Delete dead discovery components | 🟢 SAFE | Broken imports only if files ARE used | Already audited — 6 files confirmed unused. Verify with `npm run build` after. |
| Phase 2: Spa/Waxing/Makeup "Coming Soon" | 🟢 SAFE | Visual change only | Use existing `<EmptyState>` component. No logic changes. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Delete discovery dead code (6 files)
- Phase 2: Wrap spa/waxing/makeup in "Coming Soon"
- Phase 3: Post-Execution Smoke Test

---

## Phase 1: Discovery Dead Code Audit (CORRECTED)

> ⚠️ **CORRECTION**: The original audit incorrectly flagged 6 files as dead code. They ARE imported in `discover/page.tsx`, `discovery-admin/page.tsx`, and other components. **DO NOT DELETE THEM.**

#### Instructions
1. **SKIP all deletions.** The 6 originally flagged files (`AIProcessingIndicator`, `DiscoveryEmptyState`, `DiscoveryErrorState`, `DiscoveryGridSkeleton`, `FeaturedBoards`, `LikeButton`) are actively used.
2. Instead, do a fresh grep to find any TRULY dead files in `components/discovery/` — files with zero imports outside themselves.
3. If you find any truly dead files, list them but do NOT delete without confirming.
4. Proceed directly to Phase 2.

---

## Phase 2: Spa/Waxing/Makeup "Coming Soon" State

**DO NOT delete these files.** Wrap their content in `<EmptyState>` so the category pages display a clean "Coming Soon" message.

#### Files
- `[MODIFY]` `components/spa/SpaSections.tsx`
- `[MODIFY]` `components/waxing/WaxingSections.tsx`
- `[MODIFY]` `components/makeup/MakeupSections.tsx`

#### Instructions
1. Import `EmptyState` from `@/components/ui/EmptyState`.
2. Import `Sparkles` (or `Palette`, `Scissors`) from `lucide-react`.
3. Replace the component's return JSX with:

```tsx
return (
  <section className="py-16 px-4">
    <EmptyState
      icon={Sparkles}
      title="Kommt bald"
      description="Wir arbeiten daran, diese Kategorie für dich verfügbar zu machen."
      illustration="coming-soon"
    />
  </section>
);
```

4. Keep the existing props interface — don't break caller signatures.

#### DO / DON'T Examples
✅ **DO**
```tsx
import { EmptyState } from '@/components/ui/EmptyState';
import { Sparkles } from 'lucide-react';
// ... return <EmptyState ... />
```

❌ **DON'T**
```tsx
// Don't delete the component or its page route
// Don't build a custom "coming soon" card — use the shared EmptyState
```

---

## Phase 3: Smoke Test

#### Verification
```bash
npm run build        # 0 errors
npx tsc --noEmit     # 0 type errors
# Dead code re-check:
for f in AIProcessingIndicator DiscoveryEmptyState DiscoveryErrorState DiscoveryGridSkeleton FeaturedBoards LikeButton; do
  grep -rn "$f" components/ app/ --include="*.tsx" | grep -v node_modules | head -1
done
# Must return nothing
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Delete dead discovery code | Nothing |
| Phase 2 | 🤖 | Spa/Waxing/Makeup "Coming Soon" | Nothing |
| Phase 3 | 🤖 | Smoke Test | All phases |
