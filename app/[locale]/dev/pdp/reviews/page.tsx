"use client";

// Exists-check: `npm run exists` for "reviews swipe collapsed directions" -> 0 matches
// (2026-07-23), net-new dev route, sibling to the existing app/[locale]/dev/* preview pages
// (see /dev/stylist-directions, /dev/review-preview for the established shape).
//
// This compares the REAL app/[locale]/_components/salon/SalonReviews.tsx component rendered
// three times , not a redraw. The ONLY net-new code is one optional prop added to the real
// component itself (`layout`, default "stack" = byte-identical to every existing caller, so
// SalonDetailV3's live usage is untouched) plus this page's phone-frame harness around it.
//
// Problem this compares (owner): SalonReviews runs too tall on mobile.
//   A "Summary-first" , layout unset (current locked default). Star row + big average, count
//     folded into the "Alle N Bewertungen" see-all pill, 2 cards before expanding.
//   B "Swipe deck" , layout="swipe". All reviews sit in one horizontal snap-scroll row
//     (~1.5 cards visible per viewport); no see-all pill , swiping already reveals the rest.
//   C "Collapsed" , layout="collapsed". Summary + exactly ONE top review; the existing
//     see-all/expand affordance reveals the rest inline.
//
// Fixture: "Cuts & Culture", a Basel barbershop, average 4.8 / 16 reviews (review count is a
// separate server aggregate from the loaded review rows, same decoupling as the real
// SalonDetail.review_count vs SalonDetail.reviews[] shape). salonSlug/locale are deliberately
// NOT passed so all three directions use SalonReviews' own local inline-expand path (the
// component's alternate Link-out path only fires when a real salonSlug+locale pair is given ,
// out of scope here, and would navigate off this comparison page). Real tokens only.
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { SalonReviews } from "@/app/[locale]/_components/salon/SalonReviews";
import type { Review } from "@/app/[locale]/_components/salon/_shared";

// Real Cuts & Culture (Basel) reviews, hand-written fixture matching the Review shape , two
// rows carry no comment/name (silentCount path), one comment is long enough to exercise the
// existing "Mehr lesen" truncation toggle.
const FIXTURE_REVIEWS: Review[] = [
  {
    id: "r1",
    rating: 5,
    comment:
      "Bin seit über einem Jahr Stammkunde und werde jedes Mal top beraten. Der Fade sitzt perfekt, der Bart wird sauber nachgezogen und die Wartezeit ist auch am Samstag kurz. Ambiente ist entspannt, Musik gut, Team super freundlich , genau das, was man von einem Barbershop in Basel erwartet.",
    created_at: "2026-07-18T15:40:00.000Z",
    profiles: { display_name: "Elias K.", avatar_url: null },
  },
  {
    id: "r2",
    rating: 5,
    comment: "Sehr sauberer Skin Fade, genau nach Wunsch umgesetzt.",
    created_at: "2026-07-10T11:05:00.000Z",
    profiles: { display_name: "Dario B.", avatar_url: null },
  },
  {
    id: "r3",
    rating: 4,
    comment: "Guter Schnitt, war fünf Minuten früher dran als der Termin , kein Problem.",
    created_at: "2026-06-29T09:20:00.000Z",
    profiles: { display_name: "Yannick S.", avatar_url: null },
  },
  {
    id: "r4",
    rating: 5,
    comment: "Bart-Styling war on point, komme wieder.",
    created_at: "2026-06-14T17:00:00.000Z",
    profiles: { display_name: "Noah P.", avatar_url: null },
  },
  {
    id: "r5",
    rating: 5,
    comment: "Freundliches Team, faire Preise für Basel.",
    created_at: "2026-05-30T13:15:00.000Z",
    profiles: { display_name: "Marco H.", avatar_url: null },
  },
  { id: "r6", rating: 5, comment: null, created_at: "2026-05-20T10:00:00.000Z" },
  { id: "r7", rating: 4, comment: null, created_at: "2026-05-02T16:30:00.000Z" },
];

function PhoneDirection({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-[16px] font-bold text-s-ink">{label}</h2>
      <p className="mt-1 font-body text-[12.5px] text-s-ink-2">{note}</p>
      <div className="mx-auto mt-3 w-full max-w-[390px] overflow-hidden rounded-2xl border border-s-border bg-white shadow-elevation-2">
        <div className="max-h-[640px] overflow-y-auto bg-white p-4">{children}</div>
      </div>
    </section>
  );
}

export default function PdpReviewsDirectionsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[430px]">
        <h1 className="font-display text-[20px] font-bold text-s-ink">Reviews section , 3 directions</h1>
        <p className="mt-1.5 font-body text-[13px] text-s-ink-2">
          Real SalonReviews.tsx, same fixture (Cuts &amp; Culture, Basel, 4.8 · 16 reviews), rendered
          at real phone width. Problem: the section runs too tall on mobile.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-[430px] flex-col gap-10">
        <PhoneDirection
          label="Direction A , Summary-first"
          note="Current locked default (layout prop unset). Star row + big average, count folded into the see-all pill, 2 cards shown before expanding."
        >
          <SalonReviews average={4.8} count={16} reviews={FIXTURE_REVIEWS} />
        </PhoneDirection>

        <PhoneDirection
          label="Direction B , Swipe deck"
          note="layout=&quot;swipe&quot;. All reviews sit in one horizontal snap row, ~1.5 cards visible , swiping already reveals the rest, so no see-all pill."
        >
          <SalonReviews average={4.8} count={16} reviews={FIXTURE_REVIEWS} layout="swipe" />
        </PhoneDirection>

        <PhoneDirection
          label="Direction C , Collapsed"
          note="layout=&quot;collapsed&quot;. Summary + exactly one top review; the existing see-all pill expands the rest inline."
        >
          <SalonReviews average={4.8} count={16} reviews={FIXTURE_REVIEWS} layout="collapsed" />
        </PhoneDirection>
      </div>
    </main>
  );
}
