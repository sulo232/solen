# V5 Zone 4 Roadmap — Header & Bottom Tab Bar
`_tasks/roadmap-v5-zone4-navigation.md`

> **Scope:** `components/layout/Header.tsx`, new `components/layout/BottomTabBar.tsx`
> **Target:** Glass bottom tab bar (4 tabs, mobile), fix header un-scrolled glass, remove mobile hamburger from mobile

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 4.1 | 🟢 SAFE | Nothing | New file, not imported yet |
| 4.2 | 🟡 MEDIUM | Mobile nav broken if burger hidden before tab bar renders | Import BottomTabBar at same time |
| 4.3 | 🟢 SAFE | Nothing | Header class change only |

---

## 🤖 Phase 4.1 — Build `BottomTabBar.tsx` (new component)

**File**: `[NEW] components/layout/BottomTabBar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Compass, Search, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "discover", href: "/discover", Icon: Compass },
  { key: "search",   href: "/search",   Icon: Search },
  { key: "saved",    href: "/account/saved", Icon: Bookmark },
  { key: "account",  href: "/profile",  Icon: User },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation") as any;

  // Hide on dashboard + auth pages
  const isHidden =
    pathname.includes("/dashboard") ||
    pathname.includes("/auth/") ||
    pathname.includes("/booking/");

  if (isHidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-frost border-t border-white/20 dark:border-s-dm-text/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("mobileNavigation") ?? "Navigation"}
    >
      <div className="flex items-stretch h-[58px]">
        {TABS.map(({ key, href, Icon }) => {
          const fullHref = `/${locale}${href}`;
          const isActive = pathname === fullHref || pathname.startsWith(fullHref + "/");
          return (
            <Link
              key={key}
              href={fullHref}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors duration-150",
                isActive ? "text-s-coral" : "text-s-ink/45 dark:text-s-dm-text/45 hover:text-s-ink/70"
              )}
              aria-label={t(key as any)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn("w-5 h-5 transition-transform duration-150", isActive && "scale-110")}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span className={cn("text-[10px] font-heading font-semibold tracking-[.04em] leading-none", isActive ? "text-s-coral" : "text-s-ink/40 dark:text-s-dm-text/40")}>
                {t(key as any)}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-s-coral" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

Then add translation keys to all 4 locale files:
- `messages/de.json` → `"navigation": { "mobileNavigation": "Navigation", "search": "Suchen", "saved": "Gespeichert" }`
- `messages/en.json` → `"navigation": { "mobileNavigation": "Navigation", "search": "Search", "saved": "Saved" }`
- `messages/fr.json` → `"navigation": { "mobileNavigation": "Navigation", "search": "Rechercher", "saved": "Enregistrés" }`
- `messages/it.json` → `"navigation": { "mobileNavigation": "Navigazione", "search": "Cerca", "saved": "Salvati" }`

> ⚠️ **BE CAREFUL**: 
> - The `position: fixed; bottom: 0` + `env(safe-area-inset-bottom)` is critical for iPhone home indicator. Missing this clips the tab bar.
> - The `md:hidden` class hides on desktop where the header nav takes over.
> - Add it to `components/index.ts` (barrel exports) ONLY after wiring to a page.

**Commit**: `git commit -m "phase 4.1: build BottomTabBar component with glass-frost and 4 tabs"`

---

## 🤖 Phase 4.2 — Wire BottomTabBar into the root layout

**File**: `[MODIFY] app/[locale]/layout.tsx`

Find where `<Header />` is rendered and add `<BottomTabBar />` below it:

```tsx
import BottomTabBar from "@/components/layout/BottomTabBar";

// In the layout JSX:
<Header locale={locale} />
<main className="pb-[calc(58px+env(safe-area-inset-bottom))] md:pb-0">
  {children}
</main>
<BottomTabBar />
```

The `pb-[calc(58px+...)]` on `<main>` prevents the tab bar from overlapping page content.

**File**: `[MODIFY] components/layout/Header.tsx`

Hide the hamburger button on mobile (it still exists for desktop safety):
```tsx
// BEFORE (line ~218):
<button
  onClick={() => setMobileOpen((v) => !v)}
  className="md:hidden p-1.5 ..."
>

// AFTER — add extra hidden class:
<button
  onClick={() => setMobileOpen((v) => !v)}
  className="hidden p-1.5 ..."   {/* hidden on ALL sizes — bottom bar handles mobile */}
>
```

Also remove the mobile menu `<AnimatePresence>` block from Header.tsx entirely (lines 298–429) since:
- Desktop uses the desktop nav
- Mobile uses BottomTabBar
- The hamburger is gone

> ⚠️ **BE CAREFUL**: The mobile menu block contains: city selector, language switcher, salon registration CTA. These must move somewhere before deleting. Options:
> - City selector → put in the main body above the hero (small pill)
> - Language switcher → already in footer
> - Salon CTA → keep in footer + add to BottomTabBar "Account" tab's profile screen
> DO NOT delete these features — move them first, then delete the hamburger menu block.

**Commit**: `git commit -m "phase 4.2: wire BottomTabBar to layout, remove mobile hamburger"`

---

## 🤖 Phase 4.3 — Fix header un-scrolled state glass

**File**: `[MODIFY] components/layout/Header.tsx` (lines 126–131)

BEFORE:
```tsx
scrolled
  ? "mt-2 max-w-4xl min-h-[52px] py-1.5 px-4 sm:px-6 glass-frost"
  : "mt-3 max-w-5xl min-h-[60px] py-2.5 px-5 sm:px-8 bg-white/85 backdrop-blur-sm border border-s-ink/[0.05] shadow-elevation-1"
```

AFTER:
```tsx
scrolled
  ? "mt-2 max-w-4xl min-h-[52px] py-1.5 px-4 sm:px-6 glass-frost shadow-warm-lg"
  : "mt-3 max-w-5xl min-h-[60px] py-2.5 px-5 sm:px-8 glass-frost shadow-warm-sm"
```

Both scrolled and un-scrolled now use the proper `.glass-frost` token with appropriate shadow levels.

✅ DO: `glass-frost` for both states, `shadow-warm-sm` at rest, `shadow-warm-lg` scrolled
❌ DON'T: `bg-white/85 backdrop-blur-sm` — this is manual glass not using the design token

**Commit**: `git commit -m "phase 4.3: header always uses glass-frost token (both scroll states)"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 4.1 | 🤖 | Build BottomTabBar | Nothing |
| Phase 4.2 | 🤖 | Wire to layout, remove hamburger | 4.1 |
| Phase 4.3 | 🤖 | Fix header glass | Nothing |

4.1 can run in parallel with anything. 4.2 depends on 4.1. 4.3 is always independent.
