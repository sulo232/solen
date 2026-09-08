export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";
import { isStripeReady } from "@/lib/salon/stripe-ready";

// GET /api/salon/setup-progress — Returns onboarding completion status
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get salon for this owner
  const salon = await getActiveSalon<{
    id: string;
    name: string | null;
    description_de: string | null;
    phone: string | null;
    cover_photo_url: string | null;
    opening_hours: Record<string, unknown> | null;
    stripe_account_id: string | null;
    cancellation_fee_type: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
  }>(supabase, user.id, "id, name, description_de, phone, cover_photo_url, opening_hours, stripe_account_id, cancellation_fee_type, approved_at, rejection_reason", "settings");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  // Resource counts use the same gated Store after staff access is resolved.
  const admin = createAdminSupabaseClient();

  // Check services
  const { count: serviceCount } = await admin
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  // Check staff members
  const { count: staffCount } = await admin
    .from("staff_members")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  // Check staff schedules
  const { count: scheduleCount } = await admin
    .from("staff_schedules")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id);

  const hours = salon.opening_hours as Record<string, unknown> | null;
  const hasHours = hours && Object.values(hours).some((v) => v !== null);

  // Real Stripe readiness (charges_enabled && payouts_enabled), same shared check the
  // go-live POST gate uses, not just a bare stripe_account_id presence. isStripeReady
  // fails closed (false) and console.errors on any Stripe API error, so a Stripe outage
  // never throws this route, it just leaves go_live incomplete until the API recovers.
  const hasStripeReady = await isStripeReady(salon.stripe_account_id);

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
      // Mirrors the go-live POST gate EXACTLY (app/api/salon/go-live/route.ts), all 4
      // requirements, not an approximation: admin approval (approved_at set), real Stripe
      // readiness (shared isStripeReady, not a bare stripe_account_id presence), a cover
      // photo, and at least 1 active service.
      complete: !!(salon.approved_at && hasStripeReady && salon.cover_photo_url && (serviceCount ?? 0) >= 1),
    },
  ];

  const completed = steps.filter((s) => s.complete).length;
  const total = steps.length;
  const percentage = Math.round((completed / total) * 100);

  // Owner decision 8 (TASTE_LOG 2026-08-09, "i approve for every salon"): approval is a gate the
  // owner cannot clear himself, so the dashboard has to NAME it. Without this the go_live step just
  // sat unchecked next to an "Einrichten" link pointing at a wizard that cannot help, which reads
  // as silence. Derived from columns that already exist, nothing fabricated.
  const approvalState = salon.approved_at
    ? "approved"
    : salon.rejection_reason
      ? "rejected"
      : "pending";

  return NextResponse.json({
    salon_id: salon.id,
    steps,
    completed,
    total,
    percentage,
    approval_state: approvalState,
    rejection_reason: salon.rejection_reason,
    is_live: percentage === 100,
  });
}
