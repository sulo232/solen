"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Search, AlertTriangle, Sparkles, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NailClientTab from "@/components/dashboard/nail/NailClientTab";
import Spinner from "@/components/ui/Spinner";
import type { NailShape } from "@/lib/types";

interface NailClient {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email?: string;
  preferred_shape?: NailShape | null;
  has_allergy?: boolean;
  last_design_photo?: string | null;
  last_visit?: string | null;
}

export default function NailClientsPage() {
  const locale = useLocale();
  const [clients, setClients] = useState<NailClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<NailClient | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    // Get salon ID from profile
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.salon_id) {
          setSalonId(p.salon_id);
          return fetch(`/api/salon/clients?salon_id=${p.salon_id}&include_nail_data=true`);
        }
        return null;
      })
      .then((r) => r?.ok ? r.json() : null)
      .then((d) => { if (d?.clients) setClients(d.clients); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) =>
    !search || c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const SHAPE_LABELS: Record<string, string> = {
    round: "Rund", square: "Square", oval: "Oval", almond: "Mandel",
    coffin: "Coffin", stiletto: "Stiletto", squoval: "Squoval",
    ballerina: "Ballerina", lipstick: "Lipstick", edge: "Edge",
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-s-ink dark:text-s-dm-text">Nail Kunden</h1>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{clients.length} Kunden mit Nail-Daten</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name oder E-Mail suchen..."
            className="w-full pl-9 pr-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : selectedClient ? (
          /* Client detail view */
          <div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-sm text-s-coral hover:underline mb-4"
            >
              &larr; Zurück zur Liste
            </button>
            <NailClientTab client={selectedClient} salonId={salonId} />
          </div>
        ) : (
          /* Client list */
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-s-ink/40 dark:text-s-dm-text/40 py-8">
                {search ? "Keine Kunden gefunden" : "Noch keine Nail-Kunden"}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className="w-full flex items-center gap-3 p-3 rounded-card border border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface hover:border-s-coral/20 transition-colors text-left"
                >
                  {/* Avatar or last design */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-s-bg-sunken dark:bg-s-dm-bg shrink-0 flex items-center justify-center">
                    {c.last_design_photo ? (
                      <Image src={c.last_design_photo} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    ) : c.avatar_url ? (
                      <Image src={c.avatar_url} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-lg font-bold text-s-ink/20 dark:text-s-dm-text/20">
                        {c.display_name?.[0] ?? "?"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-s-ink dark:text-s-dm-text truncate">{c.display_name}</p>
                      {c.has_allergy && (
                        <AlertTriangle size={14} className="text-s-error shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.preferred_shape && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral">
                          {SHAPE_LABELS[c.preferred_shape] || c.preferred_shape}
                        </span>
                      )}
                      {c.last_visit && (
                        <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
                          Letzter Besuch: {new Date(c.last_visit).toLocaleDateString("de-CH")}
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
