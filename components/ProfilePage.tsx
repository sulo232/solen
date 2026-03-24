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
import { motion } from "framer-motion";
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
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("reasonOptional")}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-bg-surface dark:hover:bg-white/5 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

  if (loading) return <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 p-4"><Spinner size="sm" /></div>;

  return (
    <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 p-4 space-y-3">
      {/* Referral code */}
      <div className="flex items-center justify-between p-3 rounded-card bg-s-coral/5 dark:bg-s-coral/10 border border-s-coral/15">
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-s-coral shrink-0" />
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("inviteFriends")}</p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{t("bothGetCredit")}</p>
          </div>
        </div>
      </div>

      {/* Code display */}
      {code && (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-input bg-s-bg-surface dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/10 font-mono text-sm text-s-ink dark:text-s-dm-text tracking-wide">
            {code}
          </div>
          <button
            onClick={copyCode}
            className="px-3 py-2 rounded-btn bg-s-ink/5 dark:bg-white/5 hover:bg-s-ink/10 dark:hover:bg-white/10 transition-colors"
            aria-label={t("copyCode")}
          >
            {copied ? <Check size={16} className="text-s-sage" /> : <Copy size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />}
          </button>
        </div>
      )}

      {/* Share buttons */}
      <div className="flex gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn bg-[#25D366] text-white text-xs font-medium hover:bg-[#1DA851] transition-colors"
        >
          <Share2 size={12} /> WhatsApp
        </button>
        <button
          onClick={shareSMS}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn bg-s-blue text-white text-xs font-medium hover:bg-s-blue/80 transition-colors"
        >
          <MessageCircle size={12} /> SMS
        </button>
        <button
          onClick={copyCode}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn bg-s-ink/5 dark:bg-white/5 text-s-ink dark:text-s-dm-text text-xs font-medium hover:bg-s-ink/10 dark:hover:bg-white/10 transition-colors"
        >
          <Copy size={12} /> {t("copyCode")}
        </button>
      </div>

      {/* Reward tracking */}
      <div className="flex items-center justify-between pt-2 border-t border-s-ink/5 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-s-amber" />
          <span className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
            {t("friendsInvited", { count: stats.friends_invited })}
          </span>
        </div>
        <span className="data-text text-sm font-bold text-s-coral">
          {t("earned", { amount: formatCurrency(stats.total_earned / 100, locale) })}
        </span>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────
// Booking card
// ─────────────────────────────────────────

type BookingWithDetails = Booking & { salon_name: string; service_name: string; salon_slug?: string };

const STATUS_COLOR: Record<string, string> = {
  confirmed: "text-s-coral",
  cancelled: "text-s-coral",
  completed: "text-s-ink/50 dark:text-s-dm-text/50",
  no_show: "text-s-ink/30 dark:text-s-dm-text/30",
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

  const STATUS_LABEL: Record<string, string> = {
    confirmed: t("statusConfirmed"),
    cancelled: t("statusCancelled"),
    completed: t("statusCompleted"),
    no_show: t("statusNoShow"),
  };

  const localeFmt = locale === "de" ? "de-CH" : locale;

  return (
    <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 p-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-medium text-sm text-s-ink dark:text-s-dm-text">{b.salon_name}</p>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">{b.service_name}</p>
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1">
            {new Date(b.starts_at).toLocaleDateString(localeFmt, {
              weekday: "short", day: "numeric", month: "short",
            })}{" "}
            {new Date(b.starts_at).toLocaleTimeString(localeFmt, { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={["text-xs font-medium", STATUS_COLOR[b.status] ?? "text-s-ink/40 dark:text-s-dm-text/40"].join(" ")}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
      </div>

      {(b.status === "confirmed" || b.salon_slug) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-s-ink/5 dark:border-white/10">
          {b.salon_slug && (
            <Link
              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&staff=${b.staff_member_id ?? ""}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral hover:border-s-coral transition-colors"
            >
              <RotateCcw size={12} />
              {t("rebookAction")}
            </Link>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(b)}
              className="px-3 py-1.5 rounded-btn border border-s-coral/30 text-xs text-s-coral hover:bg-s-coral/5 transition-colors"
            >
              {t("cancelAction")}
            </button>
          )}

          {b.status === "completed" && (
            <ReportProblemButton bookingId={b.id} />
          )}

          {tooLate && (
            <div className="relative group">
              <button
                disabled
                className="px-3 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/20 dark:text-s-dm-text/20 cursor-not-allowed"
              >
                {t("cancelAction")}
              </button>
              <div className="absolute bottom-full left-0 mb-1.5 w-44 bg-s-ink dark:bg-s-dm-raised text-white text-xs rounded-card px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {t("cancelTooLate")}
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
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [birthday, setBirthday] = useState((profile as Profile & { birthday?: string }).birthday ?? "");
  const [emailOn, setEmailOn] = useState(profile.notification_email ?? true);
  const [lang, setLang] = useState<"de" | "en" | "fr" | "it">(profile.locale ?? "de");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
                "px-4 py-2 rounded-btn text-sm font-medium border transition-colors",
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!name || saving}
          className="px-5 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all disabled:opacity-50 flex items-center gap-2"
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
      <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg px-4 py-8 max-w-lg mx-auto space-y-6">
        {/* Profile header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton variant="avatar" className="w-16 h-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        {/* Booking cards skeleton */}
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
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
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-s-coral/10 overflow-hidden flex items-center justify-center text-2xl font-heading text-s-coral shrink-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={64} height={64} className="object-cover w-full h-full" loading="lazy" />
            ) : (
              profile.display_name[0] ?? "?"
            )}
          </div>
          <div>
            <p className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">{profile.display_name}</p>
            <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("myProfile")}</p>
          </div>
          <Link
            href={`/${locale}/account/messages`}
            className="ml-auto relative p-2 rounded-btn border border-s-ink/10 dark:border-white/10 hover:border-s-coral transition-colors"
            aria-label={t("myProfile")}
          >
            <MessageCircle size={18} className="text-s-ink/50 dark:text-s-dm-text/50" />
          </Link>
        </motion.div>

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
          {upcoming.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <BookingCard key={b.id} booking={b} locale={locale} onCancel={setCancelTarget} />
              ))}
            </div>
          )}
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
          <h2 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3 flex items-center gap-2">
            <Heart size={16} className="text-s-coral" />
            {t("favorites")}
          </h2>
          {favorites.length === 0 ? (
            <EmptyState
              icon={Heart}
              title={t("noFavorites")}
              illustration="no-results"
              action={
                <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs hover:underline">
                  {t("discoverSalons")} →
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favorites.map((salon) => (
                <div key={salon.id} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 overflow-hidden flex gap-3 p-3 group relative">
                  {salon.cover_photo_url && (
                    <div className="w-14 h-14 rounded-card overflow-hidden shrink-0 bg-s-bg-sunken dark:bg-s-dm-bg">
                      <Image src={salon.cover_photo_url} alt={salon.name} width={56} height={56} className="object-cover w-full h-full" loading="lazy" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/${locale}/salon/${salon.slug}`} className="font-medium text-sm text-s-ink dark:text-s-dm-text hover:text-s-coral transition-colors truncate block">
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
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral hover:bg-s-coral/10 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
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
          <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 p-5">
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
              className="flex items-center justify-between p-4 bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 hover:border-s-coral/30 transition-colors group"
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
              className="flex items-center justify-between p-4 bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 hover:border-s-coral/30 transition-colors group"
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
              className="flex items-center justify-between p-4 bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 hover:border-s-coral/30 transition-colors group"
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
          <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 p-5">
            <SettingsSection profile={profile} onSave={handleSaveProfile} />
          </div>
        </motion.section>

        {/* ── Recently Viewed ── */}
        <RecentlyViewed />
      </div>
    </div>
  );
}
