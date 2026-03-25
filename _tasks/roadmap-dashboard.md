# Partner Dashboard Roadmap (`/dashboard`)

> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting. 

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Global Zone 3 Purity | 🟢 SAFE | Visual regressions | Strip `backdrop-blur` from Navigation and Layouts carefully. Use `bg-white` and `shadow-warm-lg`. |
| Phase 2: Form Input Sweep | 🟡 MEDIUM | Layout shift in tight B2B grids | Upgrading inputs from 8px to 12px might cause padding issues in ultra-dense rows (like `ScheduleGrid`). Test flex layouts after apply. |
| Phase 3: Primary CTA Sweep | 🔴 HIGH | Component alignment | Extracting primary "Save/Submit" buttons from 8px to 99px pills might clash with 8px utility buttons if placed adjacently. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Verify Partner App layout on mobile to ensure solid nav bars don't break content scrolling.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Design — Strip Glassmorphism globally from Dashboard Layouts
- Phase 2: Design — Resolve Token Confusion (Inputs vs Utility Buttons vs CTAs)
- Phase 3: Feature — Sticky Action Bars for Long Forms
- Phase 4: Post-Execution Smoke Test

---

## Phase 1: Design — Global Zone 3 Purity

The Partner App is strictly **Zone 3: Clean Functional**. Absolutely zero decorative elements, blobs, or glassmorphism are allowed here (V3 §27).

#### Exact Files
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx`

#### Instructions
1. Find the mobile sidebar overlay `<motion.aside>`. Replace `bg-white/95 backdrop-blur-xl shadow-glass` with `bg-white shadow-warm-2xl`.
2. Find the mobile top bar. Replace `bg-white/90 backdrop-blur-lg` with `bg-white shadow-warm-sm`.
3. Ensure the Sidebar component itself conforms to solid clean surfaces.

#### DO / DON'T Examples
✅ **DO**
```tsx
<div className="sticky top-0 z-20 bg-white border-b border-s-ink/5 px-4 py-3">
```

❌ **DON'T**
```tsx
// BANNED in Zone 3 Dashboards
<div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg">
```

---

## Phase 2: Design — Resolving Token Confusion

The dashboard has a special exception (V3 §9): High-density B2B dashboards CAN use 8px (`rounded-button`) for utility buttons and 12px for cards.
HOWEVER:
1. **Forms** must always be `rounded-input` (12px).
2. **Primary CTAs** (Save, Submit) must always be `rounded-btn` (99px).

#### Exact Files
- `[MODIFY]` `components/dashboard/ScheduleGrid.tsx`
- *(Sweeps across other 20+ components as encountered during execution)*

#### Instructions
1. **Inputs**: In `ScheduleGrid.tsx`, the `<input type="time">` uses `rounded-button`. Change it to `rounded-input` (12px).
2. **Primary Actions**: The "Speichern" (Save) button uses `rounded-button`. Change it to `rounded-btn` (99px).
3. **Leave Utility as-is**: The sidebar nav links and small toggle checkboxes remain 8px/standard.

---

## Phase 3: Feature — Sticky Action Bars

B2B users often fill out long forms (`ScheduleGrid`, `Services`, `Settings`). The "Save" button is currently at the bottom of the scroll view.

#### Exact Files
- `[MODIFY]` `components/dashboard/ScheduleGrid.tsx`

#### Instructions
1. Wrap the "Save" button in a sticky footer container that docks to the bottom of the viewport or parent container: `sticky bottom-0 bg-white border-t p-3 z-10`.
2. This improves usability drastically for salon owners configuring massive service menus.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Strip Glassmorphism (Layout) | Nothing |
| Phase 2 | 🤖 | Form & CTA Token Sweep | Nothing |
| Phase 3 | 🤖 | Sticky Action Bars | Phase 2 |
| Phase 4 | 🤖 | Smoke Test | All phases |
