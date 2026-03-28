export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

const TEST_PREFIX = "[TEST]";

const FAKE_CUSTOMER_NAMES = [
  "Lena Müller", "Marco Bauer", "Sara Fischer", "Jan Schmitt",
  "Anna Keller", "Tobias Wolf", "Mia Braun", "Simon Lehmann",
];
const FAKE_PHONES = ["+41 79 123 45 67", "+41 78 234 56 78", "+41 76 345 67 89"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function addHours(date: Date, h: number) {
  return new Date(date.getTime() + h * 3_600_000);
}
function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { salon_id, feature } = await request.json();
  if (!salon_id || !feature) return NextResponse.json({ error: "salon_id and feature required" }, { status: 400 });

  // Verify test salon ownership
  const { data: salon } = await admin.from("salons").select("owner_id, name, categories").eq("id", salon_id).single();
  if (!salon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (salon.owner_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!salon.name.startsWith(TEST_PREFIX)) return NextResponse.json({ error: "Not a test salon" }, { status: 400 });

  // Get services for this salon
  const { data: services } = await admin.from("services").select("id, name_de").eq("salon_id", salon_id).eq("is_active", true);
  const { data: staff } = await admin.from("staff_members").select("id, name").eq("salon_id", salon_id);

  const serviceId = services?.[0]?.id ?? null;
  const staffId = staff?.[0]?.id ?? null;

  switch (feature) {
    case "walkin_queue": {
      // Seed 4 walk-in entries
      const entries = Array.from({ length: 4 }, (_, i) => ({
        salon_id,
        customer_name: rand(FAKE_CUSTOMER_NAMES),
        customer_phone: rand(FAKE_PHONES),
        service_id: serviceId,
        assigned_barber_id: i === 0 ? staffId : null,
        preferred_barber_id: staffId,
        status: i === 0 ? "in_chair" : "waiting",
        position: i,
        estimated_wait_minutes: (i + 1) * 20,
        tracking_token: `test-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        join_method: "walk_in",
        joined_at: new Date(Date.now() - i * 5 * 60_000).toISOString(),
      }));
      const { data } = await admin.from("barber_walkin_queue").insert(entries).select();
      return NextResponse.json({ seeded: "walkin_queue", count: data?.length ?? 0 });
    }

    case "bookings": {
      // Seed 6 bookings: 2 completed (past), 2 confirmed (future), 1 cancelled, 1 pending
      const now = new Date();
      const statuses = ["completed", "completed", "confirmed", "confirmed", "cancelled", "pending"];
      const offsets = [-48, -24, 2, 26, -72, 6]; // hours from now
      const entries = statuses.map((status, i) => {
        const startsAt = addHours(now, offsets[i]);
        return {
          salon_id,
          user_id: session.user.id, // owner as placeholder customer
          service_id: serviceId,
          starts_at: startsAt.toISOString(),
          ends_at: addHours(startsAt, 1).toISOString(),
          price_paid: randInt(3000, 9000),
          status,
          is_first_visit: i % 3 === 0,
        };
      });
      const { data } = await admin.from("bookings").insert(entries).select();
      return NextResponse.json({ seeded: "bookings", count: data?.length ?? 0 });
    }

    case "reviews": {
      // Seed 5 reviews with different ratings
      const ratings = [5, 5, 4, 3, 5];
      const comments = [
        "Sehr zufrieden! Der Schnitt sitzt perfekt.",
        "Toller Service, freundliches Team.",
        "Gut, aber etwas lang gewartet.",
        "War ok, aber nicht der beste Schnitt.",
        "Absolut empfehlenswert! Werde wiederkommen.",
      ];
      const entries = ratings.map((rating, i) => ({
        salon_id,
        user_id: session.user.id,
        rating,
        comment: comments[i],
        service_id: serviceId,
        staff_member_id: staffId,
        created_at: new Date(Date.now() - i * 24 * 3_600_000).toISOString(),
      }));
      const { data } = await admin.from("reviews").insert(entries).select();
      return NextResponse.json({ seeded: "reviews", count: data?.length ?? 0 });
    }

    case "last_minute": {
      // Seed 3 last-minute slots in the next 6 hours
      const now = new Date();
      const entries = Array.from({ length: 3 }, (_, i) => ({
        salon_id,
        service_id: serviceId,
        starts_at: addHours(now, i + 1).toISOString(),
        ends_at: addHours(now, i + 2).toISOString(),
        original_price: 6500,
        discounted_price: randInt(3000, 5000),
        status: "available",
        notes: `Kurzfristig verfügbar — Slot ${i + 1}`,
      }));
      const { data } = await admin.from("last_minute_slots").insert(entries).select();
      return NextResponse.json({ seeded: "last_minute", count: data?.length ?? 0 });
    }

    case "reset": {
      // Clear all seeded data but keep salon structure (services + staff)
      await Promise.all([
        admin.from("bookings").delete().eq("salon_id", salon_id),
        admin.from("reviews").delete().eq("salon_id", salon_id),
        admin.from("barber_walkin_queue").delete().eq("salon_id", salon_id),
        admin.from("last_minute_slots").delete().eq("salon_id", salon_id),
      ]);
      return NextResponse.json({ reset: true });
    }

    default:
      return NextResponse.json({ error: `Unknown feature: ${feature}` }, { status: 400 });
  }
}
