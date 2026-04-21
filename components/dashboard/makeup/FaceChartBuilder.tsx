"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Save, Plus, X, Image as ImageIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import FaceDiagram from "@/components/shared/FaceDiagram";

const FACE_ZONES = [
  { key: "forehead", labelKey: "zones.forehead" },
  { key: "cheekbones", labelKey: "zones.cheekbones" },
  { key: "jawline", labelKey: "zones.jawline" },
  { key: "temples", labelKey: "zones.temples" },
  { key: "eyelids", labelKey: "zones.eyelids" },
  { key: "under_eye", labelKey: "zones.under_eye" },
  { key: "lips", labelKey: "zones.lips" },
  { key: "nose_bridge", labelKey: "zones.nose_bridge" },
  { key: "chin", labelKey: "zones.chin" },
] as const;

const TECHNIQUES = ["highlight", "contour", "blush", "bronzer", "shimmer"] as const;

interface FaceChart {
  id: string;
  foundation_brand: string | null;
  foundation_shade: string | null;
  undertone: string | null;
  zones: Record<string, string>;
  eye_look: string | null;
  lip_colour: string | null;
  products_used: { id?: string; name: string; shade?: string }[];
  reference_photo_url: string | null;
  notes: string | null;
  created_at: string;
}

interface ProductSuggestion {
  id: string;
  brand: string;
  product_name: string;
  shade: string | null;
}

export default function FaceChartBuilder({
  salonId,
  clientId,
}: {
  salonId: string;
  clientId: string | null;
}) {
  const t = useTranslations("dashboardMakeup") as any;
  const [charts, setCharts] = useState<FaceChart[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [zones, setZones] = useState<Record<string, string>>({});
  const [foundationBrand, setFoundationBrand] = useState("");
  const [foundationShade, setFoundationShade] = useState("");
  const [undertone, setUndertone] = useState<string>("");
  const [eyeLook, setEyeLook] = useState("");
  const [lipColour, setLipColour] = useState("");
  const [products, setProducts] = useState<{ name: string; shade?: string }[]>([]);
  const [productInput, setProductInput] = useState("");
  const [notes, setNotes] = useState("");
  const [visualMode, setVisualMode] = useState(false);

  // Kit autocomplete
  const [kitItems, setKitItems] = useState<ProductSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    fetch(`/api/dashboard/makeup/face-charts?salon_id=${salonId}&client_id=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setCharts(d.data); })
      .catch((err) => console.error("[FaceChartBuilder] failed to load face charts:", err))
      .finally(() => setLoading(false));
  }, [salonId, clientId]);

  // Load kit items for autocomplete
  useEffect(() => {
    fetch(`/api/dashboard/makeup/kit?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setKitItems(d.data); })
      .catch((err) => console.error("[FaceChartBuilder] failed to load kit items for autocomplete:", err));
  }, [salonId]);

  const handleProductInput = (val: string) => {
    setProductInput(val);
    if (val.length < 2) { setSuggestions([]); return; }
    const q = val.toLowerCase();
    setSuggestions(kitItems.filter((k) =>
      k.brand.toLowerCase().includes(q) || k.product_name.toLowerCase().includes(q)
    ).slice(0, 5));
  };

  const addProduct = (name: string, shade?: string) => {
    setProducts((prev) => [...prev, { name, shade }]);
    setProductInput("");
    setSuggestions([]);
  };

  const removeProduct = (idx: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setZones({});
    setFoundationBrand("");
    setFoundationShade("");
    setUndertone("");
    setEyeLook("");
    setLipColour("");
    setProducts([]);
    setNotes("");
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/makeup/face-charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          client_id: clientId,
          foundation_brand: foundationBrand || undefined,
          foundation_shade: foundationShade || undefined,
          undertone: undertone || undefined,
          zones,
          eye_look: eyeLook || undefined,
          lip_colour: lipColour || undefined,
          products_used: products,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.data) setCharts((prev) => [d.data, ...prev]);
        resetForm();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!clientId) {
    return (
      <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 py-4 text-center">
        {t("select_client_first")}
      </p>
    );
  }

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
          {t("face_chart_title")}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 min-h-[44px] rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.97] shadow-coral-glow transition-[transform,filter] duration-150"
          aria-label={t("face_chart_new")}
        >
          <Plus size={12} />
          {t("face_chart_new")}
        </button>
      </div>

      {/* New chart form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface space-y-4">
          {/* Foundation details */}
          <div className="space-y-2">
            <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40">
              {t("foundation")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input
                value={foundationBrand}
                onChange={(e) => setFoundationBrand(e.target.value)}
                placeholder={t("foundation_brand")}
                className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
                aria-label={t("foundation_brand")}
              />
              <input
                value={foundationShade}
                onChange={(e) => setFoundationShade(e.target.value)}
                placeholder={t("foundation_shade")}
                className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
                aria-label={t("foundation_shade")}
              />
              <select
                value={undertone}
                onChange={(e) => setUndertone(e.target.value)}
                className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
                aria-label={t("undertone_label")}
              >
                <option value="">{t("undertone_select")}</option>
                <option value="warm">{t("undertone.warm")}</option>
                <option value="cool">{t("undertone.cool")}</option>
                <option value="neutral">{t("undertone.neutral")}</option>
              </select>
            </div>
          </div>

          {/* Face zones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40">
                {t("zones_title")}
              </p>
              <button
                onClick={() => setVisualMode(!visualMode)}
                className={`rounded-[8px] border px-3 py-1.5 text-[10px] font-heading font-semibold transition-colors duration-150 ${
                  visualMode
                    ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                    : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/40 dark:text-s-dm-text/40"
                }`}
                aria-label={t(visualMode ? "text_mode" : "visual_mode")}
              >
                {t(visualMode ? "text_mode" : "visual_mode")}
              </button>
            </div>

            {/* Visual Mode: Face Diagram */}
            {visualMode && (
              <div className="mb-2">
                <FaceDiagram
                  zoneSelections={zones}
                  onZoneClick={(zoneId) => {
                    // Toggle zone — cycle through techniques or deselect
                    setZones((prev) => {
                      if (prev[zoneId]) {
                        const copy = { ...prev };
                        delete copy[zoneId];
                        return copy;
                      }
                      return { ...prev, [zoneId]: "highlight" };
                    });
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FACE_ZONES.map((zone) => (
                <div
                  key={zone.key}
                  className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-3 bg-white dark:bg-s-dm-surface"
                >
                  <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text mb-2">
                    {t(zone.labelKey as any)}
                  </p>
                  <select
                    value={zones[zone.key] || ""}
                    onChange={(e) => setZones((prev) => ({ ...prev, [zone.key]: e.target.value }))}
                    className="w-full rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-2 py-1.5 text-xs bg-transparent text-s-ink dark:text-s-dm-text"
                    aria-label={t(zone.labelKey as any)}
                  >
                    <option value="">{t("select_technique")}</option>
                    {TECHNIQUES.map((tech) => (
                      <option key={tech} value={tech}>{t(`technique.${tech}` as any)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Eye + Lip */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1">
                {t("eye_look")}
              </p>
              <input
                value={eyeLook}
                onChange={(e) => setEyeLook(e.target.value)}
                placeholder={t("eye_look_placeholder")}
                className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
                aria-label={t("eye_look")}
              />
            </div>
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1">
                {t("lip_colour")}
              </p>
              <input
                value={lipColour}
                onChange={(e) => setLipColour(e.target.value)}
                placeholder={t("lip_colour_placeholder")}
                className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
                aria-label={t("lip_colour")}
              />
            </div>
          </div>

          {/* Products used (autocomplete from kit) */}
          <div className="space-y-2">
            <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40">
              {t("products_used")}
            </p>
            <div className="relative">
              <input
                value={productInput}
                onChange={(e) => handleProductInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && productInput.trim()) {
                    e.preventDefault();
                    addProduct(productInput.trim());
                  }
                }}
                placeholder={t("products_placeholder")}
                className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
                aria-label={t("products_used")}
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface shadow-warm-md">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addProduct(`${s.brand} — ${s.product_name}`, s.shade || undefined)}
                      className="w-full text-left px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/[0.03] dark:hover:bg-s-dm-text/[0.03] transition-colors duration-150"
                      aria-label={`${s.brand} ${s.product_name}`}
                    >
                      <span className="font-heading font-semibold">{s.brand}</span>
                      {" — "}
                      {s.product_name}
                      {s.shade && <span className="text-s-ink/40 dark:text-s-dm-text/40 ml-1">({s.shade})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {products.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {products.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] text-[10px] text-s-ink dark:text-s-dm-text"
                  >
                    {p.name}
                    {p.shade && <span className="text-s-ink/40 dark:text-s-dm-text/40">({p.shade})</span>}
                    <button onClick={() => removeProduct(i)} className="ml-0.5" aria-label={t("remove")}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1">
              {t("notes")}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text resize-none"
              aria-label={t("notes")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-2 min-h-[44px] rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] shadow-coral-glow transition-[transform,filter] duration-150"
              aria-label={saving ? t("saving") : t("save")}
            >
              <Save size={12} />
              {saving ? t("saving") : t("save")}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-[8px] text-xs text-s-ink/50 dark:text-s-dm-text/50"
              aria-label={t("cancel")}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Timeline of existing charts */}
      {charts.length > 0 ? (
        <div className="space-y-3">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-3 bg-white dark:bg-s-dm-surface"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] data-text text-s-ink/40 dark:text-s-dm-text/40">
                  {new Date(chart.created_at).toLocaleDateString()}
                </span>
                {chart.reference_photo_url && (
                  <ImageIcon size={12} className="text-s-ink/30 dark:text-s-dm-text/30" />
                )}
              </div>
              {(chart.foundation_brand || chart.foundation_shade) && (
                <p className="text-xs text-s-ink dark:text-s-dm-text mb-1">
                  <span className="font-heading font-semibold">{t("foundation")}:</span>{" "}
                  {[chart.foundation_brand, chart.foundation_shade, chart.undertone].filter(Boolean).join(" — ")}
                </p>
              )}
              {Object.keys(chart.zones || {}).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {Object.entries(chart.zones).map(([zone, tech]) => (
                    <span
                      key={zone}
                      className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] text-s-ink/60 dark:text-s-dm-text/60"
                    >
                      {t(`zones.${zone}` as any)}: {t(`technique.${tech}` as any)}
                    </span>
                  ))}
                </div>
              )}
              {chart.eye_look && (
                <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50">{t("eye_look")}: {chart.eye_look}</p>
              )}
              {chart.lip_colour && (
                <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50">{t("lip_colour")}: {chart.lip_colour}</p>
              )}
              {chart.products_used && chart.products_used.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {chart.products_used.map((p, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-s-coral/[0.06] text-s-coral"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-center text-xs text-s-ink/30 dark:text-s-dm-text/30 py-6">
            {t("face_chart_empty")}
          </p>
        )
      )}
    </div>
  );
}
