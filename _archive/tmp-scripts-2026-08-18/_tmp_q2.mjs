import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,"")];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SALON = "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f";
const now = new Date();
const bk = await db.from("bookings").select("starts_at, ends_at, status, guest_name, estimated_price, staff_member_id, services(name_en, duration_minutes)").eq("salon_id", SALON).gte("starts_at", new Date(now.getTime()-1*864e5).toISOString()).lt("starts_at", new Date(now.getTime()+9*864e5).toISOString()).order("starts_at");
const fmtD = new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit"});
const fmtT = new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Zurich",hour:"2-digit",minute:"2-digit",hour12:false});
const names = {"232ef754-5ffa-4b17-a00e-ae6b13b636ce":"Nina","74271b1d-365b-47a4-b3ff-73bd1e3a205a":"Mia","9c49bc89-a414-4d63-af62-445588acbeea":"Jonas"};
const byDay = {};
for (const b of bk.data ?? []) {
  const d = fmtD.format(new Date(b.starts_at));
  (byDay[d] ??= []).push(`${fmtT.format(new Date(b.starts_at))}-${fmtT.format(new Date(b.ends_at))} ${b.status.padEnd(16)} ${(names[b.staff_member_id]??"none").padEnd(6)} ${String(b.services?.duration_minutes).padEnd(4)} ${b.guest_name} / ${b.services?.name_en}`);
}
for (const [d, rows] of Object.entries(byDay)) { console.log("== "+d+"  ("+rows.length+" bookings)"); rows.forEach(r=>console.log("   "+r)); }
const q = await db.from("barber_walkin_queue").select("customer_name, status, position, joined_at, started_at, estimated_wait_minutes, services(name_en,duration_minutes)").eq("salon_id", SALON).in("status",["waiting","in_chair"]);
console.log("QUEUE:", JSON.stringify(q.data));
const sv = await db.from("services").select("name_en, duration_minutes, price").eq("salon_id", SALON).order("duration_minutes");
console.log("SERVICES:", JSON.stringify(sv.data));
// blocked / non-booked slots
const sl = await db.from("availability_slots").select("starts_at, ends_at, status, staff_member_id, block_reason").eq("salon_id", SALON).gte("starts_at", new Date(now.getTime()-1*864e5).toISOString()).lt("starts_at", new Date(now.getTime()+9*864e5).toISOString()).neq("status","available");
console.log("NON-AVAILABLE SLOTS:", (sl.data??[]).length, JSON.stringify((sl.data??[]).slice(0,10)));
const cl = await db.from("salon_closures").select("*").eq("salon_id", SALON);
console.log("CLOSURES:", JSON.stringify(cl.data), cl.error?.message);
