// exists-check: net-new vs app/api/me/route.ts (that route is a GET-only homepage data
// aggregate; no existing route writes profiles.analytics_consent) because the S1 backend
// audit's PostHog consent gap needs a dedicated authed write endpoint for the user's own
// analytics consent choice.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, meConsentSchema } from "@/lib/validations";
import { invalidateConsentCache } from "@/lib/posthog-server";

/**
 * POST /api/me/consent
 *
 * Saves the caller's own analytics consent (profiles.analytics_consent), the
 * server-side mirror of the choice CookieConsent.tsx already collects into
 * localStorage. lib/posthog-server.ts reads this column to gate server-side
 * PostHog capture, since localStorage is unreadable server-side.
 *
 * Body: { analytics: boolean }
 * Session client (not admin): RLS policy `profiles_update_own` allows a user
 * to update their own row; analytics_consent is deliberately not in the
 * guard_profile_privilege_columns lock list (this is the user's own choice
 * to set, see supabase/migrations/20260714230441_add_profiles_analytics_consent.sql).
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(meConsentSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Cast: lib/database.types.ts was generated before the analytics_consent migration
  // (20260714230441, applied live via MCP), so the column isn't in the generated Update
  // type yet, same gap the stripe webhook handler notes for the VAT columns.
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ analytics_consent: validated.analytics } as any)
    .eq("id", user.id);

  if (dbError) {
    console.error("[api/me/consent] failed to save analytics_consent:", dbError);
    return NextResponse.json({ message: dbError.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Drop this user's cached consent so the change applies immediately on this instance rather
  // than up to the 60s TTL later. Without it, a revoke left a warm instance still capturing.
  invalidateConsentCache(user.id);

  return NextResponse.json({ ok: true });
}
