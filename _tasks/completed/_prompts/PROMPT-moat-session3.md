> ⚠️ **STALE — REFERENCES RETIRED DESIGN SYSTEM** (flagged 2026-05-06)
>
> This file references the previous V5 design tokens (coral hexes, Bebas Neue, locked component patterns, etc.) which are currently **in flux**. **Don't cite values or rules from this file as authoritative.** Read `_tasks/SOLEN_DESIGN.md` for current state, or ask the user. Archived context: `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

---

# Moat Session 3 — Loyalty UX + Feature Showcase + Polish

## Who You Are
You are Claude Code, Session 3 of 3 for the Solen Moat Features roadmap.
- **Session 1 (RUNNING IN PARALLEL):** Chat intelligence, client CRM tags, migration 054/056/057/058
- **Session 2 (RUNNING IN PARALLEL):** Solen Score, map enhancement, compare table, off-peak, migration 059
- **Session 3 (YOU):** Loyalty stamp UX, feature showcase page, "Nur bei Solen" badges, tutorial upgrade, upcharge reasons, review badges, accessibility polish

## ⚡ PARALLEL EXECUTION — CRITICAL

All 3 sessions run SIMULTANEOUSLY. To prevent corruption:

### YOUR EXCLUSIVE FILES (ONLY YOU may modify these):
- `components/SalonCard.tsx` — you add ALL new props (stampProgress, solenTier, availableToday, hover animation)
- `components/loyalty/StampCard.tsx` — NEW, you create
- `components/ui/SolenExclusiveBadge.tsx` — NEW, you create
- `app/[locale]/warum-solen/page.tsx` — NEW, you create
- `app/[locale]/profile/page.tsx` OR `app/[locale]/account/page.tsx` — Stempelkarten section
- `components/TutorialTour.tsx` — you modify (steps upgrade)
- `app/globals.css` — you add focus rings + animations
- Review display on salon page — you add reply badge
- Dispute/upcharge flow — you add reason dropdown
- `Header.tsx`, `BottomNav.tsx`, `FilterBar.tsx`, `BookingCalendar.tsx`, `CookieBanner.tsx` — you add aria-labels

### DO NOT TOUCH (Session 1 owns these):
- `components/ChatWindow.tsx`
- `components/chat/*` (all files)
- `components/dashboard/ClientTags.tsx`
- `app/api/chat-templates/`, `app/api/chat/suggest/`, `app/api/client-tags/`
- `app/[locale]/dashboard/settings/page.tsx`
- `app/[locale]/dashboard/bookings/page.tsx` (booking detail)
- `app/[locale]/checkout/page.tsx`
- Migrations 054, 056, 057, 058

### DO NOT TOUCH (Session 2 owns these):
- `components/MapView.tsx`
- `components/CompareDrawer.tsx`
- `components/dashboard/SolenScoreCard.tsx`
- `app/api/admin/solen-score/`
- `app/[locale]/salon/[slug]/page.tsx` (salon detail — Session 2 adds countdown)
- `vercel.json`
- Migration 059

### GIT RULES FOR PARALLEL EXECUTION
1. Work on branch: `git checkout -b moat/session3`
2. Commit frequently (after each phase)
3. Do NOT push to `main` directly
4. Do NOT run `git pull` during work (prevents mid-work conflicts)
5. When DONE: push your branch `git push origin moat/session3`
6. User will merge all 3 branches into main one by one after all sessions finish

## Pre-Flight
1. `git checkout -b moat/session3` — create your branch
2. Read `CLAUDE.md` fully — Sections 3, 5, 6
3. Read `UI_RULES.md` fully
4. `npm run build` — must pass before starting
5. Note commit hash: `git rev-parse HEAD`

## 🚨 CRITICAL SAFETY RULES
1. NEVER modify files listed in DO NOT TOUCH sections above
2. NEVER rebuild or restructure existing components. Only ADD.
3. NEVER delete existing files or code.
4. NEVER change the design system (teal, coral, dark, Syne/DM Sans/Space Grotesk).
5. BEFORE EVERY commit: `npm run build` + `npx tsc --noEmit`
6. ONE COMMIT per phase (4 commits total for this session).
7. If build fails 3x → stash, note in INCOMPLETE_FEATURES.md, move on.

---

## Phase M3: Loyalty Stamp UX (~2h)

### ⚠️ RISK: MEDIUM

### ✅ WHAT WE WANT
- Animated StampCard component with CSS bounce + confetti
- SalonCard gets 3 new optional props: `stampProgress`, `solenTier`, `availableToday` + hover animation
- Profile page gets "Stempelkarten" section
- "Almost there" Resend email when customer hits stamps_needed - 1

### ❌ WHAT WE DON'T WANT
- No external animation libraries — CSS keyframes only
- Don't show stamps to anonymous users
- Don't show StampCard for salons where user has 0 stamps

### Steps

#### M3.1 — StampCard Component
1. Create `components/loyalty/StampCard.tsx`:
```
Props: {
  salonName: string;
  salonSlug: string;
  salonImageUrl?: string;
  stampsTotal: number;
  stampsCollected: number;
  rewardText: string;
}
```
2. Card layout:
   - Top: salon name + small image, link to salon page
   - Middle: row of stamp circles (filled = teal with ✓, empty = dashed border)
   - Bottom: reward text + "X von Y Stempel" progress text
3. CSS animation for new stamps:
```css
@keyframes stampBounce {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
```
4. On full card (all stamps collected): CSS confetti effect
   - 12 small circles with random colors, absolute positioned, falling animation
   - Auto-dismiss after 3 seconds
5. Dark mode support
6. Put animation CSS in `app/globals.css` (your exclusive file)

#### M3.2 — SalonCard: Add ALL New Props
1. Open `SalonCard.tsx` — READ IT FULLY
2. This is YOUR exclusive file. Add ALL three new optional props in ONE edit:

```typescript
interface SalonCardProps {
  // ... existing props ...
  stampProgress?: { current: number; total: number } | null;
  solenTier?: 'gold' | 'teal' | 'grey' | 'dark' | null;
  availableToday?: number | null;
}
```

3. **stampProgress** (if exists and current > 0):
   - Show pill: "⭐ 3/5" below rating
   - Style: `text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-0.5 rounded-full`

4. **solenTier** (if 'gold'):
   - Add to card wrapper: `ring-2 ring-yellow-400/50`
   - Badge top-right of image: "⭐ Top Salon"
   - Style: `absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full`

5. **availableToday** (if > 0):
   - Green pill top-left of image: "3 Termine heute frei"
   - Style: `absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm`

6. **Hover animation** (add to card wrapper):
   - `group hover:shadow-lg transition-all duration-200`
   - Inner card: `group-hover:scale-[1.02] transition-transform duration-200`

7. All props are OPTIONAL with defaults of null/undefined — backward compatible.

#### M3.3 — Profile: Stempelkarten Section
1. Find profile page: likely `app/[locale]/profile/page.tsx` or `app/[locale]/account/page.tsx`
2. ADD section "🏆 Deine Stempelkarten":
   - Fetch user's active loyalty stamps joined with loyalty_cards and salons
   - Render each as `StampCard` component
   - Empty state: "Du hast noch keine Stempel — buche jetzt bei einem Salon! 🎯"

#### M3.4 — "Almost There" Email
1. Find booking completion flow: `grep -rn "completed\|status.*completed\|markComplete" app/api/ --include="*.ts" | head -10`
2. After stamp is awarded in the existing flow:
   - Check: is customer now at `stamps_needed - 1`?
   - If yes AND `RESEND_API_KEY` exists:
   - Send email via Resend: "⭐ Noch 1 Besuch bis zu deiner Belohnung bei [Salon]!"
   - Check `notification_preferences.rebooking_enabled` first

→ `git add . && git commit -m "moat-session3-phase1: loyalty stamp UX"`

---

## Phase M7: Feature Showcase + "Nur bei Solen" (~2h)

### ⚠️ RISK: LOW — Almost entirely new files

### ✅ WHAT WE WANT
- "✨ Nur bei Solen" small tooltip badges on 5 exclusive features
- `/warum-solen` full marketing page with animated feature demos (CSS only)
- Customer tutorial upgrade: 3 steps with "Solen Extras" highlight, per-step skip + skip-all

### ❌ WHAT WE DON'T WANT
- Don't add heavy JS animation libraries — CSS transitions and keyframes only
- `/warum-solen` must be BEAUTIFUL — full design system, glassmorphism, animations. Don't rush it.
- Don't modify TutorialTour's overlay mechanism — only change the step CONTENT

### Steps

#### M7.1 — SolenExclusiveBadge Component
1. Create `components/ui/SolenExclusiveBadge.tsx`:
```
Props: {
  featureDescription: string;  // tooltip text
  variant?: 'inline' | 'floating';  // inline = next to button, floating = absolute positioned
}
```
2. Visual: small badge "✨ Nur bei Solen"
   - Style: `inline-flex items-center gap-1 text-[10px] font-medium bg-gradient-to-r from-teal-500/20 to-teal-400/10 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-700/50`
3. On hover/tap: show tooltip with `featureDescription`
   - Tooltip: `absolute z-10 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px] -top-10`
4. Export for use across the app

#### M7.2 — Place Badges
Place `SolenExclusiveBadge` at these 5 locations:

1. **Salon detail page chat icon** — next to the "Nachricht" button:
   - Find: salon detail page renders a chat/message button
   - Add badge with: "Chatte direkt mit deinem Salon — nur bei Solen!"
   - ⚠️ Session 2 owns the salon detail page for off-peak countdown. Place your badge on a DIFFERENT part of the page (the chat button area, not the services section). Check the page structure first.

2. **Compare button** (wherever compare is triggered):
   - Find: grep for "compare\|vergleich" in components
   - Add badge with: "Vergleiche bis zu 3 Salons — nur bei Solen!"

3. **Stamp card section** (profile page — your file):
   - Add badge next to "🏆 Deine Stempelkarten" heading: "Sammle Stempel bei jedem Besuch!"

4. **Map price labels** — NOTE: you can't modify MapView (Session 2 owns it).
   - Instead: add badge next to the "Karte" tab/button that switches to map view (wherever that toggle exists)
   - "Sieh Preise direkt auf der Karte!"

5. **Photo quoting in chat** — NOTE: you can't modify ChatWindow (Session 1 owns it).
   - Instead: add to the `/warum-solen` page feature section about photo quoting

#### M7.3 — `/warum-solen` Feature Showcase Page
1. Create `app/[locale]/warum-solen/page.tsx`:
2. Structure (full-width sections, alternating backgrounds):

**Section 0: Hero**
- Large heading: "Was Solen anders macht" (Syne font)
- Subtitle: "Nicht nur buchen — sondern erleben."
- Background: subtle radial gradient teal → transparent
- CTA: "Jetzt entdecken ↓" smooth scroll to Section 1

**Section 1: "💬 Chatte direkt mit deinem Salon"**
- Left: text explaining direct chat with salons
- Right: mock chat UI (static screenshot-style with CSS, or simplified div mockup)
- Key points: templates, AI suggestions, photo-based quoting
- Background: white / dark:gray-900

**Section 2: "📸 Schick ein Foto, bekomm einen Preis"**
- Left: animated demo — photo "uploads" then price offer card appears (CSS keyframe steps)
- Right: text explaining photo quoting
- Background: teal-50 / dark:teal-900/10

**Section 3: "⚖️ Vergleiche Salons nebeneinander"**
- Simplified compare table static mockup
- "🏆 Empfehlung" highlight on one column
- Background: white / dark:gray-900

**Section 4: "⭐ Sammle Stempel, bekomm Belohnungen"**
- Use actual `StampCard` component (from M3.1) with demo data
- Stamp animation plays on scroll-into-view (intersection observer)
- Background: teal-50 / dark:teal-900/10

**Section 5: "🗺️ Preise direkt auf der Karte"**
- Static map illustration with gold/teal pins and "ab CHF 45" labels
- Text explaining the map features
- Background: white / dark:gray-900

**Bottom CTA section:**
- "Jetzt ausprobieren" → `/de` homepage
- "Bist du ein Salon?" → `/partner`
- Background: dark gradient, glassmorphism card

3. SEO metadata:
```typescript
export function generateMetadata() {
  return {
    title: 'Warum Solen? — Die smarte Art Beauty-Termine zu buchen',
    description: 'Chatte mit Salons, vergleiche Preise, sammle Stempel — Solen macht Beauty-Termine zum Erlebnis.',
    openGraph: { ... }
  };
}
```

4. Styling requirements:
   - Full glassmorphism on CTA cards: `bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl`
   - Smooth scroll animations: use intersection observer to fade in sections
   - Must look PREMIUM — this is the marketing page
   - Mobile-responsive: sections stack vertically on mobile

#### M7.4 — Tutorial Upgrade
1. Open `components/TutorialTour.tsx` — READ IT FULLY
2. Update the step content (don't change the overlay mechanism):
   - Step 1: "🔍 Suche" — spotlight on search bar
     - Text: "Finde Salons nach Behandlung, Preis, Bewertung oder Quartier"
   - Step 2: "✨ Solen Extras" — spotlight on chat icon + compare button area
     - Text: "Nur bei Solen: Chatte direkt, vergleiche Salons, sammle Stempel!"
     - This step highlights what makes Solen unique
   - Step 3: "📅 Buche" — spotlight on booking button
     - Text: "Buche in 30 Sekunden — einfach, schnell, sicher"
3. Each step gets TWO buttons:
   - "Überspringen" (skip this step → move to next)
   - "Alle überspringen" (close entire tour)
4. Store `tutorial_completed: true` in localStorage after completion or full skip
5. Only show on first visit (`!localStorage.getItem('tutorial_completed')`)

→ `git add . && git commit -m "moat-session3-phase2: feature showcase + nur bei solen + tutorial"`

---

## Phase M8: Upcharge Reasons + Review Badges + Accessibility (~1.5h)

### ⚠️ RISK: LOW

### Steps

#### M8.1 — Structured Upcharge Reasons
1. Find the dispute/upcharge UI: `grep -rn "dispute\|upcharge\|Preisanpassung\|price.*adjust" components/ --include="*.tsx" | head -10`
2. Add a predefined reason dropdown BEFORE the reason text area:
```tsx
const UPCHARGE_REASONS = [
  { value: 'hair_length', label: 'Haarlänge' },
  { value: 'extra_treatment', label: 'Zusätzliche Behandlung' },
  { value: 'materials', label: 'Material / Produkte' },
  { value: 'overtime', label: 'Zeitüberschreitung' },
  { value: 'other', label: 'Sonstiges' }
];
```
3. Below dropdown: optional free text field "Weitere Details (optional)"
4. Customer sees: "Preisanpassung: +CHF 15 — Grund: Haarlänge" (human-readable label, not the value)
5. Store: `price_disputes.salon_reason` = `{ reason: 'hair_length', details: 'optional text' }` (JSON)

#### M8.2 — "Salon hat geantwortet" Badge
1. Find review display on salon page: `grep -rn "review.*reply\|reply.*text\|ReviewReply" components/ app/ --include="*.tsx" | head -10`
2. If a review has a `review_reply` (join with `review_replies` table):
   - Show badge between review text and reply text:
```tsx
<div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-2 mb-1">
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
  </svg>
  Salon hat geantwortet
</div>
```

#### M8.3 — Accessibility Polish (aria-labels)
1. Add `aria-label` to ALL interactive elements in YOUR exclusive files:
   - `Header.tsx`: logo link ("Solen Startseite"), menu button ("Menü öffnen"), nav links
   - `BottomNav.tsx`: all tab buttons ("Startseite", "Suchen", "Termine", "Profil")
   - `FilterBar.tsx`: all filter inputs, sort select, clear button
   - `BookingCalendar.tsx`: date buttons ("Termin am [date]"), time slots ("Termin um [time]"), nav arrows
   - `CookieBanner.tsx`: accept ("Cookies akzeptieren"), reject ("Cookies ablehnen"), settings
2. Use descriptive German labels, not generic "button" labels

#### M8.4 — Focus-Visible Rings
1. Open `app/globals.css` (your exclusive file)
2. Add at the end:
```css
/* Accessibility: keyboard navigation focus rings */
*:focus-visible {
  outline: 2px solid rgba(56, 178, 172, 0.7);
  outline-offset: 2px;
  border-radius: 4px;
}
.dark *:focus-visible {
  outline-color: rgba(56, 178, 172, 0.9);
}

/* Stamp card animations */
@keyframes stampBounce {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes confettiFall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
}
.stamp-new { animation: stampBounce 0.5s ease-out; }
.confetti { animation: confettiFall 1.5s ease-out forwards; }
```

→ `git add . && git commit -m "moat-session3-phase3: upcharge reasons + review badges + accessibility"`

---

## Post-Session 3 — Push Branch
```bash
npm run build && npx tsc --noEmit
git push origin moat/session3
```

Tell the user: "Session 3 complete. Branch `moat/session3` pushed. Ready to merge."

You are DONE. Do NOT merge to main yourself. User will merge all 3 branches.
