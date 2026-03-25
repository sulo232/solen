"use client";

import React, { useEffect, useState, memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar, Heart, Star, MapPin, X, RotateCcw,
  Settings, ChevronDown, ChevronUp, MessageCircle,
  Gift, Wallet, ChevronRight, Trophy, Share2, Copy, Check, Package, ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import GlassModal from "@/components/ui/GlassModal";
import EmptyState from "@/components/ui/EmptyState";
import RecentlyViewed from "@/components/RecentlyViewed";
import StampCard from "@/components/loyalty/StampCard";
import SolenExclusiveBadge from "@/components/ui/SolenExclusiveBadge";
import ProfileDiscoverySections from "@/components/discovery/ProfileDiscoverySections";
import { formatCurrency } from "@/lib/format-currency";
import type { Profile, Booking, SalonCard } from "@/lib/types";
import { ReportProblemButton } from "@/components/disputes/ReportProblemButton";

interface LoyaltyCard {
  id: string;
  salon_id: string;
  stamps_needed: number;
  reward_text: string;
  stamps_collected: number;
  salons: { name: string; slug: string; cover_photo_url: string | null };
}

// ─────────────────────────────────────────
// Cancel modal
// ─────────────────────────────────────────

const CancelModal = memo(function CancelModal({
  bookingId,
  salonName,
  startsAt,
  locale,
  onClose,
  onCancelled,
}: {
  bookingId: string;
  salonName: string;
  startsAt: string;
  locale: string;
  onClose: () => void;
  onCancelled: (id: string) => void;
}) {
  const t = useTranslations("Profile");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      onCancelled(bookingId);
      onClose();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const dateFmt = new Date(startsAt).toLocaleDateString(locale === "de" ? "de-CH" : locale, { weekday: "short", day: "numeric", month: "short" });
  const timeFmt = new Date(startsAt).toLocaleTimeString(locale === "de" ? "de-CH" : locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <GlassModal open title={t("cancelBooking")} onClose={onClose} maxWidth="max-w-md">
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-1">
          {salonName} — {dateFmt} {timeFmt}
        </p>
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-4">{t("cancelFreeHint")}</p>

        <div className="mb-5">
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">{t("reasonOptional")}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className="w-full px-4 py-3 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-s-bg-base dark:bg-s-dm-bg text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-bg-surface dark:hover:bg-white/5 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" invert />}
            {t("confirmCancel")}
          </button>
        </div>
    </GlassModal>
  );
});

// ─────────────────────────────────────────
// Referral section
// ─────────────────────────────────────────

const ReferralSection = memo(function ReferralSection({ locale }: { locale: string }) {
  const t = useTranslations("Profile");
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ friends_invited: 0, total_earned: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => {
        setCode(d.referral_code ?? null);
        setStats({ friends_invited: d.friends_invited ?? 0, total_earned: d.total_earned ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${locale}?ref=${code}` : "";

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = t("shareWhatsappMsg", { code: code ?? "", url: shareUrl });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareSMS = () => {
    const msg = t("shareSmsMsg", { code: code ?? "", url: shareUrl });
    window.open(`sms:?body=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] bg-white dark:bg-s-dm-surface p-5"><Spinner size="sm" /></div>;

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] bg-white dark:bg-s-dm-surface p-5 space-y-4">
      {/* Eyebrow header */}
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 dark:text-s-dm-text/35">
        Freunde einladen
      </p>

      {/* Referral invite banner */}
      <div className="flex items-center gap-3 p-3 rounded-[10px]"
        style={{ background: "rgba(232,98,74,.06)", border: "1px solid rgba(232,98,74,.15)" }}>
        <Gift className="w-5 h-5 text-s-coral shrink-0" />
        <div>
          <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{t("inviteFriends")}</p>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{t("bothGetCredit")}</p>
        </div>
      </div>

      {/* Code display */}
      {code && (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-s-bg-base dark:bg-s-dm-bg"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", letterSpacing: ".12em", color: "var(--s-ink)" }}>
            {code}
          </div>
          <button
            onClick={copyCode}
            aria-label={t("copyCode")}
            className={`w-10 h-10 rounded-[10px] border flex items-center justify-center transition-all ${
              copied
                ? "border-[#4CAF6F] bg-[#4CAF6F]/10"
                : "border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-coral/40"
            }`}
          >
            {copied
              ? <Check size={15} className="text-[#4CAF6F]" />
              : <Copy size={15} className="text-s-ink/40 dark:text-s-dm-text/40" />}
          </button>
        </div>
      )}

      {/* Share buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex items-center justify-center gap-1.5 py-3 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.04em] text-white active:scale-[0.98] transition-all"
          style={{ background: "#25D366" }}
        >
          <Share2 size={12} /> WhatsApp
        </button>
        <button
          onClick={shareSMS}
          className="flex items-center justify-center gap-1.5 py-3 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.04em] text-white active:scale-[0.98] transition-all"
          style={{ background: "#0A84FF" }}
        >
          <MessageCircle size={12} /> SMS
        </button>
        <button
          onClick={copyCode}
          className="flex items-center justify-center gap-1.5 py-3 rounded-btn border border-s-ink/[0.08] dark:border-white/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.04em] text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral/40 hover:text-s-coral transition-colors"
        >
          <Copy size={12} /> {t("copyCode")}
        </button>
      </div>

      {/* Reward tracking */}
      <div className="flex items-center justify-between pt-3 border-t border-s-ink/[0.05] dark:border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Trophy size={13} className="text-s-amber" />
          <div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/35 dark:text-s-dm-text/35">
              Eingeladen
            </p>
            <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{stats.friends_invited}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/35 dark:text-s-dm-text/35">Verdient</p>
          <p className="font-heading font-bold text-sm text-s-coral">
            {formatCurrency(stats.total_earned / 100, locale)}
          </p>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────
// Booking card
// ─────────────────────────────────────────

type BookingWithDetails = Booking & { salon_name: string; service_name: string; salon_slug?: string };

// Status badges — semantic pill colours
const STATUS_BADGE_MAP: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: "rgba(76,175,111,.12)",  color: "#1f6535" },
  cancelled: { bg: "rgba(232,98,74,.10)",   color: "#7A2415" },
  completed: { bg: "rgba(26,18,9,.06)",     color: "rgba(26,18,9,.50)" },
  no_show:   { bg: "rgba(26,18,9,.04)",     color: "rgba(26,18,9,.30)" },
};

function hoursUntil(startsAt: string) {
  return (new Date(startsAt).getTime() - Date.now()) / 3_600_000;
}

const BookingCard = memo(function BookingCard({
  booking: b,
  locale,
  onCancel,
}: {
  booking: BookingWithDetails;
  locale: string;
  onCancel: (b: BookingWithDetails) => void;
}) {
  const t = useTranslations("Profile");
  const canCancel = b.status === "confirmed" && hoursUntil(b.starts_at) > 24;
  const tooLate = b.status === "confirmed" && hoursUntil(b.starts_at) <= 24 && hoursUntil(b.starts_at) > 0;

  const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    confirmed: { label: t("statusConfirmed"), ...STATUS_BADGE_MAP.confirmed },
    cancelled: { label: t("statusCancelled"), ...STATUS_BADGE_MAP.cancelled },
    completed: { label: t("statusCompleted"), ...STATUS_BADGE_MAP.completed },
    no_show:   { label: t("statusNoShow"),    ...STATUS_BADGE_MAP.no_show },
  };

  const localeFmt = locale === "de" ? "de-CH" : locale;

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4 bg-white dark:bg-s-dm-surface">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">{b.salon_name}</p>
          <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{b.service_name}</p>
          <p className="text-xs font-body text-s-ink/40 dark:text-s-dm-text/40 mt-1">
            {new Date(b.starts_at).toLocaleDateString(localeFmt, {
              weekday: "short", day: "numeric", month: "short",
            })}{" · "}
            {new Date(b.starts_at).toLocaleTimeString(localeFmt, { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {(() => {
          const badge = STATUS_BADGE[b.status];
          return (
            <span className="text-[9px] font-heading font-bold uppercase tracking-[.08em] px-2 py-1 rounded-[6px] shrink-0"
              style={{ background: badge?.bg, color: badge?.color }}>
              {badge?.label ?? b.status}
            </span>
          );
        })()}
      </div>

      {(b.status === "confirmed" || b.salon_slug) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-s-ink/[0.05] dark:border-white/[0.05]">
          {b.salon_slug && (
            <Link
              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&staff=${b.staff_member_id ?? ""}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-ink/[0.08] dark:border-white/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral hover:border-s-coral/40 transition-colors"
            >
              <RotateCcw size={12} />
              {t("rebookAction")}
            </Link>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(b)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-coral/25 text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-coral hover:bg-s-coral/[0.05] transition-colors"
            >
              <X size={12} />
              {t("cancelAction")}
            </button>
          )}

          {b.status === "completed" && (
            <ReportProblemButton bookingId={b.id} />
          )}

          {tooLate && (
            <div className="relative group inline-block">
              <button
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-white/[0.06] text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/20 dark:text-s-dm-text/20 cursor-not-allowed"
              >
                <X size={12} />
                {t("cancelAction")}
              </button>
              <div className="absolute bottom-full left-0 mb-2 w-48 rounded-[8px] px-3 py-2 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: "rgba(26,18,9,.92)" }}>
                <p className="text-[10px] font-heading text-white/80">{t("cancelTooLate")}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────
// Settings section
// ─────────────────────────────────────────

const INPUT_CLS = "w-full px-3 py-2.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20";

const SettingsSection = memo(function SettingsSection({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Partial<Profile>) => Promise<void>;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Profile");
  const tPrefs = useTranslations("booking.preferences");
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [birthday, setBirthday] = useState((profile as Profile & { birthday?: string }).birthday ?? "");
  const [emailOn, setEmailOn] = useState(profile.notification_email ?? true);
  const [lang, setLang] = useState<"de" | "en" | "fr" | "it">(profile.locale ?? "de");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Customer preferences
  const [allergies, setAllergies] = useState(profile.customer_preferences?.allergies || "");
  const [skinType, setSkinType] = useState(profile.customer_preferences?.skinType || "");
  const [stylistGender, setStylistGender] = useState<"male" | "female" | "no-preference">(
    profile.customer_preferences?.stylistGender || "no-preference"
  );
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(profile.customer_preferences?.accessibilityNeeds || "");
  const [prefLanguage, setPrefLanguage] = useState(profile.customer_preferences?.language || "");
  const [prefNotes, setPrefNotes] = useState(profile.customer_preferences?.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      display_name: name,
      bio: bio || null,
      avatar_url: avatar || null,
      birthday: birthday || null,
      notification_email: emailOn,
      locale: lang,
      customer_preferences: {
        allergies: allergies.trim() || undefined,
        skinType: skinType.trim() || undefined,
        stylistGender,
        accessibilityNeeds: accessibilityNeeds.trim() || undefined,
        language: prefLanguage.trim() || undefined,
        notes: prefNotes.trim() || undefined,
      },
    } as Partial<Profile>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (lang !== locale) {
      const newPath = window.location.pathname.replace(`/${locale}`, `/${lang}`);
      router.push(newPath + window.location.search);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-s-coral/10 overflow-hidden shrink-0 flex items-center justify-center text-xl font-heading text-s-coral">
          {avatar ? (
            <Image src={avatar} alt="" width={56} height={56} className="object-cover w-full h-full" loading="lazy" />
          ) : (
            name[0] ?? "?"
          )}
        </div>
        <input
          type="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder={t("avatarUrl")}
          className={`flex-1 px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20`}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("name")} *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("bio")}</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={`${INPUT_CLS} resize-none`} />
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("birthday")}</label>
        <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={INPUT_CLS} />
      </div>

      {/* Notifications */}
      <div className="pt-2 border-t border-s-ink/5 dark:border-white/10 space-y-3">
        <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">{t("emailNotifications")}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("notifBookings")}</p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("notifBookingsDesc")}</p>
          </div>
          <button type="button" onClick={() => setEmailOn(!emailOn)}
            role="switch"
            aria-checked={emailOn}
            aria-label={t("notifBookings")}
            className={["relative w-11 h-6 rounded-pill transition-colors shrink-0", emailOn ? "bg-s-coral" : "bg-s-sand dark:bg-white/10"].join(" ")}>
            <span className={["absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", emailOn ? "translate-x-5" : "translate-x-0"].join(" ")} />
          </button>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("notifDeals")}</p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("notifDealsDesc")}</p>
          </div>
          <button type="button" disabled role="switch" aria-checked={false} aria-label={t("notifDeals")}
            className="relative w-11 h-6 rounded-pill bg-s-sand dark:bg-white/10 shrink-0 cursor-not-allowed">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("notifNewSalons")}</p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("notifNewSalonsDesc")}</p>
          </div>
          <button type="button" disabled role="switch" aria-checked={false} aria-label={t("notifNewSalons")}
            className="relative w-11 h-6 rounded-pill bg-s-sand dark:bg-white/10 shrink-0 cursor-not-allowed">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">{t("language")}</p>
        <div className="flex gap-2 flex-wrap">
          {(["de", "en", "fr", "it"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={[
                "px-4 py-2 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] border transition-colors",
                lang === l
                  ? "bg-s-coral text-white border-s-coral"
                  : "border-s-ink/10 text-s-ink/60 hover:border-s-coral hover:text-s-coral dark:border-white/10 dark:text-s-dm-text/60",
              ].join(" ")}
            >
              {l === "de" ? "Deutsch" : l === "en" ? "English" : l === "fr" ? "Français" : "Italiano"}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Preferences */}
      <div className="pt-4 border-t border-s-ink/5 dark:border-white/10 space-y-4">
        <div>
          <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-1">{tPrefs("title")}</p>
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-3">{tPrefs("subtitle")}</p>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{tPrefs("allergies_label")}</label>
          <input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder={tPrefs("allergies_placeholder")}
            className={INPUT_CLS}
          />
        </div>

        {/* Skin Type */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{tPrefs("skin_type_label")}</label>
          <input
            type="text"
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
            placeholder={tPrefs("skin_type_placeholder")}
            className={INPUT_CLS}
          />
        </div>

        {/* Stylist Gender */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">{tPrefs("stylist_gender_label")}</label>
          <div className="flex gap-2">
            {(["male", "female", "no-preference"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStylistGender(option)}
                className={`flex-1 px-4 py-2 rounded-btn border text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors ${
                  stylistGender === option
                    ? "border-s-coral bg-s-coral text-white"
                    : "border-s-ink/10 text-s-ink/60 hover:border-s-coral hover:text-s-coral dark:border-white/10 dark:text-s-dm-text/60"
                }`}
              >
                {tPrefs(`stylist_gender_${option}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility Needs */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{tPrefs("accessibility_label")}</label>
          <input
            type="text"
            value={accessibilityNeeds}
            onChange={(e) => setAccessibilityNeeds(e.target.value)}
            placeholder={tPrefs("accessibility_placeholder")}
            className={INPUT_CLS}
          />
        </div>

        {/* Preferred Language */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{tPrefs("language_label")}</label>
          <input
            type="text"
            value={prefLanguage}
            onChange={(e) => setPrefLanguage(e.target.value)}
            placeholder={tPrefs("language_placeholder")}
            className={INPUT_CLS}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{tPrefs("notes_label")}</label>
          <textarea
            value={prefNotes}
            onChange={(e) => setPrefNotes(e.target.value)}
            placeholder={tPrefs("notes_placeholder")}
            rows={2}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!name || saving}
          className="px-5 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner size="sm" invert />}
          {t("save")}
        </button>
        {saved && <span className="text-sm text-s-coral font-medium">{t("saved")}</span>}
      </div>
    </form>
  );
});

// ─────────────────────────────────────────
// Section label
// ─────────────────────────────────────────

const ProfileSectionLabel = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && <Icon size={13} className="text-s-ink/35 dark:text-s-dm-text/35" />}
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 dark:text-s-dm-text/35">{children}</p>
  </div>
);

// ─────────────────────────────────────────
// Main ProfilePage component
// ─────────────────────────────────────────

export default function ProfilePage() {
  const locale = useLocale();
  const t = useTranslations("Profile");
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [favorites, setFavorites] = useState<SalonCard[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<BookingWithDetails | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const userId = session.user.id;

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (!profileData?.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const [bookingsRes, favoritesRes, loyaltyRes] = await Promise.all([
          supabase
            .from("bookings")
            .select("*, salons!inner(name, slug), services!inner(name)")
            .eq("user_id", userId)
            .order("starts_at", { ascending: false })
            .limit(50)
            .then(({ data }) => (data ?? []).map((b: any) => ({
              ...b,
              salon_name: b.salons?.name ?? "",
              service_name: b.services?.name ?? "",
              salon_slug: b.salons?.slug,
            }))),
          supabase
            .from("favorites")
            .select("salon_id, salons!inner(id, name, slug, quartier, average_rating, cover_photo_url)")
            .eq("user_id", userId)
            .then(({ data }) => (data ?? []).map((f: any) => f.salons)),
          supabase
            .from("loyalty_stamps")
            .select("id, salon_id, stamps_needed, reward_text, stamps_collected, salons!inner(name, slug, cover_photo_url)")
            .eq("user_id", userId)
            .then(({ data }) => data ?? []),
        ]);

        setProfile(profileData as Profile);
        setBookings(bookingsRes);
        setFavorites(favoritesRes);
        setLoyaltyCards(loyaltyRes as any);
      } catch (err) {
        console.error("[ProfilePage] Error loading profile:", err);
        router.push(`/${locale}/auth/login`);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [locale, router, pathname]);

  const handleSaveProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("profiles").update(updates).eq("id", session.user.id);
      }
    } catch (err) {
      console.error("[ProfilePage] Error saving profile:", err);
    }
    setProfile((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  const handleCancelled = useCallback((id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
  }, []);

  const removeFav = useCallback(async (salonId: string) => {
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("favorites").delete().eq("user_id", session.user.id).eq("salon_id", salonId);
      }
    } catch (err) {
      console.error("[ProfilePage] Error removing favorite:", err);
    }
    setFavorites((prev) => prev.filter((s) => s.id !== salonId));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Hero skeleton */}
          <div className="rounded-[16px] border border-s-ink/[0.06] dark:border-white/[0.06] p-5 bg-white dark:bg-s-dm-surface animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-s-bg-sunken dark:bg-s-dm-bg rounded" />
                <div className="h-3 w-48 bg-s-bg-sunken dark:bg-s-dm-bg rounded" />
              </div>
            </div>
          </div>
          {/* Booking row skeletons */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4 bg-white dark:bg-s-dm-surface animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 bg-s-bg-sunken dark:bg-s-dm-bg rounded" />
                  <div className="h-2.5 w-24 bg-s-bg-sunken dark:bg-s-dm-bg rounded" />
                  <div className="h-2.5 w-28 bg-s-bg-sunken dark:bg-s-dm-bg rounded" />
                </div>
                <div className="w-14 h-5 bg-s-bg-sunken dark:bg-s-dm-bg rounded-[6px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.starts_at).getTime() > now
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || new Date(b.starts_at).getTime() <= now
  );

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Cancel modal */}
        {cancelTarget && (
          <CancelModal
            bookingId={cancelTarget.id}
            salonName={cancelTarget.salon_name}
            startsAt={cancelTarget.starts_at}
            locale={locale}
            onClose={() => setCancelTarget(null)}
            onCancelled={handleCancelled}
          />
        )}

        {/* ── Hero ── */}
        <div className="rounded-[16px] border border-s-ink/[0.06] dark:border-white/[0.06] p-5 mb-6"
          style={{ background: "rgba(255,255,255,.90)", boxShadow: "0 1px 2px rgba(26,18,9,.05)" }}>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 dark:text-s-dm-text/30 mb-4">
            Mein Profil
          </p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-s-bg-sunken dark:bg-s-dm-bg flex items-center justify-center relative shrink-0">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.display_name ?? ""} fill className="object-cover" />
              ) : (
                <span className="text-2xl font-heading font-bold text-s-ink/20 dark:text-s-dm-text/20">
                  {(profile.display_name ?? "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text truncate">{profile.display_name}</p>
                <SolenExclusiveBadge featureDescription={t("exclusiveMember") || "Exclusive Member"} />
              </div>
              <p className="text-xs font-body italic text-s-ink/45 dark:text-s-dm-text/45 mt-0.5 truncate">{profile.bio}</p>
            </div>
            <a href={`/${locale}/profile/settings`}
              className="w-9 h-9 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-colors shrink-0">
              <Settings size={15} className="text-s-ink/40 dark:text-s-dm-text/40" />
            </a>
          </div>
        </div>

        {/* ── Section 1: Upcoming Bookings ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6"
        >
          <h2 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-s-coral" />
            {t("upcomingBookings")}
          </h2>
          <AnimatePresence mode="wait">
          {upcoming.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <EmptyState
                icon={Calendar}
                title={t("noBookingsYet")}
                illustration="no-results"
                action={
                  <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs hover:underline">
                    {t("bookNow")} →
                  </Link>
                }
              />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} locale={locale} onCancel={setCancelTarget} />
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.section>

        {/* ── Section 2: Past Bookings ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setPastOpen(!pastOpen)}
            aria-expanded={pastOpen}
            className="w-full flex items-center justify-between font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3"
          >
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-s-ink/40 dark:text-s-dm-text/40" />
              {t("pastBookings")} ({past.length})
            </span>
            {pastOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {pastOpen && (
            <div className="space-y-3">
              {past.length === 0 ? (
                <EmptyState icon={Calendar} title={t("noPastBookings")} illustration="no-results" />
              ) : (
                past.map((b) => (
                  <BookingCard key={b.id} booking={b} locale={locale} onCancel={setCancelTarget} />
                ))
              )}
            </div>
          )}
        </motion.section>

        {/* ── Section 3: Favorites ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          <ProfileSectionLabel icon={Heart}>{t("favorites")}</ProfileSectionLabel>
          {favorites.length === 0 ? (
            <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] border-dashed p-8 text-center">
              <Heart size={24} className="mx-auto mb-2 text-s-ink/15 dark:text-s-dm-text/15" />
              <p className="text-xs font-heading text-s-ink/30 dark:text-s-dm-text/30 uppercase tracking-[.10em]">{t("noFavorites")}</p>
              <Link href={`/${locale}/coiffeur`}
                className="inline-block mt-3 text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-coral hover:underline">
                {t("discoverSalons")} →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favorites.map((salon) => (
                <div key={salon.id} className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] overflow-hidden flex gap-3 p-3 group relative">
                  {salon.cover_photo_url && (
                    <div className="w-14 h-14 rounded-[10px] overflow-hidden shrink-0 bg-s-bg-sunken dark:bg-s-dm-bg">
                      <Image src={salon.cover_photo_url} alt={salon.name} width={56} height={56} className="object-cover w-full h-full" loading="lazy" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/${locale}/salon/${salon.slug}`} className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text hover:text-s-coral transition-colors truncate block">
                      {salon.name}
                    </Link>
                    <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{salon.quartier}
                    </p>
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 flex items-center gap-1 mt-0.5">
                      <Star size={10} className="text-s-yellow fill-s-yellow" />
                      {salon.average_rating?.toFixed(1) ?? "–"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFav(salon.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-pill text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral hover:bg-s-coral/10 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    title={t("removeFromFavorites")}
                    aria-label={t("removeFromFavorites")}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Section: Stamp Cards ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.17 }}
          className="mb-6"
        >
          <h2 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-s-amber" />
            {t("stampCards")}
            <SolenExclusiveBadge featureDescription={t("stampCardsFeature")} />
          </h2>
          {loyaltyCards.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title={t("noStamps")}
              illustration="no-results"
              action={
                <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs hover:underline">
                  {t("bookAtSalon")}
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loyaltyCards.map((card) => (
                <StampCard
                  key={card.id}
                  salonName={card.salons.name}
                  salonSlug={card.salons.slug}
                  salonImageUrl={card.salons.cover_photo_url ?? undefined}
                  stampsTotal={card.stamps_needed}
                  stampsCollected={card.stamps_collected}
                  rewardText={card.reward_text}
                />
              ))}
            </div>
          )}
        </motion.section>

      {/* ── Section: Discovery ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="mb-6"
      >
        <div className="bg-white dark:bg-s-dm-surface rounded-[24px] border border-s-ink/5 dark:border-white/10 p-5">
          <ProfileDiscoverySections
            userId={profile.id}
            profile={{
              disc_gender: (profile as any).disc_gender ?? null,
              disc_hair_texture: (profile as any).disc_hair_texture ?? null,
              disc_hair_length: (profile as any).disc_hair_length ?? null,
              disc_face_shape: (profile as any).disc_face_shape ?? null,
              disc_skin_tone: (profile as any).disc_skin_tone ?? null,
              disc_preferred_categories: null,
            }}
          />
        </div>
      </motion.section>

      {/* ── Section: Credit & Referral ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <h2 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3 flex items-center gap-2">
          <Wallet size={16} className="text-s-coral" />
          {t("creditAndReferral")}
        </h2>
        <ReferralSection locale={locale} />
      </motion.section>

      {/* ── Section: Packages, Gift Cards, Forms ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <div className="space-y-3">
          <Link
            href={`/${locale}/profile/packages`}
            className="flex items-center justify-between p-4 bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/5 dark:border-white/10 hover:border-s-coral/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Package size={18} className="text-s-blue" />
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("myPackages")}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t("myPackagesDesc")}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </Link>
          <Link
            href={`/${locale}/profile/gift-cards`}
            className="flex items-center justify-between p-4 bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/5 dark:border-white/10 hover:border-s-coral/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Gift size={18} className="text-s-coral" />
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("myGiftCards")}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t("myGiftCardsDesc")}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </Link>
          <Link
            href={`/${locale}/profile/intake-forms`}
            className="flex items-center justify-between p-4 bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/5 dark:border-white/10 hover:border-s-coral/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <ClipboardList size={18} className="text-s-amber" />
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("myForms")}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t("myFormsDesc")}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </Link>
        </div>
      </motion.section>

      {/* ── Section: Settings ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3 flex items-center gap-2">
          <Settings size={16} className="text-s-ink/60 dark:text-s-dm-text/60" />
          {t("settings")}
        </h2>
        <div className="bg-white dark:bg-s-dm-surface rounded-[24px] border border-s-ink/5 dark:border-white/10 p-5">
          <SettingsSection profile={profile} onSave={handleSaveProfile} />
        </div>
      </motion.section>

        {/* ── Recently Viewed ── */}
        <RecentlyViewed />
      </div>
    </div>
  );
}
