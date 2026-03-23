# 🔧 PROMPT 1 of 3: Rebrand Cleanup + Dark Mode + Merges + Security

> **Read `CLAUDE.md` (Section 12: Rules 15-19) and `UI_RULES.md` in full BEFORE starting.**
> **Tag current state first:** `git tag v2-design-coral -m "Pre-polish" && git push origin v2-design-coral`

---

## ⚠️ WCAG CONTRAST RULE

`text-s-coral` ONLY for large text (≥18px bold / ≥24px), icons, badges, buttons.
For body text on cream: use `text-s-coral-text` (`#7A2415`).

---

## 🚦 Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 1 (tokens) | 🟢 SAFE | Nothing | grep verify |
| 1.5 (links) | 🟡 MED | Nav if useLocale() missing | Import check |
| 1.7 (ChatWindow) | 🟡 MED | Chat flow | Keep old code commented |
| 1.9 (auth merge) | 🔴 HIGH | Registration | Keep signup as redirect |
| 1.10 (account merge) | 🔴 HIGH | Profile features | Port features FIRST |
| 2 (dark tokens) | 🟡 MED | Dark styling | Full grep |
| 3 (grays) | 🟡 MED | Visual | Follow mapping exactly |
| 4 (zero-coverage) | 🟢 SAFE | Nothing | — |
| 4.5 (security) | 🔴 HIGH | Auth | Test login after |

---

## 🤖 PHASE 1 — Rebrand Leftovers (1 hour)

### 1.1 — `bg-mesh-teal` (3 files)

#### [MODIFY] `app/[locale]/auth/login/page.tsx`
#### [MODIFY] `app/[locale]/auth/signup/page.tsx`
#### [MODIFY] `app/[locale]/auth/register/page.tsx`

```diff
-bg-mesh-teal
+bg-s-bg-base
```

Delete `bg-mesh-teal` definition from `globals.css` or `tailwind.config.js` if it exists.

### 1.2 — `shadow-teal-glow` (10 refs, 7 files)

Replace ALL `shadow-teal-glow` → `shadow-warm-sm`:

| File | Count |
|---|---|
| `components/FilterBar.tsx` | 1 |
| `components/ui/AnimatedButton.tsx` | 2 |
| `app/[locale]/warum-solen/page.tsx` | 2 (`shadow-teal/20` → `shadow-s-coral/20`) |
| `app/[locale]/last-minute/page.tsx` | 1 |
| `app/[locale]/auth/signup/page.tsx` | 2 |
| `app/[locale]/auth/register/page.tsx` | 2 |
| `app/[locale]/dashboard/page.tsx` | 1 |

### 1.3 — OLD `coral/` token (3 refs)

#### [MODIFY] `components/CategoryHero.tsx`
#### [MODIFY] `components/CategoryPage.tsx`

```diff
-from-coral/12 via-coral/4
+from-s-coral/12 via-s-coral/4
```

### 1.4 — `accent-teal` (2 refs)

#### [MODIFY] `components/BookingCalendar.tsx`

```diff
-accent-teal
+accent-s-coral
```

> ⚠️ **BE CAREFUL**: Per Rule 15, grep for ROOT WORD `teal` across the ENTIRE codebase. Check ALL prefixes: `bg-`, `text-`, `shadow-`, `from-`, `via-`, `accent-`, `border-`, `ring-`. Fix EVERYTHING before committing.

### 1.5 — Hardcoded `/de/` Links (11 refs)

Replace each with dynamic `/${locale}/...`:

| File | Line | Fix |
|---|---|---|
| `components/ui/CookieBanner.tsx` | L84 | Add `useLocale()`, use `/${locale}/datenschutz` |
| `components/ProfilePage.tsx` | L627 | `/${locale}/profile/referral` |
| `app/[locale]/auth/signup/page.tsx` | L295 | `/${locale}/auth/login` |
| `app/[locale]/auth/login/page.tsx` | L31 | `/${locale}/auth/register` |
| `app/[locale]/checkout/page.tsx` | L65, 246, 264, 281 | All → `/${locale}/...` |
| `app/[locale]/profile/referral/page.tsx` | L60 | `/${locale}/profile` |
| `app/[locale]/agb/page.tsx` | L42 | `/${locale}/datenschutz` |
| `app/not-found.tsx` | L20 | `/coiffeur` (root 404, no locale) |

✅ DO: `useLocale()` in components, `params.locale` in `app/[locale]/*` pages
❌ DON'T: Hardcode `"/de/"` anywhere

### 1.6 — Emoji Violations (16 refs, 7 files)

| File | Emoji | Fix |
|---|---|---|
| `BookingCalendar.tsx` L246 | 🎉 | `<PartyPopper size={48} className="text-s-coral" />` |
| `checkout/page.tsx` L261 | 🎉 | Same |
| `SalonCard.tsx` L229 | ⭐ | `<Star size={12} className="fill-s-amber text-s-amber" />` |
| `MapView.tsx` L125,130,170,175 | ⭐ | HTML `★` or text |
| `SolenScoreCard.tsx` L22-25 | ⭐🔵⚪🔘 | Lucide icons |
| `account/page.tsx` L320 | 👤 | `<User size={14} />` |
| `LanguageSwitcher.tsx` L15-18 | 🇩🇪🇬🇧🇫🇷🇮🇹 | Text: `DE`, `EN`, `FR`, `IT` |

### 1.7 — ChatWindow UX

#### [MODIFY] `components/ChatWindow.tsx`
#### [NEW] `components/ui/PriceOfferModal.tsx`

- `window.prompt()` ×2 (L262, L264) → `<PriceOfferModal>` using `<GlassModal>` with description + price inputs
- `alert()` ×3 (L179, L189, L210) → `toast.error("...")`
- Invisible translate buttons: add `group` class to message container div L324

> ⚠️ **BE CAREFUL**: PriceOfferModal must pass description + price to the same API call. Read existing flow first.

### 1.8 — Misc Fixes

| Issue | File | Fix |
|---|---|---|
| MapView `teal` tierOrder | `MapView.tsx` L92 | `teal: 2` → `coral: 2` |
| Partner wrong link | `partner/page.tsx` L40, L74 | `/${locale}/onboarding` → `/${locale}/onboarding/salon` |
| Footer year | `Footer.tsx` L144 | `© 2026` → `© {new Date().getFullYear()}` |
| `hover:bg-s-coral-dark` | `auth/signup`, `register`, `last-minute` | → `hover:bg-s-coral/90` |
| Barbershop icon | `HomePage.tsx` | Differentiate from Coiffeur (use `ScissorsLineDashed` or similar) |
| Duplicate API calls | `Header.tsx` + `BottomNav.tsx` | Both call `/api/profile`. Create shared auth context or lift state |
| SalonCard prefetch | `SalonCard.tsx` L85 | `useRef` guard so `router.prefetch(href)` fires once |
| Missing lazy | `ProfilePage.tsx` images | Add `loading="lazy"` |
| Hardcoded 24h | 5 refs in ProfilePage, TerminePage, BookingCalendar | Read salon's `free_cancel_hours` |
| FilterBar a11y | `FilterBar.tsx` L123 | `role="dialog"` + focus trap on dropdown |
| ProfilePage `as any` | `ProfilePage.tsx` L315 | Add `"it"` to locale type |
| Supabase re-creation | `BookingCalendar.tsx` L185, L217 | `useRef` for client, reuse across calls |
| SEO meta | Category pages | Add `generateMetadata()` with unique descriptions per category (see code block below) |

**SEO descriptions:**
```tsx
const seoDescriptions: Record<string, string> = {
  coiffeur: "Finde die besten Coiffeure in Basel. Buche online bei top-bewerteten Friseursalons.",
  barbershop: "Barbershops in Basel — Haarschnitt, Bart-Trimm und Grooming. Jetzt online buchen.",
  nails: "Nagelstudios in Basel — Maniküre, Pediküre, Gel-Nägel. Online-Termine buchen.",
  spa: "Spa & Wellness in Basel — Massagen, Gesichtsbehandlungen, Sauna. Jetzt buchen.",
  makeup: "Make-up Artists in Basel — Braut-Makeup, Abend-Look. Online buchen.",
  waxing: "Waxing Studios in Basel — Brazilian, Bein, Achsel. Termin online buchen.",
};
```

### 1.9 — Merge Auth Routes

#### [MODIFY] `app/[locale]/auth/register/page.tsx`
Add "E-Mail registrieren" as a third option alongside "Als Kunde" and "Als Salon". Copy any unique email-first flow from `signup/page.tsx` into this page.

#### [MODIFY] `app/[locale]/auth/signup/page.tsx`
Replace with redirect:
```tsx
import { redirect } from "next/navigation";
export default function SignupRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/auth/register`);
}
```

✅ DO: Keep file as redirect (old bookmarks work)
❌ DON'T: Delete the file

Grep verify: `grep -rn "auth/signup" components/ app/ --include="*.tsx"` — only redirect should remain.

### 1.10 — Merge Account into Profile

**Step 1:** Port MessagesTab + NotificationsTab from `account/page.tsx` to `ProfilePage.tsx`.

#### [NEW] `components/ui/CancelModal.tsx`
Extract shared CancelModal. Remove inline copies from:
- `ProfilePage.tsx`
- `TerminePage.tsx`
- `dashboard/bookings/page.tsx`
- `account/page.tsx`

#### [MODIFY] `app/[locale]/account/page.tsx`
Replace with redirect:
```tsx
import { redirect } from "next/navigation";
export default function AccountRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/profile`);
}
```

**Rename "Konto" → "Profil"** in Header.tsx (nav label) and BottomNav.tsx (tab label).

> ⚠️ **BE CAREFUL**: Port features BEFORE redirecting. Test: `/de/account` → redirects to `/de/profile` with all features.

### 1.11 — BottomNav Real Search

#### [MODIFY] `components/layout/BottomNav.tsx`

Change "Suche" tab from navigating to `/coiffeur` to:
```tsx
action: () => {
  if (pathname === `/${locale}`) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => document.getElementById("tour-search")?.focus(), 400);
  } else {
    router.push(`/${locale}/coiffeur`);
  }
}
```

### 1.12 — Verification (MANDATORY — Rule 16)

```bash
# Rebrand leftovers (ALL must be 0)
grep -Ern "bg-mesh-teal|shadow-teal-glow|shadow-teal/|accent-teal" components/ app/ --include="*.tsx"
grep -Ern "from-coral/|bg-coral/|text-coral/" components/ app/ --include="*.tsx" | grep -v "s-coral"

# Root word teal (Rule 15 — must be 0)
grep -rn "teal" components/ app/ --include="*.tsx" --include="*.css" | grep -v "node_modules\|s-coral\|// "

# Hardcoded /de/ (must be 0 except redirect files)
grep -rn '"/de/' components/ app/ --include="*.tsx" | grep -v "messages/\|redirect"

# Emoji (must be 0)
grep -Ern "🎉|⭐|👤|🔵|⚪|🔘|🇩🇪|🇬🇧|🇫🇷|🇮🇹" components/ app/ --include="*.tsx"

# window.prompt/alert (must be 0)
grep -rn "window\.prompt\|window\.alert\|[^.]alert(" components/ --include="*.tsx"

# Duplicate CancelModal (must be 1 file only)
grep -rn "function CancelModal" components/ app/ --include="*.tsx"

# "Konto" (must be 0)
grep -rn '"Konto"' components/ app/ --include="*.tsx"
```

```bash
npm run build
git add -A && git commit -m "prompt 1 phase 1: rebrand leftovers, links, emoji, ChatWindow, auth merge, profile merge, search, SEO" && git push
git tag polish-ph1 && git push origin polish-ph1
```

---

## 🤖 PHASE 2 — Dark Mode Foundation (45 min)

### 2.1 — Update UI_RULES.md

#### [MODIFY] `UI_RULES.md`

Change dark mode section: "Dark mode IS supported. Every `bg-white` needs `dark:bg-s-dm-surface`. Every `text-s-ink` needs `dark:text-s-dm-text`. Use warm `s-dm-*` tokens, NEVER `dark:bg-black`."

### 2.2 — Body background

#### [MODIFY] `app/globals.css`

Remove hardcoded `color: #1A1209` and `background: #FAF6EF` from body.

Add to `<body>` in root layout:
```tsx
<body className="bg-s-bg-base text-s-ink dark:bg-s-dm-bg dark:text-s-dm-text">
```

### 2.3 — Replace ALL old dark tokens (183 refs)

Global find-and-replace:

| Old | New |
|---|---|
| `dark:bg-dm-surface` | `dark:bg-s-dm-surface` |
| `dark:bg-dm-bg` | `dark:bg-s-dm-bg` |
| `dark:text-dm-text` | `dark:text-s-dm-text` |
| `dark:border-dm-border` | `dark:border-s-dm-border` |
| `dark:bg-dm-raised` | `dark:bg-s-dm-raised` |

### 2.4 — `dark:text-white` → `dark:text-s-dm-text`

EXCEPT on buttons with `bg-s-coral` (white text on coral is correct).

> ⚠️ **BE CAREFUL**: `dark:text-white` inside a `bg-s-coral` button = correct. Only change on body/card text.

```bash
grep -Ercn "dark:bg-dm-|dark:text-dm-|dark:border-dm-" components/ app/ --include="*.tsx"
# MUST return 0
npm run build
git add -A && git commit -m "prompt 1 phase 2: dark mode foundation" && git push
git tag polish-ph2 && git push origin polish-ph2
```

---

## 🤖 PHASE 3 — Cold Gray → Warm (2 hours)

### 3.1 — Add token

#### [MODIFY] `tailwind.config.js`

```diff
 's-sand': '#E8DFD0',
+'s-sand-dark': '#D4C9B4',
```

### 3.2 — Token mapping (use for ALL replacements)

| Cold Gray | Warm |
|---|---|
| `bg-gray-50` | `bg-s-bg-surface` |
| `bg-gray-50/50` | `bg-s-bg-surface/50` |
| `bg-gray-100` | `bg-s-bg-sunken` |
| `bg-gray-200` | `bg-s-sand` |
| `bg-gray-200/70` | `bg-s-sand/70` |
| `bg-gray-300` | `bg-s-sand-dark` |
| `border-gray-100` | `border-s-ink/5` |
| `border-gray-200` | `border-s-ink/10` |
| `text-gray-200` | `text-s-ink/20` |
| `text-gray-300` | `text-s-ink/30` |
| `text-gray-400` | `text-s-ink/40` |
| `text-gray-500` | `text-s-ink/50` |
| `text-gray-600` | `text-s-ink/60` |
| `text-gray-700` | `text-s-ink/70` |
| `hover:bg-gray-50` | `hover:bg-s-bg-surface` |
| `hover:bg-gray-100` | `hover:bg-s-bg-sunken` |

### 3.3 — Apply to EVERYTHING

- All components (~72 refs)
- `Skeleton.tsx` specifically: `bg-gray-200/70` → `bg-s-sand/70`
- Salon detail page `app/[locale]/salon/[slug]/page.tsx` (~20 refs)
- All 20 dashboard pages (~150 refs)

For each `bg-white`, also add `dark:bg-s-dm-surface` pair.

> ⚠️ **BE CAREFUL**: Some `bg-white` on buttons is intentional. Don't blindly replace — check context.

```bash
grep -Ercn "bg-gray-|border-gray-|text-gray-" components/ app/ --include="*.tsx" | wc -l
# Should be near 0
npm run build
git add -A && git commit -m "prompt 1 phase 3: cold gray → warm everywhere" && git push
git tag polish-ph3 && git push origin polish-ph3
```

---

## 🤖 PHASE 4 — Dark Mode Zero-Coverage Components (1.5 hours)

Add `dark:` classes to ALL components with zero dark mode coverage:

Toast, Breadcrumb, StickyMobileCTA, LastMinuteCard, WeatherBanner, ReviewCarousel, SearchAutocomplete, BookingCalendar, BookingSuccess, CompareBar, FilterBar, auth pages (3), not-found.tsx, global-error.tsx.

### 4.1 — Favicon

#### [NEW] `public/favicon.svg`

Coral circle `#E8624A` on transparent.

Add `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />` to root layout.

```bash
npm run build
git add -A && git commit -m "prompt 1 phase 4: dark mode zero-coverage + favicon" && git push
git tag polish-ph4 && git push origin polish-ph4
```

---

## 🤖 PHASE 4.5 — Security Fix (15 min)

#### [MODIFY] `middleware.ts`

```diff
-const { data: { session } } = await supabase.auth.getSession();
+const { data: { user } } = await supabase.auth.getUser();
```

Update all `session` refs below to `user`.

✅ `getUser()` verifies JWT server-side (secure)
❌ `getSession()` reads JWT without verification (insecure)

```bash
npm run build
git add -A && git commit -m "prompt 1 phase 4.5: security — getSession→getUser" && git push
git tag polish-ph4.5 && git push origin polish-ph4.5
```

---

**Prompt 1 total: ~5.5 hours. Commit after each phase. Run Prompt 2 next.**
