# SelectedCheckBadge

**Layer: 1** (chrome, selection affordance).

**Purpose.** The ONE universal "selected" marker for staff / barber pickers (LOCKFILE §13.3; folded from CANON §6, 2026-07-10). Replaces the old per-picker treatments (ink ring in StaffPicker, ink border-2 in StaffListSheet, dark photo-overlay in SalonWalkInPanel). The avatar stays full and UNCOVERED; selection is an ink circle + white check at the bottom-right corner, with a 2px white border so it reads off any photo. Chosen over the photo-overlay because for a person-picker the face is the content.

**File.** `components-legacy/ui/SelectedCheckBadge.tsx`

**Public API.** `<SelectedCheckBadge selected size? className? />`. `selected: boolean` (renders nothing when false). `size?: number` (default 22; the check scales to ~0.55x). Drop it inside an avatar's `relative` wrapper, NOT inside an `overflow-hidden` circle (it would clip).

**Use for.** Any staff/barber selection in a picker: booking `StaffPicker`, `StaffListSheet`, walk-in barber row. **Don't reuse for.** Generic checkboxes (use a real checkbox) or service/add toggles (use the add-toggle pattern).

**Visual.** ink `bg-s-ink` circle, white `Check` (strokeWidth 3), `border-2 border-white`, `-bottom-1 -right-1`, `z-[2]`.

**Provenance.** V3-D421 (2026-06-01): the "corner check badge" the user picked over a photo-overlay (face stays visible). Applied everywhere per the universal-components rule (LOCKFILE §13.3, folded from CANON §6).
