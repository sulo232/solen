// Exists-check: `npm run exists open status map` (run this session) -> 0 hits, genuinely new.
// The real open/closed COMPUTATION already exists (computeOpenStatus, _shared.ts) and is reused
// verbatim below, never reimplemented; this file is only the missing BATCH wrapper around it, the
// same shape getSalonCardDataMap already uses for other fields (one bulk `.in("id", ids)` query,
// not a per-salon round trip). `npm run exists isOpenNow` and `npm run exists computeOpenStatus`
// were also run this session (see lib/salon-hours.ts and _shared.ts respectively, both real, both
// left untouched): computeOpenStatus is the one this file calls, because it is the version the
// live salon detail page itself uses to get a translated, locale-correct label string
// ("Open until 18:00" / "Closed Opens 10:00"), not just a boolean.
//
// Grounded-in: app/[locale]/_components/salon/_shared.ts (computeOpenStatus + nowInTimezone,
// imported not reimplemented) and lib/salon-detail.ts's loadSalonDetailWithStatus (the exact
// call pattern this file mirrors for a BATCH of salons instead of one: read the salon's own
// timezone, compute `now` in it, resolve the translator once, call computeOpenStatus per row).
//
// live-data-ok: reads real salons.opening_hours + salons.timezone columns (confirmed live this
// session, both non-null on every Basel-postal-code row sampled). No fabricated status: a salon
// with null opening_hours renders "Opening hours unknown" (computeOpenStatus's own real branch),
// never an invented "Open" or "Closed".

import { createServerSupabaseClient } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
import { computeOpenStatus, nowInTimezone, type OpenStatus } from "@/app/[locale]/_components/salon/_shared";

export type OpenStatusMap = Record<string, OpenStatus>;

/** Batch real open/closed status for `salonIds`, one query, no fabrication. A salon missing from
 *  the result (deleted, or a Supabase error) simply has no entry; the caller must handle a
 *  missing key rather than invent a status for it. */
export async function getOpenStatusMap(salonIds: string[], locale: string): Promise<OpenStatusMap> {
  const uniqueIds = [...new Set(salonIds)];
  if (uniqueIds.length === 0) return {};

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("salons")
    .select("id, opening_hours, timezone")
    .in("id", uniqueIds);

  if (error) {
    console.error("[getOpenStatusMap] salons fetch failed:", error);
    return {};
  }

  const t = await getTranslations({ locale, namespace: "salonDetail" });
  const map: OpenStatusMap = {};
  for (const row of data ?? []) {
    const id = row.id as string;
    const hours = row.opening_hours as Record<string, { open: string; close: string }> | null;
    const timezone = row.timezone as string | null;
    const now = nowInTimezone(timezone);
    map[id] = computeOpenStatus(hours, now, t);
  }
  return map;
}
