"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Bookmark } from "lucide-react";

interface PhotoGalleryProps {
  conversationId: string;
  isSalonOwner?: boolean;
  isNailSalon?: boolean;
  onCreateOffer?: (photoUrl: string) => void;
}

interface PhotoMessage {
  id: string;
  content: string;
  image_url: string;
  created_at: string;
  sender_id: string;
}

export default function PhotoGallery({ conversationId, isSalonOwner, isNailSalon, onCreateOffer }: PhotoGalleryProps) {
  const tc = useTranslations("common");
  const [photos, setPhotos] = useState<PhotoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages?limit=200`)
      .then((r) => r.json())
      .then((d) => {
        const msgs = (d.messages ?? []) as PhotoMessage[];
        setPhotos(msgs.filter((m: { message_type?: string; image_url?: string | null }) => m.message_type === "image" && m.image_url));
      })
      .catch((err) => console.error("[PhotoGallery] failed to fetch conversation photos:", err))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-s-ink/30 text-sm">Lade Fotos…</div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-s-ink/30">
        <p className="text-sm">Noch keine Fotos geteilt</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 p-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setLightboxUrl(photo.image_url)}
            className="aspect-square rounded-[12px] overflow-hidden bg-s-bg-sunken dark:bg-s-dm-surface hover:brightness-[0.95] transition-[filter] duration-150"
          >
            <Image
              src={photo.image_url}
              alt="Geteiltes Foto"
              width={150}
              height={150}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-60 bg-s-ink/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg max-h-[80vh] relative">
            <Image
              src={lightboxUrl}
              alt="Foto Vollbild"
              width={600}
              height={600}
              className="rounded-[12px] object-contain max-h-[80vh]"
            />
            {isSalonOwner && onCreateOffer && (
              <button
                onClick={() => { onCreateOffer(lightboxUrl); setLightboxUrl(null); }}
                className="mt-3 w-full py-2.5 rounded-btn active:scale-[0.97] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] duration-150"
              >
                Angebot erstellen
              </button>
            )}
            {!isSalonOwner && isNailSalon && (
              <button
                disabled={saving || saved.has(lightboxUrl)}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const res = await fetch("/api/nail-inspo/images", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ image_url: lightboxUrl, source_url: lightboxUrl }),
                    });
                    if (res.ok) setSaved((prev) => new Set(prev).add(lightboxUrl!));
                  } catch {}
                  setSaving(false);
                }}
                className="mt-3 w-full py-2.5 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text text-sm font-medium hover:bg-s-bg-surface dark:hover:bg-s-dm-bg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Bookmark size={14} />
                {saved.has(lightboxUrl) ? tc("savedLabel") : saving ? tc("savingToBoard") : tc("savedToBoard")}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
