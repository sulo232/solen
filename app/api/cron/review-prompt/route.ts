export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Cron handler: send review prompt email 24h after completed appointment.
 * If user already left a 4-5 star review on Solen, send a follow-up nudging them
 * to also leave a Google review for the salon.
 * Runs daily. Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[review-prompt] RESEND_API_KEY not set — skipping emails");
    return NextResponse.json({ skipped: true, reason: "no_api_key" });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Find bookings completed ~24h ago that haven't been prompted
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, salon_id, starts_at, status, review_prompt_sent, salons(name, slug, google_place_id), profiles(display_name)")
    .eq("status", "completed")
    .eq("review_prompt_sent", false)
    .gte("starts_at", dayBefore.toISOString())
    .lte("starts_at", yesterday.toISOString())
    .limit(50);

  let sentCount = 0;
  let googlePushCount = 0;

  for (const booking of bookings ?? []) {
    if (booking.status === "cancelled") continue;

    const salon = booking.salons as any;
    const profile = booking.profiles as any;

    const { data: authUser } = await supabase.auth.admin.getUserById(booking.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    // Check if user already left a high-rating review for this booking's salon
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id, rating")
      .eq("user_id", booking.user_id)
      .eq("salon_id", booking.salon_id)
      .gte("created_at", dayBefore.toISOString())
      .maybeSingle();

    const isHighRating = existingReview && existingReview.rating >= 4;
    const hasGooglePlace = salon?.google_place_id;

    try {
      if (isHighRating && hasGooglePlace) {
        // User already rated 4-5 stars on Solen → nudge Google review
        const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${salon.google_place_id}`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Solen <noreply@solen.ch>",
            to: email,
            subject: `Teile deine Erfahrung bei ${salon?.name ?? "deinem Salon"} auf Google`,
            html: `
              <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="font-family: Syne, sans-serif; color: #1A1209;">Danke für deine Bewertung!</h2>
                <p style="color: #666;">Hallo ${profile?.display_name ?? ""},</p>
                <p style="color: #666;">Schön, dass dir dein Besuch bei <strong>${salon?.name}</strong> gefallen hat! Hilf anderen, diesen Salon zu entdecken — eine Google-Bewertung macht einen grossen Unterschied.</p>
                <a href="${googleReviewUrl}"
                  style="display: inline-block; background: #E8624A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  Auf Google bewerten
                </a>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">— Dein Solen Team</p>
              </div>
            `,
          }),
        });

        googlePushCount++;
      } else {
        // Standard review prompt
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Solen <noreply@solen.ch>",
            to: email,
            subject: `Wie war dein Besuch bei ${salon?.name ?? "deinem Salon"}?`,
            html: `
              <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="font-family: Syne, sans-serif; color: #1A1209;">Wie war dein Besuch?</h2>
                <p style="color: #666;">Hallo ${profile?.display_name ?? ""},</p>
                <p style="color: #666;">Wir hoffen, du hattest einen tollen Besuch bei <strong>${salon?.name}</strong>. Dein Feedback hilft anderen bei der Entscheidung!</p>
                <a href="https://www.solen.ch/de/salon/${salon?.slug}#bewertungen"
                  style="display: inline-block; background: #E8624A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  Jetzt bewerten
                </a>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">— Dein Solen Team</p>
              </div>
            `,
          }),
        });
      }

      await supabase.from("bookings").update({ review_prompt_sent: true }).eq("id", booking.id);
      sentCount++;
    } catch (err) {
      console.error(`[review-prompt] Failed to send email for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ sent: sentCount, google_pushes: googlePushCount });
}
