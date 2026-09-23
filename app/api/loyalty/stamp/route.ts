export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, loyaltyStampSchema } from "@/lib/validations";
import { verifyLoyaltyQRToken } from "@/lib/barber/loyalty-qr";
import { getServerEnv } from "@/lib/env";
import { getTranslations } from "next-intl/server";
import { sendEmail, barberLoyaltyRewardEmail, type EmailLocale } from "@/lib/email";
import { formatNumber, formatPrice } from "@/lib/format";
import { locales, defaultLocale } from "@/lib/locale-constants";

// POST /api/loyalty/stamp — Verify HMAC token and award stamp
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(loyaltyStampSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const secret = getServerEnv().LOYALTY_HMAC_SECRET;
  if (!secret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });

  // Verify HMAC token
  const result = verifyLoyaltyQRToken(validated.token, secret);
  if (!result.valid) {
    return NextResponse.json({ error: "Invalid or tampered token" }, { status: 403 });
  }

  const { salonId, customerId, cardId } = result;
  if (!salonId || !customerId || !cardId) {
    return NextResponse.json({ error: "Invalid or tampered token" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();

  // Verify the scanning user owns this salon (staff verification)
  const { data: salon } = await admin
    .from("salons").select("id, name").eq("id", salonId).eq("owner_id", user.id).single();
  if (!salon) {
    return NextResponse.json({ error: "Not your salon" }, { status: 403 });
  }

  // Get card and program
  const { data: card } = await admin
    .from("barber_loyalty_cards")
    .select("*, barber_loyalty_programs(stamps_required, reward_type, reward_value)")
    .eq("id", cardId)
    .eq("customer_id", customerId)
    .eq("status", "active")
    .single();

  if (!card) {
    return NextResponse.json({ error: "Card not found or inactive" }, { status: 404 });
  }

  const stampsRequired = (card.barber_loyalty_programs as any)?.stamps_required ?? 10;

  if (card.stamps >= stampsRequired) {
    return NextResponse.json({ error: "Card already complete" }, { status: 400 });
  }

  // Increment stamps. stamps_collected -> stamps: the real column name (barber_loyalty_cards
  // has no stamps_collected column; that name exists only on the unrelated barber_loyalty_history
  // table, supabase/migrations/073_barber_foundation.sql).
  const newStamps = card.stamps + 1;
  const isComplete = newStamps >= stampsRequired;

  // .eq("status", "active") re-asserts the state read above (the card fetch already required
  // it, so the normal path is unchanged) and .select("id") reports whether THIS request made
  // the write. Two concurrent scans of the last stamp both pass the read, but only the first
  // update still matches an active row, so only that request sends the reward email below.
  const { data: stampedRows, error: stampError } = await admin
    .from("barber_loyalty_cards")
    .update({
      stamps: newStamps,
      status: isComplete ? "completed" : "active",
    })
    .eq("id", cardId)
    .eq("status", "active")
    .select("id");
  if (stampError) {
    console.error("[loyalty/stamp] stamp update failed", { cardId, stampError });
  }

  // NOTE (typed-DB pass, 2026-07-11): this used to insert into barber_loyalty_history with
  // columns { card_id, action, performed_by } which do not exist on that table (live schema is
  // a completion-record shape: card_id, salon_id, customer_id, stamps_collected, reward_type,
  // reward_value, completed_at, redeemed_at, all NOT NULL except reward_value/redeemed_at). That
  // insert has never been able to succeed against the live schema (its error was discarded, so
  // this was a pre-existing silent no-op, not a regression here). Left removed rather than
  // guessing a completed_at/reward_type value: flagged for a product/schema decision.

  // Reward email, only when this request's committed write completed the card. A rescan of a
  // completed card is refused above (the card fetch requires status "active"), so it never
  // sends twice. Failures are logged and never change the stamp response.
  if (isComplete && !stampError && stampedRows?.length === 1) {
    const program = card.barber_loyalty_programs as { reward_type?: string | null; reward_value?: number | null } | null;
    await sendLoyaltyRewardEmail(admin, {
      customerId,
      cardId,
      salonName: salon.name ?? "Salon",
      rewardType: program?.reward_type ?? null,
      rewardValue: program?.reward_value ?? null,
    });
  }

  return NextResponse.json({
    stamped: true,
    stamps_collected: newStamps,
    stamps_required: stampsRequired,
    is_complete: isComplete,
  });
}

// Classification: a notice about the customer's own completed card, earned by the visit that
// was just stamped, not a promotional offer. It therefore follows the account-notice opt-out
// profiles.notification_email (default on), not the promotional opt-in
// notification_preferences.deals_enabled ("Last-minute and special offers"). Fails closed when
// the preference cannot be read.
async function sendLoyaltyRewardEmail(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  args: { customerId: string; cardId: string; salonName: string; rewardType: string | null; rewardValue: number | null }
): Promise<void> {
  try {
    const { data: profile, error: preferenceError } = await admin
      .from("profiles")
      .select("locale, notification_email, display_name")
      .eq("id", args.customerId)
      .maybeSingle();
    if (preferenceError || !profile) {
      console.error("[loyalty/stamp] notification preference lookup failed, reward email skipped", { cardId: args.cardId, preferenceError });
      return;
    }
    if (profile.notification_email === false) return;

    const { data: authUser } = await admin.auth.admin.getUserById(args.customerId);
    const email = authUser?.user?.email;
    if (!email) return;

    const locale: EmailLocale = (locales as readonly string[]).includes(profile.locale ?? "")
      ? (profile.locale as EmailLocale)
      : defaultLocale;
    const t = await getTranslations({ locale, namespace: "api.loyaltyReward" });
    const reward =
      args.rewardType === "chf_discount" && typeof args.rewardValue === "number"
        ? t("chfDiscount", { amount: formatPrice(args.rewardValue) })
        : args.rewardType === "percentage_discount" && typeof args.rewardValue === "number"
          ? t("percentageDiscount", { percent: formatNumber(args.rewardValue) })
          : t("freeService");

    // No customer page lists barber stamp cards yet (/profile/stamps reads the separate
    // loyalty_cards system), so the link goes to the real profile hub.
    await sendEmail(
      barberLoyaltyRewardEmail(
        email,
        {
          customerName: profile.display_name ?? "",
          salonName: args.salonName,
          reward,
          redeemUrl: `https://solen.ch/${locale}/profile`,
        },
        locale
      )
    );
  } catch (err) {
    console.error("[loyalty/stamp] reward email failed", { cardId: args.cardId, err });
  }
}
