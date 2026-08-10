/**
 * /dev/mockups , INDEX of the map/search/checkout mockups (owner 2026-07-02: "all mockup link
 * dead"). ONE stable entry point: the cloudflare quick-tunnel dies between sessions and its URL
 * changes, so handing 8 separate links means they all rot together. This page lets the owner tap
 * through from a SINGLE link on whatever the current tunnel is. Dev-only. Not a design artifact ,
 * a nav index, so no mockup-copy rules apply.
 *
 * exists-check: net-new /dev mockups index route. `npm run exists mockups` = graveyard entries
 * (tiktok-embed, collections, black-selected) + a partner-page section; no dev mockup index exists.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

const GROUPS: { title: string; note: string; items: { slug: string; label: string; desc: string }[] }[] = [
  {
    title: "Full-page (v2, production)",
    note: "One full phone screen each, 390px iPhone aspect, refined , the current direction.",
    items: [
      { slug: "map-full", label: "Map view", desc: "pill bar, auto area-search, drag sheet + prices" },
      { slug: "confirm-full", label: "Checkout confirmation", desc: "loading beat, un-grayed receipt, photo, nav" },
      { slug: "results-full", label: "Results list", desc: "pill bar + refined cards with prices" },
      { slug: "suggest-full", label: "Search suggestions (2 ways)", desc: "A tabbed / B discovery-first" },
      { slug: "filter-refine", label: "Filter sheet", desc: "gray selected, price untouched" },
    ],
  },
  {
    title: "Pin label (settled)",
    note: "White pill, star + rating, no count, blue when selected.",
    items: [{ slug: "pin-label", label: "Pin label", desc: "settled, no count" }],
  },
  {
    title: "Component boards (earlier comparisons)",
    note: "Side-by-side boards from the first pass , kept for reference.",
    items: [
      { slug: "map-v2", label: "Map experience v2", desc: "bar, pins, preview, filter, results, suggestions" },
      { slug: "checkout-confirm", label: "Checkout beats", desc: "pay, receipt, walk-in, popup" },
      { slug: "map-bar", label: "Map bar", desc: "3 bar variations" },
      { slug: "map-extras", label: "Store preview + area search", desc: "#2 + #1" },
    ],
  },
];

export default async function MockupsIndex({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[560px] px-5 pb-16 pt-8">
        <p className="text-[12px] font-semibold text-s-ink-2">Solen , mockups index</p>
        <h1 className="mt-1 font-heading text-[22px] font-bold text-s-ink">Map, search &amp; checkout mockups</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">One link, tap through to each. Temporary preview , if a link dies the tunnel restarted; ask for the current index link.</p>

        {GROUPS.map((g) => (
          <section key={g.title} className="mt-7">
            <h2 className="text-[14px] font-bold text-s-ink">{g.title}</h2>
            <p className="mb-3 text-[12.5px] text-s-ink-2">{g.note}</p>
            <div className="space-y-2">
              {g.items.map((it) => (
                <Link key={it.slug} href={`/${locale}/dev/${it.slug}`}
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-s-border bg-white px-4 py-3.5 active:scale-[0.99]">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-s-ink">{it.label}</span>
                    <span className="block truncate text-[12.5px] text-s-ink-2">{it.desc}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-s-accent">Open</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
