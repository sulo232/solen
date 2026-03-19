"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Scale } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";

interface Dispute {
  id: string;
  booking_id: string;
  original_amount: number;
  requested_amount: number;
  salon_reason: string;
  status: string;
  customer_response: string | null;
  admin_decision: string | null;
  admin_amount: number | null;
  created_at: string;
  auto_approve_at: string;
  bookings?: {
    id: string;
    starts_at: string;
    price_paid: number;
    salons?: { name: string; slug: string };
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Ausstehend",
  auto_approved: "Auto-genehmigt",
  customer_approved: "Vom Kunden genehmigt",
  disputed: "Angefochten",
  resolved: "Gelöst",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  disputed: "bg-coral/10 text-coral",
  resolved: "bg-s-coral/10 text-s-coral",
  customer_approved: "bg-s-coral/10 text-s-coral",
  auto_approved: "bg-gray-100 text-dark/50",
};

const UPCHARGE_REASONS: Record<string, string> = {
  hair_length: "Haarlänge",
  extra_treatment: "Zusätzliche Behandlung",
  materials: "Material / Produkte",
  overtime: "Zeitüberschreitung",
  other: "Sonstiges",
};

function formatSalonReason(raw: string): { label: string; details?: string } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.reason && typeof parsed.reason === "string") {
      return {
        label: UPCHARGE_REASONS[parsed.reason] ?? parsed.reason,
        details: parsed.details || undefined,
      };
    }
  } catch {
    // Not JSON — legacy plain text reason
  }
  return { label: raw };
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [compromiseAmount, setCompromiseAmount] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/disputes")
      .then((r) => r.json())
      .then((data) => setDisputes(data.disputes ?? []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  const resolve = async (disputeId: string, decision: string) => {
    setResolving(disputeId);
    const body: Record<string, unknown> = { dispute_id: disputeId, decision };
    if (decision === "compromised") {
      body.admin_amount = parseFloat(compromiseAmount[disputeId] || "0");
    }

    const res = await fetch("/api/admin/disputes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId ? { ...d, status: "resolved", admin_decision: decision } : d
        )
      );
    }
    setResolving(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Scale className="w-6 h-6 text-s-coral" />
          <h1 className="font-heading font-bold text-2xl text-dark">Preisstreitigkeiten</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-12 text-dark/40 font-body">
            Keine Streitigkeiten vorhanden
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div key={d.id} className="rounded-card border border-gray-100 bg-white p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-heading font-semibold text-dark">
                      {d.bookings?.salons?.name ?? "Salon"}
                    </p>
                    <p className="text-xs text-dark/50 font-body mt-0.5">
                      Buchung: {d.bookings?.starts_at ? new Date(d.bookings.starts_at).toLocaleDateString("de-CH") : d.booking_id.slice(0, 8)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-pill text-xs font-medium ${STATUS_COLORS[d.status] ?? "bg-gray-100 text-dark/50"}`}>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-dark/40 font-body">Originalbetrag</p>
                    <p className="font-data font-semibold text-dark">CHF {Number(d.original_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark/40 font-body">Angeforderter Betrag</p>
                    <p className="font-data font-semibold text-coral">CHF {Number(d.requested_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-dark/40 font-body mb-1">Begründung Salon</p>
                  {(() => {
                    const { label, details } = formatSalonReason(d.salon_reason);
                    return (
                      <>
                        <p className="text-sm text-dark/70 font-body font-medium">{label}</p>
                        {details && <p className="text-xs text-dark/50 font-body mt-0.5">{details}</p>}
                      </>
                    );
                  })()}
                </div>

                {d.customer_response && (
                  <div className="mb-3">
                    <p className="text-xs text-dark/40 font-body mb-1">Kundenantwort</p>
                    <p className="text-sm text-dark/70 font-body">{d.customer_response}</p>
                  </div>
                )}

                {d.status === "pending" && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 font-body">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Auto-Genehmigung: {new Date(d.auto_approve_at).toLocaleString("de-CH")}
                  </div>
                )}

                {d.admin_decision && (
                  <div className="mt-2 text-xs text-dark/50 font-body">
                    Admin-Entscheidung: <span className="font-medium">{d.admin_decision}</span>
                    {d.admin_amount != null && ` — CHF ${Number(d.admin_amount).toFixed(2)}`}
                  </div>
                )}

                {d.status === "disputed" && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => resolve(d.id, "approved")}
                      disabled={resolving === d.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-s-coral text-white text-xs font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Genehmigen
                    </button>
                    <button
                      onClick={() => resolve(d.id, "rejected")}
                      disabled={resolving === d.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-coral text-white text-xs font-medium hover:bg-coral/90 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Ablehnen
                    </button>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <input
                        type="number"
                        placeholder="CHF"
                        value={compromiseAmount[d.id] ?? ""}
                        onChange={(e) => setCompromiseAmount((p) => ({ ...p, [d.id]: e.target.value }))}
                        className="w-24 px-2 py-1.5 rounded-button border border-gray-200 text-xs font-data"
                      />
                      <button
                        onClick={() => resolve(d.id, "compromised")}
                        disabled={resolving === d.id || !compromiseAmount[d.id]}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-dark text-white text-xs font-medium hover:bg-dark/90 transition-colors disabled:opacity-50"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Kompromiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
