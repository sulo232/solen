export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// POST /api/services/import — CSV import for services
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const salonId = formData.get("salon_id") as string | null;

  if (!file || !salonId) {
    return NextResponse.json({ error: "file and salon_id required" }, { status: 400 });
  }

  // Verify ownership
  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("id, owner_id, categories").eq("id", salonId).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read CSV content (limit 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 413 });
  }

  const csvText = await file.text();
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  // Parse header — support both DE and EN column names
  const headerLine = lines[0];
  const headers = headerLine.split(/[,;\t]/).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  const nameIdx = headers.findIndex((h) => /^(service.?name|behandlung|name|name_de|service)$/i.test(h));
  const priceIdx = headers.findIndex((h) => /^(price|preis|cost|kosten)$/i.test(h));
  const durationIdx = headers.findIndex((h) => /^(duration|dauer|duration.?minutes|min|minuten)$/i.test(h));
  const categoryIdx = headers.findIndex((h) => /^(category|kategorie|cat)$/i.test(h));

  if (nameIdx === -1) {
    return NextResponse.json({ error: "CSV must have a 'Name' or 'Behandlung' or 'Service Name' column" }, { status: 400 });
  }

  const servicesToInsert: Record<string, unknown>[] = [];
  const errors: string[] = [];
  const defaultCategory = salon.categories?.[0] ?? "coiffeur";

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[nameIdx];
    if (!name) continue;

    const price = priceIdx !== -1 ? parseFloat(cols[priceIdx]) : 0;
    const duration = durationIdx !== -1 ? parseInt(cols[durationIdx], 10) : 60;
    const category = categoryIdx !== -1 ? cols[categoryIdx] : defaultCategory;

    if (isNaN(price)) { errors.push(`Row ${i + 1}: Invalid price`); continue; }
    if (isNaN(duration) || duration <= 0) { errors.push(`Row ${i + 1}: Invalid duration`); continue; }

    servicesToInsert.push({
      salon_id: salonId,
      name_de: name,
      name_en: null,
      category,
      duration_minutes: duration,
      price: price || 0,
      is_active: true,
      sort_order: i,
    });
  }

  if (servicesToInsert.length === 0) {
    return NextResponse.json({ error: "No valid services found in CSV", errors }, { status: 400 });
  }

  const { data: inserted, error } = await admin
    .from("services")
    .insert(servicesToInsert)
    .select("id, name_de");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    imported: inserted?.length ?? 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}
