# Auth Pages — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/auth/login/page.tsx` (45 lines), `app/[locale]/auth/register/page.tsx` (658 lines), `app/[locale]/auth/reset-password/`, `components/auth/SignIn.tsx`.
> **Zone: 3 (Clean Functional)** — No blobs, no glass, no Bebas Neue, max 12px radius. Auth is the most trust-critical zone — clarity and credibility over decoration.
> **Exception:** The auth page background may use a single large ambient warm blur (not a blob shape) — this is permissible as a background ambiance for the centered card.

---

## Zone 3 Auth Exception (Documented)

The large blurred radial gradients (`blur-[120px]`, `rounded-full`, fully transparent, `pointer-events-none`) on the auth page background are **NOT blob shapes** — they are ambient light effects. This is acceptable in Zone 3 auth pages as a single warm-coral ambiance. The rule is:
- **One** ambient gradient, coral tint only
- `blur` must be ≥ 80px (pure soft glow, not visible shape)
- `pointer-events-none`, `aria-hidden`, `-z-10`

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Login page: card + background | 🟡 Medium | Card is the only interactive element — test carefully |
| P2 — SignIn component | 🔴 High | Unknown — must read `components/auth/SignIn.tsx` |
| P3 — Brand logo lockup | 🟢 Low | Visual-only |
| P4 — Register page: outer wrapper | 🟢 Low | CSS only |
| P5 — Progress indicator | 🟢 Low | Visual upgrade |
| P6 — StepRole cards | 🟢 Low | Visual-only |
| P7 — StepRegister inputs + CTA | 🟡 Medium | Form logic stays, only styling |
| P8 — SelectPill (Step 2) | 🟢 Low | Pills-only |
| P9 — Step 3 category grid | 🟡 Medium | `rounded-card` violation — fix carefully |
| P10 — DoneScreen animation | 🔴 High | Uses `scale` spring — NEVER rule #8 |
| P11 — Email verification success state | 🟢 Low | Small visual state |
| P12 — Back navigation | 🟢 Low | Arrow button style |
| P13 — Step counter line | 🟢 Low | Text only |
| P14 — Reset password page | 🟡 Medium | Unknown — must read file |
| P15 — Auth error + toast states | 🟢 Low | Style only |

---

## Phase 1 — Login Page: Card + Background Cleanup

### Current state (login/page.tsx lines 9–43)
```tsx
// Background:
<div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-s-coral/10 blur-[120px]" />
<div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-s-coral/8 blur-[100px]" />

// Card:
<div className="rounded-card border border-white/60 bg-white/80 backdrop-blur-glass shadow-glass p-8">
```

**Issues:**
- Two background blobs — Zone 3 exception allows max ONE
- `shadow-glass` — NEVER rule (cold shadow token)
- `rounded-card` — verify pixel value; Zone 3 max 12px
- `backdrop-blur-glass` + `bg-white/80` — glass card on an auth card is acceptable BUT `shadow-glass` must be replaced with warm shadow

### ⚠️ BE CAREFUL
- The `<SignIn>` component's logic for email sign-in, OAuth buttons, and redirect handling must remain entirely untouched.
- The card width `max-w-sm` (384px) is correct — don't widen it.
- Dark mode: `bg-s-dm-surface/80` for card, `bg-s-dm-bg` for page.

### Files to modify

#### [MODIFY] [login/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/login/page.tsx)

**Background** — reduce to one ambient glow:
```tsx
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
  <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full"
    style={{ background: "rgba(232,98,74,.08)", filter: "blur(120px)" }} />
</div>
```

**Card** — Zone 3 auth card (glass Tier 3, no cold shadow):
```tsx
<div className="rounded-[16px] border border-white/70 dark:border-white/10 p-8"
  style={{ background: "rgba(255,255,255,.90)", backdropFilter: "blur(20px) saturate(1.2)",
           WebkitBackdropFilter: "blur(20px) saturate(1.2)",
           boxShadow: "0 4px 12px rgba(26,18,9,.08), 0 16px 40px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.90)" }}>
  <Suspense><SignIn /></Suspense>
</div>
```

**"Noch kein Konto?" link** — upgrade to eyebrow style:
```tsx
<p className="text-center mt-6">
  <span className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/30">
    Noch kein Konto?{" "}
  </span>
  <a href={`/${locale}/auth/register`}
    className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-coral hover:underline">
    Registrieren
  </a>
</p>
```

**Git commit:** `git add app/[locale]/auth/login/page.tsx && git commit -m "AUTH-P1: login page → single ambient glow, warm card shadow, eyebrow links"`

---

## Phase 2 — SignIn Component: Read + Audit

### ⚠️ Must read `components/auth/SignIn.tsx` before implementing

```bash
# Read the file first:
cat components/auth/SignIn.tsx
```

Expected issues to look for:
- Input fields: check padding (`py-2.5` min), `rounded-btn` vs `rounded-[12px]`
- OAuth buttons (Google/Apple): flat vs styled
- Submit button: `font-body font-semibold` → must be `font-heading font-bold uppercase`
- Error state: likely a plain `<p>` — upgrade to inline error card
- "Passwort vergessen?" link: check styling

### Files to modify

#### [MODIFY] [SignIn.tsx](file:///c:/Users/sulod/solen/components/auth/SignIn.tsx)

**All input fields** — Zone 3 spec:
```tsx
className="w-full px-4 py-3.5 rounded-[12px] border border-s-ink/[0.08] bg-white dark:bg-s-dm-surface text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
```

**Submit button:**
```tsx
className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all disabled:opacity-50"
style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}
```

**OAuth divider label:**
```tsx
<div className="flex items-center gap-3 my-4">
  <div className="flex-1 h-px bg-s-ink/[0.07]" />
  <span className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30">oder</span>
  <div className="flex-1 h-px bg-s-ink/[0.07]" />
</div>
```

**OAuth buttons** — clean outline style:
```tsx
className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[12px] border border-s-ink/[0.08] text-xs font-heading font-bold text-s-ink/70 hover:border-s-ink/20 hover:bg-s-bg-base transition-colors"
```

**"Passwort vergessen?" link:**
```tsx
<a href={`/${locale}/auth/reset-password`}
  className="text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/35 hover:text-s-coral transition-colors">
  Passwort vergessen?
</a>
```

**Git commit:** `git add components/auth/SignIn.tsx && git commit -m "AUTH-P2: SignIn → Zone 3 inputs, coral CTA shadow, OAuth outline style"`

---

## Phase 3 — Brand Logo Lockup: Both Pages

### Current state (both pages)
```tsx
<a className="inline-block font-heading font-bold text-3xl text-s-ink tracking-tight hover:opacity-80">
  solen<span className="text-s-coral">.</span>ch
</a>
<p className="text-s-ink/50 font-body text-sm mt-2">Willkommen zurück</p>
```
- Logo: `font-heading text-3xl` — fine ✅
- Subline: `font-body text-sm text-s-ink/50` — should be eyebrow style
- Missing: small "solen.ch" amber eyebrow above the logo

### Files to modify

#### [MODIFY] [login/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/login/page.tsx)

```tsx
<div className="text-center mb-8">
  {/* Amber eyebrow */}
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-amber mb-3">
    solen.ch
  </p>
  {/* Logo word mark */}
  <a href="/"
    className="inline-block font-heading font-bold text-[32px] text-s-ink dark:text-s-dm-text leading-none hover:opacity-80 transition-opacity">
    solen<span className="text-s-coral">.</span>ch
  </a>
  {/* Page title */}
  <p className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 mt-3">
    Willkommen zurück
  </p>
</div>
```

Apply the same pattern in `register/page.tsx` (lines 580–587).

**Git commit:** `git add app/[locale]/auth/login/page.tsx app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P3: brand logo lockup → amber eyebrow, uppercase page title, clean spacing"`

---

## Phase 4 — Register Page: Outer Wrapper + Single Blob

### Current state (register/page.tsx lines 573–577)
```tsx
<div className="fixed inset-0 -z-10 ...">
  <div className="... w-[600px] h-[600px] ... bg-s-coral/10 blur-[120px]" />
  <div className="... w-[400px] h-[400px] ... bg-s-coral/[0.06] blur-[80px]" />
</div>
```
- Two blobs — reduce to one per Zone 3 exception rule.

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 574–577** — reduce to single ambient:
```tsx
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
  <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full"
    style={{ background: "rgba(232,98,74,.07)", filter: "blur(120px)" }} />
</div>
```

**Card wrapper** (line 603) — warm shadow, no cold glass:
```tsx
<div className="rounded-[16px] border border-white/70 dark:border-white/10 p-7"
  style={{ background: "rgba(255,255,255,.90)", backdropFilter: "blur(20px) saturate(1.2)",
           WebkitBackdropFilter: "blur(20px) saturate(1.2)",
           boxShadow: "0 4px 12px rgba(26,18,9,.08), 0 16px 40px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.90)" }}>
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P4: register wrapper → single ambient blob, warm card shadow"`

---

## Phase 5 — Progress Indicator: Linear Track (not dots)

### Current state (register/page.tsx lines 591–601)
```tsx
<div className="flex justify-center gap-2 mb-5">
  {[1,2,3].map(s => (
    <div className={`h-1.5 rounded-full transition-all duration-500 ${
      s === step ? "w-10 bg-s-coral" : s < step ? "w-4 bg-s-coral/40" : "w-4 bg-s-sand"
    }`} />
  ))}
</div>
```
- The expanding dot approach is clever but visually unclear
- Replace with a clean linear progress track: a 3-segment bar

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 591–601**:
```tsx
{step !== -1 && step !== "done" && (
  <div className="mb-5 px-1">
    <div className="flex gap-1">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
          style={{ background: (s as number) <= (step as number) ? "#E8624A" : "rgba(26,18,9,.08)" }} />
      ))}
    </div>
    <p className="text-right text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 mt-1.5">
      Schritt {currentStepNum} von {totalSteps}
    </p>
  </div>
)}
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P5: progress indicator → linear track, step count right-aligned"`

---

## Phase 6 — StepRole: Choice Cards

### Current state (register/page.tsx lines 44–71)
```tsx
<button className="group flex items-center gap-4 p-4 rounded-card border border-s-ink/5 ...">
  <div className="w-12 h-12 rounded-card bg-s-coral/10 ...">
```
- `rounded-card` → `rounded-[12px]`

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 36–72** — StepRole:

```tsx
function StepRole({ onCustomer, onSalon }: { onCustomer: () => void; onSalon: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-2">
          Registrierung
        </p>
        <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
          Wie möchtest du starten?
        </h2>
      </div>

      {/* Customer choice */}
      <button onClick={onCustomer}
        className="group flex items-center gap-4 p-4 rounded-[12px] border border-s-ink/[0.07] hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-all text-left">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(232,98,74,.10)" }}>
          <User size={20} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-s-ink">Ich bin ein Kunde</p>
          <p className="text-[10px] font-body text-s-ink/45 mt-0.5">Salons entdecken und Termine buchen</p>
        </div>
        <ChevronRight size={16} className="text-s-ink/20 group-hover:text-s-coral transition-colors shrink-0" />
      </button>

      {/* Salon choice */}
      <button onClick={onSalon}
        className="group flex items-center gap-4 p-4 rounded-[12px] border border-s-ink/[0.07] hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-all text-left">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(212,135,10,.10)" }}>
          <Building2 size={20} className="text-s-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-s-ink">Ich bin Salon-Inhaber</p>
          <p className="text-[10px] font-body text-s-ink/45 mt-0.5">Meinen Salon registrieren und verwalten</p>
        </div>
        <ChevronRight size={16} className="text-s-ink/20 group-hover:text-s-coral transition-colors shrink-0" />
      </button>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P6: StepRole → 12px radius, icon box amber for salon, eyebrow title"`

---

## Phase 7 — StepRegister: Input Polish + CTA

### Current state (register/page.tsx lines 149–183)
- Inputs: `py-2.5` — should be `py-3.5` for larger tap targets
- Submit: `font-body font-semibold` → `font-heading font-bold uppercase`
- `shadow-warm-sm` on CTA → replace with coral glow shadow spec

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 145–192** — StepRegister form

Universal input class:
```tsx
const authInput = "w-full px-4 py-3.5 rounded-[12px] border border-s-ink/[0.08] bg-white dark:bg-s-dm-surface text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors";
```

Label above birthday field:
```tsx
<label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
  Geburtsdatum <span className="text-s-ink/25">(mind. 16 Jahre)</span>
</label>
```

Submit button:
```tsx
<button type="submit" disabled={!email || !password || !birthday || saving}
  className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
  {saving && <Spinner size="sm" invert />}
  Registrieren
</button>
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P7: StepRegister inputs → 3.5 padding, uppercase CTA, label eyebrow"`

---

## Phase 8 — SelectPill Component: Font + Size Fix

### Current state (register/page.tsx lines 300–328)
```tsx
<button className="flex items-center gap-2 px-3 py-2 rounded-btn border text-sm font-body transition-all ...">
```
- `font-body` → `font-heading font-semibold`
- `text-sm` → `text-xs`
- Active: `font-medium` → `font-bold`

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 316–325** — pill button classes:
```tsx
className={[
  "flex items-center gap-2 px-3.5 py-2.5 rounded-btn border text-xs font-heading font-semibold transition-all duration-150",
  value === o.value
    ? "border-s-coral bg-s-coral/[0.08] text-s-coral font-bold"
    : "border-s-ink/[0.08] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral",
].join(" ")}
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P8: SelectPill → font-heading, Zone 3 coral active state"`

---

## Phase 9 — Step 3 Category Grid: NEVER Violation Fix

### Current state (register/page.tsx lines 455–467)
```tsx
<button className="relative flex flex-col items-center gap-2 p-4 rounded-card border transition-all ...">
```
- `rounded-card` — Zone 3 max 12px. Replace with `rounded-[12px]`.
- `text-sm font-body font-medium` → `text-xs font-heading font-semibold`

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 450–469** — Category grid buttons:
```tsx
{CATEGORY_OPTIONS.map((o) => {
  const active = selected.includes(o.value);
  return (
    <button key={o.value} type="button" onClick={() => toggle(o.value)}
      className={`relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-[12px] border transition-all duration-150 ${
        active
          ? "border-s-coral bg-s-coral/[0.08]"
          : "border-s-ink/[0.07] hover:border-s-coral/40"
      }`}>
      {active && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-s-coral flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" />
        </span>
      )}
      <span className={active ? "text-s-coral" : "text-s-ink/50"}>{o.icon}</span>
      <span className="text-[11px] font-heading font-semibold text-s-ink">{o.label}</span>
    </button>
  );
})}
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P9: category grid → rounded-[12px], font-heading, coral active icon"`

---

## Phase 10 — DoneScreen: Remove Scale Spring (CRITICAL NEVER)

### Current state (register/page.tsx lines 499–506)
```tsx
<motion.div
  initial={{ scale: 0, rotate: -20 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 18 }}
  className="w-20 h-20 rounded-card ...">
```
- `scale: 0 → 1` — **NEVER rule #8**: never scale between 0 and 1 on a container in Zone 3
- `rotate: -20 → 0` — excessive, Zone 3 max is subtle motion
- `rounded-card` → `rounded-[20px]` (icon boxes in auth can be slightly rounder)

### ⚠️ BE CAREFUL — This is the completion state. The user successfully registered — the animation must still feel celebratory but NOT use scale/bounce.

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 496–522** — DoneScreen:
```tsx
function DoneScreen() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      {/* Icon — fade in only, NO scale */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="w-16 h-16 rounded-[20px] flex items-center justify-center"
        style={{ background: "rgba(76,175,111,.12)" }}>
        <PartyPopper size={28} className="text-[#4CAF6F]" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}>
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-[#4CAF6F] mb-2">
          Konto erstellt
        </p>
        <p className="font-heading font-bold text-xl text-s-ink">Willkommen bei solen.ch!</p>
        <p className="font-body italic text-s-ink/45 text-sm mt-1">Du wirst weitergeleitet…</p>
      </motion.div>

      {/* Loading dots — opacity animation only */}
      <div className="flex gap-1.5 mt-1">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }} />
        ))}
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P10: DoneScreen — remove scale/rotate spring NEVER violation, fade-in only"`

---

## Phase 11 — Email Verification Success State

### Current state (register/page.tsx lines 130–142)
```tsx
<div className="w-14 h-14 rounded-card bg-s-coral/10 ...">
  <Mail size={26} className="text-s-coral" />
</div>
<p className="font-heading font-semibold text-lg">Fast fertig!</p>
<button onClick={onNext} className="text-sm text-s-coral hover:underline font-body mt-4">
  Weiter zum Onboarding (Test)
</button>
```
- `rounded-card` → `rounded-[14px]`
- `"Weiter zum Onboarding (Test)"` — the "(Test)" label must be removed before production
- `font-body mt-4` link — upgrade to proper button

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
**Lines 128–142** — email success state:
```tsx
if (success) {
  return (
    <div className="text-center py-6 flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-[14px] flex items-center justify-center"
        style={{ background: "rgba(232,98,74,.10)" }}>
        <Mail size={24} className="text-s-coral" />
      </div>
      <div>
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-coral mb-2">
          E-Mail gesendet
        </p>
        <p className="font-heading font-bold text-lg text-s-ink">Fast fertig!</p>
        <p className="text-xs font-body text-s-ink/50 mt-1 leading-relaxed">
          Überprüfe deine E-Mails und klicke auf den Bestätigungslink.
        </p>
      </div>
      {/* Remove "(Test)" label in production */}
      <button onClick={onNext}
        className="text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-coral/60 hover:text-s-coral transition-colors mt-2">
        Weiter →
      </button>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P11: email success state → 14px icon box, eyebrow label, remove Test label"`

---

## Phase 12 — Back Navigation Arrow

### Current state (register/page.tsx lines 605–612)
```tsx
<button className="flex items-center gap-1.5 text-sm text-s-ink/40 hover:text-s-ink font-body mb-4 transition-colors">
  <ArrowLeft size={14} /> Zurück
</button>
```
- `text-sm font-body` → `text-[11px] font-heading font-bold uppercase tracking-[.06em]`

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Bocale%5D/auth/register/page.tsx)
**Lines 605–612**:
```tsx
<button onClick={() => goTo((step - 1) as WizardStep)}
  className="flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/35 hover:text-s-ink dark:hover:text-s-dm-text transition-colors mb-4">
  <ArrowLeft size={12} /> Zurück
</button>
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx && git commit -m "AUTH-P12: back nav → font-heading, uppercase, 11px"`

---

## Phase 13 — Step Counter: Right-Aligned (merged into P5)

> Handled inside Phase 5 — step count is the `<p>` below the progress bar. No separate work needed.

**Git commit:** (included in P5)

---

## Phase 14 — Reset Password Page

### ⚠️ Must read `app/[locale]/auth/reset-password/page.tsx` before implementing

```bash
cat app/[locale]/auth/reset-password/page.tsx
```

Expected issues:
- Same card style as login but for reset flow
- Form: email input + submit
- May show success state after submit

### Files to modify

#### [MODIFY] [reset-password/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/reset-password/page.tsx)
Apply same card treatment as P1 (warm shadow, `rounded-[16px]`, single ambient bloom).

Input:
```tsx
className="w-full px-4 py-3.5 rounded-[12px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
```

CTA:
```tsx
className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}
```

Add eyebrow label:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 text-center mb-2">
  Konto-Wiederherstellung
</p>
<h1 className="font-heading font-bold text-xl text-s-ink text-center mb-5">Passwort zurücksetzen</h1>
```

**Git commit:** `git add app/[locale]/auth/reset-password/page.tsx && git commit -m "AUTH-P14: reset-password → same V3 card spec, eyebrow, coral CTA"`

---

## Phase 15 — Auth Error + Toast States

### Current state
- Error messages in `StepRegister` are shown via `useToast()` ✅ — correct pattern
- Any inline `<p className="text-xs text-s-coral">` error messages must also follow the pattern

### Files to modify

#### [MODIFY] [register/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/auth/register/page.tsx)
If any inline error `<p>` elements exist, replace with:
```tsx
{error && (
  <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20"
    style={{ background: "rgba(232,98,74,.06)" }}>
    <AlertCircle size={13} className="text-s-coral shrink-0" />
    <p className="text-xs font-body text-s-coral">{error}</p>
  </div>
)}
```

**Git commit:** `git add app/[locale]/auth/register/page.tsx components/auth/SignIn.tsx && git commit -m "AUTH-P15: inline error state → coral tint card, icon + message"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Login page card | ✅ Start here |
| P2 | SignIn component | ✅ Read first, then restyle |
| P3 | Logo lockup (both pages) | ✅ Independent |
| P4 | Register wrapper | ✅ Independent |
| P5 | Progress indicator | ✅ Independent |
| P6 | StepRole cards | ✅ Independent |
| P7 | StepRegister inputs | ✅ Independent |
| P8 | SelectPill | ✅ Independent |
| P9 | Category grid | ✅ Independent |
| P10 | DoneScreen scale fix | ✅ **CRITICAL — do first in register file** |
| P11 | Email success state | After P10 (same context) |
| P12 | Back nav arrow | ✅ Independent |
| P14 | Reset password page | ✅ Independent |
| P15 | Error + toast states | Last |

> P1–P9, P12, P14 all parallel.
> P10 → P11 sequential.
> P15 last.

---

## ZONE 3 FINAL COMPLIANCE CHECK

```bash
npm run build

# Verify single ambient blob only:
grep -n "rounded-full" app/[locale]/auth/login/page.tsx
# Expected: 1 result (the single ambient glow)

# Verify no cold shadows:
grep -rn "shadow-glass\|rgba(0,0,0" app/[locale]/auth/
# Expected: 0 results

# Verify no scale(0) or rotate in motion:
grep -rn "scale: 0\|rotate:" app/[locale]/auth/
# Expected: 0 results after P10

# Verify no rounded-card:
grep -rn "rounded-card" app/[locale]/auth/ components/auth/
# Expected: 0 results

# Verify no Bebas Neue:
grep -rn "font-display" app/[locale]/auth/ components/auth/
# Expected: 0 results

# Manual checklist:
# ✅ Login: single ambient glow, warm card shadow
# ✅ Login: sign in form inputs have 3.5 padding
# ✅ Register: role cards 12px radius, amber icon for salon
# ✅ Progress bar: 3-segment linear track
# ✅ SelectPill: font-heading coral active
# ✅ Category grid: 12px radius, no rounded-card
# ✅ DoneScreen: fade-in only, NO scale spring
# ✅ Email success: removed "(Test)" label
# ✅ prefers-reduced-motion: all transitions disabled
```
