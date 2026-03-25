# R36 — Zone Enforcement Audit (Booking/Auth = Zone 3, Dashboard = Zone 4)

> Audit and enforce V3 zone rules: Zone 3 (booking, auth, login, checkout) must have ZERO glass, ZERO blobs. Zone 4 (dashboard) must have ZERO blobs, ZERO glassmorphism, ZERO Bebas Neue, max 12px radius.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| Phase 1 — Zone 3 glass removal (booking/auth) | 🟡 Medium | Booking flow UI changes |
| Phase 2 — Zone 3 blob removal | 🟢 Low | Remove decorative divs |
| Phase 3 — Zone 4 Bebas Neue sweep | 🟢 Low | Font token swap only |
| Phase 4 — Zone 4 blob/glass removal | 🟡 Medium | Dashboard component changes |

---

## Phase 1 — Zone 3: Remove Glass from Booking + Auth + Checkout

### ⚠️ BE CAREFUL
- Zone 3 = booking steps, date/time picker, booking summary, TWINT payment, login, signup, reset password.
- ANY `backdrop-filter` or `glass` class in these routes is a ZONE VIOLATION.
- The nav glass (tier 1) is STILL allowed — it's on top of the page, not part of Zone 3 content.
- Booking summary card: use `bg-s-bg-surface` (--sur: #F3EDE2) NOT glass.

### Files to check and fix

Run grep to find glass in Zone 3 routes:
```bash
grep -rn "backdrop-filter\|glass\|blur-\[16\|blur-\[28" --include="*.tsx" \
  app/[locale]/checkout/ \
  app/[locale]/auth/ \
  app/[locale]/booking/ \
  components/booking/ \
  | grep -v node_modules
```

#### [MODIFY] Any booking/auth component with glass

✅ DO (booking summary card):
```tsx
// Zone 3 replacement — no glass, clean surface
<div className="rounded-[20px] bg-s-bg-surface border border-s-ink/[0.08] p-6 shadow-warm-sm">
  <p className="font-heading font-bold text-s-ink text-[15px] mb-4">Buchungsübersicht</p>
  {/* summary rows */}
</div>
```

❌ DON'T:
```tsx
// Never in Zone 3:
<div className="glass backdrop-blur-[16px] bg-white/62 ...">
<div style={{ backdropFilter: "blur(16px)" }} ...>
```

✅ DO (TWINT payment step):
```tsx
// Payment: use only pure --raised (#FFFFFF) bg
<div className="bg-white rounded-[20px] p-8 shadow-warm-sm">
```

**Verification:** `npm run build` — booking flow and auth pages have zero backdrop-filter.
```bash
grep -rn "backdrop-filter\|blur-\[" app/[locale]/checkout/ app/[locale]/auth/ components/booking/
# 0 results
```

**Git commit:** `git add -A && git commit -m "R36-P1: Zone 3 glass removal — booking/auth/checkout zero backdrop-filter"`

---

## Phase 2 — Zone 3: Remove Background Blobs

### ⚠️ BE CAREFUL
- Zone 3 = paper cream background ONLY. No blobs of any size or opacity.
- If a booking step currently uses `<BlobBackground zone={1} />` — remove it entirely.
- The background must be `#FAF6EF` (bg-s-bg-base / the body default).

### Files to check

```bash
grep -rn "BlobBackground\|blob-float\|rounded-blob" --include="*.tsx" \
  app/[locale]/checkout/ \
  app/[locale]/auth/ \
  app/[locale]/booking-action/ \
  components/booking/
```

#### [MODIFY] Any Zone 3 component with blobs
Remove the `<BlobBackground />` component call and any blob-related `div`s:
```tsx
// Remove:
<BlobBackground zone={1} />
// Remove:
<div className="absolute w-[400px] h-[400px] rounded-full bg-s-coral/14 ..." />
```

**Verification:** 
```bash
grep -rn "BlobBackground\|blob" app/[locale]/checkout/ app/[locale]/auth/ 
# 0 results
```

**Git commit:** `git add -A && git commit -m "R36-P2: Zone 3 blobs removed — booking/auth/checkout clean cream bg only"`

---

## Phase 3 — Zone 4: Sweep Bebas Neue Out of Dashboard

### ⚠️ BE CAREFUL
- Zone 4 = dashboard, analytics, booking management, admin, settings.
- `font-display` (Bebas Neue) is NEVER allowed in these routes.
- Replace `font-display` with `font-heading` (Syne) everywhere in Zone 4.
- The nav logo (`so.len`) is exempt — it's in the nav, not Zone 4 content.

### Files to check

```bash
grep -rn "font-display\|font-heading.*display\|Bebas" --include="*.tsx" \
  app/[locale]/dashboard/ \
  components/dashboard/ \
  | grep -v node_modules
```

#### [MODIFY] All dashboard files with font-display

✅ DO:
```tsx
<h1 className="font-heading font-bold text-2xl text-s-ink">Dashboard</h1>
```

❌ DON'T:
```tsx
<h1 className="font-display text-4xl">Dashboard</h1>
```

**Verification:**
```bash
grep -rn "font-display" app/[locale]/dashboard/ components/dashboard/
# 0 results
```

**Git commit:** `git add -A && git commit -m "R36-P3: Zone 4 Bebas Neue sweep — all dashboard headings → font-heading"`

---

## Phase 4 — Zone 4: Remove Glass + Blobs from Dashboard

### ⚠️ BE CAREFUL
- Dashboard = pure data interface. ZERO glassmorphism, ZERO carpet blobs.
- Any `backdrop-filter`, `glass` class, or `BlobBackground` in dashboard components is a violation.
- Dashboard cards must use: `rounded-[12px]` (max), `bg-s-bg-raised`, `border border-s-ink/08`, `shadow-warm-sm`.
- Status indicators in dashboard: sage = active/ok, coral = alert, amber = warning, blue = info.

### Files to check

```bash
grep -rn "backdrop-filter\|glass\|BlobBackground\|rounded-blob\|rounded-card" --include="*.tsx" \
  app/[locale]/dashboard/ \
  components/dashboard/ \
  | grep -v node_modules
```

#### [MODIFY] All dashboard files with glass/blob

✅ DO (dashboard stat card):
```tsx
<div className="rounded-[12px] bg-s-bg-raised border border-s-ink/[0.08] shadow-warm-sm p-5">
  <p className="font-heading font-bold text-xs uppercase tracking-[.16em] text-s-ink/50 mb-2">Buchungen heute</p>
  <p className="text-3xl font-heading font-bold text-s-ink">24</p>
</div>
```

❌ DON'T:
```tsx
// Never in Zone 4:
<div className="glass backdrop-blur-[16px] rounded-[20px] ...">
<div className="rounded-blob-a ...">
<BlobBackground zone={1} />
```

Also check dashboard for `rounded-card` (12px) vs `rounded-[20px]` — Zone 4 max is 12px:
```bash
grep -rn "rounded-\[20px\]" components/dashboard/
# Replace any found with rounded-card or rounded-[12px]
```

**Verification:**
```bash
grep -rn "backdrop-filter\|glass\|BlobBackground\|rounded-\[20px\]" components/dashboard/ app/[locale]/dashboard/
# 0 results
npm run build
```

**Git commit:** `git add -A && git commit -m "R36-P4: Zone 4 glass/blob removal — dashboard pure data, 12px max radius"`

---

## Zone Compliance Checklist

| Zone | Route | Glass ❌ | Blobs ❌ | Bebas Neue ❌ (Zone 4) | Max Radius |
|---|---|---|---|---|---|
| Zone 3 | `/checkout/*` | ❌ | ❌ | ✅ ok | 20px |
| Zone 3 | `/auth/*` | ❌ | ❌ | ✅ ok | 20px |
| Zone 3 | `/booking-action/*` | ❌ | ❌ | ✅ ok | 20px |
| Zone 4 | `/dashboard/*` | ❌ | ❌ | ❌ | 12px |
| Zone 4 | `components/dashboard/*` | ❌ | ❌ | ❌ | 12px |

## Dependency Ordering

| Step | Depends On |
|---|---|
| Phase 1 — Zone 3 glass | Nothing (independent) |
| Phase 2 — Zone 3 blobs | Nothing (can run parallel with Phase 1) |
| Phase 3 — Zone 4 font | Nothing (independent) |
| Phase 4 — Zone 4 glass/blobs | Nothing (can run parallel with Phase 3) |

## Final Verification

```bash
npm run build
# Zone 3 routes: grep backdrop-filter → 0 results
# Zone 4 routes: grep font-display → 0 results
# Zone 4 routes: grep backdrop-filter → 0 results
# Zone 4 routes: grep rounded-\[20px\] → 0 results
```
