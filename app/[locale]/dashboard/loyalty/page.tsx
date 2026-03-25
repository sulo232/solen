"use client";

import { useEffect, useState } from "react";
import { Award, QrCode, History } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LoyaltyConfig from "@/components/dashboard/barber/LoyaltyConfig";
import Spinner from "@/components/ui/Spinner";

interface RedemptionEntry {
  id: string;
  customer_name: string;
  action: string;
  created_at: string;
}

export default function LoyaltyDashboardPage() {
  const [salonId, setSalonId] = useState("");
  const [redemptions, setRedemptions] = useState<RedemptionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [scanToken, setScanToken] = useState("");
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/clients?category=barbershop");
        if (res.ok) {
          const data = await res.json();
          setSalonId(data.salon_id ?? "");
        }
      } catch {
        // Error
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleScanSubmit = async () => {
    if (!scanToken.trim()) return;
    setScanResult(null);
    try {
      const res = await fetch("/api/loyalty/stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: scanToken.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult(`Stempel vergeben! ${data.stamps_collected}/${data.stamps_required}`);
        setScanToken("");
      } else {
        setScanResult(`Fehler: ${data.error ?? "Unbekannt"}`);
      }
    } catch {
      setScanResult("Netzwerkfehler");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-xl font-bold text-s-ink dark:text-s-dm-text mb-6">
          Treueprogramm
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Config */}
          <LoyaltyConfig salonId={salonId} />

          {/* Scanner */}
          <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-s-coral" />
              <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">
                Stempel scannen
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
                Token vom QR-Code des Kunden eingeben oder einscannen:
              </p>
              <input
                type="text"
                value={scanToken}
                onChange={(e) => setScanToken(e.target.value)}
                placeholder="Token eingeben..."
                className="w-full rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg px-3 py-2 text-sm text-s-ink dark:text-s-dm-text font-mono focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              />
              <button
                onClick={handleScanSubmit}
                disabled={!scanToken.trim()}
                className="w-full rounded-btn bg-s-coral text-white font-medium py-2 text-sm hover:brightness-[1.06] disabled:opacity-50 transition-colors"
              >
                Stempel vergeben
              </button>
              {scanResult && (
                <p className={`text-sm ${scanResult.startsWith("Fehler") ? "text-s-error" : "text-s-sage"}`}>
                  {scanResult}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
