# Roadmap: Next-Gen Discovery (Map & Grid Equality)

## Breakage Risk Assessment
| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1.1 | 🔴 HIGH | Search page layout | Do not delete existing `SearchGrid`. Wrap it in a new Split-View container alongside MapView. |
| Phase 1.2 | 🟡 MEDIUM | Mobile scrolling | Ensure CSS `height: 100dvh` and `overflow-hidden` are applied correctly to prevent clipping. |

## 🤖 CLAUDE CODE PHASES

### Phase 1.1: Desktop Split-View Layout
Transform the search page into a 50/50 Map/Grid architecture matching luxury booking sites.

- `[MODIFY]` `app/[locale]/search/page.tsx` (or equivalent discovery page)
- `[MODIFY]` `components/MapView.tsx`

✅ **DO:** Use a side-by-side flex/grid layout for `md:` breakpoints (`w-1/2`).
❌ **DON'T:** Use fixed absolute positioning for the grid, as it ruins standard scroll behavior.

> ⚠️ **BE CAREFUL:** The existing MapView might expect full width. Ensure you pass a prop or rely on CSS grid/flex to constrain its width to 50% without breaking Mapbox/Leaflet render cycles. Check `UI_RULES.md` for proper premium spacing (8-point grid).
- **Verification:** `npm run build` -> `git commit -m "phase 1.1: implement desktop split-view discovery"` -> visually verify at `/search`.

### Phase 1.2: Mobile "Coin-Flip" FAB & Framer Motion
Implement the fluid floating action button for mobile users to swap views instantly.

- `[NEW]` `components/ui/MapToggleFAB.tsx`
- `[MODIFY]` `app/[locale]/search/page.tsx`

✅ **DO:** Use Framer Motion (`AnimatePresence`) for instantly swapping views.
❌ **DON'T:** Use a standard `<a>` tag that causes a hard, jarring page reload.

> ⚠️ **BE CAREFUL:** Ensure the FAB uses `z-overlay` (z-index 40) so it floats above the grid but below modals. Ensure `backdrop-blur-glass` and a subtle `shadow-warm-md` is applied to the button for the premium Apple-like feel.
- **Verification:** `npm run build` -> `git commit -m "phase 1.2: add mobile map toggle FAB"` -> test tap targets on mobile view.

## Execution Order
| Step | Type | What | Depends On |
|---|---|---|---|
| 1 | 🤖 | Desktop Split-View | Nothing |
| 2 | 🤖 | Mobile FAB & Motion | Step 1 |
