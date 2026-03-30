# Roadmap R22: Glassmorphism & Modal Upgrade + Dashboard Dark Mode Sweep

> **Scope:** Apply consistent glass effects to all overlays/modals/floating UI, upgrade all custom modals to `GlassModal`, sweep dashboard dark mode gaps.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting (§5: glass layers).
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Modal backdrop could block clicks if z-index is wrong | Test that overlay click-to-dismiss still works after adding blur |
| Phase 2 | 🟢 SAFE | Nothing — additive CSS classes | Only append classes, never remove |
| Phase 3 | 🟡 MEDIUM | Dashboard readability if dark bg opacity is wrong | Use exact token values from UI_RULES.md |

---

## 🤖 Phase 1: Upgrade All Custom Modals to GlassModal

> **Goal:** Every modal/overlay in the app should either use `GlassModal` component OR have manual `backdrop-blur-xl bg-white/80 dark:bg-s-dm-raised/90` tokens.

#### Files
- `[MODIFY]` `components/ProfilePage.tsx` — Replace inline CancelModal overlay (~line 620). Current: `<div className="fixed inset-0 bg-s-bg-surface/70 ...">`  →  Import and use `GlassModal` from `@/components/ui/GlassModal`
- `[MODIFY]` `components/WaitlistModal.tsx` — Add `backdrop-blur-lg` to overlay wrapper (~line 30)
- `[MODIFY]` `components/ui/PriceOfferModal.tsx` — Add `backdrop-blur-lg` to overlay
- `[MODIFY]` `components/booking/GroupBookingModal.tsx` — Add `backdrop-blur-lg` to overlay
- `[MODIFY]` `components/dashboard/WalkInModal.tsx` — Add `backdrop-blur-lg` to overlay
- `[MODIFY]` `components/dashboard/PriceAdjustmentModal.tsx` — Add `backdrop-blur-lg` to overlay
- `[MODIFY]` `components/discovery/ProfileSetupModal.tsx` — Add `backdrop-blur-lg` to overlay
- `[MODIFY]` `components/coiffeur/AiMatcherModal.tsx` — Add `backdrop-blur-lg` to overlay

#### ✅ DO
```tsx
// Option A: Use GlassModal component (preferred for full modals)
import GlassModal from "@/components/ui/GlassModal";
<GlassModal open={isOpen} onClose={() => setIsOpen(false)} title="Termin stornieren">
  {/* existing modal content — unchanged */}
</GlassModal>

// Option B: Manual glass tokens (for custom overlays that can't use GlassModal)
<div className="fixed inset-0 z-50 backdrop-blur-lg bg-s-ink/40 dark:bg-s-dm-bg/60">
  <div className="bg-white/90 dark:bg-s-dm-surface/95 backdrop-blur-xl rounded-card shadow-warm-2xl">
    {/* content */}
  </div>
</div>
```

#### ❌ DON'T
```tsx
// DON'T use opaque backgrounds on overlays — defeats the glass effect
<div className="fixed inset-0 bg-black/50">  // ← BAD: opaque, no blur

// DON'T change the modal's interior content or functionality
// Only change the WRAPPING overlay — leave interior unchanged

// DON'T use backdrop-blur-3xl — it's too heavy and causes lag on mobile
className="backdrop-blur-3xl"  // ← BAD: performance issue
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R22 phase 1: upgrade 8 modals to glass effect with backdrop-blur"
```

> ⚠️ **BE CAREFUL**:
> - After adding blur, TEST that clicking the overlay backdrop still closes the modal (the `onClick` handler on the overlay div)
> - Don't remove `e.stopPropagation()` from inner modal content — it prevents backdrop click from propagating
> - Check z-index: overlay should be `z-50`, inner modal should be `z-50` or higher
> - On mobile Safari, `backdrop-filter` can cause rendering issues — use `will-change: transform` if needed
> - Don't touch `GlassModal.tsx` itself — only change components that USE it or need to adopt it

---

## 🤖 Phase 2: Add Glass to Floating UI Elements

> **Goal:** Apply glass effects to dropdowns, compose bars, sticky headers, and notification panels.

#### Files
- `[MODIFY]` `components/notifications/NotificationBell.tsx` — Dropdown panel (~line 143): add `backdrop-blur-lg bg-white/95 dark:bg-s-dm-surface/95`
- `[MODIFY]` `components/ChatWindow.tsx` — Compose bar (~line 468): add `backdrop-blur-sm bg-white/90 dark:bg-s-dm-surface/90`
- `[MODIFY]` `components/BookingCalendar.tsx` — Summary strip (~line 665): add `backdrop-blur-sm bg-s-bg-surface/80 dark:bg-s-dm-bg/90`
- `[MODIFY]` `components/layout/Header.tsx` — Already has glass nav ✅ — verify only
- `[MODIFY]` `components/layout/BottomNav.tsx` — If no blur: add `backdrop-blur-md bg-white/95 dark:bg-s-dm-surface/95`
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx` — Mobile top bar (~line 270): add `backdrop-blur-sm bg-white/95 dark:bg-s-dm-surface/95`
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx` — Mobile bottom nav (~line 283): add `backdrop-blur-md bg-white/95 dark:bg-s-dm-surface/95`
- `[MODIFY]` `components/onboarding/SetupWizard.tsx` — Sticky step indicator (~line 59): add `backdrop-blur-sm bg-white/95 dark:bg-s-dm-surface/95`

#### Glass Tier Rules
| Tier | Blur | Use Case |
|---|---|---|
| Subtle | `backdrop-blur-sm` | Compose bars, summary strips, sticky sub-headers |
| Standard | `backdrop-blur-md` | Bottom nav, sticky nav bars |
| Heavy | `backdrop-blur-lg` | Dropdown panels, notification bells |
| Full | `backdrop-blur-xl` | Full-screen modal overlays |

#### ✅ DO
```tsx
// Compose bar — subtle glass
className="px-4 py-3 border-t border-s-ink/5 dark:border-white/10 backdrop-blur-sm bg-white/90 dark:bg-s-dm-surface/90"
```

#### ❌ DON'T
```tsx
// DON'T use plain bg-white on sticky/floating elements anymore
className="bg-white border-t"  // ← BAD: no glass, looks flat

// DON'T use backdrop-blur without semi-transparent bg — blur alone is invisible
className="backdrop-blur-lg"  // ← BAD: needs bg-white/90 paired
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R22 phase 2: glass effect on NotificationBell, compose bar, summary strip, BottomNav, DashboardLayout"
```

> ⚠️ **BE CAREFUL**:
> - Always pair `backdrop-blur-*` with a semi-transparent background — `backdrop-blur` alone has no visible effect
> - Use `/90` or `/95` opacity — NOT `/50` (too see-through) or `/100` (defeats the purpose)
> - The `Header.tsx` already has glass — read it first to match the exact token pattern
> - Don't add `backdrop-blur` to non-floating elements (e.g., main content area, static cards)

---

## 🤖 Phase 3: Dashboard Dark Mode Gap Sweep

> **Goal:** Audit all 34 dashboard components and add missing `dark:` pairs to backgrounds, text, and borders.

#### Files (missing dark mode on some elements — based on grep)
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx` — Root `min-h-screen bg-s-bg-surface` → add `dark:bg-s-dm-bg`
- `[MODIFY]` `components/dashboard/HeatmapChart.tsx` — Card backgrounds + text colors need dark pairs
- `[MODIFY]` `components/dashboard/MiniSparkline.tsx` — Chart colors need dark mode awareness
- `[MODIFY]` `components/dashboard/ScheduleGrid.tsx` — Grid cells + borders need dark pairs
- `[MODIFY]` `components/dashboard/SetupBanner.tsx` — Banner background need dark pair
- `[MODIFY]` `components/dashboard/GoLiveGate.tsx` — CTA section background need dark pair
- `[MODIFY]` `components/dashboard/FrozenSalonBanner.tsx` — Warning banner need dark pair
- `[MODIFY]` `components/dashboard/DisputeNotification.tsx` — Notification card need dark pair
- `[MODIFY]` `components/dashboard/SolenScoreCard.tsx` — Score card need dark pair

#### ✅ DO
```tsx
// Every bg-white needs a dark pair
className="bg-white dark:bg-s-dm-surface rounded-card shadow-warm-sm"

// Every text-s-ink needs a dark pair
className="text-s-ink dark:text-s-dm-text"

// Every border-s-ink/5 needs a dark pair
className="border-s-ink/5 dark:border-white/5"

// Every bg-s-bg-surface needs a dark pair
className="bg-s-bg-surface dark:bg-s-dm-bg"
```

#### ❌ DON'T
```tsx
// DON'T use cool greys for dark mode
className="dark:bg-gray-800"  // ← BAD: cold grey, not warm

// DON'T use pure black
className="dark:bg-black"  // ← BAD: use dark:bg-s-dm-bg (#151009)

// DON'T invent new dark mode tokens — only use the 4 defined in UI_RULES:
// dark:bg-s-dm-bg, dark:bg-s-dm-surface, dark:bg-s-dm-raised, dark:text-s-dm-text
```

#### Verification
```bash
# Check for remaining gaps
grep -rn "bg-white" components/dashboard/ --include="*.tsx" | grep -v "dark:" | head -20
# Any line with bg-white but no dark: pair = needs fixing
npm run build
git add -A && git commit -m "R22 phase 3: dashboard dark mode sweep — 10+ components"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - The warm dark mode palette uses `#151009` base — NEVER use Tailwind's `gray-*` or `slate-*`
> - Don't change existing dark: tokens that are already correct
> - Some dashboard components may intentionally NOT have dark mode (check if `DashboardLayout` wraps them — it does, so they inherit the bg)
> - Focus on cards, headers, and text — don't worry about chart SVG colors (those are data visualization)

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Upgrade 8 modals to glass | Nothing |
| Phase 2 | 🤖 | Glass on 8 floating UI elements | Nothing |
| Phase 3 | 🤖 | Dashboard dark mode sweep (10+ files) | Nothing |
