# Walk-in Pay Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/walk-in-pay/page.tsx` (208 lines) — QR-triggered walk-in payment screen. 4 states: loading, paid (success), error, booking form.
> **Zone: 3 (Clean Functional)** — Payment screen. Zero glass, zero blobs, maximum trust. All API calls (`/api/bookings/walk-in-verify`, `/api/stripe/create-payment-intent`), `handlePay`, `token` parsing, `BookingData` interface, and multi-locale labels are completely untouched.
>
> ⚠️ The `motion.div` wrapper (lines 141–144) uses `opacity: 0, y: 16 → opacity: 1, y: 0` — compliant ✅ (no scale). Keep it exactly as-is.

---

## Violations Found

| Location | Issue | Action |
|---|---|---|
| Outer card (line 144) | `rounded-card shadow-card` | → `rounded-[16px]` + warm shadow |
| Loading state (line 147) | `<Spinner size="lg" />` in a centered div | → coral pulse dots |
| Paid state icon (line 150) | `rounded-full bg-s-coral/10` — no eyebrow above h2 | Add `"Zahlung"` eyebrow + icon box |
| Paid h2 (line 153) | `font-heading font-bold text-lg` ✅ | Keep |
| Error state icon (line 158) | `rounded-full bg-s-amber-subtle` — fine but no eyebrow above error message | Add amber eyebrow |
| Error message (line 161) | `text-sm text-s-ink/70` | → `text-xs font-body` + `AlertTriangle` eyebrow |
| Card header icon box (line 166) | `rounded-lg` (non-standard) | → `rounded-[10px]` |
| Card header h1 (line 169) | `font-heading font-bold text-lg` — no eyebrow | Add `"Walk-in"` eyebrow above |
| Detail card (line 172) | `rounded-card` | → `rounded-[12px]` |
| Detail labels (line 174, 178, 182) | `text-sm text-s-ink/50` ✅ fine but `text-sm` | → `text-xs font-body` |
| Detail values (line 175, 179, 183) | `font-medium text-s-ink` | → `font-heading font-semibold` |
| Amount value (line 190) | `data-text font-bold text-s-coral text-lg` ✅ | Keep |
| Detail divider (line 188) | `border-s-ink/10` | → `border-s-ink/[0.07]` |
| Pay CTA (line 197) | `font-medium rounded-btn` | → `font-heading font-bold uppercase text-xs` + inline style |

---

## Phase 1 — Outer Card: Radius + Shadow

### Current state (line 144)
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white dark:bg-s-dm-surface rounded-card shadow-card max-w-md w-full p-6">
```

### Files to modify

#### [MODIFY] [walk-in-pay/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/walk-in-pay/page.tsx)
**Line 141–144** — outer motion.div:
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
  className="bg-white dark:bg-s-dm-surface rounded-[16px] max-w-md w-full p-6"
  style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 32px rgba(26,18,9,.09)" }}>
```

**Git commit:** `git add app/[locale]/walk-in-pay/page.tsx && git commit -m "WIP-P1: outer card → rounded-[16px], warm shadow, eased motion transition"`

---

## Phase 2 — Loading + Paid + Error States

### Files to modify

#### [MODIFY] [walk-in-pay/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/walk-in-pay/page.tsx)

**Line 147** — loading:
```tsx
{loading ? (
  <div className="flex items-center justify-center gap-1.5 py-14">
    {[0, 1, 2].map((i) => (
      <div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral/50 animate-pulse"
        style={{ animationDelay: `${i * 0.2}s` }} />
    ))}
  </div>
```

**Lines 148–155** — paid state:
```tsx
) : paid ? (
  <div className="text-center py-8">
    <div className="w-16 h-16 rounded-[18px] mx-auto mb-5 flex items-center justify-center"
      style={{ background: "rgba(232,98,74,.10)" }}>
      <Check size={26} className="text-s-coral" />
    </div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
      Zahlung
    </p>
    <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">{l.paid}</h2>
    <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50 leading-relaxed">{l.paidDesc}</p>
  </div>
```

**Lines 156–162** — error state:
```tsx
) : error ? (
  <div className="text-center py-8">
    <div className="w-16 h-16 rounded-[18px] mx-auto mb-5 flex items-center justify-center"
      style={{ background: "rgba(212,135,10,.10)" }}>
      <AlertTriangle size={26} className="text-s-amber" />
    </div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-amber mb-2">
      Fehler
    </p>
    <p className="text-sm font-body text-s-ink/60 dark:text-s-dm-text/60">
      {error === "No token provided" ? l.noToken : l.invalid}
    </p>
  </div>
```

**Git commit:** `git add app/[locale]/walk-in-pay/page.tsx && git commit -m "WIP-P2: loading → dots; paid/error → icon boxes, eyebrows, no spinner"`

---

## Phase 3 — Booking Header: Icon Box + Eyebrow

### Current state (lines 165–170)
```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="w-10 h-10 rounded-lg bg-s-coral/10 flex items-center justify-center">
    <CreditCard size={18} className="text-s-coral" />
  </div>
  <h1 className="font-heading font-bold text-lg text-s-ink">{l.title}</h1>
</div>
```

### Files to modify

#### [MODIFY] [walk-in-pay/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/walk-in-pay/page.tsx)
**Lines 165–170** — booking header:
```tsx
<div className="flex items-start gap-3 mb-6">
  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
    style={{ background: "rgba(232,98,74,.10)" }}>
    <CreditCard size={17} className="text-s-coral" />
  </div>
  <div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-0.5">
      Walk-in
    </p>
    <h1 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">{l.title}</h1>
  </div>
</div>
```

**Git commit:** `git add app/[locale]/walk-in-pay/page.tsx && git commit -m "WIP-P3: booking header → rounded-[10px] icon box, 'Walk-in' eyebrow"`

---

## Phase 4 — Detail Card: Radius + font-heading Values

### Current state (lines 172–192)
```tsx
<div className="bg-s-bg-surface rounded-card p-4 mb-6 space-y-3">
  <div className="flex justify-between text-sm">
    <span className="text-s-ink/50">{l.salon}</span>
    <span className="font-medium text-s-ink">{booking.salon_name}</span>
  </div>
  {/* ... 3 more rows ... */}
  <div className="border-t border-s-ink/10 pt-2 ...">
    <span className="text-s-ink/50">{l.amount}</span>
    <span className="data-text font-bold text-s-coral text-lg">...</span>
  </div>
</div>
```

### Files to modify

#### [MODIFY] [walk-in-pay/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/walk-in-pay/page.tsx)
**Lines 172–192** — detail card:
```tsx
<div className="rounded-[12px] p-4 mb-6 space-y-3"
  style={{ background: "rgba(26,18,9,.03)" }}>
  {/* Salon row */}
  <div className="flex justify-between items-center">
    <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/30 dark:text-s-dm-text/30">{l.salon}</span>
    <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{booking.salon_name}</span>
  </div>
  {/* Service row */}
  <div className="flex justify-between items-center">
    <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/30 dark:text-s-dm-text/30">{l.service}</span>
    <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{booking.service_name}</span>
  </div>
  {/* Time row */}
  <div className="flex justify-between items-center">
    <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/30 dark:text-s-dm-text/30">{l.time}</span>
    <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text flex items-center gap-1">
      <Clock size={11} className="text-s-ink/40" />
      {new Date(booking.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
    </span>
  </div>
  {/* Amount row */}
  <div className="border-t border-s-ink/[0.07] dark:border-white/[0.06] pt-3 flex justify-between items-center">
    <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/30 dark:text-s-dm-text/30">{l.amount}</span>
    <span className="font-heading font-bold text-lg text-s-coral">{formatCurrency(booking.amount, locale)}</span>
  </div>
</div>
```

**Git commit:** `git add app/[locale]/walk-in-pay/page.tsx && git commit -m "WIP-P4: detail card → rounded-[12px], row labels 9px uppercase, values font-heading"`

---

## Phase 5 — Pay CTA Button

### Current state (line 197)
```tsx
<button className="w-full px-4 py-3.5 rounded-btn bg-s-coral text-white font-medium disabled:opacity-50 ...">
```

### Files to modify

#### [MODIFY] [walk-in-pay/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/walk-in-pay/page.tsx)
**Lines 194–201** — pay CTA:
```tsx
<button
  onClick={handlePay}
  disabled={paying}
  className="w-full px-4 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
  {paying ? <Spinner size="sm" invert /> : <CreditCard size={15} />}
  {l.pay}
</button>
```

**Git commit:** `git add app/[locale]/walk-in-pay/page.tsx && git commit -m "WIP-P5: pay CTA → font-heading uppercase, coral inline-style, no font-medium"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Outer card | ✅ Start here |
| P2 | Loading + Paid + Error states | ✅ Independent |
| P3 | Booking header | After P1 (inside card) |
| P4 | Detail card | After P3 (same area) |
| P5 | Pay CTA | After P4 |

> P1 + P2 parallel.
> P3→P4→P5 sequential within the booking state.

---

## WALK-IN PAY COMPLIANCE CHECK

```bash
npm run build

# rounded-card + shadow-card removed:
grep -n "rounded-card\|shadow-card" app/[locale]/walk-in-pay/page.tsx
# Expected: 0

# font-medium removed:
grep -n "font-medium\b" app/[locale]/walk-in-pay/page.tsx
# Expected: 0

# motion.div animation untouched (no scale):
grep -n "initial\|animate" app/[locale]/walk-in-pay/page.tsx
# Expected: opacity+y only

# API calls untouched:
grep -n "walk-in-verify\|create-payment-intent" app/[locale]/walk-in-pay/page.tsx
# Expected: both present

# Manual checklist:
# ✅ Loading: coral pulse dots
# ✅ Paid: icon box coral tint + "Zahlung" eyebrow
# ✅ Error: icon box amber tint + "Fehler" eyebrow
# ✅ Booking header: rounded-[10px] icon box + "Walk-in" eyebrow
# ✅ Detail card: rounded-[12px], row labels 9px uppercase, values font-heading
# ✅ Amount: font-heading bold coral — preserved
# ✅ Pay CTA: font-heading uppercase, coral inline-style
# ✅ motion.div: opacity+y fade — NOT TOUCHED
```

---

## Final Step — Push

```bash
git push
```
