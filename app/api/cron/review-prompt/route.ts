export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv, getAppUrl } from "@/lib/env";
import { tipPromptEmail } from "@/lib/email";
import { sendNotification } from "@/lib/notifications";
import { withCronRun } from "@/lib/cron-run";
import { runWithConcurrency } from "@/lib/concurrency";

// review_prompt notifications self-expire after this many days (auto-deleted earlier on review submit).
const REVIEW_PROMPT_TTL_DAYS = 30;
const SOLEN_EMAIL_SENDER = "Solen <noreply@solen.ch>";
const RESEND_EMAILS_URL = "https://api.resend.com/emails";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// Same Resend call the route already made via raw fetch, now with the
// response actually checked (RING 3a: a !res.ok used to be silently ignored).
async function sendViaResend(apiKey: string, to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: SOLEN_EMAIL_SENDER, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

/**
 * Cron handler: send review prompt email 24h after completed appointment.
 * If user already left a 4-5 star review on Solen, send a follow-up nudging them
 * to also leave a Google review for the salon.
 * Runs hourly. Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const env = getServerEnv();
  if (!env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("review-prompt", async () => {
  // RING 3a (a Ring 1 B follow-up): this used to be an early return BEFORE
  // withCronRun, so the skip never logged to cron_runs. Moved inside the
  // wrapper so a no-api-key run still lands a row (ok:true, processed:0).
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[review-prompt] RESEND_API_KEY not set,skipping emails");
    return { ok: true, skipped: true, reason: "no_api_key", processed: 0 };
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();
  // 23h-25h window: catch bookings completed ~24h ago
  const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000);

  // Find bookings completed ~24h ago that haven't been prompted
  // Windowed on completed_at (not starts_at): a booking completed later than ~25h
  // after it started would otherwise miss the window entirely and never get prompted.
  // profiles(email) added so the per-booking auth.admin.getUserById call below can
  // be dropped in favor of this single joined select (RING 3a batching).
  const { data: bookings, error: bookingsErr } = await supabase
    .from("bookings")
    .select("id, user_id, salon_id, starts_at, completed_at, status, review_prompt_sent, salons(name, slug, google_place_id, stripe_account_id), staff_members(name, avatar_url), profiles(display_name, banned_at, locale, email)")
    .eq("status", "completed")
    .eq("review_prompt_sent", false)
    .gte("completed_at", windowStart.toISOString())
    .lte("completed_at", windowEnd.toISOString())
    .limit(50);

  if (bookingsErr) {
    console.error("[review-prompt] bookings query failed:", bookingsErr);
    return { error: "bookings_query_failed", errors: ["bookings_query_failed"] };
  }

  // TTL: delete review_prompt notifications older than 30 days
  try {
    const ttlCutoff = new Date(now.getTime() - REVIEW_PROMPT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("notifications")
      .delete()
      .eq("type", "review_prompt")
      .lt("created_at", ttlCutoff);
  } catch (err) {
    console.error("[review-prompt] TTL cleanup failed:", err);
  }

  // Env-backed base URL (NOT hardcoded), computed once. Falls back to the prod domain.
  let baseUrl: string;
  try {
    baseUrl = getAppUrl();
  } catch (err) {
    console.warn("[review-prompt] getAppUrl failed, falling back to prod URL:", err);
    baseUrl = "https://www.solen.ch";
  }

  const dueBookings = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const userIds = Array.from(new Set(dueBookings.map((b) => b.user_id)));
  const salonIds = Array.from(new Set(dueBookings.map((b) => b.salon_id)));
  const bookingIds = dueBookings.map((b) => b.id);

  // RING 3a: batch the 3 previously per-booking reads (existing high-rating
  // review, per-booking review, existing review_prompt notification) into ONE
  // IN-list query each.
  const [
    { data: existingReviewRows, error: existingReviewErr },
    { data: bookingReviewRows, error: bookingReviewErr },
    { data: existingNotifRows, error: existingNotifErr },
  ] = await Promise.all([
    supabase.from("reviews").select("user_id, salon_id, rating").in("user_id", userIds).in("salon_id", salonIds).gte("created_at", windowStart.toISOString()),
    supabase.from("reviews").select("booking_id").in("booking_id", bookingIds),
    supabase.from("notifications").select("user_id, data").eq("type", "review_prompt").in("user_id", userIds),
  ]);

  if (existingReviewErr) {
    // Same conservative behavior as the old per-booking .maybeSingle() error path
    // (skip, never send on unknown DB state), generalized to the whole batch.
    console.error("[review-prompt] existingReview batch query failed:", existingReviewErr);
    return { error: "existing_review_query_failed", errors: ["existing_review_query_failed"] };
  }
  if (bookingReviewErr) console.error("[review-prompt] bookingReview batch query failed:", bookingReviewErr.message);
  if (existingNotifErr) console.error("[review-prompt] existingNotif batch query failed:", existingNotifErr.message);
  // On a query error for either check we SKIP creating in-app notifications this
  // run (never create on unknown DB state, the silent-no-op trap), same as the
  // original per-booking behavior.
  const skipInAppNotifs = !!bookingReviewErr || !!existingNotifErr;

  const reviewsByUserSalon = new Map<string, { rating: number }[]>();
  for (const row of existingReviewRows ?? []) {
    const key = `${row.user_id}:${row.salon_id}`;
    const list = reviewsByUserSalon.get(key) ?? [];
    list.push({ rating: row.rating });
    reviewsByUserSalon.set(key, list);
  }
  const bookingsWithReview = new Set((bookingReviewRows ?? []).map((r) => r.booking_id));
  const notifiedBookings = new Set(
    (existingNotifRows ?? []).map((r) => `${r.user_id}:${(r.data as { booking_id?: string } | null)?.booking_id}`)
  );

  // Translations (unchanged content, moved out of the loop since they don't vary per booking).
  type LangPack = {
    salonFallback: string;
    googleSubject: (salonName: string) => string;
    googleTitle: string;
    googleBody1: (salonName: string) => string;
    googleBtn: string;
    solenSubject: (salonName: string) => string;
    solenTitle: string;
    solenBody1: (salonName: string) => string;
    solenBtn: string;
    signature: string;
    greeting: (name: string) => string;
  };
  const T: Record<"de" | "en" | "fr" | "it", LangPack> = {
    de: {
      salonFallback: "deinem Salon",
      googleSubject: (salonName: string) => `Teile deine Erfahrung bei ${salonName} auf Google`,
      googleTitle: "Danke für deine Bewertung!",
      googleBody1: (salonName: string) => `Schön, dass dir dein Besuch bei <strong>${salonName}</strong> gefallen hat! Hilf anderen, diesen Salon zu entdecken, eine Google-Bewertung macht einen grossen Unterschied.`,
      googleBtn: "Auf Google bewerten",
      solenSubject: (salonName: string) => `Wie war dein Besuch bei ${salonName}?`,
      solenTitle: "Wie war dein Besuch?",
      solenBody1: (salonName: string) => `Wir hoffen, du hattest einen tollen Besuch bei <strong>${salonName}</strong>. Dein Feedback hilft anderen bei der Entscheidung!`,
      solenBtn: "Jetzt bewerten",
      signature: "Dein Solen Team",
      greeting: (name: string) => `Hallo ${name},`,
    },
    en: {
      salonFallback: "your salon",
      googleSubject: (salonName: string) => `Share your experience at ${salonName} on Google`,
      googleTitle: "Thanks for your review!",
      googleBody1: (salonName: string) => `We're glad you enjoyed your visit at <strong>${salonName}</strong>! Help others discover this salon, a Google review makes a big difference.`,
      googleBtn: "Review on Google",
      solenSubject: (salonName: string) => `How was your visit at ${salonName}?`,
      solenTitle: "How was your visit?",
      solenBody1: (salonName: string) => `We hope you had a great visit at <strong>${salonName}</strong>. Your feedback helps others make a decision!`,
      solenBtn: "Review now",
      signature: "Your Solen Team",
      greeting: (name: string) => `Hi ${name},`,
    },
    fr: {
      salonFallback: "votre salon",
      googleSubject: (salonName: string) => `Partagez votre expérience chez ${salonName} sur Google`,
      googleTitle: "Merci pour votre avis !",
      googleBody1: (salonName: string) => `Nous sommes ravis que votre visite chez <strong>${salonName}</strong> vous ait plu ! Aidez d'autres personnes à découvrir ce salon, un avis Google fait une grande différence.`,
      googleBtn: "Donner un avis sur Google",
      solenSubject: (salonName: string) => `Comment s'est passée votre visite chez ${salonName} ?`,
      solenTitle: "Comment s'est passée votre visite ?",
      solenBody1: (salonName: string) => `Nous espérons que vous avez passé un excellent moment chez <strong>${salonName}</strong>. Vos retours aident les autres à choisir !`,
      solenBtn: "Donner un avis maintenant",
      signature: "Votre Équipe Solen",
      greeting: (name: string) => `Bonjour ${name},`,
    },
    it: {
      salonFallback: "il tuo salone",
      googleSubject: (salonName: string) => `Condividi la tua esperienza da ${salonName} su Google`,
      googleTitle: "Grazie per la tua recensione!",
      googleBody1: (salonName: string) => `Siamo felici che la tua visita da <strong>${salonName}</strong> ti sia piaciuta! Aiuta altri a scoprire questo salone, una recensione su Google fa una grande differenza.`,
      googleBtn: "Recensisci su Google",
      solenSubject: (salonName: string) => `Com'è andata la tua visita da ${salonName}?`,
      solenTitle: "Com'è andata la tua visita?",
      solenBody1: (salonName: string) => `Speriamo che tu abbia trascorso un'ottima visita da <strong>${salonName}</strong>. Il tuo feedback aiuta gli altri a decidere!`,
      solenBtn: "Recensisci ora",
      signature: "Il tuo Team Solen",
      greeting: (name: string) => `Ciao ${name},`,
    },
  };

  type MainTask = {
    booking: (typeof dueBookings)[number];
    salon: any;
    profile: any;
    lang: LangPack;
    email: string;
    userLocale: string;
    isHighRating: boolean;
    hasGooglePlace: boolean;
  };
  const mainTasks: MainTask[] = [];
  const errorMsgs: string[] = [];

  for (const booking of dueBookings) {
    const salon = booking.salons as any;
    const profile = booking.profiles as any;
    if (profile?.banned_at) continue;

    const email = profile?.email;
    if (!email) continue;

    const userLocale = (profile?.locale || "de") as keyof typeof T;
    const reviewKey = `${booking.user_id}:${booking.salon_id}`;
    const matchingReviews = reviewsByUserSalon.get(reviewKey) ?? [];
    if (matchingReviews.length > 1) {
      // Ambiguous match, same conservative behavior as the original .maybeSingle() error path: skip.
      console.error(`[review-prompt] multiple matching reviews for ${reviewKey}, booking ${booking.id}, skipping`);
      continue;
    }
    const existingReview = matchingReviews[0] ?? null;
    const isHighRating = !!(existingReview && existingReview.rating >= 4);
    const hasGooglePlace = !!salon?.google_place_id;
    const lang = T[userLocale] ?? T.de;

    mainTasks.push({ booking, salon, profile, lang, email, userLocale, isHighRating, hasGooglePlace });
  }

  // Concurrency-capped sends (cap 5): one recipient's failure never blocks the rest,
  // never one unbounded Promise.all over emails, never fully serial.
  const mainResults = await runWithConcurrency(mainTasks, 5, async (task) => {
    const salonName = task.salon?.name ?? task.lang.salonFallback;
    if (task.isHighRating && task.hasGooglePlace) {
      const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${task.salon.google_place_id}`;
      await sendViaResend(resendApiKey, task.email, task.lang.googleSubject(salonName), `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="font-family: Syne, sans-serif; color: #1A1209;">${task.lang.googleTitle}</h2>
          <p style="color: #666;">${task.lang.greeting(task.profile?.display_name ?? "")}</p>
          <p style="color: #666;">${task.lang.googleBody1(task.salon?.name)}</p>
          <a href="${googleReviewUrl}" style="display: inline-block; background: #0A0A0A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">${task.lang.googleBtn}</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">${task.lang.signature}</p>
        </div>
      `);
    } else {
      await sendViaResend(resendApiKey, task.email, task.lang.solenSubject(salonName), `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="font-family: Syne, sans-serif; color: #1A1209;">${task.lang.solenTitle}</h2>
          <p style="color: #666;">${task.lang.greeting(task.profile?.display_name ?? "")}</p>
          <p style="color: #666;">${task.lang.solenBody1(task.salon?.name)}</p>
          <a href="${baseUrl}/${task.userLocale}/salon/${task.salon?.slug}#bewertungen" style="display: inline-block; background: #0A0A0A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">${task.lang.solenBtn}</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">${task.lang.signature}</p>
        </div>
      `);
    }
    return task;
  });

  let sentCount = 0;
  let googlePushCount = 0;
  const sentBookingIds: string[] = [];
  const tipTasks: { booking: any; email: string; payload: ReturnType<typeof tipPromptEmail> }[] = [];
  const notifTasks: { booking: any; salon: any; profile: any; lang: LangPack }[] = [];

  mainResults.forEach((res, i) => {
    const task = mainTasks[i];
    if (res.status !== "fulfilled") {
      const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
      errorMsgs.push(`booking ${task.booking.id}: ${msg}`);
      console.error(`[review-prompt] Failed to send email for booking ${task.booking.id}:`, res.reason);
      return;
    }

    sentCount++;
    if (task.isHighRating && task.hasGooglePlace) googlePushCount++;
    sentBookingIds.push(task.booking.id);

    // Tip nudge, same 24h-post-visit pass, sent ONCE (piggybacks review_prompt_sent, so no
    // extra column/migration). Gated on the salon actually being able to take tips online
    // (Connect) AND a known stylist, otherwise /tip/<id> would dead-end at "tip at the counter".
    const staff = task.booking.staff_members as any;
    const stylistName: string | null = staff?.name ?? null;
    if (task.salon?.stripe_account_id && stylistName) {
      const tipLocale = (["de", "en", "fr", "it"] as const).includes(task.userLocale as any)
        ? (task.userLocale as "de" | "en" | "fr" | "it")
        : "de";
      const tip = tipPromptEmail(
        task.email,
        { customerName: task.profile?.display_name ?? "", stylistName, stylistPhoto: staff?.avatar_url ?? "", tipUrl: `${baseUrl}/${tipLocale}/tip/${task.booking.id}` },
        tipLocale,
      );
      tipTasks.push({ booking: task.booking, email: task.email, payload: tip });
    }

    // In-app "review your appointment": create iff THIS booking has no review yet
    // (per-booking, not per-salon, so a 2nd booking at the same salon still prompts) AND
    // we are not sending the Google-nudge for this visit AND no review_prompt
    // notification already exists for it.
    if (!skipInAppNotifs && !bookingsWithReview.has(task.booking.id) && !(task.isHighRating && task.hasGooglePlace)) {
      if (!notifiedBookings.has(`${task.booking.user_id}:${task.booking.id}`)) {
        notifTasks.push({ booking: task.booking, salon: task.salon, profile: task.profile, lang: task.lang });
      }
    }
  });

  // Tip emails, same concurrency cap. Non-fatal by design (mirrors the original
  // .catch() that never blocked the rest of the booking's processing).
  const tipResults = await runWithConcurrency(tipTasks, 5, async (t) => {
    await sendViaResend(resendApiKey, t.email, t.payload.subject, t.payload.html);
    return t;
  });
  tipResults.forEach((res, i) => {
    if (res.status !== "fulfilled") {
      const booking = tipTasks[i].booking;
      console.error(`[review-prompt] tip email failed for booking ${booking.id}:`, res.reason);
      errorMsgs.push(`booking ${booking.id} (tip): ${res.reason instanceof Error ? res.reason.message : String(res.reason)}`);
    }
  });

  // In-app notifications: unchanged shape, sequential (not an email send, so
  // outside the concurrency-cap scope), each already non-fatal via .catch().
  for (const nt of notifTasks) {
    const plainBody = nt.lang.solenBody1(nt.salon?.name).replace(/<[^>]+>/g, "");
    await sendNotification({
      userId: nt.booking.user_id,
      type: "review_prompt",
      title: nt.lang.solenTitle,
      body: plainBody,
      data: {
        booking_id: nt.booking.id,
        salon_slug: nt.salon?.slug ?? "",
        salon_name: nt.salon?.name ?? "",
        staff_name: (nt.booking.staff_members as any)?.name ?? "",
      },
    }).catch((err) => console.error(`[review-prompt] in-app notification failed for booking ${nt.booking.id}:`, err));
  }

  // Mark all successfully-emailed bookings as prompted, batched into one update.
  if (sentBookingIds.length > 0) {
    const { error: updErr } = await supabase.from("bookings").update({ review_prompt_sent: true }).in("id", sentBookingIds);
    if (updErr) console.error("[review-prompt] review_prompt_sent batch update failed:", updErr.message);
  }

  return { sent: sentCount, google_pushes: googlePushCount, errors: capErrors(errorMsgs), processed: sentCount };
  });
}
