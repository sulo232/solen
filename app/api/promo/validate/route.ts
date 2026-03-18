import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, validatePromoSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  // 2. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Rate limit
  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 5. Validate input
  const body = await req.json();
  const { data, error } = validateBody(validatePromoSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // 6. Look up promo code (case-insensitive)
  const { data: promo, error: dbError } = await supabase
    .from("promo_codes")
    .select("*")
    .ilike("code", data.code)
    .eq("is_active", true)
    .single();

  if (dbError || !promo) {
    return NextResponse.json({ valid: false, message: "Ungültiger Promo-Code" }, { status: 404 });
  }

  // 7. Validate constraints
  const now = new Date();

  if (promo.valid_from && new Date(promo.valid_from) > now) {
    return NextResponse.json({ valid: false, message: "Dieser Code ist noch nicht gültig" });
  }

  if (promo.valid_until && new Date(promo.valid_until) < now) {
    return NextResponse.json({ valid: false, message: "Dieser Code ist abgelaufen" });
  }

  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
    return NextResponse.json({ valid: false, message: "Dieser Code wurde bereits zu oft verwendet" });
  }

  if (data.booking_amount < (promo.min_booking_amount ?? 0)) {
    return NextResponse.json({
      valid: false,
      message: `Mindestbuchungsbetrag: CHF ${promo.min_booking_amount}`,
    });
  }

  // Salon-specific code check
  if (promo.salon_id && data.salon_id && promo.salon_id !== data.salon_id) {
    return NextResponse.json({ valid: false, message: "Dieser Code gilt nicht für diesen Salon" });
  }

  // 8. Calculate discount
  let discount = 0;
  if (promo.discount_type === "percent") {
    discount = Math.round(data.booking_amount * (promo.discount_value / 100) * 100) / 100;
  } else {
    discount = Math.min(promo.discount_value, data.booking_amount);
  }

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: discount,
    new_total: Math.max(0, data.booking_amount - discount),
  });
}
