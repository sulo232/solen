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
const salonIds = [
  "d46e4ae5-8410-4fc9-a2da-43c978bc9477","07ff40e7-1f3b-4031-837b-6f48b7425257",
  "63e581dd-2b0e-4910-b4a5-543bc1e157f6","9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f",
  "f4f9bdc6-96e9-4bbb-819d-3a2931897e57","9956212b-166f-4a51-a880-6e99e329267a",
  "08760993-cdfd-4cc7-ac69-6a2bf8aed383","dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89",
  "0ed041f9-149b-4241-a09e-d41351be7097","5784b1ab-7314-437a-a608-01a729f02cdd",
  "97c04291-fe61-4018-8f75-3ac03c9e27e3","599bb853-c713-4dae-a3c4-96c6216139c4",
  "ca037638-362a-491b-ada2-238e20d9d4a9","6204df70-3635-45cc-ab2c-898674e198e7",
  "1a07334e-4bd5-4fff-83b0-93cc49bd796d","6e8df3d7-b8c1-4476-8507-01b358087467",
  "32b4ee24-41c1-4104-bd54-1ead30a4ec51","30d8a1c4-49a2-4a51-b8fe-8236b5d826e4",
  "f8d9c9d3-ab8c-4976-86ba-e86d101b5971","1c217cdc-f342-4790-91ec-c87709468666",
  "ff2abacd-661a-4e7a-9c00-2dda7ce29133","40c96be2-198c-471e-82d8-3ada6f7de0de",
  "23a8c8f8-4c9e-457a-a176-4b3c2881842a","6aedd8a4-30fd-4390-949c-4d1fa06e1ff1",
  "e34402f4-2986-4f63-8487-b09645395c65",
];
const ALL_STATUSES = ["open","salon_reviewing","salon_approved","salon_rejected","escalated","admin_approved","admin_rejected","refunded","charged","void","closed"];

const { data: allViaJoin } = await admin
  .from("booking_disputes")
  .select("id, status, bookings!inner(salon_id)")
  .in("bookings.salon_id", salonIds)
  .in("status", ALL_STATUSES);
console.log("all disputes for this owner (via join filter):", JSON.stringify(allViaJoin));

const { data: allRaw } = await admin.from("booking_disputes").select("id, booking_id, status");
console.log("ALL disputes in the whole table (unscoped, for comparison):", JSON.stringify(allRaw));

// Different-owner negative control: prove a random OTHER salon (not owned by this test owner) gets ZERO rows.
const { data: otherSalon } = await admin.from("salons").select("id, owner_id").not("owner_id", "eq", "3f7d3d5d-73b9-4277-a797-7b24c2dc962b").limit(1).single();
console.log("control salon (different owner):", JSON.stringify(otherSalon));
const { data: otherViaJoin, error: otherErr } = await admin
  .from("booking_disputes")
  .select("id, status, bookings!inner(salon_id)")
  .in("bookings.salon_id", [otherSalon.id])
  .in("status", ALL_STATUSES);
console.log("disputes visible to the OTHER salon (should be 0 of THIS owner's disputes):", JSON.stringify(otherViaJoin), otherErr);
