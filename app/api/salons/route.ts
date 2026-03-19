export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { generalLimiter, authLimiter, applyRateLimit, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const quartier = searchParams.get("quartier");
    const min_price = searchParams.get("min_price");
    const max_price = searchParams.get("max_price");
    const min_rating = searchParams.get("min_rating");
    const accepts_payment = searchParams.get("accepts_payment");
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
    if (quartier) query = query.eq("quartier", quartier);
    if (min_rating) query = query.gte("average_rating", parseFloat(min_rating));
    if (accepts_payment === "true") query = query.eq("accepts_online_payment", true);

    // Price filtering requires joining services — use subquery via RPC or filter post-fetch
    // For V1, we skip price filter on the salons level (services are filtered client-side)

    if (sort === "rating") query = query.order("average_rating", { ascending: false });
    else if (sort === "price") query = query.order("created_at", { ascending: true });
    else query = query.order("average_rating", { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error("[api/salons GET] query error:", error.message);
      return NextResponse.json({ items: [], total: 0, page, limit });
    }

    // Compute avg_price from joined services, then strip services from response
    const items = (data ?? []).map((salon: Record<string, unknown>) => {
      const services = salon.services as { price: number }[] | null;
      const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { services: _services, ...rest } = salon;
      return { ...rest, avg_price };
    });

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
    const {
      name, email, categories, quartier, address, phone,
      cover_photo_url, gallery_urls, description_de, description_en, instagram_url, opening_hours,
      services, staff, availability_template,
      last_minute_discount_percent, last_minute_window_hours,
    } = body;

    if (!name || !categories?.length || !quartier || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      + "-" + Math.random().toString(36).slice(2, 6);

    // Create salon
    const { data: salon, error: salonError } = await admin
      .from("salons")
      .insert({
        owner_id: user.id,
        name,
        slug,
        categories,
        quartier,
        address,
        phone: phone || null,
        email: email || user.email || null,
        cover_photo_url: cover_photo_url || null,
        gallery_urls: gallery_urls?.filter(Boolean) || [],
        description_de: description_de || null,
        description_en: description_en || null,
        instagram_url: instagram_url || null,
        opening_hours: opening_hours || {},
        is_active: false, // Pending approval
        last_minute_discount_percent: last_minute_discount_percent || 0,
        last_minute_window_hours: last_minute_window_hours || 0,
      })
      .select("id")
      .single();

    if (salonError || !salon) {
      console.error("[api/salons POST] salon insert:", salonError?.message);
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

        const tmpl = availability_template[dayKey];
        if (!tmpl) continue;

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

    // Upgrade user role to salon_owner if they're a customer
    await admin
      .from("profiles")
      .update({ role: "salon_owner", onboarding_completed: true })
      .eq("id", user.id)
      .eq("role", "customer");

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
