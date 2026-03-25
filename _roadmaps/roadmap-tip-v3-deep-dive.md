# Tip Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/tip/[bookingId]/page.tsx` (143 lines) — QR-triggered tipping flow. 4 states: loading, main form, done, error inline.
> **Zone: 3 (Clean Functional)** — This is a payment screen. Trust is everything. Zero glass, zero blobs. Maximum 12px radius on inputs. All payment logic (`/api/tips`, `handlePay`, `useParams`, `formatCurrency`) is completely untouched.
>
> ⚠️ **CRITICAL:** Multi-locale label object (`labels`), `TIP_PRESETS`, `tipAmount` calculation, `handlePay`, and Stripe PaymentIntent wiring must remain completely untouched.

---

## Violations Found

| Location | Issue | Action |
|---|---|---|
| Loading state (line 67) | `<Spinner size="md" />` inline return | → coral pulse dots |
| Done state — icon (line 73) | `animate-bounce rounded-full` — `animate-bounce` is vertical only ✅ but icon container has no eyebrow | Add success eyebrow |
| Done state — staff name eyebrow | Missing eyebrow above `h1` | Add `"Trinkgeld gesendet"` eyebrow |
| Main card (line 102) | `rounded-card shadow-card` | → `rounded-[16px]` + warm shadow |
| Card label (line 103) | `text-sm font-medium` | → `text-[9px] font-heading uppercase tracking` |
| Preset amount buttons (line 109) | `text-sm font-medium rounded-btn` | → `font-heading font-bold text-xs`, add coral glow on active |
| Custom amount toggle (line 117) | `text-xs font-medium rounded-btn` | → `font-heading font-bold uppercase tracking-[.06em]` |
| Custom input (line 126) | `rounded-btn border border-s-ink/10` — works but `rounded-btn` on inputs is wrong | → `rounded-[10px] border-s-ink/[0.08]` |
| CHF prefix (line 122) | `text-sm text-s-ink/30` | → `font-heading font-bold text-s-ink/35` |
| Error inline (line 131) | `text-xs text-s-coral` — fine but no icon | → add `AlertCircle` icon |
| Send CTA (line 134) | `font-semibold text-sm hover:bg-s-coral/90` | → `font-heading font-bold uppercase text-xs hover:brightness-[1.06]` |
| Staff avatar (line 91) | `rounded-full bg-s-coral/10` ✅ | Keep |
| Staff name h1 (line 98) | `font-heading font-bold text-xl` ✅ | Keep |
| Service name (line 99) | `text-sm text-s-ink/40` ✅ | Keep |

---

## Phase 1 — Loading State

### Files to modify

#### [MODIFY] [tip/[bookingId]/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/tip/%5BbookingId%5D/page.tsx)
**Line 67** — loading return:
```tsx
if (loading) return (
  <div className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg">
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral/50 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  </div>
);
```

**Git commit:** `git add "app/[locale]/tip/[bookingId]/page.tsx" && git commit -m "TIP-P1: loading → coral pulse dots"`

---

## Phase 2 — Done State: Eyebrow + Icon Box

### Current state (lines 69–81)
```tsx
<div className="w-16 h-16 rounded-full bg-s-coral/10 flex items-center justify-center mx-auto mb-4 animate-bounce">
  <Check size={32} className="text-s-coral" />
</div>
<h1 className="font-heading font-bold text-xl ...">{l.thanks}</h1>
<p className="text-sm text-s-ink/50">{formatCurrency} {l.sent}</p>
```
> `animate-bounce` is vertical-only bounce — compliant ✅ (no scale). Keep it.

### Files to modify

#### [MODIFY] [tip/[bookingId]/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/tip/%5BbookingId%5D/page.tsx)
**Lines 71–80** — done state:
```tsx
<div className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg px-4">
  <div className="text-center">
    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5 animate-bounce"
      style={{ background: "rgba(232,98,74,.10)" }}>
      <Check size={28} className="text-s-coral" />
    </div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
      Trinkgeld gesendet
    </p>
    <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
      {l.thanks}
    </h1>
    <p className="text-xs font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50">
      {formatCurrency(tipAmount / 100, locale)} {l.sent}
    </p>
  </div>
</div>
```

**Git commit:** `git add "app/[locale]/tip/[bookingId]/page.tsx" && git commit -m "TIP-P2: done state → rounded-[18px] icon box, coral eyebrow, font-heading amount"`

---

## Phase 3 — Main Card: Radius + Label

### Current state (line 102–103)
```tsx
<div className="bg-white dark:bg-s-dm-surface rounded-card shadow-card p-5">
  <p className="text-sm font-medium text-s-ink mb-3">{l.give}</p>
```

### Files to modify

#### [MODIFY] [tip/[bookingId]/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/tip/%5BbookingId%5D/page.tsx)
**Line 102** — card wrapper:
```tsx
<div className="bg-white dark:bg-s-dm-surface rounded-[16px] p-5"
  style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 20px rgba(26,18,9,.07)" }}>
```

**Line 103** — card label:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/35 dark:text-s-dm-text/35 mb-3">
  {l.give}
</p>
```

**Git commit:** `git add "app/[locale]/tip/[bookingId]/page.tsx" && git commit -m "TIP-P3: main card → rounded-[16px], warm shadow, label → 9px font-heading uppercase"`

---

## Phase 4 — Preset Amount Buttons

### Current state (line 109)
```tsx
className={`py-3 rounded-btn text-sm font-medium transition-colors ${
  !useCustom && selectedAmount === amount
    ? "bg-s-coral text-white"
    : "border border-s-ink/10 text-s-ink hover:border-s-coral"
}`}
```

### Files to modify

#### [MODIFY] [tip/[bookingId]/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/tip/%5BbookingId%5D/page.tsx)
**Lines 108–112** — preset buttons:
```tsx
<button key={amount}
  onClick={() => { setSelectedAmount(amount); setUseCustom(false); }}
  className={`py-3 rounded-btn text-xs font-heading font-bold transition-all ${
    !useCustom && selectedAmount === amount
      ? "bg-s-coral text-white"
      : "border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/65 dark:text-s-dm-text/65 hover:border-s-coral/50"
  }`}
  style={(!useCustom && selectedAmount === amount) ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}>
  {formatCurrency(amount / 100, locale)}
</button>
```

**Git commit:** `git add "app/[locale]/tip/[bookingId]/page.tsx" && git commit -m "TIP-P4: preset buttons → font-heading, coral glow active, warm border token"`

---

## Phase 5 — Custom Amount Toggle + Input

### Current state (lines 116–128)
```tsx
<button className={`... text-xs font-medium ...`}>{l.custom}</button>
{useCustom && (
  <div className="relative mb-3">
    <span className="... text-sm text-s-ink/30">CHF</span>
    <input className="... rounded-btn border border-s-ink/10 ... data-text" />
  </div>
)}
```

### Files to modify

#### [MODIFY] [tip/[bookingId]/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/tip/%5BbookingId%5D/page.tsx)
**Lines 116–128** — custom toggle + input:
```tsx
<button onClick={() => setUseCustom(true)}
  className={`w-full py-2.5 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.06em] mb-3 transition-colors ${
    useCustom
      ? "border border-s-coral/25 text-s-coral"
      : "border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/45 dark:text-s-dm-text/45"
  }`}
  style={useCustom ? { background: "rgba(232,98,74,.06)" } : undefined}>
  {l.custom}
</button>
{useCustom && (
  <div className="relative mb-3">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-heading font-bold text-s-ink/35 dark:text-s-dm-text/35">
      CHF
    </span>
    <input type="number" min="1" step="0.5"
      value={customAmount}
      onChange={(e) => setCustomAmount(e.target.value)}
      placeholder="0.00"
      className="w-full pl-12 pr-3 py-3 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-bg text-sm font-body text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
      autoFocus />
  </div>
)}
```

**Git commit:** `git add "app/[locale]/tip/[bookingId]/page.tsx" && git commit -m "TIP-P5: custom toggle → font-heading uppercase; input → rounded-[10px], warm border focus ring"`

---

## Phase 6 — Error Inline + Send CTA

### Current state (lines 131–137)
```tsx
{error && <p className="text-xs text-s-coral mb-3">{error}</p>}
<button className="w-full py-3 rounded-btn bg-s-coral text-white font-semibold text-sm hover:bg-s-coral/90 ...">
  <Heart /> {formatCurrency} — {l.send}
</button>
```

### Files to modify

#### [MODIFY] [tip/[bookingId]/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/tip/%5BbookingId%5D/page.tsx)

Add `AlertCircle` to import on line 6:
```tsx
import { Heart, Check, AlertCircle } from "lucide-react";
```

**Line 131** — error inline:
```tsx
{error && (
  <div className="flex items-center gap-1.5 mb-3">
    <AlertCircle size={12} className="text-s-coral shrink-0" />
    <p className="text-[10px] font-heading font-bold text-s-coral">{error}</p>
  </div>
)}
```

**Lines 133–137** — send CTA:
```tsx
<button onClick={handlePay}
  disabled={paying || tipAmount < 100}
  className="w-full py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
  {paying ? <Spinner size="sm" invert /> : <Heart size={13} />}
  {formatCurrency(tipAmount / 100, locale)} — {l.send}
</button>
```

**Git commit:** `git add "app/[locale]/tip/[bookingId]/page.tsx" && git commit -m "TIP-P6: error → icon inline; send CTA → font-heading uppercase, coral inline style"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Loading dots | ✅ Start independently |
| P2 | Done state | ✅ Independent |
| P3 | Main card radius + label | ✅ Independent |
| P4 | Preset buttons | After P3 same card |
| P5 | Custom toggle + input | After P4 same card |
| P6 | Error + Send CTA | After P5 |

> P1, P2, P3 all parallel.
> P3→P4→P5→P6 sequential within the main card.

---

## TIP PAGE COMPLIANCE CHECK

```bash
npm run build

# rounded-card removed:
grep -n "rounded-card\|shadow-card" "app/[locale]/tip/[bookingId]/page.tsx"
# Expected: 0

# font-medium removed:
grep -n "font-medium\b" "app/[locale]/tip/[bookingId]/page.tsx"
# Expected: 0

# hover:bg-s-coral/90 removed:
grep -n "hover:bg-s-coral/90\|hover:bg-s-coral-hover" "app/[locale]/tip/[bookingId]/page.tsx"
# Expected: 0

# API calls untouched:
grep -n "api/tips\|api/bookings" "app/[locale]/tip/[bookingId]/page.tsx"
# Expected: both present

# Manual checklist:
# ✅ Loading: coral pulse dots, no spinner
# ✅ Done: rounded-[18px] icon box, coral eyebrow, animate-bounce preserved
# ✅ Card: rounded-[16px], warm shadow
# ✅ Label: 9px font-heading uppercase
# ✅ Presets: font-heading, coral glow active, warm border
# ✅ Custom toggle: font-heading uppercase, coral tint when active
# ✅ Custom input: rounded-[10px], focus ring, warm border
# ✅ Error: AlertCircle icon inline
# ✅ Send CTA: font-heading uppercase, coral inline-style, no hover:bg
```

---

## Final Step — Push

```bash
git push
```
