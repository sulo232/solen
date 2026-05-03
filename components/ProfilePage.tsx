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
import type { Profile, Booking, SalonCard, BeautyProfile } from "@/lib/types";
import { ReportProblemButton } from "@/components/disputes/ReportProblemButton";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { BeautyProfileCard } from "@/components/profile/BeautyProfileCard";
import { BeautyProfileEditModal } from "@/components/profile/BeautyProfileEditModal";
// Q58 (2026-05-02) retired imports removed in Phase 7 cleanup:
// - SalonHighlights, ProfileTabs deleted (orphan files)
// - LooksGrid kept on disk for future /profile/looks integration when backend lands
import { PaymentMethodsSection } from "@/components/profile/PaymentMethodsSection";
import { DeleteAccountModal } from "@/components/profile/DeleteAccountModal";
import LiveActivityCard, { type LiveActivityState } from "@/components/profile/LiveActivityCard";
import ProfileGroupedLists, { type ProfileGroup } from "@/components/profile/ProfileGroupedLists";

interface LoyaltyCard {
  id: string;
  salon_id: string;
  stamps_needed: number;
  reward_text: string;
  stamps_collected: number;
  salons: { name: string; slug: string; cover_photo_url: string | null };
}

interface LoyaltyCardRaw {
  id: string;
  salon_id: string;
  stamps_needed: number;
  reward_text: string;
  salons: { name: string; slug: string; cover_photo_url: string | null };
  loyalty_stamps: { id: string }[];
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
  const t = useTranslations("Profile") as any;
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
        <p className="text-sm text-s-ink/60 mb-1">
          {salonName} — {dateFmt} {timeFmt}
        </p>
        <p className="text-xs text-s-ink/40 mb-4">{t("cancelFreeHint")}</p>

        <div className="mb-5">
          <label className="block text-[9px] font-heading uppercase tracking-[.14em] text-s-ink/40 mb-1.5">{t("reasonOptional")}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className="w-full px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-pill border border-s-ink/10 text-[11px] font-heading uppercase tracking-[.06em] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-elevation-2"
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
  const t = useTranslations("Profile") as any;
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ friends_invited: 0, total_earned: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        setCode(d.referral_code ?? null);
        setStats({ friends_invited: d.friends_invited ?? 0, total_earned: d.total_earned ?? 0 });
      })
      .catch((err) => console.error("[ProfilePage] failed to fetch referral data:", err))
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

  if (loading) return <div className="rounded-[12px] border border-s-ink/[0.06] bg-white p-5"><Spinner size="sm" /></div>;

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] bg-white p-5 space-y-4">
      {/* Eyebrow header */}
      <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/35">
        Freunde einladen
      </p>

      {/* Referral invite banner */}
      <div className="flex items-center gap-3 p-3 rounded-[10px]"
        style={{ background: "rgba(232,98,74,.06)", border: "1px solid rgba(232,98,74,.15)" }}>
        <Gift className="w-5 h-5 text-s-coral shrink-0" />
        <div>
          <p className="text-sm font-heading text-s-ink">{t("inviteFriends")}</p>
          <p className="text-xs text-s-ink/50">{t("bothGetCredit")}</p>
        </div>
      </div>

      {/* Code display */}
      {code && (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", letterSpacing: ".12em", color: "var(--s-ink)" }}>
            {code}
          </div>
          <button
            onClick={copyCode}
            aria-label={t("copyCode")}
            className={`w-10 h-10 rounded-[10px] border flex items-center justify-center transition-[border-color,background-color] duration-150 ${
              copied
                ? "border-[#4CAF6F] bg-[#4CAF6F]/10"
                : "border-s-ink/[0.08] hover:border-s-coral/40"
            }`}
          >
            {copied
              ? <Check size={15} className="text-[#4CAF6F]" />
              : <Copy size={15} className="text-s-ink/40" />}
          </button>
        </div>
      )}

      {/* Share buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex items-center justify-center gap-1.5 py-3 rounded-pill text-[10px] font-heading uppercase tracking-[.04em] text-white active:scale-[0.97] hover:brightness-[1.06] transition-[transform,filter] duration-150"
          style={{ background: "#25D366" }}
        >
          <Share2 size={12} /> WhatsApp
        </button>
        <button
          onClick={shareSMS}
          className="flex items-center justify-center gap-1.5 py-3 rounded-pill text-[10px] font-heading uppercase tracking-[.04em] text-white active:scale-[0.97] hover:brightness-[1.06] transition-[transform,filter] duration-150"
          style={{ background: "#0A84FF" }}
        >
          <MessageCircle size={12} /> SMS
        </button>
        <button
          onClick={copyCode}
          className="flex items-center justify-center gap-1.5 py-3 rounded-pill border border-s-ink/[0.08] text-[10px] font-heading uppercase tracking-[.04em] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150"
        >
          <Copy size={12} /> {t("copyCode")}
        </button>
      </div>

      {/* Reward tracking */}
      <div className="flex items-center justify-between pt-3 border-t border-s-ink/[0.05]">
        <div className="flex items-center gap-2">
          <Trophy size={13} className="text-s-amber" />
          <div>
            <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/35">
              Eingeladen
            </p>
            <p className="text-xs font-heading text-s-ink">{stats.friends_invited}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/35">Verdient</p>
          <p className="font-heading text-sm text-s-coral">
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
  const t = useTranslations("Profile") as any;
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
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-heading text-sm text-s-ink">{b.salon_name}</p>
          <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/40 mt-0.5">{b.service_name}</p>
          <p className="text-xs font-body text-s-ink/40 mt-1">
            {new Date(b.starts_at).toLocaleDateString(localeFmt, {
              weekday: "short", day: "numeric", month: "short",
            })}{" · "}
            {new Date(b.starts_at).toLocaleTimeString(localeFmt, { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {(() => {
          const badge = STATUS_BADGE[b.status];
          return (
            <span className="text-[9px] font-heading uppercase tracking-[.08em] px-2 py-1 rounded-[6px] shrink-0"
              style={{ background: badge?.bg, color: badge?.color }}>
              {badge?.label ?? b.status}
            </span>
          );
        })()}
      </div>

      {(b.status === "confirmed" || b.salon_slug) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-s-ink/[0.05]">
          {b.salon_slug && (
            <Link
              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&staff=${b.staff_member_id ?? ""}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-ink/[0.08] text-[10px] font-heading uppercase tracking-[.06em] text-s-ink/50 hover:text-s-coral hover:border-s-coral/40 transition-colors"
            >
              <RotateCcw size={12} />
              {t("rebookAction")}
            </Link>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(b)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-coral/25 text-[10px] font-heading uppercase tracking-[.06em] text-s-coral hover:bg-s-coral/[0.05] transition-colors"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-s-ink/[0.06] text-[10px] font-heading uppercase tracking-[.06em] text-s-ink/20 cursor-not-allowed"
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

const INPUT_CLS = "w-full px-3 py-2.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20";

const SettingsSection = memo(function SettingsSection({
  profile,
  onSave,
  onDeleteClick,
}: {
  profile: Profile;
  onSave: (p: Partial<Profile>) => Promise<void>;
  onDeleteClick: () => void;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Profile") as any;
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
          className={`flex-1 px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20`}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">{t("name")} *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">{t("bio")}</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={`${INPUT_CLS} resize-none`} />
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">{t("birthday")}</label>
        <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={INPUT_CLS} />
      </div>

      {/* Notifications */}
      <div className="pt-2 border-t border-s-ink/5 space-y-3">
        <p className="text-xs font-medium text-s-ink/50">{t("emailNotifications")}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-s-ink">{t("notifBookings")}</p>
            <p className="text-xs text-s-ink/40 mt-0.5">{t("notifBookingsDesc")}</p>
          </div>
          <button type="button" onClick={() => setEmailOn(!emailOn)}
            role="switch"
            aria-checked={emailOn}
            aria-label={t("notifBookings")}
            className={["relative w-11 h-6 rounded-pill transition-colors shrink-0", emailOn ? "bg-s-coral" : "bg-s-sand"].join(" ")}>
            <span className={["absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", emailOn ? "translate-x-5" : "translate-x-0"].join(" ")} />
          </button>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-s-ink">{t("notifDeals")}</p>
              <span className="px-1.5 py-0.5 rounded-[4px] bg-s-ink/10 text-s-ink/60 text-[9px] font-heading uppercase tracking-[.1em]">{t("comingSoon")}</span>
            </div>
            <p className="text-xs text-s-ink/40 mt-0.5">{t("notifDealsDesc")}</p>
          </div>
          <button type="button" disabled role="switch" aria-checked={false} aria-label={t("notifDeals")}
            className="relative w-11 h-6 rounded-pill bg-s-sand shrink-0 cursor-not-allowed">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-s-ink">{t("notifNewSalons")}</p>
              <span className="px-1.5 py-0.5 rounded-[4px] bg-s-ink/10 text-s-ink/60 text-[9px] font-heading uppercase tracking-[.1em]">{t("comingSoon")}</span>
            </div>
            <p className="text-xs text-s-ink/40 mt-0.5">{t("notifNewSalonsDesc")}</p>
          </div>
          <button type="button" disabled role="switch" aria-checked={false} aria-label={t("notifNewSalons")}
            className="relative w-11 h-6 rounded-pill bg-s-sand shrink-0 cursor-not-allowed">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-sm font-medium text-s-ink mb-2">{t("language")}</p>
        <div className="flex gap-2 flex-wrap">
          {(["de", "en", "fr", "it"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={[
                "px-4 py-2 rounded-pill text-[11px] font-heading uppercase tracking-[.06em] border transition-[background-color,border-color,color] duration-150",
                lang === l
                  ? "bg-s-coral text-white border-s-coral"
                  : "border-s-ink/10 text-s-ink/60 hover:border-s-coral hover:text-s-coral",
              ].join(" ")}
            >
              {l === "de" ? "Deutsch" : l === "en" ? "English" : l === "fr" ? "Français" : "Italiano"}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Preferences */}
      <div className="pt-4 border-t border-s-ink/5 space-y-4">
        <div>
          <p className="text-sm font-medium text-s-ink mb-1">{tPrefs("title")}</p>
          <p className="text-xs text-s-ink/40 mb-3">{tPrefs("subtitle")}</p>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">{tPrefs("allergies_label")}</label>
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
          <label className="block text-xs font-medium text-s-ink/50 mb-1">{tPrefs("skin_type_label")}</label>
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
          <label className="block text-xs font-medium text-s-ink/50 mb-2">{tPrefs("stylist_gender_label")}</label>
          <div className="flex gap-2">
            {(["male", "female", "no-preference"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStylistGender(option)}
                className={`flex-1 px-4 py-2 rounded-pill border text-[11px] font-heading uppercase tracking-[.06em] transition-[background-color,border-color,color] duration-150 ${
                  stylistGender === option
                    ? "border-s-coral bg-s-coral text-white"
                    : "border-s-ink/10 text-s-ink/60 hover:border-s-coral hover:text-s-coral"
                }`}
              >
                {tPrefs(`stylist_gender_${option}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility Needs */}
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">{tPrefs("accessibility_label")}</label>
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
          <label className="block text-xs font-medium text-s-ink/50 mb-1">{tPrefs("language_label")}</label>
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
          <label className="block text-xs font-medium text-s-ink/50 mb-1">{tPrefs("notes_label")}</label>
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
          className="px-5 py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-elevation-2"
        >
          {saving && <Spinner size="sm" invert />}
          {t("save")}
        </button>
        {saved && <span className="text-sm text-s-coral font-medium">{t("saved")}</span>}
      </div>

      {/* Danger zone: Delete account */}
      <div className="pt-6 border-t border-red-200">
        <p className="text-[9px] font-heading uppercase tracking-[.18em] text-red-600 mb-3">
          {t("dangerZone")}
        </p>
        <button
          type="button"
          onClick={onDeleteClick}
          className="px-4 py-2.5 rounded-pill active:scale-[0.97] bg-red-50 border border-red-200 text-red-600 text-[11px] font-heading uppercase tracking-[.06em] hover:bg-red-100:bg-red-950/40 transition-[background-color,transform] duration-150"
        >
          {t("deleteAccount")}
        </button>
      </div>
    </form>
  );
});

// ─────────────────────────────────────────
// Section label
// ─────────────────────────────────────────

const ProfileSectionLabel = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && <Icon size={13} className="text-s-ink/35" />}
    <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/35">{children}</p>
  </div>
);

// ─────────────────────────────────────────
// Main ProfilePage component
// ─────────────────────────────────────────

export default function ProfilePage() {
  const locale = useLocale();
  const t = useTranslations("Profile") as any;
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [favorites, setFavorites] = useState<SalonCard[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<BookingWithDetails | null>(null);
  // pastOpen state retired with the inline termine tab — past bookings now live at /profile/bookings.
  // activeTab state retired 2026-05-02 per Q58 — tabs replaced by grouped lists routing to sub-pages.
  const [beautyEditOpen, setBeautyEditOpen] = useState(false);
  // Q58 LiveActivityCard state — fetched from /api/profile/live-state, polled every 60s
  const [liveState, setLiveState] = useState<LiveActivityState | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

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
            .select("salon_id, salons!inner(id, name, slug, address, average_rating, cover_photo_url)")
            .eq("user_id", userId)
            .then(({ data }) => (data ?? []).map((f: any) => f.salons)),
          supabase
            .from("loyalty_cards")
            .select(`id, salon_id, stamps_needed, reward_text, salons!inner(name, slug, cover_photo_url), loyalty_stamps!inner(id, customer_id)`)
            .eq("is_active", true)
            .eq("loyalty_stamps.customer_id", userId)
            .then(({ data }) =>
              ((data ?? []) as unknown as LoyaltyCardRaw[]).map((card) => ({
                id: card.id,
                salon_id: card.salon_id,
                stamps_needed: card.stamps_needed,
                reward_text: card.reward_text,
                stamps_collected: (card.loyalty_stamps ?? []).length,
                salons: card.salons,
              } as LoyaltyCard))
            ),
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

  // Q58 LiveActivityCard data loop — initial fetch + 60s poll + revalidate on focus
  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/profile/live-state", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setLiveState(data);
          setLiveLoading(false);
        }
      } catch (err) {
        console.error("[ProfilePage] live-state fetch:", err);
        if (!cancelled) setLiveLoading(false);
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 60_000);
    const onFocus = () => fetchLive();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

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

  const handleSaveBeautyProfile = useCallback(async (beautyProfile: BeautyProfile) => {
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentPrefs = (profile?.customer_preferences as any) || {};
        const updatedPrefs = { ...currentPrefs, beauty: beautyProfile };
        await supabase.from("profiles").update({ customer_preferences: updatedPrefs }).eq("id", session.user.id);
        setProfile((prev) => prev ? { ...prev, customer_preferences: updatedPrefs } : prev);
      }
    } catch (err) {
      console.error("[ProfilePage] Error saving beauty profile:", err);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[--base] py-8 px-5">
        <div className="max-w-md mx-auto space-y-4">
          {/* Avatar ring skeleton */}
          <div className="flex flex-col items-center gap-4 py-6 animate-pulse">
            <div className="w-[90px] h-[90px] rounded-full bg-s-ink/10" />
            <div className="space-y-2 flex flex-col items-center">
              <div className="h-6 w-32 bg-s-ink/10 rounded" />
              <div className="h-4 w-24 bg-s-ink/10 rounded-pill" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-32 bg-s-ink/10 rounded-pill" />
              <div className="h-9 w-9 bg-s-ink/10 rounded-full" />
              <div className="h-9 w-9 bg-s-ink/10 rounded-full" />
            </div>
          </div>

          {/* Beauty card skeleton */}
          <div className="bg-[--raised] rounded-[18px] p-4 animate-pulse">
            <div className="h-4 w-28 bg-s-ink/10 rounded mb-3" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-3 border-b border-s-ink/[0.06] last:border-0">
                <div className="h-2 w-12 bg-s-ink/10 rounded mb-2" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-s-ink/10 rounded-pill" />
                  <div className="h-6 w-16 bg-s-ink/10 rounded-pill" />
                </div>
              </div>
            ))}
          </div>

          {/* Tab bar skeleton */}
          <div className="flex border-b border-s-ink/10 pt-2 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 h-10 flex items-center justify-center">
                <div className="h-3 w-12 bg-s-ink/10 rounded" />
              </div>
            ))}
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-3 gap-2.5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-[10px] bg-s-ink/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const now = Date.now();
  // Used for the Termine count chip in the Q58 grouped lists
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.starts_at).getTime() > now
  );

  const beautyProfile: BeautyProfile = (profile.customer_preferences as any)?.beauty || {};

  return (
    <div className="min-h-screen bg-[--base]">
      <div className="max-w-md mx-auto px-5 pt-6 pb-28">
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

        {/* Beauty Profile Edit Modal */}
        <BeautyProfileEditModal
          isOpen={beautyEditOpen}
          onClose={() => setBeautyEditOpen(false)}
          initialProfile={beautyProfile}
          onSave={handleSaveBeautyProfile}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          open={deleteAccountOpen}
          onClose={() => setDeleteAccountOpen(false)}
        />

        {/* Q58 (locked 2026-05-02) Profile shell — Insta-style header + LiveActivityCard
            + Sei-Hiro grouped lists. The 5-tab ProfileTabs system retired:
            each tab content lives at its own route per Q60 (bookings/favorites/looks/
            stamps). Beauty Profile + payment/settings remain modal-triggered/expanded
            from grouped list rows. */}

        {/* Profile Hero */}
        <ProfileHero
          profile={profile}
          locale={locale}
          onEditProfile={() => {
            // Anchor-scroll to inline settings section (TODO Phase 7: route to /profile/settings)
            document.getElementById("settings")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Live-Activity hero card — polls /api/profile/live-state every 60s + on focus */}
        <div className="mt-2 mb-5">
          <LiveActivityCard state={liveState} loading={liveLoading} />
        </div>

        {/* Sei-Hiro grouped menu lists */}
        <ProfileGroupedLists
          groups={[
            {
              eyebrow: "Activity",
              rows: [
                { key: "termine", label: "Termine", href: "/profile/bookings", count: upcoming.length || undefined },
                { key: "favoriten", label: "Favoriten", href: "/profile/favorites", count: favorites.length || undefined },
                { key: "looks", label: "Looks", href: "/profile/looks" },
                { key: "stempel", label: "Stempel", href: "/profile/stamps", count: loyaltyCards.length || undefined },
              ],
            },
            {
              eyebrow: "Account",
              rows: [
                { key: "beauty", label: "Beauty Profile", href: "#beauty-modal" },
                { key: "vouchers", label: "Geschenkkarten", href: "/profile/gift-cards" },
                { key: "settings", label: "Einstellungen", href: "#settings" },
              ],
            },
            {
              eyebrow: "Misc",
              rows: [
                { key: "referral", label: "Freunde einladen", href: "/profile/referral", rewardChip: "CHF 10" },
                { key: "help", label: "Hilfe & Support", href: "/help" },
              ],
            },
          ]}
        />

        {/* Inline Beauty Profile trigger — handles "#beauty-modal" virtual route via click intercept */}
        <button
          type="button"
          onClick={() => setBeautyEditOpen(true)}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          id="beauty-modal-trigger"
        />

        {/* Settings expanded section — kept inline pending Phase 7 extraction to /profile/settings */}
        <section id="settings" className="mt-8 space-y-6">
          <h3 className="font-body text-[10px] font-bold uppercase tracking-[.22em] text-s-ink/40 px-1">
            Einstellungen
          </h3>

          <SettingsSection profile={profile} onSave={handleSaveProfile} onDeleteClick={() => setDeleteAccountOpen(true)} />

          {/* Payment Methods */}
          <PaymentMethodsSection />

          {/* Email & Password + Logout */}
          <div className="pt-4 border-t border-s-ink/5 space-y-3">
            <p className="text-[9px] font-body font-bold uppercase tracking-[.18em] text-s-ink/40">Sicherheit</p>

            <button
              type="button"
              onClick={async () => {
                const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
                const supabase = createBrowserSupabaseClient();
                const email = prompt("Neue E-Mail-Adresse:");
                if (email) {
                  const { error } = await supabase.auth.updateUser({ email });
                  if (error) alert(`Fehler: ${error.message}`);
                  else alert("Bestätigungsmail gesendet — bitte prüfe dein Postfach.");
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] border border-s-ink/[0.06] bg-white hover:border-s-coral/30 transition-colors group min-h-[48px]"
            >
              <span className="text-sm font-body font-medium text-s-ink">E-Mail ändern</span>
              <ChevronRight size={16} className="text-s-ink/35" />
            </button>

            <button
              type="button"
              onClick={async () => {
                const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
                const supabase = createBrowserSupabaseClient();
                const password = prompt("Neues Passwort (mind. 8 Zeichen):");
                if (password && password.length >= 8) {
                  const { error } = await supabase.auth.updateUser({ password });
                  if (error) alert(`Fehler: ${error.message}`);
                  else alert("Passwort erfolgreich geändert.");
                } else if (password) {
                  alert("Passwort muss mindestens 8 Zeichen lang sein.");
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] border border-s-ink/[0.06] bg-white hover:border-s-coral/30 transition-colors group min-h-[48px]"
            >
              <span className="text-sm font-body font-medium text-s-ink">Passwort ändern</span>
              <ChevronRight size={16} className="text-s-ink/35" />
            </button>

            {/* Sign-out — quiet text-button per Q58 */}
            <button
              type="button"
              onClick={async () => {
                const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
                const supabase = createBrowserSupabaseClient();
                await supabase.auth.signOut();
                window.location.href = `/${locale}`;
              }}
              className="w-full text-center py-3 mt-4 text-s-ink/50 text-sm font-body hover:text-s-error transition-colors duration-150"
            >
              Abmelden
            </button>
          </div>
        </section>
        {/* TODO Phase 7: extract <SettingsSection> + <PaymentMethodsSection> + security
            buttons to /profile/settings/page.tsx; the grouped-list "Einstellungen" row
            currently anchor-scrolls to #settings via href="#settings" — replace with
            real route once the page exists. */}

        {/* ProfileTabs render block REMOVED 2026-05-02 per Q58. Each tab content
            now lives at its own dedicated route per Q60:
              - termine     → /profile/bookings  (existed)
              - favoriten   → /profile/favorites (built 2026-05-02)
              - looks       → /profile/looks     (built 2026-05-02 — stub until backend)
              - stempel     → /profile/stamps    (built 2026-05-02)
              - einstellungen → inline section above (TODO Phase 7: extract to /profile/settings)
            Beauty Profile + DeleteAccount + Cancel still triggered via modals. */}
      </div>
    </div>
  );
}

