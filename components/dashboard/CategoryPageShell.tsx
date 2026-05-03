"use client";

"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useSalonProfile } from "@/hooks/useSalonProfile";

export interface CategoryTab {
  label: string;
  icon?: React.ElementType;
  /** If true, shows ClientSelectorDropdown above the content */
  needsClient?: boolean;
  render: (opts: { salonId: string; clientId?: string }) => ReactNode;
}

interface CategoryPageShellProps {
  category: string;
  title: string;
  tabs: CategoryTab[];
  /** If provided, persists client selection across all tabs */
  clientSelector?: (salonId: string, clientId: string, onChange: (id: string) => void) => ReactNode;
  /** Default active tab index */
  defaultTab?: number;
}

/**
 * Shared shell for all category admin pages.
 * Handles: DashboardLayout, profile loading, skeleton, tab nav, and client selector.
 */
export function CategoryPageShell({
  category,
  title,
  tabs,
  clientSelector,
  defaultTab = 0,
}: CategoryPageShellProps) {
  const t = useTranslations("categoryPageShell") as any;
  const { salonId, salonName, salonCategories, loading } = useSalonProfile();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [clientId, setClientId] = useState("");

  const activeTabDef = tabs[activeTab];
  const showClientSelector = !!(clientSelector && activeTabDef?.needsClient);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[9px] font-heading uppercase tracking-[.20em] text-s-ink/30 mb-1">
          {category}
        </p>
        <h1 className="font-heading text-[28px] text-s-ink leading-none">
          {title}
        </h1>
      </div>

      {/* Scrollable tab nav */}
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={activeTab === idx}
              onClick={() => setActiveTab(idx)}
              aria-label={tab.label}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[11px] font-heading uppercase tracking-[.06em] transition-colors duration-150 ${
                activeTab === idx
                  ? "bg-s-coral text-white"
                  : "bg-[--raised] border border-s-ink/[0.06] text-s-ink/55 hover:text-s-ink"
              }`}
            >
              {Icon && <Icon size={12} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-48 bg-s-ink/[0.06] rounded-input" />
          <div className="h-64 bg-s-ink/[0.04] rounded-[12px]" />
        </div>
      ) : !salonId ? (
        <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-12 text-center bg-[--raised]">
          <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">
            {t("salon_not_loaded")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {showClientSelector && clientSelector && (
            <div className="bg-[--raised] rounded-[12px] border border-s-ink/[0.06] p-4">
              <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/35 mb-2">
                {t("select_client")}
              </p>
              {clientSelector(salonId, clientId, setClientId)}
            </div>
          )}

          {activeTabDef?.needsClient && !clientId ? (
            <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-12 text-center bg-[--raised]">
              <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">
                {t("select_client_to_continue")}
              </p>
            </div>
          ) : (
            activeTabDef?.render({ salonId, clientId: clientId || undefined })
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
