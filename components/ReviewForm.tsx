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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Fehler beim Speichern");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
