"use client";

import { useState, useEffect, useCallback } from "react";
import MaterialSelector from "./MaterialSelector";
import ShapeLengthPicker from "./ShapeLengthPicker";
import InspoUploader from "./InspoUploader";
import InspoBoard from "./InspoBoard";
import AllergyWarning from "./AllergyWarning";
import { RefreshCw, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import type { NailMaterial, NailShape, NailLength } from "@/lib/types";

interface NailBookingStepsProps {
  /** Currently selected service */
  serviceCategory?: string | null;
  serviceMaterialType?: NailMaterial | null;
  /** Currently authenticated user ID */
  customerId: string | null;
  /** Staff ID for tier pricing */
  staffId?: string | null;
  /** Salon ID for station availability */
  salonId?: string | null;
  /** Callback when nail options change */
  onNailOptionsChange?: (opts: NailOptions) => void;
}

export interface NailOptions {
  material: NailMaterial | null;
  shape: NailShape | null;
  length: NailLength | null;
  inspoImages: File[];
  inspoImageIds: string[];
}

interface RepeatLastData {
  shape: NailShape | null;
  length: NailLength | null;
  material: NailMaterial | null;
  style: string | null;
  image_url: string | null;
}

interface StationInfo {
  available: number;
  used: number;
  total: number;
}

export default function NailBookingSteps({
  serviceCategory,
  serviceMaterialType,
  customerId,
  staffId,
  salonId,
  onNailOptionsChange,
}: NailBookingStepsProps) {
  const locale = useLocale();
  const t = useTranslations("booking") as any;
  const [material, setMaterial] = useState<NailMaterial | null>(serviceMaterialType ?? null);
  const [shape, setShape] = useState<NailShape | null>(null);
  const [length, setLength] = useState<NailLength | null>(null);
  const [inspoImages, setInspoImages] = useState<File[]>([]);
  const [inspoImageIds, setInspoImageIds] = useState<string[]>([]);
  const [boardOpen, setBoardOpen] = useState(false);
  const [repeatLast, setRepeatLast] = useState<RepeatLastData | null>(null);
  const [stationInfo, setStationInfo] = useState<StationInfo | null>(null);
  const [tierLabel, setTierLabel] = useState<string | null>(null);
  const [tierPrice, setTierPrice] = useState<number | null>(null);

  // Notify parent of changes
  useEffect(() => {
    onNailOptionsChange?.({ material, shape, length, inspoImages, inspoImageIds });
  }, [material, shape, length, inspoImages, inspoImageIds, onNailOptionsChange]);

  // Fetch repeat-last data
  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    fetch(`/api/clients/${customerId}/repeat-last`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.design) setRepeatLast(d.design); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [customerId]);

  // Fetch station availability
  useEffect(() => {
    if (!salonId) return;
    let cancelled = false;
    fetch(`/api/salon/stations?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.station) setStationInfo({ available: d.station.total_stations - 0, used: 0, total: d.station.total_stations }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [salonId]);

  const handleRepeatLast = useCallback(() => {
    if (!repeatLast) return;
    if (repeatLast.material) setMaterial(repeatLast.material);
    if (repeatLast.shape) setShape(repeatLast.shape);
    if (repeatLast.length) setLength(repeatLast.length);
  }, [repeatLast]);

  const handleBoardSelect = useCallback((ids: string[]) => {
    setInspoImageIds(ids);
  }, []);

  // Only show for nail services
  if (serviceCategory !== "nails") return null;

  return (
    <div className="space-y-4 py-4 border-t border-b border-s-ink/5 dark:border-s-dm-text/10">
      <p className="text-xs uppercase tracking-wider text-s-ink/40 dark:text-s-dm-text/40 font-medium">
        {t("nail_options")}
      </p>

      {/* Material selector */}
      {serviceMaterialType ? (
        <div className="flex items-center gap-2 text-sm text-s-ink/60 dark:text-s-dm-text/60">
          <span>{t("nail_material_label")}: <strong className="text-s-ink dark:text-s-dm-text">{serviceMaterialType}</strong></span>
        </div>
      ) : (
        <MaterialSelector value={material} onChange={setMaterial} />
      )}

      {/* Shape + Length */}
      <ShapeLengthPicker
        shape={shape}
        length={length}
        onShapeChange={setShape}
        onLengthChange={setLength}
      />

      {/* Repeat last design */}
      {repeatLast && (
        <button
          type="button"
          onClick={handleRepeatLast}
          className="flex items-center gap-2 w-full p-3 rounded-[16px] border border-s-ink/10 dark:border-s-dm-text/10 bg-[--raised] dark:bg-s-dm-surface text-left hover:border-s-coral/20 transition-colors duration-150"
        >
          <RefreshCw size={16} className="text-s-coral shrink-0" />
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("nail_repeat_last")}</p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
              {[repeatLast.style, repeatLast.shape, repeatLast.material].filter(Boolean).join(" · ")}
            </p>
          </div>
        </button>
      )}

      {/* Inspo upload */}
      <InspoUploader
        onImagesChange={setInspoImages}
        onOpenBoard={() => setBoardOpen(true)}
      />

      <InspoBoard
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        onSelect={handleBoardSelect}
      />

      {/* Allergy warning */}
      <AllergyWarning customerId={customerId} />

      {/* Tier pricing display */}
      {tierLabel && tierPrice != null && (
        <div className="flex items-center justify-between p-3 rounded-[16px] bg-s-bg-surface dark:bg-s-dm-bg">
          <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">
            {tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1)} {t("nail_artist")}
          </span>
          <span className="data-text font-medium text-s-ink dark:text-s-dm-text">
            {formatCurrency(tierPrice / 100, locale)}
          </span>
        </div>
      )}

      {/* Station availability */}
      {stationInfo && stationInfo.total > 0 && (
        <div className="flex items-center gap-2 text-xs text-s-ink/50 dark:text-s-dm-text/50">
          <Users size={12} />
          {t("nail_stations_available", { available: stationInfo.available, total: stationInfo.total })}
        </div>
      )}
    </div>
  );
}
