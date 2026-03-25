# User Profile Page — Deep-Dive V3 Roadmap

> **Scope:** `components/ProfilePage.tsx` (938 lines, 24 imports — largest component after the register wizard), `app/[locale]/profile/packages/page.tsx`, `app/[locale]/profile/gift-cards/page.tsx`, `app/[locale]/profile/referral/page.tsx`, `app/[locale]/profile/intake-forms/page.tsx`, `components/ui/GlassModal.tsx`, `components/loyalty/StampCard.tsx`.
> **Zone: 3 (Clean Functional)** — This is a transactional account page. Zero glass on cards, zero blobs, max 12px radius. The profile hero avatar can use Zone 2 treatment (glass Tier 2).

---

## Zone 3 Profile Exception (Documented)

The profile **hero section** (avatar + name + bio header) sits at the top and is the only area that may use a subtle warm ambient glow and glass Tier 2 card treatment. All other sections below the hero are strict Zone 3: solid white cards, warm borders, no backdrop-blur.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Profile hero header | 🟡 Medium | Avatar upload logic must be preserved |
| P2 — Booking card (BookingCard) | 🟢 Low | Visual-only — logic untouched |
| P3 — Status badge colours | 🟢 Low | CSS token fix |
| P4 — Cancel button row | 🟢 Low | Button styles only |
| P5 — Tooltip "cancel too late" | 🟢 Low | Tooltip card styling |
| P6 — CancelModal (GlassModal) | 🟡 Medium | GlassModal wraps the cancel flow — inspect GlassModal.tsx |
| P7 — ReferralSection container | 🟢 Low | Card visual only |
| P8 — Referral code display | 🟢 Low | Mono input box + copy button |
| P9 — Share buttons | 🟡 Medium | WhatsApp/SMS third-party — keep functionality, restyle |
| P10 — Reward tracking row | 🟢 Low | Stat display |
| P11 — Loyalty StampCard section | 🟡 Medium | Read StampCard.tsx before implementing |
| P12 — Favourites section | 🟢 Low | Section header + SalonCard grid |
| P13 — Profile sub-pages (packages) | 🟢 Low | All use rounded-card → 12px |
| P14 — Packages progress bar | 🟢 Low | Visual upgrade |
| P15 — Profile skeleton + loading | 🟢 Low | Replace full-page spinner |

---

## Phase 1 — Profile Hero: Avatar + Bio Header

### Current state (ProfilePage.tsx — hero section near top)
Look for the avatar display block and the name/bio header.

Expected issues:
- Avatar: `rounded-full bg-s-bg-sunken` — fine ✅
- Container: likely `rounded-card bg-white` — needs Zone 3 spec
- Missing: eyebrow `solen.ch · Dein Profil` above the name

### ⚠️ BE CAREFUL
- Avatar upload logic (file input → API call) must stay fully untouched.
- `SolenExclusiveBadge` component placed next to the name must not be moved.

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)

Hero section header eyebrow:
```tsx
{/* Profile hero section */}
<div className="rounded-[16px] border border-s-ink/[0.06] p-5 mb-4"
  style={{ background: "rgba(255,255,255,.90)", boxShadow: "0 1px 2px rgba(26,18,9,.05)" }}>
  
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-4">
    Mein Profil
  </p>
  
  {/* Avatar row */}
  <div className="flex items-center gap-4">
    {/* avatar + upload button — keep all logic */}
    <div className="w-16 h-16 rounded-full overflow-hidden bg-s-bg-sunken flex items-center justify-center relative shrink-0">
      {profile.avatar_url ? (
        <Image src={profile.avatar_url} alt={profile.display_name ?? ""} fill className="object-cover" />
      ) : (
        <span className="text-2xl font-heading font-bold text-s-ink/20">
          {(profile.display_name ?? "?")[0].toUpperCase()}
        </span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-heading font-bold text-lg text-s-ink truncate">{profile.display_name}</p>
        <SolenExclusiveBadge profile={profile} />
      </div>
      <p className="text-xs font-body italic text-s-ink/45 mt-0.5 truncate">{profile.bio}</p>
    </div>
    {/* Settings gear */}
    <a href={`/${locale}/profile/settings`}
      className="w-9 h-9 rounded-[10px] border border-s-ink/[0.08] flex items-center justify-center hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-colors shrink-0">
      <Settings size={15} className="text-s-ink/40" />
    </a>
  </div>
</div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P1: profile hero → rounded-[16px], eyebrow label, initials fallback"`

---

## Phase 2 — BookingCard: Zone 3 Row Polish

### Current state (ProfilePage.tsx lines 264, 267, 276)
```tsx
<div className="bg-white rounded-card border border-s-ink/5 p-4">
  <p className="font-medium text-sm text-s-ink">{b.salon_name}</p>
  <span className={["text-xs font-medium", STATUS_COLOR[b.status]].join(" ")}>
```
**Issues:**
- `rounded-card` → `rounded-[12px]`
- `font-medium` → `font-heading font-semibold` for salon name
- Service name, date/time: upgrade to eyebrow micro font

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 264–279** — BookingCard outer:
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white dark:bg-s-dm-surface">
  <div className="flex justify-between items-start gap-4">
    <div>
      <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">{b.salon_name}</p>
      <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/40 mt-0.5">{b.service_name}</p>
      <p className="text-xs font-body text-s-ink/40 mt-1">
        {dateFmt} · {timeFmt}
      </p>
    </div>
    <span className={/* status badge — Phase 3 */}>
      {STATUS_LABEL[b.status]}
    </span>
  </div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P2: BookingCard → rounded-[12px], font-heading salon name, eyebrow service"`

---

## Phase 3 — Status Badges: Semantic Colours

### Current state (ProfilePage.tsx lines 230–235)
```tsx
const STATUS_COLOR = {
  confirmed: "text-s-coral",
  cancelled: "text-s-coral",   // ← same as confirmed — wrong
  completed: "text-s-ink/50",
  no_show:   "text-s-ink/30",
};
```
**Issues:**
- `confirmed` and `cancelled` both use `text-s-coral` — semantically wrong
- Cancelled should be a muted red, completed should be green

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 230–235** — STATUS_COLOR:
```tsx
// Status badges — replace text-only with inline pill specs:
const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  confirmed: { label: t("statusConfirmed"), bg: "rgba(76,175,111,.12)",  color: "#1f6535" },
  cancelled: { label: t("statusCancelled"), bg: "rgba(232,98,74,.10)",   color: "#7A2415" },
  completed: { label: t("statusCompleted"), bg: "rgba(26,18,9,.06)",     color: "rgba(26,18,9,.50)" },
  no_show:   { label: t("statusNoShow"),    bg: "rgba(26,18,9,.04)",     color: "rgba(26,18,9,.30)" },
};

// Usage:
const badge = STATUS_BADGE[b.status];
<span className="text-[9px] font-heading font-bold uppercase tracking-[.08em] px-2 py-1 rounded-[6px] shrink-0"
  style={{ background: badge?.bg, color: badge?.color }}>
  {badge?.label ?? b.status}
</span>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P3: STATUS_BADGE — semantic colours: green confirmed, coral cancelled, muted completed"`

---

## Phase 4 — Cancel Button Row: Action Chips

### Current state (ProfilePage.tsx lines 282–318)
```tsx
<Link className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-ink/10 text-xs ...">
  <RotateCcw size={12} /> {t("rebookAction")}
</Link>
<button className="px-3 py-1.5 rounded-btn border border-s-coral/30 text-xs text-s-coral ...">
  {t("cancelAction")}
</button>
```
- `py-1.5` — 24px total height, minimum tap target should be 40px on mobile. Wrap in a container with `min-h-[40px] flex items-center`.
- Add `font-heading font-semibold uppercase tracking-[.04em]` to both action buttons.

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 282–320** — action buttons:
```tsx
<div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-s-ink/[0.05]">
  {b.salon_slug && (
    <Link href={...}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-ink/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/50 hover:text-s-coral hover:border-s-coral/40 transition-colors">
      <RotateCcw size={12} /> Wieder buchen
    </Link>
  )}
  {canCancel && (
    <button onClick={() => onCancel(b)}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-coral/25 text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-coral hover:bg-s-coral/[0.05] transition-colors">
      <X size={12} /> Stornieren
    </button>
  )}
  {b.status === "completed" && <ReportProblemButton bookingId={b.id} />}
</div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P4: action chips → font-heading uppercase, 8px radius, 40px min-height"`

---

## Phase 5 — Tooltip "Cancel Too Late": Inline Warning

### Current state (ProfilePage.tsx lines 306–317)
```tsx
<div className="absolute bottom-full ... bg-s-ink rounded-card px-2.5 py-1.5 opacity-0 group-hover:opacity-100 ...">
```
- `rounded-card` → `rounded-[8px]`
- Add `text-[10px] font-heading` inside

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 307–317** — tooltip:
```tsx
<div className="relative group inline-block">
  <button disabled
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-ink/[0.06] text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/20 cursor-not-allowed">
    <X size={12} /> Stornieren
  </button>
  <div className="absolute bottom-full left-0 mb-2 w-48 rounded-[8px] px-3 py-2 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    style={{ background: "rgba(26,18,9,.92)" }}>
    <p className="text-[10px] font-heading text-white/80">{t("cancelTooLate")}</p>
  </div>
</div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P5: cancel tooltip → rounded-[8px], font-heading, warm dark bg"`

---

## Phase 6 — CancelModal: Read GlassModal + Restyle

### ⚠️ Must read `components/ui/GlassModal.tsx` before implementing

```bash
cat components/ui/GlassModal.tsx
```

Expected issues:
- `GlassModal` likely uses `backdrop-blur` + `shadow-glass` — fine for a modal overlay (overlay is always Zone-exempt since it appears over everything)
- BUT the modal card itself should use warm shadow spec
- Input inside the modal: `rounded-input` — verify pixel value

### Files to modify

#### [MODIFY] [GlassModal.tsx](file:///c:/Users/sulod/solen/components/ui/GlassModal.tsx)

Modal card:
```tsx
<div className="relative w-full max-w-md rounded-[16px] overflow-hidden"
  style={{
    background: "#FFFFFF",
    boxShadow: "0 8px 24px rgba(26,18,9,.12), 0 32px 64px rgba(26,18,9,.10)"
  }}>
  {/* Header */}
  <div className="px-6 pt-6 pb-4 border-b border-s-ink/[0.06]">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-1">
      Buchung
    </p>
    <h2 className="font-heading font-bold text-lg text-s-ink">{title}</h2>
  </div>
  <div className="px-6 py-5">
    {children}
  </div>
</div>
```

Textarea in CancelModal (ProfilePage.tsx line 90):
```tsx
className="w-full px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-s-bg-base text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors resize-none"
```

Label (line 84):
```tsx
<label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
  {t("reasonOptional")}
</label>
```

**Git commit:** `git add components/ui/GlassModal.tsx components/ProfilePage.tsx && git commit -m "PROF-P6: GlassModal → warm shadow, no glass, Zone 3 modal card"`

---

## Phase 7 — ReferralSection: Container

### Current state (ProfilePage.tsx lines 155–221)
```tsx
<div className="bg-white rounded-card border border-s-ink/5 p-4 space-y-3">
  <div className="flex ... p-3 rounded-card bg-s-coral/5 border border-s-coral/15">
```
**Issues:**
- Two `rounded-card` → `rounded-[12px]` and `rounded-[10px]` respectively

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 158, 160** — referral container:
```tsx
// Outer:
<div className="rounded-[12px] border border-s-ink/[0.06] bg-white dark:bg-s-dm-surface p-5 space-y-4">
  {/* Eyebrow header */}
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35">
    Freunde einladen
  </p>

// Inner invite banner:
<div className="flex items-center gap-3 p-3 rounded-[10px]"
  style={{ background: "rgba(232,98,74,.06)", border: "1px solid rgba(232,98,74,.15)" }}>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P7: ReferralSection container → 12px radius, eyebrow label, warm coral tint"`

---

## Phase 8 — Referral Code Display

### Current state (ProfilePage.tsx lines 171–183)
```tsx
<div className="flex-1 px-3 py-2 rounded-input bg-s-bg-surface border border-s-ink/10 font-mono text-sm tracking-wide">
  {code}
</div>
<button className="px-3 py-2 rounded-btn bg-s-ink/5 ...">
  <Copy size={16} />
</button>
```
- `rounded-input` → verify px value. Use `rounded-[10px]`
- Code font: `font-mono text-sm tracking-wide` — fine but upgrade to `tracking-[.12em]`
- Copy button: flat `bg-s-ink/5` → bordered outline style with coral on `copied` state

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 171–183** — code display:
```tsx
<div className="flex items-center gap-2">
  <div className="flex-1 px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-s-bg-base"
    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", letterSpacing: ".12em", color: "var(--s-ink)" }}>
    {code}
  </div>
  <button onClick={copyCode} aria-label={t("copyCode")}
    className={`w-10 h-10 rounded-[10px] border flex items-center justify-center transition-all ${
      copied
        ? "border-[#4CAF6F] bg-[#4CAF6F]/10"
        : "border-s-ink/[0.08] hover:border-s-coral/40"
    }`}>
    {copied
      ? <Check size={15} className="text-[#4CAF6F]" />
      : <Copy size={15} className="text-s-ink/40" />}
  </button>
</div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P8: referral code → 10px radius, green check on copied, icon-only copy button"`

---

## Phase 9 — Share Buttons: Pill Style

### Current state (ProfilePage.tsx lines 187–206)
```tsx
<button className="flex-1 ... py-2 rounded-btn bg-[#25D366] text-white text-xs font-medium ...">
  <Share2 size={12} /> WhatsApp
</button>
<button className="flex-1 ... bg-s-blue text-white text-xs font-medium ...">
  <MessageCircle size={12} /> SMS
</button>
```
- `font-medium` → `font-heading font-bold uppercase tracking-[.04em]`
- `rounded-btn` ✅ — correct for pill action buttons
- `py-2` → `py-3` (taller tap target)
- WhatsApp green and SMS blue colours ✅ — keep (brand colours)

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 187–206** — share buttons:
```tsx
<div className="grid grid-cols-3 gap-2">
  <button onClick={shareWhatsApp}
    className="flex items-center justify-center gap-1.5 py-3 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.04em] text-white active:scale-[0.98] transition-all"
    style={{ background: "#25D366" }}>
    <Share2 size={12} /> WhatsApp
  </button>
  <button onClick={shareSMS}
    className="flex items-center justify-center gap-1.5 py-3 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.04em] text-white active:scale-[0.98] transition-all"
    style={{ background: "#0A84FF" }}>
    <MessageCircle size={12} /> SMS
  </button>
  <button onClick={copyCode}
    className="flex items-center justify-center gap-1.5 py-3 rounded-btn border border-s-ink/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.04em] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-colors">
    <Copy size={12} /> Kopieren
  </button>
</div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P9: share buttons → py-3, font-heading uppercase, grid-cols-3"`

---

## Phase 10 — Reward Tracking Row

### Current state (ProfilePage.tsx lines 208–219)
```tsx
<div className="flex items-center justify-between pt-2 border-t border-s-ink/5">
  <span className="text-xs text-s-ink/50">{t("friendsInvited", { count })}</span>
  <span className="data-text text-sm font-bold text-s-coral">{amount}</span>
</div>
```
- `text-xs text-s-ink/50` → `text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/40`
- Stats: add count label eyebrow

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)
**Lines 208–219** — reward row:
```tsx
<div className="flex items-center justify-between pt-3 border-t border-s-ink/[0.05]">
  <div className="flex items-center gap-2">
    <Trophy size={13} className="text-s-amber" />
    <div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/35">
        Eingeladen
      </p>
      <p className="text-xs font-heading font-semibold text-s-ink">{stats.friends_invited}</p>
    </div>
  </div>
  <div className="text-right">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/35">Verdient</p>
    <p className="font-heading font-bold text-sm text-s-coral">
      {formatCurrency(stats.total_earned / 100, locale)}
    </p>
  </div>
</div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P10: reward row → two stat columns, eyebrow labels, amber trophy icon"`

---

## Phase 11 — Loyalty StampCard Section

### ⚠️ Must read `components/loyalty/StampCard.tsx` before implementing

```bash
cat components/loyalty/StampCard.tsx
```

Expected issues:
- StampCard may use `rounded-card`, `shadow-card`, or blobs
- Stamp circles: `rounded-full` is fine ✅ (they ARE circles)
- Active stamps vs empty slots: colour contrast check

### Files to modify

#### [MODIFY] [StampCard.tsx](file:///c:/Users/sulod/solen/components/loyalty/StampCard.tsx)

Container:
```tsx
// Before:
<div className="rounded-card shadow-card ...">
// After:
<div className="rounded-[12px] border border-s-ink/[0.06] p-4"
  style={{ boxShadow: "none" }}>
```

Salon name + header eyebrow:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-1">
  Treuekarte
</p>
<p className="font-heading font-semibold text-sm text-s-ink">{salon.name}</p>
```

Stamp grid:
```tsx
<div className="flex flex-wrap gap-2 mt-3">
  {[...Array(stampsNeeded)].map((_, i) => (
    <div key={i}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
        i < stampsCollected
          ? "bg-s-coral" // filled stamp
          : "border-2 border-s-ink/10 bg-white" // empty stamp
      }`}>
      {i < stampsCollected && <Check size={14} className="text-white" />}
    </div>
  ))}
</div>
```

Reward label:
```tsx
<p className="text-xs font-heading font-semibold text-s-amber mt-3">
  🎁 {rewardText}
</p>
```

**Git commit:** `git add components/loyalty/StampCard.tsx && git commit -m "PROF-P11: StampCard → Zone 3 flat card, coral filled stamps, reward label amber"`

---

## Phase 12 — Favourites Section: Section Header + SalonCard Grid

### Current state (ProfilePage.tsx — favourites section)
Look for: `<Heart>` icon + section header + grid of SalonCards

Expected issues:
- Section header: `font-body font-medium` → `SectionLabel` eyebrow component
- Empty state: `rounded-card text-center` → `rounded-[12px] border border-dashed`

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)

Section label (apply consistently across all profile sections):
```tsx
const ProfileSectionLabel = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && <Icon size={13} className="text-s-ink/35" />}
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35">{children}</p>
  </div>
);
```

Empty state:
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-8 text-center">
  <Heart size={24} className="mx-auto mb-2 text-s-ink/15" />
  <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">Noch keine Favoriten</p>
  <a href={`/${locale}/coiffeur`}
    className="inline-block mt-3 text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-coral hover:underline">
    Salons entdecken →
  </a>
</div>
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P12: ProfileSectionLabel component, dashed empty state with discover CTA"`

---

## Phase 13 — Sub-Pages: Consistent rounded-card → 12px

### Scope: All 4 sub-pages in `app/[locale]/profile/`

#### packages/page.tsx
**Line 67, 84** — card containers:
```tsx
// Empty state:
<div className="rounded-[12px] border border-s-ink/[0.06] p-8 text-center bg-white dark:bg-s-dm-surface">
  ...
  <p className="text-xs font-heading uppercase tracking-[.10em] text-s-ink/30">Keine Pakete gefunden</p>
</div>

// Package card:
<div key={p.id} className={`rounded-[12px] border p-5 bg-white dark:bg-s-dm-surface ${
  isUsedUp || isExpired ? "border-s-ink/[0.06] opacity-60" : "border-s-coral/20"
}`}>
```

Status badge (line 94–101):
```tsx
// Used up / expired:
<span className="text-[9px] font-heading font-bold uppercase tracking-[.08em] px-2 py-1 rounded-[6px]"
  style={{ background: "rgba(26,18,9,.06)", color: "rgba(26,18,9,.35)" }}>
  {isExpired ? "Abgelaufen" : "Aufgebraucht"}
</span>
// Active:
<span className="text-[9px] font-heading font-bold uppercase tracking-[.08em] px-2 py-1 rounded-[6px]"
  style={{ background: "rgba(76,175,111,.12)", color: "#1f6535" }}>
  Aktiv
</span>
```

Loading state (line 47–49):
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-s-bg-base flex items-center justify-center">
      <div className="grid gap-4 w-full max-w-3xl px-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-[12px] border border-s-ink/[0.06] p-5 bg-white animate-pulse">
            <div className="h-4 w-40 bg-s-bg-sunken rounded mb-3" />
            <div className="h-2 w-full bg-s-bg-sunken rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/profile/packages/page.tsx && git commit -m "PROF-P13: packages page — rounded-[12px], semantic status badges, skeleton loading"`

---

## Phase 14 — Package Progress Bar: Warm Track

### Current state (packages/page.tsx lines 110–115)
```tsx
<div className="h-2 w-full bg-s-bg-surface rounded-full overflow-hidden">
  <div className={`h-full ${isUsedUp ? 'bg-s-ink/20' : 'bg-s-coral'} transition-all`}
    style={{ width: `${(used / total) * 100}%` }} />
</div>
```
- Track `bg-s-bg-surface` → `rgba(26,18,9,.06)` (warm token)
- Fill: `bg-s-coral` ✅ for active, `bg-s-ink/20` ✅ for used up
- Below the bar — add session counter `x / y sessions`

### Files to modify

#### [MODIFY] [packages/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/profile/packages/page.tsx)
**Lines 105–116** — progress block:
```tsx
<div>
  <div className="flex justify-between mb-2">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/35">
      {remaining} von {total} übrig
    </p>
    <p className="text-[9px] font-heading text-s-ink/25">{used} genutzt</p>
  </div>
  <div className="h-2 w-full rounded-full overflow-hidden"
    style={{ background: "rgba(26,18,9,.06)" }}>
    <div className="h-full rounded-full transition-all duration-500"
      style={{
        width: `${(used / total) * 100}%`,
        background: isUsedUp ? "rgba(26,18,9,.15)" : "#E8624A"
      }} />
  </div>
</div>
```

**Git commit:** `git add app/[locale]/profile/packages/page.tsx && git commit -m "PROF-P14: package progress bar — warm track token, session counter labels"`

---

## Phase 15 — Profile Skeleton + Loading State

### Current state (ProfilePage.tsx — loading state)
- Likely: `<div className="flex justify-center py-16"><Spinner size="lg" /></div>`
- Replace with a structured skeleton matching the profile layout

### Files to modify

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/sulod/solen/components/ProfilePage.tsx)

Profile loading skeleton:
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-s-bg-base py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Hero skeleton */}
        <div className="rounded-[16px] border border-s-ink/[0.06] p-5 bg-white animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-s-bg-sunken shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-s-bg-sunken rounded" />
              <div className="h-3 w-48 bg-s-bg-sunken rounded" />
            </div>
          </div>
        </div>
        {/* Booking row skeletons */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white animate-pulse">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-36 bg-s-bg-sunken rounded" />
                <div className="h-2.5 w-24 bg-s-bg-sunken rounded" />
                <div className="h-2.5 w-28 bg-s-bg-sunken rounded" />
              </div>
              <div className="w-14 h-5 bg-s-bg-sunken rounded-[6px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Git commit:** `git add components/ProfilePage.tsx && git commit -m "PROF-P15: profile skeleton — hero + 3 booking rows, no spinner"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Profile hero | ✅ Start here |
| P2 | BookingCard container | ✅ Independent |
| P3 | Status badges | After P2 (same function) |
| P4 | Cancel action chips | After P2 (same function) |
| P5 | Tooltip | After P4 (same function) |
| P6 | GlassModal + CancelModal | ✅ Independent (read GlassModal first) |
| P7 | ReferralSection container | ✅ Independent |
| P8 | Referral code display | After P7 (same component) |
| P9 | Share buttons | After P7 (same component) |
| P10 | Reward tracking row | After P7 (same component) |
| P11 | StampCard (read first) | ✅ Independent |
| P12 | Favourites section label | ✅ Independent |
| P13 | Sub-pages rounded-card fix | ✅ Independent |
| P14 | Packages progress bar | After P13 (same file) |
| P15 | Profile skeleton | Last |

> P1, P6, P7, P11, P12, P13 all parallel.
> P2→P5 sequential (BookingCard function).
> P7→P10 sequential (ReferralSection).
> P15 last.

---

## ZONE 3 FINAL COMPLIANCE CHECK

```bash
npm run build

# Verify no glass in profile:
grep -rn "backdrop-blur\|glass\|rounded-blob" components/ProfilePage.tsx app/[locale]/profile/
# Expected: 0 results (GlassModal overlay is exempt)

# Verify no cold shadows:
grep -rn "rgba(0,0,0\|shadow-glass" components/ProfilePage.tsx components/ui/GlassModal.tsx
# Expected: 0 results

# Verify no rounded-card on profile cards:
grep -rn "rounded-card" components/ProfilePage.tsx app/[locale]/profile/
# Expected: 0 results

# Verify status badges are semantic:
# ✅ confirmed = green
# ✅ cancelled = muted coral (not green)
# ✅ completed = muted ink

# Manual checklist:
# ✅ Hero: initials fallback visible, settings gear present
# ✅ BookingCard: salon name font-heading, service eyebrow 10px
# ✅ Status badges: green ✓ for confirmed, not coral
# ✅ Cancel button: 40px min tap target
# ✅ Referral code: green check on copy
# ✅ Share buttons: py-3, font-heading uppercase
# ✅ StampCard: no shadow, coral filled stamps, check mark inside
# ✅ Skeleton: matches profile layout shape
# ✅ Packages page: 12px radius, semantic status badges, skeleton loading
```
