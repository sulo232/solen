"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface PhotoGalleryProps {
  conversationId: string;
  isSalonOwner?: boolean;
  onCreateOffer?: (photoUrl: string) => void;
}

interface PhotoMessage {
  id: string;
  content: string;
  image_url: string;
  created_at: string;
  sender_id: string;
}

export default function PhotoGallery({ conversationId, isSalonOwner, onCreateOffer }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages?limit=200`)
      .then((r) => r.json())
      .then((d) => {
        const msgs = (d.messages ?? []) as PhotoMessage[];
        setPhotos(msgs.filter((m: { message_type?: string; image_url?: string | null }) => m.message_type === "image" && m.image_url));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-dark/30 text-sm">Lade Fotos…</div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-dark/30">
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
            className="aspect-square rounded-lg overflow-hidden bg-s-bg-sunken dark:bg-gray-800 hover:opacity-90 transition-opacity"
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
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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
              className="rounded-lg object-contain max-h-[80vh]"
            />
            {isSalonOwner && onCreateOffer && (
              <button
                onClick={() => { onCreateOffer(lightboxUrl); setLightboxUrl(null); }}
                className="mt-3 w-full py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors"
              >
                Angebot erstellen
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
