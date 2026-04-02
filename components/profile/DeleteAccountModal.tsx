"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import GlassModal from "@/components/ui/GlassModal";
import Spinner from "@/components/ui/Spinner";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Profile") as any;

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.trim().toUpperCase() === "DELETE MY ACCOUNT";

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to delete account");
        return;
      }

      // Redirect to login after successful deletion request
      router.push(`/${locale}/auth/login`);
    } catch (err) {
      console.error("[DeleteAccountModal] Error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError(null);
    onClose();
  };

  return (
    <GlassModal open={open} title={t("deleteAccount")} onClose={handleClose} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex gap-3 p-3 rounded-input bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-200">
            <p className="font-medium">{t("deleteAccountWarning")}</p>
            <p className="text-xs mt-1">{t("deleteAccountWarningDesc")}</p>
          </div>
        </div>

        {/* Active bookings message */}
        <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60">
          {t("deleteAccountActiveBookings")}
        </p>

        {/* Confirmation input */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">
            {t("deleteAccountConfirmLabel")}
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t("deleteAccountConfirmPlaceholder")}
            className="w-full px-3 py-2.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 transition-colors"
          />
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1">
            {t("deleteAccountHint")}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-input bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* 30-day grace period info */}
        <div className="p-3 rounded-input bg-s-ink/5 dark:bg-white/5 border border-s-ink/10 dark:border-white/10">
          <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60">
            {t("deleteAccount30Days")}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-pill border border-s-ink/10 dark:border-white/10 text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-ink/30 hover:text-s-ink dark:hover:border-white/30 dark:hover:text-s-dm-text active:scale-[0.98] transition-[transform,border-color,color] duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="flex-1 py-2.5 rounded-pill active:scale-[0.98] bg-red-600 text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" invert />}
            {t("deleteAccountConfirm")}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
