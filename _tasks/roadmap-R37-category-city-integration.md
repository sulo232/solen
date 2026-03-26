# Category & City Integration Roadmap

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | SEO Metadata & Static Generation | Ensure `generateStaticParams` and `generateMetadata` properly handle the transition back from `CityPage` logic to checking localized category rules. |
| Phase 2 | 🔴 HIGH | UI Consistency / Routing | `CategoryPage.tsx` manages complex grids. Extending it to accept `city` without breaking the default fallback behavior (no city) is critical. |
| Phase 3 | 🟢 SAFE | Salon Card Favoriting | Adding the `Set<string>` favorites logic is isolated strictly to the frontend client component state. |

## R2: SEPARATE MANUAL VS CODE PHASES

**🤖 CLAUDE CODE PHASES**
- **Phase 1**: Update `app/[locale]/[city]/[category]/page.tsx` to dynamically route to specialized `CategoryPage.tsx` grids instead of generic `CityPage.tsx`.
- **Phase 2**: Extend `components/CategoryPage.tsx` to ingest the `city` parameter safely and integrate heart/favorite states on the `SalonCard`.

**🧑 MANUAL PHASES**
- None required.

---

## Phase 1: Dynamic Router Injection

Modify the multi-city dynamic route to import and render the `CategoryPage` component with its specialized `AboveGrid` and `BelowGrid` properties based on the requested category.

**Target File**:
- `[MODIFY] app/[locale]/[city]/[category]/page.tsx`

### ✅ DO
```tsx
import { CoiffeurAboveGrid, CoiffeurBelowGrid } from "@/components/coiffeur/CoiffeurSections";
import { BarbershopAboveGrid, BarbershopBelowGrid } from "@/components/barber/BarberSections";
// ... imports for Nails, Spa, Makeup, Waxing ...
import CategoryPage from "@/components/CategoryPage";

// Inside the component:
let aboveGrid = null;
let belowGrid = null;

switch (category) {
  case "coiffeur":
    aboveGrid = <CoiffeurAboveGrid />;
    belowGrid = <CoiffeurBelowGrid />;
    break;
  // ... cases for other categories ...
}

return (
  <CategoryPage
    category={category}
    city={city}
    aboveGrid={<Suspense fallback={null}>{aboveGrid}</Suspense>}
    belowGrid={belowGrid}
  />
);
```

### ❌ DON'T
```tsx
// Do not render the generic CityPage
return <CityPage ... /> 
```

> ⚠️ **BE CAREFUL**:
> - **What could go wrong**: Next.js compiler errors if an imported component like `CoiffeurAboveGrid` cannot be resolved.
> - **Files not to touch**: Do NOT delete the original specialized directories (`components/coiffeur/`, `components/barber/`, etc.), as they contain the SEO-rich text segments required for this phase.
> - **Check**: Double-check the exact import paths for the category sections (e.g., `components/barber/BarbershopSections.tsx` vs `components/barber/BarberSections.tsx` before importing).

---

## Phase 2: Upgrading CategoryPage.tsx

Modify `CategoryPage.tsx` to use the `city` parameter within the API fetching and display it accurately in the Hero title and breadcrumbs. Introduce the `favoriteIds` state logic natively directly copied from `CityPage.tsx` to ensure feature parity inside the specific category context.

**Target File**:
- `[MODIFY] components/CategoryPage.tsx`

### ✅ DO / DIFF
```diff
interface CategoryPageProps {
  category: SalonCategory;
+ city?: CitySlug;
  aboveGrid?: React.ReactNode;
  belowGrid?: React.ReactNode;
}

// Inside fetch url builders
const buildUrl = useCallback((p: number) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("category", category);
+ if (city) params.set("city", city);
  // ...
}, [searchParams, category, city]);

// In the JSX Rendering mapping
<SalonCard
  key={salon.id}
  salon={salon}
  locale={locale}
+ isFavorited={favoriteIds.has(salon.id)}
+ onFavoriteToggle={handleFavoriteToggle}
```

### ❌ DON'T
```tsx
// Do not crash the page if `city` is undefined. Always treat it as an optional parameter.
// Do not remove the selectedDate handling already present in the SalonCard render map.
```

> ⚠️ **BE CAREFUL**:
> - **What could go wrong**: If `<SalonCard />` is passed `isFavorited` but `handleFavoriteToggle` has bad `this` context/dependency array, clicking the heart breaks.
> - **Files not to touch**: Ensure the underlying `components/SalonCard.tsx` keeps operating identically.
> - **Check**: The `city` prop MUST be marked optional (`city?: CitySlug`) because this component is STILL used directly by backwards compatible files like `app/[locale]/coiffeur/page.tsx` where city data isn't directly passed via params.

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Dynamic Router Injection (`[category]/page.tsx`) | None |
| Phase 2 | 🤖 | Upgrading `CategoryPage.tsx` | Phase 1 |

## VERIFICATION STEPS

1. **Commit**: `git commit -m "feat(routing): integrate explicit category pages directly into multi-city schema"`
2. **Run Dev**: `npm run dev`
3. **Smoke Test**: Navigate to `http://localhost:3000/de/basel/coiffeur` and confirm that specific Coiffeur elements load accurately, the h1 title reads "COIFFEUR IN BASEL" instead of generic, and that salon cards correctly display and handle the favorite "heart" toggle.
