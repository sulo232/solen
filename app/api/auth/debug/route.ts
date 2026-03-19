export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * Debug route: shows what cookies the server sees and whether getSession() finds a user.
 * DELETE THIS AFTER DEBUGGING.
 */
export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(c => c.name.includes("auth") || c.name.includes("sb-"));
  
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totalCookies: allCookies.length,
    authCookieNames: authCookies.map(c => c.name),
    authCookieValues: authCookies.map(c => ({ name: c.name, length: c.value.length, first20: c.value.slice(0, 20) })),
    sessionExists: !!session,
    userId: session?.user?.id ?? null,
    userEmail: session?.user?.email ?? null,
    sessionError: error?.message ?? null,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
  });
}
