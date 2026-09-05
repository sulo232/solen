// Exists-check: `npm run exists bookings` -> dashboard/profile bookings pages, several
// booking schemas/validations and email templates, plus the booking-steps direction
// route already in this same batch; no prior comparison entry for this surface
// (bookings-list) existed before this file.
// Grounded-in: app/[locale]/profile/bookings/page.tsx (the real customer bookings list
// surface each direction below will treat).
//
// Depicts: switcher shell -> ../_shared/DirectionFrame.tsx (reused as-is).
// Depicts: direction a content -> NET-NEW: not built yet, the builder adds its own
//   bookings-list/_va/ file with its own Depicts manifest.
// Depicts: direction b content -> NET-NEW: not built yet, the builder adds its own
//   bookings-list/_vb/ file with its own Depicts manifest.
// Depicts: direction c content -> ./_vc/BookingsListDirectionC.tsx (its own Depicts manifest).
//
// Shared switcher for the three /dev/directions-0905/bookings-list directions (?v=a|b|c).
// Each builder owns ONLY their own bookings-list/_v<letter>/ folder; this file just reads
// ?v= and renders the matching branch. Data fetching for each direction lives INSIDE that
// direction's own component so no builder's fetch logic collides with another's.
import { DirectionFrame } from "../_shared/DirectionFrame";
import BookingsDirectionB from "./_vb/BookingsDirectionB";
import { getBookingsListB } from "./_vb/getBookingsListB";
import BookingsListDirectionA from "./_va/BookingsListDirectionA";
import { loadBookingsA } from "./_va/loadBookingsA";
import { BookingsListDirectionC } from "./_vc/BookingsListDirectionC";
import { getSeedBookingsForCustomer } from "./_vc/getBookingsC";

const DIRECTIONS = [
  { value: "a", label: "Fresha ledger" },
  { value: "b", label: "Airbnb trips, full strength" },
  { value: "c", label: "Next-up hero, with motion" },
];

export default async function BookingsListDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  const active = v === "a" || v === "b" || v === "c" ? v : "a";

  const bData = active === "b" ? await getBookingsListB() : null;
  const aData = active === "a" ? await loadBookingsA() : null;
  const cData = active === "c" ? await getSeedBookingsForCustomer() : null;

  return (
    <DirectionFrame surface="bookings-list" directions={DIRECTIONS} active={active}>
      {active === "a" && aData ? (
        <BookingsListDirectionA locale={locale} upcoming={aData.upcoming} past={aData.past} />
      ) : active === "b" && bData ? (
        <BookingsDirectionB data={bData} />
      ) : active === "c" && cData ? (
        <BookingsListDirectionC buckets={cData} locale={locale} />
      ) : (
        <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
          Direction {String(active).toUpperCase()} not built in this pass.
        </div>
      )}
    </DirectionFrame>
  );
}
