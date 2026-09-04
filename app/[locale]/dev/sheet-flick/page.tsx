// Exists-check: `npm run exists sheet` , the `Sheet` primitive
// (app/[locale]/_components/primitives/Sheet.tsx) and its 12 existing call sites already
// exist and are reused unmodified in the "Current" column below (imported, not copied).
// `npm run exists flick` , 0 matches, no existing flick-physics surface. The one new thing
// on this route: a dev-only side-by-side of the real Sheet against the velocity-aware
// gesture-release physics from `_plans/BRANCH_TRIAGE_2026-09-04.md` ("IMPORTANT AND
// MISSING"), stranded on `claude/context-compact-architecture-5d1ace` and never merged.
//
// Production gate below hides this from Netlify prod, same convention as every other
// app/[locale]/dev/* route.

import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import SheetFlickClient from "./_SheetFlickClient";

export default async function SheetFlickDevPage() {
  if (process.env.NODE_ENV === "production") notFound();

  // Real seeded salon names, fetched the same way the live marketplace query does
  // (app/api/salons/route.ts: is_active + listed_on_marketplace + is_test=false),
  // so the sheet body is real content, never invented rows.
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("salons")
    .select("id, name")
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .order("name", { ascending: true })
    .limit(6);

  if (error) {
    console.error("[dev/sheet-flick] salons fetch failed:", error);
  }

  const salonNames = (data ?? []).map((row) => row.name).filter((n): n is string => Boolean(n));

  return <SheetFlickClient salonNames={salonNames} />;
}
