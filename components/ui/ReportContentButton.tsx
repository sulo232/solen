"use client";

import { useState } from "react";
import { Flag, X, Loader2 } from "lucide-react";

interface ReportContentButtonProps {
  targetType: "salon" | "review" | "user";
  targetId: string;
  className?: string;
}

export function ReportContentButton({ targetType, targetId, className = "" }: ReportContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, details }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setReason("inappropriate");
        setDetails("");
      }, 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Etwas ist schiefgelaufen");
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 text-xs text-s-ink/40 hover:text-s-error transition-colors ${className}`}
        aria-label="Inhalt melden"
      >
        <Flag size={14} />
        <span>Melden</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-s-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-s-dm-surface rounded-[12px] shadow-surface w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => !loading && setIsOpen(false)}
              className="absolute top-4 right-4 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5 p-1 rounded transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="font-heading font-bold text-lg mb-1">Inhalt melden</h3>
            <p className="text-sm text-s-ink/60 mb-5">
              Helfen Sie uns, solen.ch sicher zu halten. (AGB §6.5)
            </p>

            {success ? (
              <div className="bg-s-sage-bg border border-s-sage/20 text-s-sage px-4 py-8 text-center rounded-btn">
                <Flag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Vielen Dank für Ihre Meldung.</p>
                <p className="text-xs mt-1 opacity-80">Unser Team wird dies überprüfen.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="text-xs text-s-error bg-s-error-bg p-2 rounded-btn">{error}</div>}
                
                <div>
                  <label className="block text-xs font-medium text-s-ink/60 mb-1">Grund</label>
                  <select 
                    value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text text-sm focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
                  >
                    <option value="inappropriate">Unangemessener Inhalt</option>
                    <option value="spam">Spam oder Werbung</option>
                    <option value="fake">Fake / Betrug</option>
                    <option value="ip_violation">Geistiges Eigentum / Urheberrecht</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-s-ink/60 mb-1">Details (Optional)</label>
                  <textarea 
                    value={details} onChange={e => setDetails(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-input border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
                    placeholder="Bitte beschreiben Sie das Problem genauer..."
                  />
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white font-medium text-sm disabled:opacity-50 transition-[transform,filter] duration-150"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Meldung absenden"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
