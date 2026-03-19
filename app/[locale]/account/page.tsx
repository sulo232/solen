"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Calendar, Heart, MessageCircle, User, Star, MapPin, X, RotateCcw, Bell } from "lucide-react";
import { motion } from "framer-motion";
import ExpandableTabs from "@/components/ui/ExpandableTabs";
import GlassModal from "@/components/ui/GlassModal";
import Spinner from "@/components/ui/Spinner";
import type { Profile, Booking, SalonCard } from "@/lib/types";

// ─────────────────────────────────────────
// Cancel modal
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
      <p className="text-sm text-dark/60 mb-1">
        {salonName} — {new Date(startsAt).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" })}{" "}
        um {new Date(startsAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-xs text-dark/40 mb-4">Kostenlose Stornierung bis 24h vor dem Termin.</p>

      <div className="mb-5">
        <label className="block text-xs font-medium text-dark/50 mb-1">Grund (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="z. B. persönlicher Termin, Krankheit..."
          className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-s-coral resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-button border border-gray-200 text-sm text-dark/60 hover:bg-gray-50 transition-colors"
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
// Bookings tab
// ─────────────────────────────────────────

function BookingsTab({ locale }: { locale: string }) {
  const [bookings, setBookings] = useState<(Booking & { salon_name: string; service_name: string; salon_slug?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<(typeof bookings)[0] | null>(null);

  useEffect(() => {
    fetch("/api/bookings?limit=20")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Spinner size="sm" /></div>;

  if (!bookings.length) {
    return (
      <div className="text-center py-12 text-dark/40">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-sm">Keine Termine</p>
        <a href={`/${locale}/coiffeur`} className="text-s-coral text-xs mt-1 hover:underline inline-block">
          Termin buchen →
        </a>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    confirmed: "Bestätigt",
    cancelled: "Storniert",
    completed: "Abgeschlossen",
    no_show: "Nicht erschienen",
  };
  const statusColor: Record<string, string> = {
    confirmed: "text-s-coral",
    cancelled: "text-s-coral",
    completed: "text-dark/50",
    no_show: "text-dark/30",
  };

  const hoursUntil = (startsAt: string) =>
    (new Date(startsAt).getTime() - Date.now()) / 3_600_000;

  const handleCancelled = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => b.id === id ? { ...b, status: "cancelled" as const } : b)
    );
  };

  return (
    <>
      {cancelTarget && (
        <CancelModal
          bookingId={cancelTarget.id}
          salonName={cancelTarget.salon_name}
          startsAt={cancelTarget.starts_at}
          onClose={() => setCancelTarget(null)}
          onCancelled={handleCancelled}
        />
      )}
      <div className="space-y-3 py-4">
        {bookings.map((b) => {
          const canCancel = b.status === "confirmed" && hoursUntil(b.starts_at) > 24;
          const tooLate = b.status === "confirmed" && hoursUntil(b.starts_at) <= 24 && hoursUntil(b.starts_at) > 0;

          return (
            <div key={b.id} className="bg-white rounded-card border border-gray-100 p-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-sm text-dark">{b.salon_name}</p>
                  <p className="text-xs text-dark/50 mt-0.5">{b.service_name}</p>
                  <p className="text-xs text-dark/40 mt-1">
                    {new Date(b.starts_at).toLocaleDateString("de-CH", {
                      weekday: "short", day: "numeric", month: "short",
                    })}{" "}
                    um {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={["text-xs font-medium", statusColor[b.status] ?? "text-dark/40"].join(" ")}>
                  {statusLabel[b.status] ?? b.status}
                </span>
              </div>

              {/* Action row */}
              {(b.status === "confirmed" || b.salon_slug) && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  {b.salon_slug && (
                    <a
                      href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&staff=${b.staff_member_id ?? ""}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-gray-200 text-xs text-dark/50 hover:text-s-coral hover:border-s-coral transition-colors"
                    >
                      <RotateCcw size={12} />
                      Nochmal buchen
                    </a>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setCancelTarget(b)}
                      className="px-3 py-1.5 rounded-button border border-s-coral/30 text-xs text-s-coral hover:bg-s-coral/5 transition-colors"
                    >
                      Stornieren
                    </button>
                  )}

                  {tooLate && (
                    <div className="relative group">
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-button border border-gray-200 text-xs text-dark/20 cursor-not-allowed"
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
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────
// Favorites tab
// ─────────────────────────────────────────

function FavoritesTab({ locale }: { locale: string }) {
  const [favorites, setFavorites] = useState<SalonCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/favorites")
      .then((r) => r.json())
      .then((d) => setFavorites(d.salons ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFav = async (salonId: string) => {
    await fetch("/api/profile/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salonId }),
    });
    setFavorites((prev) => prev.filter((s) => s.id !== salonId));
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner size="sm" /></div>;

  if (!favorites.length) {
    return (
      <div className="text-center py-12 text-dark/40">
        <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-sm">Keine Favoriten</p>
        <a href={`/${locale}/coiffeur`} className="text-s-coral text-xs mt-1 hover:underline inline-block">
          Salons entdecken →
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
      {favorites.map((salon) => (
        <div key={salon.id} className="bg-white rounded-card border border-gray-100 overflow-hidden flex gap-3 p-3 group relative">
          {salon.cover_photo_url && (
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
              <Image src={salon.cover_photo_url} alt={salon.name} width={64} height={64} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <a href={`/${locale}/salon/${salon.slug}`} className="font-medium text-sm text-dark hover:text-s-coral transition-colors truncate block">
              {salon.name}
            </a>
            <p className="text-xs text-dark/40 flex items-center gap-1 mt-0.5">
              <MapPin size={10} />{salon.quartier}
            </p>
            <p className="text-xs text-dark/50 flex items-center gap-1 mt-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              {salon.average_rating.toFixed(1)}
            </p>
          </div>
          <button
            onClick={() => toggleFav(salon.id)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-dark/20 hover:text-s-coral hover:bg-s-coral/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Aus Favoriten entfernen"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Profile tab
// ─────────────────────────────────────────

function ProfileTab({ profile, onSave }: { profile: Profile; onSave: (p: Partial<Profile>) => Promise<void> }) {
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ display_name: name, bio: bio || null, avatar_url: avatar || null });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md py-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-s-coral/10 overflow-hidden shrink-0 flex items-center justify-center text-2xl font-heading text-s-coral">
          {avatar ? (
            <Image src={avatar} alt="" width={64} height={64} className="object-cover w-full h-full" />
          ) : (
            name[0] ?? "👤"
          )}
        </div>
        <input
          type="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="Avatar-URL (optional)"
          className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-s-coral"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-s-coral"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-s-coral resize-none"
        />
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
// Notifications tab
// ─────────────────────────────────────────

function NotificationsTab({ profile, onSave }: { profile: Profile; onSave: (p: Partial<Profile>) => Promise<void> }) {
  const router = useRouter();
  const locale = useLocale();

  const [emailOn, setEmailOn] = useState(profile.notification_email ?? true);
  const [lang, setLang] = useState<"de" | "en" | "fr">(profile.locale ?? "de");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      notification_email: emailOn,
      locale: lang,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // redirect to new locale if changed
    if (lang !== locale) {
      const newPath = window.location.pathname.replace(`/${locale}`, `/${lang}`);
      router.push(newPath + window.location.search);
    }
  };

  return (
    <div className="max-w-md py-4 space-y-6">
      {/* Email toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-dark">E-Mail-Benachrichtigungen</p>
          <p className="text-xs text-dark/40 mt-0.5">Buchungsbestätigungen, Erinnerungen, Nachrichten</p>
        </div>
        <button
          onClick={() => setEmailOn(!emailOn)}
          className={[
            "relative w-11 h-6 rounded-full transition-colors shrink-0",
            emailOn ? "bg-s-coral" : "bg-gray-200",
          ].join(" ")}
          aria-pressed={emailOn}
        >
          <span
            className={[
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
              emailOn ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Language selector */}
      <div>
        <p className="text-sm font-medium text-dark mb-2">Sprache</p>
        <div className="flex gap-2">
          {(["de", "en", "fr"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={[
                "px-4 py-2 rounded-button text-sm font-medium border transition-colors",
                lang === l
                  ? "bg-s-coral text-white border-s-coral"
                  : "border-gray-200 text-dark/60 hover:border-s-coral hover:text-s-coral",
              ].join(" ")}
            >
              {l === "de" ? "Deutsch" : l === "en" ? "English" : "Français"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner size="sm" invert />}
          Speichern
        </button>
        {saved && <span className="text-sm text-s-coral font-medium">Gespeichert ✓</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main account page
// ─────────────────────────────────────────

export default function AccountPage() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (!p?.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setProfile(p);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  const tabs = [
    {
      id: "bookings",
      label: "Termine",
      icon: <Calendar size={14} />,
      content: <BookingsTab locale={locale} />,
    },
    {
      id: "favorites",
      label: "Favoriten",
      icon: <Heart size={14} />,
      content: <FavoritesTab locale={locale} />,
    },
    {
      id: "messages",
      label: "Nachrichten",
      icon: <MessageCircle size={14} />,
      content: (
        <div className="py-4">
          <a
            href={`/${locale}/account/messages`}
            className="inline-flex items-center gap-2 text-sm text-s-coral hover:underline"
          >
            <MessageCircle size={14} />
            Zur Nachrichten-Übersicht →
          </a>
        </div>
      ),
    },
    {
      id: "profile",
      label: "Profil",
      icon: <User size={14} />,
      content: <ProfileTab profile={profile} onSave={handleSaveProfile} />,
    },
    {
      id: "notifications",
      label: "Benachrichtigungen",
      icon: <Bell size={14} />,
      content: <NotificationsTab profile={profile} onSave={handleSaveProfile} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-14 h-14 rounded-full bg-s-coral/10 overflow-hidden flex items-center justify-center text-xl font-heading text-s-coral shrink-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              profile.display_name[0] ?? "?"
            )}
          </div>
          <div>
            <p className="font-heading font-bold text-xl text-dark">{profile.display_name}</p>
            <p className="text-sm text-dark/40 mt-0.5">Mein Konto</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-card shadow-card"
        >
          <ExpandableTabs tabs={tabs} defaultTab="bookings" />
        </motion.div>
      </div>
    </div>
  );
}
