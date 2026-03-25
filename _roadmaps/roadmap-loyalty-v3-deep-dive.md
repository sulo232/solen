# Loyalty / Stamp Page — Deep-Dive V3 Roadmap

> **Scope:**
> - `app/[locale]/loyalty/stamp/page.tsx` (115 lines) — QR stamp redemption page (3 states: ready, stamped, error)
> - `components/loyalty/StampCard.tsx` (133 lines) — reusable stamp card component used on Salon Profile, Warum Solen, and User Profile
>
> **Zone: 3 (Clean Functional)** — The stamp page is a trust-critical redemption screen shown at point-of-sale (salon scans customer QR code). Zero glass, zero blobs. Instant feedback states are the entire UX here.
> **StampCard zone: 2** — As a displayed widget it appears in Zone 2 contexts. Already mostly compliant — minor fixes only.
>
> ⚠️ **CRITICAL:** All API calls (`/api/loyalty/stamp`), `token` URL param parsing, state machine logic (loading → ready → stamped/error), and confetti animation in StampCard must remain completely untouched.

---

## Violations Found

### Stamp Page (`loyalty/stamp/page.tsx`)

| Location | Issue | Action |
|---|---|---|
| Loading state (line 60) | `"Laden..."` plain text, no structure | → coral pulse dots loading indicator |
| Ready card (line 64) | `rounded-card shadow-card` | → `rounded-[16px]` + warm shadow inline |
| Award icon (line 65) | Raw `Award size={40} text-s-coral mx-auto mb-4` — no icon box | → coral icon box |
| Ready card body (line 69) | `text-sm text-s-ink/50` ✅ font-body | Keep |
| Ready CTA button (line 74) | `font-medium text-sm hover:bg-s-coral-hover` | → `font-heading font-bold uppercase text-xs hover:brightness-[1.06]` |
| Stamped card (line 82) | `rounded-card shadow-card` | → `rounded-[16px]` warm shadow |
| **Stamped icon** (line 83) | `animate-[scale_0.3s_ease-out]` **NEVER #8** | → `animate-[fade-in-up_0.3s_ease-out]` no scale |
| Stamped icon bg (line 83) | `bg-s-sage/10 rounded-full` — ok, but no icon box pattern | → icon box `rounded-[18px]` green tint |
| Progress label (line 90) | `text-sm text-s-ink/70` — `font-body` correct | → `font-heading font-bold` + eyebrow |
| Complete reward label (line 93) | `text-sm font-medium text-s-coral` | → `font-heading font-bold` |
| Error card (line 101) | `rounded-card shadow-card` | → `rounded-[16px]` warm shadow |
| Error icon (line 102) | Raw `AlertCircle size={40}` | → coral icon box (error tint) |
| Error heading (line 103) | `text-lg font-bold` ✅ but no eyebrow | → add coral eyebrow |

### StampCard (`components/loyalty/StampCard.tsx`)

| Location | Issue | Action |
|---|---|---|
| Progress counter (line 117) | `data-text font-medium text-s-ink/40` | → `font-heading font-bold` |
| Complete banner (line 125) | `font-medium text-s-coral` | → `font-heading font-bold` |
| Stamp circles (line 98–108) | ✅ `rounded-full bg-s-coral text-white` + dashed border — keep | Keep |
| `stamp-new` class animation | Must verify no scale in globals.css | Verify only |

---

## Phase 1 — Stamp Page: All Three State Cards

### Files to modify

#### [MODIFY] [loyalty/stamp/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/loyalty/stamp/page.tsx)

**Lines 59–61** — loading state:
```tsx
{status === "loading" && (
  <div className="flex items-center justify-center gap-1.5 py-16">
    {[0, 1, 2].map((i) => (
      <div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral/50 animate-pulse"
        style={{ animationDelay: `${i * 0.2}s` }} />
    ))}
  </div>
)}
```

**Lines 63–78** — "ready" state card:
```tsx
{status === "ready" && (
  <div className="rounded-[16px] bg-white dark:bg-s-dm-surface p-8 text-center"
    style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 28px rgba(26,18,9,.08)" }}>
    {/* Icon box */}
    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
      style={{ background: "rgba(232,98,74,.10)" }}>
      <Award size={30} className="text-s-coral" />
    </div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
      Stempelkarte
    </p>
    <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
      Stempel hinzufügen?
    </h1>
    <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50 mb-6 leading-relaxed">
      Tippe auf den Button, um einen Stempel zu vergeben.
    </p>
    <button onClick={handleStamp}
      className="w-full rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] py-3.5 hover:brightness-[1.06] active:scale-[0.98] transition-all"
      style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
      Stempel vergeben
    </button>
  </div>
)}
```

**Lines 81–97** — "stamped" state card (NEVER fix on icon):
```tsx
{status === "stamped" && (
  <div className="rounded-[16px] bg-white dark:bg-s-dm-surface p-8 text-center"
    style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 28px rgba(26,18,9,.08)" }}>
    {/* ✅ NO scale animation — opacity+translateY only */}
    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
      style={{
        background: "rgba(76,175,111,.12)",
        animation: "fade-in-up 0.35s cubic-bezier(0.25,1,0.5,1) both"
      }}>
      <Check size={28} className="text-[#4CAF6F]" />
    </div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-[#4CAF6F] mb-2">
      Gestempelt
    </p>
    <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-3">
      Gestempelt!
    </h1>
    <p className="text-sm font-heading font-semibold text-s-ink/60 dark:text-s-dm-text/60">
      {result.stamps_collected}/{result.stamps_required} Stempel
    </p>
    {result.is_complete && (
      <div className="mt-4 px-4 py-2.5 rounded-[10px] inline-block"
        style={{ background: "rgba(232,98,74,.08)" }}>
        <p className="text-xs font-heading font-bold uppercase tracking-[.08em] text-s-coral">
          Belohnung freigeschaltet! 🎉
        </p>
      </div>
    )}
  </div>
)}
```

> Ensure `fade-in-up` keyframe exists in globals.css:
> ```css
> @keyframes fade-in-up {
>   from { opacity: 0; transform: translateY(12px); }
>   to   { opacity: 1; transform: translateY(0); }
> }
> ```

**Lines 100–110** — "error" state card:
```tsx
{status === "error" && (
  <div className="rounded-[16px] bg-white dark:bg-s-dm-surface p-8 text-center"
    style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 28px rgba(26,18,9,.08)" }}>
    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
      style={{ background: "rgba(232,98,74,.10)" }}>
      <AlertCircle size={28} className="text-s-coral" />
    </div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
      Fehler
    </p>
    <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
      Etwas ist schiefgelaufen
    </h1>
    <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50">
      {result.error}
    </p>
  </div>
)}
```

**Git commit:** `git add app/[locale]/loyalty/stamp/page.tsx && git commit -m "LOYALTY-P1: all 3 stamp states → rounded-[16px], icon boxes, NEVER fix on scale animation"`

---

## Phase 2 — Globals.css: Verify fade-in-up Keyframe

```bash
grep -n "fade-in-up" app/globals.css
```

If not present, add to globals.css:
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Git commit (if needed):** `git add app/globals.css && git commit -m "LOYALTY-P2: add fade-in-up keyframe for stamp success icon"`

---

## Phase 3 — Verify stamp-new Animation (no scale)

```bash
grep -A 5 "stamp-new" app/globals.css
```

If it contains `scale` → fix:
```css
@keyframes stamp-new {
  0%   { opacity: 0; transform: translateY(6px); }
  60%  { opacity: 1; transform: translateY(-2px); }
  100% { opacity: 1; transform: translateY(0); }
}
.stamp-new {
  animation: stamp-new 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
```

**Git commit (if needed):** `git add app/globals.css && git commit -m "LOYALTY-P3: stamp-new keyframe → remove scale, opacity+translateY only"`

---

## Phase 4 — StampCard: Progress Counter + Complete Banner

### Current state
```tsx
{/* Progress counter - line 117 */}
<span className="text-[10px] data-text font-medium text-s-ink/40 whitespace-nowrap">
  {stampsCollected}/{stampsTotal}
</span>

{/* Complete banner - lines 125-127 */}
<p className="text-xs font-medium text-s-coral">
  Belohnung freigeschaltet!
</p>
```

### Files to modify

#### [MODIFY] [StampCard.tsx](file:///c:/Users/sulod/solen/components/loyalty/StampCard.tsx)
**Line 117** — progress counter:
```tsx
<span className="text-[10px] font-heading font-bold text-s-ink/35 dark:text-s-dm-text/35 whitespace-nowrap uppercase tracking-[.08em]">
  {stampsCollected}/{stampsTotal}
</span>
```

**Lines 124–128** — complete overlay:
```tsx
{isComplete && (
  <div className="absolute bottom-0 left-0 right-0 border-t border-s-coral/20 px-4 py-2.5 text-center"
    style={{ background: "rgba(232,98,74,.08)" }}>
    <p className="text-[10px] font-heading font-bold uppercase tracking-[.12em] text-s-coral">
      Belohnung freigeschaltet!
    </p>
  </div>
)}
```

**Git commit:** `git add components/loyalty/StampCard.tsx && git commit -m "LOYALTY-P4: StampCard → progress counter font-heading, complete banner font-heading uppercase"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P2 | Check globals.css `fade-in-up` | ✅ Start here |
| P3 | Check `stamp-new` keyframe | ✅ Parallel with P2 |
| P1 | All 3 stamp page states | After P2 + P3 confirmed |
| P4 | StampCard minor fixes | ✅ Independent |

> P2 + P3 first (dependency check).
> P1 after P2/P3.
> P4 fully independent.

---

## LOYALTY COMPLIANCE CHECK

```bash
npm run build

# NEVER violation removed:
grep -n "animate-\[scale" app/[locale]/loyalty/stamp/page.tsx
# Expected: 0 results

# rounded-card + shadow-card removed:
grep -n "rounded-card\|shadow-card" app/[locale]/loyalty/stamp/page.tsx
# Expected: 0 results

# font-medium removed:
grep -n "font-medium" app/[locale]/loyalty/stamp/page.tsx components/loyalty/StampCard.tsx
# Expected: 0 results

# API call untouched:
grep -n "api/loyalty/stamp" app/[locale]/loyalty/stamp/page.tsx
# Expected: present on line 33

# Manual checklist:
# ✅ Loading: coral pulse dots, no spinner
# ✅ Ready: icon box, eyebrow, font-heading uppercase CTA, warm shadow
# ✅ Stamped: icon box green tint, green eyebrow "Gestempelt", NO SCALE animation
# ✅ Stamped: progress → font-heading, complete → coral tinted inline box
# ✅ Error: icon box, coral eyebrow "Fehler", font-body message
# ✅ StampCard: progress counter font-heading, complete banner font-heading uppercase
# ✅ Confetti overlay: NOT TOUCHED
# ✅ stamp-new keyframe: no scale
```

---

## Final Step — Push

```bash
git push
```
