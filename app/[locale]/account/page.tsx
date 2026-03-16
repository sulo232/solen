"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Calendar, Heart, MessageCircle, User, Star, MapPin, X } from "lucide-react";
import ExpandableTabs from "@/components/ui/ExpandableTabs";
import Spinner from "@/components/ui/Spinner";
import type { Profile, Booking, SalonCard } from "@/lib/types";

// ─────────────────────────────────────────
// Bookings tab
// ─────────────────────────────────────────

function BookingsTab({ locale }: { locale: string }) {
  const [bookings, setBookings] = useState<(Booking & { salon_name: string; service_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

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
        <a href={`/${locale}/coiffeur`} className="text-teal text-xs mt-1 hover:underline inline-block">
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
    confirmed: "text-teal",
    cancelled: "text-coral",
    completed: "text-dark/50",
    no_show: "text-dark/30",
  };

  return (
    <div className="space-y-3 py-4">
      {bookings.map((b) => (
        <div key={b.id} className="bg-white rounded-card border border-gray-100 p-4 flex justify-between items-start gap-4">
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
      ))}
    </div>
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
        <a href={`/${locale}/coiffeur`} className="text-teal text-xs mt-1 hover:underline inline-block">
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
            <a href={`/${locale}/salon/${salon.slug}`} className="font-medium text-sm text-dark hover:text-teal transition-colors truncate block">
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
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-dark/20 hover:text-coral hover:bg-coral/10 transition-colors opacity-0 group-hover:opacity-100"
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
        <div className="w-16 h-16 rounded-full bg-teal/10 overflow-hidden shrink-0 flex items-center justify-center text-2xl font-heading text-teal">
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
          className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-dark/50 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!name || saving}
          className="px-5 py-2.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner size="sm" invert />}
          Speichern
        </button>
        {saved && <span className="text-sm text-teal font-medium">Gespeichert ✓</span>}
      </div>
    </form>
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
            className="inline-flex items-center gap-2 text-sm text-teal hover:underline"
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
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-teal/10 overflow-hidden flex items-center justify-center text-xl font-heading text-teal shrink-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              profile.display_name[0] ?? "👤"
            )}
          </div>
          <div>
            <p className="font-heading font-bold text-xl text-dark">{profile.display_name}</p>
            <p className="text-sm text-dark/40 mt-0.5">Mein Konto</p>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card">
          <ExpandableTabs tabs={tabs} defaultTab="bookings" />
        </div>
      </div>
    </div>
  );
}
