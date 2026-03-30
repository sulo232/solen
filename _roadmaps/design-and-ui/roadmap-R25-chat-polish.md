# Roadmap R25: Chat UX Polish — Message Animations, Glass Compose, Quick Reply Motion

> **Scope:** Add message entry animations (new messages only), glass compose bar, quick reply chip stagger, AI suggestion slide-in, photo tab cross-fade, and typing indicator polish in `ChatWindow.tsx` and related chat components.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`
> **Key file:** Read `components/ChatWindow.tsx` fully (501 lines) before starting.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Scroll-to-bottom behavior if animations delay rendering | Track `initialLoad` ref — only animate NEW messages, not history |
| Phase 2 | 🟢 SAFE | Nothing — additive CSS classes | Only append classes to compose bar div |
| Phase 3 | 🟢 SAFE | Nothing — additive motion wrappers | Wrap existing chip buttons, don't restructure |
| Phase 4 | 🟡 MEDIUM | Tab switching if AnimatePresence key is wrong | Use `key={activeTab}` — must match tab state |

---

## 🤖 Phase 1: Message Entry Animations

> **Goal:** NEW messages fade in from bottom. History messages (initial load batch) appear instantly.

#### File: `[MODIFY]` `components/ChatWindow.tsx`

#### Instructions
1. Add a `const initialLoadRef = useRef(true)` ref
2. After the initial messages fetch completes, set `initialLoadRef.current = false`
3. In the message rendering loop, wrap each bubble in `motion.div` — but ONLY animate if `!initialLoadRef.current`

#### ✅ DO
```tsx
import { motion } from "framer-motion";
import { useRef } from "react";

// Inside ChatWindow component:
const initialLoadRef = useRef(true);

// After initial fetch:
useEffect(() => {
  fetchMessages().then(() => {
    initialLoadRef.current = false;
  });
}, []);

// In the message rendering:
{messages.map((msg) => (
  <motion.div
    key={msg.id}
    initial={initialLoadRef.current ? false : { opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className={`group flex gap-2 ${isOwn(msg) ? "flex-row-reverse" : "flex-row"}`}
  >
    {/* existing bubble content — DO NOT change */}
  </motion.div>
))}
```

#### ❌ DON'T
```tsx
// DON'T animate ALL messages including history — causes jittery initial load
{messages.map((msg) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}> // ← BAD: animates 50+ old messages
    ...
  </motion.div>
))}

// DON'T use whileInView — it re-triggers on every scroll
<motion.div whileInView={{ opacity: 1 }}>  // ← BAD

// DON'T change the message data structure, fetch logic, or Supabase realtime subscription
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R25 phase 1: message entry animations for new messages only (initialLoadRef guard)"
```

> ⚠️ **BE CAREFUL**:
> - Framer Motion's `initial={false}` skips the initial animation — use this for history messages
> - The scroll-to-bottom logic must still work — animation should NOT delay the scroll
> - Don't break the Supabase Realtime channel for new messages — the animation wraps AROUND the existing realtime handler
> - Test with 50+ messages — initial load should be instant, new message should fade in

---

## 🤖 Phase 2: Glass Compose Bar

> **Goal:** Make the compose bar feel premium with glassmorphism and subtle shadow.

#### File: `[MODIFY]` `components/ChatWindow.tsx`

#### Instructions
1. Find the compose bar div (~line 468)
2. Add glass tokens to existing className

#### ✅ DO
```tsx
// BEFORE:
className="px-4 py-3 border-t border-s-ink/5 dark:border-white/10"

// AFTER:
className="px-4 py-3 border-t border-s-ink/5 dark:border-white/10 backdrop-blur-sm bg-white/90 dark:bg-s-dm-surface/90 shadow-warm-sm"
```

#### ❌ DON'T
```tsx
// DON'T remove existing classes — only APPEND new ones
// DON'T change the compose bar's children (input, send button, attach button)
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R25 phase 2: glass compose bar with backdrop-blur and shadow"
```

> ⚠️ **BE CAREFUL**:
> - The compose bar is sticky at the bottom — ensure `backdrop-blur` doesn't cause z-index issues with the message list
> - If the compose bar has `position: sticky` or `fixed`, the blur will work. If it's in normal flow, blur won't show (nothing behind it to blur)

---

## 🤖 Phase 3: Quick Reply & AI Suggestion Animations

> **Goal:** Quick reply chips stagger in, AI suggestions slide down.

#### Files
1. Check if `[MODIFY]` `components/chat/QuickReplyChips.tsx` exists — if not, quick replies are inline in `ChatWindow.tsx`
2. Check if `[MODIFY]` `components/chat/AISuggestion.tsx` exists — if not, inline in `ChatWindow.tsx`
3. `[MODIFY]` `components/ChatWindow.tsx` — If inline, wrap the quick reply rendering and AI suggestion rendering

#### ✅ DO
```tsx
// Quick reply chips — stagger in
<div className="flex flex-wrap gap-2 px-4 py-2">
  {quickReplies.map((reply, i) => (
    <motion.button
      key={reply.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: i * 0.05, duration: 0.15 }}
      onClick={() => handleQuickReply(reply)}
      className="px-3 py-1.5 text-xs bg-s-coral/5 text-s-coral rounded-btn hover:bg-s-coral/10 transition-colors"
    >
      {reply.text}
    </motion.button>
  ))}
</div>

// AI suggestion — slide down
<AnimatePresence>
  {aiSuggestion && (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-2 overflow-hidden"
    >
      {/* existing AI suggestion content */}
    </motion.div>
  )}
</AnimatePresence>
```

#### ❌ DON'T
```tsx
// DON'T use long stagger delays — max 0.05 per chip
transition={{ delay: i * 0.2 }}  // ← BAD: 5 chips = 1 second delay for last one

// DON'T change the quick reply handler logic — only wrap in motion
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R25 phase 3: quick reply chip stagger + AI suggestion slide-down animation"
```

> ⚠️ **BE CAREFUL**:
> - If `QuickReplyChips.tsx` doesn't exist, the chips are rendered inline in ChatWindow — search for the quick reply rendering
> - Keep stagger delay at `0.05` max per item — any longer feels sluggish
> - The AI suggestion must use `AnimatePresence` for exit animation to work

---

## 🤖 Phase 4: Photo/Chat Tab Cross-Fade

> **Goal:** Switching between Chat and Photos tabs should cross-fade instead of instant swap.

#### File: `[MODIFY]` `components/ChatWindow.tsx`

#### Instructions
1. Find the tab content rendering (~line 300-350)
2. Wrap in `AnimatePresence mode="wait"` with `key={activeTab}`

#### ✅ DO
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {activeTab === "chat" ? (
      /* existing chat content — DO NOT change */
    ) : (
      /* existing photos content — DO NOT change */
    )}
  </motion.div>
</AnimatePresence>
```

#### ❌ DON'T
```tsx
// DON'T use x/y animations for tab content — use opacity-only cross-fade
// Tabs are NOT wizard steps — they're equal peers, so use fade not slide
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R25 phase 4: chat/photos tab cross-fade with AnimatePresence"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Use `mode="wait"` to prevent both tabs rendering simultaneously
> - Use opacity-only transition (no x/y) — tab switching is peer navigation, not progression
> - Don't break the photo upload handler or the real-time chat subscription

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Message entry animations with initialLoad guard | Nothing |
| Phase 2 | 🤖 | Glass compose bar | Nothing |
| Phase 3 | 🤖 | Quick reply stagger + AI suggestion slide | Nothing |
| Phase 4 | 🤖 | Tab cross-fade | Nothing |
