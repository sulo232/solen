// exists-check: net-new vs lib/email.ts, lib/supabase.ts, lib/ratelimit.ts, lib/validations.ts
// because none of those files contain a route handler; this is the first implementation
// of the /unsubscribe endpoint lib/email.ts's salonOutreachInvitation footer has always
// linked to (npm run exists unsubscribe: 0 matches before this file).
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, unsubscribeSchema } from "@/lib/validations";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

// seo-comms-08 (2026-07-27): this is the route lib/email.ts's salonOutreachInvitation
// footer has always linked to (https://solen.ch/unsubscribe?email=...), which 404'd
// because the route never existed. salonOutreachInvitation's footer cites nDSG Art. 31
// as the legal basis for sending without prior consent, a basis that is conditional on
// the recipient having a working, honored right to object, so a dead link here was worse
// than no link.
//
// salon_directory (the only current audience for this email; unclaimed Google-Places-
// sourced leads, no auth.users/profiles row) has no dedicated opt-out column and adding
// one needs a migration this session cannot run (no DB-write tooling with schema
// authority available here). Nulling the row's own `email` column is a genuine,
// migration-free suppression: any future outreach send reading salon_directory by email
// (the only real consumer of this column for that purpose) can no longer reach this
// address through this table, ever, not just until a preference flag is checked. Directory
// listing display fields (name/address/phone/etc.) are untouched, only the outreach
// contact address is cleared.
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimited = await applyRateLimit(generalLimiter, { ip: `unsubscribe:${clientIp}` });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json().catch(() => ({}));
  const { data: body, error: validationError } = validateBody(unsubscribeSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }

  // Prove the caller actually received the outreach email at this address BEFORE
  // touching the database. A bare, unauthenticated email would otherwise let anyone
  // null out any of the 48 salon_directory rows' email column, which is that
  // listing's only way to ever be claimed again (see claim/route.ts:138).
  if (!verifyUnsubscribeToken(body.email, body.token)) {
    return NextResponse.json({ error: "Invalid or expired unsubscribe link" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("salon_directory")
    .update({ email: null })
    .eq("email", body.email)
    .select("id");

  if (error) {
    console.error("[unsubscribe] salon_directory update failed:", error);
    return NextResponse.json({ error: "Failed to process unsubscribe request" }, { status: 500 });
  }

  return NextResponse.json({ unsubscribed: true, listingsUpdated: data?.length ?? 0 });
}
