# 🎨 Solen.ch UI Redesign Roadmap (v3)

> **Every AI agent MUST read `CLAUDE.md` and `UI_RULES.md` before making ANY changes.**
> **Branch:** `main`
> **Build & safety rules:** See CLAUDE.md Section 10. ONE COMMIT PER PHASE. `npm run build` must pass before every commit.
> **Design system:** Next.js ONLY (Section 3.3). NEVER use wine-red/gold/DM Serif Display.

---

## 🔴 BREAKAGE RISK ASSESSMENT

| Phase | Risk | What Could Break | Prevention |
|---|---|---|---|
| **1. Color Migration** | 🟡 Medium | Hardcoded `#4ECDC4` won't match new `#38B2AC` | grep ALL `#4ECDC4` + `4ECDC4` — update every occurrence |
| **2. Hero + Search + CTAs** | 🟡 Medium | InteractiveHoverButton needs `bg-primary` CSS var | Set `--primary` in globals.css to teal |
| **3. Salon Cards** | 🟡 Medium | Cards render differently, grid vs scroll layout shift | Test on both mobile (375px) and desktop (1200px) viewports |
| **4. Last-Minute** | 🟢 Low | Only modifies one section in `HomePage.tsx` | Self-contained section |
| **5. Social Proof + Trust** | 🟢 Low | New components — won't break existing | Pure additions |
| **6. Skeleton Loading** | 🟡 Medium | Replacing `<Spinner>` in 8 components | Keep `Spinner.tsx` as fallback, add `Skeleton.tsx` alongside |
| **7. Empty States** | 🟢 Low | Only modifies `EmptyState.tsx` | Backward-compatible props |
| **8. Bottom Nav (ExpandableTabs)** | 🟡 Medium | New dep `usehooks-ts`, fixed positioning overlap | `npm install usehooks-ts`, add `pb-16` on mobile |
| **9. Pull-to-Refresh + Polish** | 🟢 Low | Micro-feature, won't break layout | Self-contained |
| **10. Update CLAUDE.md** | 🟢 Low | Documentation only | No code risk |
| **11. Dashboard Sidebar** | 🟡 Medium | Replaces existing DashboardLayout sidebar | Keep old layout as fallback, test all 18 dashboard pages |
| **12. DateRangePicker** | 🟡 Medium | New deps: `react-aria-components`, `@internationalized/date`, `class-variance-authority` | Install all deps before coding, test booking flow end-to-end |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1 — Color System Update (`#4ECDC4` → `#38B2AC`)

**Goal:** Migrate primary teal from `#4ECDC4` to deeper `#38B2AC` for a more premium feel.

**Files:**
- [MODIFY] `tailwind.config.js` — Update teal DEFAULT, light, dark values
- [MODIFY] `components/HomePage.tsx` — Replace 4 hardcoded `#4ECDC4` references
- [MODIFY] `components/FilterBar.tsx` — Replace 1 hardcoded `#4ECDC4` reference
- [MODIFY] `CLAUDE.md` — Update Section 3.3 color values
- [MODIFY] `UI_RULES.md` — Update color references if any

**Steps:**
1. Update `tailwind.config.js`:
   - `teal.DEFAULT`: `#4ECDC4` → `#38B2AC`
   - `teal.light`: `#7EDDD7` → `#5EC8BF`
   - `teal.dark`: `#3ABDB4` → `#2D9E97`
   - Update `teal-glow` shadow to match new color
   - Update `mesh-teal` gradient HSL values
   - Remove `"./index.html"` from content array (monolith archived)
2. Grep for ALL remaining `#4ECDC4` and `4ECDC4` in `components/` and `app/` — replace with Tailwind classes (`text-teal`, `bg-teal`, etc.) instead of hardcoded hex
3. Update CLAUDE.md Section 3.3 color value

**⚠️ BE CAREFUL:**
- Grep the ENTIRE repo for `#4ECDC4` and `4ECDC4` (including CSS-in-JS `backgroundColor` props)
- Some uses like `#4ECDC420` (with opacity suffix) need different treatment → use `bg-teal/[0.125]`
- After changing tailwind config, ALL Tailwind classes like `text-teal`, `bg-teal/10`, `border-teal` will auto-update — ONLY manually fix inline `style=` props

**✅ DO:**
```tsx
<Icon className="text-teal" />
<div className="bg-teal/10 text-teal" />
```

**❌ DON'T:**
```tsx
<Icon style={{ color: "#4ECDC4" }} />
<div style={{ backgroundColor: "#4ECDC420", color: "#4ECDC4" }} />
```

**Verification:**
```bash
# Must return 0 results after this phase
grep -rn "#4ECDC4\|4ECDC4" components/ app/ --include="*.tsx" --include="*.ts"
# Build must pass
npm run build
# Commit
git add -A && git commit -m "phase 1: migrate teal #4ECDC4 → #38B2AC, replace hardcoded colors with Tailwind classes"
```

---

### Phase 2 — Hero Section + InteractiveHoverButton CTAs

**Goal:** Add search bar to hero, improve gradient, add `InteractiveHoverButton` for all primary CTAs. Make it feel premium.

**Files:**
- [NEW] `components/ui/SearchBar.tsx` — Reusable search component with auto-suggest
- [NEW] `components/ui/interactive-hover-button.tsx` — 21st.dev animated CTA button (expanding teal circle + arrow)
- [MODIFY] `components/HomePage.tsx` — Rebuild hero section with search bar + InteractiveHoverButton CTAs

**Steps:**
1. Create `interactive-hover-button.tsx` from 21st.dev source:
   - Copy the component as-is (it uses `ArrowRight` from lucide — already installed)
   - **Customize colors for solen:** Change `bg-primary` to `bg-teal` and `text-primary-foreground` to `text-white`
   - The expanding circle animation uses `bg-primary` — set the CSS variable `--primary` in `globals.css` to `56 78% 45%` (HSL for `#38B2AC`) OR hardcode `bg-teal` in the component
2. Create `SearchBar.tsx`:
   - Full-width input with `Search` icon (lucide)
   - Placeholder: "Suche Salon in Basel..."
   - On submit → navigate to `/${locale}/coiffeur?q={query}`
   - Rounded, warm styling: `rounded-2xl bg-white shadow-card p-4`
   - Focus state: `ring-2 ring-teal/30`
3. Update hero section in `HomePage.tsx`:
   - Keep gradient background but make warmer: `from-teal/8 via-white to-warm-beige/5`
   - Add search bar between headline and categories
   - Replace all `<Link>` CTAs with `<InteractiveHoverButton>` (hero CTA, Last-Minute "Angebote ansehen")
   - Example: `<InteractiveHoverButton text="Salon finden" className="w-40" />`

**⚠️ BE CAREFUL:**
- Hero is the FIRST thing users see — if it breaks, the whole site looks broken
- `InteractiveHoverButton` uses `bg-primary` — you MUST either set the CSS variable or swap to `bg-teal` directly in the component. Without this, the expanding circle will be the wrong color.
- Search bar must be keyboard-accessible (Enter to submit)
- On mobile, search bar should be full-width with no horizontal overflow
- Do NOT remove the existing category grid — search goes ABOVE it

**✅ DO:**
```tsx
// Customize InteractiveHoverButton for solen teal
<InteractiveHoverButton
  text="Salon finden"
  className="w-40 border-teal/20"
/>
// In the component: change bg-primary → bg-teal
```

**❌ DON'T:**
```tsx
// Don't use the default bg-primary without setting the CSS variable
<InteractiveHoverButton text="Salon finden" />
// The circle will be some random shadcn default color
```

**Verification:**
```bash
npm run build
git add -A && git commit -m "phase 2: add search bar, InteractiveHoverButton CTAs, enhance hero gradient"
```

---

### Phase 3 — Salon Cards Redesign

**Goal:** Responsive layout (scroll on mobile, grid on desktop). Add distance, next available slot, "Verfügbar heute" badge.

**Files:**
- [MODIFY] `components/SalonCard.tsx` — Add distance display, next slot, availability badge
- [MODIFY] `components/HomePage.tsx` — Change salon section from scroll-only to responsive scroll/grid
- [MODIFY] `app/api/salons/route.ts` — Add `next_available_slot` to salon response (if not already)

**Steps:**
1. Update `SalonCard.tsx`:
   - Add "Verfügbar heute" green badge: `<span className="px-2 py-0.5 rounded-pill bg-emerald-500 text-white text-[10px] font-medium">Verfügbar heute</span>`
   - Show distance if available: `<span className="text-xs text-dark/50">0.3 km</span>` next to MapPin
   - Show next slot if available: `<span className="text-xs text-teal font-medium">Heute 14:30 frei</span>`
2. Update `HomePage.tsx` salon section:
   - Mobile (< 768px): Keep horizontal scroll (current behavior)
   - Desktop (≥ 768px): Switch to `grid grid-cols-2 lg:grid-cols-3 gap-4`
   - Use CSS media queries or responsive Tailwind classes
3. Check API — if `next_available_slot` isn't in the response, add it

**⚠️ BE CAREFUL:**
- `SalonCard.tsx` is used in MULTIPLE places: `HomePage.tsx`, `CategoryPage.tsx`, `RecommendedSalons.tsx`
- Any prop changes MUST be backward-compatible (make new props optional)
- The `SalonCardType` in `lib/types.ts` may need extending — check before coding
- Grid on desktop must NOT break the existing horizontal scroll on mobile

**✅ DO:**
```tsx
// Make new props OPTIONAL
interface SalonCardProps {
  salon: SalonCardType;
  showAvailability?: boolean;  // NEW — optional
  showDistance?: boolean;       // NEW — optional
}
```

**❌ DON'T:**
```tsx
// Don't make new props required — breaks all existing usages
interface SalonCardProps {
  salon: SalonCardType;
  distance: number;          // REQUIRED — breaks CategoryPage, RecommendedSalons
  nextSlot: string;          // REQUIRED — breaks everything
}
```

**Verification:**
```bash
# Check SalonCard is still used correctly everywhere
grep -rn "SalonCard" components/ app/ --include="*.tsx"
npm run build
git add -A && git commit -m "phase 3: responsive salon cards with availability badge, distance, next slot"
```

---

### Phase 4 — Last-Minute Section Upgrade

**Goal:** Add "Heute verfügbar" badges (not countdowns), better visual cards.

**Files:**
- [MODIFY] `components/HomePage.tsx` — Enhance last-minute section with card grid and badges

**Steps:**
1. Replace current plain teaser with a section showing actual last-minute offers (from `/api/salons?sort=last_minute`)
2. Each deal card shows:
   - Salon name + photo
   - Before/after price with strikethrough
   - "Heute verfügbar" green badge
   - "Bis zu X% sparen" coral accent badge
3. If no last-minute offers → show the current teaser CTA (graceful fallback)

**⚠️ BE CAREFUL:**
- If the API returns empty results → do NOT show an empty section. Show the existing CTA teaser as fallback.
- Don't add a countdown timer — user specifically chose "Heute verfügbar" badge style (Q10: C)

**Verification:**
```bash
npm run build
git add -A && git commit -m "phase 4: upgrade last-minute section with deal cards and availability badges"
```

---

### Phase 5 — Social Proof Strip + Trust Badges

**Goal:** Add "Vertraut von Basler:innen seit 2026" strip + footer trust badges.

**Files:**
- [NEW] `components/ui/SocialProofStrip.tsx` — "Vertraut von Basler:innen seit 2026" banner
- [NEW] `components/ui/TrustBadges.tsx` — "Sichere Zahlung" + "Swiss Made 🇨🇭" + "nDSG Konform"
- [MODIFY] `components/HomePage.tsx` — Insert SocialProofStrip below hero
- [MODIFY] `components/layout/Footer.tsx` — Add TrustBadges above copyright

**Steps:**
1. Create `SocialProofStrip.tsx`:
   - Centered text: "Vertraut von Basler:innen seit 2026"
   - Subtle background: `bg-teal/5`
   - Icons: `Shield`, `Users`, `MapPin` (lucide)
   - Warm, inviting tone
2. Create `TrustBadges.tsx`:
   - Three badges in a row: "Sichere Zahlung" (Lock icon), "Swiss Made 🇨🇭" (Flag), "nDSG Konform" (ShieldCheck)
   - Muted, footer-appropriate styling
3. Insert `SocialProofStrip` in `HomePage.tsx` between hero and category grid
4. Insert `TrustBadges` in `Footer.tsx` above the copyright divider

**⚠️ BE CAREFUL:**
- Don't show specific numbers yet (user chose Q12: B — no raw stats)
- Keep the strip subtle — it should build trust, not scream "marketing"
- Footer trust badges should match the dark footer theme (white/muted text)

**Verification:**
```bash
npm run build
git add -A && git commit -m "phase 5: add social proof strip and trust badges in footer"
```

---

### Phase 6 — Skeleton Loading

**Goal:** Replace spinner loading states with grey shimmer skeleton blocks (Airbnb-style).

**Files:**
- [NEW] `components/ui/Skeleton.tsx` — Shimmer skeleton component (card shape, text shape, etc.)
- [MODIFY] `components/HomePage.tsx` — Replace `<Spinner>` with skeleton cards
- [MODIFY] `components/CategoryPage.tsx` — Replace `<Spinner>` with skeleton cards

**Steps:**
1. Create `Skeleton.tsx` with variants:
   - `<Skeleton variant="card" />` — Card-shaped skeleton (photo + text lines)
   - `<Skeleton variant="text" />` — Single text line
   - `<Skeleton variant="avatar" />` — Circle
   - Shimmer animation: CSS `@keyframes shimmer` with gradient sweep
2. Update `HomePage.tsx`: Replace `<Spinner size="lg" />` with a grid of `<Skeleton variant="card" />` (show 4 skeleton cards)
3. Update `CategoryPage.tsx`: Same pattern — skeleton cards instead of spinner
4. Keep `Spinner.tsx` working — it's still used for buttons and small inline loading states

**⚠️ BE CAREFUL:**
- Do NOT delete `Spinner.tsx` — it's used in 8 components for button loading states
- Only replace the FULL-PAGE spinners (in `HomePage` and `CategoryPage`)
- `BookingCalendar.tsx`, `ChatWindow.tsx`, `SignIn.tsx` etc. should keep `<Spinner>` for inline states
- Skeleton card dimensions should match real `SalonCard` dimensions to prevent layout jump

**✅ DO:**
```tsx
// Full-page loading → skeleton
{loading ? (
  <div className="grid grid-cols-2 gap-4">
    {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
  </div>
) : (/* real content */)}
```

**❌ DON'T:**
```tsx
// Do NOT replace button spinners with skeletons
<button>
  {submitting ? <Skeleton variant="text" /> : "Submit"}  // WRONG
</button>
```

**Verification:**
```bash
# Spinner should still exist and be used
grep -rn "Spinner" components/ --include="*.tsx" | wc -l  # Should be > 10
npm run build
git add -A && git commit -m "phase 6: add shimmer skeleton loading, replace full-page spinners"
```

---

### Phase 7 — Enhanced Empty States

**Goal:** Add minimal line art SVG illustrations to empty states.

**Files:**
- [MODIFY] `components/ui/EmptyState.tsx` — Add optional `illustration` prop with line art SVGs
- [NEW] `public/illustrations/no-results.svg` — Line art for "no search results"
- [NEW] `public/illustrations/coming-soon.svg` — Line art for "coming soon" sections

**Steps:**
1. Create simple line art SVGs (inline in component or as files):
   - `no-results`: Scissors + magnifying glass outline
   - `coming-soon`: Calendar with sparkle outline
2. Update `EmptyState.tsx`:
   - Add optional `illustration?: "no-results" | "coming-soon"` prop
   - If provided, show SVG above the icon
   - Keep backward compatible — existing usages without illustration still work

**⚠️ BE CAREFUL:**
- SVGs should be simple line drawings matching the teal color scheme
- Keep SVG file sizes small (< 5KB each)
- Don't break existing `EmptyState` usages — the `illustration` prop must be OPTIONAL

**Verification:**
```bash
npm run build
git add -A && git commit -m "phase 7: add line art illustrations to empty states"
```

---

### Phase 8 — Mobile Bottom Nav (ExpandableTabs) + Sticky CTA

**Goal:** Add premium animated bottom nav using `ExpandableTabs` from 21st.dev + dynamic sticky CTA.

**New dependency:** `npm install usehooks-ts`

**Files:**
- [NEW] `components/ui/expandable-tabs.tsx` — 21st.dev animated tab component (Framer Motion spring animations)
- [NEW] `components/layout/BottomNav.tsx` — Mobile bottom nav using ExpandableTabs
- [NEW] `components/ui/StickyMobileCTA.tsx` — "X Salons verfügbar → Buchen" floating bar
- [MODIFY] `app/[locale]/layout.tsx` — Include BottomNav on mobile
- [MODIFY] `components/HomePage.tsx` — Add StickyMobileCTA

**Steps:**
1. `npm install usehooks-ts` (used by ExpandableTabs for `useOnClickOutside`)
2. Create `expandable-tabs.tsx` from 21st.dev source:
   - Copy as-is, already uses framer-motion (installed) and lucide-react (installed)
   - **Customize:** Set `activeColor="text-teal"` as default instead of `text-primary`
3. Create `BottomNav.tsx` using ExpandableTabs:
   ```tsx
   const tabs = [
     { title: "Home", icon: House },
     { title: "Suche", icon: Search },
     { type: "separator" },
     { title: "Termine", icon: Calendar },
     { title: "Profil", icon: User },
   ];
   ```
   - Fixed bottom, glass blur background
   - Only visible on mobile (`md:hidden`)
   - When a tab is tapped, the icon expands smoothly to show label (spring animation)
   - Active tab: teal icon + text, inactive: gray
4. Create `StickyMobileCTA.tsx`:
   - Uses `InteractiveHoverButton` from Phase 2
   - Dynamic text: "X Salons verfügbar → Buchen"
   - Appears after scrolling 400px (IntersectionObserver)
   - Only on mobile (`md:hidden`), positioned above bottom nav (`bottom-20`)
5. Update `layout.tsx`: Add `<BottomNav />` + `pb-16 md:pb-0` padding

**⚠️ BE CAREFUL:**
- `usehooks-ts` is a NEW dependency — must install BEFORE using the component
- `ExpandableTabs` uses `useOnClickOutside` from `usehooks-ts` — if not installed, build WILL fail
- Bottom nav MUST NOT overlap content — add `pb-16` to main content on mobile
- On desktop (`md:` and up), HIDDEN — don't conflict with top navbar
- The `ExpandableTabs` component uses `bg-background` and `bg-muted` CSS vars — make sure these are defined in `globals.css` or swap them for direct Tailwind classes

**✅ DO:**
```tsx
// Solen-customized ExpandableTabs bottom nav
<div className="fixed bottom-0 left-0 right-0 md:hidden z-50 px-4 pb-2">
  <ExpandableTabs
    tabs={tabs}
    activeColor="text-teal"
    className="bg-white/90 backdrop-blur-lg shadow-glass border-gray-100"
  />
</div>
```

**❌ DON'T:**
```tsx
// Don't use default shadcn colors — they won't match solen's design
<ExpandableTabs tabs={tabs} />  // Uses text-primary which may be wrong
```

**Verification:**
```bash
npm install usehooks-ts
npm run build
# Test on mobile viewport (375px) — tap each tab, verify spring animation
git add -A && git commit -m "phase 8: add ExpandableTabs bottom nav and sticky CTA"
```

---

### Phase 9 — Pull-to-Refresh + Micro-Animations

**Goal:** Add pull-to-refresh on homepage + polish with subtle micro-animations.

**Files:**
- [MODIFY] `components/HomePage.tsx` — Add pull-to-refresh and enhance animations
- [MODIFY] `tailwind.config.js` — Add any new animation keyframes needed

**Steps:**
1. Pull-to-refresh:
   - Custom hook `usePullToRefresh` that detects touch/drag on mobile
   - Shows a teal spinner at top when pulling, triggers data refetch on release
   - Only works at scroll position = 0 (top of page)
2. Micro-animations polish:
   - Category grid items: stagger fade-in (already exists, enhance timing)
   - Salon cards: gentle scale on hover (`hover:scale-[1.02]`)
   - Sections: fade-up on scroll into view (`whileInView` from framer-motion — already used)
   - CTA buttons: subtle press animation (`active:scale-95`)

**⚠️ BE CAREFUL:**
- Pull-to-refresh ONLY on touch devices — do NOT add on desktop (would conflict with browser scroll)
- Performance: use `will-change-transform` sparingly — only on actively animated elements
- Don't overdo animations — they should be barely noticeable (200-300ms max)
- Framer Motion is already installed — use it, don't add another animation library

**Verification:**
```bash
npm run build
git add -A && git commit -m "phase 9: add pull-to-refresh and micro-animation polish"
```

---

### Phase 10 — Update CLAUDE.md + UI_RULES.md

**Goal:** Update documentation to reflect all new components, color changes, and patterns.

**Files:**
- [MODIFY] `CLAUDE.md` — Update Section 3.3 colors, Section 3.2 directory tree
- [MODIFY] `UI_RULES.md` — Update color values, add new component guidelines

**Steps:**
1. Update CLAUDE.md:
   - Section 3.3: teal `#4ECDC4` → `#38B2AC`
   - Section 3.2 directory tree: add new files
   - Add Rule: "Use `<Skeleton>` for full-page loading, `<Spinner>` for inline/button loading"
   - Add Rule: "Use `<InteractiveHoverButton>` for all primary CTA buttons"
   - Add Rule: "Mobile bottom nav uses `<ExpandableTabs>` component"
2. Update UI_RULES.md:
   - Updated color palette
   - 21st.dev component guidelines
   - Skeleton loading rules

**Verification:**
```bash
git add -A && git commit -m "phase 10: update CLAUDE.md and UI_RULES.md with new components and colors"
```

---

### Phase 11 — Dashboard Animated Sidebar

**Goal:** Replace the existing `DashboardLayout.tsx` sidebar with the 21st.dev animated Sidebar (collapses to icons, mobile drawer).

**Files:**
- [NEW] `components/ui/sidebar.tsx` — 21st.dev animated sidebar component
- [MODIFY] `components/dashboard/DashboardLayout.tsx` — Replace current sidebar with animated version

**Steps:**
1. Create `sidebar.tsx` from 21st.dev source:
   - Already uses framer-motion (installed) and lucide-react (installed)
   - **Customize for solen:** Change `bg-neutral-100` → `bg-white`, `dark:bg-neutral-800` → `bg-dark`
2. Update `DashboardLayout.tsx`:
   - Import `{ Sidebar, SidebarBody, SidebarLink }` from the new component
   - Map existing dashboard nav items to `SidebarLink` format:
     ```tsx
     const links = [
       { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard /> },
       { label: "Buchungen", href: "/dashboard/bookings", icon: <Calendar /> },
       { label: "Services", href: "/dashboard/services", icon: <Scissors /> },
       { label: "Bewertungen", href: "/dashboard/reviews", icon: <Star /> },
       { label: "Nachrichten", href: "/dashboard/messages", icon: <Mail /> },
       { label: "Einstellungen", href: "/dashboard/settings", icon: <Settings /> },
     ];
     ```
   - Desktop: sidebar collapses to icons on hover-out (60px → 300px)
   - Mobile: hamburger menu → full-screen slide-in drawer

**⚠️ BE CAREFUL:**
- Dashboard has **18 sub-pages** — the sidebar must work on ALL of them
- Active page highlighting: determine active link from `usePathname()` and pass to `SidebarLink`
- The sidebar uses `motion.div` with width animation — test on slow devices (animation should be smooth)
- Mobile drawer must close on link click (navigate + close)
- Keep the bottom user profile link (salon owner avatar + name)

**✅ DO:**
```tsx
// Desktop: hover expands, hover-out collapses
<Sidebar open={open} setOpen={setOpen}>
  <SidebarBody className="bg-white border-r border-gray-100">
    {links.map(link => <SidebarLink key={link.href} link={link} />)}
  </SidebarBody>
</Sidebar>
```

**❌ DON'T:**
```tsx
// Don't remove the existing sidebar content — just replace the wrapper
// Don't hardcode width values that conflict with the motion animation
```

**Verification:**
```bash
npm run build
# Navigate to /dashboard and all 18 sub-pages — sidebar must render on each
# Test mobile: hamburger opens drawer, clicking link navigates + closes
git add -A && git commit -m "phase 11: add animated sidebar to salon dashboard"
```

---

### Phase 12 — DateRangePicker for Booking Calendar

**Goal:** Upgrade `BookingCalendar.tsx` with the premium 21st.dev DateRangePicker.

**New dependencies:**
```bash
npm install react-aria-components @internationalized/date class-variance-authority
```

**Files:**
- [NEW] `components/ui/button.tsx` — shadcn-style Button (react-aria-components based)
- [NEW] `components/ui/calendar.tsx` — Calendar with range selection support
- [NEW] `components/ui/datefield.tsx` — Date input segments
- [NEW] `components/ui/field.tsx` — Form field primitives (Label, FieldError, FieldGroup)
- [NEW] `components/ui/popover.tsx` — Animated popover
- [NEW] `components/ui/date-range-picker.tsx` — DateRangePicker composed from above
- [MODIFY] `components/BookingCalendar.tsx` — Integrate DateRangePicker for date selection

**Steps:**
1. Install dependencies: `npm install react-aria-components @internationalized/date class-variance-authority`
2. Create all 6 dependency components in `components/ui/` (from 21st.dev source)
3. **Customize for solen:**
   - Calendar selected date: `bg-teal text-white` instead of `bg-primary`
   - Range selection middle dates: `bg-teal/10 text-dark` instead of `bg-accent`
   - Button variant colors: use solen teal system
4. Integrate in `BookingCalendar.tsx`:
   - Replace the current date selection UI with `<JollyDatePicker>` or `<JollyDateRangePicker>`
   - Keep the existing time slot selection and booking logic

**⚠️ BE CAREFUL:**
- This adds 3 NEW npm packages and 6 new component files — the most complex phase
- `react-aria-components` is a large library — check bundle size impact
- The jolly-ui components use shadcn CSS variables (`--background`, `--foreground`, `--primary`, etc.) — these MUST be defined in `globals.css` or the components will have broken styles
- Don't break the existing booking flow — only replace the DATE SELECTION part, keep time slots and confirmation
- `BookingCalendar.tsx` currently uses `Spinner` for loading — keep that

**✅ DO:**
```tsx
// Only replace the date picker, keep everything else
<JollyDatePicker
  label="Datum wählen"
  onChange={(date) => setSelectedDate(date)}
/>
{/* Existing time slot grid stays */}
{slots.map(slot => <TimeSlotButton key={slot.id} ... />)}
```

**❌ DON'T:**
```tsx
// Don't rebuild the entire booking flow — only swap the date picker
// Don't remove the time slot selection
// Don't forget to define CSS variables
```

**Verification:**
```bash
npm install react-aria-components @internationalized/date class-variance-authority
npm run build
# Navigate to a salon page → click "Buchen" → verify date picker opens and works
git add -A && git commit -m "phase 12: add premium DateRangePicker to booking calendar"
```

---

### Phase 13 — Final Update CLAUDE.md

**Goal:** Final documentation update after all premium components are integrated.

**Files:**
- [MODIFY] `CLAUDE.md` — Add all new components, deps, and guidelines

**Verification:**
```bash
git add -A && git commit -m "phase 13: final CLAUDE.md update with all 21st.dev components"
git push origin main
```

---

## EXECUTION ORDER SUMMARY

| # | Phase | Depends On | Est. Time |
|---|---|---|---|
| 1 | Color Migration | — | 20 min |
| 2 | Hero + Search + InteractiveHoverButton | Phase 1 | 40 min |
| 3 | Salon Cards | Phase 1 | 45 min |
| 4 | Last-Minute | Phase 1 | 30 min |
| 5 | Social Proof + Trust | Phase 1 | 25 min |
| 6 | Skeleton Loading | Phase 1 | 30 min |
| 7 | Empty States | Phase 1 | 20 min |
| 8 | ExpandableTabs Bottom Nav + CTA | Phase 1, 2 | 45 min |
| 9 | Pull-to-Refresh | Phase 2, 3 | 25 min |
| 10 | Update CLAUDE.md (interim) | Phases 1-9 | 15 min |
| 11 | Dashboard Animated Sidebar | Phase 1 | 40 min |
| 12 | DateRangePicker for Booking | Phase 1 | 50 min |
| 13 | Final CLAUDE.md update | All phases | 10 min |

**Total estimated: ~6.5 hours of Claude Code time**

---

## 🧑 MANUAL PHASES

### Manual Phase A — Review & Test on Mobile

**After all code phases are deployed:**
1. Open `www.solen.ch/de` on your phone
2. Check: bottom nav appears, CTA appears after scrolling, content not cut off
3. Check: search bar works, categories still clickable
4. Check: salon cards show correctly in grid (desktop) and scroll (mobile)

### Manual Phase B — Provide Real Content (Optional, Do Anytime)

- Upload real salon photos to replace placeholder gradients
- Add real "Über uns" and "Kontakt" page content (currently `href="#"`)
- Set up Instagram account linked in footer

---

## NEW FILES SUMMARY

| File | Type | Phase | Purpose |
|---|---|---|---|
| `components/ui/SearchBar.tsx` | [NEW] | 2 | Hero search bar component |
| `components/ui/interactive-hover-button.tsx` | [NEW] | 2 | 21st.dev animated CTA button (teal expanding circle) |
| `components/ui/Skeleton.tsx` | [NEW] | 6 | Shimmer skeleton loading component |
| `components/ui/SocialProofStrip.tsx` | [NEW] | 5 | "Vertraut von Basler:innen" strip |
| `components/ui/TrustBadges.tsx` | [NEW] | 5 | Footer trust badges (Zahlung, Swiss, nDSG) |
| `components/ui/expandable-tabs.tsx` | [NEW] | 8 | 21st.dev animated tab bar (spring animation) |
| `components/ui/StickyMobileCTA.tsx` | [NEW] | 8 | Dynamic "X Salons verfügbar" floating CTA |
| `components/layout/BottomNav.tsx` | [NEW] | 8 | Mobile bottom nav using ExpandableTabs |
| `components/ui/sidebar.tsx` | [NEW] | 11 | 21st.dev animated collapsible sidebar |
| `components/ui/button.tsx` | [NEW] | 12 | react-aria Button (shadcn style) |
| `components/ui/calendar.tsx` | [NEW] | 12 | Calendar + RangeCalendar components |
| `components/ui/datefield.tsx` | [NEW] | 12 | Date input segments |
| `components/ui/field.tsx` | [NEW] | 12 | Form field primitives |
| `components/ui/popover.tsx` | [NEW] | 12 | Animated popover |
| `components/ui/date-range-picker.tsx` | [NEW] | 12 | DateRangePicker composed component |
| `public/illustrations/no-results.svg` | [NEW] | 7 | Line art for empty search results |
| `public/illustrations/coming-soon.svg` | [NEW] | 7 | Line art for coming-soon sections |

## MODIFIED FILES SUMMARY

| File | Phase | What Changes |
|---|---|---|
| `tailwind.config.js` | 1, 9 | Teal colors, remove index.html from content, new keyframes |
| `components/HomePage.tsx` | 2, 3, 4, 5, 8, 9 | Hero, InteractiveHoverButton CTAs, cards, social proof, CTA |
| `components/SalonCard.tsx` | 3 | Availability badge, distance, next slot (optional props) |
| `components/FilterBar.tsx` | 1 | Replace hardcoded `#4ECDC4` |
| `components/ui/EmptyState.tsx` | 7 | Add optional illustration prop |
| `components/layout/Footer.tsx` | 5 | Add TrustBadges component |
| `app/[locale]/layout.tsx` | 8 | Add BottomNav, mobile padding |
| `components/dashboard/DashboardLayout.tsx` | 11 | Replace sidebar with animated Sidebar |
| `components/BookingCalendar.tsx` | 12 | Integrate DateRangePicker for date selection |
| `CLAUDE.md` | 1, 10, 13 | Color values, directory tree, new rules, 21st.dev guidelines |
| `UI_RULES.md` | 10 | Updated color palette, new guidelines |

## NEW DEPENDENCIES

| Package | Phase | Why |
|---|---|---|
| `usehooks-ts` | 8 | `useOnClickOutside` for ExpandableTabs |
| `react-aria-components` | 12 | Accessible calendar/date primitives |
| `@internationalized/date` | 12 | Date handling for DateRangePicker |
| `class-variance-authority` | 12 | Button variants (shadcn pattern) |
