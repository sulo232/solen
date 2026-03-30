# Nav Mobile Cleanup — Kill Bottom Nav & Remove Salon Eintragen Popup

> **Scope:** `components/layout/BottomNav.tsx`, `app/[locale]/layout.tsx`, any popup/modal component that surfaces "Salon eintragen" on mobile
> **Zone:** Global — affects every public page on mobile.
> **MUST RUN BEFORE** `roadmap-nav-topbar-overhaul.md` Phase 5. Top bar hamburger must be ready to receive migrated items.
> **Accuracy required:** 🟡 Medium — removing code is safer than adding, but `layout.tsx` touches every page.

---

## Context & Decisions

| Item | Decision |
|---|---|
| BottomNav | **Delete entirely.** Remove render from `layout.tsx`. The component file can be kept but must not be imported anywhere. |
| Items lost from BottomNav | **Migrated to top bar hamburger** (see `roadmap-nav-topbar-overhaul.md` P5) |
| "Salon eintragen" popup / mobile CTA | **Remove the popup/floating CTA.** Entry point moves to: (1) hamburger panel CTA (done in topbar overhaul), (2) footer link |
| Footer "Salon eintragen" link | **Add** a link in the footer under an appropriate column if not already present |

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Remove BottomNav from layout.tsx | 🟡 Medium | `layout.tsx` renders on every page — verify build passes immediately |
| P2 — Remove Salon Eintragen popup | 🟢 Low | Removing obtrusive UI, no logic dependency |
| P3 — Add footer fallback link | 🟢 Low | Additive change to Footer.tsx |

---

## ⚠️ MANDATORY: Read Current Files First

```bash
cat components/layout/BottomNav.tsx
cat app/[locale]/layout.tsx | head -60
# Find the Salon Eintragen popup — check what component name it is:
grep -rn "salon.*eintragen\|SalonEintragen\|partner.*cta\|register.*salon\|mobile.*cta" \
  components/ app/ --include="*.tsx" -i
```

---

## Phase 1 — Remove BottomNav from Root Layout

### What to do
1. Find where `BottomNav` is imported and rendered in `app/[locale]/layout.tsx`.
2. Remove the `import` statement.
3. Remove the `<BottomNav />` (or equivalent) JSX render.
4. Keep `BottomNav.tsx` file intact — do NOT delete the file. It may be referenced elsewhere (dashboard, etc.) or needed for future reference.

#### [MODIFY] [layout.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/layout.tsx)

```tsx
// REMOVE this import:
// import BottomNav from "@/components/layout/BottomNav";

// REMOVE this render:
// <BottomNav />
```

> **Check for safe-area:** If `BottomNav` was adding `padding-bottom` to `<body>` or `<main>` via a CSS class for safe-area inset, that CSS must also be removed to prevent phantom bottom spacing on iOS.
> Search for: `grep -rn "pb-16\|pb-20\|safe-area-inset-bottom\|bottom-nav-safe" app/ --include="*.tsx"`

### Verification
```bash
npm run build
# No TypeScript error about missing BottomNav import
# Manual: open /de/ on mobile — no bottom bar visible
# Manual: scroll to bottom of page — no gap/phantom spacing at bottom
```

**Git commit:** `git add app/[locale]/layout.tsx && git commit -m "NAV-MOBILE-P1: remove BottomNav from root layout — single nav architecture"`

---

## Phase 2 — Remove "Salon Eintragen" Popup / Mobile Floating CTA

### What to do
Locate and remove the mobile popup CTA for "Salon eintragen". This is typically:
- A fixed/sticky element with `z-overlay` or `z-modal` that floats over the page on mobile
- A modal that opens on first visit
- An `<AnimatePresence>` triggered popup

```bash
# Find the component:
grep -rn "salon.*eintragen\|partner.*cta\|SalonCTA\|RegisterCTA\|FloatingCTA\|mobile.*register" \
  components/ app/ --include="*.tsx" -i
```

**If it's a standalone component** (e.g., `SalonRegisterCTA.tsx`, `PartnerCTA.tsx`):
1. Remove the `import` from wherever it's rendered (likely `layout.tsx` or `HomePage.tsx`)
2. Remove the `<ComponentName />` JSX
3. Keep the file — do not delete

**If it's inline JSX in `layout.tsx` or `HomePage.tsx`:**
1. Remove the JSX block (typically a `<div className="fixed bottom-... md:hidden ...">` block)
2. Remove any associated `useState` that controlled its visibility if no longer used

#### [MODIFY] [app/[locale]/layout.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/layout.tsx) or [components/HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)

```tsx
// REMOVE: the mobile popup/floating CTA block
// Typically looks like:
// {showPartnerCTA && (
//   <div className="fixed bottom-20 ... md:hidden ...">
//     Salon eintragen
//   </div>
// )}
```

### Verification
```bash
npm run build
# Manual (mobile): scroll through homepage — no floating/popup salon registration CTA
# Manual (desktop): verify nothing was removed from desktop view
```

**Git commit:** `git add app/[locale]/layout.tsx components/HomePage.tsx && git commit -m "NAV-MOBILE-P2: remove obtrusive Salon Eintragen popup on mobile"`

---

## Phase 3 — Add Footer Fallback: "Salon eintragen" Link

### What to do
Ensure "Salon eintragen" appears as a plain text link in the footer under the "Für Salons" column (or equivalent). This is the discoverable fallback for salon owners who can no longer find the popup CTA.

```bash
# Check current footer links:
cat components/layout/Footer.tsx | grep -A3 "partner\|salon.*eintragen\|eintragen"
```

**If the link already exists** — done, skip this phase.

**If missing:**

#### [MODIFY] [Footer.tsx](file:///c:/Users/sulod/solen/components/layout/Footer.tsx)

In the "Für Salons" column (`t("forSalons")` or equivalent), add:

```tsx
<Link href={`/${locale}/partner`}
  className="block text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
>
  {t("footer.registerSalon")}
</Link>
```

Translation key:
```json
// messages/de.json:
"footer.registerSalon": "Salon eintragen"

// messages/en.json:
"footer.registerSalon": "Register your salon"

// messages/fr.json:
"footer.registerSalon": "Inscrire votre salon"

// messages/it.json:
"footer.registerSalon": "Registra il tuo salone"
```

> Check if key already exists: `grep -r "registerSalon" messages/`

### Verification
```bash
npm run build
# Manual: scroll to footer — "Salon eintragen" link visible in appropriate column
# Manual: clicking link goes to /de/partner (or equivalent salon onboarding page)
```

**Git commit:** `git add components/layout/Footer.tsx messages/ && git commit -m "NAV-MOBILE-P3: add Salon Eintragen link to footer as persistent entry point"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Remove BottomNav from layout | ✅ Start here |
| P2 | Remove salon popup on mobile | After P1 (may touch same layout.tsx) |
| P3 | Footer fallback link | ✅ Independent (Footer.tsx) |

> **Then** execute `roadmap-nav-topbar-overhaul.md` to complete the migration.

---

## Final Compliance Check

```bash
npm run build
npx tsc --noEmit

# Verify BottomNav is not imported anywhere in app/:
grep -rn "BottomNav" app/ --include="*.tsx"
# Expected: 0 results

# Verify no phantom bottom padding:
grep -rn "pb-16\|pb-20\|pb-24" app/[locale]/layout.tsx
# Expected: 0 results (or review if still needed for other reasons)

# Verify Salon CTA popup is gone:
grep -rn "md:hidden.*salon\|salon.*md:hidden\|FloatingCTA\|SalonRegisterCTA" \
  components/ app/ --include="*.tsx" -i
# Expected: 0 results

# Verify footer has the link:
grep -rn "registerSalon\|partner.*link" components/layout/Footer.tsx
# Expected: 1+ result

# Manual checklist (mobile viewport):
# ✅ No bottom navigation bar on any public page
# ✅ No floating/popup Salon Eintragen CTA on scroll
# ✅ Footer Salon Eintragen link navigates to partner page
# ✅ No phantom bottom spacing on iOS Safari
# ✅ Existing page content not shifted (no layout regressions)
```
