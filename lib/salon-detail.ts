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
 */
export async function loadSalonDetail(slug: string): Promise<SalonDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // The slug param may be a UUID (owner settings page passes salon.id) or a slug.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  // Explicit public column list (same rationale as the API route): this is exactly
  // the set the PDP consumers read (SalonDetail type + section components), not the
  // full 98-column select("*") which would ship stripe_account_id / search_doc /
  // score_details etc. to anonymous PDP visitors.
  const { data: salon, error } = await supabase
    .from("salons")
    .select(
      "id, owner_id, is_active, name, slug, description_de, description_en, about_text_de, about_text_en, about_text_fr, about_text_it, categories, quartier, address, postal_code, latitude, longitude, phone, website_url, instagram_url, tiktok_url, cover_photo_url, gallery_urls, opening_hours, average_rating, review_count, last_minute_discount_percent, accepts_online_payment, free_cancel_hours, booking_confirmation_mode, instant_booking_enabled, pet_friendly, kid_friendly, wheelchair_accessible, near_public_transport, lgbtq_friendly, woman_owned, family_owned, student_discount, wifi_friendly, is_featured, parent_salon_id, walkin_enabled, timezone"
    )
    .eq(isUuid ? "id" : "slug", slug)
    .single();

  if (error || !salon) return null;

  // Regular users can only see active salons. Owner/Admin can see pending ones.
  const isOwner = user?.id === salon.owner_id;
  if (!isOwner && !salon.is_active) return null;

  // Fetch related data in parallel
  const [servicesRes, staffRes, reviewsRes] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salon.id).eq("is_active", true),
    supabase.from("staff_members").select("*").eq("salon_id", salon.id).eq("is_active", true),
    // Reviews via the service-role client: profiles RLS (rightly) blocks anon reads,
    // which nulled every reviewer name for logged-out visitors. The server exposes
    // ONLY display_name + avatar_url through this select, no broader profile access.
    createAdminSupabaseClient()
      .from("reviews")
      .select("*, profiles(display_name, avatar_url), review_replies(id, reply_text, is_public), review_photos(id, photo_url, sort_order)")
      .eq("salon_id", salon.id)
      // Filter out auto-moderated (hidden) reviews: the admin client bypasses
      // RLS, so without this an automod-hidden review would ship to the PDP.
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // A5.C (2026-07-04): batch-load service_options (variants) + service_addons
  // (extras) for every service on this salon so the PDP can indicate "this
  // service is customizable" without an N+1 (same batching pattern as the
  // staff_services join above and the booking page's own load at
  // app/[locale]/salon/[slug]/booking/page.tsx:147-164). Both queries are keyed
  // off `.in("service_id", serviceIds)` , ONE query each, not one per service.
  const services = servicesRes.data ?? [];
  let servicesWithOptions = services;
  const serviceIds = services.map((s) => s.id);
  if (serviceIds.length > 0) {
    const [optionsRes, addonsRes] = await Promise.all([
      supabase
        .from("service_options")
        .select("id, service_id, name_de, name_en, price, duration_minutes, sort_order")
        .in("service_id", serviceIds)
        .order("sort_order", { ascending: true }),
      supabase
        .from("service_addons")
        .select("id, service_id, addon_service_id, sort_order")
        .in("service_id", serviceIds)
        .order("sort_order", { ascending: true }),
    ]);

    const optionsByService = new Map<string, { id: string; name_de: string; name_en: string | null; price: number; duration_minutes: number }[]>();
    (optionsRes.data ?? []).forEach((o) => {
      const arr = optionsByService.get(o.service_id) ?? [];
      arr.push({ id: o.id, name_de: o.name_de, name_en: o.name_en, price: o.price, duration_minutes: o.duration_minutes });
      optionsByService.set(o.service_id, arr);
    });

    // addon_service_id points at ANOTHER row in `services` (the addon's own
    // name + price) , resolve those via the already-fetched `services` list
    // first, falling back to a single extra query only for addon services
    // that aren't in the salon's active-services list (e.g. an addon marked
    // inactive but still linked). Keeps this to at most 2 queries total.
    const serviceById = new Map(services.map((s) => [s.id, s]));
    const addonLinks = addonsRes.data ?? [];
    const missingAddonIds = Array.from(
      new Set(addonLinks.map((a) => a.addon_service_id).filter((id) => !serviceById.has(id)))
    );
    if (missingAddonIds.length > 0) {
      const { data: extraServices } = await supabase
        .from("services")
        .select("id, name_de, name_en, price")
        .in("id", missingAddonIds);
      (extraServices ?? []).forEach((s) => serviceById.set(s.id, s as (typeof services)[number]));
    }

    const addonsByService = new Map<string, { id: string; name_de: string; name_en: string | null; price: number }[]>();
    addonLinks.forEach((a) => {
      const addonService = serviceById.get(a.addon_service_id);
      if (!addonService) return;
      const arr = addonsByService.get(a.service_id) ?? [];
      arr.push({ id: addonService.id, name_de: addonService.name_de, name_en: addonService.name_en, price: addonService.price });
      addonsByService.set(a.service_id, arr);
    });

    servicesWithOptions = services.map((s) => ({
      ...s,
      options: optionsByService.get(s.id) ?? [],
      addons: addonsByService.get(s.id) ?? [],
    }));
  }

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

  // SECURITY: the admin client bypasses RLS, so review_replies includes is_public=false
  // rows (owner/author-only per migration 041). Strip non-public replies before they ship
  // in the response, the client only gates rendering, so unfiltered rows leak reply_text.
  const reviews = (reviewsRes.data ?? []).map((r: any) => ({
    ...r,
    review_replies: (r.review_replies ?? []).filter((rp: any) => rp.is_public === true),
  }));

  return {
    ...salon,
    services: servicesWithOptions,
    staff: staffWithServices,
    reviews,
  } as unknown as SalonDetail;
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
