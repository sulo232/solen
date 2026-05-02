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
    <main className="min-h-screen flex items-center justify-center bg-s-bg-base p-4">
      <div className="max-w-sm w-full text-center">
        {status === "loading" && (
          <div className="flex items-center justify-center gap-1.5 py-16">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-s-coral/50 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}

        {status === "ready" && (
          <div
            className="rounded-card bg-white p-8 text-center"
            style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 28px rgba(26,18,9,.08)" }}
          >
            {/* Icon box */}
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(232,98,74,.10)" }}
            >
              <Award size={30} className="text-s-coral" />
            </div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/50 mb-2">
              Stempelkarte
            </p>
            <h1 className="font-heading font-bold text-xl text-s-ink mb-2">
              Stempel hinzufügen?
            </h1>
            <p className="text-sm font-body text-s-ink/50 mb-6 leading-relaxed">
              Tippe auf den Button, um einen Stempel zu vergeben.
            </p>
            <button
              onClick={handleStamp}
              className="w-full rounded-pill bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] py-3.5 hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] shadow-coral-glow"
            >
              Stempel vergeben
            </button>
          </div>
        )}

        {status === "stamped" && (
          <div
            className="rounded-card bg-white p-8 text-center"
            style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 28px rgba(26,18,9,.08)" }}
          >
            {/* ✅ NO scale animation — opacity+translateY only */}
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
              style={{
                background: "rgba(76,175,111,.12)",
                animation: "fade-in-up 0.35s cubic-bezier(0.25,1,0.5,1) both",
              }}
            >
              <Check size={28} className="text-s-sage" />
            </div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-sage mb-2">
              Gestempelt
            </p>
            <h1 className="font-heading font-bold text-xl text-s-ink mb-3">
              Gestempelt!
            </h1>
            <p className="text-sm font-heading font-semibold text-s-ink/60">
              {result.stamps_collected}/{result.stamps_required} Stempel
            </p>
            {result.is_complete && (
              <div
                className="mt-4 px-4 py-2.5 rounded-[10px] inline-block"
                style={{ background: "rgba(232,98,74,.08)" }}
              >
                <p className="text-xs font-heading font-bold uppercase tracking-[.08em] text-s-coral">
                  Belohnung freigeschaltet! 🎉
                </p>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div
            className="rounded-card bg-white p-8 text-center"
            style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 28px rgba(26,18,9,.08)" }}
          >
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(232,98,74,.10)" }}
            >
              <AlertCircle size={28} className="text-s-coral" />
            </div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
              Fehler
            </p>
            <h1 className="font-heading font-bold text-xl text-s-ink mb-2">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-sm font-body text-s-ink/50">
              {result.error}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
