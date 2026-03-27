# R-CD1: Category-Aware Dashboard Shell

> **Priority**: P0 — Foundation for all category-specific dashboard features.
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Category detection util | 🟢 SAFE | Nothing — new util file | — |
| Phase 2: DashboardLayout nav injection | 🔴 HIGH | Sidebar navigation for ALL dashboard users | Read current DashboardLayout.tsx in full before editing. Keep ALL existing nav items. Only ADD category-specific items conditionally. Test all 3 roles (owner, staff, admin). |
| Phase 3: Category dashboard routing | 🟡 MEDIUM | 404 on new pages if middleware blocks | Add new dashboard paths to admin/owner allow-list in middleware.ts |
| Phase 4: i18n keys | 🟢 SAFE | Nothing — additive to locale files | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Category Detection Utility
- Phase 2: DashboardLayout Category Nav Injection
- Phase 3: Category Dashboard Page Stubs
- Phase 4: i18n Translation Keys
- Phase 5: Post-Execution Smoke Test

---

## Phase 1: Category Detection Utility

#### Files
- `[NEW]` `lib/dashboard/category-nav.ts`

#### Instructions
1. Create a utility that maps a salon's `categories: SalonCategory[]` to additional dashboard nav groups.
2. Export `getCategoryNavGroups(categories: SalonCategory[])` that returns an array of nav groups.
3. Each category contributes its own nav group (e.g., barbershop → "Barber Tools", nails → "Nail Tools").
4. Multi-category salons get MULTIPLE groups injected.
5. Each nav item: `{ key: string; href: string; icon: LucideIcon; labelKey: string }`.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
import { Scissors, Armchair, Palette, Sparkles, Leaf, Zap } from "lucide-react";
import type { SalonCategory } from "@/lib/types";

interface CategoryNavItem {
  key: string;
  href: string;
  icon: typeof Scissors;
  labelKey: string; // i18n key
}

interface CategoryNavGroup {
  labelKey: string;
  items: CategoryNavItem[];
  category: SalonCategory;
}

const CATEGORY_NAV_REGISTRY: Record<SalonCategory, CategoryNavGroup> = {
  barbershop: {
    labelKey: "dashboard.nav.barber_tools",
    category: "barbershop",
    items: [
      { key: "barber-ops", href: "/dashboard/barber-ops", icon: Armchair, labelKey: "dashboard.nav.barber_ops" },
      { key: "barber-clients", href: "/dashboard/barber-clients", icon: Scissors, labelKey: "dashboard.nav.barber_clients" },
    ],
  },
  nails: {
    labelKey: "dashboard.nav.nail_tools",
    category: "nails",
    items: [
      { key: "nail-admin", href: "/dashboard/nail-admin", icon: Sparkles, labelKey: "dashboard.nav.nail_admin" },
      { key: "nail-clients", href: "/dashboard/nail-clients", icon: Sparkles, labelKey: "dashboard.nav.nail_clients" },
    ],
  },
  coiffeur: {
    labelKey: "dashboard.nav.coiffeur_tools",
    category: "coiffeur",
    items: [
      { key: "coiffeur-crm", href: "/dashboard/coiffeur-crm", icon: Palette, labelKey: "dashboard.nav.coiffeur_crm" },
    ],
  },
  spa: {
    labelKey: "dashboard.nav.spa_tools",
    category: "spa",
    items: [
      { key: "spa-admin", href: "/dashboard/spa-admin", icon: Leaf, labelKey: "dashboard.nav.spa_admin" },
    ],
  },
  makeup: {
    labelKey: "dashboard.nav.makeup_tools",
    category: "makeup",
    items: [
      { key: "makeup-admin", href: "/dashboard/makeup-admin", icon: Palette, labelKey: "dashboard.nav.makeup_admin" },
    ],
  },
  waxing: {
    labelKey: "dashboard.nav.waxing_tools",
    category: "waxing",
    items: [
      { key: "waxing-admin", href: "/dashboard/waxing-admin", icon: Zap, labelKey: "dashboard.nav.waxing_admin" },
    ],
  },
};

export function getCategoryNavGroups(categories: SalonCategory[]): CategoryNavGroup[] {
  return categories
    .map(cat => CATEGORY_NAV_REGISTRY[cat])
    .filter(Boolean);
}
```

❌ **DON'T**
```tsx
// WRONG — hardcoding category checks in DashboardLayout instead of a utility
if (salon.categories.includes("barbershop")) {
  navItems.push({ label: "Barber Ops", href: "/dashboard/barber-ops" });
}
// This approach doesn't scale and clutters DashboardLayout.
```

> ⚠️ **BE CAREFUL**:
> - This is a pure utility — no side effects, no API calls.
> - The `items` array for each category will grow as more features are added. Start with existing routes only.
> - Do NOT create routes that don't exist yet — only reference existing dashboard routes (`barber-ops`, `barber-clients`, `nail-admin`, `nail-clients`). New routes are added in later roadmaps.

#### Verification
```bash
git add lib/dashboard/category-nav.ts && git commit -m "R-CD1-P1: category-aware nav group registry utility"
npx tsc --noEmit
```

---

## Phase 2: DashboardLayout Category Nav Injection

#### Files
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx`

#### Instructions
1. Import `getCategoryNavGroups` from `lib/dashboard/category-nav.ts`.
2. The layout already fetches the salon data (has `salonId`, `categories`). Use the existing salon data.
3. Call `getCategoryNavGroups(salon.categories)` and inject the resulting nav groups into the sidebar AFTER the existing groups.
4. Each category nav group gets its own section label (eyebrow text, Zone 4 style).
5. **DO NOT** remove or modify any existing nav items.
6. **DO NOT** change the auth guard, role switching, or mobile sidebar logic.
7. Only show category groups for OWNER and STAFF roles (not admin).

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
// In the sidebar nav rendering section, AFTER existing nav groups:
{role !== "admin" && categoryNavGroups.map(group => (
  <div key={group.category} className="px-4 pt-4 pb-1">
    <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 dark:text-s-dm-text/25 mb-1">
      {t(group.labelKey)}
    </p>
    {group.items.map(item => (
      <Link key={item.key} href={`/${locale}${item.href}`}
        className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
          isItemActive(item.href)
            ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
            : "border-transparent text-s-ink/55 dark:text-s-dm-text/55 hover:text-s-ink dark:hover:text-s-dm-text hover:bg-s-ink/[0.03] dark:hover:bg-s-dm-text/[0.03]"
        }`}>
        <item.icon size={15} className={isItemActive(item.href) ? "text-s-coral" : "text-s-ink/35 dark:text-s-dm-text/35"} />
        <span>{t(item.labelKey)}</span>
      </Link>
    ))}
  </div>
))}
```

❌ **DON'T**
```tsx
// WRONG — replacing the existing nav with a new one
const navItems = [...getCategoryNavGroups(salon.categories)]; // Lost all existing items!
// WRONG — using glass or animation in Zone 4
<div className="backdrop-blur-lg bg-white/80 animate-slideIn">
```

> ⚠️ **BE CAREFUL**:
> - DashboardLayout.tsx is ~330 lines with auth guards, role detection, mobile sidebar, and unread count logic. Read the ENTIRE file before editing.
> - The auth guard (`useEffect` lines 103–119) must remain ENTIRELY untouched.
> - The role-based nav switching (`ADMIN_NAV` / `OWNER_NAV` / `STAFF_NAV`) must stay.
> - Test with a salon that has multiple categories (e.g., `["coiffeur", "barbershop"]`) — both groups should appear.
> - Test with admin role — category groups should NOT appear for admins.

#### Verification
```bash
git add components/dashboard/DashboardLayout.tsx && git commit -m "R-CD1-P2: inject category-specific nav groups into sidebar"
npm run build
npx tsc --noEmit
```

---

## Phase 3: Category Dashboard Page Stubs

#### Files
- `[NEW]` `app/[locale]/dashboard/coiffeur-crm/page.tsx`
- `[NEW]` `app/[locale]/dashboard/spa-admin/page.tsx`
- `[NEW]` `app/[locale]/dashboard/makeup-admin/page.tsx`
- `[NEW]` `app/[locale]/dashboard/waxing-admin/page.tsx`

#### Instructions
1. Create minimal stub pages for each NEW category dashboard route.
2. Each page imports `DashboardLayout` and renders a "Coming Soon" state using `<EmptyState>`.
3. Use `useTranslations()` for all text — zero hardcoded strings.
4. These are Zone 4 pages: `rounded-[12px]`, `bg-white dark:bg-s-dm-surface`, zero glass, zero animation.
5. Do NOT create pages for `barber-ops`, `barber-clients`, `nail-admin`, `nail-clients` — they already exist.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
// app/[locale]/dashboard/coiffeur-crm/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { Scissors } from "lucide-react";

export default function CoiffeurCrmPage() {
  const t = useTranslations("dashboardCoiffeur");
  return (
    <div className="p-6">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
        {t("eyebrow")}
      </p>
      <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none mb-8">
        {t("title")}
      </h1>
      <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] border-dashed p-8 text-center bg-white dark:bg-s-dm-surface">
        <Scissors size={24} className="mx-auto mb-2 text-s-ink/20 dark:text-s-dm-text/20" />
        <p className="text-xs font-heading text-s-ink/30 dark:text-s-dm-text/30 uppercase tracking-[.10em]">
          {t("coming_soon")}
        </p>
      </div>
    </div>
  );
}
```

❌ **DON'T**
```tsx
// WRONG — hardcoded German, glass, no dark mode
<div className="backdrop-blur-xl rounded-2xl">
  <h1>Coiffeur CRM</h1>
  <p>Kommt bald</p>
</div>
```

> ⚠️ **BE CAREFUL**:
> - Verify middleware allows these routes for salon owners. Check `middleware.ts` for path patterns.
> - Each page must work inside the existing `DashboardLayout` — do NOT create a separate layout.
> - These are STUBS — they will be fleshed out in subsequent roadmaps (R-CD2 through R-CD6).

#### Verification
```bash
git add app/[locale]/dashboard/coiffeur-crm/ app/[locale]/dashboard/spa-admin/ app/[locale]/dashboard/makeup-admin/ app/[locale]/dashboard/waxing-admin/ && git commit -m "R-CD1-P3: stub pages for coiffeur, spa, makeup, waxing dashboard routes"
npm run build
```

---

## Phase 4: i18n Translation Keys

#### Files
- `[MODIFY]` `messages/de.json`
- `[MODIFY]` `messages/en.json`
- `[MODIFY]` `messages/fr.json`
- `[MODIFY]` `messages/it.json`

#### Instructions
1. Add dashboard nav label keys for all 6 categories.
2. Add stub page keys for the 4 new category pages.
3. Keys must exist in ALL 4 locale files.

#### Keys to add
```json
{
  "dashboard": {
    "nav": {
      "barber_tools": "Barber-Tools",
      "barber_ops": "Barber Betrieb",
      "barber_clients": "Barber Kunden",
      "nail_tools": "Nagel-Tools",
      "nail_admin": "Nagel Verwaltung",
      "nail_clients": "Nagel Kunden",
      "coiffeur_tools": "Coiffeur-Tools",
      "coiffeur_crm": "Coiffeur CRM",
      "spa_tools": "Spa-Tools",
      "spa_admin": "Spa Verwaltung",
      "makeup_tools": "Makeup-Tools",
      "makeup_admin": "Makeup Studio",
      "waxing_tools": "Waxing-Tools",
      "waxing_admin": "Waxing Studio"
    }
  },
  "dashboardCoiffeur": {
    "eyebrow": "Coiffeur",
    "title": "Coiffeur CRM",
    "coming_soon": "Kommt bald"
  },
  "dashboardSpa": {
    "eyebrow": "Spa & Wellness",
    "title": "Spa Verwaltung",
    "coming_soon": "Kommt bald"
  },
  "dashboardMakeup": {
    "eyebrow": "Makeup",
    "title": "Makeup Studio",
    "coming_soon": "Kommt bald"
  },
  "dashboardWaxing": {
    "eyebrow": "Waxing",
    "title": "Waxing Studio",
    "coming_soon": "Kommt bald"
  }
}
```

> ⚠️ **BE CAREFUL**:
> - Do NOT overwrite existing locale file content. APPEND these keys.
> - Verify all 4 files have identical key structures (different translations).
> - Use `grep -rn "dashboardCoiffeur" messages/` to verify after adding.

#### Verification
```bash
git add messages/ && git commit -m "R-CD1-P4: i18n keys for category dashboard nav and stub pages"
npm run build
```

---

## Phase 5: Smoke Test

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify utility exists:
ls lib/dashboard/category-nav.ts

# Verify new pages exist:
ls app/[locale]/dashboard/coiffeur-crm/page.tsx
ls app/[locale]/dashboard/spa-admin/page.tsx
ls app/[locale]/dashboard/makeup-admin/page.tsx
ls app/[locale]/dashboard/waxing-admin/page.tsx

# Verify DashboardLayout imports the utility:
grep -rn "getCategoryNavGroups" components/dashboard/DashboardLayout.tsx

# Verify i18n keys in all locales:
grep -rn "dashboardCoiffeur" messages/de.json messages/en.json messages/fr.json messages/it.json

# Verify no Zone 4 violations:
grep -rn "backdrop-blur\|glass\|Bebas\|font-display\|rounded-xl\|rounded-2xl\|rounded-3xl" app/[locale]/dashboard/coiffeur-crm/ app/[locale]/dashboard/spa-admin/ app/[locale]/dashboard/makeup-admin/ app/[locale]/dashboard/waxing-admin/
# Expected: 0 results
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Category nav utility | Nothing |
| Phase 2 | 🤖 | DashboardLayout injection | Phase 1 |
| Phase 3 | 🤖 | Category page stubs | Nothing |
| Phase 4 | 🤖 | i18n keys | Phase 2, Phase 3 |
| Phase 5 | 🤖 | Smoke test | All phases |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `lib/dashboard/` directory entry
- `_docs/category-system-map.md` §3.2 — add `lib/dashboard/category-nav.ts` as shared infrastructure
