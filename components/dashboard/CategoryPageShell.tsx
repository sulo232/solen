"use client";

import { useState, type ReactNode } from "react";
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
  const { salonId, salonName, salonCategories, loading } = useSalonProfile();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [clientId, setClientId] = useState("");

  const activeTabDef = tabs[activeTab];
  const showClientSelector = !!(clientSelector && activeTabDef?.needsClient);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">
          {category}
        </p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          {title}
        </h1>
      </div>

      {/* Scrollable tab nav */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              aria-label={tab.label}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors ${
                activeTab === idx
                  ? "bg-s-coral text-white"
                  : "bg-white dark:bg-s-dm-surface border border-s-ink/[0.06] text-s-ink/55 dark:text-s-dm-text/55 hover:text-s-ink dark:hover:text-s-dm-text"
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
        <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-12 text-center bg-white dark:bg-s-dm-surface">
          <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">
            Salon-Profil nicht geladen
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {showClientSelector && clientSelector && (
            <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] p-4">
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-2">
                Kunde auswählen
              </p>
              {clientSelector(salonId, clientId, setClientId)}
            </div>
          )}

          {activeTabDef?.needsClient && !clientId ? (
            <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-12 text-center bg-white dark:bg-s-dm-surface">
              <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">
                Kunden auswählen, um weiterzufahren
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
