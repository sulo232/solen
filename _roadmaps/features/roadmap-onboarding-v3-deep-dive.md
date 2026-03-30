# Salon Onboarding Wizard — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/onboarding/salon/page.tsx` (774 lines) — single-file multi-step wizard containing `StepContainer`, `Step1`, `Step2`, `Step3`, and `SalonOnboardingPage`.
> **Zone: 3 (Clean Functional)** — Onboarding is a trust-critical acquisition flow. Salon owners must feel confident handing over their business details. Zero glass effects inside cards, zero blobs. The sticky header/nav bar may use warm glass (Zone 3 exception: modal overlays).
>
> ⚠️ **CRITICAL:** All business logic, validation, API calls, `slideSwitch` animation, draft persistence, and auth guard MUST remain completely untouched. Only visual styling changes.

---

## Violations Found

| Location | Issue | Action |
|---|---|---|
| `StepContainer` (line 53) | `rounded-card` | → `rounded-[16px]` |
| `StepContainer` (line 53) | `border-s-ink/5` — too faint on white card | → `border-s-ink/[0.07]` |
| Labels everywhere | `font-medium text-s-ink/50` | → `font-heading uppercase tracking` |
| Category pills (line 125) | `font-medium rounded-pill text-sm active:scale-[0.97]` | → `font-heading uppercase text-[11px]` |
| OTP inline card (line 287) | `rounded-card` | → `rounded-[12px]` |
| Verified badge (line 270) | `font-medium rounded-pill` | → `font-heading uppercase rounded-[10px]` |
| "Verified" success card (line 313) | `rounded-card font-medium` | → `rounded-[12px] font-heading` |
| AI hint card (line 424) | `rounded-card font-medium` | → `rounded-[12px] font-heading` |
| Submit error banner (line 734) | `rounded-card` | → `rounded-[12px]`, add AlertCircle icon |
| **Done overlay — NEVER #8** (line 642) | `scale: 0.6` spring in celebration overlay | → `opacity+translateY only — NO SCALE` |
| **Done dots — NEVER #8** (line 659) | `animate scale: [1, 1.4, 1] repeat: Infinity` | → `opacity pulse only` |
| Progress step label (line 692) | `font-body mt-2 text-center` | → `font-heading uppercase tracking` |
| Nav "Next" button (line 756) | `hover:bg-s-coral-hover` — non-token | → `hover:brightness-[1.06]` |
| Nav footer bar | `bg-white/80 backdrop-blur-lg` — uses glass in Zone 3 | → `bg-white border-t` (solid) |
| Step header bar | Same glass issue | → solid `bg-white` |
| Auth loading (line 620) | `<Spinner />` full page | → skeleton |
| `active:translate-y-[1px]` (lines 278, 747) | Fine for Zone 3 — keep ✅ | Keep |

---

## Phase 1 — StepContainer: Card Upgrade

### Current state (lines 50–61)
```tsx
function StepContainer({ title, subtitle, children }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 shadow-warm-md p-6 sm:p-8">
        <h2 className="font-heading font-bold text-2xl text-s-ink mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-s-ink/50 mb-6">{subtitle}</p>}
        ...
```
**Issues:** `rounded-card` → `rounded-[16px]`, `border-s-ink/5` → `border-s-ink/[0.07]`, subtitle needs eyebrow treatment

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 50–61** — StepContainer:
```tsx
function StepContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/[0.07] dark:border-white/[0.06] p-6 sm:p-8"
        style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 16px rgba(26,18,9,.06)" }}
        role="form">
        {subtitle && (
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 dark:text-s-dm-text/30 mb-1.5">
            {subtitle}
          </p>
        )}
        <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P1: StepContainer → rounded-[16px], eyebrow subtitle, warm shadow"`

---

## Phase 2 — Form Labels: font-heading Sweep

### Current state — all labels across Steps 1–3
```tsx
<label className="block text-xs font-medium text-s-ink/50 mb-1">...</label>
```
Found on: `step1.name`, `step1.email`, `step1.categories`, `step1.quartier`, `step1.address`, `step2.phone`, `step3.serviceName`, `step3.duration`, `step3.price`.

### ⚠️ BE CAREFUL — only the `className` changes. The `htmlFor`, `value`, translation key, and input wiring must stay intact.

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)

Replace all instances of:
```tsx
className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1"
```
With:
```tsx
className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 dark:text-s-dm-text/40 mb-1.5"
```

And the categories label (mb-2):
```tsx
className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 dark:text-s-dm-text/40 mb-2"
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P2: form labels → font-heading 9px uppercase tracking, mb-1.5"`

---

## Phase 3 — Category Pills: font-heading + Active Glow

### Current state (lines 124–129)
```tsx
className={[
  "px-3 py-1.5 rounded-pill text-sm font-medium border transition-all active:scale-[0.97]",
  data.categories.includes(c.value)
    ? "bg-s-coral text-white border-s-coral"
    : "border-s-ink/10 text-s-ink/60 hover:border-s-coral",
].join(" ")}
```
- `text-sm font-medium` → `text-[11px] font-heading font-bold uppercase tracking-[.06em]`
- `py-1.5` → `py-2.5` (44px min tap target)
- `active:scale-[0.97]` → `active:scale-[0.98]` (max 2%)
- Active state: add coral glow shadow

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 124–129** — category pill className:
```tsx
className={[
  "px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] border transition-all active:scale-[0.98]",
  data.categories.includes(c.value)
    ? "bg-s-coral text-white border-s-coral"
    : "border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/55 dark:text-s-dm-text/55 hover:border-s-coral/50",
].join(" ")}
style={data.categories.includes(c.value) ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P3: category pills → font-heading uppercase, coral glow active, py-2.5"`

---

## Phase 4 — OTP Inline Card + Verified Badge

### Current state — OTP box (lines 287–308)
```tsx
<div className="mt-2 p-3 bg-s-coral/5 rounded-card border border-s-coral/20">
  <p className="text-xs text-s-ink/60 mb-2">Code per SMS erhalten?</p>
  <input className="w-24 px-3 py-2 text-center tracking-widest rounded-input ..."/>
  <button className="px-4 py-2 rounded-btn bg-s-coral/10 text-s-coral text-sm font-medium ...">
    Code prüfen
  </button>
</div>
```

### Current state — Verified badge (lines 270–272)
```tsx
<div className="flex items-center justify-center px-4 bg-s-sage-subtle text-s-sage-text rounded-pill text-sm font-medium">
  <Check size={16} className="mr-1" /> Verifiziert
</div>
```

### Current state — Verified success card (lines 313–316)
```tsx
<div className="bg-s-sage-subtle border border-s-sage/20 rounded-card p-4 text-sm text-s-sage-text">
  <Check size={16} className="inline mr-1.5" /> Telefonnummer erfolgreich verifiziert.
</div>
```

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)

**Lines 287–308** — OTP inline card:
```tsx
<div className="mt-3 p-4 rounded-[12px] border border-s-coral/20"
  style={{ background: "rgba(232,98,74,.04)" }}>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 dark:text-s-dm-text/40 mb-2.5">
    SMS-Code eingeben
  </p>
  <div className="flex gap-2">
    <input type="text" maxLength={6} value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
      placeholder="000000"
      className="w-28 px-3 py-3 text-center font-mono-code text-lg tracking-[.25em] rounded-[10px] border border-s-coral/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 bg-white dark:bg-s-dm-raised transition-all"
    />
    <button type="button" onClick={verifyOtp}
      disabled={verifying || code.length < 4}
      className="flex-1 px-4 py-3 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] disabled:opacity-50 transition-all active:scale-[0.98]"
      style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 12px rgba(232,98,74,.15)" }}>
      {verifying ? <Spinner size="sm" invert /> : "Code prüfen"}
    </button>
  </div>
  {verifyError && (
    <p className="text-[10px] font-body text-s-coral mt-2">{verifyError}</p>
  )}
</div>
```

**Lines 270–272** — Verified badge:
```tsx
<div className="flex items-center gap-1.5 px-4 py-3 rounded-[10px] text-[10px] font-heading font-bold uppercase tracking-[.10em]"
  style={{ background: "rgba(76,175,111,.10)", color: "#2e7d32" }}>
  <Check size={13} className="shrink-0" /> Verifiziert
</div>
```

**Lines 313–316** — Verified success card:
```tsx
<div className="flex items-start gap-3 rounded-[12px] border border-[#4CAF6F]/20 p-4"
  style={{ background: "rgba(76,175,111,.06)" }}>
  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
    style={{ background: "rgba(76,175,111,.15)" }}>
    <Check size={15} className="text-[#4CAF6F]" />
  </div>
  <div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-[#2e7d32] mb-0.5">
      Verifiziert
    </p>
    <p className="text-xs font-body text-s-ink/55 dark:text-s-dm-text/55">
      Telefonnummer verifiziert. Weiter zum nächsten Schritt.
    </p>
  </div>
</div>
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P4: OTP box + verified badge → 12px radius, green tint, font-heading"`

---

## Phase 5 — AI Hint Card (Step 3)

### Current state (lines 424–427)
```tsx
<div className="bg-s-coral/5 border border-s-coral/10 rounded-card p-4 text-xs text-s-ink/60">
  <p className="font-medium text-s-ink mb-1">{t("step3Quick.hint")}</p>
  <p>{t("step3Quick.hintDesc")}</p>
</div>
```
- `rounded-card` → `rounded-[12px]`
- `font-medium` → `font-heading font-semibold`
- Add `Sparkles` icon to the heading

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 424–427** — AI hint card:
```tsx
<div className="rounded-[12px] border border-s-coral/[0.12] p-4"
  style={{ background: "rgba(232,98,74,.04)" }}>
  <div className="flex items-center gap-1.5 mb-1.5">
    <Sparkles size={12} className="text-s-coral shrink-0" />
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-coral">
      {t("step3Quick.hint")}
    </p>
  </div>
  <p className="text-xs font-body text-s-ink/50 dark:text-s-dm-text/50 leading-relaxed">
    {t("step3Quick.hintDesc")}
  </p>
</div>
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P5: AI hint card → 12px radius, coral eyebrow, Sparkles icon"`

---

## Phase 6 — Submit Error Banner: Add Icon

### Current state (lines 732–738)
```tsx
<div className="bg-s-coral/5 border border-s-coral/20 rounded-card p-4 text-sm text-s-coral">
  {submitError}
</div>
```

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 732–738** — error banner:

Add `AlertCircle` to the import on line 7 (it may already be there — check first).

```tsx
{submitError && step === TOTAL_STEPS && (
  <div className="max-w-xl mx-auto px-4 mb-4">
    <div className="flex items-start gap-3 rounded-[12px] border border-s-coral/20 p-4"
      style={{ background: "rgba(232,98,74,.05)" }}>
      <AlertCircle size={15} className="text-s-coral shrink-0 mt-0.5" />
      <p className="text-xs font-body text-s-coral">{submitError}</p>
    </div>
  </div>
)}
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P6: submit error → 12px radius, AlertCircle icon, font-body"`

---

## Phase 7 — Sticky Header + Progress Bar

### Current state (lines 671–695)
```tsx
<div className="bg-white/80 dark:bg-s-dm-surface/80 backdrop-blur-lg border-b border-s-ink/5 px-4 py-4 sticky top-0 z-10">
  {/* Logo */}
  <span className="font-heading font-bold text-base">solen<span className="text-s-coral">.</span>ch</span>
  <span className="text-xs text-s-ink/40">Schritt {step} von {total}</span>
  
  {/* Progress bar */}
  <div className="flex items-center gap-1 mt-1 bg-s-bg-sunken rounded-full p-1">
    {segments → coral or transparent}
  </div>
  
  {/* Step label */}
  <p className="text-xs text-s-ink/50 font-body mt-2 text-center">{stepLabel}</p>
```
**Issues:**
- `backdrop-blur-lg` on header — Zone 3 should be solid. Keep it as `bg-white` solid
- `rounded-full p-1` progress bar track — fine, keep
- Step label: `font-body text-center` → `font-heading uppercase tracking text-center`
- Step counter: `text-xs text-s-ink/40` → `text-[9px] font-heading uppercase tracking`

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 671** — header wrapper:
```tsx
<div className="bg-white dark:bg-s-dm-surface border-b border-s-ink/[0.06] dark:border-white/[0.05] px-4 py-4 sticky top-0 z-10">
```

**Lines 677** — step counter:
```tsx
<span className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/35 dark:text-s-dm-text/35">
  {t("header.stepOf", { step, total: TOTAL_STEPS })}
</span>
```

**Lines 691–693** — step label:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/35 dark:text-s-dm-text/35 mt-2 text-center">
  {t(`progress.${STEP_META[step - 1]?.label}`)}
</p>
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P7: header → solid white (no glass), step counter + label → font-heading uppercase"`

---

## Phase 8 — Bottom Nav Bar: Solid + CTA Polish

### Current state (lines 740–770)
```tsx
<nav className="fixed bottom-0 ... bg-white/80 backdrop-blur-lg border-t ...">
  {/* Back button */}
  <button className="... hover:bg-s-ink hover:text-s-bg-base active:translate-y-[1px] active:shadow-pressed ...">
    <ChevronLeft /> Back
  </button>
  {/* Next button */}
  <button className="... hover:bg-s-coral-hover active:translate-y-[1px] ...">
    Next <ChevronRight />
  </button>
```
**Issues:**
- `bg-white/80 backdrop-blur-lg` → `bg-white` (solid, Zone 3)
- Back hover: `hover:bg-s-ink hover:text-s-bg-base` → invert theme — might be confusing. Change to `hover:bg-s-bg-sunken hover:text-s-ink`
- Next button: `hover:bg-s-coral-hover` → `hover:brightness-[1.06]` (not a token)
- The `active:translate-y-[1px] active:shadow-pressed` ✅ — tactile feedback, keep

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Line 741** — nav wrapper:
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-s-dm-surface border-t border-s-ink/[0.06] dark:border-white/[0.05] px-4 py-4" aria-label="Wizard navigation">
```

**Line 747** — back button:
```tsx
className="flex items-center gap-1.5 px-4 py-3 rounded-btn border border-s-ink/[0.08] dark:border-white/[0.08] text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-bg-sunken hover:border-s-ink/20 active:translate-y-[1px] active:shadow-pressed transition-all"
```

**Line 756** — next button:
```tsx
className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] hover:brightness-[1.06] active:translate-y-[1px] active:shadow-pressed transition-all group"
style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P8: nav bar → solid white, back hover, next inline style, remove hover:bg-s-coral-hover"`

---

## Phase 9 — Celebration Overlay: NEVER Fixes

### Current state (lines 636–666)
```tsx
{done && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    className="fixed inset-0 z-50 flex... bg-white/90 backdrop-blur-lg">
    
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}       {/* ← NEVER rule #8 */}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      ...
      {[0,1,2].map((i) => (
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}        {/* ← NEVER rule #8 */}
          transition={{ repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  </motion.div>
)}
```

**Both violations are NEVER rule #8 — spring scale animations and scale pulsing.**

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 634–667** — celebration overlay:
```tsx
<AnimatePresence>
  {done && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-s-dm-bg/95">

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="flex flex-col items-center gap-5 text-center px-6">

        {/* Icon box — NO scale animation */}
        <div className="w-20 h-20 rounded-[22px] flex items-center justify-center"
          style={{ background: "rgba(232,98,74,.10)" }}>
          <PartyPopper size={34} className="text-s-coral" />
        </div>

        <div>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
            Willkommen
          </p>
          <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">
            {t("done.title")}
          </h2>
          <p className="text-xs font-body text-s-ink/45 dark:text-s-dm-text/45 max-w-xs mt-2 leading-relaxed">
            {t("done.subtitle")}
          </p>
          <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mt-3">
            {t("done.dashboardHint")}
          </p>
        </div>

        {/* Opacity-only pulse dots — NO scale */}
        <div className="flex gap-2 mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-s-coral"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P9: celebration overlay → opacity+y only, remove scale(0.6) + scale([1,1.4,1]) NEVER violations"`

---

## Phase 10 — Auth Loading State: Skeleton

### Current state (lines 618–624)
```tsx
if (!authChecked) {
  return (
    <div className="min-h-screen bg-s-bg-base flex items-center justify-center">
      <Spinner />
    </div>
  );
}
```
Replace centered spinner with a skeleton that mirrors the wizard layout.

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 618–624** — auth loading:
```tsx
if (!authChecked) {
  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-s-dm-surface border-b border-s-ink/[0.06] px-4 py-4">
        <div className="max-w-xl mx-auto space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-s-bg-sunken rounded" />
            <div className="h-3 w-16 bg-s-bg-sunken rounded" />
          </div>
          <div className="h-2 w-full bg-s-bg-sunken rounded-full" />
          <div className="h-2.5 w-32 bg-s-bg-sunken rounded mx-auto" />
        </div>
      </div>
      {/* Card skeleton */}
      <div className="px-4 py-8">
        <div className="max-w-xl mx-auto rounded-[16px] border border-s-ink/[0.06] bg-white dark:bg-s-dm-surface p-8 animate-pulse">
          <div className="h-2 w-24 bg-s-bg-sunken rounded mb-3" />
          <div className="h-7 w-48 bg-s-bg-sunken rounded mb-8" />
          <div className="space-y-5">
            <div>
              <div className="h-2 w-16 bg-s-bg-sunken rounded mb-2" />
              <div className="h-12 w-full bg-s-bg-sunken rounded-[12px]" />
            </div>
            <div>
              <div className="h-2 w-16 bg-s-bg-sunken rounded mb-2" />
              <div className="h-12 w-full bg-s-bg-sunken rounded-[12px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P10: auth loading → wizard layout skeleton, no spinner"`

---

## Phase 11 — AI Suggested Label in Step 3

### Current state (lines 388–391)
```tsx
<p className="text-[10px] text-s-ink/40 mt-1 flex items-center gap-1">
  <Sparkles size={10} className="text-s-coral" />
  KI-Vorschlag — du kannst den Namen anpassen
</p>
```
- `text-[10px]` → already correct ✅
- But `text-s-ink/40` → should be `font-heading uppercase tracking` for eyebrow consistency

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 388–391** — AI label:
```tsx
{suggested && data.service_name && (
  <div className="flex items-center gap-1.5 mt-1.5">
    <Sparkles size={10} className="text-s-coral" />
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/35">
      KI-Vorschlag · anpassbar
    </p>
  </div>
)}
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P11: AI suggestion label → font-heading 9px uppercase"`

---

## Phase 12 — Background Gradient: Zone 3 Compliance

### Current state (lines 628–631)
```tsx
<div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-s-coral/[0.04] to-transparent rounded-pill" />
</div>
```
This is a Zone 3 page. Ambient gradient at 4% opacity is acceptable (very subtle), but `rounded-pill` on an 800px background element is technically "blob-adjacent". Replace with a simple linear gradient instead.

### Files to modify

#### [MODIFY] [onboarding/salon/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/onboarding/salon/page.tsx)
**Lines 629–631** — background decoration:
```tsx
<div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
  <div className="absolute top-0 left-0 right-0 h-[300px]"
    style={{ background: "linear-gradient(180deg, rgba(232,98,74,.03) 0%, transparent 100%)" }} />
</div>
```

**Git commit:** `git add app/[locale]/onboarding/salon/page.tsx && git commit -m "ONBOARD-P12: background → linear gradient, remove rounded-pill blob shape"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| **P9** | 🔴 Celebration overlay NEVER fixes | ✅ Start here — highest risk |
| P1 | StepContainer card | ✅ Independent |
| P10 | Auth loading skeleton | ✅ Independent |
| P12 | Background gradient | ✅ Independent |
| P2 | Form labels font-heading sweep | After P1 (visual context) |
| P3 | Category pills | After P2 |
| P4 | OTP inline card + verified badge | Independent |
| P5 | AI hint card | Independent |
| P6 | Submit error banner | Independent |
| P7 | Sticky header | After P8 (nav context) |
| P8 | Bottom nav bar | After P7 (same area) |
| P11 | AI suggested label | Last (minor) |

> P9, P1, P10, P12 all parallel — start immediately.
> P7 and P8 sequential (same sticky/fixed layout area).
> P2→P3 sequential (visual progression).

---

## ONBOARDING COMPLIANCE CHECK

```bash
npm run build

# NEVER violations:
grep -n "scale: 0\.\|animate.*scale.*1\\.4\|scale: 0\.6" app/[locale]/onboarding/salon/page.tsx
# Expected: 0 results

# rounded-card removed:
grep -n "rounded-card" app/[locale]/onboarding/salon/page.tsx
# Expected: 0 results

# Glass removed from fixed bars:
grep -n "backdrop-blur" app/[locale]/onboarding/salon/page.tsx
# Expected: 0 results

# All API calls untouched:
grep -n "api/salons\|api/salon-draft\|api/auth/verify-phone" app/[locale]/onboarding/salon/page.tsx
# Expected: all 3 still present

# Manual checklist:
# ✅ StepContainer: rounded-[16px], warm shadow, subtitle as eyebrow
# ✅ Form labels: 9px font-heading uppercase
# ✅ Category pills: uppercase, coral glow on active, py-2.5
# ✅ OTP card: 12px radius, coral tint, monospace code input
# ✅ Verified badge: green tint, icon box, font-heading
# ✅ AI hint card: coral icon, eyebrow label, coral tint
# ✅ Submit error: icon + warm tint
# ✅ Header: solid white (no blur)
# ✅ Nav bar: solid white (no blur), coral inline-style CTA
# ✅ Celebration overlay: opacity+y only — NO SCALE anywhere
# ✅ Auth skeleton: wizard-shape layout
# ✅ Background: linear gradient, no rounded blob shape
```
