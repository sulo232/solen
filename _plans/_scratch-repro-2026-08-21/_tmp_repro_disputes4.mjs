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

const { data: users, error: userErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
console.log("total users listed:", users.users.length, userErr);
const devUser = users.users.find((u) => u.email === "hiroseseiju@proton.me");
console.log("dev owner user id:", devUser ? devUser.id : "STILL NOT FOUND");
if (!devUser) process.exit(0);

const { data: salons } = await admin.from("salons").select("id, name, owner_id").eq("owner_id", devUser.id);
console.log("owned salons:", JSON.stringify(salons));
const salonIds = salons.map((s) => s.id);

const { data: bookings, error: bErr } = await admin.from("bookings").select("id").in("salon_id", salonIds);
console.log("bookings count for this owner's salon(s):", bookings ? bookings.length : null, bErr);

const bookingIds = (bookings ?? []).map((b) => b.id);
const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/booking_disputes?select=id&booking_id=in.(${bookingIds.join(",")})&limit=1`;
console.log("real-route URL length:", url.length);
try {
  const res = await fetch(url, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
  console.log("real-route status:", res.status, res.statusText, "content-type:", res.headers.get("content-type"));
  console.log("body:", (await res.text()).slice(0, 500));
} catch (e) {
  console.log("real-route fetch threw:", e.message, e.cause?.code);
}
