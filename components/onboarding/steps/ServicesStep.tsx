"use client";

import { useState, useEffect } from "react";
import { Scissors, Plus, X, Trash2 } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

interface SimpleService {
  id?: string;
  name_de: string;
  duration_minutes: number;
  price: number;
}

interface ServicesStepProps {
  locale: string;
  onSaved: () => void;
}

export default function ServicesStep({ locale, onSaved }: ServicesStepProps) {
  const isDE = locale === "de" || locale === "fr";
  const [services, setServices] = useState<SimpleService[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState<SimpleService>({ name_de: "", duration_minutes: 60, price: 80 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        if (p?.salon_id) {
          return fetch(`/api/services?salon_id=${p.salon_id}`).then((r) => r.json());
        }
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
        <div className="w-12 h-12 rounded-xl bg-s-coral/10 flex items-center justify-center">
          <Scissors size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink">
            {isDE ? "Services hinzufügen" : "Add Services"}
          </h2>
          <p className="text-sm text-s-ink/40">
            {isDE ? "Mindestens 1 Service, damit Kunden buchen können" : "At least 1 service so customers can book"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Existing services */}
          {services.length > 0 && (
            <div className="bg-white rounded-card border border-s-ink/5 overflow-hidden">
              {services.map((s, i) => (
                <div key={s.id ?? i} className={["flex items-center justify-between px-5 py-4", i > 0 ? "border-t border-s-ink/5" : ""].join(" ")}>
                  <div>
                    <p className="text-sm font-medium text-s-ink">{s.name_de}</p>
                    <p className="text-xs text-s-ink/40 data-text">{s.duration_minutes} min · {formatCurrency(Number(s.price), locale)}</p>
                  </div>
                  {s.id && (
                    <button onClick={() => removeService(s.id!)} className="p-1.5 text-s-ink/20 hover:text-s-coral transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {showAdd ? (
            <div className="bg-white rounded-card border border-s-coral/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-s-ink">{isDE ? "Neuer Service" : "New service"}</p>
                <button onClick={() => setShowAdd(false)} className="text-s-ink/30 hover:text-s-ink">
                  <X size={16} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-s-ink/50 mb-1">{isDE ? "Name" : "Name"} *</label>
                <input
                  value={newService.name_de}
                  onChange={(e) => setNewService({ ...newService, name_de: e.target.value })}
                  placeholder={isDE ? "z.B. Herrenhaarschnitt" : "e.g. Men's haircut"}
                  className="w-full px-4 py-2.5 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-s-ink/50 mb-1">{isDE ? "Dauer (Min)" : "Duration (min)"}</label>
                  <input
                    type="number" min={15} step={15}
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-s-ink/50 mb-1">{isDE ? "Preis (CHF)" : "Price (CHF)"}</label>
                  <input
                    type="number" min={0}
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
                  />
                </div>
              </div>
              <button
                onClick={addService}
                disabled={!newService.name_de || saving}
                className="w-full py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Spinner size="sm" invert />}
                {isDE ? "Service hinzufügen" : "Add service"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-3 rounded-button border-2 border-dashed border-s-ink/10 text-sm text-s-ink/40 hover:border-s-coral/40 hover:text-s-coral transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {isDE ? "Service hinzufügen" : "Add service"}
            </button>
          )}

          {services.length > 0 && (
            <div className="bg-s-coral/5 border border-s-coral/20 rounded-card px-4 py-3">
              <p className="text-xs text-s-coral font-medium">
                ✓ {services.length} {services.length === 1 ? "Service" : "Services"} {isDE ? "hinzugefügt" : "added"}
              </p>
              <p className="text-[10px] text-s-ink/40 mt-0.5">
                {isDE ? "Du kannst später jederzeit weitere hinzufügen." : "You can always add more later."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
