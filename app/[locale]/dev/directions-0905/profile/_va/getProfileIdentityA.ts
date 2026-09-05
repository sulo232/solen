/**
 * Grounded-in: app/[locale]/profile/page.tsx (the exact `profiles` select this loader
 * mirrors: `display_name, avatar_url`), app/[locale]/dev/directions-0905/bookings-list/_va/
 * loadBookingsA.ts (the admin.auth.admin.listUsers() pattern for resolving the seed
 * customer's auth id by email, since `profiles` is keyed by the auth user id and this dev
 * route has no session to read one from).
 *
 * Exists-check: `npm run exists getProfileIdentity` -> 0, net-new. `npm run exists profile`
 * (run this turn) surfaced the real /profile/page.tsx query this mirrors, plus every
 * sub-route Direction A links to (bookings, favorites, vouchers, settings/payment,
 * haarprofil, stamps, settings) and the real `/help` route (found via Footer.tsx's
 * `labelKey: "customerHelp", href: "/help"` reference, confirmed a real page.tsx on disk).
 *
 * Server-only, dev-gated route (../../layout.tsx). Uses the admin client to bypass RLS for
 * the SAME justification seedSalon.ts / seedBooking.ts / loadBookingsA.ts already use: this
 * never runs on a real request path, only inside /dev/directions-0905/profile.
 *
 * Direction A (Fresha flat directory) renders NO sublines or counts on any destination row
 * (brief: "no group labels and no sublines or counts"), so this loader intentionally does
 * NOT fetch next-appointment / wallet / voucher / stamp values the way profile/page.tsx
 * does for the live hub: there is nowhere on this direction's screen that value would ever
 * render, and fetching data with no render site is exactly the decoration this repo's own
 * NO DECORATION rule (CLAUDE.md, owner 2026-08-19) refuses. Only the identity fields
 * (avatar + display name) that this direction's header block actually shows are loaded.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

const CUSTOMER_EMAIL = "kunde@solen.ch";

export interface ProfileIdentityA {
  displayName: string;
  avatarUrl: string | null;
}

let cache: ProfileIdentityA | null = null;

export async function getProfileIdentityA(): Promise<ProfileIdentityA> {
  if (cache) return cache;

  const supabase = createAdminSupabaseClient();

  const { data: userList, error: userErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (userErr) {
    console.error("[directions-0905/profile/_va] listUsers failed:", userErr);
    cache = { displayName: "Account", avatarUrl: null };
    return cache;
  }
  const customer = userList.users.find((u) => u.email === CUSTOMER_EMAIL);
  if (!customer) {
    console.error(`[directions-0905/profile/_va] ${CUSTOMER_EMAIL} not found.`);
    cache = { displayName: "Account", avatarUrl: null };
    return cache;
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", customer.id)
    .maybeSingle();
  if (profileErr) console.error("[directions-0905/profile/_va] profile fetch error:", profileErr.message);

  const displayName = profile?.display_name?.trim() || customer.email?.split("@")[0] || "Account";
  const avatarUrl = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  cache = { displayName, avatarUrl };
  return cache;
}
