"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, GripVertical, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface GalleryManagerProps {
  salonId: string;
  galleryUrls: string[];
  coverPhotoUrl: string | null;
  onUpdate: () => void;
}

export default function GalleryManager({
  salonId,
  galleryUrls,
  coverPhotoUrl,
  onUpdate,
}: GalleryManagerProps) {
  const t = useTranslations("dashboard") as any;
  const [urls, setUrls] = useState<string[]>(Array.isArray(galleryUrls) ? galleryUrls : []);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxPhotos = 20;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (urls.length >= maxPhotos) {
      setError(t("gallery_max_error", { max: maxPhotos }));
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setUrls((prev) => [...prev, data.url]);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (url: string, index: number) => {
    if (!window.confirm(t("gallery_confirm_delete"))) return;

    const prevUrls = [...urls];
    setUrls(urls.filter((_, i) => i !== index));

    try {
      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error("Delete failed");
      onUpdate();
    } catch {
      setUrls(prevUrls);
      setError(t("gallery_delete_error"));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newUrls = [...urls];
    const draggedItem = newUrls[draggedIndex];
    newUrls.splice(draggedIndex, 1);
    newUrls.splice(index, 0, draggedItem);
    setUrls(newUrls);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    try {
      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) throw new Error("Reorder failed");
      onUpdate();
    } catch {
      setError(t("gallery_reorder_error"));
    }
  };

  return (
    <div className="bg-white dark:bg-s-dm-surface rounded-[24px] border border-s-ink/5 dark:border-white/5 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">
            {t("gallery_title")}
          </h2>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">
            {t("gallery_subtitle", { count: urls.length, max: maxPhotos })}
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isUploading || urls.length >= maxPhotos}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || urls.length >= maxPhotos}
          aria-label={t("gallery_upload")}
          className="flex items-center gap-2 bg-s-coral text-white px-4 py-2 rounded-pill font-semibold text-sm hover:brightness-[1.06] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          <span className="hidden sm:inline">{t("gallery_upload")}</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-[12px] text-sm mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {urls.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-s-ink/10 dark:border-white/10 rounded-[12px]">
          <div className="w-12 h-12 bg-s-coral/10 text-s-coral rounded-full flex items-center justify-center mx-auto mb-3">
            <Plus size={24} />
          </div>
          <h3 className="font-heading font-semibold text-s-ink dark:text-s-dm-text mb-1">
            {t("gallery_empty_title")}
          </h3>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 max-w-[250px] mx-auto">
            {t("gallery_empty_desc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-[4/3] rounded-[12px] overflow-hidden border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-surface cursor-grab active:cursor-grabbing ${
                draggedIndex === index ? "opacity-50 scale-95" : "opacity-100 transition-all"
              }`}
            >
              <Image
                src={url}
                alt={`Gallery photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-s-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <div className="bg-white/90 dark:bg-black/90 text-s-ink dark:text-s-dm-text p-1.5 rounded-md backdrop-blur-sm cursor-grab">
                    <GripVertical size={14} />
                  </div>
                  <button
                    onClick={() => handleDelete(url, index)}
                    aria-label={t("gallery_confirm_delete")}
                    className="bg-white/90 dark:bg-black/90 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-md backdrop-blur-sm transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {index === 0 && (
                  <div className="self-center bg-s-ink/80 text-white text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-1 rounded-sm backdrop-blur-sm">
                    {t("gallery_cover_overlay")}
                  </div>
                )}
              </div>

              {/* Permanent cover badge */}
              {index === 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-s-ink/80 text-white text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-1 rounded-sm backdrop-blur-sm group-hover:opacity-0 transition-opacity pointer-events-none">
                  {t("gallery_cover")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
