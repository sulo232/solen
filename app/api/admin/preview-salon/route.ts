import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREVIEW_COOKIE = "solen_admin_preview";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { salon_id } = body ?? {};
  if (!salon_id) return NextResponse.json({ message: "salon_id required" }, { status: 400 });

  // Verify it's a test salon (must have [TEST] prefix)
  const adminClient = createAdminSupabaseClient();
  const { data: salon } = await adminClient
    .from("salons")
    .select("id, name")
    .eq("id", salon_id)
    .ilike("name", "[TEST]%")
    .single();

  if (!salon) {
    return NextResponse.json({ message: "Not a test salon or not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, salon_name: salon.name });
  response.cookies.set(PREVIEW_COOKIE, salon_id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  return response;
}

export async function DELETE(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREVIEW_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
