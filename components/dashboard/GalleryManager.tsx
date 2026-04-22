"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { GripVertical, Trash2, AlertCircle, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import ImageUpload from "@/components/ui/ImageUpload";

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
  const [urls, setUrls] = useState<string[]>(
    Array.isArray(galleryUrls) ? galleryUrls : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const maxPhotos = 20;

  // ── Auth helper ──────────────────────────────────────────────────────────

  const getAuthHeader = useCallback(async (): Promise<HeadersInit> => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }, []);

  // ── Upload via gallery API (keeps auth + DB update server-side) ──────────

  const galleryUploadFn = useCallback(
    async (file: File): Promise<string> => {
      const authHeaders = await getAuthHeader();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      return data.url as string;
    },
    [salonId, getAuthHeader],
  );

  // ── Called when ImageUpload finishes uploading new files ─────────────────

  const handleNewUploads = useCallback(
    (newUrls: string[]) => {
      setUrls((prev) => {
        const combined = [...prev, ...newUrls.filter((u) => !prev.includes(u))];
        return combined;
      });
      onUpdate();
    },
    [onUpdate],
  );

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (url: string, index: number) => {
    if (!window.confirm(t("gallery_confirm_delete"))) return;

    const prevUrls = [...urls];
    setUrls(urls.filter((_, i) => i !== index));
    setError(null);

    try {
      const authHeaders = await getAuthHeader();
      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error("Delete failed");
      onUpdate();
    } catch {
      setUrls(prevUrls);
      setError(t("gallery_delete_error"));
    }
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newUrls = [...urls];
    const item = newUrls[draggedIndex];
    newUrls.splice(draggedIndex, 1);
    newUrls.splice(index, 0, item);
    setUrls(newUrls);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    setSavingOrder(true);
    try {
      const authHeaders = await getAuthHeader();
      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) throw new Error("Reorder failed");
      onUpdate();
    } catch {
      setError(t("gallery_reorder_error"));
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="bg-white dark:bg-s-dm-surface rounded-[24px] border border-s-ink/5 dark:border-white/5 p-6 mb-8">
      <div className="mb-6">
        <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">
          {t("gallery_title")}
        </h2>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">
          {t("gallery_subtitle", { count: urls.length, max: maxPhotos })}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-[12px] text-sm mb-6"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Existing gallery grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square rounded-[12px] overflow-hidden border border-s-ink/10 dark:border-white/10 bg-s-bg-sunken dark:bg-s-dm-surface cursor-grab active:cursor-grabbing ${
                draggedIndex === index
                  ? "opacity-50 scale-95"
                  : "opacity-100 transition-[opacity,transform] duration-150"
              } ${savingOrder ? "pointer-events-none" : ""}`}
            >
              <Image
                src={url}
                alt={`Gallery photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-s-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <div className="bg-white/90 dark:bg-black/90 text-s-ink dark:text-s-dm-text p-1.5 rounded-md backdrop-blur-[6px] cursor-grab">
                    <GripVertical size={14} />
                  </div>
                  <button
                    onClick={() => handleDelete(url, index)}
                    aria-label={t("gallery_confirm_delete")}
                    className="bg-white/90 dark:bg-black/90 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-md backdrop-blur-[6px] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {index === 0 && (
                  <div className="self-center flex items-center gap-1 bg-s-ink/80 text-white text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-1 rounded-sm backdrop-blur-[6px]">
                    <Star size={9} fill="currentColor" />
                    {t("gallery_cover_overlay")}
                  </div>
                )}
              </div>

              {/* Cover badge */}
              {index === 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-s-ink/80 text-white text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-1 rounded-sm backdrop-blur-[6px] group-hover:opacity-0 transition-opacity pointer-events-none">
                  <Star size={9} fill="currentColor" />
                  {t("gallery_cover")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone — only shown if under limit */}
      {urls.length < maxPhotos && (
        <ImageUpload
          onUpload={handleNewUploads}
          maxFiles={maxPhotos - urls.length}
          uploadFn={galleryUploadFn}
        />
      )}
    </div>
  );
}
