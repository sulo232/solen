"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Save, Plus, X, Eye } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

interface LastMinuteSettings {
  enabled: boolean;
  global_discount_percent: number;
  service_overrides: Record<string, number>; // service_id -> discount %
}

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  duration_minutes: number;
  base_price: number;
}

export default function LastMinuteManager({ salonId }: { salonId: string }) {
  const t = useTranslations("dashboard.marketing") as any;
  const [settings, setSettings] = useState<LastMinuteSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newServiceId, setNewServiceId] = useState<string>("");

  // Fetch settings and services
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/salon/last-minute-settings?salon_id=${salonId}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/salon/services?salon_id=${salonId}`).then((r) =>
        r.ok ? r.json() : { items: [], services: [] }
      ),
    ])
      .then(([settingsData, servicesResponse]: [any, any]) => {
        if (cancelled) return;
        setSettings(
          settingsData || {
            enabled: false,
            global_discount_percent: 10,
            service_overrides: {},
          }
        );
        // Use 'items' from the response (new format with all fields)
        const servicesData = servicesResponse.items || servicesResponse.services || [];
        setServices(servicesData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[LastMinuteManager] fetch error:", err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [salonId]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/salon/last-minute-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          ...settings,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSuccess("Einstellungen gespeichert!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("[LastMinuteManager] save error:", err);
      setError("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const addServiceOverride = () => {
    if (!newServiceId || !settings) return;
    if (settings.service_overrides[newServiceId] !== undefined) {
      setError("Dienst ist bereits überschrieben");
      return;
    }
    setSettings({
      ...settings,
      service_overrides: {
        ...settings.service_overrides,
        [newServiceId]: settings.global_discount_percent,
      },
    });
    setNewServiceId("");
    setError(null);
  };

  const removeServiceOverride = (serviceId: string) => {
    if (!settings) return;
    const { [serviceId]: _, ...rest } = settings.service_overrides;
    setSettings({
      ...settings,
      service_overrides: rest,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!settings) {
    return (
      <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 text-center py-8">
        Fehler beim Laden der Einstellungen
      </p>
    );
  }

  const availableServices = services.filter(
    (s) => !settings.service_overrides[s.id]
  );

  return (
    <div className="space-y-6">
      {/* Errors and success */}
      {error && (
        <div className="p-4 rounded-[10px] bg-s-coral/5 dark:bg-s-coral/10 border border-s-coral/20 text-sm text-s-coral">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-[10px] bg-s-success/5 dark:bg-s-success/10 border border-s-success/20 text-sm text-s-success">
          {success}
        </div>
      )}

      {/* Global settings */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) =>
                setSettings({ ...settings, enabled: e.target.checked })
              }
              className="w-5 h-5 rounded border-s-ink/20 cursor-pointer"
            />
            <span className="font-heading font-semibold text-s-ink dark:text-s-dm-text">
              Last-Minute Deals aktivieren
            </span>
          </label>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-1 ml-8">
            Zeige deine verfügbaren Slots mit Rabatten auf der Last-Minute Seite
          </p>
        </div>

        {settings.enabled && (
          <div>
            <label className="block text-sm font-heading font-bold text-s-ink dark:text-s-dm-text mb-2">
              Globaler Rabatt (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="99"
                value={settings.global_discount_percent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    global_discount_percent: Math.max(1, parseInt(e.target.value) || 10),
                  })
                }
                className="w-24 px-4 py-2.5 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none"
              />
              <span className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
                wird auf alle Slots angewendet
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Service overrides */}
      {settings.enabled && (
        <div className="border-t border-s-ink/5 dark:border-white/5 pt-6">
          <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-4">
            Dienst-spezifische Rabatte
          </h3>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-4">
            Setze unterschiedliche Rabattsätze für einzelne Dienste
          </p>

          {/* List of service overrides */}
          {Object.keys(settings.service_overrides).length > 0 && (
            <div className="space-y-3 mb-6">
              {Object.entries(settings.service_overrides).map(([serviceId, discount]) => {
                const service = services.find((s) => s.id === serviceId);
                if (!service) return null;

                return (
                  <div
                    key={serviceId}
                    className="flex items-center justify-between gap-3 p-4 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[10px] border border-s-ink/5 dark:border-white/5"
                  >
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
                        {service.name_de}
                      </p>
                      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
                        {service.duration_minutes} min · CHF {service.base_price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={discount}
                          onChange={(e) => {
                            const newDiscount = Math.max(1, parseInt(e.target.value) || 10);
                            setSettings({
                              ...settings,
                              service_overrides: {
                                ...settings.service_overrides,
                                [serviceId]: newDiscount,
                              },
                            });
                          }}
                          className="w-16 px-2 py-1.5 rounded-[6px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text text-sm text-center focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none"
                        />
                        <span className="ml-1 text-sm text-s-ink/60 dark:text-s-dm-text/60">
                          %
                        </span>
                      </div>
                      <button
                        onClick={() => removeServiceOverride(serviceId)}
                        className="p-1.5 rounded-[6px] text-s-ink/40 dark:text-s-dm-text/40 hover:bg-s-ink/5 dark:hover:bg-white/5 hover:text-s-coral transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new override */}
          {availableServices.length > 0 && (
            <div className="flex gap-2">
              <select
                value={newServiceId}
                onChange={(e) => setNewServiceId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none"
              >
                <option value="">Wähle einen Dienst...</option>
                {availableServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name_de}
                  </option>
                ))}
              </select>
              <button
                onClick={addServiceOverride}
                disabled={!newServiceId}
                className="flex items-center gap-2 px-4 py-2.5 rounded-btn border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-surface text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral hover:text-s-coral disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
                Hinzufügen
              </button>
            </div>
          )}

          {availableServices.length === 0 && Object.keys(settings.service_overrides).length > 0 && (
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
              Alle Dienste haben benutzerdefinierte Rabatte
            </p>
          )}
        </div>
      )}

      {/* Preview calculator */}
      {settings.enabled && services.length > 0 && (
        <div className="border-t border-s-ink/5 dark:border-white/5 pt-6">
          <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-4 flex items-center gap-2">
            <Eye size={18} />
            Rabatt-Vorschau
          </h3>

          <div className="space-y-2">
            {services.slice(0, 3).map((service) => {
              const discountPercent =
                settings.service_overrides[service.id] ?? settings.global_discount_percent;
              const discountAmount = (service.base_price * discountPercent) / 100;
              const finalPrice = service.base_price - discountAmount;

              return (
                <div key={service.id} className="p-3 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[8px]">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">
                      {service.name_de}
                    </p>
                    <span className="text-xs font-heading font-bold text-s-coral bg-s-coral/10 px-2 py-0.5 rounded-[4px]">
                      -{discountPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-s-ink/60 dark:text-s-dm-text/60">
                    <span>
                      CHF {service.base_price.toFixed(2)} → CHF {finalPrice.toFixed(2)}
                    </span>
                    <span className="text-s-success font-semibold">
                      sparen CHF {discountAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
            {services.length > 3 && (
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 text-center py-2">
                ... und {services.length - 3} weitere Dienste
              </p>
            )}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="border-t border-s-ink/5 dark:border-white/5 pt-6 flex gap-3 justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-btn bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] disabled:opacity-60"
        >
          <Save size={14} />
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>
    </div>
  );
}
