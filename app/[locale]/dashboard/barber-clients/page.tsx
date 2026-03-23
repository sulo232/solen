"use client";

import { useEffect, useState } from "react";
import { Scissors, Search, ChevronRight, Clock, Award } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CutHistoryTimeline from "@/components/barber/CutHistoryTimeline";
import LoyaltyCardList from "@/components/barber/LoyaltyCardList";
import Spinner from "@/components/ui/Spinner";

interface BarberClient {
  id: string;
  display_name: string;
  avatar_url: string | null;
  last_cut_date: string | null;
  preferred_barber: string | null;
  visit_count: number;
  loyalty_stamps: number;
}

export default function BarberClientsPage() {
  const [clients, setClients] = useState<BarberClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cuts" | "prefs" | "notes" | "loyalty">("cuts");
  const [salonId, setSalonId] = useState<string>("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/dashboard/clients?category=barbershop");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients ?? []);
          setSalonId(data.salon_id ?? "");
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchClients();
  }, []);

  const filtered = clients.filter((c) =>
    c.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { key: "cuts" as const, label: "Schnitte" },
    { key: "prefs" as const, label: "Präferenzen" },
    { key: "notes" as const, label: "Notizen" },
    { key: "loyalty" as const, label: "Treuekarte" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-xl font-bold text-s-ink dark:text-s-dm-text mb-4">
          Barber Kunden
        </h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kunde suchen..."
            className="w-full pl-9 pr-4 py-2.5 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : selectedClient ? (
          /* Client detail view */
          <div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-sm text-s-coral hover:underline mb-4 flex items-center gap-1"
            >
              ← Zurück zur Liste
            </button>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-s-ink/10 dark:border-s-dm-text/10">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-s-coral text-s-coral"
                      : "border-transparent text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "cuts" && (
              <CutHistoryTimeline clientId={selectedClient} salonId={salonId} />
            )}

            {activeTab === "prefs" && (
              <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4 text-sm text-s-ink/50 dark:text-s-dm-text/50">
                Präferenzen werden aus der Schnitthistorie automatisch abgeleitet.
              </div>
            )}

            {activeTab === "notes" && (
              <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4 text-sm text-s-ink/50 dark:text-s-dm-text/50">
                Notizen sind über die allgemeine Kundenverwaltung verfügbar.
              </div>
            )}

            {activeTab === "loyalty" && (
              <LoyaltyCardList />
            )}
          </div>
        ) : (
          /* Client list */
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-s-ink/40 dark:text-s-dm-text/40">
                <Scissors size={24} className="mx-auto mb-2 opacity-40" />
                {search ? "Keine Kunden gefunden" : "Noch keine Barber-Kunden"}
              </div>
            ) : (
              filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => { setSelectedClient(client.id); setActiveTab("cuts"); }}
                  className="w-full flex items-center gap-3 rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-3 hover:shadow-card transition-shadow text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-s-bg-surface dark:bg-s-dm-bg flex items-center justify-center shrink-0 overflow-hidden">
                    {client.avatar_url ? (
                      <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium text-s-ink/30 dark:text-s-dm-text/30">
                        {client.display_name?.charAt(0) ?? "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">
                      {client.display_name ?? "Unbekannt"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-s-ink/50 dark:text-s-dm-text/50">
                      {client.last_cut_date && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(client.last_cut_date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      <span>{client.visit_count} Besuche</span>
                      {client.loyalty_stamps > 0 && (
                        <span className="flex items-center gap-1">
                          <Award size={10} className="text-s-amber" />
                          {client.loyalty_stamps} Stempel
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-s-ink/20 dark:text-s-dm-text/20 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
