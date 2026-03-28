export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/salon/setup-progress — Returns onboarding completion status
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get salon for this owner
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, description_de, phone, cover_photo_url, opening_hours, stripe_account_id, cancellation_fee_type")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  // Check services
  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  // Check staff members
  const { count: staffCount } = await supabase
    .from("staff_members")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  // Check staff schedules
  const { count: scheduleCount } = await supabase
    .from("staff_schedules")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id);

  const hours = salon.opening_hours as Record<string, unknown> | null;
  const hasHours = hours && Object.values(hours).some((v) => v !== null);

  const steps = [
    {
      key: "profile",
      complete: !!(salon.name && salon.description_de && salon.phone),
    },
    {
      key: "hours",
      complete: !!hasHours,
    },
    {
      key: "services",
      complete: (serviceCount ?? 0) >= 1,
    },
    {
      key: "staff",
      complete: (staffCount ?? 0) >= 1,
    },
    {
      key: "schedule",
      complete: (scheduleCount ?? 0) >= 1,
    },
    {
      key: "payments",
      complete: !!salon.stripe_account_id,
    },
    {
      key: "go_live",
      // Complete when at least profile + hours + 1 service are done
      complete: !!(salon.name && salon.description_de && hasHours && (serviceCount ?? 0) >= 1),
    },
  ];

  const completed = steps.filter((s) => s.complete).length;
  const total = steps.length;
  const percentage = Math.round((completed / total) * 100);

  return NextResponse.json({
    salon_id: salon.id,
    steps,
    completed,
    total,
    percentage,
    is_live: percentage === 100,
  });
}
