/**
 * Exists-check: `npm run exists profile` ran this turn -> the real `/profile` route
 * (`app/[locale]/profile/page.tsx`), `AccountHub.tsx` (the client component it feeds),
 * and the sibling `_vb/loadProfileB.ts` loader (which already fetches this same seed
 * customer's identity/favorites/loyalty/vouchers for direction B). Distinct from that
 * file: this loader ALSO resolves a richer NEXT BOOKING row (salon photo/address,
 * service name+duration+price, staff name) that the real `/profile` page never needed
 * because its own hub only renders a date+time subline, not a hero card. `npm run
 * exists getBookingsC` / "next appointment hero" -> 0 hits for a loader shaped this way
 * (the closest, `bookings-list/_vc/getBookingsC.ts`, buckets a CUSTOMER'S FULL booking
 * list into three tabs for a different surface; this loader wants exactly ONE row plus
 * the wallet/vouchers/stamps/favorites counts the account hub itself renders).
 *
 * Grounded-in: app/[locale]/profile/page.tsx (the exact profile/favorites/loyalty/
 * vouchers query shapes this loader mirrors, scoped by profile id instead of a live
 * session), bookings-list/_vc/getBookingsC.ts (the admin-client + email-lookup +
 * per-process-cache pattern, copied verbatim), _shared/seedBooking.ts (the salon/
 * service/staff join shape for a hero card).
 *
 * Server-only, dev-route-gated. Uses the service-role admin client to read the SEED
 * CUSTOMER's (kunde@solen.ch) own real, live rows by email, the same justification
 * seedBooking.ts / seedSalon.ts / getBookingsC.ts already use: this never runs in a
 * real request path, only inside /dev/directions-0905/profile.
 *
 * Deliberately DOES NOT call Stripe. The task brief's hard-ban list names
 * "payment-methods" alongside create-payment-intent and Elements-with-a-live-key as a
 * Stripe call this pass must not make, even though `paymentMethods.list` spends no
 * money; the real `/profile/page.tsx` and the sibling `_vb/loadProfileB.ts` both call
 * `getStripe().paymentMethods.list(...)`, this file does not, on purpose. `wallet` is
 * returned as `null` (distinct from `[]`, "no cards saved") meaning "not checked this
 * pass", the same null-means-unknown pattern this file's own favorites/vouchers counts
 * already use for a genuine query failure, so the hub can omit the fact instead of
 * asserting a possibly-false "no card saved" / a specific count.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { localizedField } from "@/lib/i18n/localized-field";

const CUSTOMER_EMAIL = "kunde@solen.ch";

const NEXT_BOOKING_SELECT = `id, starts_at, ends_at, status,
  salon:salons(id, slug, name, address, cover_photo_url, categories),
  service:services(id, name_de, name_en, name_fr, name_it, duration_minutes, price),
  staff:staff_members(id, name)`;

export interface ProfileCNextAppointment {
  bookingId: string;
  /** Real DB value, already fetched by NEXT_BOOKING_SELECT above ("status") but not previously
   * exposed on this type (no consumer needed it before the round-2 kit StatusBadge, which must
   * colour-code a real status, never a hardcoded "confirmed"; added by the directions-0905-r2
   * profile/_lift builder, additive only, existing consumers of this type are unaffected). The
   * NEXT_BOOKING_SELECT filter above already restricts this to "confirmed" | "pending". */
  status: "confirmed" | "pending";
  startsAt: string;
  endsAt: string;
  salonName: string;
  salonSlug: string | null;
  salonAddress: string | null;
  salonCoverUrl: string | null;
  salonCategory: string | null;
  serviceName: string;
  durationMinutes: number | null;
  price: number | null;
  staffName: string | null;
}

export interface ProfileCData {
  displayName: string;
  avatarUrl: string | null;
  nextAppointment: ProfileCNextAppointment | null;
  favoritesCount: number | null;
  /** null = not checked this pass (Stripe call intentionally skipped, see header). */
  wallet: null;
  activeVouchersCount: number | null;
  stamps: { collected: number; needed: number } | null;
}

let cache: ProfileCData | null = null;

type RawNextBookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string | null;
  salon: unknown;
  service: unknown;
  staff: unknown;
};

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

const EMPTY: ProfileCData = {
  displayName: "Account",
  avatarUrl: null,
  nextAppointment: null,
  favoritesCount: null,
  wallet: null,
  activeVouchersCount: null,
  stamps: null,
};

export async function getProfileDataC(locale: string): Promise<ProfileCData> {
  if (cache) return cache;

  const supabase = createAdminSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("email", CUSTOMER_EMAIL)
    .maybeSingle();

  if (profileError) {
    console.error("[profile/_vc] profile lookup failed:", profileError);
    return EMPTY;
  }
  if (!profile) {
    console.error(`[profile/_vc] no profile found for ${CUSTOMER_EMAIL}`);
    return EMPTY;
  }

  const userId = profile.id;
  const nowIso = new Date().toISOString();

  const [nextBookingRes, favoritesCountRes, loyaltyRes, vouchersRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(NEXT_BOOKING_SELECT)
      .eq("user_id", userId)
      .in("status", ["confirmed", "pending"])
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle<RawNextBookingRow>(),
    supabase.from("favorites").select("salon_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("loyalty_cards")
      .select("id, stamps_needed, loyalty_stamps!inner(id, customer_id, stamped_at)")
      .eq("is_active", true)
      .eq("loyalty_stamps.customer_id", userId),
    supabase.from("vouchers").select("id, remaining_amount, redeemed_at, expires_at").eq("buyer_id", userId),
  ]);

  if (nextBookingRes.error) console.error("[profile/_vc] next booking fetch error:", nextBookingRes.error.message);
  if (favoritesCountRes.error) console.error("[profile/_vc] favorites count fetch error:", favoritesCountRes.error.message);
  if (loyaltyRes.error) console.error("[profile/_vc] loyalty fetch error:", loyaltyRes.error.message);
  if (vouchersRes.error) console.error("[profile/_vc] vouchers fetch error:", vouchersRes.error.message);

  const favoritesCount = favoritesCountRes.error ? null : (favoritesCountRes.count ?? 0);

  let nextAppointment: ProfileCNextAppointment | null = null;
  const bookingRow = nextBookingRes.data;
  if (bookingRow) {
    const salon = one<{
      id?: string; slug?: string; name?: string; address?: string;
      cover_photo_url?: string | null; categories?: string[] | null;
    }>(bookingRow.salon);
    const service = one<{
      name_de?: string; name_en?: string | null; name_fr?: string | null; name_it?: string | null;
      duration_minutes?: number | null; price?: number | null;
    }>(bookingRow.service);
    const staff = one<{ name?: string | null }>(bookingRow.staff);

    nextAppointment = {
      bookingId: bookingRow.id,
      // NEXT_BOOKING_SELECT filters .in("status", ["confirmed", "pending"]), so this is always
      // one of those two; the "as" narrows the raw `string | null` column type, it does not
      // invent a value.
      status: (bookingRow.status as "confirmed" | "pending" | null) ?? "confirmed",
      startsAt: bookingRow.starts_at,
      endsAt: bookingRow.ends_at,
      salonName: salon?.name || "",
      salonSlug: salon?.slug || null,
      salonAddress: salon?.address || null,
      salonCoverUrl: salon?.cover_photo_url || null,
      salonCategory: salon?.categories?.[0] || null,
      serviceName: localizedField(service as Record<string, unknown> | null, "name", locale) || "",
      durationMinutes: service?.duration_minutes ?? null,
      price: service?.price ?? null,
      staffName: staff?.name || null,
    };
  }

  type LoyaltyCardRow = { id: string; stamps_needed: number; loyalty_stamps: { id: string }[] };
  const loyaltyCards = ((loyaltyRes.data ?? []) as unknown as LoyaltyCardRow[])
    .map((c) => ({ needed: c.stamps_needed, collected: c.loyalty_stamps.length }))
    .filter((c) => c.collected > 0 && c.collected < c.needed)
    .sort((a, b) => (a.needed - a.collected) - (b.needed - b.collected));
  const stamps = loyaltyCards[0] ?? null;

  const now = new Date();
  const activeVouchersCount = vouchersRes.error
    ? null
    : (vouchersRes.data ?? []).filter((v) => {
        const isExpired = v.expires_at ? new Date(v.expires_at) < now : false;
        const isRedeemed = v.redeemed_at !== null;
        return !isExpired && !isRedeemed && (v.remaining_amount ?? 0) > 0;
      }).length;

  const avatarUrl = profile.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  const result: ProfileCData = {
    displayName: profile.display_name?.trim() || CUSTOMER_EMAIL.split("@")[0],
    avatarUrl,
    nextAppointment,
    favoritesCount,
    wallet: null,
    activeVouchersCount,
    stamps,
  };
  cache = result;
  return result;
}
