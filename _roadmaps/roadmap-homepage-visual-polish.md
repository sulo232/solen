> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap: Homepage Visual Overhaul — Airbnb Polish
> **Priority**: 🔴 P0 — This is purely visual/CSS/text fixes. Zero backend changes.
> **Parallelism**: SAFE alongside all other roadmaps. Only touches: `CityCarouselSection.tsx`, `SalonCard.tsx`, `Breadcrumb.tsx`, `messages/*.json`, `app/[locale]/layout.tsx`
> **Problem**: Homepage looks "vibe-coded" — massive bold section titles, raw i18n key badges, breadcrumb showing on homepage, dead beige space. Airbnb uses small clean headers, tight spacing, no breadcrumbs.
> **Estimated Time**: ~25 minutes

---

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Adding missing i18n keys only |
| Phase 2 | 🟢 SAFE | Nothing | Removing breadcrumb from homepage (it already excludes homepage — just fix the detection) |
| Phase 3 | 🟡 MEDIUM | Section layout shift | Check no overflow after reducing font size |
| Phase 4 | 🟢 SAFE | Nothing | CSS-only card info row tightening |

---

## 📸 EXACTLY WHAT'S WRONG (verified from live screenshots)

1. **`SALON.GUESTFAVORITE` / `SALON.TOPRATED` raw key badges** — `t("guestFavorite")` and `t("topRated")` fail silently, rendering the raw translation key. The keys do NOT exist in `messages/de.json` under the `"salon"` namespace (or whatever namespace `SalonCard` uses). The `{ fallback: "Guest Favorite" }` option is NOT supported by `next-intl` — fallback only works in ICU message format, not as a hook option. This is causing the raw key to show.

2. **"Home > en" breadcrumb on homepage** — `Breadcrumb.tsx` has `isHomepage` detection that checks `pathname === /${locale}` but on the English locale, visiting `/en` renders the breadcrumb showing "Home > en". The `segments` logic splits `/en` into `["en"]` when `withoutLocale` is empty string but the `isHomepage` check has a bug.

3. **Section headers 42px bold** — `CityCarouselSection.tsx` line 39: `fontSize: "clamp(24px, 3.5vw, 42px)"` with `font-extrabold`. At 1280px wide this renders ~45px ultra-bold italic. Airbnb uses ~18px regular weight.

4. **Too much dead vertical space** — The search bar has excessive top margin. Category pills have too much vertical padding. Gap between search and first carousel is too large.

---

## 🤖 Phase 1: Fix the Raw Badge Key Leaks (CRITICAL — visible on production)

**Problem**: `SalonCard.tsx` calls `t("guestFavorite", { fallback: "Guest Favorite" })` and `t("topRated", { fallback: "Top Rated" })`. In `next-intl`, the `fallback` option in the hook call does NOT work — it's not a supported API. The keys are also missing from the messages files, so next-intl renders the raw key path as the string.

**Files**:
- [MODIFY] `messages/de.json` — Add keys under the correct namespace
- [MODIFY] `messages/en.json` — Same
- [MODIFY] `messages/fr.json` — Same
- [MODIFY] `messages/it.json` — Same
- [MODIFY] `components/SalonCard.tsx` — Fix the `t()` call to not use unsupported `fallback` option

### Step 1a: Find what namespace SalonCard uses

Run:
```bash
grep -n "useTranslations" components/SalonCard.tsx
```

The result will show something like `useTranslations("salon")` or `useTranslations("salonCard")`. Note the exact namespace.

### Step 1b: Add the missing keys to messages files

Once you know the namespace (let's say it's `"salon"`), add these keys to ALL 4 locale files inside that namespace. If the namespace key doesn't exist yet, create it.

For `de.json` — add inside the `"salon"` namespace (or whatever namespace SalonCard uses):
```json
"guestFavorite": "Gästefavorit",
"topRated": "Top bewertet",
"newOnSolen": "Neu auf Solen"
```

For `en.json`:
```json
"guestFavorite": "Guest Favorite",
"topRated": "Top Rated",
"newOnSolen": "New on Solen"
```

For `fr.json`:
```json
"guestFavorite": "Favori des invités",
"topRated": "Mieux noté",
"newOnSolen": "Nouveau sur Solen"
```

For `it.json`:
```json
"guestFavorite": "Preferito degli ospiti",
"topRated": "Più votato",
"newOnSolen": "Nuovo su Solen"
```

### Step 1c: Fix the t() call in SalonCard

[MODIFY] `components/SalonCard.tsx` — lines 210 and 228:

✅ DO:
```tsx
// Line 210 — Guest Favorite badge
<Award size={12} className="text-s-coral" /> {t("guestFavorite")}

// Line 228 — Top Rated badge
{t("topRated")}
```

❌ DON'T:
```tsx
// next-intl does NOT support the `fallback` option in the hook
{t("guestFavorite", { fallback: "Guest Favorite" })}  // ← this is what causes raw key display
```

**Verification**: After deploying, visit any salon card with rating 4.8+ on https://solen.ch/de — badges should read "Gästefavorit" or "Top bewertet", NOT `SALON.GUESTFAVORITE`.

```bash
git add messages/ components/SalonCard.tsx
git commit -m "fix: add missing guestFavorite/topRated/newOnSolen i18n keys + remove unsupported fallback option"
```

> ⚠️ **BE CAREFUL**:
> - You MUST grep for the exact namespace first — do NOT guess it's `"salon"`
> - If the namespace is `"salonCard"` or `"cards"` etc., add the keys there
> - The `newOnSolen` key is already used at line 219 — add it too if missing
> - Do NOT change any other badge logic, just the key lookup

---

## 🤖 Phase 2: Remove Breadcrumb from Homepage

**Problem**: `Breadcrumb.tsx` shows "Home > en" on the `/en` homepage. The `isHomepage` check at line 36-43 has a logic gap: when `pathname = "/en"`, `withoutLocale = pathname.replace("/en", "") = ""` which IS caught by `withoutLocale === ""`, so it SHOULD return null. But the screenshot shows it rendering. 

The actual bug: the `<Breadcrumb />` is in `layout.tsx` which renders for ALL routes. On the `/en` desktop view, the breadcrumb is showing because the `isHomepage` logic fails when the locale segment isn't stripped correctly in some edge case.

**The safest fix**: Add homepage to the EXCLUDED list as a double guard, and also exclude the root locale page:

[MODIFY] `components/ui/Breadcrumb.tsx` — line 34:

✅ DO:
```tsx
// Enhanced exclusion — add root and locale-root paths
const EXCLUDED = [
  "/dashboard", "/auth", "/booking", "/checkout", "/onboarding", 
  "/walk-in-pay", "/tip"
];

// More robust homepage detection
const normalizedPath = pathname.replace(/\/$/, ""); // strip trailing slash
const isHomepage =
  normalizedPath === "" ||
  normalizedPath === "/" ||
  normalizedPath === `/${locale}` ||
  // handles /de, /en, /fr, /it with or without trailing slash
  /^\/(de|en|fr|it)\/?$/.test(normalizedPath);

if (isHomepage) return null;
```

❌ DON'T:
```tsx
// DON'T use multiple overlapping checks that can conflict with each other
// DON'T remove the breadcrumb from OTHER pages — it's useful on /salon/[slug] etc.
```

**Verification**: Visit https://solen.ch/de and https://solen.ch/en — "Home > en" should NOT appear. Visit https://solen.ch/de/coiffeur — breadcrumb SHOULD show "Home > Coiffeur".

```bash
git add components/ui/Breadcrumb.tsx
git commit -m "fix: remove breadcrumb from homepage — improve locale-root detection"
```

> ⚠️ **BE CAREFUL**:
> - Only change the isHomepage detection. Do NOT remove the breadcrumb component globally.
> - Test the fix on BOTH `/de` and `/en` locale roots.
> - The breadcrumb is WANTED on category pages (`/de/coiffeur`), salon pages, and profile pages.

---

## 🤖 Phase 3: Shrink Section Headers to Airbnb Style

**Problem**: `CityCarouselSection.tsx` uses `clamp(24px, 3.5vw, 42px)` with `font-extrabold` for section titles. At 1280px this renders ~45px ultra-bold text that dominates the page. Airbnb uses approximately 18-20px, semibold, no uppercase, very restrained.

**Files**:
- [MODIFY] `components/ui/CityCarouselSection.tsx` — Lines 38-49

✅ DO:
```tsx
// Replace the title styling on both the <Link> and <h2> variants
// Before: clamp(24px, 3.5vw, 42px) font-extrabold
// After: 18px semibold, restrained

// For the <Link> variant (line 35-43):
<Link
  href={viewAllHref}
  onClick={onViewAll}
  className="font-heading font-semibold text-[18px] text-s-ink dark:text-s-dm-text hover:text-s-coral dark:hover:text-s-coral transition-colors duration-150 leading-snug tracking-tight"
>
  {title}
</Link>

// For the <h2> variant (line 44-50):
<h2 className="font-heading font-semibold text-[18px] text-s-ink dark:text-s-dm-text leading-snug tracking-tight">
  {title}
</h2>
```

❌ DON'T:
```tsx
// DON'T keep clamp with 42px max — this is what makes it look "vibe coded"
style={{ fontSize: "clamp(24px, 3.5vw, 42px)", letterSpacing: "-0.02em" }}
// DON'T use font-extrabold — too heavy for Airbnb-style
```

Also tighten the section bottom padding on line 31:
```tsx
// Before:
<section className="pb-8">
// After:
<section className="pb-6">
```

And tighten the header margin on line 33:
```tsx
// Before:
<div className="max-w-5xl mx-auto px-6 mb-4 flex items-end justify-between gap-4">
// After:
<div className="max-w-5xl mx-auto px-6 mb-3 flex items-center justify-between gap-4">
```

```bash
git add components/ui/CityCarouselSection.tsx
git commit -m "design: shrink section headers from 42px extrabold to 18px semibold — Airbnb style"
```

> ⚠️ **BE CAREFUL**:
> - This ONE change will have the biggest visual impact. The section title is what makes the page feel "loud".
> - `font-heading` is the display font — keeping it but reducing size is correct.
> - Do NOT change the "Alle ansehen →" link styling — that already looks good.
> - Mobile will automatically look better since the clamp's min was 24px.

---

## 🤖 Phase 4: Tighten Homepage Vertical Spacing

**Problem**: There's too much dead space between the nav, search bar, category pills, and first carousel. The page feels like it has too much breathing room — premium is DENSE, not spacious.

**Files**:
- [MODIFY] `components/HomePage.tsx` — Adjust pt/pb/gap values in the layout wrapper

First, find the search bar and category anchor strip section:
```bash
grep -n "AirbnbSearchBar\|Category Anchor\|pt-\|pb-\|gap-" components/HomePage.tsx | head -30
```

Then reduce vertical gaps:

✅ DO — tighter spacing pattern:
```tsx
{/* Search area wrapper — reduce top padding */}
<div className="pt-4 pb-2 px-4 max-w-3xl mx-auto">  {/* was pt-8 or similar */}
  <AirbnbSearchBar ... />
</div>

{/* Category anchor strip — reduce gaps */}
<div className="max-w-5xl mx-auto px-6 pt-2 pb-1">  {/* was pt-4 pb-2 */}
  ...
</div>

{/* First carousel section starts immediately after */}
```

❌ DON'T:
```tsx
// DON'T change the search bar component itself — only its wrapper margins
// DON'T touch pt/pb inside individual SalonCards
```

```bash
git add components/HomePage.tsx
git commit -m "design: tighten homepage vertical spacing — reduce dead space between search and carousels"
```

> ⚠️ **BE CAREFUL**:
> - Find the exact class names by grepping first — do NOT guess margin values
> - `HomePage.tsx` is being actively edited by a running Claude Code instance. Run `git status` first. If there are uncommitted changes, `git stash`, apply your changes, then `git stash pop`.
> - Only adjust `pt-`, `pb-`, `gap-`, `mb-`, `mt-` on WRAPPER divs around the search and carousel sections
> - Do NOT touch any sticky header positioning

---

## 🔍 SELF-CHECK PROTOCOL

After all 4 phases, open https://solen.ch/de in a browser and verify:

```bash
# 1. TypeScript
npx tsc --noEmit 2>&1 | tail -5

# 2. Build check
npm run build 2>&1 | tail -10

# 3. Verify badge keys exist
grep "guestFavorite" messages/de.json
grep "topRated" messages/de.json

# 4. Verify JSON validity
node -e "JSON.parse(require('fs').readFileSync('messages/de.json'))" && echo "OK"
```

**Visual checks** (open solen.ch/de after deploy):
- [ ] No `SALON.GUESTFAVORITE` or `SALON.TOPRATED` raw strings visible
- [ ] No "Home > en" breadcrumb on homepage
- [ ] Section headers read as ~18px "Coiffeur", "Nägel" — NOT giant 42px bold
- [ ] Page feels tighter/denser — less dead beige space

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Fix badge raw keys | Nothing — do first, highest impact |
| Phase 2 | 🤖 | Fix breadcrumb on homepage | Nothing |
| Phase 3 | 🤖 | Shrink section headers | Nothing |
| Phase 4 | 🤖 | Tighten spacing | Phase 3 (to avoid conflicts in same file area) |
