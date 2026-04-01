'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, X } from 'lucide-react';

interface ReviewPromptProps {
  bookingId: string;
  salonId: string;
  salonName: string;
  onDismiss?: () => void;
}

export default function ReviewPrompt({
  bookingId,
  salonId,
  salonName,
  onDismiss,
}: ReviewPromptProps) {
  const t = useTranslations('reviewPrompt');
  const [isVisible, setIsVisible] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setSubmitError(t('selectRating'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          salon_id: salonId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Success: hide card and call callback
      setIsVisible(false);
      onDismiss?.();
    } catch (err) {
      console.error('[ReviewPrompt] Failed to submit review:', err);
      setSubmitError(t('submitFailed'));
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm bg-[--raised] dark:bg-s-dm-surface rounded-card border border-s-ink/[0.06] dark:border-white/[0.08] shadow-elevation-3 p-6 animate-[slideUp_0.3s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-prompt-title"
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 hover:bg-s-ink/[0.05] dark:hover:bg-white/[0.08] rounded-pill transition-colors"
        aria-label={t('close')}
      >
        <X size={20} className="text-s-ink dark:text-s-dm-text" />
      </button>

      {/* Title */}
      <h3
        id="review-prompt-title"
        className="font-heading text-lg font-semibold text-s-ink dark:text-s-dm-text mb-2"
      >
        {t('title')}
      </h3>

      {/* Salon name */}
      <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-4">
        {salonName}
      </p>

      {/* Star rating */}
      <div className="mb-4">
        <label className="block text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-2">
          {t('selectRating')}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => {
                setRating(star);
                setSubmitError(null);
              }}
              className="p-1 transition-transform duration-150 hover:scale-110"
              aria-label={`${star} stars`}
            >
              <Star
                size={28}
                className={
                  star <= rating
                    ? 'fill-s-coral text-s-coral'
                    : 'text-s-ink/20 dark:text-s-dm-text/20'
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment textarea */}
      <div className="mb-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          placeholder={t('commentPlaceholder')}
          maxLength={500}
          className="w-full px-3 py-2 rounded-input border border-s-ink/[0.06] dark:border-white/[0.08] bg-[--base] dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text placeholder:text-s-ink/40 dark:placeholder:text-s-dm-text/40 focus:outline-none focus:ring-2 focus:ring-s-coral/50 dark:focus:ring-s-coral/30 font-body text-sm resize-none"
          rows={3}
        />
        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-1">
          {comment.length}/500
        </p>
      </div>

      {/* Error message */}
      {submitError && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          {submitError}
        </p>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full px-4 py-2 rounded-btn bg-s-coral text-white font-semibold text-sm hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? `${t('submit')}...` : t('submit')}
      </button>
    </div>
  );
}
