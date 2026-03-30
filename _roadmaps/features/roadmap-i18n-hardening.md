# Solen i18n Hardening Roadmap

> **OBJECTIVE**: Systematically eliminate untranslated text, hardcoded `/de/` links, layout-breaking fixed UI boxes, and unstyled 404 pages across the Solen.ch platform. Ensure 100% accuracy and strict adherence to `UI_RULES.md` and `CLAUDE.md`.

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Build pipeline | Generating types for `next-intl` could break CI if `de.json` is malformed. Verify JSON schema. |
| Phase 2 | 🔴 HIGH | All Navigation | Incorrect Link usage might strip the locale, kicking users to 404s. Always test internal nav in `/en/` and verify the URL stays `/en/`. |
| Phase 3 | 🟢 SAFE | 404 & Cookie Layout | Keep `not-found.tsx` changes strictly within `app/[locale]/`. Use `UI_RULES.md` spacing. |
| Phase 4 | 🟡 MEDIUM | UI Layouts | Changing widths to fluid paddings might cause flexbox weirdness. Validate visually on mobile. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Enable Strict Types & Build Linter (No Plugins)

**Goal**: Force TypeScript to fail the build if a translation key is missing or mistyped, and create a basic search script to flag likely hardcoded German.

**Files**:
- `[MODIFY]` `global.d.ts` (or `types/next-intl.d.ts`)
- `[NEW]` `scripts/audit-i18n.js`

**Steps**:
1. Configure `next-intl` strict typing by defining the `IntlMessages` interface in a `global.d.ts` (points to `messages/de.json` as the source of truth).
2. Create `scripts/audit-i18n.js` to grep `.tsx` files for common hardcoded German words (e.g., "buchen", "suchen", "kunden", "Startseite") outside of `{t('')}` calls.

**✅ DO / ❌ DON'T:**
```typescript
// ✅ DO: Strict typing for next-intl
type Messages = typeof import('./messages/de.json');
declare interface IntlMessages extends Messages {}

// ❌ DON'T: Use external ESLint plugins
// Keep it native to TypeScript.
```

> ⚠️ **BE CAREFUL**: If the JSON files have conflicting nested structures, TypeScript will throw massive errors across the whole codebase. Make sure `de.json` is perfectly formatted before applying the type.

**Verification**: Run `npx tsc --noEmit`. If you type `t('missing.key')` anywhere, it must fail.

---

### Phase 2: Purge Hardcoded Routing (`/de/`)

**Goal**: Every internal navigation button, link, and redirect MUST respect the active locale context.

**Files**:
- `[MODIFY]` `components/layout/Header.tsx` (**NOTE**: This file was substantially rewritten by `roadmap-nav-topbar-overhaul.md` — read current state before modifying)
- ~~`[MODIFY]` `components/layout/BottomNav.tsx`~~ — **SKIP**: Removed from layout by `roadmap-nav-mobile-cleanup.md`
- `[MODIFY]` `components/HomePage.tsx`
- `[MODIFY]` Anywhere `href="/de/` or standard `<a href=` is used.

**Steps**:
1. Grep the codebase for `href="/de/`, `href="/en/`, or `push('/de/`.
2. Replace all instances of `next/link` with the `next-intl/navigation` `<Link>` component (or pass `locale` dynamically if using standard routing).

**✅ DO / ❌ DON'T:**
```tsx
// ✅ DO: Use the localized router/link wrapper
import { Link } from '@/navigation'; // or next-intl/navigation
<Link href="/partner">Partner</Link>

// ❌ DON'T: Hardcode the language path
import Link from 'next/link';
<Link href="/de/partner">Partner</Link>
```

> ⚠️ **BE CAREFUL**: If you replace `next/link` with `next-intl/navigation`, make sure the import paths map properly to your `i18n.ts` routing config. Test the "Partner" link on the English homepage explicitly!

**Verification**: Click the Partner link from `/en/`. URL must become `/en/partner` (no 404).

---

### Phase 3: Cookie Banner & premium 404 Page

**Goal**: The Cookie Banner must use translations, and the 404 page must respect `UI_RULES.md` (no white screen) and use localized text.

**Files**:
- `[MODIFY]` `components/CookieBanner.tsx`
- `[MODIFY]` `app/[locale]/not-found.tsx`

**Steps**:
1. Refactor `<CookieBanner>` to use `useTranslations('CookieBanner')`. Add the strings to all 4 `.json` files.
2. Build `not-found.tsx` using `<main className="min-h-screen bg-[--bg] flex flex-col items-center justify-center p-8">`, `<Header>`, and `<BottomNav>`. Use `lucide-react` icons (e.g., `SearchX`). 

**✅ DO / ❌ DON'T:**
```tsx
// ✅ DO: Use design tokens and layout components
<main className="bg-s-bg-base text-s-ink">
  <FileQuestion className="text-s-coral" />
  <h1>{t('not_found')}</h1>
</main>

// ❌ DON'T: Leave it as generic unstyled HTML or use neon glowing borders
<div style={{ background: 'white', border: '1px solid neon' }}>404</div>
```

> ⚠️ **BE CAREFUL**: Do NOT duplicate the `<Header>` if the root layout already renders it for the `not-found.tsx` boundary. Next.js App Router rules dictate that `not-found.tsx` inherits the layout of its segment. Verify the layout tree.

**Verification**: Visit `/en/this-is-a-fake-page`. Observe a creamy background, English text, and no layout duplication.

---

### Phase 4: Fluid Width Fixes for German Text

**Goal**: Remove restrictive fixed widths (`w-48`, `w-64`, `h-32`) from flex cards and buttons that clip text when translating from short English words to long German words.

**Files**:
- `[MODIFY]` `components/SalonCard.tsx` (and other card primitives)
- `[MODIFY]` `components/ui/Button.tsx` (or whatever base CTA component exists)

**Steps**:
1. Grep for fixed width/height containers (`w-32`, `w-48`, `w-64`, `min-w-[200px]`) containing text.
2. Replace with `w-full max-w-sm px-6 py-4` padding-based sizing.

**✅ DO / ❌ DON'T:**
```tsx
// ✅ DO: Let padding and flex dictate the size
<button className="px-6 py-3 w-full sm:w-auto rounded-pill ...">
  {t('confirm_appointment')}
</button>

// ❌ DON'T: Hardcode dimensions that will clip German translation "Termin vereinbaren"
<button className="w-32 h-10 rounded-full ...">
  Confirm
</button>
```

> ⚠️ **BE CAREFUL**: This might subtly shift spacing on the English site. You MUST adhere to the 8-point grid rule (`p-4`, `p-6`, `p-8`) from `UI_RULES.md` section 19a.

**Verification**: Switch UI to English, then German. Verify that buttons expand to accommodate text without overlapping borders.

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Strict Typing Setup | Nothing |
| Phase 2 | 🤖 | Routing purge | Phase 1 |
| Phase 3 | 🤖 | 404 & Cookie Banner | Phase 2 |
| Phase 4 | 🤖 | Layout fluidity fixes | Phase 1 |

---

## EXECUTION PROMPT FOR CLAUDE CODE CLI

Copy and paste the following prompt into your Claude Code terminal to execute this roadmap:

```text
Please execute the roadmap at _tasks/roadmap-i18n-hardening.md completely and sequentially. Focus with extremely high accuracy on NOT hallucinating or removing existing Next.js logic. Read CLAUDE.md, UI_RULES.md, and ROADMAP_RULES.md first. Execute Phase 1 through 4 one by one. For Phase 1, do not install any ESLint plugins for next-intl; just use standard TypeScript `global.d.ts` declaration merging. Between each phase, make sure you run `npm run build` to verify you didn't break the build before creating your commit. Remember Rule 33: NO HARDCODED STRINGS IN UI and Rule 36: STYLED LOCALE-AWARE 404 PAGES.
```
