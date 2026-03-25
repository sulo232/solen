# Booking Flow — Deep-Dive V3 Roadmap

> **Scope:** `components/BookingCalendar.tsx` (895 lines) + all sub-components: `booking/ServiceCart.tsx`, `booking/StaffPicker.tsx`, `booking/GuestBookingForm.tsx`, `booking/PackageRedeemBanner.tsx`, Stripe payment form.
> **Zone: 3 (Clean Functional)** — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px max border-radius, no decorative shadows.
> **The booking flow is the highest-value user action on the platform. Every pixel counts.**

---

## Zone 3 Rulebook (Strictly Enforced Here)

| Rule | Value |
|---|---|
| Max border-radius | `12px` — use `rounded-[12px]` or `rounded-btn` (which maps to 99px only for pill buttons — NOT cards) |
| Background | `bg-white` or `bg-s-bg-surface` — NO glass |
| Shadows | `shadow-warm-sm` or `shadow-warm-md` only — NO glow, NO xl |
| Typography | `font-heading` for labels, `font-body` for text — NO Bebas Neue |
| Motion | Subtle only — `opacity` + `y: ±8`. NO spring bounce visually. `prefers-reduced-motion` enforced. |
| Buttons | `rounded-btn` (99px) for CTAs, `rounded-[12px]` for input fields |

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — BookingCalendar wrapper | 🟡 Medium | Visual-only outer container, logic unchanged |
| P2 — Step indicator | 🟢 Low | Visual-only, no logic |
| P3 — Date picker strip | 🟡 Medium | Picker is `@internationalized/date` — touch only container |
| P4 — Time slot grid | 🟡 Medium | Slot buttons have active/selected states — test both |
| P5 — StaffPicker | 🟡 Medium | Active state uses ring + scale — NEVER rule (no scale in Z3) |
| P6 — ServiceCart | 🟢 Low | Visual-only restyle |
| P7 — Addon checkboxes | 🟢 Low | CSS only |
| P8 — Gift card + referral inputs | 🟢 Low | Input styling |
| P9 — Total + CTA button | 🟢 Low | High visibility — test thoroughly |
| P10 — GuestBookingForm | 🟢 Low | Input + field styling |
| P11 — Stripe payment area | 🟡 Medium | Stripe Elements is sandboxed — only style the wrapper |
| P12 — Booking confirmation screen | 🟢 Low | Success state visual |
| P13 — Recurring / Acquisition fields | 🟢 Low | Select/dropdown styling |
| P14 — Package redeem banner | 🟢 Low | Visual upgrade |
| P15 — Error + loading states | 🟢 Low | Toast + spinner polish |

---

## Phase 1 — BookingCalendar: Clean Zone 3 Container

### Current state (BookingCalendar.tsx — outer container area)
- Rendered inside the salon profile sidebar (wrapped in glass by the sidebar — Phase 12 of SP roadmap).
- The `BookingCalendar` itself should be background-neutral so the sidebar wrapper controls the glass.
- Check for any `bg-white rounded-card shadow-*` on the outer BookingCalendar div — remove if present.

### ⚠️ BE CAREFUL
- BookingCalendar has 895 lines and multiple internal steps (step machine). Do NOT try to read and refactor in one pass.
- Focus on: outer container bg, section headings typography, step-level container padding.
- DO NOT touch the `useEffect` fetching, `salonId`, `serviceId`, `staffMemberId` props, or Stripe integration.

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
Look for the outermost `<div>` in the return statement and ensure it's transparent:
```tsx
// Outer wrapper — no bg, no shadow (sidebar provides the glass)
<div className="w-full">
  {/* All step content inside */}
</div>
```

Section headings inside BookingCalendar — upgrade to eyebrow style:
```tsx
// Every internal "section header" label (e.g. "Wähle einen Termin")
// Before:
<p className="text-sm font-medium text-s-ink/50 uppercase tracking-wide px-4 pt-4">
// After:
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40 px-4 pt-4">
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P1: BookingCalendar outer container neutral, section label eyebrow style"`

---

## Phase 2 — Step Progress Indicator

### Current state
- `BookingCalendar` uses internal state to move between steps (date → staff → confirm → pay)
- There is likely NO visual step indicator showing which step the user is on — verify

### ⚠️ BE CAREFUL
- If a step indicator doesn't exist, add one above the content area, NOT inside the scrollable content.
- Use a simple 4-dot or 4-segment linear bar — NOT numbered circles (too heavy for Zone 3).

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
Add before the step content area:
```tsx
{/* Step progress — linear track */}
<div className="px-4 pt-4 pb-2">
  <div className="flex gap-1.5">
    {["Datum", "Team", "Details", "Zahlung"].map((label, i) => {
      const stepIndex = { date: 0, staff: 1, confirm: 2, payment: 3 }[currentStep] ?? 0;
      return (
        <div key={label} className="flex-1">
          <div className={`h-1 rounded-full transition-all duration-300 ${
            i <= stepIndex ? "bg-s-coral" : "bg-s-ink/10"
          }`} />
          <p className={`text-[9px] font-heading uppercase tracking-[.12em] mt-1 ${
            i === stepIndex ? "text-s-coral font-bold" : "text-s-ink/30"
          }`}>{label}</p>
        </div>
      );
    })}
  </div>
</div>
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P2: add step progress bar — coral active track, label below"`

---

## Phase 3 — Date Picker Strip: Horizontal Chip Scroll

### Current state (inside BookingCalendar — date selection area)
- Uses `SolenDatePicker` from `@internationalized/date` — calendar popup
- Date quick chips (Heute, Morgen) are likely present

### ⚠️ BE CAREFUL
- Don't touch `SolenDatePicker` internals — only restyle the chip buttons around it.
- The date chip buttons in Zone 3 should NOT use the pill filter style from Zone 1/2. Use `rounded-[12px]` instead of `rounded-pill`.
- Active date chip: `bg-s-coral text-white border-s-coral shadow-warm-sm` ✅
- Inactive chip: `border border-s-ink/10 bg-white text-s-ink/60` (no backdrop-blur in Zone 3).

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
Update date chip buttons to Zone 3 spec:
```tsx
// Zone 3 chip — no glass, no blur, rounded-[12px]
const z3ChipActive = "px-4 py-2 rounded-[12px] text-[11px] font-heading font-bold uppercase tracking-[.06em] bg-s-coral text-white border border-s-coral shadow-[0_2px_4px_rgba(232,98,74,.20)]";
const z3ChipInactive = "px-4 py-2 rounded-[12px] text-[11px] font-heading font-bold uppercase tracking-[.06em] bg-white border border-s-ink/10 text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-colors";
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P3: date chips → Zone 3 spec, rounded-[12px], no glass"`

---

## Phase 4 — Time Slot Grid: Clear Active State + Time Group Labels

### Current state (inside BookingCalendar — time slot selection)
- `getTimeGroup()` function ✅ — slots grouped into Morgens/Nachmittags/Abends
- `GROUP_LABELS` ✅ already defined
- Slot buttons: need to verify active/selected state colours

### ⚠️ BE CAREFUL
- Available slot: `bg-white border border-s-ink/10 text-s-ink hover:border-s-coral` = Zone 3 clean
- Selected slot: `bg-s-coral text-white border-s-coral` ✅
- Unavailable slot: `bg-s-bg-sunken text-s-ink/25 cursor-not-allowed border-transparent` — no interaction
- Group label: `text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber` — amber eyebrow per V3

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
Time group label:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-2 mt-4 first:mt-0">
  {GROUP_LABELS[group]}
</p>
```

Slot button:
```tsx
<button
  key={slot.id}
  disabled={!slot.available}
  onClick={() => setSelectedSlot(slot)}
  className={`px-4 py-2.5 rounded-[12px] text-xs font-heading font-bold transition-all duration-150 border ${
    selectedSlot?.id === slot.id
      ? "bg-s-coral text-white border-s-coral shadow-[0_2px_4px_rgba(232,98,74,.20)]"
      : slot.available
        ? "bg-white border-s-ink/10 text-s-ink hover:border-s-coral/50 hover:text-s-coral"
        : "bg-s-bg-sunken border-transparent text-s-ink/20 cursor-not-allowed"
  }`}>
  {new Date(slot.start_time).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
</button>
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P4: time slots → Zone 3 styled, amber group labels, clear selected state"`

---

## Phase 5 — StaffPicker: Remove Scale, Fix Active State

### Current state (StaffPicker.tsx lines 25–46)
```tsx
className="... border-s-coral ring-2 ring-s-coral ring-offset-2 bg-s-coral-subtle scale-105"
```
- `scale-105` on active staff card — **NEVER rule in Zone 3** (no scale on interactive elements in functional zones)
- `hover:-translate-y-[5px]` ✅ — correct V3 hover for staff cards

### ⚠️ BE CAREFUL
- StaffPicker is also used in other contexts. Keep the hover translateY.
- Replace `scale-105` with a solid `border-s-coral ring-2` focus treatment only — no scale.
- `bg-s-coral-subtle` for selected is fine ✅ — it's a subtle tint, not a blob.

### Files to modify

#### [MODIFY] [StaffPicker.tsx](file:///c:/Users/sulod/solen/components/booking/StaffPicker.tsx)
**Lines 25–46** — Both "Egal" and staff card buttons

```tsx
// Section label:
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40 mb-3">
  Mitarbeiter wählen
</p>

// Card — active state (remove scale-105):
className={`shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-[14px] border transition-all duration-200 ${
  isSelected
    ? "border-s-coral ring-2 ring-s-coral/30 bg-s-coral/[0.06]" // no scale
    : "border-s-ink/[0.08] bg-white dark:bg-s-dm-surface hover:-translate-y-[4px] hover:border-s-coral/40 hover:shadow-warm-sm"
}`}

// Name label: font-heading font-semibold (was font-medium)
<span className="text-xs font-heading font-semibold text-s-ink truncate max-w-[80px] text-center">
  {s.name}
</span>
```

**Git commit:** `git add components/booking/StaffPicker.tsx && git commit -m "BF-P5: StaffPicker — remove scale-105, ring active state, Zone 3 14px radius"`

---

## Phase 6 — ServiceCart: Zone 3 Clean Container + Line Items

### Current state (ServiceCart.tsx line 66)
```tsx
<div className="rounded-card border border-s-ink/5 bg-white dark:bg-s-dm-surface p-4 space-y-4">
```
- `rounded-card` — check value, should be `rounded-[12px]` in Zone 3
- `bg-white` ✅ no glass — Zone 3 correct
- `border-s-ink/5` — correct

### Files to modify

#### [MODIFY] [ServiceCart.tsx](file:///c:/Users/sulod/solen/components/booking/ServiceCart.tsx)
**Line 66** — container:
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] bg-white dark:bg-s-dm-surface p-5 space-y-4"
  style={{ boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
```

Section header row:
```tsx
// Before: ShoppingBag icon + "Warenkorb"
// After — eyebrow style label:
<div className="flex items-center justify-between mb-1">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40">Warenkorb</p>
  <ShoppingBag size={13} className="text-s-ink/25" />
</div>
```

Service line items:
```tsx
// Service name — bump to font-heading font-semibold
<p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
  {locale === "en" ? svc.name_en : svc.name_de}
</p>
// Duration — amber eyebrow
<p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/35">{svc.duration_minutes} Min</p>

// Price — coral, larger
<span className="data-text font-bold text-base text-s-ink">{formatCurrency(svc.price, locale)}</span>
```

Stylist name line:
```tsx
// Before:
<p className="text-xs text-s-ink/40">Stylist: {staffName}</p>
// After:
<div className="flex items-center gap-1.5 text-xs text-s-ink/50">
  <span className="w-4 h-4 rounded-full bg-s-bg-sunken flex items-center justify-center text-[10px]">✂</span>
  {staffName}
</div>
```

**Git commit:** `git add components/booking/ServiceCart.tsx && git commit -m "BF-P6: ServiceCart — Zone 3 12px radius, eyebrow labels, service line item polish"`

---

## Phase 7 — Addon Checkboxes: Custom Checkbox Style

### Current state (ServiceCart.tsx lines 88–102)
```tsx
<input type="checkbox" className="w-3.5 h-3.5 rounded accent-s-coral" />
```
- Native checkbox with `accent-s-coral` — works but visually inconsistent between browsers
- `<Plus>` icon next to addon name is confusing — shows as icon before label

### Files to modify

#### [MODIFY] [ServiceCart.tsx](file:///c:/Users/sulod/solen/components/booking/ServiceCart.tsx)
**Lines 88–102** — Replace `<label>` with styled toggle row:
```tsx
{addons[svc.id]?.map(addon => (
  <label key={addon.id}
    className="flex items-center gap-3 py-2.5 px-3 rounded-[10px] cursor-pointer hover:bg-s-bg-base transition-colors"
    style={{ border: selectedAddons.has(addon.id) ? "1px solid rgba(232,98,74,.25)" : "1px solid rgba(26,18,9,.06)" }}>
    
    {/* Custom checkbox box */}
    <div className={`w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-all ${
      selectedAddons.has(addon.id)
        ? "bg-s-coral border-s-coral"
        : "border-s-ink/15 bg-white"
    }`}>
      {selectedAddons.has(addon.id) && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
    <input type="checkbox" checked={selectedAddons.has(addon.id)} onChange={() => toggleAddon(addon.id)} className="sr-only" />
    
    <div className="flex-1 min-w-0">
      <p className="text-xs font-heading font-semibold text-s-ink">{addon.name}</p>
      <p className="text-[9px] font-heading uppercase tracking-[.08em] text-s-ink/35">{addon.duration_minutes} Min</p>
    </div>
    <span className="text-xs font-heading font-bold text-s-ink/70">+{formatCurrency(addon.price, locale)}</span>
  </label>
))}
```

**Git commit:** `git add components/booking/ServiceCart.tsx && git commit -m "BF-P7: addon checkboxes → custom coral checkbox, full-row tap target"`

---

## Phase 8 — Gift Card + Referral Code Inputs

### Current state (ServiceCart.tsx lines 110–132)
```tsx
<input className="flex-1 px-2 py-1.5 rounded-input border border-s-ink/10 bg-s-bg-surface text-xs ..." />
```
- `rounded-input` — need to verify this maps to `6px` (Zone 3 max 12px ✅)
- `py-1.5` — too small tap target (18px height). Min should be `py-2.5` (10px each side)
- Icon sits outside the input — should be left-inset into the input field

### Files to modify

#### [MODIFY] [ServiceCart.tsx](file:///c:/Users/sulod/solen/components/booking/ServiceCart.tsx)
**Lines 110–132** — Inputs

```tsx
{/* Code inputs section */}
<div className="space-y-2 pt-3 border-t border-s-ink/[0.06]">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/35">Rabatt-Codes</p>
  
  {/* Gift card */}
  <div className="relative">
    <Gift size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
    <input type="text" value={giftCardCode} onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
      placeholder="Gutschein-Code"
      className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-s-ink/[0.08] bg-s-bg-base text-xs font-body text-s-ink placeholder:text-s-ink/35 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors" />
  </div>
  
  {/* Referral */}
  <div className="relative">
    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
    <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
      placeholder="Empfehlungs-Code"
      className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-s-ink/[0.08] bg-s-bg-base text-xs font-body text-s-ink placeholder:text-s-ink/35 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors" />
  </div>
</div>
```

**Git commit:** `git add components/booking/ServiceCart.tsx && git commit -m "BF-P8: gift/referral code inputs — icon-inset, larger tap targets, 10px radius"`

---

## Phase 9 — Total Line + Primary CTA Button

### Current state (ServiceCart.tsx lines 134–151)
```tsx
// Total:
<p className="text-xs text-s-ink/40">Total · {totalDuration} Min</p>
<span className="data-text font-bold text-lg text-s-coral">{formatCurrency(totalPrice, locale)}</span>

// CTA button:
<button className="w-full py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-semibold text-sm hover:bg-s-coral/90 ...">
  Bezahlen & Buchen
</button>
```
- Total line is fine but visually weak — no separation between price and context
- CTA button: `font-semibold text-sm` → should be `font-heading font-bold text-xs uppercase tracking-[.04em]`
- `active:scale-[0.98]` ✅ — correct active feedback
- Missing shadow on the CTA button

### Files to modify

#### [MODIFY] [ServiceCart.tsx](file:///c:/Users/sulod/solen/components/booking/ServiceCart.tsx)
**Lines 134–151** — Total + CTA

```tsx
{/* Total row */}
<div className="flex justify-between items-center pt-3 border-t border-s-ink/[0.06]">
  <div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/35">Gesamt</p>
    <p className="text-xs text-s-ink/40 mt-0.5">{totalDuration} Minuten</p>
  </div>
  <div className="text-right">
    <span className="font-heading font-bold text-2xl text-s-ink">{formatCurrency(totalPrice, locale)}</span>
    <p className="text-[9px] text-s-ink/35 mt-0.5">inkl. MwSt.</p>
  </div>
</div>

{/* CTA */}
<button
  onClick={() => onCheckout({ totalPrice, totalDuration, addonIds: [...selectedAddons], giftCardCode, referralCode })}
  disabled={checking}
  className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.06em] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.30), 0 6px 20px rgba(232,98,74,.20)" }}>
  {checking && <Spinner size="sm" invert />}
  Bezahlen & Buchen
</button>
```

**Git commit:** `git add components/booking/ServiceCart.tsx && git commit -m "BF-P9: total line polish, CTA button coral shadow, uppercase tracking"`

---

## Phase 10 — GuestBookingForm: Input Polish + Section Header

### Current state (GuestBookingForm.tsx lines 40–103)
- Container: `rounded-card border border-s-ink/5 bg-s-bg-surface` — Zone 3 correct ✅ (no glass)
- Header: `<p className="text-sm font-medium">Gastbuchung — deine Daten</p>` — not V3 label style
- Input height: `py-2` (~32px) — minimum, acceptable
- Focus ring: `focus:ring-2 focus:ring-s-coral/20` ✅
- CTA: `rounded-btn bg-s-coral text-sm font-medium` — missing `font-heading font-bold uppercase`
- Disclaimer text: ✅ (good user info)

### Files to modify

#### [MODIFY] [GuestBookingForm.tsx](file:///c:/Users/sulod/solen/components/booking/GuestBookingForm.tsx)

**Line 41** — container:
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] bg-white dark:bg-s-dm-surface p-5 space-y-4"
  style={{ boxShadow: "0 1px 2px rgba(26,18,9,.05)" }}>
```

**Line 42** — header:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40">
  Gastbuchung
</p>
<p className="font-heading font-semibold text-sm text-s-ink mt-0.5">Deine Kontaktdaten</p>
```

**Lines 44–56, 60–73, 76–89** — Label style:
```tsx
// All label elements:
<label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
  <User size={10} className="inline mr-1" /> Name *
</label>
```

**Input style** — bump padding:
```tsx
className="w-full px-3.5 py-3 rounded-[10px] border border-s-ink/[0.08] bg-s-bg-base text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
```

**Line 96–102** — CTA button:
```tsx
<button onClick={handleSubmit} disabled={submitting}
  className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all disabled:opacity-50"
  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 6px 20px rgba(232,98,74,.15)" }}>
  Weiter zur Zahlung →
</button>
```

**Git commit:** `git add components/booking/GuestBookingForm.tsx && git commit -m "BF-P10: GuestBookingForm — eyebrow header, larger input padding, CTA coral shadow"`

---

## Phase 11 — Stripe Payment Area: Branded Wrapper

### Current state (StripePaymentForm inside BookingCalendar)
- Stripe `PaymentElement` renders inside a sandboxed iframe — cannot style internals
- Only style the wrapper `<div>` around it

### ⚠️ BE CAREFUL
- NEVER apply `border-radius` or `overflow-hidden` directly on the `PaymentElement` — it can break the iframe.
- Only edit the outer wrapper `<div>` and the submit button.
- The submit button must use the same coral CTA style as Phase 9.

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
Find the `StripePaymentForm` component and update its return:
```tsx
return (
  <div className="space-y-5">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40">Zahlung</p>
    
    {/* Stripe sandbox — wrapper only */}
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4"
      style={{ background: "#FFFFFF", boxShadow: "0 1px 2px rgba(26,18,9,.05)" }}>
      <PaymentElement options={{ layout: "tabs" }} />
    </div>
    
    {error && (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-s-coral/[0.08] border border-s-coral/20">
        <span className="text-xs text-s-coral font-body">{error}</span>
      </div>
    )}
    
    <button type="button" onClick={handlePay} disabled={processing}
      className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.30), 0 6px 20px rgba(232,98,74,.20)" }}>
      {processing ? <Spinner size="sm" invert /> : <CreditCard size={14} />}
      {processing ? "Verarbeitung…" : `CHF ${totalPrice.toFixed(2)} bezahlen`}
    </button>
    
    <p className="text-[10px] text-s-ink/35 text-center">
      🔒 Verschlüsselt durch Stripe · nDSG-konform
    </p>
  </div>
);
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P11: Stripe wrapper — branded container, CTA with price, trust note"`

---

## Phase 12 — Booking Confirmation: Success State

### Current state (inside BookingCalendar — confirmed step)
- Likely renders a `<PartyPopper>` icon + confirmation text
- Check if there's an `.ics` calendar download link

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
Find the success/confirmed state and upgrade:
```tsx
<div className="text-center px-4 py-8 space-y-4">
  {/* Success icon */}
  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
    style={{ background: "rgba(76,175,111,.12)" }}>
    <PartyPopper size={28} className="text-[#4CAF6F]" />
  </div>
  
  <div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-[#4CAF6F] mb-2">
      Buchung bestätigt
    </p>
    <p className="font-heading font-bold text-xl text-s-ink">Alles klar!</p>
    <p className="font-body italic text-s-ink/50 text-sm mt-1 leading-relaxed">
      Dein Termin ist gebucht. Du erhältst eine Bestätigung per E-Mail.
    </p>
  </div>
  
  {/* Booking summary box */}
  <div className="rounded-[12px] border border-s-ink/[0.06] p-4 text-left space-y-2"
    style={{ boxShadow: "0 1px 2px rgba(26,18,9,.05)" }}>
    <div className="flex justify-between text-sm">
      <span className="text-s-ink/50">Datum</span>
      <span className="font-heading font-semibold text-s-ink">{bookingDate}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-s-ink/50">Salon</span>
      <span className="font-heading font-semibold text-s-ink">{salonName}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-s-ink/50">Total</span>
      <span className="font-heading font-bold text-s-ink">{formatCurrency(totalPrice, locale)}</span>
    </div>
  </div>
  
  {/* .ics download */}
  <a href={icsUrl} download="termin.ics"
    className="flex items-center justify-center gap-2 w-full py-3 rounded-btn border border-s-ink/10 text-xs font-heading font-bold uppercase tracking-[.04em] text-s-ink/60 hover:border-s-coral hover:text-s-coral transition-colors">
    📅 Zum Kalender hinzufügen
  </a>
</div>
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P12: booking confirmation — success icon, summary box, calendar download CTA"`

---

## Phase 13 — Recurring Booking + Acquisition Dropdowns

### Current state (inside BookingCalendar)
- `FREQ_OPTIONS` (weekly/biweekly/monthly) rendered as `<select>` or chips
- `ACQUISITION_SOURCES` dropdown "Wie hast du von uns erfahren?"

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
All `<select>` elements — Zone 3 styled:
```tsx
<select className="w-full px-3.5 py-3 rounded-[10px] border border-s-ink/[0.08] bg-s-bg-base text-sm font-body text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors appearance-none"
  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%231A1209' stroke-opacity='0.4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
           backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
  {options.map(o => <option key={o.value} value={o.value}>{o.label_de}</option>)}
</select>
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P13: recurring + acquisition dropdowns → Zone 3 styled select with arrow"`

---

## Phase 14 — Package Redeem Banner: Compact Info Card

### Current state (PackageRedeemBanner.tsx)
- Likely renders a coral/amber strip with package session info

### Files to modify

#### [MODIFY] [PackageRedeemBanner.tsx](file:///c:/Users/sulod/solen/components/booking/PackageRedeemBanner.tsx)
```tsx
<div className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
  style={{ background: "rgba(212,135,10,.08)", border: "1px solid rgba(212,135,10,.20)" }}>
  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
    style={{ background: "rgba(212,135,10,.14)" }}>
    <Package size={15} className="text-s-amber" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-xs font-heading font-bold text-s-amber-text truncate">{packageName}</p>
    <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/40 mt-0.5">
      {sessionsUsed}/{totalSessions} Sessions genutzt
    </p>
  </div>
  <span className="text-xs font-heading font-bold text-s-amber-text">{remaining} übrig</span>
</div>
```

**Git commit:** `git add components/booking/PackageRedeemBanner.tsx && git commit -m "BF-P14: package banner → amber glass tint, icon box, compact layout"`

---

## Phase 15 — Error + Loading States

### Current state (inside BookingCalendar — loading/error handling)
- Loading: `<Spinner size="lg">` centered — generic
- Error: find exact pattern

### ⚠️ BE CAREFUL — Don't remove error catch blocks. Only style the UI.

### Files to modify

#### [MODIFY] [BookingCalendar.tsx](file:///c:/Users/sulod/solen/components/BookingCalendar.tsx)
Slot loading skeleton:
```tsx
// Replace <Spinner> in slot loading state with skeleton grid:
<div className="grid grid-cols-3 gap-2 mt-2">
  {[...Array(9)].map((_, i) => (
    <div key={i} className="h-[40px] rounded-[10px] bg-s-bg-sunken animate-pulse" />
  ))}
</div>
```

Error inline display:
```tsx
<div className="flex items-center gap-2 px-3 py-3 rounded-[10px] border border-s-coral/20"
  style={{ background: "rgba(232,98,74,.06)" }}>
  <CalendarX2 size={15} className="text-s-coral shrink-0" />
  <p className="text-xs font-body text-s-coral">{errorMessage}</p>
</div>
```

**Git commit:** `git add components/BookingCalendar.tsx && git commit -m "BF-P15: slot skeleton grid, inline error card styling"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Calendar outer container | ✅ Start here |
| P2 | Step progress bar | ✅ Independent |
| P3 | Date chips Zone 3 | ✅ Independent |
| P4 | Time slot grid | ✅ Independent |
| P5 | StaffPicker scale fix | ✅ **Do this early — NEVER violation** |
| P6 | ServiceCart container | ✅ Independent |
| P7 | Addon checkboxes | After P6 (same file) |
| P8 | Gift/referral inputs | After P6 (same file) |
| P9 | Total + CTA button | After P6 (same file) |
| P10 | GuestBookingForm | ✅ Independent |
| P11 | Stripe payment wrapper | After P2 step indicator |
| P12 | Booking confirmation | ✅ Independent |
| P13 | Dropdowns (recurring) | ✅ Independent |
| P14 | PackageRedeemBanner | ✅ Independent |
| P15 | Error + skeleton states | Last — after all others |

> P1–P5, P10, P12–P14 all run in parallel.
> P6, P7, P8, P9 run sequentially (same file, same session).
> P15 runs last.

---

## ZONE 3 FINAL COMPLIANCE CHECK

```bash
npm run build

# After all phases:
# Verify NO glass in booking flow:
grep -rn "backdrop-blur\|glass\|rounded-blob\|BlobBackground" components/BookingCalendar.tsx
# Expected: 0 results

# Verify NO Bebas Neue:
grep -rn "font-display" components/BookingCalendar.tsx components/booking/
# Expected: 0 results

# Verify max border-radius = 12px:
grep -rn "rounded-card\|rounded-xl\|rounded-2xl" components/BookingCalendar.tsx components/booking/
# Expected: 0 results (use rounded-[12px] only)

# All borders should be warm:
grep -rn "rgba(0,0,0" components/BookingCalendar.tsx components/booking/
# Expected: 0 results

# Manual test checklist:
# ✅ Select a date → date chip highlights coral
# ✅ Select date → time slots load with skeleton → show grouped by time of day
# ✅ Select a time slot → coral selected state
# ✅ Staff picker → coral ring, no scale jump
# ✅ Service cart shows addon checkboxes → custom coral checkbox works
# ✅ Enter gift code → uppercase auto, icon inset
# ✅ Total updates when addon added
# ✅ Submit → Stripe payment form renders
# ✅ Success state shows party icon + summary box
# ✅ prefers-reduced-motion → zero animations
```
