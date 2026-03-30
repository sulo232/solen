# Shared Components — V3 Hardening Roadmap

> **Scope:** Cross-platform utility components used in 7+ pages. Fix these once and every page inherits the benefit.
> - `components/ui/Spinner.tsx` — used in Last Minute, Tip, Walk-in Pay, Dashboard, Booking Flow, Checkout, Auth
> - `components/ui/EmptyState.tsx` — used in Last Minute, Discover, Dashboard, User Profile, Account/Messages
> - `components/FilterBar.tsx` — used in Category/Search, Last Minute, Discover (**already V3 compliant ✅**)
>
> **Zone: Varies** — These components render inside the zone of their parent page. They must be neutral and universal.
>
> ⚠️ **EXECUTE BEFORE INDIVIDUAL PAGE ROADMAPS** for loading/empty state phases. Doing so means per-page roadmaps don't need to replace Spinner inline — they can use it as-is.

---

## Audit Results

### `Spinner.tsx` — 2 tiers

| Status | Detail |
|---|---|
| ✅ **Compliant** | Border tokens already warm: `border-s-ink/[0.10] border-t-s-ink/60`; `invert` variant uses `border-white/30 border-t-white` |
| ⚠️ **Enhancement** | The spinner is functional but all page roadmaps replace it with coral pulse dots for full-page loading states. The Spinner itself stays for inline CTA loading (`<Spinner size="sm" invert />` inside buttons) |

**Decision:** Spinner stays exactly as-is for button loading states. Page-level loading is handled via skeleton/dot patterns defined per-page in each roadmap.

---

### `EmptyState.tsx` — 1 critical violation

| Location | Issue | Fix |
|---|---|---|
| Line 43 | `scale-[1.8]` on halo div — **NEVER #8** | → remove scale, use `w-28 h-28` explicit size |

```tsx
{/* Current — NEVER violation */}
<div className="absolute inset-0 rounded-full bg-s-coral/10 scale-[1.8] blur-xl" />

{/* Fix — no scale, explicit size */}
<div className="absolute inset-[-20px] rounded-full bg-s-coral/10 blur-xl" />
```

Also: `message` uses `font-body italic` — italic on body copy is fine ✅ but check across pages.

---

### `FilterBar.tsx` — Fully compliant ✅

Already uses:
- `pillBase` with `font-heading font-bold uppercase tracking-[.06em]`
- Inline rgba backdrop filters
- Warm shadow tokens `rgba(26,18,9,x)`
- `rounded-btn` for pills, `rounded-[20px]` for dropdowns
- `motion.div` with `opacity: 0, y: 10` (no scale ✅)

**No changes needed.**

---

## Phase 1 — EmptyState: Remove scale Halo (NEVER #8 Fix)

### Files to modify

#### [MODIFY] [EmptyState.tsx](file:///c:/Users/sulod/solen/components/ui/EmptyState.tsx)
**Lines 41–47** — icon container with halo:
```tsx
<div className="relative mb-5 flex items-center justify-center w-16 h-16">
  {/* Soft halo — NO scale, explicit negative inset */}
  <div className="absolute -inset-5 rounded-full blur-xl"
    style={{ background: "rgba(232,98,74,.09)" }} />
  <div className="relative flex items-center justify-center w-16 h-16 rounded-[20px]"
    style={{ background: "rgba(232,98,74,.10)" }}>
    <Icon size={28} className="text-s-coral" strokeWidth={1.5} />
  </div>
</div>
```

> The halo uses `-inset-5` (20px outset) instead of `scale-[1.8]`. Same visual, zero scale transform.

**Git commit:** `git add components/ui/EmptyState.tsx && git commit -m "SHARED-P1: EmptyState halo → remove scale-[1.8] NEVER violation, use inset expansion"`

---

## Phase 2 — EmptyState: Add Optional Eyebrow Prop

### Enhancement — BackwardsCompatible

Allow pages to pass an `eyebrow` prop for contextual labels (e.g., `"Nachrichten"`, `"Ergebnisse"`):

#### [MODIFY] [EmptyState.tsx](file:///c:/Users/sulod/solen/components/ui/EmptyState.tsx)

**Lines 10–17** — interface:
```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
  illustration?: keyof typeof ILLUSTRATIONS;
  eyebrow?: string;        // NEW — optional context label
  className?: string;
}
```

**Lines 22–55** — render: add eyebrow above `h3`:
```tsx
export default function EmptyState({
  icon: Icon, title, message, action, illustration, eyebrow, className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      {illustration && (
        <Image src={ILLUSTRATIONS[illustration]} alt="" width={120} height={120}
          className="mb-4 opacity-80" priority={false} />
      )}
      <div className="relative mb-5 flex items-center justify-center w-16 h-16">
        <div className="absolute -inset-5 rounded-full blur-xl"
          style={{ background: "rgba(232,98,74,.09)" }} />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-[20px]"
          style={{ background: "rgba(232,98,74,.10)" }}>
          <Icon size={28} className="text-s-coral" strokeWidth={1.5} />
        </div>
      </div>
      {eyebrow && (
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
          {eyebrow}
        </p>
      )}
      <h3 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-lg mb-1.5">{title}</h3>
      {message && (
        <p className="font-body text-s-ink/50 dark:text-s-dm-text/50 text-sm max-w-xs leading-relaxed">
          {message}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

> Note: `italic` removed from message — per V3 body copy rules, italics on sans-serif is discouraged.

**Git commit:** `git add components/ui/EmptyState.tsx && git commit -m "SHARED-P2: EmptyState → optional eyebrow prop, remove italic message, P1 halo fix included"`

---

## Phase 3 — Spinner: Coral Variant

Spinner is compliant for button states. Add a `coral` color prop for cases where a neutral dark spinner looks wrong against dark/coral backgrounds:

#### [MODIFY] [Spinner.tsx](file:///c:/Users/sulod/solen/components/ui/Spinner.tsx)
```tsx
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  invert?: boolean;
  coral?: boolean;          // NEW — coral spinner for use on light card surfaces
  className?: string;
}

export default function Spinner({ size = "md", invert = false, coral = false, className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Laden…"
      className={cn(
        "animate-spin rounded-full border-2",
        sizeMap[size],
        invert
          ? "border-white/30 border-t-white"
          : coral
          ? "border-s-coral/20 border-t-s-coral"
          : "border-s-ink/[0.10] border-t-s-ink/60",
        className
      )}
    />
  );
}
```

**Git commit:** `git add components/ui/Spinner.tsx && git commit -m "SHARED-P3: Spinner → add coral variant for light surface loading states"`

---

## Phase 4 — Verify FilterBar (Compliance Check Only)

No code changes — only verify no regressions from Token Sweep:

```bash
# Pill tokens must use font-heading:
grep -n "pillBase\|font-heading" components/FilterBar.tsx
# Expected: pillBase defined with font-heading font-bold uppercase

# No cold shadows:
grep -n "rgba(0,0,0" components/FilterBar.tsx
# Expected: 0

# Warm shadows only:
grep -n "rgba(26,18,9" components/FilterBar.tsx
# Expected: present on lines 106, 162, 255

# No scale animations:
grep -n "scale-" components/FilterBar.tsx
# Expected: 0
```

**Git commit (if any patch needed):** `git add components/FilterBar.tsx && git commit -m "SHARED-P4: FilterBar compliance verified, no changes needed"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | EmptyState halo NEVER fix | ✅ Start first |
| P2 | EmptyState eyebrow prop | After P1 (same file) |
| P3 | Spinner coral variant | ✅ Independent |
| P4 | FilterBar verification | ✅ Independent |

> P1→P2 sequential (same file).
> P3 + P4 fully parallel.

---

## SHARED COMPONENTS COMPLIANCE CHECK

```bash
npm run build

# NEVER violation resolved in EmptyState:
grep -n "scale-\[1.8\]" components/ui/EmptyState.tsx
# Expected: 0

# Eyebrow prop added:
grep -n "eyebrow" components/ui/EmptyState.tsx
# Expected: in interface + render

# Coral variant in Spinner:
grep -n "coral" components/ui/Spinner.tsx
# Expected: present

# Spinner button usage still intact:
grep -rn "Spinner size=\"sm\" invert" --include="*.tsx" app/ components/
# Expected: multiple pages still using this

# FilterBar pillBase still correct:
grep -n "font-heading font-bold uppercase" components/FilterBar.tsx
# Expected: present in pillBase

# Manual checklist:
# ✅ EmptyState halo: -inset-5 blur-xl (no scale)
# ✅ EmptyState: italic removed from message
# ✅ EmptyState: eyebrow?: string prop added
# ✅ Spinner: coral variant available
# ✅ Spinner: existing invert usage unchanged
# ✅ FilterBar: fully compliant, no changes
```

---

## 🎯 Ripple Effect Across Pages

After these fixes:
- Every `<EmptyState>` across Last Minute, Discover, Dashboard, User Profile, Account/Messages automatically gets the NEVER-compliant halo
- Pages can optionally pass `eyebrow="Ergebnisse"` for free contextual labels
- `<Spinner coral />` available for future use
- FilterBar ✅ certified — no per-page fix needed

---

## Final Step — Push

```bash
git push
```
