# Checkout Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/checkout/page.tsx` (480 lines, single file), `components/ui/interactive-hover-button.tsx`.
> **Zone: 3 (Clean Functional)** — This is the most trust-critical page on the platform. Money changes hands here. ZERO glass, zero blobs, zero animations, no scale motion. Every pixel must signal safety and credibility.
> **Special:** Stripe `PaymentElement` cannot be restyled beyond the `appearance` API — already V3-aligned. Do NOT touch `Elements` options.

---

## Zone 3 Checkout Trust Rules

1. **No animations on the payment form** — motion must only apply to page entry (opacity+y already used ✅)
2. **Cards must feel solid** — no glass, no `backdrop-blur`, warm border only
3. **CTA must always be coral glow** — the "book now" button is the conversion point
4. **Error states must be visible and warm** — not cold red, use coral tint card with icon
5. **Lock/shield icons must be present** — reinforce that this is a secure flow
6. **Promo success and error must be distinct** — green for success, coral for error

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Page entry animation | 🟢 Low | Already opacity+y — just verify no scale |
| P2 — Booking summary card | 🟢 Low | Visual only |
| P3 — Booking summary rows | 🟢 Low | Text + icon styling |
| P4 — "What you pay now" banner | 🟢 Low | Coral tint box |
| P5 — Promo code card | 🟡 Medium | Input + button — preserve validation logic |
| P6 — Promo error/success states | 🟢 Low | Inline card styles |
| P7 — User credits display | 🟢 Low | Visual only |
| P8 — At-salon confirm card | 🟢 Low | Visual only |
| P9 — At-salon success state | 🟢 Low | Success card |
| P10 — Payment card (Stripe) | 🔴 High | Stripe Elements inside — DO NOT change `<Elements>` or `<PaymentElement>` config |
| P11 — InteractiveHoverButton | 🔴 High | Unknown component — must read file before touching |
| P12 — Payment trust strip | 🟢 Low | Icon row at bottom |
| P13 — Loading skeleton | 🟢 Low | Replace centered spinner |
| P14 — Error state | 🟢 Low | Error landing page |
| P15 — Breadcrumb | 🟢 Low | Typography only |

---

## Phase 1 — Page Entry Animation Verify

### Current state (checkout/page.tsx lines 276–280)
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}>
```
- `opacity: 0 → 1` ✅
- `y: 10 → 0` ✅
- No scale ✅ — **already compliant**
- `duration: 0.4` → reduce to `0.3` for snappier feel on a transactional page

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Line 279** — transition duration:
```tsx
transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P1: entry animation → 0.3s ease, verify no scale"`

---

## Phase 2 — Booking Summary Card: Container

### Current state (checkout/page.tsx line 291)
```tsx
<div className="bg-white rounded-card border border-s-ink/5 shadow-warm-lg p-5">
  <h1 className="font-heading font-bold text-lg text-s-ink mb-4">Buchungsübersicht</h1>
```
**Issues:**
- `rounded-card` (12px) → keep as `rounded-[12px]` (same value, just explicit)
- `shadow-warm-lg` ✅ — correct warm shadow
- `h1` → should be eyebrow + heading pattern; `text-lg` ✅ but add eyebrow above
- `border-s-ink/5` → `border-s-ink/[0.06]` — slightly more visible on checkout

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 291–292** — summary card:
```tsx
<div className="bg-white rounded-[12px] border border-s-ink/[0.07]"
  style={{ boxShadow: "0 1px 2px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.06)" }}>
  <div className="px-5 pt-5 pb-4 border-b border-s-ink/[0.05]">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">
      Deine Buchung
    </p>
    <h1 className="font-heading font-bold text-base text-s-ink">Buchungsübersicht</h1>
  </div>
  <div className="px-5 py-4">
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P2: summary card → eyebrow header, explicit warm shadow, section divider"`

---

## Phase 3 — Booking Summary Rows: Icon + Typography

### Current state (checkout/page.tsx lines 294–308)
```tsx
<div className="space-y-2.5 text-sm">
  <div className="flex items-start gap-2.5 text-s-ink/70">
    <MapPin className="w-4 h-4 text-s-coral mt-0.5 shrink-0" />
    <span><strong className="text-s-ink">{intent.salon_name}</strong></span>
  </div>
```
- `text-sm` → `text-xs` for detail rows on a compact checkout card
- `<strong>` → use `font-heading font-semibold` instead
- Icon size `w-4 h-4` ✅

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 294–309** — detail rows:
```tsx
<div className="space-y-3">
  {/* Salon + address */}
  <div className="flex items-start gap-2.5">
    <MapPin className="w-4 h-4 text-s-coral mt-0.5 shrink-0" />
    <div>
      <p className="text-xs font-heading font-semibold text-s-ink">{intent.salon_name}</p>
      {intent.salon_address && (
        <p className="text-[10px] font-body text-s-ink/45 mt-0.5">{intent.salon_address}</p>
      )}
    </div>
  </div>
  {/* Date + time */}
  <div className="flex items-center gap-2.5">
    <Calendar className="w-4 h-4 text-s-coral shrink-0" />
    <p className="text-xs font-heading font-semibold text-s-ink">
      {intent.date} · {intent.time} Uhr
    </p>
  </div>
  {/* Staff */}
  {intent.staff_name && (
    <div className="flex items-center gap-2.5">
      <User className="w-4 h-4 text-s-coral shrink-0" />
      <p className="text-xs font-heading font-semibold text-s-ink">{intent.staff_name}</p>
    </div>
  )}
</div>
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P3: booking rows → font-heading semibold, address sub-label, consistent spacing"`

---

## Phase 4 — "What You Pay Now" Banner

### Current state (checkout/page.tsx lines 337–351)
```tsx
<div className="mt-3 bg-s-coral/5 border border-s-coral/15 rounded-input p-3 flex items-center justify-between">
  <p className="text-xs text-s-coral font-semibold">Anzahlung jetzt</p>
  <span className="font-heading font-bold text-lg text-s-coral">{formatCurrency(...)}</span>
</div>
```
- `rounded-input` → `rounded-[10px]`
- `font-semibold` → `font-heading font-bold uppercase tracking-[.06em]`
- Amount: `text-lg` → `text-xl` — make the key number bigger (conversion psychology)
- Add a coral left border accent for visual anchoring

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 337–351** — pay now banner:
```tsx
{paymentMode !== "at_salon" && (
  <div className="mt-4 rounded-[10px] border-l-4 border-s-coral pl-3 pr-4 py-3 flex items-center justify-between"
    style={{ background: "rgba(232,98,74,.05)", borderTopColor: "rgba(232,98,74,.15)", borderRightColor: "rgba(232,98,74,.15)", borderBottomColor: "rgba(232,98,74,.15)" }}>
    <div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-coral">
        {paymentMode === "prepay" ? "Jetzt zu zahlen" : "Anzahlung jetzt"}
      </p>
      <p className="text-[10px] font-body text-s-ink/40 mt-0.5">
        {paymentMode === "prepay"
          ? "Voller Betrag wird jetzt belastet"
          : "Wird bei Erscheinen angerechnet"}
      </p>
    </div>
    <span className="font-heading font-bold text-xl text-s-coral">{formatCurrency(chargeAmount, locale)}</span>
  </div>
)}
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P4: pay-now banner → coral left accent, text-xl amount, eyebrow label"`

---

## Phase 5 — Promo Code Card

### Current state (checkout/page.tsx lines 355–386)
```tsx
<div className="bg-white rounded-card border border-s-ink/5 shadow-warm-lg p-5 space-y-3">
  <h2 className="font-heading font-semibold text-sm text-s-ink flex items-center gap-2">
    <Tag className="w-4 h-4 text-s-coral" />
    Promo-Code oder Guthaben
  </h2>
  <input className="px-3 py-2 rounded-input ..." />
  <InteractiveHoverButton ...>Anwenden</InteractiveHoverButton>
```
**Issues:**
- `rounded-card` → `rounded-[12px]`
- `h2` heading — should use eyebrow pattern
- `py-2` input → `py-3.5`
- `rounded-input` → `rounded-[10px]`

### ⚠️ BE CAREFUL — the promo validation logic (`handlePromoValidate`, `promoResult`, `promoError` state) must remain entirely untouched.

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 355–386** — promo card:
```tsx
<div className="bg-white rounded-[12px] border border-s-ink/[0.07] p-5 space-y-3"
  style={{ boxShadow: "0 1px 2px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.06)" }}>
  <div className="flex items-center gap-2">
    <Tag className="w-3.5 h-3.5 text-s-coral" />
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40">
      Promo-Code oder Guthaben
    </p>
  </div>

  <div className="flex gap-2">
    <input type="text"
      value={promoCode}
      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
      placeholder="Code eingeben"
      disabled={!!promoResult}
      className="flex-1 px-4 py-3.5 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink uppercase tracking-[.08em] placeholder:text-s-ink/25 placeholder:normal-case placeholder:tracking-normal focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none disabled:opacity-50 transition-colors" />
    {/* Keep InteractiveHoverButton — style fix in P11 */}
    {promoResult ? (
      <button onClick={() => { setPromoResult(null); setPromoCode(""); }}
        className="px-4 py-3.5 rounded-[10px] border border-s-ink/[0.08] text-xs font-heading font-bold text-s-ink/50 hover:border-s-ink/20 transition-colors">
        Entfernen
      </button>
    ) : (
      <InteractiveHoverButton onClick={handlePromoValidate}
        disabled={promoLoading || !promoCode.trim()}
        text={promoLoading ? "..." : "Anwenden"}
        className="px-5 rounded-btn shadow-coral-glow disabled:opacity-50" />
    )}
  </div>
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P5: promo card → 12px radius, eyebrow label, py-3.5 input, 10px radius"`

---

## Phase 6 — Promo Error + Success States

### Current state (checkout/page.tsx lines 388–396)
```tsx
{promoError && <p className="text-xs text-s-coral">{promoError}</p>}

{promoResult && (
  <div className="flex items-center justify-between bg-s-coral/5 border border-s-coral/15 rounded-input px-3 py-2">
    <span className="text-sm text-s-coral font-medium">{promoResult.code} angewendet</span>
    <span className="text-sm data-text font-bold text-s-coral">-{formatCurrency(...)}</span>
  </div>
)}
```
**Issues:**
- `promoError` — plain `<p>` with no icon → upgrade to inline error card
- `promoResult` success — `rounded-input` → `rounded-[10px]`
- Success: `font-medium` → `font-heading font-semibold`

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 388–396** — promo states:
```tsx
{promoError && (
  <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20"
    style={{ background: "rgba(232,98,74,.06)" }}>
    <AlertCircle size={13} className="text-s-coral shrink-0" />
    <p className="text-xs font-body text-s-coral">{promoError}</p>
  </div>
)}
{promoResult && (
  <div className="flex items-center justify-between rounded-[10px] border border-[#4CAF6F]/25 px-3 py-2.5"
    style={{ background: "rgba(76,175,111,.06)" }}>
    <div className="flex items-center gap-2">
      <CheckCircle size={13} className="text-[#4CAF6F] shrink-0" />
      <span className="text-xs font-heading font-semibold text-[#1f6535]">{promoResult.code} angewendet</span>
    </div>
    <span className="text-xs font-heading font-bold text-[#1f6535]">-{formatCurrency(promoResult.discount_amount, locale)}</span>
  </div>
)}
```

Add `AlertCircle, CheckCircle` to the import at line 14.

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P6: promo states → inline error card with icon, green success card"`

---

## Phase 7 — User Credits Display

### Current state (checkout/page.tsx lines 400–408)
```tsx
<div className="flex items-center justify-between bg-s-bg-surface rounded-input px-3 py-2">
  <span className="text-sm text-s-ink/60 flex items-center gap-1.5">
    <Wallet className="w-3.5 h-3.5 text-s-coral" />
    Guthaben verfügbar
  </span>
  <span className="text-sm data-text font-semibold text-s-coral">{amount}</span>
</div>
```
- `rounded-input` → `rounded-[10px]`
- `text-sm` → `text-xs` + `font-heading`
- `bg-s-bg-surface` → `rgba(26,18,9,.04)` (warm sunken token)
- Credits should feel like a "bonus" — add amber accent instead of coral

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 400–408** — credits row:
```tsx
{userCredits > 0 && !promoResult && (
  <div className="flex items-center justify-between rounded-[10px] px-3 py-2.5"
    style={{ background: "rgba(212,135,10,.06)", border: "1px solid rgba(212,135,10,.15)" }}>
    <div className="flex items-center gap-2">
      <Wallet className="w-3.5 h-3.5 text-s-amber shrink-0" />
      <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-amber/80">
        Guthaben verfügbar
      </p>
    </div>
    <span className="text-xs font-heading font-bold text-s-amber">{formatCurrency(userCredits, locale)}</span>
  </div>
)}
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P7: credits display → amber tint, 10px radius, eyebrow label"`

---

## Phase 8 — At-Salon Confirm Card: Zone 3 Polish

### Current state (checkout/page.tsx lines 412–432)
```tsx
<div className="bg-white rounded-card border border-s-ink/5 shadow-warm-lg p-5">
  <h2 className="font-heading font-bold text-base text-s-ink mb-3">Zahlung vor Ort</h2>
  <p className="text-sm text-s-ink/60 mb-4">Keine Online-Zahlung nötig.</p>
  <InteractiveHoverButton ...>Termin bestätigen</InteractiveHoverButton>
  <p className="text-xs text-center text-s-ink/40 mt-3">...</p>
```
- `rounded-card` → `rounded-[12px]`
- `h2` → eyebrow + heading
- Add a visual "shield" or cash icon near the heading to reinforce no-card-needed

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 412–432** — at-salon card:
```tsx
<div className="bg-white rounded-[12px] border border-s-ink/[0.07] p-5"
  style={{ boxShadow: "0 1px 2px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.06)" }}>
  <div className="flex items-start gap-3 mb-4">
    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
      style={{ background: "rgba(76,175,111,.10)" }}>
      <Wallet size={17} className="text-[#4CAF6F]" />
    </div>
    <div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 mb-0.5">
        Zahlungsart
      </p>
      <h2 className="font-heading font-bold text-base text-s-ink">Zahlung vor Ort</h2>
      <p className="text-xs font-body text-s-ink/50 mt-1">Keine Online-Zahlung nötig. Du bezahlst direkt im Salon.</p>
    </div>
  </div>
  {error && (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20 mb-3"
      style={{ background: "rgba(232,98,74,.06)" }}>
      <AlertCircle size={13} className="text-s-coral shrink-0" />
      <p className="text-xs font-body text-s-coral">{error}</p>
    </div>
  )}
  <InteractiveHoverButton onClick={handleAtSalonConfirm} disabled={confirmingAtSalon}
    text={confirmingAtSalon ? "Wird bestätigt..." : "Termin bestätigen"}
    className="w-full py-4 rounded-btn shadow-coral-glow disabled:opacity-60" />
  <p className="text-[10px] text-center font-heading uppercase tracking-[.10em] text-s-ink/25 mt-3">
    Kostenlose Stornierung bis {intent.free_cancel_hours ?? 24}h vorher
  </p>
</div>
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P8: at-salon card → green wallet icon, 12px radius, warm error inline"`

---

## Phase 9 — At-Salon Success State: Warm Card

### Current state (checkout/page.tsx lines 261–272)
```tsx
<div className="rounded-card border border-s-coral/20 bg-s-coral/5 p-8 flex flex-col items-center gap-4 text-center max-w-sm">
  <PartyPopper size={48} className="text-s-coral" />
  <p className="font-heading font-bold text-xl text-s-ink">Buchung bestätigt!</p>
  <p className="text-sm text-s-ink/60">Du zahlst direkt im Salon. Bis bald!</p>
  <a href="..." className="px-6 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium ...">
```
- `rounded-card` → `rounded-[16px]`
- `PartyPopper size={48}` — very large icon. Use an icon box instead: 64px box with icon inside
- CTA: `font-medium` → `font-heading font-bold uppercase`

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 261–272** — success state:
```tsx
if (atSalonConfirmed) {
  return (
    <div className="min-h-screen bg-s-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="rounded-[16px] border border-[#4CAF6F]/20 p-8 flex flex-col items-center gap-4"
          style={{ background: "rgba(76,175,111,.06)", boxShadow: "0 4px 16px rgba(26,18,9,.06)" }}>
          {/* Icon box */}
          <div className="w-16 h-16 rounded-[18px] flex items-center justify-center"
            style={{ background: "rgba(76,175,111,.14)" }}>
            <PartyPopper size={28} className="text-[#4CAF6F]" />
          </div>
          <div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-[#4CAF6F] mb-2">
              Buchung bestätigt
            </p>
            <p className="font-heading font-bold text-xl text-s-ink">Termin fixiert!</p>
            <p className="text-xs font-body text-s-ink/50 mt-1 leading-relaxed">Du zahlst direkt im Salon. Bis bald!</p>
          </div>
          <a href={`/${locale}/profile`}
            className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
            style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
            Meine Buchungen
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P9: success state → green card, icon box, eyebrow, coral CTA"`

---

## Phase 10 — Payment Card (Stripe Elements): Header Only

### Current state (checkout/page.tsx lines 434–463)
```tsx
<div className="bg-white rounded-card border border-s-ink/5 shadow-warm-lg p-5">
  <h2 className="font-heading font-bold text-base text-s-ink mb-4">Zahlung</h2>
  {clientSecret ? (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: {...} }}>
      <CheckoutForm ... />
    </Elements>
  ) : <Spinner />}
```

### ⚠️ BE CAREFUL
- The `<Elements>` wrapper, `appearance` object, `clientSecret`, and `<CheckoutForm>` inner component must remain EXACTLY as-is.
- Only change the outer card container and section heading.

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 434–435** — payment card outer:
```tsx
<div className="bg-white rounded-[12px] border border-s-ink/[0.07] overflow-hidden"
  style={{ boxShadow: "0 1px 2px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.06)" }}>
  {/* Payment card header */}
  <div className="px-5 pt-5 pb-4 border-b border-s-ink/[0.05] flex items-center gap-2">
    <Lock size={13} className="text-s-ink/35 shrink-0" />
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/35">
      Sichere Zahlung
    </p>
  </div>
  <div className="p-5">
    {clientSecret ? (
      <Elements ...>
        <CheckoutForm ... />
      </Elements>
    ) : <div className="flex justify-center py-6"><Spinner size="lg" /></div>}
  </div>
</div>
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P10: payment card → lock icon header, 12px radius, section divider"`

---

## Phase 11 — InteractiveHoverButton: Read + Inspect

### ⚠️ Must read `components/ui/interactive-hover-button.tsx` before any changes

```bash
cat components/ui/interactive-hover-button.tsx
```

Expected issues:
- May use `scale` transform on hover — NEVER
- May use non-coral colours — check
- `shadow-coral-glow` on the surrounding div is already passed as `className`

Expected V3-compliant replacement if violations found:
```tsx
// V3 checkout CTA — Zone 3 spec:
<button type={type} disabled={disabled} onClick={onClick}
  className={cn(
    "flex items-center justify-center gap-2 text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all disabled:opacity-60",
    className
  )}
  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
  {loading && <Spinner size="sm" invert />}
  {text}
</button>
```

**Git commit:** `git add components/ui/interactive-hover-button.tsx && git commit -m "CHECKOUT-P11: InteractiveHoverButton → remove scale hover if present, coral glow spec"`

---

## Phase 12 — Payment Trust Strip

### Current state (checkout/page.tsx lines 467–475)
```tsx
<div className="flex items-center justify-center gap-4 text-xs text-s-ink/30 pb-8 flex-wrap">
  <span className="flex items-center gap-1"><Lock size={11} /> 256-bit SSL</span>
  ·
  <span className="flex items-center gap-1"><CreditCard size={11} /> Visa, Mastercard, Apple Pay</span>
  ·
  <span>TWINT</span>
  ·
  <span className="flex items-center gap-1"><Shield size={11} /> Powered by Stripe</span>
</div>
```
- `text-xs` → `text-[9px] font-heading uppercase tracking-[.10em]`
- `pb-8` → `py-6` to add top padding too
- Separators: `·` → `|` for cleaner look in uppercase context

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 467–475** — trust strip:
```tsx
<div className="flex items-center justify-center flex-wrap gap-3 py-6">
  {[
    { icon: Lock,       label: "256-bit SSL" },
    { icon: CreditCard, label: "Visa · Mastercard · Apple Pay" },
    { icon: Shield,     label: "Powered by Stripe" },
  ].map(({ icon: Icon, label }) => (
    <span key={label} className="flex items-center gap-1.5 text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/25">
      <Icon size={10} />
      {label}
    </span>
  ))}
  <span className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/25">TWINT</span>
</div>
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P12: trust strip → 9px font-heading uppercase, icon mapping"`

---

## Phase 13 — Loading Skeleton

### Current state (checkout/page.tsx lines 235–241)
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-s-bg-surface flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
```
- Full page spinner is jarring on a checkout page
- Replace with a skeleton that mirrors the checkout layout

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 235–241** — loading state:
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-s-bg-base py-12 px-4">
      <div className="max-w-lg mx-auto space-y-4 animate-pulse">
        {/* Summary card skeleton */}
        <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-5">
          <div className="h-2.5 w-20 bg-s-bg-sunken rounded mb-3" />
          <div className="h-4 w-36 bg-s-bg-sunken rounded mb-5" />
          <div className="space-y-3">
            <div className="h-3 w-48 bg-s-bg-sunken rounded" />
            <div className="h-3 w-40 bg-s-bg-sunken rounded" />
            <div className="h-3 w-32 bg-s-bg-sunken rounded" />
          </div>
        </div>
        {/* Payment card skeleton */}
        <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-5">
          <div className="h-3 w-28 bg-s-bg-sunken rounded mb-4" />
          <div className="h-10 w-full bg-s-bg-sunken rounded-[10px] mb-3" />
          <div className="h-10 w-full bg-s-bg-sunken rounded-[10px] mb-3" />
          <div className="h-12 w-full bg-s-bg-sunken rounded-btn" />
        </div>
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P13: loading skeleton → summary + payment card shapes, no spinner"`

---

## Phase 14 — Error State: Warm Error Card

### Current state (checkout/page.tsx lines 243–252)
```tsx
<div className="min-h-screen bg-s-bg-surface flex items-center justify-center">
  <div className="text-center p-8">
    <p className="text-s-coral font-medium mb-2">Fehler</p>
    <p className="text-s-ink/60 text-sm">{error}</p>
    <a href="..." className="mt-4 inline-block text-s-coral text-sm underline">Zurück</a>
  </div>
</div>
```
- `font-medium` → `font-heading`
- `text-sm underline` → upgrade to proper outlined link

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 243–252** — error state:
```tsx
if (error || !intent) {
  return (
    <div className="min-h-screen bg-s-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[14px] border border-s-coral/20 p-8 text-center"
        style={{ background: "rgba(232,98,74,.04)", boxShadow: "0 4px 16px rgba(26,18,9,.06)" }}>
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(232,98,74,.12)" }}>
          <AlertCircle size={22} className="text-s-coral" />
        </div>
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-coral mb-1">Fehler</p>
        <p className="text-xs font-body text-s-ink/55 mb-5">{error ?? "Etwas ist schiefgelaufen."}</p>
        <a href={`/${locale}`}
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-btn border border-s-ink/[0.08] text-xs font-heading font-bold text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-colors">
          Zurück zur Startseite
        </a>
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P14: error state → coral tint card, icon box, outlined back button"`

---

## Phase 15 — Breadcrumb + Free Cancellation Note

### Current state (checkout/page.tsx lines 283–287, 97–99)
```tsx
<div className="max-w-lg mx-auto mb-4 text-xs text-s-ink/40 flex items-center gap-1">
  <a href="..." className="hover:text-s-coral">Startseite</a>
  <ChevronRight className="w-3 h-3" />
  <span className="text-s-ink/60">Buchung abschliessen</span>
</div>
```
Free cancellation note in CheckoutForm (line 97–99):
```tsx
<p className="text-xs text-center text-s-ink/40">
  Kostenlose Stornierung bis {N} Stunden vorher
</p>
```

### Files to modify

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/checkout/page.tsx)
**Lines 283–287** — breadcrumb:
```tsx
<div className="max-w-lg mx-auto mb-4 flex items-center gap-1.5">
  <a href={`/${locale}`}
    className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-s-ink/30 hover:text-s-coral transition-colors">
    Startseite
  </a>
  <ChevronRight className="w-2.5 h-2.5 text-s-ink/20" />
  <span className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-s-ink/50">
    Checkout
  </span>
</div>
```

Free cancellation note:
```tsx
<p className="text-[9px] text-center font-heading uppercase tracking-[.10em] text-s-ink/30 mt-3">
  Kostenlose Stornierung bis {intent.free_cancel_hours ?? 24}h vorher
</p>
```

**Git commit:** `git add app/[locale]/checkout/page.tsx && git commit -m "CHECKOUT-P15: breadcrumb + cancellation note → font-heading uppercase 9-10px"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P11 | Read InteractiveHoverButton | ✅ Start here (read first) |
| P1 | Animate duration | ✅ Independent |
| P13 | Loading skeleton | ✅ Independent |
| P14 | Error state | ✅ Independent |
| P9 | At-salon success state | ✅ Independent |
| P2 | Summary card container | After P11 done |
| P3 | Booking rows | After P2 |
| P4 | Pay-now banner | After P2 |
| P5 | Promo card | After P11 (InteractiveHoverButton context) |
| P6 | Promo error/success | After P5 |
| P7 | Credits display | After P5 |
| P8 | At-salon confirm card | After P11 |
| P10 | Payment card header | After P2 |
| P12 | Trust strip | After P2 |
| P15 | Breadcrumb | Last |

> P1, P9, P13, P14 all parallel.
> P11 must complete before P5, P8.
> P15 last.

---

## ZONE 3 CHECKOUT COMPLIANCE CHECK

```bash
npm run build

# No cold shadows:
grep -n "rgba(0,0,0\|shadow-glass" app/[locale]/checkout/page.tsx
# Expected: 0

# No rounded-card:
grep -n "rounded-card" app/[locale]/checkout/page.tsx
# Expected: 0 (replaced with rounded-[12px] or rounded-[14px])

# No scale hover (only active:scale-[0.98] allowed):
grep -n "hover:scale\|scale-\[1\." app/[locale]/checkout/page.tsx
# Expected: 0

# Stripe Elements appearance unchanged:
grep -n "colorPrimary\|borderRadius.*12px\|fontFamily" app/[locale]/checkout/page.tsx
# Expected: still present with original values

# Manual checklist:
# ✅ Summary card: eyebrow "Deine Buchung", sectioned with divider
# ✅ Pay-now banner: coral left-border accent, text-xl amount
# ✅ Promo error: coral tint card with AlertCircle icon
# ✅ Promo success: green tint card with CheckCircle + discount amount
# ✅ Credits: amber tint banner
# ✅ Loading: skeleton shape (not spinner)
# ✅ Error: coral tint card, icon box, outlined back button
# ✅ At-salon success: green card, icon box, eyebrow "Buchung bestätigt"
# ✅ Stripe Elements: UNCHANGED
# ✅ Trust strip: 9px font-heading uppercase with icons
```
