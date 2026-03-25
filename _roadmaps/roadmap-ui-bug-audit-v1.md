# Solen Platform — UI Bug Audit & Fix Roadmap v1

**Created:** 2026-03-25  
**Scope:** Sub-site-by-sub-site UI bug audit covering all 8 major sub-sites  
**Status:** Ready for execution

---

## Risk Table

| Phase | Risk | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 (HomePage) | 🟢 SAFE | Nothing | — |
| Phase 2 (Salon Profile) | 🟡 MEDIUM | Review flag dialog | Build modal in-place, test first |
| Phase 3 (Last-Minute) | 🟢 SAFE | Nothing | — |
| Phase 4 (Checkout) | 🔴 HIGH | Payment on non-DE locales | Fix locale first, test on staging |
| Phase 5 (Discover) | 🟢 SAFE | Nothing | — |
| Phase 6 (Auth) | 🟡 MEDIUM | Login navigation | Verify locale after fix |
| Phase 7 (Partner) | 🟢 SAFE | Nothing | — |
| Phase 8 (Global/Tailwind) | 🟢 SAFE | Nothing | — |

---

## 🤖 Phase 1 — HomePage Fixes

**[MODIFY]** `components/HomePage.tsx`

### 1.1 — Invalid Tailwind opacity syntax (`bg-white/08` → `bg-white/[0.08]`)
Line 463 (empty state in Last-Minute section):
```tsx
// ❌ DON'T:
className="rounded-card bg-white/08 border border-white/12 ..."

// ✅ DO:
className="rounded-card bg-white/[0.08] border border-white/[0.12] ..."
```

> ⚠️ **BE CAREFUL**: Only change opacity values that use bare slash notation without brackets (e.g. `/08`, `/12`). Do NOT change `/5`, `/10`, `/50` — those are already valid Tailwind. Check only the empty state block.

**Verification**: After fix, `npm run build` should show no warnings about unknown utility classes.

---

### 1.2 — Trust strip: Replace inline SVG + `<span>CH</span>` with lucide-react icons

Lines 663-668 render raw inline SVG elements and a `<span>CH</span>` as an icon, violating UI_RULES §5.

```tsx
// ❌ DON'T:
{ icon: <svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>, label: "..." },
{ icon: <span className="text-sm font-bold">CH</span>, label: "..." },

// ✅ DO: (add Lock, Globe, Check, RotateCcw, CreditCard from existing lucide-react import)
{ icon: <Lock size={14} />, label: "Sichere Zahlung — Stripe verschlüsselt" },
{ icon: <Globe size={14} />, label: "Swiss Made — Entwickelt in Basel" },
{ icon: <Check size={14} />, label: "nDSG konform" },
{ icon: <RefreshCw size={14} />, label: "Kostenlose Stornierung bis 24h" },
{ icon: <CreditCard size={14} />, label: "TWINT · Kreditkarte · Bar" },
```

Note: `RefreshCw` is already imported in `HomePage.tsx`. Add `Lock`, `Globe`, `Check`, `CreditCard` to the existing `lucide-react` import line.

> ⚠️ **BE CAREFUL**: Do NOT change the trust strip layout/styling — only replace the `icon:` values in the data array. Do NOT touch the `map()` or the surrounding `<div>`.

**Verification**: `git commit -m "phase 1.2: replace inline SVGs with lucide-react icons in trust strip"`

---

### 1.3 — Near You section: Duplicate heading text (eyebrow = H2)

Lines 519-525: Both the eyebrow `<span>` and `<h2>` say "In deiner Nähe".

```tsx
// ❌ DON'T:
<span>In deiner Nähe</span>  // eyebrow
<h2>In deiner Nähe</h2>     // same text

// ✅ DO:
<span>Standort</span>       // eyebrow — short geographical label
<h2>In deiner Nähe</h2>     // heading stays
```

> ⚠️ **BE CAREFUL**: Only change the `<span>` eyebrow text, not the `<h2>`. Check the `<p>` subtitle too.

**Verification**: Visual check that eyebrow and heading are now different text.

```bash
git commit -m "phase 1.3: fix duplicate near-you heading text"
```

---

## 🤖 Phase 2 — Salon Profile Fixes

**[MODIFY]** `app/[locale]/salon/[slug]/page.tsx`

### 2.1 — Replace `window.prompt()` in review flag with inline form

`handleFlagReview` (line ~356) uses `window.prompt()` which is a native browser dialog — breaks Zone 2 premium aesthetic.

Add two state variables:
```tsx
const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);
const [flagReason, setFlagReason] = useState("");
```

Replace the `window.prompt()` + `alert()` calls with:
- A small inline form that appears below the review
- Input: `<textarea>` for reason
- Buttons: Cancel (sets `flaggingReviewId` to null) and Submit
- Submit calls the existing `fetch('/api/reviews/${reviewId}/flag', ...)` 

> ⚠️ **BE CAREFUL**: The API call (`/api/reviews/${reviewId}/flag`) already works. Only replace the UI wrapper. Do NOT modify the API call body or method.

```bash
git commit -m "phase 2.1: replace window.prompt review flag with inline form"
```

---

### 2.2 — Lightbox: Add ESC key close handler

When `lightboxPhoto` is truthy, no keyboard handler exists to close it.

```tsx
// Add inside the salon page component, after all existing useEffects:
useEffect(() => {
  if (!lightboxPhoto) return;
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setLightboxPhoto(null);
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [lightboxPhoto]);
```

> ⚠️ **BE CAREFUL**: Only add this useEffect. Do NOT move or modify the existing lightbox JSX rendering logic.

```bash
git commit -m "phase 2.2: add ESC key handler to photo lightbox"
```

---

## 🤖 Phase 3 — Last-Minute Page Fixes

**[MODIFY]** `app/[locale]/last-minute/page.tsx`

### 3.1 — Root background: `bg-white` → `bg-s-bg-base`

```tsx
// ❌ DON'T:
<div className="min-h-screen bg-white dark:bg-s-dm-bg">

// ✅ DO:
<div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
```

> ⚠️ **BE CAREFUL**: Only change the root wrapper `<div>`. Check if any child sections rely on the white bg showing through.

```bash
git commit -m "phase 3.1: fix last-minute page bg from bg-white to bg-s-bg-base"
```

---

## 🤖 Phase 4 — Checkout Page Fixes (🔴 HIGH RISK — DO FIRST)

**[MODIFY]** `app/[locale]/checkout/page.tsx`

### 4.1 🔴 CRITICAL — Hardcoded `/de/` locale in Stripe return_url

Line ~69 in `CheckoutForm`:

```tsx
// ❌ DON'T (CRITICAL BUG — breaks non-DE locales):
return_url: `${window.location.origin}/de/checkout/success?booking_intent=...`

// ✅ DO (locale already available via useLocale() — already imported):
return_url: `${window.location.origin}/${locale}/checkout/success?booking_intent=...`
```

Note: `locale` is already obtained via `const locale = useLocale()` at the top of `CheckoutForm`. No new imports needed.

> ⚠️ **BE CAREFUL**: Only change the `/de/` string to `/${locale}/`. Do NOT touch anything else in the `stripe.confirmPayment()` call. Do NOT change the `booking_intent` parameter encoding logic.

**Verification**: `curl -s https://www.solen.ch/fr/checkout` — must return 200.

```bash
git commit -m "phase 4.1: CRITICAL fix Stripe return_url to use dynamic locale"
```

---

### 4.2 — Replace hardcoded hex `#4CAF6F` with `s-success` tokens

In the `atSalonConfirmed` success state (lines ~294-314):

```tsx
// ❌ DON'T:
style={{ background: "rgba(76,175,111,.06)" }}
<PartyPopper className="text-[#4CAF6F]" />
<p className="text-[9px] ... text-[#4CAF6F]">

// ✅ DO:
className="bg-s-success/[0.06]"
<PartyPopper className="text-s-success" />
<p className="text-[9px] ... text-s-success">
```

Same pattern for promo success state (lines ~469-476):
```tsx
// ❌ DON'T:
style={{ background: "rgba(76,175,111,.06)" }}
<CheckCircle className="text-[#4CAF6F]" />
<span className="... text-[#1f6535]">

// ✅ DO:
className="bg-s-success/[0.06]"
<CheckCircle className="text-s-success" />
<span className="... text-s-success-text">
```

Note: `s-success.text` doesn't exist in tailwind.config — use `text-s-success` (dark green is readable). Check this resolves correctly.

> ⚠️ **BE CAREFUL**: Do NOT change the `border` color when replacing background. Only change the background color and icon/text color classes. Do NOT touch `CheckoutForm` component or Stripe `Elements`.

```bash
git commit -m "phase 4.2: replace hardcoded green hex with s-success tokens in checkout"
```

---

## 🤖 Phase 5 — Discover Page Fixes

**[MODIFY]** `app/[locale]/discover/page.tsx`

### 5.1 — ForYouSection loading guard

The `ForYouSection` component renders immediately when `isAuthenticated && !hasActiveFilters && !search`. If the component itself doesn't have an internal loading state, it may flash or cause layout shift.

First check `components/discovery/ForYouSection.tsx` for internal skeleton. If it has one, no fix needed. If not, wrap:

```tsx
// Current:
{isAuthenticated && !hasActiveFilters && !search && (
  <ForYouSection />
)}

// If ForYouSection lacks skeleton, add profileChecked guard:
{isAuthenticated && profileChecked && !hasActiveFilters && !search && (
  <ForYouSection />
)}
```

`profileChecked` is already available in state.

> ⚠️ **BE CAREFUL**: Check ForYouSection.tsx internals FIRST. Only add the guard if the component lacks its own loading state.

```bash
git commit -m "phase 5.1: add profileChecked guard to ForYouSection"
```

---

## 🤖 Phase 6 — Auth Login Page Fixes

**[MODIFY]** `app/[locale]/auth/login/page.tsx`

### 6.1 — Logo link: `<a href="/">` → `<Link href={`/${locale}`}>`

```tsx
// ❌ DON'T:
<a href="/" className="inline-block ...">solen<span>.</span>ch</a>

// ✅ DO:
<Link href={`/${locale}`} className="inline-block ...">solen<span>.</span>ch</Link>
```

Add to imports (page already has `import { Suspense } from "react"` at top):
```tsx
import Link from "next/link";
```

> ⚠️ **BE CAREFUL**: This is a Server Component (`async function Page`). `Link` from `next/link` works in Server Components. The `locale` is already destructured from `params`.

---

### 6.2 — Auth card: Remove glass (Zone 3 violation)

Zone 3 (login/signup) explicitly bans glass per UI_RULES §1 and §18.

```tsx
// ❌ DON'T — glass in Zone 3:
<div className="rounded-[16px] border border-white/70 dark:border-white/10 p-8"
  style={{ background: "rgba(255,255,255,.90)", backdropFilter: "blur(20px) saturate(1.2)",
           WebkitBackdropFilter: "blur(20px) saturate(1.2)",
           boxShadow: "0 4px 12px rgba(26,18,9,.08), 0 16px 40px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.90)" }}>

// ✅ DO — solid card, no glass:
<div className="rounded-[16px] border border-s-ink/[0.06] dark:border-white/[0.08] p-8 bg-white dark:bg-s-dm-surface"
  style={{ boxShadow: "0 4px 12px rgba(26,18,9,.08), 0 16px 40px rgba(26,18,9,.06)" }}>
```

> ⚠️ **BE CAREFUL**: Remove `backdropFilter` and `WebkitBackdropFilter` entirely. Keep the shadow and border. Keep `dark:bg-s-dm-surface` for dark mode. The ambient glow `<div>` in the background can stay — that's a background decoration, not a glass card.

```bash
git commit -m "phase 6: fix login locale link + remove Zone 3 glass violation"
```

---

## 🤖 Phase 7 — Partner Page Fixes

**[MODIFY]** `app/[locale]/partner/page.tsx`

### 7.1 — `hover:text-s-coral-dark` → `hover:text-s-coral-hover`

Line ~484:
```tsx
// ❌ DON'T:
className="... hover:text-s-coral-dark ..."

// ✅ DO:
className="... hover:text-s-coral-hover ..."
```

### 7.2 — Adjacent sections with same bg color

Change the second occurrence of `bg-s-bg-surface` (Categories section, line ~126):
```tsx
// ❌ DON'T (same bg as Features section above):
<div className="py-16 bg-s-bg-surface dark:bg-s-dm-surface">

// ✅ DO (use white/raised for visual separation):
<div className="py-16 bg-s-bg-raised dark:bg-s-dm-bg">
```

### 7.3 — Verify partner mockup images exist

Check files: `public/images/partner/dashboard-mockup.png` + `public/images/partner/profile-mockup.png`

> ⚠️ **BE CAREFUL**: If files are missing, add a placeholder or fallback bg div to avoid broken `<Image>` tags. Do NOT delete the `<Image>` components — add a fallback in `onError`.

```bash
git commit -m "phase 7: fix partner page token + bg contrast + image fallback"
```

---

## Dependency Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 4.1 | 🤖 | Fix Stripe locale bug (🔴 CRITICAL) | Nothing |
| Phase 4.2 | 🤖 | Fix success state hex colors | Phase 4.1 |
| Phase 6 | 🤖 | Fix login link + glass | Nothing |
| Phase 3 | 🤖 | Fix last-minute bg | Nothing |
| Phase 1 | 🤖 | Fix homepage inline SVGs + duplicate text | Nothing |
| Phase 2 | 🤖 | Fix salon profile review flag + lightbox | Nothing |
| Phase 5 | 🤖 | Fix discover ForYouSection guard | Nothing |
| Phase 7 | 🤖 | Fix partner token + bg contrast | Nothing |
| Verify | 🤖 | `npm run build` + type check | All phases |
| Push | 🤖 | `git push origin main` | Build passes |

---

## R7: Final Commit Format

```bash
# After all phases pass build:
git commit -m "fix: ui bug audit v1 — 8 sub-sites, 14 fixes

- HomePage: fix bg-white/08 syntax, trust strip icons, duplicate eyebrow
- SalonProfile: replace window.prompt() flag with inline form, add ESC lightbox
- LastMinute: fix root bg-white → bg-s-bg-base
- Checkout: CRITICAL fix Stripe return_url hardcoded /de/ locale
- Checkout: replace #4CAF6F hex with s-success tokens
- Discover: add profileChecked guard to ForYouSection
- AuthLogin: fix logo link locale, remove Zone 3 glass violation
- Partner: fix s-coral-dark token, fix adjacent identical bg colors"

git push origin main
```
