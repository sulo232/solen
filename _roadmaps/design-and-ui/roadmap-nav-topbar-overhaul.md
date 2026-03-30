# Nav Overhaul — Top Bar Redesign

> **Scope:** `components/layout/Header.tsx`, `public/logo.svg` (new placeholder asset)
> **Zone:** Global — present on every non-dashboard page. HIGHEST breakage risk on the platform.
> **Prerequisite:** Run AFTER `roadmap-nav-mobile-cleanup.md` removes BottomNav from `layout.tsx`. Do NOT run in parallel with that roadmap.
> **Accuracy required:** 🔴 High — every change here touches every public-facing page.

---

## Context & Decisions

| Item | Decision |
|---|---|
| Logo | Replace text `SOLEN` wordmark with `<img src="/logo.svg" />` placeholder (SVG to be swapped when brand asset is ready) |
| Top bar height | Increase from current compressed height → `min-h-[64px]` unscrolled, `min-h-[56px]` scrolled pill |
| Discovery link | Add as a standard nav link pointing to `/[locale]/discover` |
| PFP — logged in (desktop) | Show user avatar/icon → clicking opens an inline dropdown panel (NOT a page jump) |
| PFP — logged out (desktop) | Show user icon → clicking navigates to `/[locale]/auth/login` |
| Hamburger (mobile) | Single hamburger opens a panel containing ALL nav items including items previously only in BottomNav |
| Salon eintragen CTA | Add as a secondary ghost button in the hamburger panel on mobile, and keep as a top-bar button on desktop (existing) |

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Logo swap | 🟢 Low | Asset swap only — no logic change |
| P2 — Top bar height | 🟡 Medium | Height change may cause scroll-offset miscalculations on anchored sections |
| P3 — Discovery link | 🟢 Low | Add nav item — additive only |
| P4 — PFP → dropdown | 🔴 High | Replaces existing profile link behavior. Session state logic must remain untouched. |
| P5 — Mobile hamburger content | 🟡 Medium | Add migrated items (Favorites, Bookings, Last Minute, Salon Eintragen) into existing mobile menu |

---

## ⚠️ MANDATORY: Read Current State First

```bash
cat components/layout/Header.tsx
```

For each phase, read the specific lines indicated before editing.

---

## Phase 1 — Logo: Replace Text Wordmark with SVG Asset

### What to do
1. Place `public/logo.svg` — a placeholder SVG wordmark with the Solen logotype in `s-coral` + `s-ink`. Generate with `generate_image` if no asset exists yet.
2. Replace the text-based logo in the nav with an `<img>` or inline `<svg>`.

### Implementation

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)

Find the logo/wordmark section (search for `SOLEN` or `font-display` in the header). Replace with:

```tsx
{/* Logo — SVG asset */}
<Link href={`/${locale}`} className="flex items-center shrink-0" aria-label="Solen.ch – Zur Startseite">
  <img
    src="/logo.svg"
    alt="Solen.ch"
    className="h-8 w-auto dark:invert"
    width={96}
    height={32}
  />
</Link>
```

> **Dark mode:** `dark:invert` works if the SVG is pure black/ink on transparent. If the SVG uses `s-coral` color, remove `dark:invert` and the SVG must have explicit dark-mode paths.

### Verification
```bash
# Check the logo renders on homepage:
curl -s https://www.solen.ch/de/ | grep "logo.svg"
# Manual: open /de/ in browser and confirm logo renders in both light + dark mode
```

**Git commit:** `git add components/layout/Header.tsx public/logo.svg && git commit -m "NAV-P1: replace text wordmark with SVG logo asset"`

---

## Phase 2 — Top Bar Height: More Intentional, Less Compressed

### What to do
Increase the unscrolled nav bar to feel more substantial. Target: `64px min-height` on desktop, responsive to `56px` mobile.

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)

In the outer header wrapper (the `<header>` tag that wraps the nav pill), ensure:

```tsx
<header className="fixed top-0 left-0 right-0 z-[50] flex justify-center px-4 pt-2 pointer-events-none">
  <div className={cn(
    "flex items-center justify-between w-full pointer-events-auto",
    "rounded-full transition-[background,box-shadow,padding,max-width] duration-300 ease-out",
    scrolled
      ? "mt-2 max-w-3xl min-h-[56px] py-2 px-4 sm:px-6 dark:border-white/[0.06]"
      : "mt-3 max-w-5xl min-h-[64px] py-3 px-5 sm:px-8 bg-s-bg-base/50 dark:bg-s-dm-bg/50"
  )}
  style={scrolled ? {
    background: "rgba(255,255,255,.82)",
    backdropFilter: "blur(16px) saturate(1.3)",
    WebkitBackdropFilter: "blur(16px) saturate(1.3)",
    border: "1px solid rgba(255,255,255,.70)",
    boxShadow: "0 2px 6px rgba(26,18,9,.08), 0 8px 24px rgba(26,18,9,.06)"
  } : {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)"
  }}>
```

**Git commit:** `git add components/layout/Header.tsx && git commit -m "NAV-P2: increase nav bar min-height to 64px unscrolled, 56px scrolled"`

---

## Phase 3 — Add Discovery to Desktop Nav Links

### What to do
Add a `Discovery` (or `Entdecken` in German) link to the desktop nav items array.

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)

Find the nav links array (usually a `navItems` or `links` constant or inline JSX). Add the Discovery entry:

```tsx
// In the navItems/links array — add alongside existing items:
{ key: "discover", href: `/${locale}/discover`, icon: Compass }
```

> Use `Compass` from `lucide-react`. Do NOT use a custom SVG.

Also add the translation key. Check all 4 locale files:

#### [MODIFY] messages/de.json, messages/en.json, messages/fr.json, messages/it.json

```json
// In each locale file, add under the "nav" namespace:
"discover": "Entdecken"   // de
"discover": "Discover"    // en  
"discover": "Découvrir"   // fr
"discover": "Scoprire"    // it
```

> **Check first:** `grep -r '"discover"' messages/` — if the key already exists, skip adding it.

### Verification
```bash
npx tsc --noEmit
# Manual: open /de/ and confirm "Entdecken" is visible in the top nav on desktop
```

**Git commit:** `git add components/layout/Header.tsx messages/ && git commit -m "NAV-P3: add Discovery link to desktop nav"`

---

## Phase 4 — PFP: Logged-In Dropdown / Logged-Out Login Jump

### What to do

Replace the current profile icon behavior with:
- **Logged in (desktop):** Clicking PFP opens a dropdown panel below the icon (not a page redirect).
- **Logged out (desktop):** Clicking PFP icon redirects to `/[locale]/auth/login`.

### Implementation

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)

Add local state for dropdown:
```tsx
const [profileOpen, setProfileOpen] = useState(false);
const profileRef = useRef<HTMLDivElement>(null);

// Close on outside click:
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
      setProfileOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

Replace the existing profile button/link with:
```tsx
{/* Desktop profile button — hidden on mobile */}
<div className="hidden sm:block relative shrink-0" ref={profileRef}>
  {isLoggedIn ? (
    <>
      {/* Logged-in: button opens dropdown */}
      <button
        onClick={() => setProfileOpen(prev => !prev)}
        aria-label="Profil-Menü öffnen"
        aria-expanded={profileOpen}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-s-coral text-white",
          "active:scale-[0.98] transition-all duration-200",
          profileOpen && "ring-2 ring-s-coral/30"
        )}
        style={{ boxShadow: "0 2px 4px rgba(232,98,74,.30)" }}
      >
        <User className="w-4 h-4" />
      </button>

      {/* Dropdown panel */}
      {profileOpen && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-input z-[60] overflow-hidden"
          style={{
            background: "rgba(255,255,255,.96)",
            backdropFilter: "blur(16px) saturate(1.2)",
            WebkitBackdropFilter: "blur(16px) saturate(1.2)",
            border: "1px solid rgba(255,255,255,.70)",
            boxShadow: "0 4px 12px rgba(26,18,9,.10), 0 12px 32px rgba(26,18,9,.08)"
          }}
        >
          <nav className="py-1" role="menu">
            {[
              { label: t("nav.profile"), href: `/${locale}/profile`, icon: User },
              { label: t("nav.bookings"), href: `/${locale}/bookings`, icon: CalendarDays },
              { label: t("nav.favorites"), href: `/${locale}/favorites`, icon: Heart },
              { label: t("nav.messages"), href: `/${locale}/messages`, icon: MessageCircle },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setProfileOpen(false)}
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-heading font-medium text-s-ink/70 hover:text-s-ink hover:bg-s-ink/[0.03] transition-colors min-h-[40px]"
              >
                <Icon size={15} className="shrink-0 text-s-ink/40" />
                {label}
              </Link>
            ))}
            <div className="border-t border-s-ink/[0.06] my-1" />
            {/* Sign out */}
            <button
              onClick={() => { setProfileOpen(false); /* call signOut */ }}
              role="menuitem"
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-heading font-medium text-s-coral hover:bg-s-coral/[0.04] transition-colors min-h-[40px]"
            >
              <LogOut size={15} className="shrink-0" />
              {t("nav.signOut")}
            </button>
          </nav>
        </div>
      )}
    </>
  ) : (
    /* Logged-out: direct link to login */
    <Link
      href={`/${locale}/auth/login`}
      aria-label="Zum Login"
      className="flex items-center justify-center w-10 h-10 rounded-full bg-s-ink/[0.06] text-s-ink hover:bg-s-ink/[0.10] active:scale-[0.98] transition-all duration-200"
    >
      <User className="w-4 h-4" />
    </Link>
  )}
</div>
```

> **Required lucide imports to add:** `User`, `CalendarDays`, `Heart`, `MessageCircle`, `LogOut`, `Compass`
> **Do NOT remove:** Supabase `isLoggedIn` / session check — read it, preserve it exactly.
> **Sign-out:** Wire `signOut` to the existing supabase.auth.signOut() call already in the file.

### Translation keys needed
```json
// Check if these exist first via: grep -r '"signOut"\|"profile"\|"bookings"\|"favorites"\|"messages"' messages/
"nav.signOut": "Abmelden"     // de
"nav.profile": "Profil"       // de
"nav.bookings": "Buchungen"   // de
"nav.favorites": "Favoriten"  // de
"nav.messages": "Nachrichten" // de
// (and equivalents in en/fr/it)
```

### Verification
```bash
npm run build
# Manual:
# 1. Logged in → click PFP → dropdown appears with correct links
# 2. Clicking a dropdown link navigates correctly + closes dropdown
# 3. Clicking outside dropdown closes it
# 4. Logged out → click PFP icon → navigates to /de/auth/login
# 5. Dark mode: dropdown readable (warm surface, readable text)
```

**Git commit:** `git add components/layout/Header.tsx messages/ && git commit -m "NAV-P4: PFP → logged-in dropdown menu, logged-out → login redirect"`

---

## Phase 5 — Mobile Hamburger: Add Migrated Nav Items

> **Context:** The mobile BottomNav is being removed in `roadmap-nav-mobile-cleanup.md`. The items it contained (Favorites, Bookings, Last Minute, Discover) must be present in the hamburger panel so they remain accessible on mobile.

### What to do

Expand the existing mobile menu panel (hamburger/slide-down panel) to include ALL items that were in the BottomNav, plus the Salon Eintragen CTA at the bottom.

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)

In the existing mobile menu `motion.div` panel, ensure ALL of the following items are present:

```tsx
{/* Mobile nav items — complete set including migrated BottomNav items */}
{[
  // Existing top-bar items:
  { key: "home",       href: `/${locale}`,              icon: Home },
  { key: "discover",   href: `/${locale}/discover`,     icon: Compass },
  { key: "lastMinute", href: `/${locale}/last-minute`,  icon: Clock },
  // Migrated from BottomNav:
  { key: "bookings",   href: `/${locale}/bookings`,     icon: CalendarDays },
  { key: "favorites",  href: `/${locale}/favorites`,    icon: Heart },
  { key: "messages",   href: `/${locale}/messages`,     icon: MessageCircle },
].map(({ key, href, icon: Icon }) => {
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link key={key} href={href} onClick={() => setMobileOpen(false)}
      className={cn(
        "flex items-center gap-3 py-3 px-3 text-sm font-heading font-semibold transition-colors rounded-[10px] min-h-[44px]",
        active ? "text-s-coral bg-s-coral/[0.05]" : "text-s-ink/65 hover:text-s-ink hover:bg-s-ink/[0.03]"
      )}
    >
      <Icon size={18} className="shrink-0" strokeWidth={active ? 2.2 : 1.8} />
      {t(`nav.${key}`)}
    </Link>
  );
})}

{/* Divider */}
<div className="border-t border-s-ink/[0.06] my-2" />

{/* Logged in: profile shortcut */}
{isLoggedIn && (
  <Link href={`/${locale}/profile`} onClick={() => setMobileOpen(false)}
    className="flex items-center gap-3 py-3 px-3 text-sm font-heading font-semibold text-s-ink/65 hover:text-s-ink hover:bg-s-ink/[0.03] transition-colors rounded-[10px] min-h-[44px]"
  >
    <User size={18} className="shrink-0" strokeWidth={1.8} />
    {t("nav.profile")}
  </Link>
)}

{/* Salon Eintragen CTA */}
<div className="pt-2">
  <Link href={`/${locale}/partner`}
    onClick={() => setMobileOpen(false)}
    className="flex items-center justify-center gap-2 w-full py-3 rounded-pill bg-s-coral text-white text-sm font-heading font-bold transition-colors hover:brightness-[1.06] active:scale-[0.98] min-h-[44px]"
    style={{ boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}
  >
    <Building2 size={16} />
    {t("nav.registerSalon")}
  </Link>
</div>
```

> **Add `Building2` to lucide imports.**
> **Translation key:** `"nav.registerSalon": "Salon eintragen"` — check if it already exists.

### Verification
```bash
npm run build
# Manual (mobile viewport — use DevTools):
# 1. Tap hamburger → panel opens with ALL items visible
# 2. Each item navigates correctly + closes menu
# 3. "Salon eintragen" CTA is visible at bottom of panel with coral styling
# 4. Active item shows coral highlight for current page
# 5. Logged-out: "Profil" item hidden (or replaced with "Anmelden" link)
```

**Git commit:** `git add components/layout/Header.tsx && git commit -m "NAV-P5: mobile hamburger — add migrated BottomNav items + Salon CTA"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | SVG logo swap | ✅ Start here |
| P2 | Top bar height | After P1 (same file) |
| P3 | Discovery nav link | After P2 (same file) |
| P4 | PFP dropdown | After P3 (same file) |
| P5 | Hamburger expansion | After P4 (same file) |

> All phases touch `Header.tsx` — **strictly sequential**.
> Run `roadmap-nav-mobile-cleanup.md` FIRST or in a separate PR before executing P5.

---

## Final Compliance Check

```bash
npm run build
npx tsc --noEmit

# No scale animations on nav items:
grep -rn "hover:scale\|scale-105\|scale-110" components/layout/Header.tsx
# Expected: 0 results (active:scale-[0.98] is OK)

# No cold shadows in dropdown:
grep -rn "rgba(0,0,0" components/layout/Header.tsx
# Expected: 0 results

# Lucide icons only (no emoji):
grep -rn ">[A-Z🔥💇❤️]" components/layout/Header.tsx
# Expected: 0 results

# Manual checklist:
# ✅ Logo SVG renders in light + dark mode
# ✅ Nav bar height feels intentional at 64px (not cramped)
# ✅ "Entdecken" visible in desktop nav
# ✅ PFP → dropdown (logged in) | login redirect (logged out)
# ✅ Hamburger panel: all items including migrated BottomNav items
# ✅ "Salon eintragen" CTA in hamburger — coral pill style
# ✅ Dropdown closes on outside click
# ✅ All items have min-h-[44px] for touch targets
```
