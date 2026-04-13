export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Cron handler: send review prompt email 24h after completed appointment.
 * If user already left a 4-5 star review on Solen, send a follow-up nudging them
 * to also leave a Google review for the salon.
 * Runs hourly. Protected by CRON_SECRET.
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
  // 23h–25h window: catch bookings completed ~24h ago
  const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000);

  // Find bookings completed ~24h ago that haven't been prompted
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, salon_id, starts_at, status, review_prompt_sent, salons(name, slug, google_place_id), profiles(display_name, banned_at, locale)")
    .eq("status", "completed")
    .eq("review_prompt_sent", false)
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString())
    .limit(50);

  let sentCount = 0;
  let googlePushCount = 0;

  for (const booking of bookings ?? []) {
    if (booking.status === "cancelled") continue;

    const salon = booking.salons as any;
    const profile = booking.profiles as any;

    if (profile?.banned_at) continue;

    const { data: authUser } = await supabase.auth.admin.getUserById(booking.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const userLocale = profile?.locale || "de";

    // Check if user already left a high-rating review for this booking's salon
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id, rating")
      .eq("user_id", booking.user_id)
      .eq("salon_id", booking.salon_id)
      .gte("created_at", windowStart.toISOString())
      .maybeSingle();

    const isHighRating = existingReview && existingReview.rating >= 4;
    const hasGooglePlace = salon?.google_place_id;

    // Translations
    const t = {
      de: {
        googleSubject: `Teile deine Erfahrung bei ${salon?.name ?? "deinem Salon"} auf Google`,
        googleTitle: "Danke für deine Bewertung!",
        googleBody1: `Schön, dass dir dein Besuch bei <strong>${salon?.name}</strong> gefallen hat! Hilf anderen, diesen Salon zu entdecken — eine Google-Bewertung macht einen grossen Unterschied.`,
        googleBtn: "Auf Google bewerten",
        solenSubject: `Wie war dein Besuch bei ${salon?.name ?? "deinem Salon"}?`,
        solenTitle: "Wie war dein Besuch?",
        solenBody1: `Wir hoffen, du hattest einen tollen Besuch bei <strong>${salon?.name}</strong>. Dein Feedback hilft anderen bei der Entscheidung!`,
        solenBtn: "Jetzt bewerten",
        signature: "— Dein Solen Team",
        greeting: `Hallo ${profile?.display_name ?? ""},`
      },
      en: {
        googleSubject: `Share your experience at ${salon?.name ?? "your salon"} on Google`,
        googleTitle: "Thanks for your review!",
        googleBody1: `We're glad you enjoyed your visit at <strong>${salon?.name}</strong>! Help others discover this salon — a Google review makes a big difference.`,
        googleBtn: "Review on Google",
        solenSubject: `How was your visit at ${salon?.name ?? "your salon"}?`,
        solenTitle: "How was your visit?",
        solenBody1: `We hope you had a great visit at <strong>${salon?.name}</strong>. Your feedback helps others make a decision!`,
        solenBtn: "Review now",
        signature: "— Your Solen Team",
        greeting: `Hi ${profile?.display_name ?? ""},`
      },
      fr: {
        googleSubject: `Partagez votre expérience chez ${salon?.name ?? "votre salon"} sur Google`,
        googleTitle: "Merci pour votre avis !",
        googleBody1: `Nous sommes ravis que votre visite chez <strong>${salon?.name}</strong> vous ait plu ! Aidez d'autres personnes à découvrir ce salon — un avis Google fait une grande différence.`,
        googleBtn: "Donner un avis sur Google",
        solenSubject: `Comment s'est passée votre visite chez ${salon?.name ?? "votre salon"} ?`,
        solenTitle: "Comment s'est passée votre visite ?",
        solenBody1: `Nous espérons que vous avez passé un excellent moment chez <strong>${salon?.name}</strong>. Vos retours aident les autres à choisir !`,
        solenBtn: "Donner un avis maintenant",
        signature: "— Votre Équipe Solen",
        greeting: `Bonjour ${profile?.display_name ?? ""},`
      },
      it: {
        googleSubject: `Condividi la tua esperienza da ${salon?.name ?? "il tuo salone"} su Google`,
        googleTitle: "Grazie per la tua recensione!",
        googleBody1: `Siamo felici che la tua visita da <strong>${salon?.name}</strong> ti sia piaciuta! Aiuta altri a scoprire questo salone — una recensione su Google fa una grande differenza.`,
        googleBtn: "Recensisci su Google",
        solenSubject: `Com'è andata la tua visita da ${salon?.name ?? "il tuo salone"}?`,
        solenTitle: "Com'è andata la tua visita?",
        solenBody1: `Speriamo che tu abbia trascorso un'ottima visita da <strong>${salon?.name}</strong>. Il tuo feedback aiuta gli altri a decidere!`,
        solenBtn: "Recensisci ora",
        signature: "— Il tuo Team Solen",
        greeting: `Ciao ${profile?.display_name ?? ""},`
      }
    };

    // Fallback to German if locale not supported
    const lang = (t as any)[userLocale] || t.de;

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
            subject: lang.googleSubject,
            html: `
              <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="font-family: Syne, sans-serif; color: #1A1209;">${lang.googleTitle}</h2>
                <p style="color: #666;">${lang.greeting}</p>
                <p style="color: #666;">${lang.googleBody1}</p>
                <a href="${googleReviewUrl}"
                  style="display: inline-block; background: #C05038; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  ${lang.googleBtn}
                </a>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">${lang.signature}</p>
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
            subject: lang.solenSubject,
            html: `
              <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="font-family: Syne, sans-serif; color: #1A1209;">${lang.solenTitle}</h2>
                <p style="color: #666;">${lang.greeting}</p>
                <p style="color: #666;">${lang.solenBody1}</p>
                <a href="https://www.solen.ch/${userLocale}/salon/${salon?.slug}#bewertungen"
                  style="display: inline-block; background: #C05038; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  ${lang.solenBtn}
                </a>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">${lang.signature}</p>
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
