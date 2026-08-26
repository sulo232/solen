"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Spinner from "@/components-legacy/ui/Spinner";
import { Skeleton } from "@/app/[locale]/_components/primitives";
import EmptyState from "@/components-legacy/ui/EmptyState";

interface ClientPhoto {
  id: string;
  photo_url: string;
  photo_type: "before" | "after" | "progress";
  created_at: string;
}

interface ClientPhotosTabProps {
  customerId: string;
}

export default function ClientPhotosTab({ customerId }: ClientPhotosTabProps) {
  const t = useTranslations("dashboard.clientPhotosTab");
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<"before" | "after" | "progress">("progress");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/clients/${customerId}/photos`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d) setPhotos(d.items ?? []); })
      .catch((err) => console.error("[ClientPhotosTab] failed to load client photos:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("photo_type", photoType);
      const res = await fetch(`/api/clients/${customerId}/photos`, {
        method: "POST",
        // Required since 962fd4c65 (see ReviewForm.tsx for the why). Without it every client
        // before/after photo upload from the dashboard 403s.
        headers: { "x-solen-upload": "1" },
        body: formData,
      });
      if (res.ok) {
        const { data } = await res.json();
        setPhotos((prev) => [data, ...prev]);
      }
    } catch { /* ignore */ } finally {
      setUploading(false);
    }
  };

  const typeLabel = (type: string) => type === "before" ? t("before") : type === "after" ? t("after") : t("progress");

  // Group photos into before/after pairs by date
  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");
  const progressPhotos = photos.filter((p) => p.photo_type === "progress");

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" rounded={8} />
        <Skeleton className="h-6 w-24" rounded={16} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} aspect="square" rounded={16} />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm text-s-ink flex items-center gap-2">
          <Camera size={14} strokeWidth={1.6} className="text-s-coral" /> {t("photos")}
        </h3>
        <div className="flex items-center gap-2">
          <select value={photoType} onChange={(e) => setPhotoType(e.target.value as "before" | "after" | "progress")}
            className="px-2 py-1 text-xs text-s-ink focus:outline-none"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            <option value="before">{t("before")}</option>
            <option value="after">{t("after")}</option>
            <option value="progress">{t("progress")}</option>
          </select>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors disabled:opacity-50">
            {uploading ? <Spinner size="sm" /> : <Upload size={12} />} {t("upload")}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        </div>
      </div>

      {/* Before/After pairs */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="mb-4">
          <p className="text-xs font-medium text-s-ink-2 mb-2">{t("beforeAfter")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-[12px] text-s-ink/30 uppercase tracking-wider">{t("before")}</p>
              {beforePhotos.map((p) => (
                <div key={p.id} className="relative aspect-[3/4] rounded-[16px] overflow-hidden border border-s-ink/5">
                  <Image src={p.photo_url} alt={t("before")} fill sizes="(max-width: 768px) 50vw, 200px" className="object-cover" />
                  <span className="absolute bottom-1 left-1 text-[12px] bg-s-ink/60 text-white px-1.5 py-0.5 rounded">
                    {new Date(p.created_at).toLocaleDateString("de-CH")}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[12px] text-s-ink/30 uppercase tracking-wider">{t("after")}</p>
              {afterPhotos.map((p) => (
                <div key={p.id} className="relative aspect-[3/4] rounded-[16px] overflow-hidden border border-s-ink/5">
                  <Image src={p.photo_url} alt={t("after")} fill sizes="(max-width: 768px) 50vw, 200px" className="object-cover" />
                  <span className="absolute bottom-1 left-1 text-[12px] bg-s-ink/60 text-white px-1.5 py-0.5 rounded">
                    {new Date(p.created_at).toLocaleDateString("de-CH")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress photos */}
      {progressPhotos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-s-ink-2 mb-2">{t("progress")}</p>
          <div className="grid grid-cols-3 gap-2">
            {progressPhotos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-[16px] overflow-hidden border border-s-ink/5">
                <Image src={p.photo_url} alt={t("progress")} fill sizes="(max-width: 768px) 33vw, 150px" className="object-cover" />
                <span className="absolute bottom-1 left-1 text-[12px] bg-s-ink/60 text-white px-1.5 py-0.5 rounded">
                  {new Date(p.created_at).toLocaleDateString("de-CH")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title={t("emptyTitle")}
          message={t("emptyMessage")}
          className="py-6"
        />
      )}
    </div>
  );
}
