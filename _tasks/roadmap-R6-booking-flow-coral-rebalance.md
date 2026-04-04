# R6: Booking Flow Condensation & Coral Rebalance

> **Scope**: 55 issues | **Files**: ~20 | **Conflicts**: Touches booking/ components only
> **Agent session**: Separate Claude Code window
> **Dependency**: Can run in parallel with all others (booking/ is isolated)

---

## Phase 6.1: Condense Booking Wizard from 6 Steps to 4

**Goal**: Reduce friction. Merge service+staff → step 1. Merge date+time → step 2. Confirm → step 3. Pay → step 4.

**Current flow**: Services → Staff → Date → Time → Confirm → Payment (6 steps)
**New flow**: Services & Staff → Date & Time → Review & Confirm → Payment (4 steps)

**Steps**:

1. **BookingWizard.tsx** — Update STEPS array:
```ts
const STEPS = ['services', 'datetime', 'confirm', 'payment'] as const;
```

2. **Step 1: Services & Staff** — Merge ServiceSelectionStep + StaffSelectionStep into one view:
   - Top: Service selection (existing component)
   - Below services: Staff selection appears after service is chosen
   - Layout: vertical stack, services first, then staff picker slides in
   - Auto-skip staff if salon has only 1 staff member OR if "Any stylist" is default

3. **Step 2: Date & Time** — Merge DateSelectionStep + TimeSelectionStep:
   - Left/top: Calendar date picker
   - Right/bottom: Time slots for selected date (appear after date is picked)
   - On mobile: date picker full width, time slots appear below as scrollable pills
   - On desktop: side-by-side layout

4. **Step 3: Review & Confirm** — Keep existing ConfirmationStep but enhance:
   - Show clear summary: service name, staff, date, time, price
   - Add edit buttons to go back to specific sections
   - Show cancellation policy
   - Add-ons / notes input

5. **Step 4: Payment** — Keep existing PaymentStep

6. **Update progress bar**: 4 segments instead of 6. Thicker: `h-1` → `h-1.5`
7. **Update step dots**: 4 dots. Active dot wider. Coral color.
8. **Update STEP_KEYS** for translations
9. **Smart skip logic**:
   - If only 1 staff → skip staff selection in step 1
   - If default date is "today" and slots available → pre-select today
   - If coming from "quick book" CTA → pre-fill service and skip to step 2

**Verification**: Full booking flow completes in 4 taps. Progress bar shows 4 segments. Each step loads without errors.

---

## Phase 6.2: Booking Wizard Visual Polish

**Goal**: Each step looks clean, not cramped. Clear hierarchy. Good mobile UX.

**Fixes**:

1. **Progress bar**: `h-1` (4px) → `h-1.5` (6px). Background: `bg-s-ink/[0.06]`. Fill: `bg-s-coral`. Animated width transition with EASE_SOLEN.

2. **Step header**: 
   - Eyebrow: `text-[11px]` → `text-xs` (12px). Color: `text-s-ink/50` (not /60 — more subtle)
   - Step label: "Step X of Y" format using `t('stepOf', { current, total })`
   - Title: `text-lg font-heading font-semibold`

3. **Step dots**: 
   - Height: `h-[3px]` → `h-1` (4px) 
   - Active: `w-8 bg-s-coral`. Completed: `w-4 bg-s-coral`. Upcoming: `w-4 bg-s-ink/[0.08]`
   - Spring animation on width change

4. **Back button**: `hover:bg-s-bg-sunken` too subtle → `hover:bg-s-ink/[0.06]` with 44px touch target

5. **Step transitions**: Slide left/right based on direction. Current `x: 60`/`x: -60` is fine but duration should use DURATION_SMOOTH (0.3s)

6. **Service items**: 
   - Selected state: stronger highlight `bg-s-coral/[0.12] border-s-coral/30` (not just /08)
   - Price alignment: right-aligned with `tabular-nums`
   - Duration: styled as badge `bg-s-ink/[0.05] text-xs px-2 py-0.5 rounded-full`

7. **Staff cards**:
   - Avatar: `w-12 h-12` with coral ring when selected
   - "Any available" option styled as first item with subtle distinction
   - Selected state: coral border + check icon

8. **Date picker**: 
   - Today highlighted with coral dot
   - Selected date: coral fill, white text
   - Unavailable dates: `text-s-ink/20` with line-through

9. **Time slots**:
   - Pill-shaped: `rounded-pill px-4 py-2`
   - Available: `bg-white border border-s-ink/[0.08]`
   - Selected: `bg-s-coral text-white`
   - Unavailable: `bg-s-ink/[0.03] text-s-ink/30` 

**Verification**: Walk through entire booking flow on mobile (375px). Every step is readable, tappable, clear hierarchy.

---

## Phase 6.3: Coral Color Rebalance (Sitewide)

**Goal**: Coral (#E8624A) only for PRIMARY CTAs and key accent moments. Everything else uses neutral tones. Make coral feel special, not everywhere.

**Where coral STAYS** (intentional, branded moments):
- Primary "Book now" CTA buttons
- Active filter pills
- Progress bar fill
- Star ratings
- Heart/favorite icons when active
- Price highlights
- Status indicator for "open now"
- Logo accent
- Navigation active underline (currently s-ink — keep as s-ink for subtlety)

**Where coral gets REMOVED** (overused, makes it feel generic):
1. **Calendar icons** in BookingCard → change from `text-s-coral` to `text-s-ink/60`
2. **Clock icons** in BookingCard → change from `text-s-coral` to `text-s-ink/60`
3. **MapPin icons** in BookingCard → change from `text-s-coral` to `text-s-ink/60`
4. **Section eyebrow labels** → change from `text-s-amber` (fine) but verify consistency
5. **Reply indicators** in reviews → change from `text-s-coral` to `text-s-sage` (salon = sage)
6. **Close button hover** → should be `text-s-ink` not coral
7. **Link hover colors** → most should be `hover:text-s-ink` not `hover:text-s-coral` (except CTAs)
8. **Border accents** → change `border-s-coral` to `border-s-ink/[0.12]` for non-CTA borders
9. **Focus rings** → Keep `ring-s-coral` — this is an accent moment
10. **Toast borders** → Keep for error toasts, but success should use `border-s-sage`

**Replacement strategy**:
- Informational icons → `text-s-ink/50` (neutral)
- Secondary accents → `text-s-amber` or `text-s-sage` for variety
- Hover states on non-CTA elements → `text-s-ink` (not coral)
- Borders on non-interactive elements → `border-s-ink/[0.08]` (neutral)

**Steps**:
1. `grep -rn 'text-s-coral' components/ --include="*.tsx"` — list all 400+ usages
2. Categorize each as: KEEP (CTA/accent) or REPLACE (informational/generic)
3. Replace the REPLACE category with appropriate neutral/alternative token
4. Build and verify — no visual regressions on CTAs

**Verification**: Homepage should feel calmer. Coral pops only on "Book now" buttons and key moments. Not a sea of orange.

---

## Phase 6.4: Booking Success Page Polish

**Goal**: The success page should feel celebratory. Currently generic.

**Fixes**:
1. Replace hardcoded `#FF385C` heart → `text-s-coral`
2. Add subtle confetti or sparkle animation on mount (use Framer motion particles or CSS)
3. Scale animation should have spring easing, not linear
4. Add exit animation when navigating away
5. Service name needs `font-medium` for hierarchy
6. Add "Add to Calendar" button with proper styling
7. Cancellation policy section needs clearer visual grouping
8. Max width on tablet landscape: `max-w-lg` instead of `max-w-md`

**Verification**: Complete a booking → success page feels celebratory and polished.

---

## Commit Strategy

- **6.1**: `"refactor: condense booking wizard from 6 steps to 4"`
- **6.2**: `"fix: booking wizard visual polish — progress bar, step headers, selections"`
- **6.3**: `"refactor: coral color rebalance — reserve for CTAs and key accents only"`
- **6.4**: `"fix: booking success page polish — animation, layout, hierarchy"`
