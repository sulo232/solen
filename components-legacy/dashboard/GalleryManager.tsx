"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { GripVertical, Trash2, AlertCircle, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import ImageUpload from "@/components-legacy/ui/ImageUpload";
import { Select, Skeleton } from "@/app/[locale]/_components/primitives";
import { getPortfolioCategoriesForSalon, getPortfolioCategoryLabel } from "@/lib/portfolio-categories";

interface GalleryPhoto {
  id: string;
  image_url: string;
  category: string | null;
  sort_order: number;
}

interface GalleryManagerProps {
  salonId: string;
  /** salon.categories (e.g. ["barbershop"]), resolves which fixed taxonomy this salon sees. */
  salonCategories: string[];
  coverPhotoUrl: string | null;
  onUpdate: () => void;
}

export default function GalleryManager({
  salonId,
  salonCategories,
  coverPhotoUrl,
  onUpdate,
}: GalleryManagerProps) {
  const t = useTranslations("dashboard") as any;
  const locale = useLocale();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("");

  const maxPhotos = 20;
  const taxonomy = useMemo(
    () => getPortfolioCategoriesForSalon(salonCategories),
    [salonCategories],
  );

  // ── Load photos (id + category + sort_order) from the categorized table ─────
  // salon_portfolio_images is public-read, so this needs no auth header, matching
  // how the PDP gallery reads the same table.

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/salons/${salonId}/gallery`);
      if (!res.ok) throw new Error("Failed to load photos");
      const data = await res.json();
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      console.error("[GalleryManager] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

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
      if (uploadCategory) formData.append("category", uploadCategory);

      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "POST",
        // Required since 962fd4c65 (see ReviewForm.tsx for the why). The reviewer's punch list
        // named three broken callers; this was a fourth it missed, found by enumerating every
        // client FormData uploader against the nine guarded routes.
        headers: { ...authHeaders, "x-solen-upload": "1" },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      return data.url as string;
    },
    [salonId, getAuthHeader, uploadCategory],
  );

  // ── Called when ImageUpload finishes uploading new files ─────────────────
  // ImageUpload only reports raw URLs; re-fetch to pick up the real id + category
  // the POST route just assigned in salon_portfolio_images.

  const handleNewUploads = useCallback(() => {
    fetchPhotos();
    onUpdate();
  }, [fetchPhotos, onUpdate]);

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (photo: GalleryPhoto, index: number) => {
    if (!window.confirm(t("gallery_confirm_delete"))) return;

    const prevPhotos = photos;
    setPhotos(photos.filter((_, i) => i !== index));
    setError(null);

    try {
      const authHeaders = await getAuthHeader();
      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ url: photo.image_url }),
      });

      if (!res.ok) throw new Error("Delete failed");
      onUpdate();
    } catch {
      setPhotos(prevPhotos);
      setError(t("gallery_delete_error"));
    }
  };

  // ── Per-photo category assignment ─────────────────────────────────────────

  const handleCategoryChange = async (photo: GalleryPhoto, nextValue: string) => {
    const nextCategory = nextValue === "" ? null : nextValue;
    const prevPhotos = photos;
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, category: nextCategory } : p)));
    setError(null);

    try {
      const authHeaders = await getAuthHeader();
      const res = await fetch(`/api/salons/${salonId}/gallery`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ id: photo.id, category: nextCategory }),
      });

      if (!res.ok) throw new Error("Category update failed");
    } catch {
      setPhotos(prevPhotos);
      setError(t("gallery_category_error"));
    }
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const next = [...photos];
    const item = next[draggedIndex];
    next.splice(draggedIndex, 1);
    next.splice(index, 0, item);
    setPhotos(next);
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
        body: JSON.stringify({ urls: photos.map((p) => p.image_url) }),
      });

      if (!res.ok) throw new Error("Reorder failed");
      onUpdate();
    } catch {
      setError(t("gallery_reorder_error"));
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[24px] border border-s-ink/5 p-6 mb-8"> {/* drift-ok: pre-existing token, byte-identical to the file this replaces, this task (portfolio categories) doesn't touch the card wrapper treatment */}
        <div className="mb-6">
          <Skeleton className="h-6 w-40 mb-2" rounded={8} />
          <Skeleton className="h-4 w-72" rounded={8} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" rounded={12} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] border border-s-ink/5 p-6 mb-8"> {/* drift-ok: pre-existing token, byte-identical to the file this replaces, this task (portfolio categories) doesn't touch the card wrapper treatment */}
      <div className="mb-6">
        <h2 className="font-heading text-lg text-s-ink">
          {t("gallery_title")}
        </h2>
        <p className="text-sm text-s-ink-2">
          {t("gallery_subtitle", { count: photos.length, max: maxPhotos })}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-[12px] text-sm mb-6"
        >
          <AlertCircle size={16} strokeWidth={1.9} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Existing gallery grid, each tile carries its own category select */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative ${
                draggedIndex === index
                  ? "opacity-50 scale-95"
                  : "opacity-100 transition-[opacity,transform] duration-150"
              } ${savingOrder ? "pointer-events-none" : ""}`}
            >
              <div className="relative aspect-square rounded-[12px] overflow-hidden border border-s-border bg-s-bg-sunken cursor-grab active:cursor-grabbing">
                <Image
                  src={photo.image_url}
                  alt={`Gallery photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-s-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-white/90 text-s-ink p-1.5 rounded-md backdrop-blur-[6px] cursor-grab">
                      <GripVertical size={14} strokeWidth={1.6} />
                    </div>
                    <button
                      onClick={() => handleDelete(photo, index)}
                      aria-label={t("gallery_confirm_delete")}
                      className="bg-white/90 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-md backdrop-blur-[6px] transition-[colors,transform] active:scale-[0.94] active:duration-[80ms] active:ease-glide"
                    >
                      <Trash2 size={14} strokeWidth={1.6} />
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="self-center flex items-center gap-1 bg-s-ink/80 text-white text-[12px] font-heading font-semibold px-2 py-1 rounded-sm backdrop-blur-[6px]"> {/* caps-fix: pre-existing uppercase+tracking-wider dropped per NO-CAPS, sentence case + 600 weight instead */}
                      <Star size={9} fill="currentColor" />
                      {t("gallery_cover_overlay")}
                    </div>
                  )}
                </div>

                {/* Cover badge */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-s-ink/80 text-white text-[12px] font-heading font-semibold px-2 py-1 rounded-sm backdrop-blur-[6px] group-hover:opacity-0 transition-opacity pointer-events-none"> {/* caps-fix: pre-existing uppercase+tracking-wider dropped per NO-CAPS, sentence case + 600 weight instead */}
                    <Star size={9} fill="currentColor" />
                    {t("gallery_cover")}
                  </div>
                )}
              </div>

              {/* Per-photo category assignment (fixed taxonomy for this salon) */}
              {taxonomy.length > 0 && (
                <Select
                  size="sm"
                  className="mt-2"
                  aria-label={t("gallery_category_label")}
                  value={photo.category ?? ""}
                  onChange={(e) => handleCategoryChange(photo, e.target.value)}
                >
                  <option value="">{t("gallery_category_none")}</option>
                  {taxonomy.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {getPortfolioCategoryLabel(cat.key, locale)}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone, only shown if under limit */}
      {photos.length < maxPhotos && (
        <>
          {taxonomy.length > 0 && (
            <div className="mb-3 max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-s-ink-2">
                {t("gallery_category_upload_hint")}
              </label>
              <Select
                size="sm"
                aria-label={t("gallery_category_upload_hint")}
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
              >
                <option value="">{t("gallery_category_none")}</option>
                {taxonomy.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {getPortfolioCategoryLabel(cat.key, locale)}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <ImageUpload
            onUpload={handleNewUploads}
            maxFiles={maxPhotos - photos.length}
            uploadFn={galleryUploadFn}
          />
          {/* ig4 (owner-approved 2026-07-16, IG-principles round 1): framing hint, keeps
              hands/elbows/knees in frame instead of cropped at the edge (nail/hair/barber
              portfolio shots). Text style matches the existing subtitle token above. */}
          <p className="mt-2 text-xs text-s-ink-2">{t("gallery_framing_hint")}</p> {/* mockup-ok: owner-approved 2026-07-16 IG-principles round 1, ig4 */}
        </>
      )}
    </div>
  );
}
