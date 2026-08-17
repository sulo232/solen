import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: wq, error: wqErr } = await supabase.from("barber_walkin_queue").select("status");
  if (wqErr) console.error("wq err", wqErr);
  else console.log("barber_walkin_queue distinct status:", [...new Set(wq.map(r => r.status))]);

  const { data: bk, error: bkErr } = await supabase.from("bookings").select("status");
  if (bkErr) console.error("bk err", bkErr);
  else console.log("bookings distinct status:", [...new Set(bk.map(r => r.status))]);
}
main();
