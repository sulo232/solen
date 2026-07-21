// mockup-ok: every value here traces to the owner-approved
// public/_mockups/pinterest-ref-solen/index.html (task brief names it explicitly as the
// complete spec, 2026-07-21). This file only changes DATA shape (page.tsx's job); the
// visual anatomy lives in app/[locale]/_components/profile/ProfileTabs.tsx.
//
// /profile: customer content hub, rebuilt into the owner-approved Pinterest-profile
// model. Two tabs only (Gespeichert / Termine, owner correction 2026-07-21 dropped the
// Looks tab). No next-appointment hero (owner killed it): the page is a pure content
// hub now.
// exists-check: `npm run exists profile` and `npm run exists ProfileTabs` ran this turn.
//
// Server component: auth guard plus ALL data fetching (past bookings, saved salons, a
// suggestion rail), passed as plain props to the client <ProfileTabs>
// (app/[locale]/_components/profile/ProfileTabs.tsx), which owns tab state, the search
// filter, the sort toggle, and rendering.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import ProfileTabs, {
  type ProfilePastBookingTile,
  type ProfileSavedSalonTile,
  type ProfileSuggestedSalon,
} from "@/app/[locale]/_components/profile/ProfileTabs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  // Account pages are private, keep them out of the index.
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Joined shapes. Supabase types to-one joins loosely (object | array); `one()` below
// normalizes both, same pattern the rest of the codebase uses for these joins.
type PastBookingSalon = { name?: string | null; slug?: string | null; cover_photo_url?: string | null };
type PastBookingService = { name_de?: string | null; name_en?: string | null };
type PastBookingRow = {
  id: string;
  salon_id: string;
  service_id: string;
  starts_at: string;
  price_paid: number | null;
  salon: PastBookingSalon | PastBookingSalon[] | null;
  service: PastBookingService | PastBookingService[] | null;
};

type SalonRow = {
  slug: string;
  name: string;
  cover_photo_url: string | null;
  gallery_urls: string[] | null;
  quartier: string | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/** Cover photo first, then up to 2 distinct gallery photos, for the collage tiles. Never
 *  fabricates a photo: an empty array means the tile falls back to the sunken placeholder. */
function buildTilePhotos(cover: string | null, gallery: string[] | null): string[] {
  const out: string[] = [];
  if (cover) out.push(cover);
  for (const url of gallery ?? []) {
    if (url && !out.includes(url)) out.push(url);
    if (out.length >= 3) break;
  }
  return out;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toSalonTile(s: SalonRow): { slug: string; name: string; photos: string[]; city: string | null } {
  return {
    slug: s.slug,
    name: s.name,
    photos: buildTilePhotos(s.cover_photo_url, s.gallery_urls),
    city: s.quartier ? capitalize(s.quartier) : null,
  };
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
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const [profileRes, pastBookingsRes, favoritesRes, suggestedRes] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle(),
    // Termine list: mirrors GET /api/bookings/user?tab=past's filter/order exactly, capped
    // to 20 (a profile-home preview, not the full paginated history at /profile/bookings).
    // salon_id/service_id (raw FKs) travel alongside the join so "Erneut buchen" can call
    // express-rebook without a second round trip.
    supabase
      .from("bookings")
      .select(
        "id, salon_id, service_id, starts_at, price_paid, salon:salons(name, slug, cover_photo_url), service:services(name_de, name_en)",
      )
      .eq("user_id", userId)
      .in("status", ["completed", "confirmed", "no_show"])
      .lt("starts_at", nowIso)
      .order("starts_at", { ascending: false })
      .limit(20),
    // Gespeichert tile grid: same two-step pattern as /profile/favorites/page.tsx
    // (favorites -> salon ids -> salons).
    supabase.from("favorites").select("salon_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    // "Neu für dich" discovery row (every tab): real active salons, top-rated first, same
    // shape as the search API's public listing so no fabricated data ever renders.
    supabase
      .from("salons")
      .select("slug, name, cover_photo_url, gallery_urls, quartier")
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(8),
  ]);

  if (profileRes.error) console.error("[ProfileHub] profile fetch error:", profileRes.error.message);
  if (pastBookingsRes.error) console.error("[ProfileHub] past bookings fetch error:", pastBookingsRes.error.message);
  if (favoritesRes.error) console.error("[ProfileHub] favorites fetch error:", favoritesRes.error.message);
  if (suggestedRes.error) console.error("[ProfileHub] suggested salons fetch error:", suggestedRes.error.message);

  const profile = profileRes.data;
  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const avatarUrl = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  // Termine tiles
  const pastBookings: ProfilePastBookingTile[] = ((pastBookingsRes.data ?? []) as PastBookingRow[])
    .map((b) => {
      const salon = one(b.salon);
      const service = one(b.service);
      if (!salon?.name) return null;
      const svcName = (service?.[`name_${locale}` as keyof PastBookingService] as string) || service?.name_de || service?.name_en || "";
      const d = new Date(b.starts_at);
      const zone = { timeZone: "Europe/Zurich" } as const;
      // "11. Juni" style (day + full locale month name), never a time (project rule).
      const dateLabel = d.toLocaleDateString(localeCode, { day: "numeric", month: "long", ...zone });
      return {
        id: b.id,
        salonId: b.salon_id,
        serviceId: b.service_id,
        salonSlug: salon.slug ?? null,
        salonName: salon.name ?? "",
        salonPhoto: salon.cover_photo_url ?? null,
        serviceName: svcName,
        dateLabel,
        price: b.price_paid,
      };
    })
    .filter((b): b is ProfilePastBookingTile => b !== null);

  // Gespeichert tiles
  const favIds = (favoritesRes.data ?? []).map((f) => f.salon_id);
  let savedSalons: ProfileSavedSalonTile[] = [];
  if (favIds.length > 0) {
    const { data: salonRows, error } = await supabase
      .from("salons")
      .select("id, slug, name, cover_photo_url, gallery_urls, quartier")
      .in("id", favIds)
      .eq("is_active", true);
    if (error) console.error("[ProfileHub] saved salons fetch error:", error.message);
    // `.in()` does not preserve id order, re-sort to the favorites (most-recent-first) order.
    const orderIndex = new Map(favIds.map((id, i) => [id, i]));
    savedSalons = (salonRows ?? [])
      .slice()
      .sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0))
      .map((s) => toSalonTile(s));
  }

  const suggestedSalons: ProfileSuggestedSalon[] = (suggestedRes.data ?? []).map((s) => toSalonTile(s));

  return (
    <main className="min-h-screen bg-white">
      <ProfileTabs
        locale={locale}
        avatarUrl={avatarUrl}
        displayName={displayName}
        pastBookings={pastBookings}
        savedSalons={savedSalons}
        suggestedSalons={suggestedSalons}
      />
    </main>
  );
}
