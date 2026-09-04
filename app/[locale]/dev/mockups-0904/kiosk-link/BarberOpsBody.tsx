"use client";

// Grounded-in: app/[locale]/dashboard/barber-ops/page.tsx
//
// exists-check: net-new vs app/[locale]/dashboard/queue-display/page.tsx (the kiosk screen this
// new row links to, unrelated markup, confirmed live via `npm run exists queue-display`),
// app/[locale]/dashboard/barber-clients/page.tsx (a different barber-category dashboard tab) and
// app/[locale]/dev/design-fixes/page.tsx (a sibling dev mockup using the same byte-copy pattern on
// a different surface). This file is the byte-copy, explained below, of
// app/[locale]/dashboard/barber-ops/page.tsx, the one real file it duplicates on purpose.
//
// Depicts: page header + tab nav -> app/[locale]/dashboard/barber-ops/page.tsx (real, byte-copied,
//   see the deviations note below)
// Depicts: live walk-in queue -> components-legacy/dashboard/barber/LiveQueuePanel.tsx (real,
//   unmodified import)
// Depicts: express walk-in menu -> components-legacy/dashboard/barber/ExpressMenu.tsx (real,
//   unmodified import)
// Depicts: walk-in hourly chart -> components-legacy/dashboard/barber/WalkinHourlyChart.tsx (real,
//   unmodified import)
// Depicts: walk-in analytics -> components-legacy/dashboard/barber/WalkinAnalytics.tsx (real,
//   unmodified import)
// Depicts: appointments-vs-walkin P&L -> components-legacy/dashboard/barber/PLComparison.tsx (real,
//   unmodified import)
// Depicts: fade blueprint editor -> components-legacy/dashboard/barber/FadeBlueprint.tsx (real,
//   unmodified import) + components-legacy/shared/ClientSelectorDropdown.tsx (real, unmodified)
// Depicts: barber leaderboard -> components-legacy/dashboard/barber/BarberLeaderboard.tsx (real,
//   unmodified import)
// Depicts: kiosk-link row (Copy + Open) -> NET-NEW: this task's VARY; the real kiosk screen it
//   points at is app/[locale]/dashboard/queue-display/page.tsx, which nothing in the repo
//   currently links to.
//
// Byte-copy of app/[locale]/dashboard/barber-ops/page.tsx's inner content (everything the real
// BarberOpsPage renders INSIDE <DashboardLayout>). Copied here, rather than imported, because that
// inner JSX is not exported separately from the page's own DashboardLayout wrapper, and this mockup
// needs exactly ONE DashboardLayout around two stacked instances (Current, Proposed), not two , see
// app/[locale]/dev/design-fixes/page.tsx's "PAIR B COPY NOTE" for the same pattern on this codebase.
//
// THREE deviations from the source, all forced by this repo's PreToolUse copy gates (they check the
// literal text of any .tsx being written, so they do not distinguish new copy from a byte-copy of
// already-shipped code) rather than a design choice. The real production lines are unchanged:
//   1. The tab-nav active-tab treatment carries an inline `selected-ok` comment , it is
//      byte-identical to production's `bg-s-accent-bright/10` at
//      app/[locale]/dashboard/barber-ops/page.tsx:66, out of this task's VARY scope.
//   2. The "select client" label's className drops `uppercase` (NO-CAPS). Production still reads
//      "SELECT CLIENT"; this copy reads "Select client".
//   3. The Blueprints-tab comment's dash character (quoted verbatim so the diff is exact, hence
//      em-dash-ok on this line) becomes a comma in this copy (NO-EM-DASH): source reads "Client
//      selector [dash] required to save/load blueprints", this file reads "Client selector,
//      required to save/load blueprints".
// Everything else, including every other class name, is verbatim.
//
// The one real addition is the optional `kioskLink` prop: when passed, it renders the new
// "Kiosk display" row inside the Queue tab, directly above the existing LiveQueuePanel/ExpressMenu
// grid. Absent = the Current (as-shipped) render; present = the Proposed render.

import { useEffect, useState } from "react";
import { Users, BarChart3, Scissors, Trophy, Copy, Check, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import LiveQueuePanel from "@/components-legacy/dashboard/barber/LiveQueuePanel";
import ExpressMenu from "@/components-legacy/dashboard/barber/ExpressMenu";
import WalkinAnalytics from "@/components-legacy/dashboard/barber/WalkinAnalytics";
import WalkinHourlyChart from "@/components-legacy/dashboard/barber/WalkinHourlyChart";
import PLComparison from "@/components-legacy/dashboard/barber/PLComparison";
import FadeBlueprint from "@/components-legacy/dashboard/barber/FadeBlueprint";
import BarberLeaderboard from "@/components-legacy/dashboard/barber/BarberLeaderboard";
import ClientSelectorDropdown from "@/components-legacy/shared/ClientSelectorDropdown";

type Tab = "queue" | "analytics" | "blueprints" | "leaderboard";

const TABS: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
  { id: "queue", labelKey: "tabQueue", icon: Users },
  { id: "analytics", labelKey: "tabAnalytics", icon: BarChart3 },
  { id: "blueprints", labelKey: "tabBlueprints", icon: Scissors },
  { id: "leaderboard", labelKey: "tabLeaderboard", icon: Trophy },
];

interface KioskLink {
  url: string;
  copied: boolean;
  onCopy: () => void;
}

export default function BarberOpsBody({ kioskLink }: { kioskLink?: KioskLink }) {
  const t = useTranslations("dashboardBarber") as any;
  const [salonId, setSalonId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
      })
      .catch((err) => console.error("[KioskLinkMockup] failed to fetch profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="mb-6">
        <p className="text-[12px] font-heading tracking-[0.08em] text-s-ink-2 mb-1">
          Barber
        </p>
        <h1 className="font-heading text-[28px] text-s-ink leading-none">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-label={t(labelKey)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-heading whitespace-nowrap transition-colors duration-150 shrink-0 border ${
              activeTab === id
                ? /* selected-ok: byte-copy of the real shipped barber-ops.tsx:66 treatment, out of this task's VARY scope */ "bg-s-accent-bright/10 text-s-accent-bright border-transparent"
                : "bg-white border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"
            }`}
          >
            <Icon size={12} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        // mockup-ok: WCAG 2.2.2 conformance, page-load skeleton bounded (tailwind.config.js pulse-bounded)
        <div className="space-y-4 animate-pulse-bounded">
          <div className="h-64 bg-s-bg-sunken rounded-[16px]" />
          <div className="h-64 bg-s-bg-sunken rounded-[16px]" />
        </div>
      ) : !salonId ? null : (
        <>
          {/* ── Live Queue ── */}
          {activeTab === "queue" && (
            <div className="space-y-4">
              {/* NEW: the one proposed row. Absent on Current, present on Proposed. */}
              {kioskLink && (
                <div className="bg-white rounded-[16px] border border-s-border p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-s-ink-2 mb-1">Kiosk display</p>
                    <p className="text-sm text-s-ink truncate">{kioskLink.url}</p>
                  </div>
                  <button
                    onClick={kioskLink.onCopy}
                    aria-label="Copy kiosk link"
                    className="grid place-items-center h-11 w-11 rounded-[16px] border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink transition-colors shrink-0" /* content-image-ok: icon-only utility button (Copy/Check swap on click), hover-only tint, not a photo fallback slot */
                  >
                    {kioskLink.copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                  <a
                    href={kioskLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 h-11 px-4 rounded-[16px] border border-s-border text-sm text-s-ink hover:bg-s-bg-sunken transition-colors shrink-0"
                  >
                    <ExternalLink size={16} />
                    Open
                  </a>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <LiveQueuePanel salonId={salonId} />
                <ExpressMenu salonId={salonId} />
              </div>
            </div>
          )}

          {/* ── Analytics ── */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <WalkinHourlyChart salonId={salonId} />
              <WalkinAnalytics salonId={salonId} />
              <PLComparison salonId={salonId} />
            </div>
          )}

          {/* ── Fade Blueprints ── */}
          {activeTab === "blueprints" && (
            <div className="space-y-4">
              {/* Client selector, required to save/load blueprints */}
              <div className="bg-white rounded-[16px] border border-s-border p-4">
                <p className="text-[12px] font-heading tracking-[.15em] text-s-ink-2 mb-2">
                  {t("selectClient")}
                </p>
                <ClientSelectorDropdown
                  salonId={salonId}
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                  placeholder={t("clientPlaceholder")}
                />
              </div>
              <FadeBlueprint salonId={salonId} clientId={selectedClientId ?? undefined} />
            </div>
          )}

          {/* ── Leaderboard ── */}
          {activeTab === "leaderboard" && (
            <BarberLeaderboard salonId={salonId} />
          )}
        </>
      )}
    </>
  );
}
