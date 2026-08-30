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
const { data: allBookings } = await admin.from("bookings").select("id").limit(2000);
const bookingIds = allBookings.map((b) => b.id);

const ids = bookingIds.join(",");
const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/booking_disputes?select=id,booking_id,status&booking_id=in.(${ids})&status=in.(open,salon_reviewing,escalated)&order=created_at.asc&limit=50`;
console.log("URL length:", url.length);

const res = await fetch(url, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
});
console.log("HTTP status:", res.status);
console.log("status text:", res.statusText);
const text = await res.text();
console.log("RAW BODY:", text.slice(0, 2000));
console.log("Content-Type header:", res.headers.get("content-type"));
