# Roadmap R23: Loading & Empty State Standardization + Transition Polish

> **Scope:** Replace all plain `Spinner` loading states with contextual `Skeleton` loaders, standardize all empty states to use `EmptyState` component, add `AnimatePresence` transitions between loading→content→empty states.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`
> **Existing components:** Read `components/ui/Skeleton.tsx` and `components/ui/EmptyState.tsx` APIs first.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — replacing loading UI only | Keep the same loading state variable check, only change the JSX rendered |
| Phase 2 | 🟢 SAFE | Nothing — replacing empty UI only | Keep the same empty check condition, only change the JSX |
| Phase 3 | 🟡 MEDIUM | Flash of content if AnimatePresence `key` is wrong | Use unique keys: `"loading"`, `"content"`, `"empty"` |

---

## 🤖 Phase 1: Replace Spinner Loading States with Skeletons

> **Goal:** Every full-page or section loading state should show contextual skeletons instead of a centered Spinner.

#### Files
- `[MODIFY]` `components/BookingCalendar.tsx` — Slot loading spinner (~line 598) → Skeleton pill grid (8 pills matching time slot shape):
- `[MODIFY]` `components/ChatWindow.tsx` — Message loading spinner (~line 332) → Skeleton message bubbles (3 alternating left/right):
- `[MODIFY]` `components/TerminePage.tsx` — Full-screen spinner (~line 238) → Skeleton booking card stack (3 cards with date/service/salon placeholders):
- `[MODIFY]` `components/ProfilePage.tsx` — Full-screen spinner (~line 606) → Skeleton profile header + card grid:
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx` — Auth check spinner (~line 121) → Skeleton sidebar + stat cards:
- `[MODIFY]` `components/discovery/DetailPage.tsx` — If loading spinner exists → Skeleton hero + detail layout:
- `[MODIFY]` `components/discovery/ForYouSection.tsx` — If loading → Skeleton masonry grid:
- `[MODIFY]` `components/barber/CutHistoryTimeline.tsx` — If loading → Skeleton timeline items:

#### ✅ DO
```tsx
import Skeleton from "@/components/ui/Skeleton";

// Match skeleton SHAPES to actual content layout
// Time slots → small pills
if (loadingSlots) return (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="w-16 h-8 rounded-btn" />
    ))}
  </div>
);

// Messages → alternating bubbles
if (loadingMessages) return (
  <div className="space-y-3 p-4">
    {[75, 45, 60].map((w, i) => (
      <div key={i} className={i % 2 ? "flex justify-end" : "flex"}>
        <Skeleton className="h-10 rounded-card" style={{ width: `${w}%` }} />
      </div>
    ))}
  </div>
);

// Booking cards → stacked cards
if (loading) return (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-24 rounded-card" />
    ))}
  </div>
);
```

#### ❌ DON'T
```tsx
// DON'T use generic rectangle skeletons that don't match content shape
<Skeleton className="w-full h-96" />  // ← BAD: one giant rectangle

// DON'T remove the loading state check — only change what's RENDERED
// Keep: if (loading) return ...
// DON'T change: the loading state variable name or the data fetch logic

// DON'T use Spinner for full-page/section loading anymore
if (loading) return <div className="flex justify-center py-20"><Spinner /></div>  // ← BAD
```

> **NOTE:** `Spinner` is still correct for INLINE loading (inside buttons, next to text). Only replace full-section Spinners.

#### Verification
```bash
grep -rn "Spinner" components/BookingCalendar.tsx components/ChatWindow.tsx components/TerminePage.tsx components/ProfilePage.tsx
# Should NOT show full-page Spinner usage (inline Spinner in buttons is OK)
npm run build
git add -A && git commit -m "R23 phase 1: replace full-page Spinners with contextual Skeletons in 8 components"
```

> ⚠️ **BE CAREFUL**:
> - Keep `Spinner` for inline/button loading (e.g., submit button loading state) — only replace SECTION-LEVEL spinners
> - Match the skeleton shape to the actual content — pills for time slots, bubbles for messages, cards for bookings
> - Don't change the loading state variable or fetch logic — only the JSX inside `if (loading) return ...`
> - Import `Skeleton` from `@/components/ui/Skeleton` — verify this file exists first (`ls components/ui/Skeleton.tsx`)

---

## 🤖 Phase 2: Standardize Empty States

> **Goal:** Replace all ad-hoc inline empty messages with the `EmptyState` component.

#### Files
- `[MODIFY]` `components/ChatWindow.tsx` — Replace inline "Noch keine Nachrichten" text (~line 334) with `EmptyState`
- `[MODIFY]` `components/TerminePage.tsx` — Replace custom "Keine anstehenden Termine" block (~line 303) with `EmptyState`
- `[MODIFY]` `components/BookingCalendar.tsx` — Replace "Keine freien Slots" inline text (~line 600) with `EmptyState`
- `[MODIFY]` `components/discovery/ForYouSection.tsx` — Replace empty feed message with `EmptyState`
- `[MODIFY]` `components/dashboard/ClientPhotosTab.tsx` — Replace empty photos message with `EmptyState`
- `[MODIFY]` `components/search/SearchResultGrid.tsx` — Check if already uses `EmptyState` — if not, upgrade

#### ✅ DO
```tsx
import EmptyState from "@/components/ui/EmptyState";
import { MessageCircle, Calendar, Clock } from "lucide-react";

// Chat empty state
<EmptyState
  icon={MessageCircle}
  title="Noch keine Nachrichten"
  description="Starte das Gespräch mit deinem Salon!"
/>

// Bookings empty state
<EmptyState
  icon={Calendar}
  title="Keine anstehenden Termine"
  description="Entdecke Salons in deiner Nähe und buche deinen nächsten Termin."
  action={{ label: "Salons entdecken", href: "/de/coiffeur" }}
/>

// No available slots
<EmptyState
  icon={Clock}
  title="Keine freien Slots"
  description="Probiere einen anderen Tag oder kontaktiere den Salon direkt."
/>
```

#### ❌ DON'T
```tsx
// DON'T use inline paragraphs for empty states
<p className="text-center text-s-ink/50 py-8">Noch keine Nachrichten</p>  // ← BAD

// DON'T create new empty state components — use the existing EmptyState
const MyEmptyState = () => <div>...</div>  // ← BAD: use EmptyState from ui/

// DON'T hardcode href paths without locale — use template literals
action={{ label: "…", href: "/coiffeur" }}  // ← BAD: missing locale
action={{ label: "…", href: `/${locale}/coiffeur` }}  // ✅ GOOD
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R23 phase 2: standardize EmptyState in ChatWindow, TerminePage, BookingCalendar, ForYouSection, ClientPhotosTab"
```

> ⚠️ **BE CAREFUL**:
> - Check `EmptyState` component API first — read `components/ui/EmptyState.tsx` to know available props
> - Use `lucide-react` icons only — match the icon to the context (MessageCircle for chat, Calendar for bookings, etc.)
> - If `EmptyState` has an `illustration` prop, use `"no-results"` for empty searches and `"coming-soon"` for upcoming features
> - Keep any existing action/CTA buttons that were in the old empty state — put them in the `action` prop

---

## 🤖 Phase 3: AnimatePresence for Loading→Content→Empty Transitions

> **Goal:** Wrap the 3-state pattern (loading / content / empty) in `AnimatePresence` for smooth cross-fades.

#### Files
- `[MODIFY]` `components/BookingCalendar.tsx` — Wrap slot section rendering
- `[MODIFY]` `components/ChatWindow.tsx` — Wrap messages section rendering
- `[MODIFY]` `components/TerminePage.tsx` — Wrap booking list rendering
- `[MODIFY]` `components/ProfilePage.tsx` — Wrap section content rendering

#### ✅ DO
```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="wait">
  {loading ? (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <SkeletonGrid />
    </motion.div>
  ) : items.length === 0 ? (
    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <EmptyState ... />
    </motion.div>
  ) : (
    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      {/* existing content rendering */}
    </motion.div>
  )}
</AnimatePresence>
```

#### ❌ DON'T
```tsx
// DON'T forget key props — AnimatePresence requires them
<AnimatePresence mode="wait">
  {loading ? <motion.div>...</motion.div> : <motion.div>...</motion.div>}  // ← BAD: no keys
</AnimatePresence>

// DON'T use long transition durations — keep at 0.15s for utility transitions
transition={{ duration: 0.5 }}  // ← BAD: too slow for loading→content swap
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R23 phase 3: AnimatePresence loading→content→empty transitions in 4 components"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Each branch (loading/empty/content) MUST have a unique `key` string
> - Use `mode="wait"` to prevent both states rendering simultaneously
> - Keep transitions at 0.15s — users don't want to wait for animations on loading states
> - Don't wrap the ENTIRE component in AnimatePresence — only the conditional rendering section

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Replace Spinners with Skeletons (8 files) | Nothing |
| Phase 2 | 🤖 | Standardize EmptyState (6 files) | Nothing |
| Phase 3 | 🤖 | AnimatePresence transitions (4 files) | Phase 1 + Phase 2 |
