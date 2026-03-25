# Roadmap R26: Error Resilience — Error Boundaries, Loading States, Not-Found Pages

> **Scope:** Create `ErrorFallback` component, add `error.tsx` to all 11 route groups, add `loading.tsx` with V3 skeletons to all 5 critical routes, add `not-found.tsx` for custom 404 pages, add React error boundaries around dangerous client components.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — creating new component | New file, no existing code touched |
| Phase 2 | 🟢 SAFE | Nothing — creating new files only | `error.tsx` files are additive — Next.js picks them up automatically |
| Phase 3 | 🟢 SAFE | Nothing — creating new files only | `loading.tsx` files are additive |
| Phase 4 | 🟢 SAFE | Nothing — creating new file | `not-found.tsx` is additive |

---

## 🤖 Phase 1: Create ErrorFallback Component

> **Goal:** Build a reusable V3-styled error recovery component.

#### File
- `[NEW]` `components/ui/ErrorFallback.tsx`

#### ✅ DO
```tsx
"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md w-full text-center bg-white dark:bg-s-dm-surface rounded-card shadow-warm-md p-8"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-s-coral/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-s-coral" />
        </div>
        <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">
          Etwas ist schiefgelaufen
        </h2>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mb-6">
          {error.message || "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 active:scale-[0.98] transition-all shadow-warm-sm"
        >
          <RotateCcw size={14} />
          Nochmal versuchen
        </button>
        {error.digest && (
          <p className="mt-4 text-[10px] text-s-ink/20 dark:text-s-dm-text/20 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
```

#### ❌ DON'T
```tsx
// DON'T use generic Tailwind colors
className="bg-red-50 text-red-800"  // ← BAD: use V3 tokens

// DON'T show raw error.stack to users — only show error.message
<pre>{error.stack}</pre>  // ← BAD: security risk + ugly

// DON'T forget the error.digest for debugging
```

#### Verification
```bash
ls components/ui/ErrorFallback.tsx  # Must exist
npm run build
git add -A && git commit -m "R26 phase 1: create ErrorFallback component with V3 styling"
```

> ⚠️ **BE CAREFUL**:
> - Must be `"use client"` — error boundaries only work in client components
> - Don't import anything from the component that threw the error — keep dependencies minimal
> - The `reset()` function is provided by Next.js — it re-renders the route segment

---

## 🤖 Phase 2: Add `error.tsx` to All Route Groups

> **Goal:** Every route group has a styled error boundary that catches runtime crashes.

#### Files (all `[NEW]`)
- `app/[locale]/dashboard/error.tsx`
- `app/[locale]/salon/[slug]/error.tsx`
- `app/[locale]/profile/error.tsx`
- `app/[locale]/coiffeur/error.tsx`
- `app/[locale]/barbershop/error.tsx`
- `app/[locale]/nails/error.tsx`
- `app/[locale]/spa/error.tsx`
- `app/[locale]/makeup/error.tsx`
- `app/[locale]/waxing/error.tsx`
- `app/[locale]/search/error.tsx`
- `app/[locale]/discover/error.tsx`

#### Template (identical for all):
```tsx
"use client";

import ErrorFallback from "@/components/ui/ErrorFallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}
```

#### ✅ DO — verify all route directories exist first:
```bash
ls app/[locale]/dashboard/
ls app/[locale]/salon/[slug]/
ls app/[locale]/profile/
# etc — create error.tsx only in directories that exist
```

#### ❌ DON'T
```tsx
// DON'T forget "use client" — error.tsx MUST be a client component
// This is a Next.js requirement, not optional

// DON'T add error.tsx to API routes — API routes have their own try/catch
```

#### Verification
```bash
find app -name "error.tsx" -type f | wc -l
# Should show 11+ files (including the root one)
npm run build
git add -A && git commit -m "R26 phase 2: add error.tsx to 11 route groups"
```

> ⚠️ **BE CAREFUL**:
> - Check each route directory exists before creating the file — if `app/[locale]/discover/` doesn't exist, skip it
> - The root `app/error.tsx` already exists — don't overwrite it
> - These are additive files — they don't interfere with existing code

---

## 🤖 Phase 3: Add `loading.tsx` with V3 Skeletons

> **Goal:** Show contextual skeleton loading states during page transitions.

#### Files (all `[NEW]`)
- `app/[locale]/dashboard/loading.tsx` — Skeleton: stat cards grid (4 wide on desktop)
- `app/[locale]/salon/[slug]/loading.tsx` — Skeleton: hero image + service list
- `app/[locale]/profile/loading.tsx` — Skeleton: avatar circle + card list
- `app/[locale]/coiffeur/loading.tsx` — Skeleton: hero banner + salon card grid
- `app/[locale]/search/loading.tsx` — Skeleton: search bar + result card grid

#### ✅ DO
```tsx
import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero skeleton */}
      <Skeleton className="w-full h-48 rounded-card mb-6" />
      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### ❌ DON'T
```tsx
// DON'T use Spinner for loading.tsx — it's for inline loading only
import Spinner from "@/components/ui/Spinner";
export default function Loading() {
  return <div className="flex justify-center py-20"><Spinner /></div>  // ← BAD
}

// DON'T use animated shimmer if Skeleton already has it built-in — check first
// DON'T make loading.tsx a client component — it should be a server component (no "use client")
```

#### Verification
```bash
find app -name "loading.tsx" -type f | wc -l
# Should show 5+ files
npm run build
git add -A && git commit -m "R26 phase 3: add loading.tsx with V3 skeletons to 5 critical routes"
```

> ⚠️ **BE CAREFUL**:
> - `loading.tsx` does NOT need `"use client"` — it's a server component
> - Match skeleton shapes to actual page content (cards → rounded-card, avatars → rounded-full)
> - Don't add loading.tsx to every single sub-route — only top-level route groups
> - Verify `Skeleton` component exists first: `ls components/ui/Skeleton.tsx`

---

## 🤖 Phase 4: Custom Not-Found Page

> **Goal:** Replace the default Next.js 404 with a V3-styled not-found page.

#### File
- `[NEW]` `app/[locale]/not-found.tsx` (if not already exists)

#### ✅ DO
```tsx
import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="font-display text-7xl text-s-coral mb-4">404</p>
        <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
          Seite nicht gefunden
        </h2>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mb-6">
          Die Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/de"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 active:scale-[0.98] transition-all shadow-warm-sm"
        >
          <Search size={14} />
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R26 phase 4: custom V3-styled 404 not-found page"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `not-found.tsx` is a server component — no `"use client"`
> - Use the `font-display` class (Bebas Neue) for the large "404" — matches the brand
> - Link to `/de` or use `useLocale()` if available in server components — but `not-found.tsx` might not have access to params

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Create ErrorFallback component | Nothing |
| Phase 2 | 🤖 | Add error.tsx to 11 route groups | Phase 1 (imports ErrorFallback) |
| Phase 3 | 🤖 | Add loading.tsx to 5 routes | Nothing |
| Phase 4 | 🤖 | Add not-found.tsx | Nothing |
