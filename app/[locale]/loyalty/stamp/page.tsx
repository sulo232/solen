"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, AlertCircle, Award } from "lucide-react";

export default function LoyaltyStampPage() {
  const searchParams = useSearchParams() ?? new URLSearchParams();
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
    } catch (err) {
      // V3-D343 (W17, 2026-05-28): informative log added per CLAUDE.md error-handling rule.
      console.error("[LoyaltyStamp] stamp POST failed:", err);
      setStatus("error");
      setResult({ error: "Netzwerkfehler" });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-sm w-full text-center">
        {status === "loading" && (
          <div className="flex items-center justify-center gap-1.5 py-16">
            {[0, 1, 2].map((i) => (
              // mockup-ok: WCAG 2.2.2 conformance, mount-load dots bounded (tailwind.config.js pulse-bounded)
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-s-ink/50 animate-pulse-bounded"
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
            {/* Icon box — icons are content, not actions: sunken + ink (1.5 v3, 2026-06-11) */}
            <div className="w-16 h-16 rounded-[18px] bg-s-bg-sunken flex items-center justify-center mx-auto mb-5">
              <Award size={30} className="text-s-ink" />
            </div>
            <p className="text-[12px] font-heading tracking-[0.08em] text-s-ink-2 mb-2">
              Stempelkarte
            </p>
            <h1 className="font-heading text-xl text-s-ink mb-2">
              Stempel hinzufügen?
            </h1>
            <p className="text-sm font-body text-s-ink-2 mb-6 leading-relaxed">
              Tippe auf den Button, um einen Stempel zu vergeben.
            </p>
            <button
              onClick={handleStamp}
              className="w-full rounded-pill bg-s-ink text-white text-xs font-heading uppercase tracking-[.04em] py-3.5 hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] shadow-elevation-2"
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
                background: "rgba(22,163,74,.12)",
                animation: "fade-in-up 0.35s cubic-bezier(0.25,1,0.5,1) both",
              }}
            >
              <Check size={28} className="text-s-success" />
            </div>
            <p className="text-[12px] font-heading tracking-[0.08em] text-s-success mb-2">
              Gestempelt
            </p>
            <h1 className="font-heading text-xl text-s-ink mb-3">
              Gestempelt!
            </h1>
            <p className="text-sm font-heading text-s-ink-2">
              {result.stamps_collected}/{result.stamps_required} Stempel
            </p>
            {result.is_complete && (
              /* Reward unlocked = success: semantic green, normal case (universal-color + A21) */
              <div className="mt-4 px-4 py-2.5 rounded-[10px] inline-block bg-s-success-bg">
                <p className="text-[13px] font-heading font-semibold text-s-success">
                  Belohnung freigeschaltet
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
            {/* Error = red semantic (universal-color); was wrongly blue */}
            <div className="w-16 h-16 rounded-[18px] bg-s-error-bg flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={28} className="text-s-error" />
            </div>
            <h1 className="font-heading text-xl text-s-ink mb-2">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-sm font-body text-s-ink-2">
              {result.error}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
