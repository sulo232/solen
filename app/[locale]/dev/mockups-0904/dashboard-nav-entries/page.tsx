"use client";

// Grounded-in: components-legacy/dashboard/DashboardLayout.tsx, app/[locale]/dashboard/earnings/page.tsx,
// app/[locale]/dashboard/products/page.tsx, app/[locale]/dashboard/help-editor/page.tsx
//
// Exists-check: `npm run exists dashboard-nav-entries` ran this turn. Its only hit is this
// task's own sibling file (NavGroupsCopy.tsx, written earlier this session). No REMOVED.md hit.
// The real sidebar's grouped nav list already exists (components-legacy/dashboard/DashboardLayout.tsx,
// the mobile "Unified nav" block) and already renders three built pages with zero entries:
// app/[locale]/dashboard/earnings, app/[locale]/dashboard/products (owner-facing, both confirmed
// rendering via GET /api/dev/login?to=... this turn) and app/[locale]/dashboard/help-editor
// (admin-only, confirmed via its /api/admin/help route requiring role==="admin"; also confirmed
// rendering through the dev admin login this turn). The one new thing is this comparison page:
// three rows added to their correct existing groups, nothing else in the sidebar changes.
//
// Depicts: real dashboard chrome (rail, top bar, sticky main) -> components-legacy/dashboard/DashboardLayout.tsx (real, unmodified import)
// Depicts: Current / Proposed nav group comparison -> ./NavGroupsCopy.tsx (byte-copy of the
//   unexported grouped-sidebar markup in components-legacy/dashboard/DashboardLayout.tsx)
//
// Mockup-scope: section (the three affected nav groups only, not the full 5-group + admin sidebar,
// per the owner's "one section, not a whole page" rule)
//
// Type budget: two weights total on this page, font-medium (500, the real row + this page's body
// copy) and font-semibold (600, the real group header + this page's h1 and both Current/Proposed
// labels). Current and Proposed render at the same weight (both 13px semibold); the two are told
// apart by colour only (text-s-ink-2 vs text-s-ink), not weight, so the page stays at 2 weights
// against the <=2-weight NEVER-AGAIN floor.
//
// card-ok: this is an operator screen, governed by the 2026-07-15 merchant round in TASTE_LOG.md
// ("ONE carded hero per screen, everything else bare text on the canvas, no card/box/pill
// costume", "binary 16/32 gaps only"). No card wraps any section here; the six comparison blocks
// are separated by spacing alone (16px inside a Current/Proposed pair, 32px between topics).
//
// Copy note: the real sidebar's `group` field (RAIL_NAV in DashboardLayout.tsx) is a hardcoded
// literal, not routed through next-intl, so every locale sees "Betrieb" / "Verkauf & Kunden" /
// "Abrechnung" / "Mehr" verbatim on the live site today (a pre-existing gap in that file, not
// touched here). Per the mockup-English rule this file uses this session's own English
// translation of the two affected group names instead of the German the live site actually shows:
// "Verkauf & Kunden" -> "Sales & Clients", "Abrechnung" -> "Billing". "Admin" (ADMIN_NAV's own
// group heading) is already English.

import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import {
  Scissors, Layers, Users, DollarSign, RotateCcw, TrendingUp, Scale, Wallet, Package,
  ShieldCheck, Store, UsersRound, Percent, FileEdit, MessageSquareWarning, Flag, BookOpen,
} from "lucide-react";
import { NavGroupList, type NavGroup } from "./NavGroupsCopy";

// The real 19-row ADMIN_NAV has 3 rows between Commission and Content that this excerpt does not
// show (Platform Analytics, AI Limit, Badges, DashboardLayout.tsx:45-47); this marker keeps the
// excerpt from presenting Commission and Content as adjacent when the real list does not.
const ADMIN_OMISSION_NOTE = {
  key: "admin-omitted",
  note: "3 rows omitted here: Platform Analytics, AI Limit, Badges",
  isOmission: true as const,
};

// ---- "Sales & Clients" group (owner nav; real group key "Verkauf & Kunden"), real RAIL_NAV order ----
const VERKAUF_CURRENT: NavGroup = {
  label: "Sales & Clients",
  items: [
    { key: "catalog", href: "/dashboard/services", icon: Scissors, label: "Catalog" },
    { key: "bundles", href: "/dashboard/bundles", icon: Layers, label: "Combos" },
    { key: "clients", href: "/dashboard/clients", icon: Users, label: "Clients" },
    { key: "sales", href: "/dashboard/bookings", icon: DollarSign, label: "Sales" },
  ],
};
const VERKAUF_PROPOSED: NavGroup = {
  ...VERKAUF_CURRENT,
  items: [
    ...VERKAUF_CURRENT.items,
    { key: "products", href: "/dashboard/products", icon: Package, label: "Products", isNew: true },
  ],
};

// ---- "Billing" group (owner nav; real group key "Abrechnung"), real RAIL_NAV order ----
const ABRECHNUNG_CURRENT: NavGroup = {
  label: "Billing",
  items: [
    { key: "refunds", href: "/dashboard/refunds", icon: RotateCcw, label: "Refunds" },
    { key: "upcharge", href: "/dashboard/upcharge", icon: TrendingUp, label: "Surcharges" },
    { key: "cases", href: "/dashboard/cases", icon: Scale, label: "Cases" },
  ],
};
const ABRECHNUNG_PROPOSED: NavGroup = {
  ...ABRECHNUNG_CURRENT,
  items: [
    ...ABRECHNUNG_CURRENT.items,
    { key: "earnings", href: "/dashboard/earnings", icon: Wallet, label: "Balance & payouts", isNew: true },
  ],
};

// ---- Admin group excerpt (role === "admin" only), real ADMIN_NAV order, trimmed to the rows
// nearest the insertion point; the other 11 rows of the real 19-row list are unaffected ----
const ADMIN_CURRENT: NavGroup = {
  label: "Admin",
  items: [
    { key: "approvals", href: "/dashboard/approvals", icon: ShieldCheck, label: "Approvals" },
    { key: "allSalons", href: "/dashboard/all-salons", icon: Store, label: "All Salons" },
    { key: "allUsers", href: "/dashboard/all-users", icon: UsersRound, label: "All Users" },
    { key: "revenue", href: "/dashboard/revenue", icon: DollarSign, label: "Revenue" },
    { key: "commission", href: "/dashboard/commission-admin", icon: Percent, label: "Commission" },
    ADMIN_OMISSION_NOTE,
    { key: "content", href: "/dashboard/content-editor", icon: FileEdit, label: "Content" },
    { key: "reviewModeration", href: "/dashboard/review-moderation", icon: MessageSquareWarning, label: "Reviews" },
    { key: "reports", href: "/dashboard/reports", icon: Flag, label: "Reports" },
  ],
};
const ADMIN_PROPOSED: NavGroup = {
  ...ADMIN_CURRENT,
  items: [
    ADMIN_CURRENT.items[0],
    ADMIN_CURRENT.items[1],
    ADMIN_CURRENT.items[2],
    ADMIN_CURRENT.items[3],
    ADMIN_CURRENT.items[4],
    ADMIN_OMISSION_NOTE,
    { key: "helpArticles", href: "/dashboard/help-editor", icon: BookOpen, label: "Help articles", isNew: true },
    ADMIN_CURRENT.items[6],
    ADMIN_CURRENT.items[7],
    ADMIN_CURRENT.items[8],
  ],
};

// Copy economy: the group name itself already renders one line below via NavGroupList's own
// header (the real component's group heading, byte-copied for fidelity), so this label says only
// "Current" / "Proposed", not the group name again.
function SectionLabel({ variant }: { variant: "Current" | "Proposed" }) {
  return (
    <p
      className={
        variant === "Proposed"
          ? "mt-4 mb-1 text-[13px] font-semibold text-s-ink"
          : "mt-8 mb-1 text-[13px] font-semibold text-s-ink-2"
      }
    >
      {variant}
    </p>
  );
}

export default function DashboardNavEntriesMockup() {
  return (
    <DashboardLayout>
      <div className="max-w-[520px]">
        <h1 className="text-[20px] font-semibold text-s-ink">Sidebar: three missing entries</h1>
        <p className="mt-1 text-[13px] font-medium text-s-ink-2">
          Balance &amp; payouts, Products and Help articles already render at their routes but have
          no way in from the sidebar. Current above, Proposed (row added, marked New) below, one
          group at a time.
        </p>

        <SectionLabel variant="Current" />
        <NavGroupList groups={[VERKAUF_CURRENT]} />
        <SectionLabel variant="Proposed" />
        <NavGroupList groups={[VERKAUF_PROPOSED]} />

        <SectionLabel variant="Current" />
        <NavGroupList groups={[ABRECHNUNG_CURRENT]} />
        <SectionLabel variant="Proposed" />
        <NavGroupList groups={[ABRECHNUNG_PROPOSED]} />

        <SectionLabel variant="Current" />
        <NavGroupList groups={[ADMIN_CURRENT]} />
        <SectionLabel variant="Proposed" />
        <NavGroupList groups={[ADMIN_PROPOSED]} />
      </div>
    </DashboardLayout>
  );
}
