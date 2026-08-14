/**
 * /dev/menu-placement , where the hamburger goes once it leaves the search bar.
 *
 * Owner 2026-08-10: "I don't think this hamburger menu should be here because it's really
 * inconsistent. You know? Not really like it."
 *
 * He is right, and it is worse than he said. There are TWO hamburgers today and they are two
 * different objects for one control: a bare 44px glyph inside the search bar
 * (HomeSearchPill.tsx:163) and a square bordered tile in the header (Header.tsx:941). One thing,
 * two shapes, which is the case FLOORS LAW 8 exists to stop.
 *
 * BUT deleting it strands the menu, measured rather than assumed. On /de the header's own
 * hamburger is in the DOM at width 0, display:none, hidden by `showCategoryChrome &&
 * "max-md:hidden"` (Header.tsx:706). That condition is true on home, on all four category routes
 * and on /inspo. So on every one of those the search-bar glyph is the ONLY visible trigger for
 * MobileMenu, and MobileMenu is where the city selector and the language switcher live.
 *
 * That placement was his own call: the approved mockup public/_mockups/home-v3/search-a.html has
 * no utility row, and the hamburger moved into the search pill's trailing slot on 2026-08-01,
 * recorded at Header.tsx:695-706. Today reverses it, which is his to do. Where it goes instead is
 * a design decision, so this is a mockup and not a guess.
 *
 * MOCKUP RULES FOLLOWED: a copy of the REAL chrome with ONLY the menu's placement changed. Same
 * search pill geometry, same pill row, same tokens, the real category PNGs through next/image the
 * way the real row now renders them. Nothing else moves. Shown at 375 wide, the width he looks at.
 * Copy is in English by house rule (mockup-english gate), even though the shipped app is German.
 *
 * exists-check: `npm run exists "menu placement"` = 0 hits. Extends the existing /dev/* mockup
 * convention (auth-flow, home-search, map-bar and 20 siblings), does not add a new one.
 *
 * Dev-only, notFound() in production. Nothing here is wired.
 */
import { notFound } from "next/navigation";
import Image from "next/image";
import { Heart, Menu, Search } from "lucide-react";

const PILLS = [
  { label: "All", icon: null },
  { label: "Hair", icon: "/icons/categories/scissors.png" },
  { label: "Barber", icon: "/icons/categories/clippers.png" },
  { label: "Nails", icon: "/icons/categories/nails.png" },
];

/** The real search pill, copied. The trailing slot is the only thing that varies per option. */
function SearchPill({ trailing }: { trailing: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-1 pb-2">
      <div className="flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5 shadow-elevation-2">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
          <span className="block min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
            Search
          </span>
        </span>
        {trailing}
      </div>
    </div>
  );
}

/** The real pill row, copied. `tail` appends a pinned control on the right. */
function PillRow({ tail }: { tail?: React.ReactNode }) {
  return (
    <div className="mx-auto mt-3 flex max-w-[1280px] items-center gap-2 px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden pt-3 pb-3.5">
        {PILLS.map((p, i) => (
          <span
            key={p.label}
            className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-[40px] px-2.5 font-body text-[14px] font-normal leading-none text-s-ink ${
              i === 0 ? "bg-s-bg-sunken" : "bg-white shadow-whisper"
            }`}
          >
            {p.icon ? (
              <Image
                src={p.icon}
                alt=""
                width={64}
                height={64}
                sizes="78px"
                className="h-[26px] w-[26px] shrink-0 object-contain"
                aria-hidden
              />
            ) : (
              <span aria-hidden className="grid h-[26px] w-[26px] shrink-0 place-items-center" />
            )}
            {p.label}
          </span>
        ))}
      </div>
      {tail}
    </div>
  );
}

function Frame({
  n,
  title,
  verdict,
  cost,
  children,
}: {
  n: string;
  title: string;
  verdict: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-[18px] font-semibold text-s-ink">
        {n}. {title}
      </h2>
      <p className="mt-1 max-w-[520px] font-body text-[14px] text-s-ink-2">{verdict}</p>
      <p className="mt-1 max-w-[520px] font-body text-[14px] text-s-ink-2">
        <span className="font-semibold text-s-ink">The cost:</span> {cost}
      </p>
      <div className="mt-4 w-[375px] overflow-hidden rounded-[20px] border border-s-border bg-white pb-6">
        {children}
      </div>
    </section>
  );
}

export default function MenuPlacementMockup() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Where the menu goes
      </h1>
      <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink-2">
        You said the hamburger should not be in the search bar. Taking it out is one line. The
        problem is that on the home page, all four category pages and Inspo it is the only way into
        the menu, and the menu holds the city picker and the language switcher. So here are the
        three places it can go instead, on the real chrome, with nothing else changed.
      </p>

      <div className="mt-10">
        <Frame
          n="0"
          title="Today, for comparison"
          verdict="A bare glyph inside the search bar. On deep pages the same control is a square bordered tile in the header instead, so one thing has two shapes."
          cost="This is the one you rejected."
        >
          <SearchPill
            trailing={
              <span className="grid h-11 w-11 shrink-0 place-items-center text-s-ink">
                <Menu size={16} strokeWidth={2} aria-hidden />
              </span>
            }
          />
          <PillRow />
        </Frame>

        <Frame
          n="A"
          title="Header tile, on every page"
          verdict="The menu goes back to the square tile in the header, and that row is shown on these routes again. One control, one shape, every single page, which is the straight answer to the word inconsistent."
          cost="A second row above the pills. That is the row the mockup you approved on 2026-08-01 deliberately removed, so it buys consistency by spending vertical space."
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <span className="font-display text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
              Solen
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-input bg-white text-s-ink shadow-elevation-2">
              <Menu size={22} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <SearchPill
            trailing={
              <span className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
                <Heart size={16} strokeWidth={2} aria-hidden />
              </span>
            }
          />
          <PillRow />
        </Frame>

        <Frame
          n="B"
          title="Pinned to the right of the pill row"
          verdict="The search bar carries nothing. The menu sits at the end of the category row, pinned, so it does not scroll away with the pills. Costs no vertical space at all."
          cost="It sits in a row that reads as categories, so a menu button is a different kind of thing in a row of like things. It may read as a fifth category."
        >
          <SearchPill trailing={<span className="w-1" />} />
          <PillRow
            tail={
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink">
                <Menu size={18} strokeWidth={2} aria-hidden />
              </span>
            }
          />
        </Frame>

        <Frame
          n="C"
          title="Bottom bar"
          verdict="What Airbnb actually does, and the reason their home screen carries no hamburger anywhere. The top of the screen is only search and categories. Navigation lives down at the thumb."
          cost="A genuinely new surface, not a move. BottomTabBar was taken off the web on 2026-05-03 by decision Q58, so this reopens a graveyard entry, and every page has to make room for it."
        >
          <SearchPill trailing={<span className="w-1" />} />
          <PillRow />
          <div className="mt-6 flex items-center justify-around border-t border-s-border px-6 pt-3">
            {[
              { icon: <Search size={20} strokeWidth={2} aria-hidden />, label: "Search", on: true },
              { icon: <Heart size={20} strokeWidth={2} aria-hidden />, label: "Saved", on: false },
              { icon: <Menu size={20} strokeWidth={2} aria-hidden />, label: "Menu", on: false },
            ].map((t) => (
              <span
                key={t.label}
                className={`flex flex-col items-center gap-1 font-body text-[12px] ${
                  t.on ? "text-s-ink" : "text-s-ink-2"
                }`}
              >
                {t.icon}
                {t.label}
              </span>
            ))}
          </div>
        </Frame>
      </div>

      <section className="rounded-card bg-s-bg-sunken p-5">
        <h2 className="font-display text-[18px] font-semibold text-s-ink">My pick, and why</h2>
        <p className="mt-2 max-w-[560px] font-body text-[15px] text-s-ink">
          B. It is the only one that gets the hamburger out of the search bar without spending a row
          or reopening a killed surface, and pinning it keeps it clearly separate from the pills
          that scroll past underneath it.
        </p>
        <p className="mt-3 max-w-[560px] font-body text-[14px] text-s-ink-2">
          The honest argument against my own pick: A is the one that actually answers the word you
          used. Inconsistent means the same control looks different in different places, and only A
          gives you one shape everywhere. B still leaves deep pages showing a square tile in the
          header while these pages show a circle in the pill row.
        </p>
      </section>
    </main>
  );
}
