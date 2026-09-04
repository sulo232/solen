import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import {
  computeOpenStatus,
  nowInTimezone,
  type SalonDetail,
  type OpenStatus,
  type DayKey,
} from "@/app/[locale]/_components/salon/_shared";

const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface SalonDetailWithStatus {
  salon: SalonDetail;
  /** Computed ONCE server-side (salon's own timezone) to avoid the SSR/client
   * hydration mismatch that occurs when computeOpenStatus() / new Date() run
   * again during client render (2026-07-04 hydration fix). */
  openStatus: OpenStatus;
  /** Day-of-week key (salon's local time) for "today" row highlighting. */
  todayKey: DayKey;
}

/**
 * Ring 5b: like loadSalonDetail below, but also returns whether this response is the
 * owner's own privileged view (moderation fields exposed, and/or a hidden salon
 * (inactive, unlisted, or test) that a public visitor would get a 404 for instead).
 * GET /api/salons/[slug] uses
 * `isOwnerView` to decide CDN caching: only the non-owner (public) response is safe to
 * edge-cache, because Netlify's cache key is the slug URL alone and that same URL can
 * otherwise return two very different payloads depending on who's asking (see the
 * caching note in app/api/salons/[slug]/route.ts).
 */
export async function loadSalonDetailWithAccess(
  slug: string,
): Promise<{ salon: SalonDetail; isOwnerView: boolean } | null> {
  const supabase = await createServerSupabaseClient();
  // Cheap cookie-presence guard (same pattern as /api/bookings/user and
  // /api/discovery/feed): a real session always carries an "sb-" prefixed cookie
  // (Supabase SSR auth cookie naming). Skip the auth.getUser() round-trip entirely
  // when it's absent (the hot anonymous PDP path); user stays null, identical to what
  // a verified-null user yields today. next/headers cookies() is valid in both call
  // paths (the page.tsx server component and the API route). getUser() (not
  // getSession()) verifies the JWT against the Supabase Auth server rather than
  // trusting the client-supplied cookie's claims.
  const { cookies } = await import("next/headers");
  let hasSbCookie = false;
  try {
    hasSbCookie = (await cookies()).getAll().some((c) => c.name.startsWith("sb-"));
  } catch {
    hasSbCookie = false;
  }
  const { data: { user } } = hasSbCookie
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  // The slug param may be a UUID (owner settings page passes salon.id) or a slug.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  // Explicit public column list (same rationale as the API route): this is exactly
  // the set the PDP consumers read (SalonDetail type + section components), not the
  // full 98-column select("*") which would ship stripe_account_id / search_doc /
  // score_details etc. to anonymous PDP visitors.
  const { data: salon, error } = await supabase
    .from("salons")
    .select(
      // city_id + cities(...) added for A6-address-locality (2026-07-27): the
      // salon's real city, joined via the salons.city_id -> cities.id FK, so
      // lib/seo.ts generateSalonSchema can stop hardcoding "Basel".
      "id, owner_id, is_active, listed_on_marketplace, is_test, name, slug, description_de, description_en, about_text_de, about_text_en, about_text_fr, about_text_it, categories, quartier, address, postal_code, city_id, cities(name_de, name_en, name_fr, name_it), latitude, longitude, phone, website_url, instagram_url, tiktok_url, cover_photo_url, gallery_urls, opening_hours, average_rating, review_count, last_minute_discount_percent, accepts_online_payment, free_cancel_hours, booking_confirmation_mode, instant_booking_enabled, pet_friendly, kid_friendly, wheelchair_accessible, near_public_transport, lgbtq_friendly, woman_owned, family_owned, student_discount, wifi_friendly, is_featured, parent_salon_id, walkin_enabled, timezone, verification_warnings, warning_count, frozen_at, frozen_reason"
    )
    .eq(isUuid ? "id" : "slug", slug)
    .single();

  if (error || !salon) return null;

  // Regular users can only see active, listed, non-test salons. Owner/Admin can see
  // hidden ones (pending, unlisted, or frozen). Same three-column visibility gate the
  // ~15 listing/search routes already apply (is_active AND listed_on_marketplace IS NOT
  // FALSE AND NOT is_test, e.g. app/api/salons/route.ts:171-172); this loader was the one
  // place still missing it, documented as a known gap in
  // _tasks/INCOMPLETE_FEATURES.md:243. `listed_on_marketplace` is checked with
  // `=== false`, not a bare falsy check, so `null` (not-yet-set on older rows) still
  // counts as visible, the same "IS NOT FALSE" contract app/api/salon/retail/route.ts
  // documents.
  const isHidden =
    !salon.is_active || salon.listed_on_marketplace === false || salon.is_test === true;
  const isOwner = user?.id === salon.owner_id;
  // The comment above promised an admin branch since this function was written, but the
  // check was owner-only, so an admin could not open a pending salon's storefront , the
  // fastest way to judge a signup, and the owner's ask on 2026-07-27 ("as admin we can see
  // all details n stuff"). One extra query, and only for a signed-in user looking at a
  // salon that is not theirs and not currently visible, so the public path is untouched.
  let isAdminViewer = false;
  if (!isOwner && isHidden && user?.id) {
    const { data: viewerProfile } = await createAdminSupabaseClient()
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    isAdminViewer = viewerProfile?.role === "admin";
  }
  if (!isOwner && !isAdminViewer && isHidden) return null;

  // Fetch related data in parallel
  const [servicesRes, staffRes, reviewsRes] = await Promise.all([
    supabase
      .from("services")
      .select(
        "id, salon_id, name_de, name_en, description_de, description_en, price, duration_minutes, category, subcategory, is_active, sort_order, photo_urls, suitable_for, suitable_gender, buffer_minutes, curing_minutes, processing_minutes, finishing_minutes, material_type, station_required, daily_limit_per_staff, reminder_cycle_days, created_at"
      )
      .eq("salon_id", salon.id)
      .eq("is_active", true),
    supabase
      .from("staff_members")
      .select("id, name, avatar_url, specialties, languages, average_rating, review_count")
      .eq("salon_id", salon.id)
      .eq("is_active", true),
    // Reviews via the service-role client: profiles RLS (rightly) blocks anon reads,
    // which nulled every reviewer name for logged-out visitors. The server exposes
    // ONLY display_name + avatar_url through this select, no broader profile access.
    // review_replies IS embedded (round 10 Y3: the owner's public reply now renders
    // inline on the PDP too, not only on the dedicated reviews page) , is_public is
    // selected so the UI can gate rendering (this query runs on the service-role
    // client, which bypasses the review_replies RLS, so the app layer must do that
    // filtering itself, same pattern the dedicated reviews page already uses). No
    // review_photos embed: only the dedicated reviews page shows photos.
    createAdminSupabaseClient()
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(display_name, avatar_url), review_replies(reply_text, is_public, created_at)")
      .eq("salon_id", salon.id)
      // Filter out auto-moderated (hidden) reviews: the admin client bypasses
      // RLS, so without this an automod-hidden review would ship to the PDP.
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Attach service_ids to each staff member (which services they perform) so the UI can
  // filter services by a chosen staff/barber, staff_services is the same link the booking
  // flow uses.
  const staff = staffRes.data ?? [];
  let staffWithServices = staff;
  if (staff.length > 0) {
    const { data: links } = await supabase
      .from("staff_services")
      .select("staff_member_id, service_id")
      .in("staff_member_id", staff.map((s) => s.id));
    const byStaff = new Map<string, string[]>();
    (links ?? []).forEach((l) => {
      const arr = byStaff.get(l.staff_member_id) ?? [];
      arr.push(l.service_id);
      byStaff.set(l.staff_member_id, arr);
    });
    staffWithServices = staff.map((s) => ({
      ...s,
      service_ids: byStaff.get(s.id) ?? [],
      // Aliases for SalonTeam.tsx which reads staff_average_rating / staff_review_count.
      staff_average_rating: s.average_rating,
      staff_review_count: s.review_count,
    }));
  }

  const reviews = reviewsRes.data ?? [];

  // Moderation fields (verification_warnings, warning_count, frozen_at,
  // frozen_reason) ship ONLY to the owner's own session; public callers
  // (anonymous PDP visitors, other logged-in users) never see them.
  // owner_id is stripped for ALL callers, including the owner: it is needed
  // server-side for the isOwner gate above, and no client reads it.
  const { owner_id, ...salonWithoutOwnerId } = salon as typeof salon & { owner_id?: string };
  const publicSalon = isOwner
    ? salonWithoutOwnerId
    : (() => {
        const { verification_warnings, warning_count, frozen_at, frozen_reason, ...rest } =
          salonWithoutOwnerId as typeof salonWithoutOwnerId & {
            verification_warnings?: unknown;
            warning_count?: unknown;
            frozen_at?: unknown;
            frozen_reason?: unknown;
          };
        return rest;
      })();

  return {
    salon: {
      ...publicSalon,
      services: servicesRes.data ?? [],
      staff: staffWithServices,
      reviews,
    } as unknown as SalonDetail,
    isOwnerView: isOwner,
  };
}

/**
 * Shared salon-detail loader (B4 load audit, 2026-07-04).
 *
 * Extracted from GET /api/salons/[slug] so the exact same query/shape can be
 * called SERVER-SIDE from the salon PDP `page.tsx` (server component) instead
 * of only from the client fetch. The API route below now calls this too, so
 * there is a single source of truth for "what a salon-detail fetch returns".
 *
 * Returns `null` when the salon doesn't exist or isn't visible to the caller
 * (mirrors the API route's 404 branch: hidden salons are only visible to
 * their owner). Callers decide what "not found" means for their context
 * (notFound() for the page, a 404 JSON response for the API route).
 *
 * Thin wrapper over loadSalonDetailWithAccess (Ring 5b) for callers that only need the
 * salon payload, not the owner-view flag (e.g. the PDP page.tsx via
 * loadSalonDetailWithStatus below).
 */
export async function loadSalonDetail(slug: string): Promise<SalonDetail | null> {
  const result = await loadSalonDetailWithAccess(slug);
  return result?.salon ?? null;
}

/**
 * Loads a salon detail AND computes its open/closed status + "today" key
 * ONCE, server-side, in the salon's own timezone (salons.timezone, default
 * 'Europe/Zurich').
 *
 * Hydration fix (2026-07-04): the PDP used to call `computeOpenStatus()` /
 * `new Date()` again in each client render (SalonHeader, SalonSidebar,
 * SalonOpeningTimes, SalonDetailV3's walk-in gate), which now that the page
 * renders server-side too meant two different clocks producing different
 * output whenever they straddled an open/close boundary, causing a React
 * hydration mismatch. Computing it once here and passing the result down as
 * a plain serializable prop makes SSR HTML and client hydration render the
 * identical value.
 */
export async function loadSalonDetailWithStatus(slug: string): Promise<SalonDetailWithStatus | null> {
  const salon = await loadSalonDetail(slug);
  if (!salon) return null;

  const now = nowInTimezone((salon as { timezone?: string }).timezone);
  const openStatus = computeOpenStatus(salon.opening_hours, now);
  // `now` is a nowInTimezone()-shaped Date: UTC fields encode the salon
  // timezone's wall clock, so read the day-of-week via getUTCDay(), not the
  // server process's own local getDay() (same UTC-getter contract as
  // computeOpenStatus above).
  const todayKey = DAY_ORDER[now.getUTCDay()];

  return { salon, openStatus, todayKey };
}
