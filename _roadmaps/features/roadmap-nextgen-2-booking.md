# Roadmap: Next-Gen Booking (Hyper-Fluid Modal)

## Breakage Risk Assessment
| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 2.1 | 🔴 HIGH | Booking submission flow | Do not touch the Supabase `insert` logic. Only wrap the CTA in Framer Motion. |
| Phase 2.2 | 🟡 MEDIUM | Z-Index stacking | Ensure the expanded receipt sits cleanly above everything using `z-modal`. |

## 🤖 CLAUDE CODE PHASES

### Phase 2.1: Framer Motion LayoutId Injection
Implement the fluid morphing from the `[Book Now]` button to the Receipt card to prevent jarring page redirects.

- `[MODIFY]` `components/booking/BookingWizard.tsx` (or the equivalent CTA component)
- `[NEW]` `components/booking/SuccessReceipt.tsx`

✅ **DO:** Use `layoutId="booking-flow"` on both the `<button>` and the resulting `<motion.div>` modal.
❌ **DON'T:** Use standard generic CSS scale effects or route to a `/success` page that breaks the native-app illusion.

> ⚠️ **BE CAREFUL:** The booking form submission `onClick` must finish its async work (Supabase) before triggering the `setSuccess(true)` state that activates the layout transition. Do not break the actual DB insert logic.
- **Verification:** `npm run build` -> `git commit -m "phase 2.1: implement framer motion booking success morph"` -> complete a test booking and verify animation.

### Phase 2.2: Premium SVG Checkmark
Implement the self-drawing, premium checkmark inside the receipt.

- `[MODIFY]` `components/booking/SuccessReceipt.tsx`

✅ **DO:** Use Framer Motion's `pathLength` property to draw the stroke over `0.6s`.
❌ **DON'T:** Import confetti libraries or use playful emojis. Strictly premium `lucide-react` or custom premium SVG paths.

> ⚠️ **BE CAREFUL:** Ensure the stroke color contrasts perfectly. Use `text-s-success` or `stroke-s-ink` based on the active theme so it works in both Light and Dark mode.
- **Verification:** `npm run build` -> `git commit -m "phase 2.2: add premium svg checkmark drawing"`

## Execution Order
| Step | Type | What | Depends On |
|---|---|---|---|
| 1 | 🤖 | Framer Motion CTA Morph | Nothing |
| 2 | 🤖 | SVG Drawing Animation | Step 1 |
