"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

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
      .catch(() => {})
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

  const typeLabel = (t: string) => t === "before" ? "Vorher" : t === "after" ? "Nachher" : "Verlauf";

  // Group photos into before/after pairs by date
  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");
  const progressPhotos = photos.filter((p) => p.photo_type === "progress");

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-24 rounded-input" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-[16px]" />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2">
          <Camera size={14} className="text-s-coral" /> Fotos
        </h3>
        <div className="flex items-center gap-2">
          <select value={photoType} onChange={(e) => setPhotoType(e.target.value as "before" | "after" | "progress")}
            className="px-2 py-1 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-xs text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
            <option value="before">Vorher</option>
            <option value="after">Nachher</option>
            <option value="progress">Verlauf</option>
          </select>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors disabled:opacity-50">
            {uploading ? <Spinner size="sm" /> : <Upload size={12} />} Hochladen
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        </div>
      </div>

      {/* Before/After pairs */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="mb-4">
          <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Vorher / Nachher</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 uppercase tracking-wider">Vorher</p>
              {beforePhotos.map((p) => (
                <div key={p.id} className="relative rounded-[16px] overflow-hidden border border-s-ink/5 dark:border-white/5">
                  <img src={p.photo_url} alt="Vorher" className="w-full aspect-[3/4] object-cover" />
                  <span className="absolute bottom-1 left-1 text-[9px] bg-s-ink/60 text-white px-1.5 py-0.5 rounded">
                    {new Date(p.created_at).toLocaleDateString("de-CH")}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 uppercase tracking-wider">Nachher</p>
              {afterPhotos.map((p) => (
                <div key={p.id} className="relative rounded-[16px] overflow-hidden border border-s-ink/5 dark:border-white/5">
                  <img src={p.photo_url} alt="Nachher" className="w-full aspect-[3/4] object-cover" />
                  <span className="absolute bottom-1 left-1 text-[9px] bg-s-ink/60 text-white px-1.5 py-0.5 rounded">
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
          <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Verlauf</p>
          <div className="grid grid-cols-3 gap-2">
            {progressPhotos.map((p) => (
              <div key={p.id} className="relative rounded-[16px] overflow-hidden border border-s-ink/5 dark:border-white/5">
                <img src={p.photo_url} alt="Verlauf" className="w-full aspect-square object-cover" />
                <span className="absolute bottom-1 left-1 text-[9px] bg-s-ink/60 text-white px-1.5 py-0.5 rounded">
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
          title="Noch keine Fotos"
          message="Lade Vorher/Nachher-Fotos hoch, um den Verlauf zu dokumentieren."
          className="py-6"
        />
      )}
    </div>
  );
}
