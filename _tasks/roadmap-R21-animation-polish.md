# Roadmap R21: Animation & Motion Polish + Micro-Interactions

> **Scope:** Add entry animations, staggered children, tab sliding indicators, `active:scale` on CTAs, focus rings, and `AnimatePresence` page transitions across all major components.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`
> **Depends on:** `framer-motion` (already installed)

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — additive motion wrappers | Don't change DOM structure, only wrap existing elements |
| Phase 2 | 🟢 SAFE | Nothing — additive CSS classes | Only append classes, never remove existing ones |
| Phase 3 | 🟡 MEDIUM | Tab switching if `layoutId` conflicts | Use unique `layoutId` per tab bar — never reuse across components |
| Phase 4 | 🟢 SAFE | Nothing — additive `AnimatePresence` | Ensure `mode="wait"` is set to prevent flash of both states |

---

## 🤖 Phase 1: Entry Animations for Unanimated Pages

> **Goal:** Wrap page-level containers in `motion.div` with staggered fade+translateY.

#### Files
- `[MODIFY]` `components/BookingCalendar.tsx` — Wrap the 3 main sections (date picker ~line 520, slot grid ~line 590, summary strip ~line 665) each in `motion.div` with stagger delays (0, 0.1, 0.2)
- `[MODIFY]` `components/ChatWindow.tsx` — Wrap the chat container (~line 290) in `motion.div` fade-in
- `[MODIFY]` `components/SalonCard.tsx` — Add `motion.div` on the outer card wrapper (~line 45)
- `[MODIFY]` `components/FilterBar.tsx` — Add `motion.div` fade-in on the filter bar container
- `[MODIFY]` `components/ReviewForm.tsx` — Add `motion.div` on the form wrapper
- `[MODIFY]` `components/CompareDrawer.tsx` — Already has motion ✅ — skip
- `[MODIFY]` `components/discovery/ItemCard.tsx` — Add subtle `motion.div` on card mount
- `[MODIFY]` `components/discovery/DetailPage.tsx` — Wrap hero + content sections in staggered `motion.div`

#### ✅ DO
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, delay: 0.05 }}
>
  {/* existing content unchanged */}
</motion.div>
```

#### ❌ DON'T
```tsx
// DON'T add animations to list items rendered in a .map() — causes performance issues
{salons.map((s) => (
  <motion.div whileInView={{ opacity: 1 }}> {/* ← BAD: triggers on every scroll */}
    <SalonCard ... />
  </motion.div>
))}

// DON'T change the DOM structure — only WRAP existing elements
<motion.div>{/* DON'T move children or restructure JSX */}</motion.div>
```

#### Verification
```bash
grep -rn "motion.div" components/BookingCalendar.tsx components/ChatWindow.tsx components/SalonCard.tsx
# Must show new motion wrappers
npm run build
git add -A && git commit -m "R21 phase 1: entry animations for BookingCalendar, ChatWindow, SalonCard, FilterBar, ReviewForm, ItemCard, DetailPage"
```

> ⚠️ **BE CAREFUL**:
> - Do NOT add `motion.*` to elements inside `.map()` loops — it causes jank on long lists
> - Do NOT use `whileInView` for these entry animations — use `initial`/`animate` only
> - Do NOT change any className or DOM structure — only wrap in `motion.div`
> - If a component already uses `motion.*` (like CompareDrawer), skip it — don't double-wrap
> - Keep `duration: 0.35` as standard — never exceed 0.5s for entry animations (feels sluggish)

---

## 🤖 Phase 2: Micro-Interactions — CTA Press + Focus Rings

> **Goal:** Add `active:scale-[0.98]` to all primary CTA buttons and `focus:ring-2 focus:ring-s-coral/20` to all inputs missing it.

#### Files (CTA buttons — grep result: `bg-s-coral text-white.*rounded-btn`)
- `[MODIFY]` `components/BookingCalendar.tsx` — ~3 CTA buttons
- `[MODIFY]` `components/ChatWindow.tsx` — Send button (~line 468)
- `[MODIFY]` `components/FilterBar.tsx` — Apply button
- `[MODIFY]` `components/ReviewForm.tsx` — Submit button
- `[MODIFY]` `components/WaitlistModal.tsx` — Join button
- `[MODIFY]` `components/layout/Header.tsx` — "Salon registrieren" CTA
- `[MODIFY]` `components/discovery/PostFromDiscover.tsx` — Post button
- `[MODIFY]` `components/discovery/ProfileSetupModal.tsx` — Save button
- `[MODIFY]` `components/dashboard/WalkInModal.tsx` — Send SMS button
- `[MODIFY]` `components/dashboard/PromoManager.tsx` — Create promo button
- `[MODIFY]` `components/dashboard/GiftCardManager.tsx` — Create gift card button
- `[MODIFY]` `components/dashboard/PackageManager.tsx` — Create package button

#### Files (Input focus rings — grep: `focus:border-s-coral` missing `focus:ring`)
- `[MODIFY]` `components/BookingCalendar.tsx` — Guest form inputs
- `[MODIFY]` `components/ChatWindow.tsx` — Compose input
- `[MODIFY]` `components/dashboard/PromoManager.tsx` — Form inputs
- `[MODIFY]` `components/dashboard/GiftCardManager.tsx` — Amount input
- `[MODIFY]` `components/dashboard/ClosureManager.tsx` — Date inputs

#### ✅ DO
```tsx
// CTA button — ADD active:scale-[0.98] to existing className
className="... bg-s-coral text-white rounded-btn active:scale-[0.98] ..."

// Input — ADD focus:ring-2 focus:ring-s-coral/20 AFTER focus:border-s-coral
className="... focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 ..."
```

#### ❌ DON'T
```tsx
// DON'T use active:scale-95 — too aggressive, feels broken
className="... active:scale-95 ..."  // ← BAD

// DON'T add active:scale to secondary/ghost buttons — only primary CTAs
className="... text-s-ink/50 hover:text-s-ink active:scale-[0.98] ..."  // ← BAD
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R21 phase 2: active:scale-[0.98] on CTAs, focus:ring-2 on inputs"
```

> ⚠️ **BE CAREFUL**:
> - Only add `active:scale-[0.98]` to buttons with `bg-s-coral text-white` — NOT ghost/outline buttons
> - Don't add `focus:ring` if `focus:ring-2` is already present (check first!)
> - The `active:scale` should come AFTER other transform classes if any exist
> - Don't touch `InteractiveHoverButton` — it has its own hover physics

---

## 🤖 Phase 3: Sliding Tab Indicators with layoutId

> **Goal:** Replace instant tab underlines with smooth Framer Motion `layoutId` sliding indicator.

#### Files
- `[MODIFY]` `components/ChatWindow.tsx` — Chat/Photos tab bar (~line 298). Replace the static underline with `motion.div layoutId="chat-tab-indicator"`
- `[MODIFY]` `components/ProfilePage.tsx` — Section tabs (if any tab bar exists). Use `layoutId="profile-tab-indicator"`
- `[MODIFY]` `components/discovery/DetailPage.tsx` — If tabs exist, add sliding indicator

#### ✅ DO
```tsx
<div className="relative flex gap-4 border-b border-s-ink/5">
  {tabs.map((tab) => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      className={`relative pb-2 text-sm font-medium transition-colors ${
        activeTab === tab.key ? "text-s-coral" : "text-s-ink/40"
      }`}
    >
      {tab.label}
      {activeTab === tab.key && (
        <motion.div
          layoutId="chat-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-s-coral"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
    </button>
  ))}
</div>
```

#### ❌ DON'T
```tsx
// DON'T reuse the same layoutId across different components
<motion.div layoutId="tab-indicator" />  // ← in ChatWindow
<motion.div layoutId="tab-indicator" />  // ← in ProfilePage — CONFLICT!

// DON'T use duration-based transition for layoutId — use spring
transition={{ duration: 0.3 }}  // ← BAD, looks mechanical
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R21 phase 3: sliding tab indicators with layoutId in ChatWindow, ProfilePage"
```

> ⚠️ **BE CAREFUL**:
> - Each component MUST use a UNIQUE `layoutId` — e.g., `"chat-tab-indicator"`, `"profile-tab-indicator"`
> - If two components are rendered on the same page with the same `layoutId`, Framer Motion will break
> - Use `type: "spring"` transition — never `duration` for layoutId animations
> - Don't remove the existing tab click handler — only add the `motion.div` indicator

---

## 🤖 Phase 4: AnimatePresence for Content Transitions

> **Goal:** Wrap conditional rendering (loading→content, step transitions) in `AnimatePresence` for smooth exit/enter.

#### Files
- `[MODIFY]` `components/BookingCalendar.tsx` — Wrap the checkout step transitions (~guest form / payment form) in `AnimatePresence mode="wait"` with `key={checkoutStep}`
- `[MODIFY]` `components/TerminePage.tsx` — Wrap the tab content area (upcoming/past/cancelled) in `AnimatePresence mode="wait"`
- `[MODIFY]` `components/ProfilePage.tsx` — Wrap the section content area in `AnimatePresence mode="wait"` if switching between loyalty/bookings/settings

#### ✅ DO
```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="wait">
  <motion.div
    key={activeSection}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
  >
    {renderActiveSection()}
  </motion.div>
</AnimatePresence>
```

#### ❌ DON'T
```tsx
// DON'T use AnimatePresence without mode="wait" — both states render simultaneously
<AnimatePresence>  // ← BAD: causes flash of both old and new content
  <motion.div key={step}> ... </motion.div>
</AnimatePresence>

// DON'T forget the key prop — AnimatePresence needs it to track entries/exits
<AnimatePresence mode="wait">
  <motion.div>  // ← BAD: no key = no exit animation
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R21 phase 4: AnimatePresence content transitions in BookingCalendar, TerminePage, ProfilePage"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - ALWAYS set `mode="wait"` — without it, old and new content render simultaneously
> - ALWAYS set a unique `key` prop on the `motion.div` inside `AnimatePresence`
> - Don't wrap the ENTIRE page in `AnimatePresence` — only the content area that changes
> - Don't use exit animations longer than 0.2s — they delay content appearance

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Entry animations for 8 components | Nothing |
| Phase 2 | 🤖 | CTA active:scale + focus rings (~25 files) | Nothing |
| Phase 3 | 🤖 | Sliding tab indicators (3 components) | Nothing |
| Phase 4 | 🤖 | AnimatePresence content transitions (3 components) | Nothing |
