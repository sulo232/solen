"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Gift, Send, Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

const AMOUNT_PRESETS = [2500, 5000, 10000, 20000]; // in cents

export default function GiftCardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/salons/by-slug/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSalon(d.salon ?? d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const amount = useCustom ? Math.round(Number(customAmount) * 100) : selectedAmount;

  const handlePurchase = async () => {
    if (amount < 500 || !recipientName.trim() || !recipientEmail.trim()) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salon.id,
          amount,
          recipient_name: recipientName.trim(),
          recipient_email: recipientEmail.trim(),
          message: message.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fehler");
      }
      const data = await res.json();
      setGiftCode(data.code);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg"><Spinner size="md" /></div>;
  if (!salon) return <div className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg"><p className="text-s-ink/30">Salon nicht gefunden</p></div>;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-s-success-bg flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check size={32} className="text-s-success" />
          </div>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">Geschenkkarte gesendet!</h1>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-4">
            {formatCurrency(amount / 100)} für {recipientName}
          </p>
          <div className="bg-white dark:bg-s-dm-surface rounded-[16px] p-4 border border-s-ink/5 dark:border-white/5">
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">Code</p>
            <p className="font-mono text-lg font-bold text-s-coral">{giftCode}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Gift size={32} className="text-s-coral mx-auto mb-2" />
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Geschenkkarte</h1>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40">{salon.name}</p>
        </div>

        <div className="bg-white dark:bg-s-dm-surface rounded-[16px] shadow-warm-md p-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2 block">Betrag</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {AMOUNT_PRESETS.map((a) => (
                <button key={a} onClick={() => { setSelectedAmount(a); setUseCustom(false); }}
                  className={`py-2.5 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors ${!useCustom && selectedAmount === a ? "bg-s-coral text-white" : "border border-s-ink/10 dark:border-white/10 text-s-ink dark:text-s-dm-text hover:border-s-coral"}`}>
                  {(a / 100).toFixed(0)}
                </button>
              ))}
            </div>
            <button onClick={() => setUseCustom(true)}
              className={`w-full py-2 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors ${useCustom ? "bg-s-coral/10 text-s-coral border border-s-coral/20" : "border border-s-ink/10 dark:border-white/10 text-s-ink/50 dark:text-s-dm-text/50"}`}>
              Eigener Betrag
            </button>
            {useCustom && (
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-s-ink/30 dark:text-s-dm-text/30">CHF</span>
                <input type="number" min="5" step="5" value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)} placeholder="0"
                  className="w-full pl-12 pr-3 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral data-text" />
              </div>
            )}
          </div>

          {/* Recipient */}
          <div>
            <label className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Empfänger *</label>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Name"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral mb-2" />
            <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="E-Mail"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Persönliche Nachricht</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Optional…"
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral resize-none" />
          </div>

          {/* Preview */}
          <div className="rounded-[16px] border border-s-coral/20 bg-s-coral/5 p-4 text-center">
            <p className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 uppercase tracking-wider mb-2">Vorschau</p>
            <Gift size={20} className="text-s-coral mx-auto mb-1" />
            <p className="font-heading font-bold text-lg text-s-coral data-text">{formatCurrency(amount / 100)}</p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{salon.name}</p>
            {recipientName && <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1">Für {recipientName}</p>}
            {message && <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 mt-1 italic">&quot;{message}&quot;</p>}
          </div>

          {error && <p className="text-xs text-s-coral">{error}</p>}

          <button onClick={handlePurchase} disabled={paying || amount < 500 || !recipientName.trim() || !recipientEmail.trim()}
            className="w-full py-3 rounded-btn bg-s-coral text-white font-semibold text-sm hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {paying ? <Spinner size="sm" invert /> : <Send size={14} />}
            Geschenkkarte kaufen · {formatCurrency(amount / 100)}
          </button>
        </div>
      </div>
    </div>
  );
}
