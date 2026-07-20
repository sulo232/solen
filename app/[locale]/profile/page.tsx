// /profile: customer content hub, rebuilt into the owner-approved D1 Pinterest-profile
// model (2026-07-20/21, public/_mockups/sweep-profile-pinterest/index.html, D1 pane).
// exists-check: `npm run exists profile` and `npm run exists ProfileTabs` ran this turn.
// The page is now CONTENT-ONLY: the old management rows (Haarprofil, Formulare,
// Einstellungen, Hilfe, Benachrichtigungen, Treue, Stempel, Einladen, Profil bearbeiten)
// and sign-out are GONE from here, they now live in the settings hub (/profile/settings,
// already rebuilt with its own identity block + edit-profile pill).
//
// Server component: auth guard plus ALL data fetching (next-booking hero, past bookings,
// saved salons, the empty-state rail), passed as plain props to the new client
// <ProfileTabs> (app/[locale]/_components/profile/ProfileTabs.tsx), which owns tab state,
// the search filter, and rendering.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import ProfileTabs, {
  type ProfileHeroData,
  type ProfilePastBookingTile,
  type ProfileSavedSalonTile,
} from "@/app/[locale]/_components/profile/ProfileTabs";
import type { EmptyRailSalon } from "@/app/[locale]/_components/profile/EmptyStateDiscovery";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  // Account pages are private, keep them out of the index.
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Joined shapes. Supabase types to-one joins loosely (object | array); `one()` below
// normalizes both, same pattern the hero query already used pre-rebuild.
type JoinedSalon = { slug?: string | null; name?: string | null; address?: string | null };
type JoinedService = { name_de?: string | null; name_en?: string | null; name_fr?: string | null; name_it?: string | null; duration_minutes?: number | null };
type NextBooking = {
  starts_at: string;
  ends_at: string | null;
  price_paid: number | null;
  salon: JoinedSalon | JoinedSalon[] | null;
  service: JoinedService | JoinedService[] | null;
};

type PastBookingSalon = { name?: string | null; cover_photo_url?: string | null };
type PastBookingService = { name_de?: string | null; name_en?: string | null };
type PastBookingRow = {
  id: string;
  starts_at: string;
  salon: PastBookingSalon | PastBookingSalon[] | null;
  service: PastBookingService | PastBookingService[] | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile`)}`);
  }

  const userId = user.id;
  const nowIso = new Date().toISOString();

  const [profileRes, nextBookingRes, pastBookingsRes, favoritesRes, topSalonsRes] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle(),
    // The hero: the single next confirmed booking (mirrors /api/bookings/user?tab=upcoming).
    supabase
      .from("bookings")
      // services has only name_de/name_en in this DB (schema drift), fr/it fall back, same as BookingCard.
      .select("starts_at, ends_at, price_paid, salon:salons(slug, name, address), service:services(name_de, name_en, duration_minutes)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Termine tile grid: mirrors GET /api/bookings/user?tab=past's filter/order exactly,
    // capped to 20 (a profile-home preview, not the full paginated history at
    // /profile/bookings). name_en added alongside the task's name_de so the tile's
    // service line is locale-aware, not hardcoded German (this page must serve de/en/fr/it).
    supabase
      .from("bookings")
      .select("id, starts_at, salon:salons(name, cover_photo_url), service:services(name_de, name_en)")
      .eq("user_id", userId)
      .in("status", ["completed", "confirmed", "no_show"])
      .lt("starts_at", nowIso)
      .order("starts_at", { ascending: false })
      .limit(20),
    // Gespeichert tile grid: same two-step pattern as /profile/favorites/page.tsx
    // (favorites -> salon ids -> salons), a lighter column list since the tile here
    // is photo+name only (no price/rating shown).
    supabase.from("favorites").select("salon_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    // Real rail salons for the Looks tab's EmptyStateDiscovery (mirrors favorites/looks pages).
    supabase
      .from("salons")
      .select("slug, name, cover_photo_url, average_rating, review_count, quartier")
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(6),
  ]);

  if (profileRes.error) console.error("[ProfileHub] profile fetch error:", profileRes.error.message);
  if (nextBookingRes.error) console.error("[ProfileHub] next booking fetch error:", nextBookingRes.error.message);
  if (pastBookingsRes.error) console.error("[ProfileHub] past bookings fetch error:", pastBookingsRes.error.message);
  if (favoritesRes.error) console.error("[ProfileHub] favorites fetch error:", favoritesRes.error.message);
  if (topSalonsRes.error) console.error("[ProfileHub] top salons fetch error:", topSalonsRes.error.message);

  const profile = profileRes.data;
  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const avatarUrl = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  // ── next-appointment hero data (raw, locale-independent; ProfileTabs translates it) ──
  const nb = (nextBookingRes.data as NextBooking | null) ?? null;
  const nbSalon = one(nb?.salon);
  const nbService = one(nb?.service);
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  let hero: ProfileHeroData | null = null;
  if (nb && nbSalon) {
    const zone = { timeZone: "Europe/Zurich" } as const;
    const sd = new Date(nb.starts_at);
    const dur = nb.ends_at ? Math.round((new Date(nb.ends_at).getTime() - sd.getTime()) / 60000) : (nbService?.duration_minutes ?? 0);
    const svcName = (nbService?.[`name_${locale}` as keyof JoinedService] as string) || nbService?.name_de || nbService?.name_en || "";
    hero = {
      dow: sd.toLocaleDateString(localeCode, { weekday: "short", ...zone }),
      day: sd.toLocaleDateString(localeCode, { day: "2-digit", ...zone }),
      mon: sd.toLocaleDateString(localeCode, { month: "short", ...zone }),
      time: sd.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit", hour12: false, ...zone }),
      salonName: nbSalon.name || "",
      serviceName: svcName,
      durationMinutes: dur || null,
      address: nbSalon.address || null,
      price: nb.price_paid,
    };
  }

  // ── Termine tiles ──
  const pastBookings: ProfilePastBookingTile[] = ((pastBookingsRes.data ?? []) as PastBookingRow[])
    .map((b) => {
      const salon = one(b.salon);
      const service = one(b.service);
      if (!salon?.name) return null;
      const svcName = (service?.[`name_${locale}` as keyof PastBookingService] as string) || service?.name_de || service?.name_en || "";
      const d = new Date(b.starts_at);
      const zone = { timeZone: "Europe/Zurich" } as const;
      const day = d.toLocaleDateString("de-CH", { day: "2-digit", ...zone });
      const month = d.toLocaleDateString("de-CH", { month: "2-digit", ...zone });
      return {
        id: b.id,
        salonName: salon.name ?? "",
        salonPhoto: salon.cover_photo_url ?? null,
        serviceName: svcName,
        dateLabel: `${day}.${month}.`,
      };
    })
    .filter((b): b is ProfilePastBookingTile => b !== null);

  // ── Gespeichert tiles ──
  const favIds = (favoritesRes.data ?? []).map((f) => f.salon_id);
  let savedSalons: ProfileSavedSalonTile[] = [];
  if (favIds.length > 0) {
    const { data: salonRows, error } = await supabase
      .from("salons")
      .select("id, slug, name, cover_photo_url")
      .in("id", favIds)
      .eq("is_active", true);
    if (error) console.error("[ProfileHub] saved salons fetch error:", error.message);
    // `.in()` does not preserve id order, re-sort to the favorites (most-recent-first) order.
    const orderIndex = new Map(favIds.map((id, i) => [id, i]));
    savedSalons = (salonRows ?? [])
      .slice()
      .sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0))
      .map((s) => ({ slug: s.slug, name: s.name, photo: s.cover_photo_url }));
  }

  const emptyRailSalons: EmptyRailSalon[] = topSalonsRes.data ?? [];

  return (
    <main className="min-h-screen bg-white">
      <ProfileTabs
        locale={locale}
        avatarUrl={avatarUrl}
        displayName={displayName}
        hero={hero}
        pastBookings={pastBookings}
        savedSalons={savedSalons}
        emptyRailSalons={emptyRailSalons}
      />
    </main>
  );
}
