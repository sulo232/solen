"use client";

import { useState, useEffect } from "react";
import { Scissors, Plus, X, Trash2, Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations, useLocale } from "next-intl";

interface SimpleService {
  id?: string;
  name_de: string;
  duration_minutes: number;
  price: number;
}

interface ServicesStepProps {
  onSaved: () => void;
}

export default function ServicesStep({ onSaved }: ServicesStepProps) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const [services, setServices] = useState<SimpleService[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState<SimpleService>({ name_de: "", duration_minutes: 60, price: 80 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/salons/mine")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.salon?.id;
        setSalonId(id);
        if (id) return fetch(`/api/services?salon_id=${id}`).then((r) => r.json());
      })
      .then((d) => setServices(d?.services ?? []))
      .finally(() => setLoading(false));
  }, []);

  const addService = async () => {
    if (!newService.name_de || !salonId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newService, salon_id: salonId }),
      });
      if (res.ok) {
        const d = await res.json();
        setServices((prev) => [...prev, { ...newService, id: d?.service?.id ?? d?.id }]);
        setNewService({ name_de: "", duration_minutes: 60, price: 80 });
        setShowAdd(false);
        onSaved();
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const removeService = async (id: string) => {
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-card bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
          <Scissors size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t("services.title")}
          </h2>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50">
            {t("services.subtitle")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : (
        <>
          {services.length > 0 && (
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 overflow-hidden">
              {services.map((s, i) => (
                <div key={s.id ?? i} className={["flex items-center justify-between px-5 py-4", i > 0 ? "border-t border-s-ink/5 dark:border-white/5" : ""].join(" ")}>
                  <div>
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{s.name_de}</p>
                    <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 data-text">{s.duration_minutes} min · {formatCurrency(Number(s.price), locale)}</p>
                  </div>
                  {s.id && (
                    <button onClick={() => removeService(s.id!)} className="p-1.5 text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAdd ? (
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-coral/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("services.new")}</p>
                <button onClick={() => setShowAdd(false)} className="text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-ink dark:hover:text-s-dm-text">
                  <X size={16} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("services.name")} *</label>
                <input
                  value={newService.name_de}
                  onChange={(e) => setNewService({ ...newService, name_de: e.target.value })}
                  placeholder={t("services.namePlaceholder")}
                  className="w-full px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("services.duration")}</label>
                  <input
                    type="number" min={15} step={15}
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("services.price")}</label>
                  <input
                    type="number" min={0}
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
                  />
                </div>
              </div>
              <button
                onClick={addService}
                disabled={!newService.name_de || saving}
                className="w-full py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-sm transition-all"
              >
                {saving && <Spinner size="sm" invert />}
                {t("services.add")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-3 rounded-btn border-2 border-dashed border-s-ink/10 dark:border-white/10 text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-coral/40 hover:text-s-coral transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {t("services.add")}
            </button>
          )}

          {services.length > 0 && (
            <div className="bg-s-coral/5 dark:bg-s-coral/10 border border-s-coral/20 rounded-card px-4 py-3 flex items-center gap-2">
              <Check size={14} className="text-s-coral shrink-0" />
              <div>
                <p className="text-xs text-s-coral font-medium">
                  {services.length} {services.length === 1 ? "Service" : "Services"} {t("services.added")}
                </p>
                <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">
                  {t("services.addMoreLater")}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
