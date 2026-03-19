export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingConfirmation, type EmailLocale } from "@/lib/email";

// POST /api/bookings/[id]/confirm
// Called by salon owner to confirm a pending booking.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Load booking + verify caller is the salon owner
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, status, salons!salon_id(owner_id)")
    .eq("id", id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const salonOwner = (booking.salons as any)?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking cannot be confirmed in current state" }, { status: 400 });
  }

  const { error } = await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send confirmation email to customer
  const { data: fullBooking } = await admin
    .from("bookings")
    .select("user_id, starts_at, services(name_de), salons(name)")
    .eq("id", id)
    .single();

  if (fullBooking) {
    const { data: profile } = await admin.from("profiles").select("locale").eq("id", fullBooking.user_id).single();
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const { data: authUser } = await admin.auth.admin.getUserById(fullBooking.user_id);
    const email = authUser?.user?.email;
    if (email) {
      const dateStr = new Date(fullBooking.starts_at).toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
      const timeStr = new Date(fullBooking.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
      await sendEmail(bookingConfirmation(email, {
        service: (fullBooking.services as any)?.name_de ?? "Service",
        salon: (fullBooking.salons as any)?.name ?? "Salon",
        date: dateStr,
        time: timeStr,
      }, locale)).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
