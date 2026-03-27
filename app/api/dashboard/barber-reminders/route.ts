export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/dashboard/barber-reminders?salon_id=... — Get clients due for reminders
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "No salon" }, { status: 404 });

  // Get system notes with reminder info (created by the smart-reminders cron)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: notes } = await admin
    .from("client_notes")
    .select("customer_id, note, created_at")
    .eq("salon_id", salon.id)
    .eq("note_type", "system")
    .like("note", "%visit cycle%")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (!notes?.length) return NextResponse.json({ clients: [] });

  // Deduplicate by customer
  const seen = new Set<string>();
  const uniqueNotes = notes.filter((n) => {
    if (seen.has(n.customer_id)) return false;
    seen.add(n.customer_id);
    return true;
  });

  const customerIds = uniqueNotes.map((n) => n.customer_id);

  const { data: profiles } = await admin
    .from("public_profiles")
    .select("id, display_name")
    .in("id", customerIds);

  // Get last booking per customer to calculate days overdue
  const clients = await Promise.all(
    uniqueNotes.map(async (note) => {
      const profile = profiles?.find((p) => p.id === note.customer_id);
      const { data: lastBooking } = await admin
        .from("bookings")
        .select("starts_at, staff_members(name)")
        .eq("salon_id", salon.id)
        .eq("user_id", note.customer_id)
        .eq("status", "completed")
        .order("starts_at", { ascending: false })
        .limit(1)
        .single();

      const lastVisitDate = lastBooking?.starts_at ?? note.created_at;
      const daysAgo = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));

      const { data: recentSentNote } = await admin
        .from("client_notes")
        .select("created_at")
        .eq("salon_id", salon.id)
        .eq("customer_id", note.customer_id)
        .eq("note_type", "system")
        .eq("note", "Erinnerung manuell gesendet")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const isOnCooldown = recentSentNote 
        ? (Date.now() - new Date(recentSentNote.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
        : false;

      return {
        id: note.customer_id,
        display_name: profile?.display_name ?? "Unbekannt",
        days_overdue: Math.max(0, daysAgo - 21), // Assume 3-week cycle as baseline
        preferred_barber: (lastBooking?.staff_members as any)?.name ?? null,
        last_visit_date: lastVisitDate,
        cooldown: isOnCooldown,
      };
    })
  );

  return NextResponse.json({ clients });
}
