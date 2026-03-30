# Dashboard — Deep-Dive V3 Roadmap

> **Scope:** `components/dashboard/DashboardLayout.tsx` (330 lines), `app/[locale]/dashboard/page.tsx` (286 lines), and key sub-components: `SetupBanner.tsx`, `SolenScoreCard.tsx`, `MiniSparkline.tsx`, `GoLiveGate.tsx`, `FrozenSalonBanner.tsx`, `DisputeNotification.tsx`.
> **Zone: 4 (Structured)** — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius, NO decorative shadows. Clean information hierarchy only.
> - 33 sub-routes exist. This roadmap focuses on the shared shell (DashboardLayout) + the primary overview page + key shared components. Sub-route pages covered in follow-up.

---

## Zone 4 Compliance Contract

| Rule | Value |
|---|---|
| Background | `bg-s-bg-base` (warm cream `#FAF6EF`) — sidebar slightly raised |
| Cards | `bg-white` or `bg-s-bg-raised`, border `border-s-ink/[0.06]`, NO shadow |
| Max border-radius | `12px` = `rounded-[12px]` only. Cards: `rounded-[12px]`. Inputs/chips: `rounded-[8px]` |
| Typography H1 | `font-heading font-bold` — `text-[28px]`. No Bebas Neue |
| Typography labels | `font-heading font-bold text-[9px] uppercase tracking-[.18em] text-s-ink/40` |
| Shadows | None on cards. Only `0 1px 0 rgba(26,18,9,.06)` on sidebar separators |
| Motion | `opacity` transitions only, `duration-150`. No bounce, no spring in Zone 4 |
| Active nav | Left coral border `border-l-2 border-s-coral` + `bg-s-coral/[0.06]` |
| Icons | `text-s-ink/40` default, `text-s-coral` when active/highlighted |

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Sidebar shell + nav | 🔴 High | Auth guard + role switching + mobile sidebar all live here |
| P2 — Sidebar width + letter-spacing | 🟢 Low | CSS-only |
| P3 — Mobile bottom nav | 🟡 Medium | Position fixed — test on real device |
| P4 — Page wrapper + content area | 🟢 Low | Layout adjust only |
| P5 — Stat cards | 🟢 Low | Visual-only |
| P6 — Section headings (eyebrow style) | 🟢 Low | Text-only |
| P7 — Alert cards | 🟢 Low | Visual-only |
| P8 — Today's bookings row | 🟢 Low | Visual-only |
| P9 — Quick action tiles | 🟢 Low | Visual-only |
| P10 — Celebration banner | 🟢 Low | AnimatePresence wrapper only |
| P11 — SetupBanner | 🟢 Low | Isolated sub-component |
| P12 — SolenScoreCard | 🟡 Medium | Score gauge needs clean Zone 4 |
| P13 — GoLiveGate | 🟡 Medium | Blocks dashboard if setup incomplete |
| P14 — FrozenSalonBanner + DisputeNotification | 🟢 Low | Alert banners |
| P15 — Dashboard loading skeleton | 🟢 Low | Replace Spinner with skeleton grid |

---

## Phase 1 — Sidebar: Zone 4 Compliance + Active State

### Current state (DashboardLayout.tsx lines 120–250)
- Uses the Aceternity `<Sidebar>` UI component (`components/ui/sidebar`)
- Active item detection: `pathname === href` → check what styling it applies
- `rounded-card` likely in sidebar link items
- Mobile sidebar: `<AnimatePresence>` drawer, likely `bg-white` — correct for Z4

### ⚠️ BE CAREFUL
- The auth guard (`useEffect` lines 103–119) must remain entirely untouched — it redirects unauthenticated users.
- The role-based nav switching (`ADMIN_NAV` / `OWNER_NAV` / `STAFF_NAV`) must stay.
- `<Sidebar>` is from `components/ui/sidebar` — inspect that file separately before touching. Only override from DashboardLayout if needed.
- Mobile sidebar overlay: keep `z-50` and `overflow-y-auto` for scroll safety.

### Files to modify

#### [MODIFY] [DashboardLayout.tsx](file:///c:/Users/sulod/solen/components/dashboard/DashboardLayout.tsx)

**Sidebar container** — warm raised bg:
```tsx
// Outer sidebar panel:
<div className="w-[220px] shrink-0 bg-s-bg-raised border-r border-s-ink/[0.06] h-screen sticky top-0 overflow-y-auto flex flex-col">
  {/* Salon name + logo */}
  <div className="px-5 py-5 border-b border-s-ink/[0.05]">
    {salonAvatar && <Image src={salonAvatar} alt={salonName ?? ""} width={32} height={32}
      className="rounded-[8px] mb-3" />}
    <p className="font-heading font-bold text-sm text-s-ink truncate">{salonName}</p>
    <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/35 mt-0.5">Dashboard</p>
  </div>
```

**Nav item** — Zone 4 active pattern:
```tsx
// Per nav link:
<Link href={`/${locale}${item.href}`}
  className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
    isActive
      ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
      : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
  }`}>
  <item.icon size={15} className={isActive ? "text-s-coral" : "text-s-ink/35"} />
  <span>{label}</span>
  {/* Unread badge for Messages */}
  {item.key === "messages" && unreadCount > 0 && (
    <span className="ml-auto text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-[6px] bg-s-coral text-white">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )}
</Link>
```

**Git commit:** `git add components/dashboard/DashboardLayout.tsx && git commit -m "DB-P1: sidebar → Zone 4 bg-raised, border-l-2 coral active, warm nav items"`

---

## Phase 2 — Sidebar: Nav Group Labels + Dividers

### Current state
- Nav items are listed in a flat list with no grouping
- 15+ items for OWNER_NAV renders as an overwhelming flat list

### ⚠️ BE CAREFUL
- Don't change the nav arrays — only add visual grouping in the render.
- Groups should be: Operations (overview, bookings, calendar, messages), Team & Clients (team, clients), Business (services, marketing, analytics, reviews, posts), More (loyalty, settings, verification).

### Files to modify

#### [MODIFY] [DashboardLayout.tsx](file:///c:/Users/sulod/solen/components/dashboard/DashboardLayout.tsx)

Add nav section labels between groups:
```tsx
const OWNER_NAV_GROUPS = [
  {
    label: "Betrieb",
    items: [
      { key: "overview",  href: "/dashboard",          icon: Home },
      { key: "bookings",  href: "/dashboard/bookings", icon: Calendar },
      { key: "calendar",  href: "/dashboard/calendar", icon: Clock },
      { key: "messages",  href: "/dashboard/messages", icon: MessageCircle },
    ]
  },
  {
    label: "Team & Kunden",
    items: [
      { key: "team",    href: "/dashboard/staff",   icon: Users },
      { key: "clients", href: "/dashboard/clients", icon: UserCheck },
    ]
  },
  {
    label: "Business",
    items: [
      { key: "services",   href: "/dashboard/services",   icon: Scissors },
      { key: "marketing",  href: "/dashboard/marketing",  icon: Megaphone },
      { key: "analytics",  href: "/dashboard/analytics",  icon: BarChart },
      { key: "reviews",    href: "/dashboard/reviews",    icon: Star },
    ]
  },
  {
    label: "Mehr",
    items: [
      { key: "loyalty",       href: "/dashboard/loyalty",       icon: Award },
      { label: "Einstellungen", href: "/dashboard/settings",    icon: Settings },
      { label: "Verifizierung", href: "/dashboard/verification", icon: ShieldCheck },
    ]
  },
];

// Render:
{OWNER_NAV_GROUPS.map(group => (
  <div key={group.label} className="px-4 pt-4 pb-1">
    <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 mb-1">{group.label}</p>
    {group.items.map(item => <NavLink key={item.key ?? item.label} ... />)}
  </div>
))}
```

**Git commit:** `git add components/dashboard/DashboardLayout.tsx && git commit -m "DB-P2: sidebar nav → grouped with eyebrow section labels"`

---

## Phase 3 — Mobile Bottom Nav: Zone 4 Pill Bar

### Current state (DashboardLayout.tsx — mobile nav area)
- `MOBILE_NAV` = 5 items bottom bar
- Likely `bg-white border-t` — correct. Check for `rounded-card`, `shadow-glass` etc.

### ⚠️ BE CAREFUL
- `position: fixed; bottom: 0` — ensure `pb-safe` is applied for iPhone notch (`padding-bottom: env(safe-area-inset-bottom)`).
- Active item in bottom nav: coral icon + coral label only. NO scale. NO translateY.

### Files to modify

#### [MODIFY] [DashboardLayout.tsx](file:///c:/Users/sulod/solen/components/dashboard/DashboardLayout.tsx)
Mobile bottom nav bar:
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-s-ink/[0.06] bg-white"
  style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
  <div className="flex">
    {MOBILE_NAV.map(item => {
      const isActive = pathname.startsWith(`/${locale}${item.href}`);
      return (
        <Link key={item.key} href={`/${locale}${item.href}`}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
            isActive ? "text-s-coral" : "text-s-ink/40"
          }`}>
          <item.icon size={20} />
          <span className="text-[8px] font-heading font-semibold uppercase tracking-[.08em]">
            {t(item.key)}
          </span>
          {/* Unread dot for messages */}
          {item.key === "messages" && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-s-coral" />
          )}
        </Link>
      );
    })}
  </div>
</nav>
```

**Git commit:** `git add components/dashboard/DashboardLayout.tsx && git commit -m "DB-P3: mobile bottom nav → safe-area padding, no scale, coral active, tiny uppercase labels"`

---

## Phase 4 — Content Area: Page Wrapper + Spacing

### Current state
- Content area probably uses `flex-1 overflow-y-auto p-6`
- H1 on overview page: `font-heading font-bold text-2xl` — `text-2xl` = 24px, too small for a page title
- Date subline: `text-sm text-s-ink/40` — fine

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
**Lines 151–154** — Page header:
```tsx
<div className="mb-8">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">
    {today}
  </p>
  <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
    Übersicht
  </h1>
</div>
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P4: overview H1 → 28px, date as eyebrow above title"`

---

## Phase 5 — Stat Cards: Zone 4 Flat Cards

### Current state (dashboard/page.tsx lines 49–61, StatCard component)
```tsx
className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 shadow-card"
```
- `shadow-card` — ANY shadow on a Zone 4 data card is too heavy. Remove.
- `rounded-card` — verify pixel value. Zone 4 max is 12px.
- Icon container: `rounded-btn ${bg}` — `rounded-btn` = 99px on a tiny 32px box = a pill circle, which is fine for an icon box.

### ⚠️ BE CAREFUL
- `useCountUp` animation is a nice touch — keep it. But ensure it respects `prefers-reduced-motion`.
- `MiniSparkline` renders a tiny SVG chart — correct placement top-right of card.
- The `display` value: `isRating ? (count / 10).toFixed(1) : count` — keep this logic.

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
**Lines 49–61** — StatCard:
```tsx
function StatCard({ label, value, Icon, color, bg, isRating, sparklineData, sparklineColor }: StatCardProps) {
  const count = useCountUp(value);
  const display = isRating ? (count / 10).toFixed(1) : count;
  return (
    <motion.div variants={itemVariants}
      className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-8 h-8 rounded-[10px] ${bg} flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
        {sparklineData?.length > 1 && (
          <MiniSparkline data={sparklineData} color={sparklineColor} width={64} height={24} />
        )}
      </div>
      <p className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">{display}</p>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/35 mt-2">{label}</p>
    </motion.div>
  );
}
```

**Add prefers-reduced-motion to `useCountUp`:**
```tsx
function useCountUp(target: number, duration = 1000) {
  const prefersReduced = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(prefersReduced ? target : 0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (prefersReduced) { setValue(target); return; }
    // ... existing animation logic
  }, [target, duration, prefersReduced]);
  return value;
}
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P5: stat cards → flat Zone 4, rounded-[12px], 28px number, prefers-reduced-motion fix"`

---

## Phase 6 — Section Headings: V3 Eyebrow Style

### Current state (page.tsx lines 182, 234, 266)
```tsx
<h2 className="text-xs font-medium text-s-ink/40 uppercase tracking-wide">Handlungsbedarf</h2>
<h2 className="text-xs font-medium text-s-ink/40 uppercase tracking-wide">Heute</h2>
<h2 className="text-xs font-medium text-s-ink/40 uppercase tracking-wide">Schnellaktionen</h2>
```
- `font-medium` → `font-heading font-bold`
- `tracking-wide` → `tracking-[.18em]`
- Add amber colour when showing an alert section

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
Replace all section `h2` elements:
```tsx
// Standard section header:
const SectionLabel = ({ children, amber }: { children: React.ReactNode; amber?: boolean }) => (
  <p className={`text-[9px] font-heading font-bold uppercase tracking-[.18em] mb-3 ${amber ? "text-s-amber" : "text-s-ink/35"}`}>
    {children}
  </p>
);

// Usage:
<SectionLabel amber>Handlungsbedarf</SectionLabel>
<SectionLabel>Heute</SectionLabel>
<SectionLabel>Schnellaktionen</SectionLabel>
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P6: SectionLabel component — eyebrow uppercase, amber for alerts"`

---

## Phase 7 — Alert Cards: Structured Warning Rows

### Current state (page.tsx lines 183–212)
```tsx
<div className="bg-s-coral/5 border border-s-coral/20 rounded-card px-4 py-3 flex items-center gap-3">
```
- `rounded-card` → `rounded-[12px]`
- `bg-s-coral/5` — fine ✅
- `border-s-coral/20` — fine ✅
- Link: `className="text-xs text-s-coral font-medium"` → `font-heading font-bold uppercase tracking-[.04em]`

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
**Lines 183–212** — Alert cards

```tsx
// Coral alert (verification overdue, low slots):
<div className="rounded-[12px] px-4 py-3.5 flex items-center gap-3"
  style={{ background: "rgba(232,98,74,.06)", border: "1px solid rgba(232,98,74,.18)" }}>
  <ShieldAlert size={16} className="text-s-coral shrink-0" />
  <div className="flex-1 min-w-0">
    <p className="text-xs font-heading font-semibold text-s-ink">Verifizierung überfällig</p>
    <p className="text-[10px] text-s-ink/45 mt-0.5">Seit über 90 Tagen nicht verifiziert.</p>
  </div>
  <a href={...} className="text-[10px] font-heading font-bold uppercase tracking-[.04em] text-s-coral shrink-0">
    Verifizieren →
  </a>
</div>

// Amber alert (pending cancellations):
<div className="rounded-[12px] px-4 py-3.5 flex items-center gap-3"
  style={{ background: "rgba(212,135,10,.06)", border: "1px solid rgba(212,135,10,.20)" }}>
  <AlertTriangle size={16} className="text-s-amber shrink-0" />
  ...
</div>
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P7: alert cards → rounded-[12px], inline colour spec, uppercase CTA link"`

---

## Phase 8 — Today's Bookings: Timeline Row Design

### Current state (page.tsx lines 243–260)
```tsx
<div className="bg-white rounded-card border border-s-ink/5 p-4 flex items-center gap-4">
  <p className="data-text font-bold text-sm text-s-coral w-12 shrink-0 text-center">{time}</p>
  <p className="text-sm font-medium text-s-ink truncate">{customer}</p>
  <p className="text-xs text-s-ink/40">{service}</p>
</div>
```
- `rounded-card` → `rounded-[12px]`
- `font-medium` → `font-heading font-semibold`
- Missing: time-left indicator / booking status dot
- "NEUKUNDE" badge: `rounded-pill bg-s-coral/10` — update to `rounded-[6px]` for Zone 4

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
**Lines 243–260** — Booking rows:

```tsx
{bookings.map((b) => (
  <div key={b.id}
    className="rounded-[12px] border border-s-ink/[0.06] px-4 py-3.5 flex items-center gap-4 bg-white dark:bg-s-dm-surface">
    {/* Time column */}
    <div className="shrink-0 text-center w-10">
      <p className="data-text font-bold text-base text-s-coral leading-none">
        {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-[8px] font-heading uppercase tracking-[.08em] text-s-ink/30 mt-0.5">
        {b.duration_minutes} Min
      </p>
    </div>
    {/* Divider */}
    <div className="w-px h-8 bg-s-ink/[0.07] shrink-0" />
    {/* Details */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">{b.customer_name}</p>
      <p className="text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/40 truncate mt-0.5">{b.service_name}</p>
    </div>
    {/* Status + badge */}
    <div className="shrink-0 flex items-center gap-2">
      {b.is_first_visit && (
        <span className="px-2 py-0.5 rounded-[6px] text-[9px] font-heading font-bold uppercase tracking-[.06em]"
          style={{ background: "rgba(232,98,74,.10)", color: "#7A2415" }}>
          Neu
        </span>
      )}
      <div className={`w-2 h-2 rounded-full ${
        b.status === "confirmed" ? "bg-[#4CAF6F]" :
        b.status === "pending" ? "bg-s-amber" : "bg-s-ink/20"
      }`} />
    </div>
  </div>
))}
```

Also upgrade empty state:
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-8 text-center bg-white dark:bg-s-dm-surface">
  <Calendar size={24} className="mx-auto mb-2 text-s-ink/20" />
  <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">Keine Termine heute</p>
</div>
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P8: booking rows → time column, divider, status dot, Zone 4 12px radius"`

---

## Phase 9 — Quick Action Tiles: Compact Grid

### Current state (page.tsx lines 266–279)
```tsx
<a className="bg-white rounded-card border border-s-ink/5 p-3 flex flex-col items-center gap-2 text-center hover:border-s-coral transition-colors">
  <Icon size={18} className="text-s-coral" />
  <p className="text-xs text-s-ink/60">{label}</p>
</a>
```
- `rounded-card` → `rounded-[12px]`
- Icon size 18 is fine ✅
- `text-xs text-s-ink/60` → `text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/50`

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
**Lines 267–279** — Quick action tiles:

```tsx
<div className="grid grid-cols-3 gap-2">
  {[
    { label: "Termin", href: `/${locale}/dashboard/calendar`, Icon: Plus },
    { label: "Service", href: `/${locale}/dashboard/services`, Icon: Scissors },
    { label: "Nachrichten", href: `/${locale}/dashboard/messages`, Icon: MessageCircle },
  ].map(({ label, href, Icon }) => (
    <a key={href} href={href}
      className="rounded-[12px] border border-s-ink/[0.06] p-4 flex flex-col items-center gap-2.5 text-center bg-white dark:bg-s-dm-surface hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-colors">
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
        style={{ background: "rgba(232,98,74,.08)" }}>
        <Icon size={17} className="text-s-coral" />
      </div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/55 leading-tight">{label}</p>
    </a>
  ))}
</div>
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P9: quick action tiles → coral icon box, uppercase labels, Zone 4 12px"`

---

## Phase 10 — Celebration Banner: Zone 4 Inline

### Current state (page.tsx lines 132–147)
```tsx
<motion.div className="mb-6 bg-s-coral text-white rounded-card px-5 py-4 flex items-center gap-3 shadow-warm-sm">
```
- `rounded-card` → `rounded-[12px]`
- `shadow-warm-sm` — remove in Zone 4

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
**Lines 138–145**:
```tsx
<motion.div ... className="mb-6 rounded-[12px] px-5 py-4 flex items-center gap-3"
  style={{ background: "#E8624A" }}>
  <PartyPopper size={20} className="shrink-0 text-white/80" />
  <div>
    <p className="font-heading font-bold text-sm text-white">Willkommen bei solen.ch!</p>
    <p className="text-xs text-white/70 mt-0.5">Dein Salon ist jetzt live. Kunden können dich ab sofort buchen.</p>
  </div>
</motion.div>
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P10: celebration banner → flat coral, 12px radius, no shadow"`

---

## Phase 11 — SetupBanner: Progress Checklist

### Current state (SetupBanner.tsx — 3.7KB)
- Renders setup steps (photos, services, hours) with progress indicators
- Likely uses `rounded-card`, `bg-white`, `shadow-card`

### Files to modify

#### [MODIFY] [SetupBanner.tsx](file:///c:/Users/sulod/solen/components/dashboard/SetupBanner.tsx)
Container:
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] p-5 mb-6 bg-white dark:bg-s-dm-surface">
  {/* Eyebrow */}
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-1">Einrichtung</p>
  <h2 className="font-heading font-bold text-sm text-s-ink mb-4">Dein Salon ist fast bereit</h2>
  {/* Progress bar */}
  <div className="h-1.5 rounded-full bg-s-ink/[0.06] mb-4 overflow-hidden">
    <div className="h-full bg-s-coral rounded-full transition-all duration-500"
      style={{ width: `${completedPercent}%` }} />
  </div>
  {/* Steps list */}
  {steps.map(step => (
    <div key={step.key} className={`flex items-center gap-3 py-2.5 border-b border-s-ink/[0.04] last:border-0 ${step.done ? "opacity-50" : ""}`}>
      <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 ${step.done ? "bg-[#4CAF6F]" : "border border-s-ink/15"}`}>
        {step.done && <Check size={11} className="text-white" />}
      </div>
      <p className="text-xs font-heading font-semibold text-s-ink flex-1">{step.label}</p>
      {!step.done && (
        <a href={step.href} className="text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-coral">
          Einrichten →
        </a>
      )}
    </div>
  ))}
</div>
```

**Git commit:** `git add components/dashboard/SetupBanner.tsx && git commit -m "DB-P11: SetupBanner → eyebrow, coral progress bar, Zone 4 step rows"`

---

## Phase 12 — SolenScoreCard: Clean Score Display

### Current state (SolenScoreCard.tsx — 7.5KB)
- Score gauge (0–100), likely uses SVG arc or similar
- Cards and containers likely use `rounded-card`, `shadow-card`

### Files to modify

#### [MODIFY] [SolenScoreCard.tsx](file:///c:/Users/sulod/solen/components/dashboard/SolenScoreCard.tsx)

Container:
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] p-5 bg-white dark:bg-s-dm-surface">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-3">
    Solen Score
  </p>
```

Score number display:
```tsx
// Score presented big and clean — no glass, no glow
<div className="flex items-baseline gap-1 mb-1">
  <span className="font-heading font-bold text-[48px] leading-none text-s-ink">{score}</span>
  <span className="text-sm text-s-ink/35">/100</span>
</div>
<p className="text-[10px] font-heading uppercase tracking-[.12em] text-s-amber">{tier}</p>
```

Score bar:
```tsx
<div className="h-2 rounded-full bg-s-ink/[0.06] mt-4 overflow-hidden">
  <div className="h-full rounded-full transition-all duration-700"
    style={{ width: `${score}%`, background: score >= 75 ? "#4CAF6F" : score >= 50 ? "#D4870A" : "#E8624A" }} />
</div>
```

**Git commit:** `git add components/dashboard/SolenScoreCard.tsx && git commit -m "DB-P12: SolenScoreCard → flat Zone 4, big score number, colour-coded bar"`

---

## Phase 13 — GoLiveGate: Onboarding Lock Screen

### Current state (GoLiveGate.tsx — 5.6KB)
- Renders a full-page blocker when salon setup is incomplete
- Likely `bg-white rounded-card`

### Files to modify

#### [MODIFY] [GoLiveGate.tsx](file:///c:/Users/sulod/solen/components/dashboard/GoLiveGate.tsx)
```tsx
<div className="min-h-screen bg-s-bg-base flex items-center justify-center px-4">
  <div className="w-full max-w-md rounded-[12px] border border-s-ink/[0.06] p-8 bg-white text-center">
    <div className="w-12 h-12 rounded-[10px] bg-s-coral/10 flex items-center justify-center mx-auto mb-5">
      <Rocket size={22} className="text-s-coral" />
    </div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-2">Einrichtung</p>
    <h1 className="font-heading font-bold text-xl text-s-ink mb-3">Noch nicht bereit</h1>
    <p className="font-body text-sm text-s-ink/50 mb-6 leading-relaxed">
      Vervollständige die Einrichtung, um deinen Salon live zu schalten.
    </p>
    {/* Steps progress: same pattern as SetupBanner */}
    ...
    <a href={`/${locale}/dashboard/setup`}
      className="block w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] mt-6"
      style={{ background: "#E8624A" }}>
      Einrichtung starten
    </a>
  </div>
</div>
```

**Git commit:** `git add components/dashboard/GoLiveGate.tsx && git commit -m "DB-P13: GoLiveGate → Zone 4 centered card, coral CTA, progress steps"`

---

## Phase 14 — FrozenSalonBanner + DisputeNotification

### Current state
- `FrozenSalonBanner.tsx` (2KB) — critical alert banner when salon is frozen
- `DisputeNotification.tsx` (3.7KB) — payment dispute alert

### Files to modify

#### [MODIFY] [FrozenSalonBanner.tsx](file:///c:/Users/sulod/solen/components/dashboard/FrozenSalonBanner.tsx)
```tsx
// Frozen = most critical state — use dark ink bg, not coral/amber
<div className="rounded-[12px] px-5 py-4 mb-4 flex items-center gap-4"
  style={{ background: "rgba(26,18,9,.94)", border: "1px solid rgba(26,18,9,.20)" }}>
  <ShieldAlert size={18} className="text-white/70 shrink-0" />
  <div className="flex-1">
    <p className="text-xs font-heading font-bold text-white">Salon gesperrt</p>
    <p className="text-[10px] text-white/55 mt-0.5">Dein Konto wurde temporär deaktiviert. Kontaktiere den Support.</p>
  </div>
  <a href="mailto:support@solen.ch"
    className="text-[10px] font-heading font-bold uppercase tracking-[.06em] px-3 py-2 rounded-[8px] bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0">
    Kontakt
  </a>
</div>
```

#### [MODIFY] [DisputeNotification.tsx](file:///c:/Users/sulod/solen/components/dashboard/DisputeNotification.tsx)
```tsx
<div className="rounded-[12px] px-4 py-3.5 flex items-center gap-3 mb-4"
  style={{ background: "rgba(212,135,10,.08)", border: "1px solid rgba(212,135,10,.22)" }}>
  <AlertTriangle size={16} className="text-s-amber shrink-0" />
  <div className="flex-1 min-w-0">
    <p className="text-xs font-heading font-semibold text-s-ink">Zahlungsstreit offen</p>
    <p className="text-[10px] text-s-ink/45 mt-0.5">{dispute.amount} CHF · Antwort bis {dispute.due_date}</p>
  </div>
  <a href={`/${locale}/dashboard/disputes`}
    className="text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-amber shrink-0">
    Antworten →
  </a>
</div>
```

**Git commit:** `git add components/dashboard/FrozenSalonBanner.tsx components/dashboard/DisputeNotification.tsx && git commit -m "DB-P14: frozen + dispute banners → Zone 4 inline colour cards"`

---

## Phase 15 — Dashboard Loading: Skeleton Grid

### Current state (page.tsx line 157)
```tsx
{loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : ...}
```
- Full-page spinner — no layout preview

### Files to modify

#### [MODIFY] [app/[locale]/dashboard/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/dashboard/page.tsx)
**Line 156–158** — Replace spinner with skeleton:
```tsx
{loading ? (
  <div className="space-y-6">
    {/* Stat card skeletons */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white animate-pulse">
          <div className="w-8 h-8 rounded-[10px] bg-s-bg-sunken mb-4" />
          <div className="h-7 w-16 bg-s-bg-sunken rounded mb-2" />
          <div className="h-2.5 w-24 bg-s-bg-sunken rounded" />
        </div>
      ))}
    </div>
    {/* Booking row skeletons */}
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-[12px] border border-s-ink/[0.06] px-4 py-3.5 flex items-center gap-4 bg-white animate-pulse">
          <div className="w-10 h-10 bg-s-bg-sunken rounded-[8px] shrink-0" />
          <div className="w-px h-8 bg-s-ink/[0.05] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-s-bg-sunken rounded" />
            <div className="h-2.5 w-20 bg-s-bg-sunken rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
) : (
  ...
)}
```

**Git commit:** `git add app/[locale]/dashboard/page.tsx && git commit -m "DB-P15: skeleton loading grid — 4 stat cards + 3 booking rows, no spinner"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Sidebar active state + bg | ✅ Start here |
| P2 | Sidebar nav groups | After P1 (same file) |
| P3 | Mobile bottom nav | ✅ Independent |
| P4 | Page header H1 | ✅ Independent |
| P5 | Stat cards | ✅ Independent |
| P6 | Section labels | ✅ Independent |
| P7 | Alert cards | ✅ Independent |
| P8 | Booking rows | ✅ Independent |
| P9 | Quick action tiles | ✅ Independent |
| P10 | Celebration banner | ✅ Independent |
| P11 | SetupBanner | ✅ Independent |
| P12 | SolenScoreCard | ✅ Independent |
| P13 | GoLiveGate | ✅ Independent |
| P14 | FrozenSalonBanner + DisputeNotification | ✅ Independent |
| P15 | Skeleton loading | Last — replaces spinner |

> P3–P15 all parallel. P1→P2 sequential (same file). P15 last.

---

## ZONE 4 FINAL COMPLIANCE CHECK

```bash
npm run build

# Verify zero glass in dashboard:
grep -rn "backdrop-blur\|glass\|rounded-blob\|BlobBackground" components/dashboard/ app/[locale]/dashboard/page.tsx
# Expected: 0 results

# Verify no Bebas Neue:
grep -rn "font-display" components/dashboard/ app/[locale]/dashboard/
# Expected: 0 results

# Verify max 12px radius:
grep -rn "rounded-card\|rounded-xl\|rounded-2xl\|rounded-3xl" components/dashboard/ app/[locale]/dashboard/page.tsx
# Expected: 0 results

# All shadows:
grep -rn "shadow-card\|shadow-glass\|shadow-warm-xl\|shadow-warm-lg" components/dashboard/ app/[locale]/dashboard/page.tsx
# Expected: 0 results (Zone 4 = zero decorative shadows)

# Manual checklist:
# ✅ Sidebar: active nav item has left coral border
# ✅ Mobile bottom nav: coral active, no scale, safe-area padding
# ✅ Stat cards animate count-up, respect prefers-reduced-motion
# ✅ Booking rows show time + status dot
# ✅ Skeleton loads before data arrives
# ✅ Alert cards show for low_slots_warning / verification_overdue
# ✅ No blob shapes anywhere in dashboard
```
