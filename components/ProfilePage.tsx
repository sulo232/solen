"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar, Heart, User, Star, MapPin, X, RotateCcw,
  Bell, Settings, ChevronDown, ChevronUp, MessageCircle,
  Gift, Wallet, ChevronRight, Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import GlassModal from "@/components/ui/GlassModal";
import Spinner from "@/components/ui/Spinner";
import RecentlyViewed from "@/components/RecentlyViewed";
import StampCard from "@/components/loyalty/StampCard";
import SolenExclusiveBadge from "@/components/ui/SolenExclusiveBadge";
import type { Profile, Booking, SalonCard } from "@/lib/types";

interface LoyaltyCard {
  id: string;
  salon_id: string;
  stamps_needed: number;
  reward_text: string;
  stamps_collected: number;
  salons: { name: string; slug: string; cover_photo_url: string | null };
}

// ─────────────────────────────────────────
// Cancel modal (reused from account page)
// ─────────────────────────────────────────

function CancelModal({
  bookingId,
  salonName,
  startsAt,
  onClose,
  onCancelled,
}: {
  bookingId: string;
  salonName: string;
  startsAt: string;
  onClose: () => void;
  onCancelled: (id: string) => void;
}) {
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

  return (
    <GlassModal open onClose={onClose} title="Termin stornieren">
      <p className="text-sm text-s-ink/60 mb-1">
        {salonName} — {new Date(startsAt).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" })}{" "}
        um {new Date(startsAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-xs text-s-ink/40 mb-4">Kostenlose Stornierung bis 24h vor dem Termin.</p>

      <div className="mb-5">
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Grund (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="z. B. persönlicher Termin, Krankheit..."
          className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-s-ink/60 hover:bg-s-bg-surface transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size="sm" invert />}
          Stornieren
        </button>
      </div>
    </GlassModal>
  );
}

// ─────────────────────────────────────────
// Booking card
// ─────────────────────────────────────────

type BookingWithDetails = Booking & { salon_name: string; service_name: string; salon_slug?: string };

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  no_show: "Nicht erschienen",
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: "text-s-coral",
  cancelled: "text-s-coral",
  completed: "text-s-ink/50",
  no_show: "text-s-ink/30",
};

function hoursUntil(startsAt: string) {
  return (new Date(startsAt).getTime() - Date.now()) / 3_600_000;
}

function BookingCard({
  booking: b,
  locale,
  onCancel,
}: {
  booking: BookingWithDetails;
  locale: string;
  onCancel: (b: BookingWithDetails) => void;
}) {
  const canCancel = b.status === "confirmed" && hoursUntil(b.starts_at) > 24;
  const tooLate = b.status === "confirmed" && hoursUntil(b.starts_at) <= 24 && hoursUntil(b.starts_at) > 0;

  return (
    <div className="bg-white rounded-card border border-s-ink/5 p-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-medium text-sm text-s-ink">{b.salon_name}</p>
          <p className="text-xs text-s-ink/50 mt-0.5">{b.service_name}</p>
          <p className="text-xs text-s-ink/40 mt-1">
            {new Date(b.starts_at).toLocaleDateString("de-CH", {
              weekday: "short", day: "numeric", month: "short",
            })}{" "}
            um {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={["text-xs font-medium", STATUS_COLOR[b.status] ?? "text-s-ink/40"].join(" ")}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
      </div>

      {(b.status === "confirmed" || b.salon_slug) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
          {b.salon_slug && (
            <Link
              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&staff=${b.staff_member_id ?? ""}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-s-ink/10 text-xs text-s-ink/50 hover:text-s-coral hover:border-s-coral transition-colors"
            >
              <RotateCcw size={12} />
              Nochmal buchen
            </Link>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(b)}
              className="px-3 py-1.5 rounded-button border border-s-coral/30 text-xs text-s-coral hover:bg-s-coral/5 transition-colors"
            >
              Stornieren
            </button>
          )}

          {tooLate && (
            <div className="relative group">
              <button
                disabled
                className="px-3 py-1.5 rounded-button border border-s-ink/10 text-xs text-s-ink/20 cursor-not-allowed"
              >
                Stornieren
              </button>
              <div className="absolute bottom-full left-0 mb-1.5 w-44 bg-dark text-white text-xs rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Stornierung nicht mehr möglich (weniger als 24h)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Settings section
// ─────────────────────────────────────────

function SettingsSection({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Partial<Profile>) => Promise<void>;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [emailOn, setEmailOn] = useState(profile.notification_email ?? true);
  const [lang, setLang] = useState<"de" | "en" | "fr">(profile.locale ?? "de");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      display_name: name,
      bio: bio || null,
      avatar_url: avatar || null,
      notification_email: emailOn,
      locale: lang,
    });
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
          placeholder="Avatar-URL (optional)"
          className="flex-1 px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral resize-none"
        />
      </div>

      {/* Notifications */}
      <div className="pt-2 border-t border-s-ink/5 space-y-3">
        <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">E-Mail-Benachrichtigungen</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Buchungen</p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Bestätigungen, Erinnerungen, Stornierungen</p>
          </div>
          <button type="button" onClick={() => setEmailOn(!emailOn)}
            className={["relative w-11 h-6 rounded-full transition-colors shrink-0", emailOn ? "bg-s-coral" : "bg-s-sand dark:bg-white/10"].join(" ")}
            aria-pressed={emailOn}>
            <span className={["absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", emailOn ? "translate-x-5" : "translate-x-0"].join(" ")} />
          </button>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Angebote & Deals</p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Last-Minute und Sonderangebote</p>
          </div>
          <div className="relative w-11 h-6 rounded-full bg-s-sand dark:bg-white/10 shrink-0">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Neue Salons</p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Wenn neue Salons in deiner Nähe öffnen</p>
          </div>
          <div className="relative w-11 h-6 rounded-full bg-s-sand dark:bg-white/10 shrink-0">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
          </div>
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">Sprache</p>
        <div className="flex gap-2 flex-wrap">
          {(["de", "en", "fr", "it"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l as any)}
              className={[
                "px-4 py-2 rounded-button text-sm font-medium border transition-colors",
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
          className="px-5 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner size="sm" invert />}
          Speichern
        </button>
        {saved && <span className="text-sm text-s-coral font-medium">Gespeichert ✓</span>}
      </div>
    </form>
  );
}

// ─────────────────────────────────────────
// Main ProfilePage component
// ─────────────────────────────────────────

export default function ProfilePage() {
  const locale = useLocale();
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
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/bookings?limit=50").then((r) => r.json()).catch(() => ({ bookings: [] })),
      fetch("/api/profile/favorites").then((r) => r.ok ? r.json() : { salons: [] }).catch(() => ({ salons: [] })),
      fetch("/api/loyalty").then((r) => r.ok ? r.json() : { cards: [] }).catch(() => ({ cards: [] })),
    ])
      .then(([p, b, f, l]) => {
        if (!p?.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setProfile(p);
        setBookings(b.bookings ?? []);
        setFavorites(f.salons ?? []);
        setLoyaltyCards(l.cards ?? []);
      })
      .catch(() => router.push(`/${locale}/auth/login`))
      .finally(() => setLoading(false));
  }, [locale, router, pathname]);

  const handleSaveProfile = async (updates: Partial<Profile>) => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (profile) setProfile({ ...profile, ...updates });
  };

  const handleCancelled = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
  };

  const removeFav = async (salonId: string) => {
    await fetch("/api/profile/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salonId }),
    });
    setFavorites((prev) => prev.filter((s) => s.id !== salonId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
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
    <div className="min-h-screen bg-s-bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Cancel modal */}
        {cancelTarget && (
          <CancelModal
            bookingId={cancelTarget.id}
            salonName={cancelTarget.salon_name}
            startsAt={cancelTarget.starts_at}
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
            <p className="font-heading font-bold text-xl text-s-ink">{profile.display_name}</p>
            <p className="text-sm text-s-ink/40 mt-0.5">Mein Profil</p>
          </div>
          <Link
            href={`/${locale}/account/messages`}
            className="ml-auto relative p-2 rounded-button border border-s-ink/10 hover:border-s-coral transition-colors"
          >
            <MessageCircle size={18} className="text-s-ink/50" />
          </Link>
        </motion.div>

        {/* ── Section 1: Nächste Termine ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6"
        >
          <h2 className="font-heading font-bold text-base text-s-ink mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-s-coral" />
            Nächste Termine
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-card border border-s-ink/5 p-6 text-center text-s-ink/40">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Noch keine Buchungen</p>
              <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs mt-1 hover:underline inline-block">
                Termin buchen →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <BookingCard key={b.id} booking={b} locale={locale} onCancel={setCancelTarget} />
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Section 2: Vergangene Termine ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setPastOpen(!pastOpen)}
            className="w-full flex items-center justify-between font-heading font-bold text-base text-s-ink mb-3"
          >
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-s-ink/40" />
              Vergangene Termine ({past.length})
            </span>
            {pastOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {pastOpen && (
            <div className="space-y-3">
              {past.length === 0 ? (
                <p className="text-sm text-s-ink/40 py-4 text-center">Keine vergangenen Termine</p>
              ) : (
                past.map((b) => (
                  <BookingCard key={b.id} booking={b} locale={locale} onCancel={setCancelTarget} />
                ))
              )}
            </div>
          )}
        </motion.section>

        {/* ── Section 3: Favoriten ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="font-heading font-bold text-base text-s-ink mb-3 flex items-center gap-2">
            <Heart size={16} className="text-s-coral" />
            Favoriten
          </h2>
          {favorites.length === 0 ? (
            <div className="bg-white rounded-card border border-s-ink/5 p-6 text-center text-s-ink/40">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Noch keine Favoriten</p>
              <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs mt-1 hover:underline inline-block">
                Salons entdecken →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favorites.map((salon) => (
                <div key={salon.id} className="bg-white rounded-card border border-s-ink/5 overflow-hidden flex gap-3 p-3 group relative">
                  {salon.cover_photo_url && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-s-bg-sunken">
                      <Image src={salon.cover_photo_url} alt={salon.name} width={56} height={56} className="object-cover w-full h-full" loading="lazy" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/${locale}/salon/${salon.slug}`} className="font-medium text-sm text-s-ink hover:text-s-coral transition-colors truncate block">
                      {salon.name}
                    </Link>
                    <p className="text-xs text-s-ink/40 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{salon.quartier}
                    </p>
                    <p className="text-xs text-s-ink/50 flex items-center gap-1 mt-0.5">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      {salon.average_rating?.toFixed(1) ?? "–"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFav(salon.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-s-ink/20 hover:text-s-coral hover:bg-s-coral/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Aus Favoriten entfernen"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Section: Stempelkarten ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.17 }}
          className="mb-6"
        >
          <h2 className="font-heading font-bold text-base text-s-ink mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            Deine Stempelkarten
            <SolenExclusiveBadge featureDescription="Sammle Stempel bei jedem Besuch!" />
          </h2>
          {loyaltyCards.length === 0 ? (
            <div className="bg-white rounded-card border border-s-ink/5 p-6 text-center text-s-ink/40">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Du hast noch keine Stempel</p>
              <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs mt-1 hover:underline inline-block">
                Buche jetzt bei einem Salon!
              </Link>
            </div>
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

        {/* ── Section: Guthaben & Empfehlung ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-s-coral" />
            Guthaben & Empfehlung
          </h2>
          <div className="bg-white dark:bg-white/5 rounded-card border border-s-ink/5 dark:border-white/10 p-4 space-y-3">
            <Link
              href={`/${locale}/profile/referral`}
              className="flex items-center justify-between p-3 rounded-button bg-s-coral/5 border border-s-coral/15 hover:bg-s-coral/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-s-coral" />
                <div>
                  <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Freunde einladen</p>
                  <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">Beide erhalten CHF 10 Guthaben</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-s-coral group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.section>

        {/* ── Section 4: Einstellungen ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="font-heading font-bold text-base text-s-ink mb-3 flex items-center gap-2">
            <Settings size={16} className="text-s-ink/60" />
            Einstellungen
          </h2>
          <div className="bg-white rounded-card border border-s-ink/5 p-5">
            <SettingsSection profile={profile} onSave={handleSaveProfile} />
          </div>
        </motion.section>

        {/* ── Recently Viewed ── */}
        <RecentlyViewed />
      </div>
    </div>
  );
}
