export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { isSafeRelativePath } from "@/lib/url-safety";

// ─────────────────────────────────────────────────────────────
// DEV-ONLY login. Signs in a TEST salon-owner fixture via a
// service-role magic-link (no password) so the dashboard is
// reachable in local dev. HARD-GATED to NODE_ENV === "development"
// → returns 404 on the Netlify production build (next build sets
// NODE_ENV=production), so it can never bypass auth in prod.
// Not the owner's personal/admin account — a seed test owner.
// ─────────────────────────────────────────────────────────────

const DEV_OWNER_EMAIL = "hiroseseiju@proton.me"; // seed test salon-owner fixture

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = req.nextUrl.searchParams.get("email") || DEV_OWNER_EMAIL;

  // 1) service-role: mint a one-time magic-link token for the fixture user
  const admin = createAdminSupabaseClient();
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link?.properties?.hashed_token) {
    return NextResponse.json({ error: "generateLink failed", detail: linkErr?.message ?? null }, { status: 500 });
  }

  // 2) verify the token with an SSR client that writes the session cookies onto our redirect response.
  //    Use a RELATIVE Location so the browser resolves it against the request's real origin. Behind a
  //    tunnel/proxy (e.g. cloudflared) req.url's host is localhost, which would otherwise redirect to
  //    https://localhost:3000/... and dead-end the device. A relative path stays on the current host.
  const rawToPath = req.nextUrl.searchParams.get("to") || "/de/dashboard";
  // SECURITY: shared guard (lib/url-safety.ts), same one app/api/auth/callback/route.ts uses.
  const toPath = isSafeRelativePath(rawToPath) ? rawToPath : "/";
  const res = new NextResponse(null, { status: 307, headers: { Location: toPath } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (toSet: any[]) => toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );
  const { error: otpErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (otpErr) {
    return NextResponse.json({ error: "verifyOtp failed", detail: otpErr.message }, { status: 500 });
  }

  return res;
}
