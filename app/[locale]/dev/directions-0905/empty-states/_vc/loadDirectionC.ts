/**
 * Exists-check: `npm run exists seedBooking` -> 1 hit (../../_shared/seedBooking.ts), which
 * loads ONE booking for the confirmation surface's fallback chain (any confirmed booking,
 * not scoped to a single customer). `npm run exists getSalonCardDataMap` -> 1 hit
 * (app/[locale]/_components/homepage/salonCardData.ts), reused directly below rather than
 * re-declared, same as app/[locale]/profile/favorites/page.tsx already does. Net-new: a
 * loader scoped to the SEED CUSTOMER (kunde@solen.ch) across four different tables
 * (bookings, salons, referrals/user_credits, discovery_items), which no existing dev loader
 * does; `seedBooking.ts` and `seedSalon.ts` are reused for their patterns (admin client,
 * dev-only, per-process cache) but not their query shapes.
 *
 * Server-only. Dev-only route (gated by this surface living under /dev/directions-0905/),
 * so reading the seed customer's own bookings/referrals/credits with the service-role admin
 * client (bypassing RLS) follows the identical justification seedBooking.ts already uses:
 * this never runs in a real request path. No row is ever written here, read-only throughout.
 *
 * Direction C ("fill the slot, with motion"): every empty state below is filled with REAL
 * rows for the real seed customer, never fabricated placeholders.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getSalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";
import { nameForLocale } from "@/lib/min-price-service";
import type { SalonCardProps } from "@/app/[locale]/_components/homepage/SalonCard";
import type { Booking } from "@/components-legacy/booking/BookingCard";

const SEED_CUSTOMER_EMAIL = "kunde@solen.ch";

export interface LookTileData {
  id: string;
  displayImage: string | null;
  alt: string;
  styleName: string | null;
}

export interface ReferralCardData {
  referralCode: string | null;
  friendsInvited: number;
  totalEarnedCHF: number;
}

export interface DirectionCData {
  rebookBookings: Booking[];
  nearbySalons: Array<SalonCardProps & { salonId: string }>;
  referral: ReferralCardData;
  looks: LookTileData[];
}

const cacheByLocale = new Map<string, DirectionCData>();

export async function getDirectionCData(locale: string): Promise<DirectionCData> {
  const cached = cacheByLocale.get(locale);
  if (cached) return cached;

  const admin = createAdminSupabaseClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", SEED_CUSTOMER_EMAIL)
    .maybeSingle();

  const [rebookBookings, referral, looks] = await Promise.all([
    profile ? loadRebookBookings(admin, profile.id, locale) : Promise.resolve([]),
    profile ? loadReferral(admin, profile.id) : Promise.resolve({ referralCode: null, friendsInvited: 0, totalEarnedCHF: 0 }),
    loadNewestLooks(admin),
  ]);

  const nearbySalons = await loadNearbySalons(admin, locale, profile?.id ?? null);

  const result: DirectionCData = { rebookBookings, nearbySalons, referral, looks };
  cacheByLocale.set(locale, result);
  return result;
}

/** Latest booking per distinct salon, most-recent salon first, capped at 2 (the seed
 * customer's "last two salons", per the brief). Any status is eligible (past bookings are
 * typically 'completed' or 'confirmed'-but-elapsed); only bookings with a resolvable
 * salon+service are usable since BookingCard needs both to render. */
async function loadRebookBookings(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  locale: string,
): Promise<Booking[]> {
  const { data: rows, error } = await admin
    .from("bookings")
    .select(
      `id, user_id, salon_id, service_id, slot_id, starts_at, ends_at, price_paid, status,
       is_first_visit, is_recurring,
       salons(id, slug, name, address, average_rating, review_count, cover_photo_url),
       services(id, name_de, name_en, name_fr, name_it, duration_minutes, price),
       staff_members(id, name, avatar_url)`,
    )
    .eq("user_id", userId)
    .not("salon_id", "is", null)
    .not("service_id", "is", null)
    // "Book again" only makes sense for a visit that actually happened: a completed
    // appointment, or a confirmed one whose time has passed (this seed data has no
    // separate "completed" sweep job running). A cancelled or no-show booking is
    // explicitly excluded, never offered as a rebooking prompt.
    .in("status", ["completed", "confirmed"])
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[directions-0905/empty-states/_vc] rebook bookings fetch failed:", error);
    return [];
  }

  const seenSalons = new Set<string>();
  const picked: Booking[] = [];
  for (const row of rows ?? []) {
    const salonId = row.salon_id as string;
    if (seenSalons.has(salonId)) continue;
    const salon = (Array.isArray(row.salons) ? row.salons[0] : row.salons) as Booking["salon"] | null;
    const service = (Array.isArray(row.services) ? row.services[0] : row.services) as Booking["service"] | null;
    if (!salon || !service) continue;
    seenSalons.add(salonId);
    const staff = (Array.isArray(row.staff_members) ? row.staff_members[0] : row.staff_members) as Booking["staff"] | null;
    picked.push({
      id: row.id,
      user_id: row.user_id ?? userId,
      salon_id: salonId,
      service_id: row.service_id as string,
      slot_id: (row.slot_id as string) ?? "",
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      price_paid: row.price_paid ?? 0,
      status: (row.status as Booking["status"]) ?? "completed",
      is_first_visit: row.is_first_visit ?? undefined,
      is_recurring: row.is_recurring ?? undefined,
      salon,
      service,
      staff: staff ?? undefined,
    });
    if (picked.length >= 2) break;
  }
  void locale;
  return picked;
}

/** 4 real, live, top-rated active salons (same "top rated" query shape
 * app/[locale]/profile/favorites/page.tsx already runs for its own empty-state rail),
 * mapped onto the real homepage SalonCard's prop shape via the shared batch fetch. isSaved
 * reflects the seed customer's REAL favorites, never a hardcoded false. */
async function loadNearbySalons(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  locale: string,
  userId: string | null,
): Promise<Array<SalonCardProps & { salonId: string }>> {
  const { data: topSalons } = await admin
    .from("salons")
    .select("id, slug, categories")
    .eq("is_active", true)
    .order("average_rating", { ascending: false })
    .limit(4);

  const ids = (topSalons ?? []).map((s) => s.id as string);
  if (ids.length === 0) return [];

  const [cardDataMap, favoriteIds] = await Promise.all([
    getSalonCardDataMap(ids),
    userId
      ? admin
          .from("favorites")
          .select("salon_id")
          .eq("user_id", userId)
          .in("salon_id", ids)
          .then(({ data }) => new Set((data ?? []).map((f) => f.salon_id as string)))
      : Promise.resolve(new Set<string>()),
  ]);

  return ids
    .filter((id) => cardDataMap[id]?.slug)
    .map((id) => {
      const d = cardDataMap[id];
      return {
        salonId: id,
        slug: d.slug as string,
        name: d.name ?? "",
        rating: d.rating,
        reviewCount: d.reviewCount,
        photoUrl: d.photoUrl ?? undefined,
        category: d.category ?? "coiffeur",
        variant: "service" as const,
        priceFromCHF: d.priceFromCHF,
        priceFromService: nameForLocale(d.priceFromServiceNames, locale),
        address: d.address ?? undefined,
        postalCode: d.postalCode ?? undefined,
        city: d.city ?? undefined,
        citySelected: Boolean(d.address),
        isSaved: favoriteIds.has(id), // real favorites row lookup, never fabricated.
      };
    });
}

/** Same computation /api/referral runs (referrals + user_credits), read directly through
 * the admin client instead of the route, so the mockup never depends on a forwarded
 * session cookie. Never mints a new referral code (that route's fallback INSERTs; this
 * loader is read-only), so a customer with no pending row yet shows a null code rather
 * than writing one. */
async function loadReferral(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<ReferralCardData> {
  const [{ data: pendingReferral }, { data: completedReferrals }, { data: credits }] = await Promise.all([
    admin
      .from("referrals")
      .select("referral_code")
      .eq("referrer_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("referrals").select("id").eq("referrer_id", userId).eq("status", "completed"),
    admin.from("user_credits").select("remaining, expires_at").eq("user_id", userId),
  ]);

  const nowIso = new Date().toISOString();
  const totalEarnedCHF = (credits ?? [])
    .filter((c) => !c.expires_at || c.expires_at > nowIso)
    .reduce((sum, c) => sum + (c.remaining ?? 0), 0);

  return {
    referralCode: pendingReferral?.referral_code ?? null,
    friendsInvited: (completedReferrals ?? []).length,
    totalEarnedCHF,
  };
}

/** 4 newest published looks, ordered strictly by created_at desc (not the feed RPC's
 * rank/sort_order composite, since the brief asks for "newest", not "for you"). Mirrors
 * ItemCard.tsx's own displayImage resolution (tiktok source -> the refresh-proxy route,
 * else the stored image_url/thumbnail) so a tiktok thumbnail that has since expired still
 * resolves through the same live proxy the real Inspo feed uses. */
async function loadNewestLooks(admin: ReturnType<typeof createAdminSupabaseClient>): Promise<LookTileData[]> {
  const { data: rows, error } = await admin
    .from("discovery_items")
    .select("id, image_url, tiktok_url, tiktok_thumbnail_url, style_name, alt_text")
    .eq("status", "published")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("[directions-0905/empty-states/_vc] newest looks fetch failed:", error);
    return [];
  }

  return (rows ?? []).map((row) => ({
    id: row.id as string,
    displayImage: row.tiktok_url ? `/api/discovery/thumb/${row.id}` : (row.image_url as string | null) ?? (row.tiktok_thumbnail_url as string | null),
    alt: (row.alt_text as string | null) || (row.style_name as string | null) || "",
    styleName: (row.style_name as string | null) ?? null,
  }));
}
