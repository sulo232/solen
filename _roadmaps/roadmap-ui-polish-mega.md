# 🎨 Solen.ch — Mega UI Polish Roadmap (Post-Rebrand)

> **Every AI agent MUST read `CLAUDE.md` and `UI_RULES.md` before making ANY changes.**
> **Branch:** `main` (tag current state as `v2-design-coral` before starting)
> **Build check:** `npm run build` must pass before every commit. No exceptions.
> **Scope:** ~80+ files across components/, app/, and globals.css
> **Total:** 4 prompts, ~26 hours Claude Code + manual steps separately

---

## ⚠️ WCAG CONTRAST RULE (Inherited from rebrand)

`text-s-coral` ONLY for large text (≥18px bold / ≥24px), icons, badges, buttons.
For body text on cream: use `text-s-coral-text` (`#7A2415`).

---

## 📋 PROMPT 1: Rebrand Leftovers + Dark Mode Foundation (~7 hours)

### Phase 1 — Fix Rebrand Leftovers (1 hour) 🔴

These are tokens the rebrand missed. MUST be fixed first.

#### 1.1 — `bg-mesh-teal` (3 files)

| File | Line | Fix |
|---|---|---|
| `app/[locale]/auth/login/page.tsx` | L5 | `bg-mesh-teal` → `bg-s-bg-base` |
| `app/[locale]/auth/signup/page.tsx` | L124 | `bg-mesh-teal` → `bg-s-bg-base` |
| `app/[locale]/auth/register/page.tsx` | L410 | `bg-mesh-teal` → `bg-s-bg-base` |

Then DELETE `bg-mesh-teal` from tailwind.config.js (if it exists as a utility) or globals.css.

#### 1.2 — `shadow-teal-glow` (10 refs, 7 files)

Replace ALL `shadow-teal-glow` → `shadow-warm-sm`:

| File | Count |
|---|---|
| `components/FilterBar.tsx` | 1 (pillActive class) |
| `components/ui/AnimatedButton.tsx` | 2 |
| `app/[locale]/warum-solen/page.tsx` | 2 (`shadow-teal/20` → `shadow-s-coral/20`) |
| `app/[locale]/last-minute/page.tsx` | 1 |
| `app/[locale]/auth/signup/page.tsx` | 2 |
| `app/[locale]/auth/register/page.tsx` | 2 |
| `app/[locale]/dashboard/page.tsx` | 1 |

#### 1.3 — OLD `coral/` token (not `s-coral`, 3 refs)

| File | Line | Fix |
|---|---|---|
| `components/CategoryHero.tsx` | L24 | `from-coral/12 via-coral/4` → `from-s-coral/12 via-s-coral/4` |
| `components/CategoryPage.tsx` | L34 | `from-coral/8` → `from-s-coral/8` |
| `components/CategoryPage.tsx` | L36 | `from-coral/10` → `from-s-coral/10` |

#### 1.4 — `accent-teal` on checkboxes (2 refs)

| File | Lines | Fix |
|---|---|---|
| `components/BookingCalendar.tsx` | L357, L368 | `accent-teal` → `accent-s-coral` |

#### 1.5 — Hardcoded `/de/` Links (8+ refs, 7+ files)

These break for EN/FR/IT users. Replace each with `/${locale}/...`:

| File | Line | Current | Fix |
|---|---|---|---|
| `components/ui/CookieBanner.tsx` | L84 | `href="/de/datenschutz"` | `href={\`/${locale}/datenschutz\`}` — add `useLocale()` import |
| `components/ProfilePage.tsx` | L627 | `href="/de/profile/referral"` | `href={\`/${locale}/profile/referral\`}` |
| `app/[locale]/auth/signup/page.tsx` | L295 | `href="/de/auth/login"` | `href={\`/${locale}/auth/login\`}` — get locale from params |
| `app/[locale]/auth/login/page.tsx` | L31 | `href="/de/auth/signup"` | `href={\`/${locale}/auth/register\`}` (point to register, not signup — see 1.9) |
| `app/[locale]/checkout/page.tsx` | L65 | `return_url:.../${lang}/checkout/...` | Use `${locale}` from `useLocale()` hook |
| `app/[locale]/checkout/page.tsx` | L246 | `href="/de"` | `href={\`/${locale}\`}` |
| `app/[locale]/checkout/page.tsx` | L264 | `href="/de/profile"` | `href={\`/${locale}/profile\`}` |
| `app/[locale]/checkout/page.tsx` | L281 | `href="/de"` | `href={\`/${locale}\`}` |
| `app/[locale]/profile/referral/page.tsx` | L60 | `href="/de/profile"` | `href={\`/${locale}/profile\`}` |
| `app/[locale]/agb/page.tsx` | L42 | `href="/de/datenschutz"` | `href={\`/${locale}/datenschutz\`}` |
| `app/not-found.tsx` | L20 | `href="/de/coiffeur"` | `href="/coiffeur"` (root 404, no locale context) |

#### 1.6 — Emoji Violations (12+ refs, 6+ files)

UI_RULES says "lucide-react only, no emoji." Replace all:

| File | Line | Emoji | Fix |
|---|---|---|---|
| `BookingCalendar.tsx` | L246 | 🎉 | `<PartyPopper size={48} className="text-s-coral" />` from lucide |
| `checkout/page.tsx` | L261 | 🎉 | Same as above |
| `SalonCard.tsx` | L229 | ⭐ | `<Star size={12} className="fill-s-amber text-s-amber" />` |
| `MapView.tsx` | L125, 130, 170, 175 | ⭐ | Replace with text or SVG star in HTML string |
| `SolenScoreCard.tsx` | L22-25 | ⭐🔵⚪🔘 | Replace with lucide icons: `<Star />`, `<CheckCircle />`, `<Circle />`, `<Dot />` |
| `account/page.tsx` | L320 | 👤 | `<User size={14} />` from lucide |
| `LanguageSwitcher.tsx` | L15-18 | 🇩🇪🇬🇧🇫🇷🇮🇹 | Replace with text labels: `DE`, `EN`, `FR`, `IT` |

#### 1.7 — ChatWindow UX Fixes (5 refs)

| Issue | Line | Fix |
|---|---|---|
| `window.prompt()` ×2 | L262, 264 | Replace with a proper `<PriceOfferModal>` component (form with description + price fields inside a `<GlassModal>`) |
| `alert()` ×3 | L179, 189, 210 | Replace with toast notifications: `toast.error("Datei zu gross (max 10MB)")` |
| Translate buttons invisible | L379 | Parent `<div>` at L324 missing `group` class — add `className="group ..."` |

#### 1.8 — Misc Audit Fixes

| Issue | File | Fix |
|---|---|---|
| MapView `teal` tierOrder | `MapView.tsx` L92 | `teal: 2` → `coral: 2` |
| Partner page wrong link | `partner/page.tsx` L40, L74 | `/${locale}/onboarding` → `/${locale}/onboarding/salon` |
| Footer year hardcoded | `Footer.tsx` L144 | `© 2026` → `© {new Date().getFullYear()}` |
| `hover:bg-s-coral-dark` (nonexistent) | `auth/signup`, `auth/register`, `last-minute` | → `hover:bg-s-coral-hover` or `hover:bg-s-coral/90` |
| Barbershop same icon as Coiffeur | `HomePage.tsx` | Change Barbershop icon to differentiate from Coiffeur |
| Redundant API calls | `Header.tsx` L50-58 + `BottomNav.tsx` L22-33 | Both call `/api/profile` on mount. Create shared auth context or lift state to layout |
| SalonCard repeated prefetch | `SalonCard.tsx` L85 | `router.prefetch(href)` fires on every hover. Add `useRef` guard to call once |
| Missing `loading="lazy"` | `ProfilePage.tsx` avatar images | Add `loading="lazy"` to non-critical images |
| Hardcoded 24h cancellation | 5 files | Read from salon's `free_cancel_hours` field instead of hardcoding "24h" |
| FilterBar a11y | `FilterBar.tsx` L123 | Add `role="dialog"` and focus trap to price dropdown |
| ProfilePage `as any` bypass | `ProfilePage.tsx` L315 | Fix type to include `"it"` in locale union |
| Supabase client re-creation | `BookingCalendar.tsx` L185, L217 | Create once via `useRef`, reuse across calls |

#### 1.9 — Merge Auth Routes (signup → register)

`/auth/register` = customer vs salon choice UI (the good one).
`/auth/signup` = direct email form (redundant).

**Steps:**
1. Copy any unique functionality from `signup/page.tsx` into `register/page.tsx` (if signup has email-first flow that register doesn't, add it as a tab/option)
2. In `register/page.tsx`, add "E-Mail registrieren" as a third option alongside "Als Kunde" and "Als Salon"
3. Create `app/[locale]/auth/signup/page.tsx` as a REDIRECT:
   ```tsx
   import { redirect } from "next/navigation";
   export default function SignupRedirect({ params }: { params: { locale: string } }) {
     redirect(`/${params.locale}/auth/register`);
   }
   ```
4. Update ALL links pointing to `/auth/signup` → `/auth/register`
5. grep verify: `grep -rn "auth/signup" components/ app/ --include="*.tsx"` — only the redirect file should remain

> ⚠️ **BE CAREFUL**: Do NOT delete signup/page.tsx — redirect it. Old bookmarks/links must still work.
> Test: visit `/de/auth/signup` → must redirect to `/de/auth/register`.

#### 1.10 — Merge Account into Profile + Redirect

`/profile` (ProfilePage.tsx, 662L) = the keeper (has StampCard, RecentlyViewed, SolenExclusiveBadge).
`/account` (account/page.tsx, 577L) = redundant, gets redirected.

**Steps:**
1. Check if `/account` has any feature NOT in `/profile`:
   - Account has: BookingsTab, FavoritesTab, MessagesTab, ProfileTab, NotificationsTab
   - Profile has: Bookings, Favorites, Settings, StampCard, Referral, RecentlyViewed
   - **Missing from Profile: MessagesTab, NotificationsTab** → port these to ProfilePage
2. Extract `CancelModal` from ProfilePage.tsx into `components/ui/CancelModal.tsx` (shared)
3. Remove duplicate `CancelModal` from: `TerminePage.tsx`, `account/page.tsx`, `dashboard/bookings/page.tsx` → import shared version
4. Create `app/[locale]/account/page.tsx` as a REDIRECT:
   ```tsx
   import { redirect } from "next/navigation";
   export default function AccountRedirect({ params }: { params: { locale: string } }) {
     redirect(`/${params.locale}/profile`);
   }
   ```
5. Rename "Konto" → "Profil" in:
   - `Header.tsx` nav item label
   - `BottomNav.tsx` tab label
   - Any other reference
6. grep verify: `grep -rn "Konto\|/account" components/ app/ --include="*.tsx"` — only redirect + maybe some German strings

> ⚠️ **BE CAREFUL**: Port MessagesTab and NotificationsTab BEFORE redirecting. Don't lose features.

#### 1.11 — SEO Meta Descriptions per Category

Add unique `<meta>` descriptions in each category page. In `CategoryPage.tsx` or the page file:

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

Add to the page's `<Head>` or `generateMetadata()`.

#### 1.12 — BottomNav Real Search

Change "Suche" tab from `/coiffeur` to opening the SearchBar:

In `BottomNav.tsx`:
- Replace the `/coiffeur` href for the search tab with an `onClick` handler
- On click: scroll to top + focus the SearchBar input (use `document.getElementById("tour-search")?.focus()`)
- OR: navigate to `/${locale}/coiffeur` but with `?search=true` query param that auto-focuses the search bar

#### 1.13 — Verification

```bash
# Rebrand leftovers
grep -Ern "bg-mesh-teal|shadow-teal-glow|shadow-teal/|accent-teal" components/ app/ --include="*.tsx"
grep -Ern "from-coral/|bg-coral/|text-coral/" components/ app/ --include="*.tsx" | grep -v "s-coral"
# Hardcoded /de/ links
grep -rn '"/de/' components/ app/ --include="*.tsx" | grep -v "messages/" | grep -v "_tasks/"
# Emoji
grep -Ern "🎉|⭐|👤|🔵|⚪|🔘|🇩🇪|🇬🇧|🇫🇷|🇮🇹" components/ app/ --include="*.tsx"
# window.prompt/alert
grep -rn "window\.prompt\|window\.alert\|alert(" components/ --include="*.tsx" | grep -v "//"
# Duplicate CancelModal
grep -rn "function CancelModal" components/ app/ --include="*.tsx"
# Should be in 1 file only: components/ui/CancelModal.tsx
# Auth signup redirect
grep -rn "auth/signup" components/ app/ --include="*.tsx" | grep -v "redirect"
# Account redirect
grep -rn '"/account\|/account"' components/ app/ --include="*.tsx" | grep -v "redirect"
# "Konto" → should be "Profil"
grep -rn '"Konto"' components/ app/ --include="*.tsx"
# ALL must return 0 (or expected redirect-only results)
```

```bash
npm run build
git add -A && git commit -m "phase 1: fix rebrand leftovers, hardcoded links, emoji, ChatWindow UX, merge auth+profile, SEO meta" && git push
git tag polish-ph1 && git push origin polish-ph1
```

---

### Phase 2 — Dark Mode Foundation (45 min) 🔴

#### 2.1 — Update UI_RULES.md

Change the dark mode section from "light-only" to "dark mode supported":
```markdown
## Dark Mode
- Dark mode IS supported via `ThemeToggle` in Header
- `darkMode: 'class'` in Tailwind config
- Every `bg-white` MUST have a `dark:bg-s-dm-surface` pair
- Every `text-s-ink` MUST have a `dark:text-s-dm-text` pair
- Use warm dark tokens (s-dm-*), NEVER pure `dark:bg-black` or `dark:bg-gray-900`
```

#### 2.2 — Fix body background

In `app/globals.css`, remove hardcoded body colors:
```css
/* BEFORE */
body {
  font-family: "DM Sans", sans-serif;
  color: #1A1209;
  background: #FAF6EF;
}

/* AFTER */
body {
  font-family: "DM Sans", sans-serif;
}
```

In root layout `<body>` tag, add:
```tsx
<body className="bg-s-bg-base text-s-ink dark:bg-s-dm-bg dark:text-s-dm-text">
```

#### 2.3 — Replace ALL old dark tokens (183 refs)

Global find-and-replace across ALL `.tsx` files:

| Old Token | New Token | Expected Count |
|---|---|---|
| `dark:bg-dm-surface` | `dark:bg-s-dm-surface` | ~40 |
| `dark:bg-dm-bg` | `dark:bg-s-dm-bg` | ~20 |
| `dark:text-dm-text` | `dark:text-s-dm-text` | ~80 |
| `dark:border-dm-border` | `dark:border-s-dm-border` | ~15 |
| `dark:bg-dm-raised` | `dark:bg-s-dm-raised` | ~10 |

#### 2.4 — Replace `dark:text-white` with warm off-white

`dark:text-white` → `dark:text-s-dm-text` EVERYWHERE except:
- Inside buttons with `bg-s-coral` (white text on coral button is correct)
- Badge text that needs pure contrast

```bash
npm run build
git add -A && git commit -m "phase 2: dark mode foundation — UI_RULES updated, body bg, 183 old tokens, warm text" && git push
git tag polish-ph2 && git push origin polish-ph2
```

---

### Phase 3 — Cold Gray → Warm Replacement (2 hours) 🔴

72 refs in components + 150+ in dashboard. Replace systematically:

#### 3.1 — Token Mapping

| Cold Gray | Warm Replacement | Usage |
|---|---|---|
| `bg-gray-50` | `bg-s-bg-surface` | Section backgrounds, hover states |
| `bg-gray-50/50` | `bg-s-bg-surface/50` | Alternating homepage sections |
| `bg-gray-100` | `bg-s-bg-sunken` | Avatar placeholders, info cards |
| `bg-gray-200` | `bg-s-sand` | Skeleton loading, input borders |
| `bg-gray-200/70` | `bg-s-sand/70` | Skeleton.tsx specifically |
| `bg-gray-300` | `bg-s-sand-dark` (define as `#D4C9B4`) | Inactive indicators |
| `border-gray-100` | `border-s-ink/5` | Cards, dividers |
| `border-gray-200` | `border-s-ink/10` | Inputs, buttons |
| `text-gray-200` | `text-s-ink/20` | Star rating empty |
| `text-gray-*` (other) | `text-s-ink/*` equivalent | Various text |
| `hover:bg-gray-50` | `hover:bg-s-bg-surface` | Hover states |
| `hover:bg-gray-100` | `hover:bg-s-bg-sunken` | Hover states |

> ⚠️ `bg-s-sand-dark` may not exist yet. Add to `tailwind.config.js`:
> ```js
> 's-sand': { DEFAULT: '#E8DFD0', dark: '#D4C9B4' }
> ```

#### 3.2 — Components (72 refs)

Fix ALL files in `components/` using the mapping above.

#### 3.3 — Salon Detail Page (20+ gray refs)

`app/[locale]/salon/[slug]/page.tsx` — fix ALL gray refs per mapping.

#### 3.4 — Dashboard Pages (150+ gray refs across 20 pages)

ALL dashboard pages: replace `bg-gray-*` → warm + add `dark:` variants.

```bash
grep -Ercn "bg-gray-|border-gray-|text-gray-" components/ app/ --include="*.tsx" | wc -l
# Should be near 0
npm run build
git add -A && git commit -m "phase 3: cold gray → warm across all components + dashboard" && git push
git tag polish-ph3 && git push origin polish-ph3
```

---

### Phase 4 — Dark Mode for Zero-Coverage Components (1.5 hours) 🟡

Add dark mode to ALL these components that have ZERO `dark:` classes:

| Component | Key Changes |
|---|---|
| `Toast.tsx` | `bg-white` → + `dark:bg-s-dm-surface` |
| `Breadcrumb.tsx` | Add `dark:text-s-dm-text/60` |
| `StickyMobileCTA.tsx` | `bg-white` → + `dark:bg-s-dm-surface` |
| `LastMinuteCard.tsx` | Card bg, text, border dark variants |
| `WeatherBanner.tsx` | Card bg, text, icon dark variants |
| `ReviewCarousel.tsx` | Card bg, review text |
| `SearchAutocomplete.tsx` | Dropdown bg, text, hover |
| `BookingCalendar.tsx` | All cards, inputs, time slots |
| `BookingSuccess.tsx` | Success card bg + text |
| `CompareBar.tsx` | Bar bg, text |
| `FilterBar.tsx` | All pills, dropdown, overlay |
| Auth pages (3) | Glass card `dark:bg-s-dm-surface/80`, text, inputs |
| `app/not-found.tsx` | Heading, borders, buttons |
| `app/global-error.tsx` | Replace raw `<NextError>` with branded error UI |

#### 4.1 — Favicon Generation

Generate a simple favicon: coral dot on transparent background (representing the "." in "so.len").
- Create `public/favicon.svg`: coral circle `#E8624A`
- Add `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />` to root layout

```bash
npm run build
git add -A && git commit -m "phase 4: dark mode for zero-coverage components + auth + error pages + favicon" && git push
git tag polish-ph4 && git push origin polish-ph4
```

---

### Phase 4.5 — Security Fix: Middleware getSession() (15 min) 🔴

In `middleware.ts` L111:
```typescript
// BEFORE (deprecated — doesn't verify against Supabase servers)
const { data: { session } } = await supabase.auth.getSession();

// AFTER (secure — verifies the JWT)
const { data: { user } } = await supabase.auth.getUser();
```

Update all references to `session` below that line to use `user` instead.

```bash
npm run build
git add -A && git commit -m "phase 4.5: security — middleware getSession→getUser" && git push
```

---

## 📋 PROMPT 2: Header Morph + Micro-Interactions (~5 hours)

> Start fresh session. Read `CLAUDE.md` and `UI_RULES.md`.
>
> **Verification sweep first:**
> ```bash
> grep -Ercn "bg-mesh-teal|shadow-teal-glow|accent-teal|from-coral/" components/ app/ --include="*.tsx" | head -5
> echo "Old dark tokens:" && grep -Ercn "dark:bg-dm-|dark:text-dm-" components/ app/ --include="*.tsx" | wc -l
> ```
> Both should be 0.

### Phase 5 — Header Scroll Morph (1.5 hours) 🔴

**Behavior:**
- **At top (scrollY < 50):** Full-width bar, `sticky top-0`, `rounded-none`, `py-4 px-6`, wider `max-w-5xl`, background slightly transparent `bg-s-bg-base/80 backdrop-blur-lg`
- **On scroll (scrollY ≥ 50):** Animate to floating pill, `top-4`, `rounded-full`, `py-2.5 px-4`, narrow `max-w-3xl`, `glass` class, `shadow-warm-sm`
- **Transition:** CSS `transition-all duration-500 ease-out`

**Spacing fix:**
- Logo area: `gap-3` (up from `gap-2`)
- Right actions: `gap-4` (up from `gap-3`)
- Overall pill padding: `px-5 sm:px-8`

**Dark mode:** `dark:bg-s-dm-surface/80 dark:border-white/5` on the pill state.

**Mobile menu animation:** Replace instant show/hide with `AnimatePresence` + `motion.div` slide-down.

```bash
npm run build
git add -A && git commit -m "phase 5: header scroll morph full-width→pill + mobile menu animation" && git push
git tag polish-ph5 && git push origin polish-ph5
```

---

### Phase 6 — Nav Hover Effects (30 min) 🟡

- Nav links: background pill on hover (`rounded-full px-3 py-1.5 hover:bg-s-ink/5`)
- Active link: `text-s-coral bg-s-coral/8`
- Right icons: `hover:bg-s-ink/5 dark:hover:bg-white/5` rounded-full
- Account button: `hover:scale-[1.02] active:scale-[0.98]`
- Mobile menu links: coral left-border on hover

```bash
npm run build
git add -A && git commit -m "phase 6: nav hover bg-pill, icon hover states, button scale" && git push
git tag polish-ph6 && git push origin polish-ph6
```

---

### Phase 7 — Homepage Micro-Interactions (1 hour) 🟡

#### 7.1 — Hero Blobs: Wire `animate-blob-float` classes (already exist in globals.css)
#### 7.2 — `reveal-stagger` on section containers
#### 7.3 — Reorder: Categories to position #3
#### 7.4 — Category Grid dark mode: `dark:bg-s-dm-surface/80 dark:border-white/5`
#### 7.5 — Quartier Tiles: hover `scale-[1.02] shadow-warm-md`
#### 7.6 — SearchBar: `focus:shadow-warm-sm focus:border-s-coral/30`
#### 7.7 — Footer Logo + `hover:underline underline-offset-4` on links

#### 7.8 — Quartier Tiles Dynamic Images

Instead of static gradients, show the top-rated salon's first image for each quartier:

```tsx
// Fetch top salon per quartier from API
const quartierSalons = await fetch(`/api/salons/quartier-featured`);

// For each quartier tile:
{quartierData.image ? (
  <Image src={quartierData.image} alt={quartierData.name} fill className="object-cover" />
) : (
  <div className={`bg-gradient-to-br ${quartierData.gradient}`} /> // fallback gradient
)}
```

Create `app/api/salons/quartier-featured/route.ts`:
- For each quartier, return the #1 rated salon's first image URL
- If no salon → return null (gradient fallback used)
- Cache 1 hour

Later (admin feature, Phase 12.5): Add admin override in dashboard to pin a specific salon image per quartier.

```bash
npm run build
git add -A && git commit -m "phase 7: blob animation, reveal stagger, homepage reorder, quartier dynamic images, footer logo" && git push
git tag polish-ph7 && git push origin polish-ph7
```

---

### Phase 8 — Button & Card Micro-Interactions (45 min) 🟢

#### 8.1 — All CTAs: `hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`
#### 8.2 — SalonCard: dark mode + keep wobbly blob morph hover ✅
#### 8.3 — Toast animation (framer-motion slide-in + exit)
#### 8.4 — InteractiveHoverButton: `bg-s-bg-raised dark:bg-s-dm-surface`

```bash
npm run build
git add -A && git commit -m "phase 8: button scale, card dark mode, toast animation" && git push
git tag polish-ph8 && git push origin polish-ph8
```

---

## 📋 PROMPT 3: Feature UI Integrations (~5 hours)

> Start fresh session. Read `CLAUDE.md` and `UI_RULES.md`.

### Phase 9 — Stamp Card on Profile Page (1 hour) 🟡

Check if `components/loyalty/StampCard.tsx` exists. If not, create it.
Add to ProfilePage after user info card.
Backend: `stamp_count` from booking count → each completed booking = 1 stamp. After 10, reset.

---

### Phase 10 — Compare Toggle on Salon Cards (1 hour) 🟡

Add compare icon button per SalonCard. CompareBar slides up when ≥1 selected (max 3).
Add dark mode to CompareBar.

---

### Phase 11 — Tutorial Tour Auto-Trigger (45 min) 🟢

2s delay, first visit only (localStorage check). Verify driver.js element IDs exist.

---

### Phase 12 — Weather Banner Integration (45 min) 🟢

Wire `WeatherBanner.tsx` to `/api/weather` route. Conditional recommendations by temperature/condition.

#### 12.5 — Admin Quartier Image Override

In dashboard, add a simple UI (under "Content Editor" or new "Quartier Images" section):
- List of quartiers
- Each: choose a salon from dropdown OR upload a custom image
- Save to `content` table or new `quartier_images` table
- API reads admin override first, falls back to top-rated salon image

---

### Phase 13 — API Debugging Phase (1 hour) 🔴

Check why `/api/salons`, `/api/directory`, `/api/content`, `/api/categories` return 500:

1. Read each route file — check for missing env vars, wrong table names, syntax errors
2. Add try/catch with detailed error logging to each route
3. Test locally with `npm run dev` + curl
4. If env vars are the issue → document which ones need setting in the manual roadmap
5. If code bugs → fix them

```bash
# Test each API route
curl -s http://localhost:3000/api/salons?category=coiffeur | head -c 200
curl -s http://localhost:3000/api/categories | head -c 200
curl -s http://localhost:3000/api/directory?category=coiffeur | head -c 200
curl -s http://localhost:3000/api/content?keys=hero_title | head -c 200
```

---

### Phase 14 — Final Verification & Docs (30 min) 🟢

#### Full Sweep
```bash
# Rebrand leftovers
grep -Ern "bg-mesh-teal|shadow-teal-glow|accent-teal|from-coral/" components/ app/ --include="*.tsx"
# Old dark tokens
grep -Ercn "dark:bg-dm-|dark:text-dm-" components/ app/ --include="*.tsx"
# Cold grays
grep -Ercn "bg-gray-|border-gray-|text-gray-" components/ app/ --include="*.tsx" | wc -l
# Hardcoded links
grep -rn '"/de/' components/ app/ --include="*.tsx" | grep -v "messages/"
# Emoji
grep -Ern "🎉|⭐|👤|🔵|⚪|🔘" components/ app/ --include="*.tsx"
# window.prompt/alert
grep -rn "window\.prompt\|window\.alert" components/ --include="*.tsx"
# Duplicate CancelModal
grep -rn "function CancelModal" components/ app/ --include="*.tsx"
```

#### Update Documentation
- `CLAUDE.md`: Update design tokens, remove migration warnings
- `UI_RULES.md`: Add warm gray mapping, dark mode rules, header behavior, button scale
- `_tasks/INCOMPLETE_FEATURES.md`: Mark stamp card, compare, tutorial, weather as done

#### ⚠️ KNOWN OUT-OF-SCOPE ITEMS (Separate Roadmaps)

| Issue | Where to Track |
|---|---|
| **Legal placeholder text** — Impressum, AGB, Datenschutz | Manual — needs real company data |
| **Cookie consent banner refinement** — exists but may need PostHog-specific opt-in | `roadmap-compliance.md` |

```bash
git add -A && git commit -m "phase 14: final verification + docs updated" && git push
git tag v3-ui-polish && git push origin v3-ui-polish
```

---

## 📋 PROMPT 4: Full i18n Implementation (~8-10 hours)

> Start fresh session. Read `CLAUDE.md` and `UI_RULES.md`.
> **Prerequisite:** All previous prompts must be complete.

### Phase 15 — i18n Infrastructure Check (30 min)

1. Verify `next-intl` is configured correctly in `i18n.ts` and middleware
2. Verify `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json` exist
3. Check which keys exist in `de.json` — this is the source of truth
4. Verify `useTranslations()` works in Header.tsx (it should — it's the only component using it)

### Phase 16 — Homepage i18n (2 hours) 🔴

`components/HomePage.tsx` — 0 `useTranslations()` calls. ALL text hardcoded German.

1. Add `const t = useTranslations("home");` at the top
2. Replace EVERY hardcoded string:
   - "Beauty. Basel." → `t("hero.title")`
   - "Willkommen {name}" → `t("hero.welcome", { name })`
   - "Entdecken" → `t("categories.title")`
   - "Beliebte Salons" → `t("featured.title")`
   - "Noch keine Salons" → `t("featured.empty")`
   - "Neue Salons" → `t("new.title")`
   - "Last-Minute Angebote" → `t("lastminute.title")`
   - "Wieder buchen?" → `t("rebook.title")`
   - "Quartiere in Basel" → `t("quartiers.title")`
   - "Bald hier" → `t("quartiers.soon")`
   - ALL button texts, CTA texts, section headers
3. Add ALL keys to `de.json`, `en.json`, `fr.json`, `it.json`

### Phase 17 — CategoryPage i18n (1 hour)

`components/CategoryPage.tsx` — hardcoded `categoryLabels` object + all UI text.
Same pattern: `useTranslations("category")`, replace all strings, add to all 4 locale files.

### Phase 18 — FilterBar + SearchBar i18n (45 min)

`components/FilterBar.tsx` — "Heute verfügbar", "Preis", "Filter löschen", etc.
`components/ui/SearchBar.tsx` — placeholder text.

### Phase 19 — BookingCalendar i18n (1.5 hours)

`components/BookingCalendar.tsx` — "Morgens", "Nachmittags", "Abends", "Wöchentlich", "Erster Besuch", "Serienbuchung", "Termin bestätigen", etc. (~30 strings)

### Phase 20 — ChatWindow i18n (1 hour)

`components/ChatWindow.tsx` — "Noch keine Nachrichten", "Chat", "Fotos", "Angebot erstellen", "Nachricht schreiben…", etc.

### Phase 21 — ProfilePage + Auth i18n (1 hour)

- ProfilePage: settings labels, section headers, booking card text
- SignIn.tsx: L87, 89, 106, 108, 126, 200, 208 — mix of translated and hardcoded
- CancelModal (shared): "Termin stornieren", "Kostenlose Stornierung..."

### Phase 22 — Remaining Components (1 hour)

- Footer.tsx: "Kategorien", "Unternehmen", "Für Salons"
- Breadcrumb.tsx: "Home" (add FR "Accueil", IT "Home")
- CookieBanner.tsx
- BookingSuccess.tsx
- LastMinuteCard.tsx
- SalonCard.tsx (badge text, stamp text)
- Salon detail page: tabs, info labels, review section

### Phase 23 — i18n Verification (30 min)

```bash
# Find remaining hardcoded German (rough check)
grep -rn '"Buchen\|"Termin\|"Salon\|"Filtern\|"Kategorie\|"Startseite\|"Zurück' components/ --include="*.tsx" | grep -v "messages/" | grep -v "t(" | head -20
# Should be near 0

# Verify all 4 locale files have matching keys
node -e "
  const de = Object.keys(require('./messages/de.json'));
  const en = Object.keys(require('./messages/en.json'));
  const fr = Object.keys(require('./messages/fr.json'));
  const missing_en = de.filter(k => !en.includes(k));
  const missing_fr = de.filter(k => !fr.includes(k));
  console.log('Missing EN:', missing_en.length, 'Missing FR:', missing_fr.length);
"
```

```bash
npm run build
git add -A && git commit -m "prompt 4: full i18n — all components translated DE/EN/FR/IT" && git push
git tag v3-i18n-complete && git push origin v3-i18n-complete
```

---

## Execution Summary

| Prompt | Phases | Est. Time | Focus |
|---|---|---|---|
| **1** | 1-4.5 | 7 hours | Rebrand leftovers, auth merge, profile merge, dark mode, warm grays, security fix |
| **2** | 5-8 | 5 hours | Header morph, hover effects, animations |
| **3** | 9-14 | 5 hours | Stamp card, compare, tutorial, weather, API debug, docs |
| **4** | 15-23 | 9 hours | Full i18n across all components (DE/EN/FR/IT) |

**Total: ~26 hours of Claude Code work across 4 sessions**

> Tag current state as `v2-design-coral` BEFORE starting Prompt 1.
> After Prompt 3: tag `v3-ui-polish`.
> After Prompt 4: tag `v3-i18n-complete`.
