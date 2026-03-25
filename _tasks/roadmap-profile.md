# User Profile & Account Roadmap (`/profile`)

> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting. 

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Zone 3 Enforcement| 🟢 SAFE | Visual regressions | Update modal primitives carefully to maintain z-index contexts. |
| Phase 2: Design Sync | 🟡 MEDIUM | Form accessibility | Replacing `rounded-button` with `rounded-btn` on buttons and `rounded-input` on text fields requires exact targeting so layouts don't break. |
| Phase 3: Component Unification| 🟢 SAFE | Missing imports | Ensure `<EmptyState>` is accurately imported from `@/components/ui/EmptyState`. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Test the "Cancel Booking" flow to ensure the solid modal works exactly like the glass modal did.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Design — Zone 3 Strict Enforcement (Modal & Radii)
- Phase 2: Feature — Empty State component standardization
- Phase 3: Post-Execution Smoke Test

---

## Phase 1: Design — Zone 3 Strict Enforcement

The User Profile is strictly **Zone 3: Clean Functional**. Absolutely zero decorative elements, blobs, or glassmorphism are allowed here. 

#### Exact Files
- `[MODIFY]` `components/ProfilePage.tsx`
- `[NEW]` (or Modify) `components/ui/SolidModal.tsx` (if needed, or just update the JSX inside ProfilePage)

#### Instructions
1. **Glass Validation:** The `CancelModal` currently uses `<GlassModal>`. Zone 3 forbids this. Replace it with a pure white modal overlay using `--bg-surface` backdrop (opacity 70) and `--raised` (pure white) card with `shadow-warm-xl` and 20px radius.
2. **Text Inputs & Textareas:** Find every `textarea` and `input` in `SettingsSection` using `rounded-button`. Change them to `rounded-input` (12px).
3. **Buttons:** Find every `<button>` and `<Link>` using `rounded-button`. Change them to `rounded-btn` (99px).
4. **Toggles:** Ensure the notification toggle switches use strict `rounded-pill`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<input className="w-full px-3 py-2.5 rounded-input border border-s-ink/10 bg-white" />
<button className="px-5 py-2.5 rounded-btn bg-s-coral text-white">Speichern</button>
```

❌ **DON'T**
```tsx
<input className="w-full px-3 py-2.5 rounded-button" /> // BANNED TOKEN
```

> ⚠️ **BE CAREFUL**: Do not mutate `CLAUDE.md`. Only edit `ProfilePage.tsx`. When sweeping for `rounded-button`, make sure you distinguish between text inputs (which need 12px `rounded-input`) and clickable actions (which need 99px `rounded-btn`).

---

## Phase 2: Feature — Component Unification

The Profile page currently uses custom-coded empty states for Bookings, Favorites, and Loyalty Cards. `CLAUDE.md` explicitly mandates the use of `<EmptyState>` for these scenarios.

#### Exact Files
- `[MODIFY]` `components/ProfilePage.tsx`

#### Instructions
1. Import `EmptyState` from `@/components/ui/EmptyState`.
2. Replace the custom `<div className="text-center p-6...">` empty states for Upcoming Bookings, Past Bookings, Favorites, and Stamp Cards with the matching `<EmptyState>` component.
3. Pass `illustration="no-results"` to ensure standard layout.

#### DO / DON'T Examples
✅ **DO**
```tsx
<EmptyState 
  icon={Calendar} 
  title={t("noBookingsYet")} 
  illustration="no-results" 
  action={{ label: t("bookNow"), href: `/${locale}/coiffeur` }} 
/>
```

❌ **DON'T**
```tsx
// DO NOT USE CUSTOM EMPTY STATES
<div className="bg-white rounded-card text-center p-6"><Calendar/><p>Nichts hier</p></div>
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Strict V3 Tokens & Modals | Nothing |
| Phase 2 | 🤖 | Empty State Unification | Phase 1 |
| Phase 3 | 🤖 | Smoke Test | All phases |
