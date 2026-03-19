"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Percent, Copy, Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_booking_amount: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export default function PromoManager() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    min_booking_amount: 0,
    max_uses: "",
    valid_until: "",
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/promo");
      const data = await res.json();
      setCodes(data.codes ?? []);
    } catch {
      setError("Fehler beim Laden der Codes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discount_type: form.discount_type,
          discount_value: form.discount_value,
          min_booking_amount: form.min_booking_amount,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          valid_until: form.valid_until || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? data.message ?? "Fehler");
      }

      setShowForm(false);
      setForm({ code: "", discount_type: "percent", discount_value: 10, min_booking_amount: 0, max_uses: "", valid_until: "" });
      fetchCodes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Erstellen");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">Promo-Codes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neuer Code
        </button>
      </div>

      {error && (
        <div className="rounded-button bg-s-coral/10 border border-s-coral/20 px-3 py-2.5 text-sm text-s-coral">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-card border border-s-ink/5 dark:border-white/10 shadow-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SOMMER2026"
                required
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-s-ink dark:text-s-dm-text focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Rabatttyp</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-s-ink dark:text-s-dm-text outline-none"
              >
                <option value="percent">Prozent (%)</option>
                <option value="fixed">Fixbetrag (CHF)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">
                Rabattwert {form.discount_type === "percent" ? "(%)" : "(CHF)"}
              </label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                min={1}
                max={form.discount_type === "percent" ? 100 : 999}
                required
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-s-ink dark:text-s-dm-text outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Max. Nutzungen</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Unbegrenzt"
                min={1}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-s-ink dark:text-s-dm-text outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Mindestbetrag (CHF)</label>
              <input
                type="number"
                value={form.min_booking_amount}
                onChange={(e) => setForm({ ...form, min_booking_amount: parseFloat(e.target.value) || 0 })}
                min={0}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-s-ink dark:text-s-dm-text outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Gültig bis</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-s-ink dark:text-s-dm-text outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {creating ? <Spinner size="sm" /> : <Plus className="w-3.5 h-3.5" />}
              Erstellen
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-button bg-s-bg-sunken dark:bg-white/10 text-s-ink/60 dark:text-s-dm-text/60 text-sm hover:bg-s-sand dark:hover:bg-white/15 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Code list */}
      {codes.length === 0 ? (
        <div className="text-center py-12 text-s-ink/40 dark:text-s-dm-text/40 text-sm">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Noch keine Promo-Codes erstellt
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((promo) => (
            <div
              key={promo.id}
              className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-card border border-s-ink/5 dark:border-white/10 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-button flex items-center justify-center ${promo.is_active ? "bg-s-coral/10 text-s-coral" : "bg-s-bg-sunken text-s-ink/30"}`}>
                  {promo.discount_type === "percent" ? <Percent className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="data-text font-semibold text-sm text-s-ink dark:text-s-dm-text">{promo.code}</span>
                    <button
                      onClick={() => copyCode(promo.code, promo.id)}
                      className="p-0.5 hover:bg-s-bg-sunken dark:hover:bg-white/10 rounded transition-colors"
                    >
                      {copiedId === promo.id ? <Check className="w-3 h-3 text-s-coral" /> : <Copy className="w-3 h-3 text-s-ink/30" />}
                    </button>
                  </div>
                  <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
                    {promo.discount_type === "percent" ? `${promo.discount_value}%` : `CHF ${promo.discount_value}`} Rabatt
                    {promo.max_uses ? ` · ${promo.current_uses}/${promo.max_uses} genutzt` : ` · ${promo.current_uses}x genutzt`}
                    {promo.valid_until && ` · bis ${new Date(promo.valid_until).toLocaleDateString("de-CH")}`}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${promo.is_active ? "bg-s-coral/10 text-s-coral" : "bg-s-bg-sunken text-s-ink/40"}`}>
                {promo.is_active ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
