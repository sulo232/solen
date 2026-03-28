"use client";

import { useState } from "react";
import { Camera, X, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface FormulaPhotoUploadProps {
  formulaId: string;
  beforeUrl?: string | null;
  afterUrl?: string | null;
  onSaved?: (beforeUrl: string | null, afterUrl: string | null) => void;
}

export default function FormulaPhotoUpload({
  formulaId,
  beforeUrl,
  afterUrl,
  onSaved,
}: FormulaPhotoUploadProps) {
  const t = useTranslations("dashboardCoiffeur") as any;
  const [before, setBefore] = useState<string | null>(beforeUrl ?? null);
  const [after, setAfter] = useState<string | null>(afterUrl ?? null);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);

  const handleUpload = async (type: "before" | "after", file: File) => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("formula_id", formulaId);
      formData.append("type", type);

      const res = await fetch("/api/dashboard/coiffeur/formula-photo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        if (type === "before") {
          setBefore(url);
          onSaved?.(url, after);
        } else {
          setAfter(url);
          onSaved?.(before, url);
        }
      }
    } finally {
      setUploading(null);
    }
  };

  const PhotoSlot = ({ type, url }: { type: "before" | "after"; url: string | null }) => (
    <div className="flex-1">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/35 dark:text-s-dm-text/35 mb-1.5">
        {type === "before" ? t("photoBefore") : t("photoAfter")}
      </p>
      <label className={`relative block aspect-[3/4] rounded-[8px] overflow-hidden border-2 border-dashed cursor-pointer transition-colors ${
        url ? "border-transparent" : "border-s-ink/[0.12] dark:border-s-dm-text/[0.12] hover:border-s-coral/40"
      }`}>
        {url ? (
          <>
            <Image src={url} alt={type} fill className="object-cover" sizes="120px" />
            <button
              onClick={(e) => {
                e.preventDefault();
                if (type === "before") { setBefore(null); onSaved?.(null, after); }
                else { setAfter(null); onSaved?.(before, null); }
              }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-s-ink/60 flex items-center justify-center"
              aria-label={t("photoRemove")}
            >
              <X size={10} className="text-white" />
            </button>
          </>
        ) : uploading === type ? (
          <div className="absolute inset-0 flex items-center justify-center bg-s-ink/[0.04]">
            <Upload size={16} className="text-s-ink/30 dark:text-s-dm-text/30 animate-bounce" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Camera size={16} className="text-s-ink/25 dark:text-s-dm-text/25" />
            <span className="text-[9px] text-s-ink/30 dark:text-s-dm-text/30">{t("photoAdd")}</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(type, f); }}
        />
      </label>
    </div>
  );

  return (
    <div className="flex gap-3 mt-3">
      <PhotoSlot type="before" url={before} />
      <PhotoSlot type="after" url={after} />
    </div>
  );
}
