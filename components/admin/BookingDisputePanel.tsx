"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format-currency";
import { useLocale } from "next-intl";
import { Scale } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface BookingDispute {
  id: string;
  booking_id: string;
  reporter_id: string;
  reported_id: string;
  issue_type: string;
  description: string;
  salon_response: string | null;
  status: string;
  resolution: string | null;
  created_at: string;
  mediation_deadline_at?: string;
  bookings?: {
    id: string;
    starts_at: string;
    price_paid: number;
    salon_id: string;
    salons?: { name: string; slug: string };
  };
  reporter?: { display_name: string };
  reported?: { display_name: string };
}

export default function BookingDisputePanel() {
  const locale = useLocale();
  const [disputes, setDisputes] = useState<BookingDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});
  const [refundAmount, setRefundAmount] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/booking-disputes")
      .then((r) => r.json())
      .then((d) => setDisputes(d.disputes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: string) => {
    setResolving(id);
    const body: any = { action, resolution_note: resolutionNote[id] || undefined };
    if (action === "refund") {
      body.refund_amount = parseFloat(refundAmount[id] || "0") * 100; // in cents
    }

    try {
      const res = await fetch(`/api/admin/booking-disputes/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, status: action === "escalate" ? "escalated" : "resolved" } : d
          )
        );
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert("Fehler bei der Aktion");
    } finally {
      setResolving(null);
    }
  };

  const statusColors: any = {
    open: "bg-s-amber-subtle text-s-amber-text",
    in_review: "bg-s-blue/10 text-s-blue",
    escalated: "bg-s-coral/10 text-s-coral",
    resolved: "bg-s-bg-sunken text-s-ink/50",
  };

  if (loading) return <div className="py-8 text-center"><Spinner /></div>;
  if (disputes.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="font-heading font-bold text-xl text-s-ink mb-4">Buchungsbeschwerden (Kunden)</h2>
      <div className="space-y-4">
        {disputes.map((d) => (
          <div key={d.id} className="rounded-card border border-s-ink/5 dark:border-white/5 bg-white dark:bg-s-dm-surface p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">
                  Kunde: {d.reporter?.display_name || "Unbekannt"} vs Salon: {d.bookings?.salons?.name || d.reported?.display_name || "Unbekannt"}
                </p>
                <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body mt-0.5">
                  Art: <span className="font-medium text-s-ink dark:text-s-dm-text">{d.issue_type}</span> — Buchung: {d.bookings?.starts_at ? new Date(d.bookings.starts_at).toLocaleDateString("de-CH") : d.booking_id.slice(0, 8)}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-pill text-xs font-medium ${statusColors[d.status] || "bg-s-bg-sunken"}`}>
                {d.status.toUpperCase()}
              </span>
            </div>

            <div className="mb-3 p-3 bg-s-bg-surface rounded-btn">
              <p className="text-xs text-s-ink/40 font-body mb-1">Problembeschreibung (Kunde)</p>
              <p className="text-sm text-s-ink/80">{d.description}</p>
            </div>

            {d.salon_response && (
              <div className="mb-3 p-3 bg-s-coral-subtle rounded-btn">
                <p className="text-xs text-s-ink/40 font-body mb-1">Stellungnahme (Salon)</p>
                <p className="text-sm text-s-ink/80">{d.salon_response}</p>
              </div>
            )}

            {d.status === "escalated" && d.mediation_deadline_at && (
              <p className="text-xs text-s-coral font-medium mb-3">
                Mediation läuft. Frist: {new Date(d.mediation_deadline_at).toLocaleDateString("de-CH")}
              </p>
            )}

            {d.status !== "resolved" && (
              <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-s-ink/5">
                <input
                  type="text"
                  placeholder="Notiz für Lösung (optional)"
                  value={resolutionNote[d.id] || ""}
                  onChange={(e) => setResolutionNote((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  className="px-3 py-2 rounded-btn border border-s-ink/10 text-xs w-full mb-2"
                />
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAction(d.id, "dismiss")}
                    disabled={resolving === d.id}
                    className="px-3 py-1.5 rounded-btn bg-s-ink/5 hover:bg-s-ink/10 text-xs font-medium transition-colors"
                  >
                    Abweisen
                  </button>
                  <button
                    onClick={() => handleAction(d.id, "warn_salon")}
                    disabled={resolving === d.id}
                    className="px-3 py-1.5 rounded-btn bg-s-amber-subtle text-s-amber-text hover:bg-s-amber-subtle/80 text-xs font-medium transition-colors"
                  >
                    Salon verwarnen
                  </button>
                  <button
                    onClick={() => handleAction(d.id, "warn_customer")}
                    disabled={resolving === d.id}
                    className="px-3 py-1.5 rounded-btn bg-s-amber-subtle text-s-amber-text hover:bg-s-amber-subtle/80 text-xs font-medium transition-colors"
                  >
                    Kunde verwarnen
                  </button>
                  
                  {d.status !== "escalated" && (
                    <button
                      onClick={() => handleAction(d.id, "escalate")}
                      disabled={resolving === d.id}
                      className="px-3 py-1.5 rounded-btn bg-s-coral/10 text-s-coral hover:bg-s-coral/20 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Scale size={14} /> Eskalieren (30 Tage)
                    </button>
                  )}
                  
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      placeholder="CHF Refund"
                      value={refundAmount[d.id] || ""}
                      onChange={(e) => setRefundAmount((prev) => ({ ...prev, [d.id]: e.target.value }))}
                      className="w-24 px-2 py-1.5 rounded-btn border border-s-ink/10 text-xs"
                    />
                    <button
                      onClick={() => handleAction(d.id, "refund")}
                      disabled={resolving === d.id || !refundAmount[d.id]}
                      className="px-3 py-1.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-xs font-medium hover:bg-s-coral/90 transition-all"
                    >
                      Rückerstatten
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {d.status === "resolved" && d.resolution && (
              <div className="mt-3 pt-3 border-t border-s-ink/5">
                <p className="text-xs text-s-ink/50">Lösung:</p>
                <p className="text-sm font-medium">{d.resolution}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
