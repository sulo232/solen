export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { generalLimiter, authLimiter, applyRateLimit, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createSalonSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { onboardingWelcome } from "@/lib/email-templates/salon-onboarding";

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const min_price = searchParams.get("min_price");
    const max_price = searchParams.get("max_price");
    const min_rating = searchParams.get("min_rating");
    const accepts_payment = searchParams.get("accepts_payment");
    const date = searchParams.get("date"); // YYYY-MM-DD for availability filtering
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const sort = searchParams.get("sort") ?? "rating";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const offset = (page - 1) * limit;

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("salons")
      .select("*, services(price)", { count: "exact" })
      .eq("is_active", true);

    if (category) query = query.contains("categories", [category]);
    
    if (city) {
      const { data: cData } = await supabase.from("cities").select("id").eq("slug", city).single();
      if (cData?.id) query = query.eq("city_id", cData.id);
    }

    if (min_rating) query = query.gte("average_rating", parseFloat(min_rating));
    if (accepts_payment === "true") query = query.eq("accepts_online_payment", true);

    // Price filtering requires joining services — use subquery via RPC or filter post-fetch
    // For V1, we skip price filter on the salons level (services are filtered client-side)

    let distanceMap: Record<string, number> | null = null;
    let orderedIds: string[] | null = null;

    if (lat && lng) {
      const { data: nearbyData } = await supabase.rpc("get_nearby_salon_ids", {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        max_dist_meters: 50000 // 50km
      });
      if (nearbyData) {
        distanceMap = {};
        orderedIds = [];
        for (const row of nearbyData) {
          distanceMap[row.salon_id] = row.distance_meters;
          orderedIds.push(row.salon_id);
        }
        query = query.in("id", orderedIds);
      }
    }

    if (sort === "rating") query = query.order("solen_score", { ascending: false }).order("average_rating", { ascending: false });
    else if (sort === "price") query = query.order("created_at", { ascending: true }); // V1: mocked by created_at since price is in services
    else if (sort === "last_minute") query = query.order("last_minute_discount_percent", { ascending: false }).gt("last_minute_discount_percent", 0);
    else if (sort === "newest") query = query.order("created_at", { ascending: false });
    else if (sort === "distance") {
      // Distance sorting is handled post-fetch if `lat` and `lng` are provided.
      // We still fall back to solen_score to ensure deterministic fallback if distances are equal/unavailable.
      query = query.order("solen_score", { ascending: false });
    }
    else query = query.order("solen_score", { ascending: false }).order("average_rating", { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error("[api/salons GET] query error:", error.message);
      return NextResponse.json({ items: [], total: 0, page, limit });
    }

    // Date-based availability filtering
    let availableIds: Set<string> | null = null;
    let nextDates: Record<string, string> = {};

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Find salon IDs with available slots on the given date
      const { data: availSlots } = await supabase
        .from("availability_slots")
        .select("salon_id")
        .eq("status", "available")
        .gte("starts_at", `${date}T00:00:00`)
        .lt("starts_at", `${date}T23:59:59`);

      availableIds = new Set((availSlots ?? []).map((s: { salon_id: string }) => s.salon_id));

      // For unavailable salons, find next available date
      const salonIds = (data ?? []).map((s: Record<string, unknown>) => s.id as string);
      const unavailableIds = salonIds.filter((id) => !availableIds!.has(id));

      if (unavailableIds.length > 0) {
        const { data: nextSlots } = await supabase
          .from("availability_slots")
          .select("salon_id, starts_at")
          .eq("status", "available")
          .gt("starts_at", `${date}T23:59:59`)
          .in("salon_id", unavailableIds)
          .order("starts_at", { ascending: true });

        // Get the earliest next date per salon
        for (const slot of nextSlots ?? []) {
          const sid = (slot as { salon_id: string; starts_at: string }).salon_id;
          if (!nextDates[sid]) {
            nextDates[sid] = (slot as { starts_at: string }).starts_at.split("T")[0];
          }
        }
      }
    }

    // Compute avg_price from joined services, then strip services from response
    const items = (data ?? []).map((salon: Record<string, unknown>) => {
      const services = salon.services as { price: number }[] | null;
      const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { services: _services, ...rest } = salon;

      const salonId = salon.id as string;
      return {
        ...rest,
        avg_price,
        distance_meters: distanceMap ? distanceMap[salonId] : undefined,
        ...(availableIds !== null
          ? {
              available_on_date: availableIds.has(salonId),
              next_available_date: availableIds.has(salonId) ? null : (nextDates[salonId] ?? null),
            }
          : {}),
      };
    });

    if (sort === "distance" && distanceMap) {
      items.sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));
    }

    return NextResponse.json({ items, total: count ?? 0, page, limit });
  } catch (err) {
    console.error("[api/salons GET] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/salons — Create a new salon (onboarding)
export async function POST(request: NextRequest) {
  try {
    const disabled = await checkFeatureEnabled("registration");
    if (disabled) return disabled;

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const banned = await checkUserBanned(user.id);
    if (banned) return banned;

    const rateLimited = await applyRateLimit(authLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { data: validated, error: valError } = validateBody(createSalonSchema, body);
    if (valError) {
      return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const {
      name, email, categories, city, address, phone,
      cover_photo_url, gallery_urls, description_de, description_en, instagram_url, opening_hours,
      services, staff, availability_template,
      last_minute_discount_percent, last_minute_window_hours,
      latitude, longitude, google_place_id,
      website_url, tiktok_url, phone_verified, cancellation_policy,
    } = validated;

    const admin = createAdminSupabaseClient();

    // Generate slug from name with crypto-safe suffix + retry on collision
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let salon: { id: string } | null = null;
    let slug = "";

    // The frontend sends the specific "city" string (e.g. "zuerich", "basel")
    const { data: cData } = await admin.from("cities").select("id").eq("slug", city).single();
    const city_id = cData?.id || null;

    for (let attempt = 0; attempt < 3; attempt++) {
      slug = baseSlug + "-" + crypto.randomUUID().slice(0, 8);

      const { data, error: insertErr } = await admin
        .from("salons")
        .insert({
          owner_id: user.id,
          name,
          slug,
          city_id,
          quartier: "grossbasel", // [FIX] Bypassing BOTH Not-Null and legacy CHECK constraint
          categories,
          address,
          phone: phone || null,
          // phone_verified: phone_verified || false, // [FIX] Bypassing schema cache error (defaults to false in DB)
          // email: email || user.email || null, // [FIX] Field not in public.salons schema
          cover_photo_url: cover_photo_url || null,
          gallery_urls: gallery_urls?.filter(Boolean) || [],
          description_de: description_de || null,
          description_en: description_en || null,
          instagram_url: instagram_url || null,
          website_url: website_url || null,
          tiktok_url: tiktok_url || null,
          opening_hours: opening_hours || {},
          is_active: false, // Pending approval
          last_minute_discount_percent: last_minute_discount_percent || 0,
          last_minute_window_hours: last_minute_window_hours || 0,
          latitude: latitude || 47.5596,
          longitude: longitude || 7.5886,
          // google_place_id: google_place_id || null, // [FIX] Field not in public.salons schema
          // cancellation_policy: cancellation_policy || null, // [FIX] Field not in public.salons schema
        })
        .select("id")
        .single();

      if (!insertErr && data) {
        salon = data;
        break;
      }
      if (insertErr && !insertErr.message?.includes("duplicate") && !insertErr.message?.includes("unique")) {
        console.error("[api/salons POST] salon insert:", insertErr.message);
        return NextResponse.json({ error: "Failed to create salon", message: insertErr.message }, { status: 500 });
      }
    }

    if (!salon) {
      console.error("[api/salons POST] slug collision after 3 attempts");
      return NextResponse.json({ error: "Failed to create salon" }, { status: 500 });
    }

    const salonId = salon.id;

    // Insert services
    if (services?.length) {
      const serviceRows = services.map((s: Record<string, unknown>) => ({
        salon_id: salonId,
        name_de: s.name_de,
        name_en: s.name_en || null,
        name_fr: s.name_fr || null,
        name_it: s.name_it || null,
        category: s.category || categories[0],
        duration_minutes: s.duration_minutes || 60,
        price: s.price || 0,
        description_de: s.description_de || null,
        is_active: true,
      }));
      await admin.from("services").insert(serviceRows);
    }

    // Insert staff
    if (staff?.length) {
      const staffRows = staff.map((s: Record<string, unknown>) => ({
        salon_id: salonId,
        name: s.name,
        avatar_url: s.avatar_url || null,
        specialties: (s.specialties as string[]) || [],
        role: s.role || null,
        is_active: true,
      }));
      await admin.from("staff_members").insert(staffRows);
    }

    // Generate availability slots for 14 days, excluding breaks
    if (availability_template) {
      const slots: Record<string, unknown>[] = [];
      const now = new Date();

      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date(now);
        date.setDate(date.getDate() + dayOffset);
        const dayIdx = date.getDay(); // 0=Sun
        const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayIdx];

        const rawTmpl = availability_template[dayKey];
        if (!rawTmpl) continue;
        const tmpl = rawTmpl as { start: string; end: string; breaks?: { start: string; end: string }[] };

        const dateStr = date.toISOString().split("T")[0];
        const startMin = timeToMinutes(tmpl.start);
        const endMin = timeToMinutes(tmpl.end);
        const breaks: { start: string; end: string }[] = tmpl.breaks || [];

        // Generate 30-min slots, skipping breaks
        for (let m = startMin; m < endMin; m += 30) {
          const slotEnd = m + 30;
          if (slotEnd > endMin) break;

          // Check if slot overlaps with any break
          const inBreak = breaks.some(brk => {
            const bStart = timeToMinutes(brk.start);
            const bEnd = timeToMinutes(brk.end);
            return m < bEnd && slotEnd > bStart;
          });
          if (inBreak) continue;

          slots.push({
            salon_id: salonId,
            starts_at: `${dateStr}T${minutesToTime(m)}:00`,
            ends_at: `${dateStr}T${minutesToTime(slotEnd)}:00`,
            status: "available",
          });
        }
      }

      if (slots.length > 0) {
        // Insert in batches of 100
        for (let i = 0; i < slots.length; i += 100) {
          await admin.from("availability_slots").insert(slots.slice(i, i + 100));
        }
      }
    }

    // Update user profile with onboarding status, TOS tracking, and role upgrade (if applicable)
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    
    // Using any type to dynamically attach role if needed
    const updateData: Record<string, any> = { 
      onboarding_completed: true,
      tos_version: "1.0",
      tos_accepted_at: new Date().toISOString()
    };
    
    if (profile?.role === "customer" || !profile?.role) {
      updateData.role = "salon_owner";
    }
    
    await admin.from("profiles").update(updateData).eq("id", user.id);

    // Send welcome email (fire-and-forget)
    const ownerEmail = email || user.email;
    if (ownerEmail) {
      sendEmail(onboardingWelcome(ownerEmail, { salonName: name }, "de")).catch(() => {});
    }

    return NextResponse.json({ id: salonId, slug });
  } catch (err) {
    console.error("[api/salons POST] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
