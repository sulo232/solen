> ⚠️ **STALE — REFERENCES RETIRED DESIGN SYSTEM** (flagged 2026-05-06)
>
> This file references the previous V5 design tokens (coral hexes, Bebas Neue, locked component patterns, etc.) which are currently **in flux**. **Don't cite values or rules from this file as authoritative.** Read `_tasks/SOLEN_DESIGN.md` for current state, or ask the user. Archived context: `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

---

# 🎨 Post-MOAT Session 2: Homepage + Chat + Design System

> **Agent Role:** Frontend Polish Agent
> **Estimated Time:** ~10h
> **Branch:** `main` (direct push)

---

## ⚠️ MULTI-AGENT SAFETY — READ FIRST

**You are running in PARALLEL with 2 other Claude Code sessions.**

### YOUR EXCLUSIVE FILE OWNERSHIP:
```
✅ YOU OWN (only you may edit):
  components/HomePage.tsx
  components/layout/Footer.tsx
  components/layout/BottomNav.tsx
  components/ChatWindow.tsx
  components/SalonCard.tsx
  components/CategoryPage.tsx
  tailwind.config.js
  lib/animations.ts                   [NEW]
  components/ui/TrustBadges.tsx        [NEW]
  components/SocialProofStrip.tsx      [NEW]
  components/WeatherBanner.tsx         [NEW]
  components/ReviewCarousel.tsx        [NEW]
  components/CategoryHero.tsx          [NEW]
  components/ui/TypingIndicator.tsx    [NEW]
  components/chat/BookingBubble.tsx    [NEW]
  app/api/translate/route.ts          — SHARED WITH SESSION 1 (check .agent-lock.json first!)
  app/api/reviews/featured/route.ts   [NEW]
```

### ❌ DO NOT TOUCH (owned by other sessions):
```
Session 1 owns:
  app/[locale]/onboarding/salon/page.tsx
  app/api/salons/route.ts
  lib/service-templates.ts
  lib/registration-validation.ts
  components/ui/ImageUploader.tsx

Session 3 owns:
  app/[locale]/dashboard/*
  app/[locale]/salon/[slug]/page.tsx
  app/[locale]/bookings/*/page.tsx
  app/api/bookings/*.ts
  app/api/cron/*.ts
  lib/google-calendar.ts
  lib/email-templates/*.ts
  components/ui/BottomSheet.tsx
  components/dashboard/*
```

### SHARED FILES (coordinate via .agent-lock.json):
```
⚠️ LOCK BEFORE EDITING:
  supabase/migrations/*  — Use migration 060 (read_at for chat)
  package.json           — Lock, add deps, unlock immediately
  components/index.ts    — Lock, add exports, unlock immediately
```

### BEFORE YOU START:
1. Read `CLAUDE.md` completely + `UI_RULES.md`
2. Read `.agent-lock.json` — check for conflicts
3. Add your lock entries
4. Post in `.agent-comms.md`: "Session 2 starting: Homepage + Chat + Design. Owns: HomePage.tsx, Footer, BottomNav, ChatWindow, SalonCard, CategoryPage, tailwind.config.js, animations.ts, plus new components"

---

## Phase 2.1: Admin-Changeable Hero Image (~1h) 🟢

**Goal:** Hero shows real photo from Unsplash, changeable by admin.

### What We Want:
- Hero section has a background image with dark gradient overlay
- Image URL stored in DB (platform_settings table) — admin can change from CMS
- Default: `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80` (salon interior)
- `next/image` with `priority` and `fill` for performance
- Text still readable (dark overlay: `bg-gradient-to-b from-black/60 to-black/40`)

### What We DON'T Want:
- ❌ Hardcoded image URL in component code
- ❌ Image without overlay (text becomes unreadable)
- ❌ Slow LCP (use priority loading)

### Files:
- **[MODIFY]** `components/HomePage.tsx` — hero section

### DO:
```tsx
<div className="relative h-[500px] md:h-[600px]">
  <Image src={heroImageUrl} alt="Solen.ch" fill className="object-cover" priority />
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
  <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
    {/* Hero text + search bar */}
  </div>
</div>
```

---

## Phase 2.2: Trust Badges in Footer (~30min) 🟢

### What We Want:
- 3 badges above footer content: "🔒 Sichere Zahlung" | "🇨🇭 Swiss Made" | "✅ nDSG Konform"
- Glassmorphism cards, lucide icons (Shield, Flag, CheckCircle)
- 3-col desktop, stack mobile

### Files:
- **[NEW]** `components/ui/TrustBadges.tsx`
- **[MODIFY]** `components/layout/Footer.tsx`

```tsx
// TrustBadges.tsx
const badges = [
  { icon: Shield, label: "Sichere Zahlung", desc: "Stripe verschlüsselt" },
  { icon: Flag, label: "Swiss Made", desc: "Entwickelt in Basel 🇨🇭" },
  { icon: CheckCircle, label: "nDSG Konform", desc: "Datenschutzkonform" },
];
```

---

## Phase 2.3: Social Proof Strip with Count-Up (~1h) 🟢

### What We Want:
- Between hero and categories: "X Kund:innen • Y Salons • Z Buchungen diese Woche"
- Intersection Observer count-up animation (0 → real number)
- Numbers from `/api/analytics/platform` (existing endpoint)
- Space Grotesk for numbers, DM Sans for labels

### Files:
- **[NEW]** `components/SocialProofStrip.tsx`
- **[MODIFY]** `components/HomePage.tsx` — insert after hero

---

## Phase 2.4: Dynamic Hero Text (~30min) 🟢

### What We Want:
- Logged-out: "Dein Beauty-Termin in Basel"
- Logged-in: "Willkommen zurück, {firstName}!"
- Subtext: logged-in → "Dein nächster Termin: {date} bei {salon}" if they have an upcoming booking

### Files:
- **[MODIFY]** `components/HomePage.tsx` — hero text logic

---

## Phase 2.5: Weather Banner (~1h) 🟢

### What We Want:
- Small dismissible banner below hero (only rain/snow/cold)
- "Regentag? ☔ Gönn dir was Gutes." → links to /de/spa
- Free API: `https://api.open-meteo.com/v1/forecast?latitude=47.56&longitude=7.59&current=weather_code`
- Cache 1 hour (localStorage with timestamp)
- Weather codes 51-67 = rain, 71-77 = snow, <5°C = cold

### What We DON'T Want:
- ❌ Banner on every weather condition
- ❌ API call on every visit (cache it)
- ❌ Banner that can't be dismissed (add X close button, respect for 24h via localStorage)

### Files:
- **[NEW]** `components/WeatherBanner.tsx`
- **[MODIFY]** `components/HomePage.tsx`

---

## Phase 2.6: Review Mini-Carousel (~1h) 🟢

### What We Want:
- "Was Basler:innen sagen" section with 3 featured review cards
- Each card: reviewer initials avatar, ★ rating, snippet (max 120 chars), salon name
- Horizontal swipe mobile, 3-col grid desktop
- Glassmorphism card treatment

### Files:
- **[NEW]** `components/ReviewCarousel.tsx`
- **[NEW]** `app/api/reviews/featured/route.ts` — GET top reviews (rating ≥ 4, has text)
- **[MODIFY]** `components/HomePage.tsx`

---

## Phase 2.7: Category Hero Gradient (~30min) 🟢

### What We Want:
- Category sub-pages: subtle mesh gradient header matching category color
- Contains `<h1>` for SEO, subtitle, salon count
- Colors: Coiffeur=teal, Barbershop=dark, Nails=coral, Spa=blue-green, Makeup=purple, Waxing=warm amber

### Files:
- **[NEW]** `components/CategoryHero.tsx`
- **[MODIFY]** `components/CategoryPage.tsx` — render at top

---

## Phase 2.8: QuartierTile Enhancements (~1h) 🟢

### What We Want:
- Show real salon count per quartier (not "Bald hier" where salons exist)
- "Bereits besucht" green badge if user has past booking in quartier
- Heart icon if user has favorite salon in quartier
- Empty quartiers: "Noch keine Salons — Benachrichtige mich" with email input

### Files:
- **[MODIFY]** `components/HomePage.tsx` — quartier section

---

## Phase 3.1: Chat Read Receipts (~1.5h) 🟡

### What We Want:
- Single ✓ (grey) = sent, Double ✓✓ (teal) = read
- Update `read_at` on messages table when conversation opened
- Migration adds `read_at` column

### What We DON'T Want:
- ❌ Read receipts on system messages
- ❌ Breaking existing unread count logic

### Files:
- **[MODIFY]** `components/ChatWindow.tsx`
- **[NEW]** `supabase/migrations/060_chat_read_receipts.sql`

### Migration:
```sql
-- Migration 060: Chat read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
```

### UI:
```tsx
// Below each sent message bubble
{msg.sender_id === userId && (
  <span className="text-xs ml-1">
    {msg.read_at ? (
      <CheckCheck className="w-3 h-3 text-teal-500 inline" /> // ✓✓ teal
    ) : (
      <Check className="w-3 h-3 text-gray-400 inline" /> // ✓ grey
    )}
  </span>
)}
```

---

## Phase 3.2: Typing Indicator (~1h) 🟡

### What We Want:
- Supabase Realtime Presence for typing state
- "{Name} tippt..." with 3 animated bouncing dots
- Show 1s after typing starts, hide 2s after typing stops
- CSS-only animation (no library)

### Files:
- **[MODIFY]** `components/ChatWindow.tsx`
- **[NEW]** `components/ui/TypingIndicator.tsx`

```tsx
// TypingIndicator.tsx
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500 px-4 py-1">
      <span>{name} tippt</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}
```

---

## Phase 3.3: Booking Bubble in Chat (~1h) 🟡

### What We Want:
- After 3+ messages AND no existing booking → show "📅 Termin buchen bei {Salon}" card
- Teal accent card with "Jetzt buchen" button → navigates to salon page
- Shows once per conversation (tracked in localStorage)
- Dismissible with X button

### Files:
- **[NEW]** `components/chat/BookingBubble.tsx`
- **[MODIFY]** `components/ChatWindow.tsx`

---

## Phase 3.4: Per-Message Translation (Gemini) (~1h) 🟡

### What We Want:
- Small "Übersetzen" button on each message bubble (grey, bottom-right)
- Translates to user's locale using **Gemini 2.0 Flash** (same API as chat suggestions)
- Shows translation below original text in italic + "🤖 Übersetzt" label
- Cache: never translate same message twice (localStorage key: `translate_${msgId}_${lang}`)
- Supported: DE ↔ FR ↔ IT ↔ EN

### What We DON'T Want:
- ❌ Auto-translating every message (only on user click)
- ❌ Replacing original text (show BOTH original + translation)
- ❌ Calling API without caching

### Files:
- **[NEW]** `app/api/translate/route.ts` — NOTE: Session 1 may also create this for service name translation. Check `.agent-lock.json`. If Session 1 already created it, ADD a `type: "message"` parameter to distinguish.
- **[MODIFY]** `components/ChatWindow.tsx`

### API Logic:
```typescript
// POST /api/translate
// Uses Gemini 2.0 Flash — same API key as /api/chat/suggest
const prompt = `Translate this message from ${from} to ${to}. Return ONLY the translation, nothing else:\n"${text}"`;

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  }
);
const result = await response.json();
const translation = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
return NextResponse.json({ translation, provider: "gemini" });
```

---

## Phase 4.1: Animation Presets Library (~30min) 🟢

### Files:
- **[NEW]** `lib/animations.ts`

```typescript
// Reusable framer-motion presets
export const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };
export const staggerContainer = { animate: { transition: { staggerChildren: 0.1 } } };
export const slideSwitch = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };
export const pressAnimation = { whileTap: { scale: 0.95 }, transition: { type: "spring", stiffness: 400, damping: 17 } };
export const exitFade = { exit: { opacity: 0, transition: { duration: 0.2 } } };
```

---

## Phase 4.2: Teal Glow + Smooth Nav Indicator (~30min) 🟢

### Files:
- **[MODIFY]** `tailwind.config.js` — add custom utilities
- **[MODIFY]** `components/layout/BottomNav.tsx` — smooth active indicator

### Tailwind additions:
```javascript
// In tailwind.config.js extend.boxShadow:
'teal-glow': '0 0 20px rgba(56, 178, 172, 0.3)',
// In extend.backgroundImage:
'mesh-teal': 'radial-gradient(at 40% 20%, hsla(174, 52%, 51%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(174, 52%, 51%, 0.15) 0px, transparent 50%)',
```

### Bottom Nav:
- Active tab has smooth teal underline that slides between tabs using `motion.div layoutId="activeTab"`

---

## Phase 4.3: Remove Pull-to-Refresh (~15min) 🟢

### What We Want:
- Remove any custom pull-to-refresh code/handlers from homepage
- iOS has native pull-to-refresh, custom one causes jank

### Files:
- **[MODIFY]** `components/HomePage.tsx` — remove touch handlers related to pull-to-refresh

---

## Verify Session 2:
```bash
# Homepage:
# - Hero image visible with dark overlay → text readable
# - Trust badges in footer: 3 badges rendered
# - Social proof strip between hero and categories → numbers count up
# - Dynamic text: log in → "Willkommen zurück, {name}"
# - Weather: if raining → banner shows, X closes it
# - Review carousel: 3 cards with real reviews
# - QuartierTiles: real counts, no "Bald hier" where salons exist

# Category pages:
# - Category hero gradient renders with <h1>

# Chat:
# - Send message → ✓ grey
# - Open on other side → ✓✓ teal
# - Start typing → opponent sees "tippt..."
# - After 3 messages → booking bubble appears
# - "Übersetzen" → translation shows below original

# Design:
# - Pull-to-refresh removed from homepage
# - Smooth nav indicator on bottom nav
# - teal-glow shadow available in Tailwind
npm run build && git push origin main
```

**POST in `.agent-comms.md` when done:**
```
## Session 2 Complete
- Homepage: hero image, trust badges, social proof, dynamic text, weather banner, review carousel, quartier fix
- Chat: read receipts, typing indicator, booking bubble, Gemini translation
- Design: animation presets, teal-glow, smooth nav indicator, removed pull-to-refresh
- Migration 060: messages.read_at
- Build passes ✅
```
