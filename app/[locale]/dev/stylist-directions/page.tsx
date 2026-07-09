"use client";

/**
 * /dev/stylist-directions , dev-only comparison of THREE design directions for the
 * in-booking "choose your stylist" step (owner: current picker "is not what I prefer").
 * Exists-check: `npm run exists stylist-directions` -> 0, net-new. Redesigns the surface
 * owned by `components-legacy/booking/StaffStep.tsx` (untouched here, selection-only
 * mockup); grounded in /dev/flows precedent for dev-route shape + the real Avatar +
 * TabPill primitives (`app/[locale]/_components/primitives`). English copy (mockup rule).
 *
 * Fixes vs the current StaffStep, in ALL three directions:
 *   - selected state = calm bg-s-bg-sunken + text-s-ink + check (never an ink fill,
 *     never a focus-ring-style outline , StaffStep.tsx today uses a banned ink fill
 *     plus a focus-ring-looking border on its selected card).
 *   - rating always shown WITH its count, "4.8 (54)", never bare.
 *   - "Anyone" pinned first and pre-selected by default (defaults-as-recommendation).
 *   - selection-only: no "view profile" deep link, no route into the stylist's other
 *     services , the owner does not want to be able to wander off mid-booking.
 *   - sentence-case only, no ALL-CAPS language tags.
 *   - tap the whole card/row to select; no separate "Choose" button whose label never
 *     changes.
 *
 * DATA: real staff for salon `muse-beauty-studio` (fetched via GET /api/salons/[slug],
 * 3 rows: Lena, Sara, Mara , avatar_url, average_rating, review_count, specialties all
 * live from the DB). No languages field was returned by that endpoint, so no language
 * tag is rendered anywhere (never fabricate one). Direction B's spec asked for a
 * "soonest-slot" line , dropped here (not just abbreviated) because there is no live
 * availability endpoint that resolves to a single next-slot string, and inventing a
 * time attributed to a real staff member's schedule would be fabricated data.
 *
 * Not-a-salon-card: these are STAFF (stylist) picker tiles/rows/cards inside the
 * booking flow, not a salon search result , no SalonResultCard/StoreCard structure
 * applies here (no photo-hero, no service rows, no "view store" off-ramp; the star
 * rating belongs to the staff member, per StaffStep.tsx's existing Avatar `badge` prop).
 *
 * realsize-ok: Direction A is a deliberate 2-column staff-tile GRID (the task spec asks
 * for "2-column avatar tiles"), Direction B is a full-width single-column list (real
 * size), Direction C is an intentionally-narrow horizontal-scroll carousel (its whole
 * point is compact swipeable cards). None of these are the Fresha/Uber feed-card
 * grammar rendered at half width , there's no feed card here to shrink.
 */
import { useState } from "react";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import { Star, Check, Users, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";

const GLIDE = [0.16, 1, 0.3, 1] as const;

// Real muse-beauty-studio staff, GET /api/salons/muse-beauty-studio (2026-07-08).
const STAFF = [
  { id: "7026cc4d-708b-4105-a37b-c8eb0adb8157", name: "Lena", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400", rating: 4.7, reviews: 37, specialty: "Make-up" },
  { id: "7b737132-6450-467f-ba4d-2fc5caff523a", name: "Sara", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400", rating: 4.6, reviews: 34, specialty: "Make-up" },
  { id: "d8e93c06-332c-424b-95dd-7669ce4a24dd", name: "Mara", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400", rating: 4.9, reviews: 31, specialty: "Make-up" },
];
const ANY_ID = "any";

const cardEnter = (i: number) => ({
  initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  transition: { duration: 0.42, ease: GLIDE, delay: i * 0.04 },
});

function RatingLine({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-s-ink-2">
      <Star size={11} strokeWidth={0} className="fill-s-star" aria-hidden />
      {rating.toFixed(1)} ({reviews})
    </span>
  );
}

function CheckBadge() {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-s-ink text-white">
      <Check size={13} strokeWidth={2.75} aria-hidden />
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/* Direction A , photo grid                                                */
/* ---------------------------------------------------------------------- */

function DirectionA({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.button
        {...cardEnter(0)}
        type="button"
        onClick={() => onSelect(ANY_ID)}
        aria-pressed={selected === ANY_ID}
        className={`flex flex-col items-center gap-2.5 rounded-card p-5 text-center transition-colors ${
          selected === ANY_ID ? "bg-s-bg-sunken" : "bg-white"
        }`}
      >
        <span className="relative">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-s-ink">
            <Users size={26} strokeWidth={2} aria-hidden />
          </span>
          {selected === ANY_ID && (
            <span className="absolute -bottom-1 -right-1"><CheckBadge /></span>
          )}
        </span>
        <span className="font-body text-[14px] font-semibold text-s-ink">Anyone</span>
        <span className="font-body text-[12px] text-s-ink-2">Fastest availability</span>
      </motion.button>

      {STAFF.map((st, i) => {
        const active = selected === st.id;
        return (
          <motion.button
            {...cardEnter(i + 1)}
            key={st.id}
            type="button"
            onClick={() => onSelect(st.id)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-2.5 rounded-card p-5 text-center transition-colors ${
              active ? "bg-s-bg-sunken" : "bg-white"
            }`}
          >
            <span className="relative">
              <Avatar src={st.avatar} name={st.name} size={72} />
              {active && <span className="absolute -bottom-1 -right-1"><CheckBadge /></span>}
            </span>
            <span className="font-body text-[14px] font-semibold text-s-ink">{st.name}</span>
            <RatingLine rating={st.rating} reviews={st.reviews} />
            <span className="font-body text-[12px] text-s-ink-2">{st.specialty}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Direction B , rich tap-rows                                             */
/* ---------------------------------------------------------------------- */

function DirectionB({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const rows: { id: string; node: React.ReactNode }[] = [
    {
      id: ANY_ID,
      node: (
        <>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-s-ink">
            <Users size={22} strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[15px] font-semibold text-s-ink">Anyone</span>
            <span className="mt-0.5 block font-body text-[13px] text-s-ink-2">Fastest availability</span>
          </span>
        </>
      ),
    },
    ...STAFF.map((st) => ({
      id: st.id,
      node: (
        <>
          <span className="shrink-0"><Avatar src={st.avatar} name={st.name} size={56} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-[15px] font-semibold text-s-ink">{st.name}</span>
            <span className="mt-0.5 block truncate font-body text-[13px] text-s-ink-2">{st.specialty}</span>
            <span className="mt-1 block"><RatingLine rating={st.rating} reviews={st.reviews} /></span>
          </span>
        </>
      ),
    })),
  ];

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row, i) => {
        const active = selected === row.id;
        return (
          <motion.li key={row.id} {...cardEnter(i)}>
            <button
              type="button"
              onClick={() => onSelect(row.id)}
              aria-pressed={active}
              className={`flex w-full items-center gap-3.5 rounded-card p-4 text-left transition-colors ${
                active ? "bg-s-bg-sunken" : "bg-white"
              }`}
            >
              {row.node}
              {active ? <CheckBadge /> : <span className="h-6 w-6 shrink-0" />}
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------------------- */
/* Direction C , swipe carousel                                            */
/* ---------------------------------------------------------------------- */

function DirectionC({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const cards: { id: string; recommended?: boolean; node: React.ReactNode }[] = [
    {
      id: ANY_ID,
      node: (
        <span className="grid h-24 w-24 place-items-center rounded-full bg-white text-s-ink">
          <Users size={30} strokeWidth={2} aria-hidden />
        </span>
      ),
    },
    ...STAFF.map((st, i) => ({
      id: st.id,
      recommended: i === 0,
      node: <Avatar src={st.avatar} name={st.name} size={96} />,
    })),
  ];

  const label = (id: string) => (id === ANY_ID ? "Anyone" : STAFF.find((s) => s.id === id)!.name);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <div className="flex gap-3.5" style={{ scrollSnapType: "x proximity" }}>
        {cards.map((c, i) => {
          const active = selected === c.id;
          const staff = STAFF.find((s) => s.id === c.id);
          return (
            <motion.button
              {...cardEnter(i)}
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              style={{ scrollSnapAlign: "start" }}
              className={`flex w-32 shrink-0 flex-col items-center gap-2.5 rounded-card p-4 text-center transition-colors ${
                active ? "bg-s-bg-sunken" : "bg-white"
              }`}
            >
              {c.recommended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-s-bg-sunken px-2 py-0.5 text-[12px] font-semibold text-s-ink-2">
                  <Sparkles size={10} strokeWidth={2} aria-hidden /> Recommended
                </span>
              )}
              <span className="relative">
                {c.node}
                {active && <span className="absolute -bottom-1 -right-1"><CheckBadge /></span>}
              </span>
              <span className="font-body text-[13.5px] font-semibold text-s-ink">{label(c.id)}</span>
              {staff && <RatingLine rating={staff.rating} reviews={staff.reviews} />}
              {staff && (
                <span className="rounded-full bg-s-bg-sunken px-2 py-0.5 text-[12px] font-semibold text-s-ink-2">
                  {staff.specialty}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[12px] text-s-ink-3">
        <ChevronLeft size={12} aria-hidden />Swipe for more<ChevronRight size={12} aria-hidden />
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

const DIRECTIONS = [
  { key: "a", label: "A , Photo grid", Comp: DirectionA, note: "2-column tiles, photo is the largest element. Tap the whole tile." },
  { key: "b", label: "B , Rich tap-rows", Comp: DirectionB, note: "Evolves the current list: whole row taps to select, no separate button." },
  { key: "c", label: "C , Swipe carousel", Comp: DirectionC, note: "Horizontal story-style cards, one can be flagged Recommended. Trades list density for a browsier feel." },
] as const;

export default function StylistDirectionsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [tab, setTab] = useState<(typeof DIRECTIONS)[number]["key"]>("a");
  const [selA, setSelA] = useState(ANY_ID);
  const [selB, setSelB] = useState(ANY_ID);
  const [selC, setSelC] = useState(ANY_ID);

  const active = DIRECTIONS.find((d) => d.key === tab)!;

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-s-bg-sunken px-4 pb-24 pt-6">
      <h1 className="font-heading text-[20px] font-bold text-s-ink">Choose your stylist , 3 directions</h1>
      <p className="mt-1 font-body text-[13.5px] text-s-ink-2">
        Same real staff (muse-beauty-studio), rendered three ways. Selection-only, no profile link.
      </p>

      <div className="mt-4 flex gap-2">
        {DIRECTIONS.map((d) => (
          <TabPill key={d.key} active={tab === d.key} onClick={() => setTab(d.key)} size="md">
            {d.label}
          </TabPill>
        ))}
      </div>
      <p className="mt-2 font-body text-[12.5px] text-s-ink-3">{active.note}</p>

      <div className="mt-5 rounded-card bg-white p-4">
        {tab === "a" && <DirectionA selected={selA} onSelect={setSelA} />}
        {tab === "b" && <DirectionB selected={selB} onSelect={setSelB} />}
        {tab === "c" && <DirectionC selected={selC} onSelect={setSelC} />}
      </div>
    </div>
  );
}
