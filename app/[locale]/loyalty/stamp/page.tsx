"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, AlertCircle, Award } from "lucide-react";

export default function LoyaltyStampPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "ready" | "stamped" | "error">("loading");
  const [result, setResult] = useState<{
    stamps_collected?: number;
    stamps_required?: number;
    is_complete?: boolean;
    error?: string;
  }>({});

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setResult({ error: "Kein Token vorhanden" });
      return;
    }
    setStatus("ready");
  }, [token]);

  const handleStamp = async () => {
    if (!token) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/loyalty/stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("stamped");
        setResult({
          stamps_collected: data.stamps_collected,
          stamps_required: data.stamps_required,
          is_complete: data.is_complete,
        });
      } else {
        setStatus("error");
        setResult({ error: data.error ?? "Unbekannter Fehler" });
      }
    } catch {
      setStatus("error");
      setResult({ error: "Netzwerkfehler" });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg p-4">
      <div className="max-w-sm w-full text-center">
        {status === "loading" && (
          <div className="py-12 text-s-ink/40 dark:text-s-dm-text/40 text-sm">Laden...</div>
        )}

        {status === "ready" && (
          <div className="rounded-card bg-white dark:bg-s-dm-surface shadow-card p-6">
            <Award size={40} className="text-s-coral mx-auto mb-4" />
            <h1 className="font-heading text-lg font-bold text-s-ink dark:text-s-dm-text mb-2">
              Stempel hinzufügen?
            </h1>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">
              Tippe auf den Button, um einen Stempel zu vergeben.
            </p>
            <button
              onClick={handleStamp}
              className="w-full rounded-button bg-s-coral text-white font-medium py-3 text-sm hover:bg-s-coral-hover transition-colors"
            >
              Stempel vergeben
            </button>
          </div>
        )}

        {status === "stamped" && (
          <div className="rounded-card bg-white dark:bg-s-dm-surface shadow-card p-6">
            <div className="w-16 h-16 rounded-full bg-s-sage/10 flex items-center justify-center mx-auto mb-4 animate-[scale_0.3s_ease-out]">
              <Check size={32} className="text-s-sage" />
            </div>
            <h1 className="font-heading text-lg font-bold text-s-ink dark:text-s-dm-text mb-2">
              Gestempelt!
            </h1>
            <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70">
              {result.stamps_collected}/{result.stamps_required} Stempel
            </p>
            {result.is_complete && (
              <p className="text-sm font-medium text-s-coral mt-2">
                Karte voll! Belohnung verfügbar.
              </p>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-card bg-white dark:bg-s-dm-surface shadow-card p-6">
            <AlertCircle size={40} className="text-s-error mx-auto mb-4" />
            <h1 className="font-heading text-lg font-bold text-s-ink dark:text-s-dm-text mb-2">
              Fehler
            </h1>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">
              {result.error}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
