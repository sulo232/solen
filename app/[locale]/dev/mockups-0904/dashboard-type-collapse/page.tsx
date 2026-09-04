// Exists-check: `npm run exists dashboard-type-collapse` this turn returned 0 matches (net-new
// route). `npm run exists dashboard` (broader sweep, same turn) confirms /dashboard already renders
// at app/[locale]/dashboard/page.tsx and its setup banner at components-legacy/dashboard/SetupBanner.tsx;
// no REMOVED.md hit for either. Measured LIVE through /api/dev/login?to=/en/dashboard (Playwright,
// text nodes across the full first-load content set: SetupBanner + the date/title/CTA row + the 2x2
// stat-tile grid, NOT bounded to a literal y<844 fold, since the 7-step SetupBanner state pushes
// part of that grid past 844px): 7 distinct font-sizes (12/13/14/15/17/22/26) and 3 weights
// (400/500/600) belong to that content. DashboardLayout's own chrome (the header/nav "Skip to
// content" + salon-name text, both 16px) is separate, not touched here and not re-declared below.
// The one new thing: a "Proposed" rendering of that SAME real content collapsed to <=4 sizes/<=2
// weights via a CSS scope, nothing else touched.
//
// CORRECTION (punch-list round 2): an earlier draft of this comment and the "Current" label below
// claimed 8 sizes {12,13,14,15,16,17,22,26} "at the literal 390x844 first viewport". Independently
// re-measured: only 6 of those {12,13,14,15,16,26} render above the literal y=844 cutoff in the real
// page (the SetupBanner's 7-step state pushes the stat-tile grid's 22px/17px text below the fold).
// The 7-size/3-weight figure above is the correct claim: it is the full first-load content set this
// file actually renders and measures, not a viewport-bounded figure, and it does not include the
// 16px chrome pair (which brings the real page to 8 sizes total, chrome included).
//
// Depicts: dashboard chrome → components-legacy/dashboard/DashboardLayout.tsx (real, unmodified import)
// Depicts: setup progress banner → components-legacy/dashboard/SetupBanner.tsx (real, unmodified
//   import, rendered twice: once plain for "Current", once inside the .dtc-proposed CSS-scope
//   wrapper for "Proposed" -- its own classNames are never edited, only overridden by the scoped
//   stylesheet below)
// Depicts: dashboard home header + stat tiles → app/[locale]/dashboard/page.tsx (the date line,
//   the h1 "Overview" + "New appointment" button row, the StatTile() helper and its 2x2 mobile
//   grid). None of that is exported from page.tsx (it is inline in DashboardPage's own function
//   body, the same situation app/[locale]/dev/design-fixes/page.tsx documents for its review
//   card), so DashboardHomeStats below is a byte-copy of that JSX/classNames verbatim, fed by the
//   same two real fetches the real page makes (/api/profile, then
//   /api/analytics/salon/:id?period=week) so the numbers are real seeded data, not invented.
//   Rendered twice, byte-identical props and markup, once plain and once inside the scope.
//
// Mockup-scope: whole-page
//
// type-budget-ok: this file's entire point is a Current-vs-Proposed type-budget comparison (the
// brief asked to "print both measured sets"). The Current column intentionally keeps the real
// page's 7 content sizes (12/13/14/15/17/22/26) and 3 weights (400/500/600) untouched and
// byte-copied, next to the Proposed column, which collapses to 4 sizes (13/15/18/24) and 2 weights
// (400/600) via the .dtc-proposed CSS scope below.
//
// CORRECTION (punch-list round 2): an earlier draft cited 13/15/18/24 as "the top four rungs of the
// operator scale 24/18/15/13/11 already in memory". That scale traces to
// memory/feedback_balance_anchor_derive_and_measure.md, which is scoped to a differentiation system
// for a dashboard skin that never reached main per memory/project_dashboard_aurora_design.md ("on
// MAIN the real dashboard skin law is LOCKFILE.md section 12"; the unmerged branch it lives on is a
// REMOVED.md entry and is not re-proposed here). Checked both of this brief's named operator sources
// end to end: LOCKFILE.md §12 (VIBRANT operator skin) names palette, radii, and a drift-checker
// scope, no font-size scale; TASTE_LOG.md's 2026-07-15 merchant round locks pill height 36 + font
// 13.5 and binary 16/32 gaps, no 5-rung type scale either. Neither source locks a type scale for this
// surface, so 13/15/18/24 is CHOSEN BY THE BUILDER, not derived from a locked source: 13 and 15 are
// the two body/meta sizes already present in the Current content (kept as-is, matching LOCKFILE's
// general text-size table row "name 14 / meta 12 / body 14" family), 18 is the adjacent step down
// from the Current 22px stat value (TASTE_AUTHORITY's "pick the adjacent legal step" rule for an
// undecided value), and 24 is the adjacent step down from the Current 26px title. The collapsed
// column is the actual per-screen budget the gate polices; the Current column is the measured
// evidence, not a second design.

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import SetupBanner from "@/components-legacy/dashboard/SetupBanner";
import { cn } from "@/lib/utils";
import { resolveSwissLocale } from "@/lib/format";

interface DashboardStats {
  total_bookings: number;
  total_revenue: number;
  new_customers: number;
  avg_rating: number;
  trends_vs_prior?: { bookings: number; revenue: number; new_customers: number; rating: number };
}

// Byte-copy of app/[locale]/dashboard/page.tsx's fmtChf helper (module-scope const there, not exported).
const fmtChf = (n: number, locale: string = "de") => n.toLocaleString(resolveSwissLocale(locale));

// Byte-copy of app/[locale]/dashboard/page.tsx's StatTile() (lines ~60-75), same classNames.
function StatTile({ label, children, delta }: { label: string; children: React.ReactNode; delta?: number }) {
  const up = (delta ?? 0) > 0, flat = delta === 0;
  return (
    <div className="rounded-card-lg border border-s-border bg-white p-3.5">
      <p className="text-[12px] font-semibold text-s-ink-2 mb-2">{label}</p>
      <div className="text-[22px] font-semibold tracking-[-0.02em] leading-none text-s-ink flex items-baseline">{children}</div>
      {delta !== undefined && (
        <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold mt-2", up ? "text-s-success" : flat ? "text-s-ink-2" : "text-s-error")}>
          {up && <ArrowUpRight size={12} strokeWidth={2.4} />}
          {!up && !flat && <ArrowDownRight size={12} strokeWidth={2.4} />}
          {Math.abs(delta)}%
        </span>
      )}
    </div>
  );
}

// Byte-copy of app/[locale]/dashboard/page.tsx's date/title/CTA row (lines ~160-172) plus the mobile
// StatTile grid (lines ~182-192). Fed by props from the parent's single real fetch, so both the
// Current and Proposed renders below show the identical real numbers.
function DashboardHomeStats({ today, stats, locale, t }: {
  today: string;
  stats: DashboardStats | null;
  locale: string;
  t: ReturnType<typeof useTranslations<"dashboard.homePage">>;
}) {
  const prior = stats?.trends_vs_prior;
  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[13px] font-semibold text-s-ink-2 mb-2">{today}</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink leading-none">{t("title")}</h1>
        </div>
        <Link
          href={`/${locale}/dashboard/calendar`} // drift-ok: real target, byte-copy of the live CTA's href (page.tsx:167)
          className="inline-flex items-center gap-2 shrink-0 whitespace-nowrap rounded-full bg-s-ink px-[18px] py-2.5 text-[15px] font-medium tracking-[-0.005em] text-white transition-[colors,transform] hover:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
        >
          <Plus size={17} strokeWidth={1.9} />{t("createAppointment")}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile label={t("revenue")} delta={prior?.revenue}>
          <span className="text-[13px] font-semibold text-s-ink-2 mr-1">CHF</span>{fmtChf(Math.round(stats?.total_revenue ?? 0), locale)}
        </StatTile>
        <StatTile label={t("bookings")} delta={prior?.bookings}>{stats?.total_bookings ?? 0}</StatTile>
        <StatTile label={t("newCustomers")} delta={prior?.new_customers}>{stats?.new_customers ?? 0}</StatTile>
        <StatTile label={t("rating")} delta={(stats?.avg_rating ?? 0) > 0 ? prior?.rating : undefined}>
          {(stats?.avg_rating ?? 0) > 0 ? (stats?.avg_rating ?? 0).toFixed(1) : "—"} {/* em-dash-ok: byte-copy of the shipped no-rating placeholder glyph, app/[locale]/dashboard/page.tsx:189 */}
          {/* type-scale-ok: byte-copy of the shipped star icon size, app/[locale]/dashboard/page.tsx:190 */}
          <span className="text-s-star text-[17px] ml-0.5 leading-none">★</span>
        </StatTile>
      </div>
    </div>
  );
}

// Label above each block, per the brief: 13px semibold, normal case, no tracked uppercase, no dots.
function SectionLabel({ children, sub }: { children: React.ReactNode; sub: string }) {
  return (
    <div className="mb-3">
      <p className="text-[13px] font-semibold text-s-ink">{children}</p>
      <p className="text-[13px] text-s-ink-2 mt-0.5">{sub}</p>
    </div>
  );
}

export default function DashboardTypeCollapsePage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.homePage");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();

  useEffect(() => {
    // Same data path the real page uses: /api/profile for the salon id, then the salon's
    // weekly analytics for the stat-tile numbers. No bookings-list fetch here because the
    // bookings list itself renders below the measured first viewport (out of this VARY's scope).
    fetch("/api/profile")
      .then((r) => r.json())
      .then((profile) => {
        setSalonName(profile?.salon_name);
        setSalonCategories(profile?.salon_categories);
        const sid = profile?.salon_id;
        if (!sid) return null;
        return fetch(`/api/analytics/salon/${sid}?period=week`).then((r) => r.json());
      })
      .then((analyticsData) => { if (analyticsData) setStats(analyticsData); })
      .catch((err) => console.error("[DashboardTypeCollapse] Failed to fetch dashboard data:", err));
  }, []);

  const today = new Date().toLocaleDateString(resolveSwissLocale(locale), { weekday: "long", day: "numeric", month: "long" });

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <style>{`
        .dtc-proposed [class~="text-[12px]"] { font-size: 13px !important; }
        .dtc-proposed .text-xs { font-size: 13px !important; }
        .dtc-proposed .text-sm { font-size: 13px !important; }
        .dtc-proposed [class~="text-[17px]"] { font-size: 15px !important; }
        .dtc-proposed [class~="text-[22px]"] { font-size: 18px !important; }
        .dtc-proposed [class~="text-[26px]"] { font-size: 24px !important; }
        .dtc-proposed .font-medium { font-weight: 600 !important; }
      `}</style>

      <SectionLabel sub="measured live, full first-load content set (SetupBanner + date/title/CTA row + stat-tile grid): 7 sizes {12,13,14,15,17,22,26}px, 3 weights {400,500,600}; not bounded to a literal 390x844 fold (16px DashboardLayout chrome is separate and excluded)">
        Current
      </SectionLabel>
      <div className="mb-10">
        <SetupBanner />
        <DashboardHomeStats today={today} stats={stats} locale={locale} t={t} />
      </div>

      {/* divider-ok (punch-list item 3): comparison scaffolding between the Current and Proposed
          blocks, not simulated site chrome; chrome-count parity (0 header / 1 nav) against the real
          /en/dashboard route held identically with this line present, matching how other
          Current-vs-Proposed comparison mockups in this repo separate their panels. */}
      <div className="h-px bg-s-border mb-10" />

      <SectionLabel sub="collapsed via CSS scope only, same components, same copy: 4 sizes {13,15,18,24}px, 2 weights {400,600}">
        Proposed
      </SectionLabel>
      <div className="dtc-proposed">
        <SetupBanner />
        <DashboardHomeStats today={today} stats={stats} locale={locale} t={t} />
      </div>
    </DashboardLayout>
  );
}
