# Roadmap: Mobile UX, Map, Navigation & GDPR

> **Claude Code Instance**: CC-4 (Mobile + Map + Navigation + Legal)
> **Scope**: Scroll-direction-aware header, bottom sheet multi-detent snapping, 44px touch targets, PWA offline page, price markers on map, map popup card matching, 5-photo salon grid, notification badge bounce, page transition crossfade, account deletion (GDPR), and ignoreBuildErrors removal.
> **Safe to run in parallel with**: CC-2 (Animations), CC-3 (SEO/i18n). Coordinate with CC-1 on salon page files — CC-4 should wait for CC-1 to finish salon extraction before modifying SalonHero photos.

---

## Pre-Flight: What Already Exists
- ✅ `components/layout/Header.tsx` — has scroll detection but NO hide-on-scroll-down
- ✅ `components/ui/BottomSheet.tsx` — exists but single detent only
- ✅ `components/MapView.tsx` — renders markers but NO price labels, NO matching SalonCard popups
- ✅ `public/manifest.json` — PWA manifest exists
- ✅ `next.config.mjs` — has `ignoreBuildErrors: true` (needs removal)
- ❌ Multi-detent bottom sheet — NOT implemented
- ❌ Scroll-direction header hide/show — NOT implemented
- ❌ Map price markers — NOT implemented
- ❌ PWA offline fallback — NOT implemented
- ❌ Account deletion — NOT implemented
- ❌ Page transition animation — NOT implemented
- ❌ Photo grid (5-photo layout) — NOT implemented

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | Build may surface 20-50 type errors | Fix ALL errors before committing. Run `npx tsc --noEmit` after. |
| Phase 2 | 🟡 MEDIUM | Header could flicker or hide permanently | Use `requestAnimationFrame` for smooth updates, 10px scroll threshold |
| Phase 3 | 🟡 MEDIUM | BottomSheet behavior if snap points conflict | Test with 1 child, 5 children, scrollable content |
| Phase 4 | 🟢 SAFE | Nothing — CSS padding adjustments only | — |
| Phase 5 | 🟢 SAFE | Nothing — new static file | — |
| Phase 6 | 🟡 MEDIUM | Map markers if custom component breaks Mapbox | Test with 0 markers, 1 marker, 100 markers |
| Phase 7 | 🟡 MEDIUM | Page transitions may cause App Router flash | Test with `key={pathname}` approach, verify no hydration mismatch |
| Phase 8 | 🟡 MEDIUM | Account deletion must cascade properly | Use server-side cascade, NOT client-side multi-delete |
| Phase 9 | 🟢 SAFE | Nothing — docs update | — |

---

## 🤖 CLAUDE CODE PHASES

### Phase 0: Pre-Flight Scan
1. Read `_rules/UI_RULES.md` — ALL of it.
2. Read `_rules/LESSONS_LEARNED.md` — avoid past mistakes.
3. Read `_rules/ROADMAP_RULES.md` — follow every rule.
4. Read `components/layout/Header.tsx` — understand current scroll behavior.
5. Read `components/ui/BottomSheet.tsx` — understand current implementation.
6. Read `components/MapView.tsx` — understand marker rendering.
7. Read `next.config.mjs` — locate `ignoreBuildErrors`.
8. Run: `npx tsc --noEmit 2>&1 | wc -l` — count existing type errors.
9. Read `app/[locale]/layout.tsx` — understand page wrapper structure.
10. Check `_tasks/INCOMPLETE_FEATURES.md` for anything related to mobile/map.

---

### Phase 1: Remove ignoreBuildErrors + Fix Surfaced Type Errors
**Goal**: Stop suppressing TypeScript errors so broken code can't ship.

#### [MODIFY] `next.config.mjs`
Remove `ignoreBuildErrors: true` from the config:

✅ DO:
```javascript
// Remove or set to false:
typescript: {
  // ignoreBuildErrors: true, ← DELETE THIS LINE
},
```

Then run `npx tsc --noEmit` and fix ALL surfaced errors. Common fix patterns:

**Pattern A: Missing `await` on params (most common in Next.js 15+)**
```tsx
// ERROR: Type 'Promise<{locale: string}>' is not assignable...
// FIX: Add await
const { locale } = await params; // ← ADD await
```

**Pattern B: Null/undefined access**
```tsx
// ERROR: Object is possibly 'null'
// FIX: Use optional chaining
salon.name → salon?.name // ← ADD ?
```

**Pattern C: Missing type imports**
```tsx
// ERROR: Cannot find name 'Metadata'
// FIX: Add import
import type { Metadata } from "next";
```

**Pattern D: Unused variables**
```tsx
// WARNING: 'x' is declared but never used
// FIX: Remove or prefix with _
const _unusedVar = ...; // ← Prefix with _
```

**Escalation rule**: If you encounter >30 type errors, fix the 15 most critical (build-blocking) ones and document the rest in `_tasks/TODO-type-fixes.md` with file paths and error messages.

❌ DON'T:
```javascript
// Don't just add @ts-ignore to suppress errors
// @ts-ignore // ❌ Hides real bugs
// Don't change the logic to fix types — only fix type annotations
```

> ⚠️ **BE CAREFUL**:
> - This is 🔴 HIGH RISK. Could surface 20-50 errors across the codebase.
> - Fix ONLY type errors — don't refactor logic or rename variables.
> - If an error is in a dashboard component, fix the type minimally (add `as any` ONLY as last resort, with a `// TODO: fix type` comment).
> - Per LESSONS_LEARNED.md: Windows builds may fail with chunk ID race conditions — this is pre-existing and safe on Vercel.
> - After fixing ALL errors, run `npm run build` to verify clean build.
> - If there are >50 errors, consider keeping `ignoreBuildErrors: true` with a comment explaining the plan.

**Verification:**
```bash
npx tsc --noEmit 2>&1 | wc -l
# Should be 0 or near-zero

npm run build
# Should pass without errors
```

**Git commit:** `git commit -m "fix: remove ignoreBuildErrors and fix all TypeScript errors"`

---

### Phase 2: Scroll-Direction-Aware Header Hide/Show
**Goal**: Header hides when scrolling down, reveals when scrolling up. Recovers ~64px on mobile.
**Zone**: Header is global — animation is allowed here.

#### [MODIFY] `components/layout/Header.tsx`

✅ DO:
```tsx
import { useState, useEffect, useRef } from "react";

// Inside Header component:
const [isHeaderVisible, setIsHeaderVisible] = useState(true);
const lastScrollYRef = useRef(0);
const scrollThreshold = 10; // Minimum scroll delta before triggering

useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollYRef.current;
    
    if (Math.abs(delta) < scrollThreshold) return; // Ignore tiny scrolls
    
    if (delta > 0 && currentScrollY > 80) {
      // Scrolling DOWN and past the header height
      setIsHeaderVisible(false);
    } else if (delta < 0) {
      // Scrolling UP
      setIsHeaderVisible(true);
    }
    
    lastScrollYRef.current = currentScrollY;
  };
  
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

// On the header wrapper:
<header
  className={`
    fixed top-0 left-0 right-0 z-50
    transition-transform duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]
    ${isHeaderVisible ? "translate-y-0" : "-translate-y-full"}
  `}
>
```

❌ DON'T:
```tsx
// Don't use transition-all (UI_RULES §21-A bans it)
className="transition-all" // ❌
// Don't use slow duration (250ms max for this interaction)
duration-500 // ❌ Banned
// Don't hide header immediately at scroll=0 — user should always see it at top
if (currentScrollY < 80) setIsHeaderVisible(true); // ← ADD THIS
// Don't use requestAnimationFrame wrapping unless needed for jank
```

> ⚠️ **BE CAREFUL**:
> - The header has scroll-dependent styling (transparent → solid with blur). The hide/show must NOT conflict with this.
> - On pages where the header is transparent (homepage hero), hiding it on scroll is fine. But revealing it should show the SOLID version, not transparent.
> - `{ passive: true }` on the scroll listener is critical for performance — prevents jank.
> - The 80px threshold prevents the header from hiding when user is at the very top.
> - Test on mobile — iOS Safari has momentum scrolling that can trigger erratic scroll events. The `scrollThreshold` (10px) prevents this.
> - If BottomSheet is open, header should NOT hide (it would be confusing). Consider checking a global state.
> - `SalonTabBar` is sticky at `top-[57px]` — if header hides, the tab bar should float to `top-0`. This requires dynamic top offset.

**Verification:**
```bash
npm run build
# Mobile: scroll down on homepage → header should smoothly slide up and hide
# Mobile: scroll up → header should smoothly slide down and reveal
# At top of page → header should always be visible
# Desktop → same behavior
```

**Git commit:** `git commit -m "feat: scroll-direction-aware header hide/show (saves 64px mobile)"`

---

### Phase 3: Bottom Sheet Multi-Detent Snapping
**Goal**: BottomSheet supports 3 snap points: peek (30%), half (60%), full (90%).
**Zone**: Used in Zone 1+2 (search, filters) and Zone 3 (booking). Zone 3 = NO animation on content inside, but the SHEET ITSELF can animate (it's a structural element).

#### [MODIFY] `components/ui/BottomSheet.tsx`

✅ DO:
```tsx
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialDetent?: "peek" | "half" | "full";
  snapPoints?: number[]; // e.g., [0.3, 0.6, 0.9] — percentage of viewport
}

const DEFAULT_SNAP_POINTS = [0.3, 0.6, 0.9];

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  initialDetent = "half",
  snapPoints = DEFAULT_SNAP_POINTS,
}: BottomSheetProps) {
  const sheetY = useMotionValue(0);
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  
  const snapToNearest = (velocity: number, currentY: number) => {
    const currentPercent = 1 - currentY / windowHeight;
    // Find nearest snap point, biased by velocity
    let target = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - currentPercent) < Math.abs(prev - currentPercent) ? curr : prev
    );
    
    // If flinging down fast, close
    if (velocity > 500 && currentPercent < snapPoints[0]) {
      onClose();
      return;
    }
    
    animate(sheetY, windowHeight * (1 - target), {
      type: "tween",
      duration: 0.3,
      ease: [0.32, 0.72, 0, 1], // iOS drawer curve per UI_RULES §21-B
    });
  };
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    snapToNearest(info.velocity.y, sheetY.get());
  };
  
  // ... render with motion.div drag="y" dragConstraints
}
```

❌ DON'T:
```tsx
// Don't use spring for sheet (UI_RULES §21-B: bottom sheet = tween 300ms)
transition={{ type: "spring" }} // ❌

// Don't allow dragging upward past 90% — sheet should max at 90vh
dragConstraints={{ top: windowHeight * 0.1 }} // Set this

// Don't forget the drag handle indicator bar
<div className="w-10 h-1 rounded-pill bg-s-ink/20 mx-auto mb-3" /> // Drag handle

// Don't use transition-all
className="transition-all" // ❌
```

> ⚠️ **BE CAREFUL**:
> - `typeof window !== "undefined"` guard is MANDATORY (SSR — LESSONS_LEARNED.md).
> - The sheet must support scrollable content inside it — `drag="y"` should NOT conflict with inner scrolling. Use `onDrag` to detect if user is scrolling content vs dragging sheet.
> - Per UI_RULES.md §21-B: Bottom sheet enter = 300ms `cubic-bezier(0.32,0.72,0,1)`. Exit = 200ms `[0.23,1,0.32,1]`.
> - All three close methods must work: swipe down past lowest snap, tap backdrop, X button (per UI_RULES §21-C).
> - Test with empty content, long scrollable content, and interactive content (buttons/inputs).

**Verification:**
```bash
npm run build
# Open search bottom sheet on mobile → should snap to half (60%)
# Drag up → should snap to full (90%)
# Drag down → should snap to peek (30%)
# Drag further down → should close
# Content inside should still be scrollable
```

**Git commit:** `git commit -m "feat: bottom sheet multi-detent snapping (peek/half/full)"`

---

### Phase 4: 44px Minimum Touch Targets
**Goal**: WCAG compliance — all interactive elements ≥44px touch area.

#### Audit and fix touch targets across components:

Run audit:
```bash
grep -rn "w-6\|w-7\|w-8\|h-6\|h-7\|h-8\|p-1[^.]" components/ --include="*.tsx" | grep -i "button\|click\|tap\|press" | head -20
```

Common fixes:

✅ DO:
```tsx
// Button that's visually 32px but has 44px touch area:
<button className="relative w-8 h-8 flex items-center justify-center min-w-[44px] min-h-[44px]">
  <X size={16} />
</button>

// Or use padding to expand:
<button className="p-3"> {/* p-3 = 12px padding, icon 20px = 44px total */}
  <Heart size={20} />
</button>
```

❌ DON'T:
```tsx
// Don't make icons visually 44px — expand the TOUCH area, not the icon
<Heart size={44} /> // ❌ Icon is too big

// Don't break visual layout by adding visible padding — use invisible expansion
className="p-4 bg-s-coral" // ❌ Makes button look oversized
// Instead:
className="p-3 -m-1" // Expand touch, pull margin back for visual alignment
```

Key components to check:
- `components/layout/Header.tsx` — menu button, search icon, login button
- `components/layout/BottomTabBar.tsx` — tab icons
- `components/SalonCard.tsx` — heart/favorite button
- `components/ui/Toast.tsx` — dismiss button
- `components/ReviewForm.tsx` — star rating buttons
- `components/BookingCalendar.tsx` — time slot buttons, navigation arrows

> ⚠️ **BE CAREFUL**:
> - Don't add `min-w-[44px]` to elements that are already ≥44px — measure first.
> - Don't break the visual grid/alignment — use negative margins to compensate for padding.
> - BookingCalendar is Zone 3 — NO visual changes except padding adjustments for touch targets.
> - This is a SWEEP across many files. Go file by file, commit after each batch.

**Verification:**
```bash
npm run build
# On mobile, tap every interactive element — nothing should feel too small
# Test heart button, close buttons, tab icons, time slots
```

**Git commit:** `git commit -m "a11y: enforce 44px minimum touch targets across all interactive elements"`

---

### Phase 5: PWA Offline Fallback Page
**Goal**: Show a branded page when user is offline instead of Chrome's dinosaur.

#### [NEW] `public/offline.html`
Static HTML file — no React, no JS framework. Must work completely offline.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline – solen.ch</title>
  <style>
    body {
      font-family: 'DM Sans', -apple-system, sans-serif;
      background: #FAF6EF;
      color: #1A1209;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      text-align: center;
    }
    .container { max-width: 360px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin: 0 0 8px; }
    p { font-size: 16px; color: rgba(26,18,9,.6); line-height: 1.6; margin: 0 0 24px; }
    .retry-btn {
      display: inline-block;
      background: #E8624A;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 99px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .retry-btn:hover { filter: brightness(1.06); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Du bist offline</h1>
    <p>Bitte überprüfe deine Internetverbindung und versuche es erneut.</p>
    <button class="retry-btn" onclick="window.location.reload()">Erneut versuchen</button>
  </div>
</body>
</html>
```

#### [MODIFY] Service worker (if exists) or `next.config.mjs`
If a service worker exists, register `offline.html` in its cache. If using `next-pwa` or similar, configure the offline fallback.

> ⚠️ **BE CAREFUL**:
> - This is a STATIC HTML file — no React, no i18n, no dynamic content. Keep it simple.
> - The emoji in the offline page is the ONLY exception to the "no emoji in UI" rule — it's a static HTML page, not a React component.
> - Don't use CDN fonts — the user is OFFLINE. Use system fonts as fallback.
> - Test by going to DevTools → Network tab → check "Offline" → navigate.

**Verification:**
```bash
# After deployment:
# 1. Visit solen.ch on mobile
# 2. Turn on airplane mode
# 3. Try to navigate — should see branded offline page, not Chrome dinosaur
```

**Git commit:** `git commit -m "feat: add branded PWA offline fallback page"`

---

### Phase 6: Map Price Markers
**Goal**: Show price labels on map pins (like Airbnb) instead of generic markers.

#### [MODIFY] `components/MapView.tsx`

Replace generic markers with custom price pill markers:

✅ DO:
```tsx
import { Marker, Popup } from "react-map-gl";

// Custom price marker component:
function PriceMarker({ salon, isActive, onClick }: { salon: SalonCard; isActive: boolean; onClick: () => void }) {
  const locale = useLocale();
  const price = salon.min_price ?? salon.services?.[0]?.price;
  
  return (
    <Marker latitude={salon.latitude} longitude={salon.longitude}>
      <button
        onClick={onClick}
        className={`
          px-2 py-1 rounded-pill text-xs font-medium whitespace-nowrap
          shadow-warm-sm hover:shadow-warm-md
          transition-[transform,box-shadow] duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]
          ${isActive
            ? "bg-s-ink text-white scale-110"
            : "bg-white text-s-ink hover:scale-105"
          }
        `}
      >
        {price ? `ab ${formatCurrency(price, locale)}` : "•"}
      </button>
    </Marker>
  );
}
```

When a marker is clicked, show a SalonCard-style popup:
```tsx
{activeMarker && (
  <Popup
    latitude={activeMarker.latitude}
    longitude={activeMarker.longitude}
    onClose={() => setActiveMarker(null)}
    closeButton={false}
    maxWidth="280px"
    offset={[0, -10]}
  >
    <div className="rounded-card overflow-hidden shadow-warm-md bg-white">
      {/* Mini SalonCard content */}
      <div className="relative aspect-[4/3]">
        <Image src={activeMarker.cover_photo_url} ... />
      </div>
      <div className="p-3">
        <h3 className="font-heading font-semibold text-sm text-s-ink truncate">{activeMarker.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <Star size={12} className="fill-s-coral text-s-coral" />
          <span className="data-text text-xs">{activeMarker.average_rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  </Popup>
)}
```

❌ DON'T:
```tsx
// Don't use generic Tailwind shadows
className="shadow-md" // ❌ Use shadow-warm-md

// Don't use transition-all
className="transition-all" // ❌ Use transition-[transform,box-shadow]

// Don't hardcode "CHF" — use formatCurrency
`CHF ${price}` // ❌
`ab ${formatCurrency(price, locale)}` // ✅
```

> ⚠️ **BE CAREFUL**:
> - MapView uses `react-map-gl` or Mapbox GL — verify the import pattern before modifying.
> - Custom markers must use `Marker` component from the map library, NOT DOM manipulation.
> - Performance: with 100+ markers, consider clustering. Don't render 100 custom React components simultaneously.
> - `formatCurrency` requires `locale` — import `useLocale` from `next-intl`.
> - If a salon has no price data, show a simple dot marker, NOT "ab CHF 0".
> - Active marker (clicked) should be visually distinct — `bg-s-ink text-white` with `scale-110`.

**Verification:**
```bash
npm run build
# Visit /en/search → map view
# Markers should show price labels like "ab CHF 45"
# Click a marker → popup should show mini salon card
# Active marker should turn dark
```

**Git commit:** `git commit -m "feat: add Airbnb-style price markers and salon popup cards to map"`

---

### Phase 7: Page Transition Crossfade
**Goal**: Smooth 200ms opacity crossfade between routes instead of white flash.
**Zone**: Global layout — animation allowed.

**CRITICAL**: `app/[locale]/layout.tsx` is a SERVER component (has `generateMetadata`). You CANNOT add `"use client"` to it. Instead, create a SEPARATE client wrapper component.

#### [NEW] `components/layout/PageTransition.tsx`
```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

#### [MODIFY] `app/[locale]/layout.tsx`
Wrap `{children}` with the new component (layout.tsx stays a SERVER component):
```tsx
import PageTransition from "@/components/layout/PageTransition";

// In the layout return:
<PageTransition>
  {children}
</PageTransition>
```

❌ DON'T:
```tsx
// Don't use slide animations for page transitions (too heavy)
initial={{ x: 100 }} // ❌ Slide-in feels heavy for page transitions

// Don't use duration > 200ms
transition={{ duration: 0.4 }} // ❌ Too slow — user perceives delay

// Don't animate layout with y offsets (causes scroll issues)
initial={{ y: 20 }} // ❌ Can conflict with scroll position
```

**IMPORTANT**: This approach may require the layout to be a client component. If `app/[locale]/layout.tsx` is currently a server component (which it likely is for `generateMetadata`), you'll need to:
1. Keep `layout.tsx` as a server component for metadata
2. Create a NEW `components/layout/PageTransition.tsx` client component
3. Wrap `{children}` in `<PageTransition>{children}</PageTransition>`

> ⚠️ **BE CAREFUL**:
> - `AnimatePresence mode="wait"` delays the new page until the exit animation completes. With 200ms, this is barely noticeable. But test it — if it feels slow, switch to `mode="sync"`.
> - The `key={pathname}` ensures framer-motion detects route changes. Without it, transitions won't trigger.
> - This must NOT interfere with scroll restoration (`next.config.mjs` has `scrollRestoration: true`).
> - Test with back/forward browser buttons — scroll position should restore correctly.
> - Per LESSONS_LEARNED.md Rule 27: Don't duplicate Header/BottomNav inside the transition wrapper.
> - If layout.tsx is a server component, DON'T make it `"use client"` — create a separate client wrapper.

**Verification:**
```bash
npm run build
# Navigate between pages — should see smooth 200ms opacity fade
# Back button should restore scroll position
# No white flash between routes
```

**Git commit:** `git commit -m "feat: add 200ms page transition crossfade via AnimatePresence"`

---

### Phase 8: Account Deletion (GDPR / nFADP Compliance)
**Goal**: Legal requirement — users must be able to delete their account and all personal data.
**Zone**: Zone 3 (account settings) — NO animation, NO glass, solid surfaces only.

#### [NEW] `app/api/account/delete/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  // Use getSession (NOT getUser!) per LESSONS_LEARNED Rule 25
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = session.user.id;
  
  // Cascade delete user data (order matters for FK constraints):
  // 1. Delete user's reviews
  // 2. Delete user's bookings
  // 3. Delete user's favorites
  // 4. Delete user's chat messages
  // 5. Delete user's profile
  // 6. Delete auth user via admin API
  
  const adminSupabase = createAdminSupabaseClient();
  
  try {
    await adminSupabase.from("reviews").delete().eq("user_id", userId);
    await adminSupabase.from("bookings").delete().eq("user_id", userId);
    await adminSupabase.from("favorites").delete().eq("user_id", userId);
    await adminSupabase.from("messages").delete().eq("sender_id", userId);
    await adminSupabase.from("profiles").delete().eq("id", userId);
    
    // Delete from auth.users (requires admin client)
    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/delete] Error:", err);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
```

#### [MODIFY] `components/ProfilePage.tsx`
Add "Delete Account" button in the settings section:

```tsx
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Danger zone section:
<div className="mt-8 pt-8 border-t border-s-ink/10">
  <h3 className="font-heading font-semibold text-lg text-s-error mb-2">
    {t("dangerZone")}
  </h3>
  <p className="text-sm text-s-ink/60 mb-4">
    {t("deleteAccountWarning")}
  </p>
  <button
    onClick={() => setShowDeleteConfirm(true)}
    className="px-4 py-2 rounded-btn border border-s-error text-s-error text-sm font-medium hover:bg-s-error-bg transition-colors duration-150"
  >
    {t("deleteAccount")}
  </button>
</div>

{/* Confirmation modal — Zone 3: NO animation, NO glass */}
{showDeleteConfirm && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-s-ink/40 px-4">
    <div className="bg-white rounded-card shadow-warm-lg w-full max-w-sm p-6">
      <h3 className="font-heading font-bold text-lg text-s-error mb-2">{t("confirmDelete")}</h3>
      <p className="text-sm text-s-ink/70 mb-6">{t("deleteIrreversible")}</p>
      <div className="flex gap-3">
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="flex-1 py-2 rounded-btn border border-s-ink/10 text-sm"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="flex-1 py-2 rounded-btn bg-s-error text-white text-sm font-medium disabled:opacity-50"
        >
          {isDeleting ? <Spinner size="sm" /> : t("deleteForever")}
        </button>
      </div>
    </div>
  </div>
)}
```

**i18n keys** (ALL 4 locales):
- `dangerZone`: "Gefahrenbereich" / "Danger zone" / "Zone de danger" / "Zona pericolosa"
- `deleteAccount`: "Konto löschen" / "Delete account" / "Supprimer le compte" / "Elimina account"
- `deleteAccountWarning`: "Wenn du dein Konto löschst, werden alle deine Daten unwiderruflich gelöscht." / ...
- `confirmDelete`: "Konto wirklich löschen?" / "Really delete account?" / ...
- `deleteIrreversible`: "Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Buchungen, Bewertungen und Favoriten werden gelöscht." / ...
- `deleteForever`: "Endgültig löschen" / "Delete forever" / ...

> ⚠️ **BE CAREFUL**:
> - **Zone 3 compliance**: NO animation on the confirmation modal. NO glass. Solid white with `shadow-warm-lg`.
> - The deletion MUST be cascading — foreign key constraints will block deletion if you don't delete child records first.
> - Use `createAdminSupabaseClient()` for the admin delete (requires service_role key).
> - Use `getSession()` NOT `getUser()` per LESSONS_LEARNED Rule 25.
> - After deletion, redirect to homepage and clear session: `router.push("/")` + sign out.
> - The API route must verify the user's identity before deleting — don't accept a user_id in the request body.
> - Per LESSONS_LEARNED.md: i18n keys in ALL 4 locale files.
> - Log the deletion event for audit trail BEFORE deleting the data.

**Verification:**
```bash
npm run build
# Create test account → fill some data → delete account
# Verify: all reviews, bookings, favorites are gone
# Verify: can't log in anymore
# Verify: no data remains in profiles table
curl -X DELETE http://localhost:3000/api/account/delete
# Should return 401 (not authenticated)
```

**Git commit:** `git commit -m "feat: GDPR account deletion flow (cascade delete + confirmation)"`

---

### Phase 9: Update CLAUDE.md + Final Verification

#### [MODIFY] `CLAUDE.md`
- Section 3.2: Add `app/api/account/delete/route.ts`, `public/offline.html`
- Section 11: Add note about GDPR compliance — account deletion is now implemented
- Document scroll-direction header pattern
- Document bottom sheet multi-detent pattern

#### Full Smoke Test:
```bash
# 1. Build passes (ignoreBuildErrors is now removed!)
npm run build

# 2. Type check — the REAL one now
npx tsc --noEmit 2>&1 | wc -l
# Must be 0

# 3. No dead components
grep -rn "PriceMarker\|PageTransition" app/ components/ --include="*.tsx" | grep "import" | wc -l
# Should be ≥1 per component

# 4. Banned tokens
grep -Ern "transition-all|shadow-sm[^a]|shadow-md[^i]|rounded-lg[^a]" components/layout/Header.tsx components/ui/BottomSheet.tsx components/MapView.tsx | grep -v "shadow-warm\|shadow-card\|//"
# Must return 0

# 5. i18n completeness
for key in deleteAccount dangerZone confirmDelete deleteForever; do
  grep -c "$key" messages/de.json messages/en.json messages/fr.json messages/it.json
done

# 6. Auth safety
grep -rn "auth.getUser()" app/api/account/ --include="*.ts"
# Must return 0 — use getSession only

# 7. Zone violations — no animation in Zone 3/4 components
grep -rn "motion\.\|animate=" components/ProfilePage.tsx app/api/account/ --include="*.tsx" | grep -v "//"
# Should return 0 (account deletion is Zone 3 — no animation)
```

> ⚠️ **BE CAREFUL**:
> - This is the FIRST build without `ignoreBuildErrors`. If it passes, all future commits are type-safe.
> - Feature is NOT complete until ALL checks pass.

**Git commit:** `git commit -m "docs: update CLAUDE.md with mobile UX, map, GDPR patterns"`

---

## 🧑 MANUAL PHASES

### Manual A: Apple Pay Domain Verification
1. Add `public/.well-known/apple-developer-merchantid-domain-association` file from Stripe Dashboard
2. Verify in Stripe Dashboard → Settings → Payment Methods → Apple Pay

### Manual B: Test Account Deletion on Staging
1. Create a test account on staging
2. Add some bookings, reviews, favorites
3. Go to Profile → Delete Account → Confirm
4. Verify all data is gone from Supabase dashboard
5. Verify can't log in anymore

### Manual C: Test Offline PWA
1. Install PWA on mobile
2. Go offline (airplane mode)
3. Open app → should show branded offline page
4. Go back online → app should resume

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 0 | 🤖 | Pre-flight scan | Nothing |
| Phase 1 | 🤖 | Remove ignoreBuildErrors + fix types | Nothing (DO FIRST) |
| Phase 2 | 🤖 | Header hide/show | Phase 1 (needs clean types) |
| Phase 3 | 🤖 | Bottom sheet multi-detent | Nothing |
| Phase 4 | 🤖 | 44px touch targets | Nothing |
| Phase 5 | 🤖 | PWA offline page | Nothing |
| Phase 6 | 🤖 | Map price markers | Nothing |
| Phase 7 | 🤖 | Page transition crossfade | Nothing |
| Phase 8 | 🤖 | Account deletion (GDPR) | Nothing |
| Phase 9 | 🤖 | CLAUDE.md + smoke test | All above |
| Manual A | 🧑 | Apple Pay domain | After CC-1 Phase 4 |
| Manual B | 🧑 | Test account deletion | Phase 8 |
| Manual C | 🧑 | Test offline PWA | Phase 5 |
