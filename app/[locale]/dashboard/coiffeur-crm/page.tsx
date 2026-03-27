"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import FormulaBook from "@/components/dashboard/coiffeur/FormulaBook";
import ConsultationNotes from "@/components/dashboard/coiffeur/ConsultationNotes";
import ColourCycleConfig from "@/components/dashboard/coiffeur/ColourCycleConfig";
import Spinner from "@/components/ui/Spinner";

interface Client {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function CoiffeurCrmPage() {
  const t = useTranslations("dashboardCoiffeur");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/clients?category=coiffeur")
      .then((r) => r.json())
      .then((d) => {
        setClients(d.clients ?? []);
        setSalonId(d.salon_id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredClients = clients.filter((c) =>
    (c.display_name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
        {t("eyebrow")}
      </p>
      <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none mb-6">
        {t("title")}
      </h1>

      {/* Client selector */}
      <div className="mb-6 max-w-md">
        <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">
          {t("select_client")}
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search_client")}
            aria-label={t("search_client")}
            className="w-full pl-8 pr-3 py-2 rounded-[12px] border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-3"><Spinner size="sm" /></div>
        ) : (
          searchQuery.length > 0 && (
            <div className="mt-1 rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface max-h-48 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 p-3 text-center">{t("no_clients")}</p>
              ) : (
                filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClientId(c.id); setSearchQuery(c.display_name ?? ""); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-s-ink/[0.03] dark:hover:bg-s-dm-text/[0.03] transition-colors duration-150 ${
                      selectedClientId === c.id ? "text-s-coral font-semibold" : "text-s-ink dark:text-s-dm-text"
                    }`}
                    aria-label={c.display_name ?? t("unknown_client")}
                  >
                    {c.display_name ?? t("unknown_client")}
                  </button>
                ))
              )}
            </div>
          )
        )}
        {selectedClientId && !searchQuery && (
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1">
            {clients.find((c) => c.id === selectedClientId)?.display_name}
          </p>
        )}
      </div>

      {/* Main grid: FormulaBook + ConsultationNotes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormulaBook clientId={selectedClientId} salonId={salonId ?? ""} />
        <ConsultationNotes clientId={selectedClientId} salonId={salonId ?? ""} />
      </div>

      {/* ColourCycleConfig below */}
      {salonId && (
        <div className="mt-6">
          <ColourCycleConfig salonId={salonId} />
        </div>
      )}
    </div>
  );
}
