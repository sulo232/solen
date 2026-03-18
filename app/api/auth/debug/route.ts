import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Temporary debug endpoint — DELETE after fixing auth
export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll();
  const supabaseCookies = allCookies.filter(c => c.name.startsWith("sb-"));
  
  let response = NextResponse.json({});
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.json({});
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  const debugInfo = {
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30),
    },
    cookies: {
      total: allCookies.length,
      names: allCookies.map(c => c.name),
      supabaseCount: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      supabaseCookieSizes: supabaseCookies.map(c => ({ name: c.name, size: c.value.length })),
    },
    auth: {
      hasUser: !!user,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error: error?.message ?? null,
    },
  };

  // Return response that may have updated cookies
  return NextResponse.json(debugInfo);
}
