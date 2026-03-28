export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Find clients whose last waxing booking was 21-90 days ago (within rebook window)
  const { data: bookings } = await admin
    .from("bookings")
    .select("user_id, starts_at, service_id")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .gte("starts_at", ninetyDaysAgo);

  const clientLastBooking = new Map<string, string>();
  for (const b of bookings ?? []) {
    if (!b.user_id) continue;
    const existing = clientLastBooking.get(b.user_id);
    if (!existing || b.starts_at > existing) {
      clientLastBooking.set(b.user_id, b.starts_at);
    }
  }

  // Clients whose last booking was > 21 days ago (in rebook window)
  const dueClientIds = [...clientLastBooking.entries()]
    .filter(([, lastDate]) => {
      const days = (Date.now() - new Date(lastDate).getTime()) / (24 * 60 * 60 * 1000);
      return days >= 21;
    })
    .map(([id, lastDate]) => ({ id, lastDate }))
    .slice(0, 30);

  if (dueClientIds.length === 0) return NextResponse.json({ clients: [] });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, full_name")
    .in("id", dueClientIds.map((c) => c.id));

  const clients = dueClientIds.map(({ id, lastDate }) => {
    const p = profiles?.find((x) => x.id === id);
    const daysAgo = Math.floor((Date.now() - new Date(lastDate).getTime()) / (24 * 60 * 60 * 1000));
    return {
      client_id: id,
      display_name: p?.display_name || p?.full_name || "Client",
      zone: "Unknown",
      days_overdue: Math.max(0, daysAgo - 28),
      last_wax_date: lastDate,
    };
  }).sort((a, b) => b.days_overdue - a.days_overdue);

  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { salon_id, client_id } = await request.json();
  if (!salon_id || !client_id) return NextResponse.json({ error: "Required" }, { status: 400 });

  // Log reminder sent (fire-and-forget)
  const admin = createAdminSupabaseClient();
  try {
    await admin.from("reminder_log").insert({
      salon_id,
      user_id: client_id,
      reminder_type: "waxing_rebook",
      sent_at: new Date().toISOString(),
      sent_by: session.user.id,
    });
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
