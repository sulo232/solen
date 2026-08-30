import { readFileSync } from "fs";
const envRaw = readFileSync("/Users/sulo/Documents/solen/.env.local", "utf8");
const env = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { createClient } = await import("@supabase/supabase-js");
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Control A: tiny .in() list, same table, same shape, known-good expectation.
const { data: threeDisputes } = await admin.from("booking_disputes").select("id, booking_id, status").limit(5);
console.log("all disputes (unfiltered, sanity):", JSON.stringify(threeDisputes));

const tinyIds = (threeDisputes ?? []).map((d) => d.booking_id).filter(Boolean);
console.log("tiny booking_id control list:", tinyIds);

const { data: controlData, error: controlErr } = await admin
  .from("booking_disputes")
  .select("id, booking_id, direction, reason_code, issue_type, eligibility, fast_track_recommended, requested_amount, resolved_amount, status, description, reporter_id, created_at")
  .in("booking_id", tinyIds)
  .in("status", ["open", "salon_reviewing", "escalated", "salon_approved", "salon_rejected", "admin_approved", "admin_rejected", "refunded", "charged", "void", "closed"])
  .order("created_at", { ascending: true })
  .limit(50);
console.log("CONTROL (tiny .in) error:", JSON.stringify(controlErr));
console.log("CONTROL (tiny .in) data:", JSON.stringify(controlData));

// Sweep: find the approx URL-length breakpoint between working and failing.
const { data: allBookings } = await admin.from("bookings").select("id").limit(2000);
const allIds = allBookings.map((b) => b.id);
for (const n of [50, 150, 300, 500, 700, 800, 850, 900, 950, 997]) {
  const subset = allIds.slice(0, n);
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/booking_disputes?select=id&booking_id=in.(${subset.join(",")})&limit=1`;
  const res = await fetch(url, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
  console.log(`n=${n} urlLen=${url.length} status=${res.status}`);
}
