import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Minimal .env.local parser (avoid pulling in Next's env helpers).
const envRaw = readFileSync("/Users/sulo/Documents/solen/.env.local", "utf8");
const env = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Step 1: get a real salon + its bookings, mirroring the route's own logic.
const { data: salons, error: salonErr } = await admin.from("salons").select("id, name, owner_id").limit(1);
console.log("salons sample:", JSON.stringify(salons), salonErr);

const { data: allBookings, error: bErr } = await admin
  .from("bookings")
  .select("id, salon_id")
  .limit(2000);
console.log("bookings fetch error:", bErr);
console.log("total bookings fetched:", allBookings ? allBookings.length : null);

const bookingIds = (allBookings ?? []).map((b) => b.id);
console.log("bookingIds count:", bookingIds.length);
console.log("sample id:", bookingIds[0], "id length:", bookingIds[0]?.length);

// Reproduce the EXACT disputes query shape from the route, using the full booking id list.
const { data: disputes, error: disputeErr } = await admin
  .from("booking_disputes")
  .select(
    "id, booking_id, direction, reason_code, issue_type, eligibility, fast_track_recommended, requested_amount, resolved_amount, status, description, reporter_id, created_at",
  )
  .in("booking_id", bookingIds)
  .in("status", ["open", "salon_reviewing", "escalated"])
  .order("created_at", { ascending: true })
  .limit(50);

console.log("=== FULL DISPUTE ERROR ===");
console.log(JSON.stringify(disputeErr, null, 2));
console.log("disputes result:", disputes);
