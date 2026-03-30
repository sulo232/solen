# Roadmap R24: Booking Flow Smoothness + Staff Picker + Payment Transitions

> **Scope:** Animate slot selection, staff picker ring, payment step slide-in, date picker transitions, and confirmation celebration in `BookingCalendar.tsx` and related booking components.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`
> **Key file:** Read `components/BookingCalendar.tsx` fully (845 lines) before starting.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Slot click handler if wrapping changes event target | Wrap in `motion.button` not a `motion.div` around `<button>` |
| Phase 2 | 🟢 SAFE | Nothing — additive ring classes | Only add CSS classes, no DOM restructure |
| Phase 3 | 🟡 MEDIUM | Payment form if AnimatePresence unmounts Stripe Elements | Keep Elements mounted, only animate the wrapper div |
| Phase 4 | 🟢 SAFE | Nothing — additive date picker animation | Only add motion wrapper |

---

## 🤖 Phase 1: Animate Slot Selection

> **Goal:** Time slot buttons should have spring press animation + smooth selection indicator.

#### File: `[MODIFY]` `components/BookingCalendar.tsx`

#### Instructions
1. Find the slot rendering loop (~line 590-610)
2. Replace `<button>` with `<motion.button>` for each time slot
3. Add `whileTap={{ scale: 0.95 }}` and spring transition
4. Add `AnimatePresence` around the summary strip that appears when a slot is selected

#### ✅ DO
```tsx
import { motion, AnimatePresence } from "framer-motion";

// Slot button — replace <button> with <motion.button>
<motion.button
  key={slot.id}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  onClick={() => handleSlotSelect(slot)}
  className={`... ${
    selectedSlot?.id === slot.id
      ? "bg-s-coral text-white shadow-warm-sm"
      : "bg-white dark:bg-s-dm-surface hover:bg-s-coral/5"
  } ...`}
>
  {formatTime(slot.start_time)}
</motion.button>

// Summary strip — animate in/out
<AnimatePresence>
  {selectedSlot && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      {/* existing summary content — DO NOT change */}
    </motion.div>
  )}
</AnimatePresence>
```

#### ❌ DON'T
```tsx
// DON'T wrap <button> inside <motion.div> — it breaks click accessibility
<motion.div whileTap={{ scale: 0.95 }}>
  <button onClick={...}>  // ← BAD: extra wrapper breaks tab focus order
</motion.div>

// DON'T change the slot selection logic or state management
// Only change the JSX rendering — keep handleSlotSelect and selectedSlot as-is

// DON'T use scale below 0.9 — it looks like the button is broken
whileTap={{ scale: 0.8 }}  // ← BAD: too aggressive
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R24 phase 1: animate slot selection with motion.button + summary strip AnimatePresence"
```

> ⚠️ **BE CAREFUL**:
> - Use `motion.button` NOT `motion.div` wrapping a `<button>` — this preserves keyboard accessibility
> - Don't change ANY state management or data logic — only the rendering JSX
> - The `AnimatePresence` wrapper MUST include `className="overflow-hidden"` to prevent layout shift during height animation
> - If `Stripe Elements` are inside the summary, DON'T unmount them with animation — only animate the wrapper

---

## 🤖 Phase 2: Staff Picker Ring Animation

> **Goal:** Selected staff member gets an animated ring indicator.

#### File: Check if `[MODIFY]` `components/booking/StaffPicker.tsx` exists. If not, the staff picker lives inside `components/BookingCalendar.tsx` (~line 480-530).

#### Instructions
1. Find the staff avatar/button rendering
2. Add `ring-2 ring-s-coral ring-offset-2` to the selected staff item
3. Add `transition-all duration-200` for smooth ring appearance
4. Add subtle scale bump on selected: `scale-105`

#### ✅ DO
```tsx
<button
  onClick={() => setSelectedStaff(staff)}
  className={[
    "flex flex-col items-center gap-1 transition-all duration-200",
    selectedStaff?.id === staff.id
      ? "ring-2 ring-s-coral ring-offset-2 rounded-full scale-105"
      : "opacity-60 hover:opacity-100",
  ].join(" ")}
>
  <Image src={staff.avatar_url} ... className="w-12 h-12 rounded-full object-cover" />
  <span className="text-xs">{staff.display_name}</span>
</button>
```

#### ❌ DON'T
```tsx
// DON'T use outline instead of ring — ring respects border-radius
className="outline-2 outline-s-coral"  // ← BAD: outline doesn't follow rounded-full

// DON'T add motion.div layoutId for the ring — it causes z-index issues with overlapping staff items
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R24 phase 2: staff picker ring animation on selection"
```

> ⚠️ **BE CAREFUL**:
> - `ring-offset-2` creates visual spacing — make sure the parent has no `overflow-hidden` that would clip it
> - The `scale-105` should be on the button/wrapper, not on the Image — otherwise it clips
> - If no StaffPicker component exists, the staff selection is inline in BookingCalendar — modify there

---

## 🤖 Phase 3: Payment Step Slide-In Transition

> **Goal:** Guest form and Stripe payment form should slide in smoothly instead of instant show/hide.

#### File: `[MODIFY]` `components/BookingCalendar.tsx`

#### Instructions
1. Find the checkout step conditional rendering (~line 700-780)
2. Wrap in `AnimatePresence mode="wait"` with keyed `motion.div` for each step

#### ✅ DO
```tsx
<AnimatePresence mode="wait">
  {checkoutStep === "guest" && (
    <motion.div
      key="guest"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* existing GuestBookingForm content — DO NOT change */}
    </motion.div>
  )}
  {checkoutStep === "payment" && clientSecret && (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* existing Stripe Elements content — DO NOT change */}
    </motion.div>
  )}
</AnimatePresence>
```

#### ❌ DON'T
```tsx
// DON'T use exit animations that UNMOUNT Stripe Elements
// Stripe's <Elements> and <PaymentElement> must stay mounted once clientSecret is set
// If Stripe Elements crash → wrap only the visible container, keep Elements provider outside AnimatePresence

// DON'T use y-axis animations for step transitions — use x-axis (feels like a wizard progression)
initial={{ opacity: 0, y: 20 }}  // ← BAD for step transitions (y = sectional, x = wizard)
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R24 phase 3: payment step slide-in transitions with AnimatePresence"
```

> ⚠️ **BE CAREFUL**:
> - **CRITICAL**: Stripe `<Elements>` and `<PaymentElement>` components MUST NOT be unmounted and remounted — this causes the payment form to lose state and show errors
> - If the Stripe `<Elements>` provider wraps the checkout area, keep it OUTSIDE of `AnimatePresence` — only animate the INNER div
> - Test that payment still works after adding animations — complete a test payment flow
> - If `clientSecret` is used conditionally, ensure the animation doesn't race with the secret loading

---

## 🤖 Phase 4: Date Picker Section Animation

> **Goal:** Date picker calendar should animate when switching months.

#### File: `[MODIFY]` `components/BookingCalendar.tsx` OR `components/ui/date-picker.tsx`

#### Instructions
1. Check if `SolenDatePicker` already has month transition animations
2. If not, wrap the calendar grid in `AnimatePresence mode="wait"` with `key={currentMonth}`
3. Direction: slide left when going forward, slide right when going back

#### ✅ DO
```tsx
<AnimatePresence mode="wait" custom={monthDirection}>
  <motion.div
    key={currentMonth.toString()}
    custom={monthDirection}
    initial={{ opacity: 0, x: monthDirection * 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: monthDirection * -30 }}
    transition={{ duration: 0.2 }}
  >
    {/* calendar grid */}
  </motion.div>
</AnimatePresence>
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R24 phase 4: date picker month transition animation"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - The date picker uses `react-aria-components` — don't break its context by adding intermediate wrappers between `Calendar` and `CalendarGrid`
> - If `SolenDatePicker` already handles transitions, skip this phase
> - The month direction (1/-1) must be tracked in state — set +1 on next, -1 on prev

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Animate slot selection + summary strip | Nothing |
| Phase 2 | 🤖 | Staff picker ring animation | Nothing |
| Phase 3 | 🤖 | Payment step slide-in | Nothing |
| Phase 4 | 🤖 | Date picker month animation | Nothing |
