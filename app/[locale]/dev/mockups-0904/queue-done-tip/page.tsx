// Grounded-in: app/[locale]/queue/[token]/page.tsx (the isDone block, byte-copied into
// QueueDoneTipClient.tsx since it isn't exported), app/[locale]/_components/tips/TipSheet.tsx,
// app/[locale]/_components/tips/TipFlow.tsx, app/[locale]/walk-in-tip/[token]/page.tsx
//
// Exists-check: `npm run exists queue-done-tip` ran this turn. Its only 2 hits are this task's own
// sibling file (QueueDoneTipClient.tsx, written earlier this session) and its exported symbol.
// No REMOVED.md hit for a walk-in tip control. The target surface, app/[locale]/queue/[token]/page.tsx,
// already renders the done state (rating -> TipFlow reveal at rating>=3) but has ZERO way to open a
// tip from the screen without rating first, and grep for "TipSheet" in that file returns 0 matches.
// The one new thing: a control that opens the existing, unmodified <TipSheet> directly from the done
// screen, independent of the rating gate.
//
// Depicts: walk-in done screen (byte-copy, not exported from its page) -> app/[locale]/queue/[token]/page.tsx
//   isDone block (lines ~216-306 as read this session)
// Depicts: tip bottom sheet -> app/[locale]/_components/tips/TipSheet.tsx (real, unmodified import,
//   composed inside QueueDoneTipClient.tsx)
// Depicts: tip flow -> app/[locale]/_components/tips/TipFlow.tsx (real, unmodified import, inside TipSheet)
// Mockup-scope: section

import { createAdminSupabaseClient } from "@/lib/supabase";
import QueueDoneTipClient, { type DoneData } from "./QueueDoneTipClient";

export default async function QueueDoneTipPage() {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const admin = createAdminSupabaseClient();

  // Real completed walk-in visit, same status the tracker's own findQueueEntryByToken query
  // resolves (app/api/walkin/queue/status/route.ts), picked with an assigned barber + service so
  // the done screen renders its full real info stack (barber chip + service line). Nothing here
  // is invented: this is a seeded row from the live table, queried the way the app queries it.
  const { data: entry, error: entryError } = await admin
    .from("barber_walkin_queue")
    .select("id, customer_name, salon_id, assigned_barber_id, preferred_barber_id, service_id, completed_at")
    .eq("status", "completed")
    .not("assigned_barber_id", "is", null)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (entryError) console.error("[dev/queue-done-tip] completed walk-in fetch failed:", entryError);

  const barberId = entry?.assigned_barber_id ?? entry?.preferred_barber_id ?? null;
  const [staffRes, svcRes, salonRes] = await Promise.all([
    barberId
      ? admin.from("staff_members").select("name, avatar_url, average_rating, review_count").eq("id", barberId).maybeSingle()
      : Promise.resolve({ data: null }),
    entry?.service_id
      ? admin.from("services").select("name_en, price, duration_minutes").eq("id", entry.service_id).maybeSingle()
      : Promise.resolve({ data: null }),
    entry?.salon_id
      ? admin.from("salons").select("name, slug").eq("id", entry.salon_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const staff = staffRes?.data as { name: string; avatar_url: string | null; average_rating: number | null; review_count: number | null } | null;
  const svc = svcRes?.data as { name_en: string | null; price: number | null; duration_minutes: number | null } | null;
  const salon = salonRes?.data as { name: string | null; slug: string | null } | null;

  const data: DoneData = {
    recipientName: staff?.name ?? "your stylist",
    recipientPhoto: staff?.avatar_url ?? null,
    recipientRating: staff?.average_rating ?? null,
    recipientReviewCount: staff?.review_count ?? null,
    serviceName: svc?.name_en ?? null,
    salonName: salon?.name ?? null,
    salonSlug: salon?.slug ?? null,
  };

  return (
    <main className="min-h-[100dvh] bg-white pb-16">
      <div className="pt-6">
        <div className="px-5">
          <h1 className="font-display text-[18px] font-bold text-s-ink">Queue done screen: tip in one tap</h1>
          <p className="mt-1 text-[13px] text-s-ink-2">
            Real completed walk-in visit{entry ? ` (${entry.customer_name ?? "no name captured"}, ${salon?.name ?? "salon"})` : ""}: current screen, then two ways to open the tip sheet without rating first.
          </p>
        </div>
        <QueueDoneTipClient data={data} />
      </div>
    </main>
  );
}
