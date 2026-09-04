// Grounded-in: app/[locale]/_components/primitives/DateTimePicker.tsx (real, unmodified import,
// this is the surface the whole mockup is built from) + components-legacy/booking/DateTimeStep.tsx
// (the real booking step whose props shape is mirrored: dateLayout="strip", selectedTone="accent").
//
// Exists-check: `npm run exists slot-radius` → 3 matches, all this task's own sibling files
// (ProposedTimeSlotBlock.tsx, SlotRadiusClient.tsx, written earlier this turn). No REMOVED.md hit
// for "slot radius" / "time slot" / "DateTimePicker". The real target primitive is
// app/[locale]/_components/primitives/DateTimePicker.tsx, whose time-slot buttons are wired into
// production booking today via components-legacy/booking/DateTimeStep.tsx (dateLayout="strip",
// selectedTone="accent", real slots from GET /api/availability/time-slots). The one new thing:
// this comparison route + the two sibling files in this folder.
//
// Depicts: real booking day-strip + time-slot grid → app/[locale]/_components/primitives/DateTimePicker.tsx
//   (the exact component components-legacy/booking/DateTimeStep.tsx renders in production)
// Depicts: real availability data → app/api/availability/time-slots/route.ts's own query
//   (availability_slots, status='available', filtered by service duration), replicated below
//   directly against the DB (same table, same filters, same day-boundary math) for one real,
//   live, publicly-listed salon (muse-beauty-studio) and one of its real services that actually
//   has open slots, instead of an extra network hop to the route from a server component.
//
// Mockup-scope: section (the time-slot buttons inside DateTimePicker; day-strip/calendar/CTA
// chrome shown around them only because the real component always renders them together).
//
// Type-budget note (measured live at 390px via getComputedStyle, not source grep): this page
// renders 6 distinct visible font sizes {12, 12.5, 13, 14, 18, 22} and 2 weights {400, 500},
// over the <=4-size ceiling. 5 of the 6 sizes come from the real, unmodified DateTimePicker
// component itself (SectionHeading 18, day-number 22, day-label/more-label 12, group-label 12.5,
// slot 14) , that component already carries 5 sizes in ONE instance, before this comparison page
// doubles the instance count, so the overage is INHERITED from the FIXED surface this mockup
// depicts, not introduced by the radius VARY. The 6th size (13px) is this mockup's own required
// "Current:" / "Proposed:" caption label. Nothing here was fixed by re-sizing the real component,
// because the brief holds everything but the slot radius FIXED.

import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { SlotRadiusClient } from "./SlotRadiusClient";

interface RawSlot {
  time: string;
  available: boolean;
}

async function loadRealSlots(): Promise<{ dateISO: string; slots: RawSlot[] } | null> {
  const admin = createAdminSupabaseClient();

  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("slug", "muse-beauty-studio")
    .eq("is_active", true)
    .maybeSingle();
  if (!salon) return null;

  // Find a real service on this salon that actually has open availability_slots rows
  // (not every service does; the cheapest-N services a generic seed loader would pick
  // are not guaranteed to be the ones with real slots).
  const { data: sample } = await admin
    .from("availability_slots")
    .select("service_id")
    .eq("salon_id", salon.id)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .limit(50);
  const counts = new Map<string, number>();
  for (const row of sample ?? []) {
    if (!row.service_id) continue;
    counts.set(row.service_id, (counts.get(row.service_id) ?? 0) + 1);
  }
  const serviceId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!serviceId) return null;

  const { data: service } = await admin
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .maybeSingle();
  const durationMinutes = service?.duration_minutes ?? 30;

  // Same day-boundary math as app/api/availability/time-slots/route.ts, replicated here
  // (server component, same table/filters, no invented data).
  for (let i = 0; i < 14; i++) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    const zOff = (() => {
      const guess = new Date(`${date}T12:00:00Z`);
      const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
      const asZ = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
      return asZ.getTime() - asUtc.getTime();
    })();
    const startOfDay = new Date(new Date(`${date}T00:00:00Z`).getTime() - zOff).toISOString();
    const endOfDay = new Date(new Date(`${date}T23:59:59Z`).getTime() - zOff).toISOString();

    const { data: rows } = await admin
      .from("availability_slots")
      .select("id, starts_at, ends_at")
      .eq("salon_id", salon.id)
      .eq("status", "available")
      .eq("service_id", serviceId)
      .gte("starts_at", startOfDay)
      .lte("starts_at", endOfDay);

    const valid = (rows ?? []).filter((r) => {
      const durMs = new Date(r.ends_at).getTime() - new Date(r.starts_at).getTime();
      return durMs / 60000 >= durationMinutes;
    });
    const times = Array.from(
      new Set(
        valid.map((r) =>
          new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", hour12: false }).format(
            new Date(r.starts_at),
          ),
        ),
      ),
    ).sort();

    if (times.length >= 6) {
      return { dateISO: date, slots: times.map((time) => ({ time, available: true })) };
    }
  }
  return null;
}

export default async function SlotRadiusPage() {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const real = await loadRealSlots();
  if (!real) {
    return (
      <div className="mx-auto w-full max-w-[402px] bg-white px-4 pt-6 pb-16">
        <p className="text-[13px] text-s-ink-2">
          No live availability_slots with 6+ open times were found for muse-beauty-studio in the
          next 14 days. Not fabricating a slot list; report this back instead of mocking fake data.
        </p>
      </div>
    );
  }

  // Middle slot, not the first, so the selected/blue state is visibly distinct from "first item".
  const defaultSelectedTime = real.slots[Math.floor(real.slots.length / 2)].time;

  return (
    <SlotRadiusClient
      initialDateISO={real.dateISO}
      slots={real.slots}
      defaultSelectedTime={defaultSelectedTime}
    />
  );
}
