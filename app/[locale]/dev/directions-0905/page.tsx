/**
 * Exists-check: `npm run exists directions-0905` -> the ten surface routes and their
 * _va/_vb/_vc direction components already exist (built by nine sibling passes this same
 * loop); this index page itself did not exist before this file. Net-new here is only this
 * page plus the 30 screenshots under public/_mockups/directions-0905/.
 *
 * Grounded-in: components-legacy/booking/BookingConfirmation.tsx (one of the ten real
 * screens this index links to; the other nine are named per-surface below: the booking
 * wizard under components-legacy/booking, the TabPill/button/SalonCard/sheet/toast
 * primitives, app/[locale]/_components/salon/SalonDetailV3.tsx,
 * app/[locale]/_components/search/SearchTemplate.tsx, app/[locale]/page.tsx,
 * components-legacy/booking/BookingsList.tsx, components-legacy/booking/PayConfirmStep.tsx,
 * app/[locale]/_components/profile/AccountHub.tsx, components-legacy/ui/EmptyState.tsx),
 * plus the ten sibling directions-0905/<surface>/page.tsx switchers this file only links
 * to. This page renders no copy of their markup itself.
 *
 * Reference-checked: _design-system/references/COMPARE_SOLEN_FRESHA_AIRBNB.md (the
 * Fresha/Airbnb naming below is reporting on what the nine sibling direction builders
 * already captured live per-surface, e.g. _design-system/references/fresha--confirmation.md
 * and _design-system/references/airbnb--checkout-and-confirmation.md; this index does not
 * design a new reference-derived surface itself).
 *
 * Depicts: this page's own UI -> NET-NEW: a scroll-only comparison index, no tabs, no switcher, no iframe (rejected 2026-08-15, "I can't even see a difference").
 *
 * For each of the ten surfaces it names the real screen being copied with a
 * link to the live route, then stacks all three directions as full-width cards (a 390-wide
 * first-viewport screenshot seen without tapping, the direction letter and name, its
 * one-sentence idea, a link that opens the real route at ?v=<letter>), the recommended
 * direction's why/cost and the flip line, and for a FAIL direction one line naming what is
 * still open instead of hiding it.
 *
 * Screenshots: taken with Playwright at 390x844, cold browser context per surface, the
 * seed customer session logged in first for a session-gated surface (confirmation,
 * bookings-list, profile, empty-states), saved to
 * public/_mockups/directions-0905/<surface>-<v>.png, referenced below by absolute path.
 * No remote images, no image src other than these screenshots.
 */
import Image from "next/image";
import Link from "next/link";

interface Direction {
  letter: "A" | "B" | "C";
  v: "a" | "b" | "c";
  name: string;
  idea: string;
  fail?: string;
}

interface Recommended {
  letter: string;
  why: string;
  cost: string;
  flip: string;
}

interface Surface {
  slug: string;
  title: string;
  realScreen: string;
  realHref: string;
  directions: Direction[];
  recommended?: Recommended;
  recommendedPending?: string;
}

const SURFACES: Surface[] = [
  {
    slug: "confirmation",
    title: "Booking confirmation",
    realScreen: "components-legacy/booking/BookingConfirmation.tsx",
    realHref:
      "/api/dev/login?email=kunde@solen.ch&to=%2Fen%2Fconfirmation%3Fbooking_id%3Dd21c23e3-fe0f-444f-999e-2f8d616f5b3c", // german-ok: dev-login test email, not UI copy
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Fresha copy",
        idea: "Same Fresha element order as the live screen (confirmed chip, date/time headline, salon card, service/staff/total card, cancellation line, action rows, CTA, booking ref), finished in Airbnb type and spacing.",
      },
      {
        letter: "B",
        v: "b",
        name: "Ticket",
        idea: "The booking as one ticket-shaped card with a perforated tear line, plus a 3-up icon action row (calendar, directions, manage) beneath.",
      },
      {
        letter: "C",
        v: "c",
        name: "What happens next",
        idea: "A calm confirmed moment leads into a Confirmed / Reminder / Your visit timeline, then the salon row and a collapsed facts summary.",
      },
    ],
    recommended: {
      letter: "A",
      why: "He named this screen for a Fresha copy, and A is the only direction that keeps Fresha's element order and the salon photograph (28.4% of the fold, matching live); motion does not separate the three.",
      cost: "A's resting card labels the deposit as 'Total' and hides the CHF 42.50 still owed at the salon behind a caret, where the live screen spells both out.",
      flip: "Say C if you want what happens next to lead instead of the receipt.",
    },
  },
  {
    slug: "booking-steps",
    title: "Booking flow steps and motion",
    realScreen: "components-legacy/booking (the wizard's ServicesStaffStep etc.)",
    realHref: "/en/salon/muse-beauty-studio/booking",
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Slide stack",
        idea: "The leaving step's whole panel dims and slides left while the entering step slides in from off-screen and visibly covers it.",
      },
      {
        letter: "B",
        v: "b",
        name: "Growing summary bar",
        idea: "Steps cross-fade in place with no lateral movement, while a bar above the CTA accumulates a chip and counts up the running total per completed step.",
      },
      {
        letter: "C",
        v: "c",
        name: "Sheet layering",
        idea: "Each step rises as its own white sheet stacking on the previous one, which recedes to 96% scale and dims underneath, so going back is a literal dismiss.",
      },
    ],
    recommended: {
      letter: "A",
      why: "A is the only direction where the step change itself is visible on video (the leaving panel dims and shifts left while the next slides over it); B has zero lateral movement by design and C stacks a second header on the screen.",
      cost: "A buys motion and no information: a fast tapper waits about 320ms per step and learns nothing new, where B's bar shows what is picked and what it costs.",
      flip: "Say B if you would rather see the running total grow than see the steps move.",
    },
  },
  {
    slug: "press-motion",
    title: "Click and press feedback kit",
    realScreen: "TabPill, the button primitives, SalonCard, the bottom sheet, the toast",
    realHref: "/en/salon/muse-beauty-studio",
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Timed",
        idea: "Every control (button, pill, sheet, toast) presses on a fixed keyframe duration and returns straight to rest with no overshoot.",
      },
      {
        letter: "B",
        v: "b",
        name: "Spring",
        idea: "whileTap scale 0.95 on an underdamped spring with visible release overshoot, a shared layoutId pill fill, and a sheet that reads real drag-release velocity.",
      },
      {
        letter: "C",
        v: "c",
        name: "Depth",
        idea: "Press feedback expressed as a tilt and shadow shift instead of a scale change.",
      },
    ],
    recommended: {
      letter: "B",
      why: "Holding the primary button and sampling the computed transform every 40ms: B reaches scale 0.948 and overshoots to 1.0028 on release, A returns straight to 1 with no overshoot, and C never scales at all. He asked for more motion on click, and B also visibly slides the selected pill fill between options rather than snapping.",
      cost: "The spring in B has no fixed duration, so it cannot be timed against the 300ms swaps used elsewhere, and a 5% shrink on a full-width commit button is a big jump for a button pressed once per booking.",
      flip: "Say A if the bounce feels like too much on every tap.",
    },
  },
  {
    slug: "salon-page",
    title: "Salon page",
    realScreen: "app/[locale]/_components/salon/SalonDetailV3.tsx",
    realHref: "/en/salon/muse-beauty-studio",
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Fresha order",
        idea: "Reorders the real sections into Fresha's literal sequence: gallery, header, services with category pills, team, reviews, about, opening hours, map.",
      },
      {
        letter: "B",
        v: "b",
        name: "Airbnb look",
        idea: "Keeps the live section order (About stays under the hero) but forks every section into Airbnb's look recipe: ink text, larger headings, flat bordered service cards, a gradient Reserve pill.",
      },
      {
        letter: "C",
        v: "c",
        name: "Services lead, sticky pick",
        idea: "A compact photo strip leads straight into Services; tapping Book on a row animates the running pick into a fixed sticky bar instead of navigating away.",
      },
    ],
    recommended: {
      letter: "C",
      why: "Scrolling the real page to y=1500 at 390px finds no persistent commit action at all, only the cookie banner. C is the only direction that carries one (a fixed ink bar, measured 51px tall) and it leads with Services the way Fresha does.",
      cost: "C drops the fixed section-nav bar (Photos / About / Services / Team / Reviews) that live and A both keep, so on a 4,400px page the only way back to a section is scrolling.",
      flip: "Say A if you want Fresha's order without the sticky bar and with the section tabs kept.",
    },
  },
  {
    slug: "search-results",
    title: "Search results",
    realScreen: "app/[locale]/_components/search/SearchTemplate.tsx",
    realHref: "/en/basel/coiffeur",
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Fresha list",
        idea: "One column of Fresha-anatomy result cards: photo, name and rating, address and category, up to 3 priced services, a closing-time link.",
        fail: "Only about one card plus a 47px sliver fits the 844px fold, below the density floor of at least 4 visible units on mobile; this round only fixed the finish, not the count.",
      },
      {
        letter: "B",
        v: "b",
        name: "Airbnb photo cards",
        idea: "One column of Airbnb photo-first cards, the 5/4 photo as the largest element, name and rating on one line, price below, a heart on the photo.",
        fail: "Also only about one card fits the fold, the same density-floor shortfall as A; this round's fixes were the three punch-list items on this direction, not the count.",
      },
      {
        letter: "C",
        v: "c",
        name: "Dense grid, tap sheet",
        idea: "A dense two-column photo grid with a stripped resting tile (photo, heart, name, rating, from-price) that expands on tap into a bottom sheet holding the full result card.",
      },
    ],
    recommended: {
      letter: "C",
      why: "C is the only direction that fills the fold, 6 photo tiles plus a cropped seventh at 43.6% photographic in 844px, against A and B's roughly one card each. A results screen's first job is comparing salons, which needs more than one on screen.",
      cost: "C's resting tile shows the same 'from 35 CHF' service on all six tiles, so the price line does not tell you which salon to pick until you tap one open, where A shows three real differing prices per salon.",
      flip: "Say A if you want three priced services shown on every result the way Fresha lists them.",
    },
  },
  {
    slug: "home",
    title: "Home feed",
    realScreen: "app/[locale]/page.tsx (Hero, HomeSearchPill, category row, salon rails)",
    realHref: "/en",
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Fresha query builder",
        idea: "An always-visible one-row query builder (Service / City / Time segments, ink circular Search button) replaces the search pill on the first viewport.",
      },
      {
        letter: "B",
        v: "b",
        name: "Airbnb look",
        idea: "The live chrome and section order kept, every salon-card section restyled through Airbnb's look recipe at full strength.",
      },
      {
        letter: "C",
        v: "c",
        name: "One-column feed",
        idea: "One column of full-width cards, the live sections kept in their live order.",
      },
    ],
    recommended: {
      letter: "A",
      why: "A is the only direction that changes what the screen asks first, and it fixes a real gap: live's largest fold text is 18px with no display anchor, while A measures 31.2px at 2.58x body with photography at 40% of the fold, against live's 27.9%.",
      cost: "A spends the top 200px on a slogan, pushing the first real salon card from y=422 on live down to y=628, so a returning customer reads marketing before content. None of the three directions kept the category chip rail live renders at y=96.",
      flip: "Say C if the feed should lead and the search should stay a plain pill.",
    },
  },
  {
    slug: "bookings-list",
    title: "Bookings list",
    realScreen: "components-legacy/booking/BookingsList.tsx",
    realHref: "/api/dev/login?email=kunde@solen.ch&to=%2Fen%2Fprofile%2Fbookings", // german-ok: dev-login test email, not UI copy
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Ledger",
        idea: "No tab bar: Upcoming as a full-width photo card, Past folded into one hairline-separated group of compact rows with an inline Book again link.",
      },
      {
        letter: "B",
        v: "b",
        name: "Airbnb Trips",
        idea: "Organized by time, not tabs: a plain-text destination label above each full-width photo card, past and cancelled bookings moved behind a single Past bookings row.",
      },
      {
        letter: "C",
        v: "c",
        name: "Next-up, with motion",
        idea: "The next appointment as a full-width hero card (photo, date block, service and stylist, 3-action row), the rest of the bookings as a timeline that expands inline on tap.",
      },
    ],
    recommended: {
      letter: "C",
      why: "C is the only direction that shows a whole week at once: a hero for the next appointment plus three more bookings as compact rows, 4 bookings in the first viewport, where A and B each spend the fold on one 660px photo of the same salon repeated down the page.",
      cost: "C's timeline rows label past bookings with the same green Confirmed chip as the upcoming one, so past and future read identically, and the live Upcoming/Past/Cancelled tabs are gone.",
      flip: "Say B if you want the Airbnb Trips look with one photo card per booking.",
    },
  },
  {
    slug: "payment-step",
    title: "Review and pay step",
    realScreen: "components-legacy/booking/PayConfirmStep.tsx",
    realHref: "/en/salon/muse-beauty-studio/booking",
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Fresha review order",
        idea: "Fresha's literal review order: salon card, date row, time row, service line, total, cancellation, payment method, notes, sticky commit bar.",
      },
      {
        letter: "B",
        v: "b",
        name: "Airbnb checkout",
        idea: "The same live review order restyled at Airbnb checkout's full strength: hairline rows instead of bordered cards, a flat price list, a bare-icon payment radio.",
      },
      {
        letter: "C",
        v: "c",
        name: "Progressive",
        idea: "The summary collapses to one line on Confirm details, revealing the payment block; switching payment method cross-fades the sticky bar's label and amount.",
      },
    ],
    recommended: {
      letter: "B",
      why: "B is the only direction that holds the whole decision, salon, stylist, service, date, price list, payment method and cancellation term, in one 844px fold at 4 sizes and 2 weights. On a paid commit screen, fewer taps and everything visible wins over a nicer reveal.",
      cost: "B breaks two locks to get there: the CTA radius is 12 instead of the locked 16, and its ink is a different near-black shade instead of Solen's own ink token, so it will not match the buttons on any other screen until one ink wins.",
      flip: "Say A if you want Fresha's one-card-per-fact review order.",
    },
  },
  {
    slug: "profile",
    title: "Profile hub",
    realScreen: "app/[locale]/_components/profile/AccountHub.tsx",
    realHref: "/api/dev/login?email=kunde@solen.ch&to=%2Fen%2Fprofile", // german-ok: dev-login test email, not UI copy
    directions: [
      {
        letter: "A",
        v: "a",
        name: "Fresha directory",
        idea: "One flat, ungrouped list of bare icon, label and chevron rows, no group eyebrows, sublines or counts.",
      },
      {
        letter: "B",
        v: "b",
        name: "Airbnb profile",
        idea: "The same grouped rows and live-data sublines, restyled with Airbnb's row anatomy at full strength.",
      },
      {
        letter: "C",
        v: "c",
        name: "Next-up hero",
        idea: "The real next appointment (photo, date block, service and stylist, price) leads the hub as a hero between the identity block and the existing groups, with an entrance animation.",
      },
    ],
    recommended: {
      letter: "C",
      why: "C keeps the grouped hub and every live subline and adds the one thing missing, the real next appointment with a real photo, a 28px date block and the real price, animated in on entry.",
      cost: "The next appointment now appears twice on one screen, once in the hero and again in the Bookings row subline.",
      flip: "Say A if the hub should be a plain flat list with no sublines.",
    },
  },
  {
    slug: "empty-states",
    title: "Empty states",
    realScreen: "components-legacy/ui/EmptyState.tsx and its four customer render sites",
    realHref: "/api/dev/login?email=kunde@solen.ch&to=%2Fen%2Fprofile%2Flooks", // german-ok: dev-login test email, not UI copy
    directions: [
      {
        letter: "A",
        v: "a",
        name: "One recipe",
        idea: "All four states (no bookings, no favorites, no vouchers, no looks) render through one byte-identical icon, headline, subline and filled CTA unit on a sunken tray, so only the icon and its colour vary.",
      },
      {
        letter: "B",
        v: "b",
        name: "Airbnb per-feature",
        idea: "Each of the four states restyled individually at Airbnb's look, full strength, rather than sharing one recipe.",
        fail: "This round fixed the inactive-tab weight leak, raised the headline to the 28px floor and corrected a CTA-weight citation; the one item still open is its own Upcoming, Past and Cancelled tab pills, which measure 30px tall against the 44px touch floor (a one-class fix if this direction is picked).",
      },
      {
        letter: "C",
        v: "c",
        name: "Real content fills the slot",
        idea: "Each state's headline becomes the screen's own real promise copy (booking, favorites, voucher and looks title keys) instead of a generic subline, with the locked entrance cascade kept.",
      },
    ],
    recommended: {
      letter: "A",
      why: "A is the only one of the three with no contradiction and no broken lock: B puts two magenta pills on the screen where Solen's CTA is ink and its tab pills sit under the touch floor, and C prints No bookings yet directly above two real bookings with green Confirmed chips and Rebook buttons, a screen arguing with itself. A renders one identical four-part unit in all four states, icon and headline offsets matching to 0px.",
      cost: "On the looks state A is a step down from what already ships: the live looks screen measures 41.5% photographic with a photo banner and a Top-rated rail, and A replaces that with a grey tray at 0% photography. Missing from this set is a direction with A's one recipe and the live screen's photographic fill.",
      flip: "Say C if an empty screen should fill with real content instead of an icon and a button.",
    },
  },
];

function Card({ surface }: { surface: Surface }) {
  return (
    <section className="border-t border-s-border px-4 py-8">
      <h2 className="text-[20px] font-semibold text-s-ink">{surface.title}</h2>
      <p className="mt-1 text-[13px] font-normal text-s-ink-2">
        Copies{" "}
        <a href={surface.realHref} className="text-s-accent underline">
          {surface.realScreen}
        </a>
        .
      </p>

      <div className="mt-4 flex flex-col gap-6">
        {surface.directions.map((d) => {
          const isRecommended = surface.recommended?.letter === d.letter;
          return (
            <div key={d.v} className="rounded-card border border-s-border">
              <Link href={`/en/dev/directions-0905/${surface.slug}?v=${d.v}`} className="block">
                <Image
                  src={`/_mockups/directions-0905/${surface.slug}-${d.v}.png`}
                  alt={`Direction ${d.letter}: ${d.name}, ${surface.title}`}
                  width={390}
                  height={844}
                  className="w-full rounded-t-card"
                />
              </Link>
              <div className="p-4">
                <p className="text-[15px] font-semibold text-s-ink">
                  {d.letter}: {d.name}
                  {isRecommended ? " (Recommended)" : ""}
                </p>
                <p className="mt-1 text-[13px] font-normal text-s-ink-2">{d.idea}</p>
                {d.fail ? (
                  <p className="mt-2 text-[13px] font-normal text-s-ink-2">Open: {d.fail}</p>
                ) : null}
                <Link
                  href={`/en/dev/directions-0905/${surface.slug}?v=${d.v}`}
                  className="mt-2 inline-flex h-11 items-center text-[13px] font-normal text-s-accent underline"
                >
                  Open direction {d.letter}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {surface.recommended ? (
        <div className="mt-4 rounded-card border border-s-border bg-s-bg-sunken p-4">
          <p className="text-[13px] font-normal text-s-ink-2">
            Why {surface.recommended.letter}: {surface.recommended.why}
          </p>
          <p className="mt-2 text-[13px] font-normal text-s-ink-2">Cost: {surface.recommended.cost}</p>
          <p className="mt-2 text-[13px] font-normal text-s-ink-2">{surface.recommended.flip}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-s-border bg-s-bg-sunken p-4">
          <p className="text-[13px] font-normal text-s-ink-2">{surface.recommendedPending}</p>
        </div>
      )}
    </section>
  );
}

export default function DirectionsIndexPage() {
  return (
    <div data-index-scope="directions-0905" className="mx-auto max-w-[600px] bg-white pb-16">
      <div className="px-4 pt-8">
        <h1 className="text-[24px] font-semibold text-s-ink">Directions, 2026-09-05</h1>
        <p className="mt-2 text-[13px] font-normal text-s-ink-2">
          Ten screens, three directions each. Scroll to compare, no tabs. Each card links straight to
          the real route so a direction can be checked live on your phone.
        </p>
      </div>
      {SURFACES.map((surface) => (
        <Card key={surface.slug} surface={surface} />
      ))}
    </div>
  );
}
