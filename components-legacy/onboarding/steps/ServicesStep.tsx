"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Scissors, Plus, X, Trash2, Check } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations, useLocale } from "next-intl";
import type { StepHandle } from "@/components-legacy/onboarding/SetupWizard";

interface SimpleService {
  id?: string;
  name_de: string;
  duration_minutes: number;
  price: number;
}

interface ServicesStepProps {
  onSaved: () => void;
}

const ServicesStep = forwardRef<StepHandle, ServicesStepProps>(function ServicesStep({ onSaved }, ref) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [services, setServices] = useState<SimpleService[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState<SimpleService>({ name_de: "", duration_minutes: 60, price: 80 });
  const [suggestions, setSuggestions] = useState<SimpleService[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const servicesRef = useRef<SimpleService[]>([]);
  const mutationInFlightRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    fetch("/api/salons/mine")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.salon?.id;
        const categories = d?.salon?.categories?.join(",") || "hair";
        setSalonId(id);
        if (id) {
          // Fetch existing services
          fetch(`/api/services?salon_id=${id}`)
            .then((r) => r.json())
            .then((res) => {
              const loadedServices = res?.services ?? [];
              servicesRef.current = loadedServices;
              setServices(loadedServices);
            })
            .finally(() => setLoading(false));

          // Fetch AI suggestions in parallel
          fetch(`/api/services/suggest?categories=${categories}`)
            .then((r) => r.json())
            .then((res) => setSuggestions(res?.suggestions ?? []));
        } else {
          setLoading(false);
        }
      });
  }, []);

  const addService = (svc: SimpleService = newService): Promise<boolean> => {
    if (mutationInFlightRef.current) return mutationInFlightRef.current;
    if (!svc.name_de || !salonId) return Promise.resolve(false);

    const operation = (async () => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...svc, salon_id: salonId }),
        });
        if (!res.ok) throw new Error(`POST /api/services returned ${res.status}`);
        const d = await res.json();
        const next = [...servicesRef.current, { ...svc, id: d?.service?.id ?? d?.id }];
        servicesRef.current = next;
        setServices(next);
        if (svc === newService) {
          setNewService({ name_de: "", duration_minutes: 60, price: 80 });
          setShowAdd(false);
        }
        setSuggestions((prev) => prev.filter((s) => s.name_de !== svc.name_de));
        return true;
      } catch (err) {
        console.error("[ServicesStep] add service failed:", err);
        setError(tc("errorGeneric"));
        return false;
      } finally {
        setSaving(false);
      }
    })();
    mutationInFlightRef.current = operation;
    void operation.finally(() => {
      if (mutationInFlightRef.current === operation) mutationInFlightRef.current = null;
    });
    return operation;
  };

  const removeService = (id: string): Promise<boolean> => {
    if (mutationInFlightRef.current) return mutationInFlightRef.current;

    const operation = (async () => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`DELETE /api/services/${id} returned ${response.status}`);
        const next = servicesRef.current.filter((service) => service.id !== id);
        servicesRef.current = next;
        setServices(next);
        return true;
      } catch (err) {
        console.error("[ServicesStep] remove service failed:", err);
        setError(tc("errorGeneric"));
        return false;
      } finally {
        setSaving(false);
      }
    })();
    mutationInFlightRef.current = operation;
    void operation.finally(() => {
      if (mutationInFlightRef.current === operation) mutationInFlightRef.current = null;
    });
    return operation;
  };

  const handleContinue = async (): Promise<boolean> => {
    const activeMutation = mutationInFlightRef.current;
    if (activeMutation && !(await activeMutation)) return false;
    if (servicesRef.current.length === 0) {
      setError(tc("errorGeneric"));
      return false;
    }
    onSaved();
    return true;
  };

  useImperativeHandle(ref, () => ({ save: handleContinue }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-ink/10 flex items-center justify-center">
          <Scissors size={22} strokeWidth={2.2} className="text-s-accent" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-s-ink">
            {t("services.title")}
          </h2>
          <p className="text-sm text-s-ink/40">
            {t("services.subtitle")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : (
        <>
          {services.length > 0 && (
            <div className="bg-white rounded-[12px] border border-s-border overflow-hidden">
              {services.map((s, i) => (
                <div key={s.id ?? i} className={["flex items-center justify-between px-5 py-4", i > 0 ? "border-t border-s-border" : ""].join(" ")}>
                  <div>
                    <p className="text-sm font-medium text-s-ink">{s.name_de}</p>
                    <p className="text-xs text-s-ink/40 data-text">{s.duration_minutes} min {formatCurrency(Number(s.price), locale)}</p>
                  </div>
                  {s.id && (
                    <button onClick={() => removeService(s.id!)} disabled={saving} className="p-1.5 text-s-ink/20 hover:text-s-accent transition-colors disabled:opacity-50">
                      <Trash2 size={14} strokeWidth={1.6} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAdd ? (
            <div className="bg-white rounded-[12px] border border-s-accent/20 p-5 space-y-3 shadow-warm-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-s-ink">{t("services.new")}</p>
                <button onClick={() => setShowAdd(false)} className="text-s-ink/30 hover:text-s-ink">
                  <X size={16} strokeWidth={1.9} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("services.name")} *</label>
                <input
                  value={newService.name_de}
                  onChange={(e) => setNewService({ ...newService, name_de: e.target.value })}
                  placeholder={t("services.namePlaceholder")}
                  className="w-full px-4 py-2.5 text-sm text-s-ink transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("services.duration")}</label>
                  <input
                    type="number" min={15} step={15}
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: +e.target.value })}
                    className="w-full px-4 py-2.5 text-sm text-s-ink transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("services.price")}</label>
                  <input
                    type="number" min={0}
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: +e.target.value })}
                    className="w-full px-4 py-2.5 text-sm text-s-ink transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                  />
                </div>
              </div>
              <button
                onClick={() => addService()}
                disabled={!newService.name_de || saving}
                className="w-full py-2.5 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[12px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 shadow-elevation-2 hover:brightness-[1.06] transition-[transform,filter]"
              >
                {saving && <Spinner size="sm" invert />}
                {t("services.add")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-3 rounded-btn border-2 border-dashed border-s-border text-sm text-s-ink/40 hover:border-s-accent/40 hover:text-s-accent transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={1.9} />
              {t("services.add")}
            </button>
          )}

          {suggestions.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-s-ink-2 mb-3 px-1">{t("services.aiSuggestions")}</p>
              <div className="grid gap-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex justify-between items-center bg-s-ink/5 border border-s-accent/10 rounded-[12px] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-s-ink">{s.name_de}</p>
                      <p className="text-xs text-s-ink/40">{s.duration_minutes} min {formatCurrency(Number(s.price), locale)}</p>
                    </div>
                    <button 
                      onClick={() => addService(s)}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-medium rounded-btn bg-white border border-s-border text-s-ink/80 hover:text-s-accent transition-colors disabled:opacity-50"
                    >
                      {t("services.addButton")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="bg-s-ink/5 border border-s-accent/20 rounded-[12px] px-4 py-3 flex items-center gap-2">
              <Check size={14} strokeWidth={1.6} className="text-s-accent shrink-0" />
              <div>
                <p className="text-xs text-s-accent font-medium">
                  {services.length} {services.length === 1 ? "Service" : "Services"} {t("services.added")}
                </p>
                <p className="text-[12px] text-s-ink/40 mt-0.5">
                  {t("services.addMoreLater")}
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-s-error" role="alert">{error}</p>}

          <button
            onClick={handleContinue}
            disabled={services.length === 0}
            className="w-full py-3 mt-6 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[12px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
          >
            {t("setup.saveAndContinue")}
          </button>
        </>
      )}
    </div>
  );
});

export default ServicesStep;
