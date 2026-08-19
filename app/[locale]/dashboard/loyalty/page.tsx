"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Award, QrCode, History } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import LoyaltyConfig from "@/components-legacy/dashboard/barber/LoyaltyConfig";
import Spinner from "@/components-legacy/ui/Spinner";

interface RedemptionEntry {
  id: string;
  customer_name: string;
  action: string;
  created_at: string;
}

export default function LoyaltyDashboardPage() {
  const t = useTranslations("dashboard.loyaltyPage");
  const [salonId, setSalonId] = useState("");
  const [redemptions, setRedemptions] = useState<RedemptionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [scanToken, setScanToken] = useState("");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState(false);

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
    setScanError(false);
    try {
      const res = await fetch("/api/loyalty/stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: scanToken.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult(
          t("stampSuccess", {
            collected: data.stamps_collected,
            required: data.stamps_required,
          })
        );
        setScanToken("");
      } else {
        setScanError(true);
        setScanResult(t("stampError", { error: data.error ?? t("unknownError") }));
      }
    } catch {
      setScanError(true);
      setScanResult(t("networkError"));
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
        <h1 className="font-heading text-xl font-semibold text-s-ink mb-6">
          {t("title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Config */}
          <LoyaltyConfig salonId={salonId} />

          {/* Scanner */}
          <div className="rounded-[12px] bg-white border border-s-ink/5 p-4">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} strokeWidth={1.9} className="text-s-coral" />
              <h3 className="font-heading text-sm font-semibold text-s-ink">
                {t("scanHeading")}
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-s-ink-2">
                {t("scanInstruction")}
              </p>
              <input
                type="text"
                value={scanToken}
                onChange={(e) => setScanToken(e.target.value)}
                placeholder={t("tokenPlaceholder")}
                className="w-full px-3 py-2 text-sm text-s-ink font-mono focus:outline-none" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              />
              <button
                onClick={handleScanSubmit}
                disabled={!scanToken.trim()}
                className="w-full rounded-btn bg-s-accent text-white font-medium py-2 text-sm hover:brightness-[1.06] disabled:opacity-50 transition-colors"
              >
                {t("stampButton")}
              </button>
              {scanResult && (
                <p className={`text-sm ${scanError ? "text-s-error" : "text-s-sage"}`}>
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
