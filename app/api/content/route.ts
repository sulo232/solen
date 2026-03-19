export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/content?keys=hero_title,hero_subtitle&locale=de — public
export async function GET(req: NextRequest) {
  try {
    const keysParam = req.nextUrl.searchParams.get("keys");
    const locale = req.nextUrl.searchParams.get("locale") ?? "de";

    if (!keysParam) {
      return NextResponse.json({ error: "keys parameter required" }, { status: 400 });
    }

    const keys = keysParam.split(",").map((k) => k.trim()).filter(Boolean);
    const localeColumn = `value_${locale}`;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[api/content GET] SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("site_content")
      .select("key, value_de, value_en, value_fr, is_auto, auto_override")
      .in("key", keys);

    if (error) {
      console.error("[api/content GET] query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const content: Record<string, string> = {};
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const value = row.is_auto && row.auto_override
        ? row.auto_override
        : (r[localeColumn] as string) ?? "";
      content[row.key] = value;
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("[api/content GET] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
