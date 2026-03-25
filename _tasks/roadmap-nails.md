# Nails Sub-Site Roadmap (`/nails` & `/discover/nails`)

> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting. 

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: URL Filter State | 🟡 MEDIUM | Infinite fetch loops | The `fetchItems` effect in `NailDiscoveryGrid.tsx` depends on search parameters. Ensure URL parsing doesn't trigger continuous re-fetches. |
| Phase 2: Design Sync | 🟢 SAFE | Visual regressions | Use explicit V3 design tokens (`shadow-warm-xl`, `rounded-btn`, etc). |
| Phase 3: Shape Picker UI | 🔴 HIGH | UI breakage in Booking Flow | Changing `rounded-button` to explicit radii might misalign the highly dense grid layout in `ShapeLengthPicker.tsx`. Must test inside `NailBookingSteps.tsx`. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Upload actual sample designs to Supabase `nail_designs` table so the discovery masonry grid isn't empty after deployment.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Feature — URL Sync for Masonry Discovery Grids
- Phase 2: Design — V3 Enforcement on NailsSections
- Phase 3: Feature & Design — Shape Selector Component Refactor
- Phase 4: Post-Execution Smoke Test

---

## Phase 1: Feature — URL Sync for Masonry Grids

The masonry grid `NailDiscoveryGrid.tsx` currently holds filter state (`style`, `shape`, `material`) internally. This breaks deep-linking and back-button behavior for Pinterest-style discovery.

#### Exact Files
- `[MODIFY]` `components/nail/NailDiscoveryGrid.tsx`
- `[MODIFY]` `components/nail/NailDiscoveryFilters.tsx`

#### Instructions
1. In `NailDiscoveryGrid.tsx`, import `useSearchParams` and `useRouter`.
2. Map initial state to `searchParams.get('style')` etc.
3. Update `setStyle` to call `router.push('/discover/nails?style=' + value)`.
4. Wrap the parent component exporting `NailDiscoveryGrid` in `<Suspense>` if used directly in a Next.js `page.tsx`.

#### DO / DON'T Examples
✅ **DO**
```tsx
const router = useRouter();
const searchParams = useSearchParams();
const currentStyle = searchParams.get('style') || null;

const setStyle = (val: string) => {
  const params = new URLSearchParams(searchParams);
  if (val) params.set('style', val);
  else params.delete('style');
  router.push(`?${params.toString()}`);
};
```

❌ **DON'T**
```tsx
// Don't rely purely on internal state for primary navigation/discovery filters
const [style, setStyle] = useState<string | null>(null);
```

---

## Phase 2: Design — V3 Enforcement on Sections

#### Exact Files
- `[MODIFY]` `components/nail/NailsSections.tsx`

#### Instructions
1. **Eyebrow Labels**: Change the `label` prop rendering in `<PillGroup>` to `text-[11px] tracking-[0.2em] uppercase text-s-amber font-heading font-bold`.
2. **Glassmorphism**: Remove custom `bg-white/70 backdrop-blur-sm` string and use semantic V3 token `--glass-bg-card` logic.
3. **Buttons**: Change "Inspo entdecken" from `rounded-button` to `rounded-btn` (99px pill).
4. **Card Hovers**: Inspo placeholder cards use `hover:scale-[1.03]`. Scaling is strictly banned in V3. Change to `hover:-translate-y-[5px] hover:shadow-warm-xl`.
5. **Section Titles**: Upgrade `Nail Inspo` from `text-xl` to `text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em]`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<div className="hover:-translate-y-[5px] hover:shadow-warm-xl transition-all duration-250">
```

❌ **DON'T**
```tsx
<div className="hover:scale-[1.03] hover:shadow-md"> // Banned effects
```

> ⚠️ **BE CAREFUL**: Do not mutate the actual grid layout. Only swap out the hover physics and border radius utility classes.

---

## Phase 3: Feature & Design — Shape Selector Refactor

#### Exact Files
- `[MODIFY]` `components/nail/ShapeLengthPicker.tsx`

#### Instructions
V3 Rule 2 states "ALL BUTTONS ARE PILLS (99px). No exceptions." However, `ShapeLengthPicker` uses squarish buttons to form a dense visual grid. 

To comply, we must conceptually change these from "buttons" to "selectable cards".
1. Remove `rounded-button` (8px).
2. Apply `rounded-[12px]` (Dashboard internal standard radius for dense UI) to the shape elements.
3. Remove `rounded-button` from the length selectors.
4. Ensure the active state uses the V3 standard `shadow-coral-glow`.

> ⚠️ **BE CAREFUL**: Changing border radii inside dense grids can break visual alignment. Ensure padding (`p-2`) still looks correct inside a 12px radius.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | URL Sync Masonry Grid | Nothing |
| Phase 2 | 🤖 | V3 Design (NailsSections) | Nothing |
| Phase 3 | 🤖 | Shape Picker (V3 refactor) | Nothing |
| Phase 4 | 🤖 | Smoke Test | All phases |
