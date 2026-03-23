"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface ReviewFormProps {
  salonId: string;
  bookingId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ReviewForm({ salonId, bookingId, onSuccess, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Bitte wähle eine Bewertung aus");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      let resData;
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Fehler beim Speichern");
      } else {
        resData = await res.json();
      }

      // Upload photos if any
      if (photos.length > 0 && resData?.data?.id) {
        setUploadProgress("Lade Fotos hoch...");
        const formData = new FormData();
        photos.forEach(p => formData.append("photos", p));
        
        await fetch(`/api/reviews/${resData.data.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-s-dm-surface rounded-card shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-s-ink/40 hover:text-s-ink transition-colors dark:text-s-dm-text/40 dark:hover:text-s-dm-text"
        >
          <X size={20} />
        </button>

        <h3 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-1">
          Bewertung schreiben
        </h3>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">
          Teile deine Erfahrung mit anderen Kunden.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    strokeWidth={1.5}
                    className={(hoverRating || rating) >= star
                      ? "fill-s-coral text-s-coral"
                      : "text-s-ink/20 dark:text-s-dm-text/20"}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 h-4">
              {rating > 0 ? `${rating} von 5 Sternen` : "Wähle eine Bewertung"}
            </p>
          </div>

          {/* Comment */}
          <div>
            <textarea
              placeholder="Wie war dein Besuch? (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-card border border-s-ink/10 dark:border-white/10 bg-white dark:bg-black/20 text-s-ink dark:text-s-dm-text text-sm focus:outline-none focus:border-s-coral resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
                {comment.length} / 500
              </span>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">
              Fotos hinzufügen (Optional, max. 3)
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded-card overflow-hidden border border-s-ink/10 dark:border-white/10 shrink-0">
                  <img src={URL.createObjectURL(p)} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors" title="Entfernen">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="w-16 h-16 flex items-center justify-center shrink-0 rounded-card border-2 border-dashed border-s-ink/20 dark:border-white/20 text-s-ink/40 dark:text-s-dm-text/40 hover:bg-s-ink/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <span className="text-xl">+</span>
                  <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="hidden" onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPhotos(prev => [...prev, ...files].slice(0, 3));
                  }} />
                </label>
              )}
            </div>
            {uploadProgress && <div className="text-xs font-medium text-s-coral">{uploadProgress}</div>}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-button">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 justify-center rounded-button border border-s-ink/10 dark:border-white/10 text-sm font-medium text-s-ink/60 dark:text-s-dm-text/60"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 py-3 flex justify-center items-center gap-2 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading && <Spinner size="sm" invert />}
              Senden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
