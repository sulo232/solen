"use client";

// measured: HIS OWN CAPTURE, IMG_7123 at 1206x2622px = 402x874pt, scale 3. pixel-spec-auto was run
// first and returned FAILURE ("could not detect a card structure"), which is the documented
// borderless-UI case, so the reference was PIL pixel-sampled directly:
//     grey icon tile   46.7pt through the rounded edge (a 48pt box), left edge at 16.0pt
//     row pitch        68.0pt, 68.0pt, 68.0pt down the three store rows
// measured: THE LIVE PANEL at 402x874, getBoundingClientRect + getComputedStyle, same day:
//     icon tile        48x48px, radius 16px, fill rgb(244,244,245)
//     row              68px tall, 14px gap
//     name             15px, weight 600, rgb(10,10,10)
//     sub line         13px, weight 400, rgb(107,107,107)
//     section label    13px, weight 600
//     look card        179x239px, radius 14px (3:4)
// The two agree (48pt tile, 68pt row, both sources), and every frame below is built to those
// numbers: the BEFORE column reproduces them, the AFTER column changes ONE treatment per section
// and leaves all of them alone.
//
// emphasis-ok: this file is a dev comparison surface, not a customer screen, and its weight count is
// not one screen's budget. Every `font-semibold` in it belongs to ONE of six small phone frames
// rendered side by side, and half of them are the BEFORE column, which is `SuggestRow` and
// `LookCard` copied out of SearchOverlay.tsx byte for byte so the comparison is honest. Changing a
// weight here to satisfy a whole-file count would either falsify the BEFORE column or apply an
// untested change to the AFTER one. Per frame the budget holds: each row carries weight on its
// anchor, the name, and leaves the meta at normal.
//
// exists-check: `npm run exists "search panel colour"` = 0 matches; `npm run exists "category icon"`
// returns only GRAVEYARD hits (makeup/waxing categories, the walk-in pill), neither of which this
// touches. Nothing here is a new component. The category colours are IMPORTED from
// `searchCategories.ts` rather than retyped, so there is no second source for them and no hex here.
//
// Copy is English by house rule, though the app ships German. The section names and category names
// below are the English of what the real screen says.
//
// WHY THIS PAGE EXISTS. Owner 2026-08-12, with four captures of the panel: "i wanna improve design
// sh looks flat n no color n the fur sie ui too".
//
// Also measured on those captures: share of pixels carrying any colour at all (max channel minus
// min channel > 28, sampled at 1/6 scale):
//     IMG_7123  the list he is looking at              0.1%   mean saturation 0.001
//     IMG_7125  the panel mid-open                     4.9%
//     IMG_7126  the composed panel                     5.2%
//     IMG_7124  the same list, scrolled to the feed   10.0%
// The top of that list is not restrained, it is greyscale to within a rounding error, and the only
// colour anywhere on it arrives with the TikTok photographs further down. His word for it is flat
// and the number agrees.
//
// THE POINT, and it is why none of this is decoration: every value below is ALREADY FETCHED or
// ALREADY DEFINED, and the panel throws it away.
//   - `/api/salons?ids=` is a call the panel already makes, once, on open. Measured against the
//     live server, the response carries `cover_photo_url`, `average_rating`, `review_count` and
//     `min_price` for those exact three salons. The panel keeps `address` and discards the rest,
//     then draws a grey glyph where the salon's own photograph could go.
//   - `searchCategories.ts` has carried a `bg` and an `fg` per category since it was written. The
//     panel passes neither, so all four rows render the same grey tile, and the first two end up
//     with the identical scissors glyph, which his IMG_7123 shows twice in a row.
//   - `/icons/categories/v2/` holds four drawn category icons we already own.
// So this is FLOORS LAW 2 by the letter: colour arrives as CONTENT, never as an ornament with a
// hardcoded src.

import * as React from "react";
import Image from "next/image";
import { Star, Store, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

type Salon = {
  id: string;
  name: string;
  address: string | null;
  cover_photo_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  min_price: number | null;
};
type Look = { id: string; image: string; title: string };

const FEATURED_IDS = [
  "0ed041f9-149b-4241-a09e-d41351be7097",
  "e34402f4-2986-4f63-8487-b09645395c65",
  "d46e4ae5-8410-4fc9-a2da-43c978bc9477",
];

/** English display names + the drawn icons we already ship, keyed to the app's own categories. */
const CAT_META: Record<string, { en: string; art: string }> = {
  Coiffeur: { en: "Hair salon", art: "/icons/categories/v2/coiffeur.png" },
  Barbershop: { en: "Barbershop", art: "/icons/categories/v2/barber.png" },
  Nails: { en: "Nails", art: "/icons/categories/v2/nails.png" },
  "Spa & Wellness": { en: "Spa and wellness", art: "/icons/categories/v2/spa.png" },
};
const enName = (label: string) => CAT_META[label]?.en ?? label;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="pb-1 pt-4 text-[13px] font-semibold text-s-ink">{children}</p>;
}

/* ---------------------------------------------------------------- BEFORE, verbatim */

/** SearchOverlay.tsx `SuggestRow`, unchanged. measured: 48px tile, 68px row, 15/13px text. */
function RowNow({ name, sub, Icon }: { name: string; sub?: string | null; Icon?: LucideIcon }) {
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-s-bg-sunken text-s-ink-2">
          {Icon ? <Icon size={20} strokeWidth={1.9} /> : null}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{name}</span>
          {sub ? <span className="block truncate text-[13px] text-s-ink-2">{sub}</span> : null}
        </span>
      </div>
    </div>
  );
}

/** SearchOverlay.tsx `LookCard`, unchanged. measured: 179x239px, radius 14px. */
function LookNow({ image, title }: { image: string; title: string }) {
  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <span className="block w-full overflow-hidden rounded-[14px] bg-s-bg-sunken" style={{ aspectRatio: "3 / 4" }}>
        {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
      </span>
      <span className="truncate px-0.5 text-[13px] font-semibold text-s-ink">{title}</span>
    </div>
  );
}

/* ----------------------------------------------------------------- AFTER, one change each */

/**
 * A. The salon's own photograph in the tile it already has, and the numbers already fetched.
 * measured: the tile stays 48x48px at radius 16px, the name stays 15px/600, the sub stays 13px.
 * The gold star against the grey address IS the separation between the rating and the rest, so
 * nothing is added between them (taste rule 2: when two bits differ by colour or weight, that
 * contrast is the separator).
 */
function RowStoreNew({ s }: { s: Salon }) {
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-s-bg-sunken">
          {s.cover_photo_url ? (
            <img src={s.cover_photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-s-ink-2"><Store size={20} strokeWidth={1.9} /></span>
          )}
        </span>
        <span className="min-w-0">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate text-[15px] font-semibold text-s-ink">{s.name}</span>
            {s.average_rating != null && (
              <span className="flex shrink-0 items-center gap-1 text-[13px] text-s-ink">
                <Star size={12} strokeWidth={0} fill="currentColor" className="shrink-0 text-s-star" />
                <span>{s.average_rating.toFixed(1)}</span>
                {s.review_count != null && <span className="text-s-ink-2">({s.review_count})</span>}
              </span>
            )}
          </span>
          <span className="block truncate text-[13px] text-s-ink-2">{s.address}</span>
        </span>
      </div>
    </div>
  );
}

/** B1. The tile takes the colour its category already declares. measured: still 48x48px, radius 16px. */
function RowCatTint({ c }: { c: (typeof CATEGORIES)[number] }) {
  const Icon = c.icon;
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${c.bg} ${c.fg}`}>
          <Icon size={20} strokeWidth={1.9} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{enName(c.label)}</span>
        </span>
      </div>
    </div>
  );
}

/** B2. Same tint plus the drawn icon we own. measured: still 48x48px, art inset 6px. */
function RowCatArt({ c }: { c: (typeof CATEGORIES)[number] }) {
  const art = CAT_META[c.label]?.art;
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        <span className={`relative block h-12 w-12 shrink-0 overflow-hidden rounded-2xl ${c.bg}`}>
          {art ? <Image src={art} alt="" width={48} height={48} className="h-full w-full object-contain p-1.5" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{enName(c.label)}</span>
        </span>
      </div>
    </div>
  );
}

/** C. The title stops being cut in half. measured: card unchanged at 179x239px, radius 14px. */
function LookNew({ image, title }: { image: string; title: string }) {
  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <span className="block w-full overflow-hidden rounded-[14px] bg-s-bg-sunken" style={{ aspectRatio: "3 / 4" }}>
        {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
      </span>
      <span className="line-clamp-2 px-0.5 text-[13px] font-semibold leading-snug text-s-ink">{title}</span>
    </div>
  );
}

/* ------------------------------------------------------------------------------ page */

function Phone({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <div className="w-[360px] shrink-0">
      <p className="text-[15px] font-semibold text-s-ink">{label}</p>
      <p className="mb-2 text-[13px] leading-snug text-s-ink-2">{note}</p>
      <div className="rounded-[22px] border border-s-border bg-white px-4 pb-5 pt-3">{children}</div>
    </div>
  );
}

export default function Panel() {
  const [salons, setSalons] = React.useState<Salon[]>([]);
  const [looks, setLooks] = React.useState<Look[]>([]);

  React.useEffect(() => {
    fetch(`/api/salons?ids=${FEATURED_IDS.join(",")}&limit=3`)
      .then((r) => r.json())
      .then((d: { items?: Salon[] }) => setSalons(d.items ?? []))
      .catch((err) => console.error("[dev/search-color] salons:", err));
    fetch("/api/discovery/feed?limit=4")
      .then((r) => r.json())
      .then((d: { items?: { id: string; tiktok_url: string | null; image_url: string | null; tiktok_thumbnail_url: string | null; style_name: string | null }[] }) =>
        setLooks(
          (d.items ?? [])
            .map((it) => ({
              id: it.id,
              image: it.tiktok_url ? `/api/discovery/thumb/${it.id}` : it.image_url || it.tiktok_thumbnail_url || "",
              title: it.style_name || "Look",
            }))
            .filter((l) => l.image),
        ),
      )
      .catch((err) => console.error("[dev/search-color] looks:", err));
  }, []);

  return (
    <div className="mt-8 space-y-14">
      <section>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          A. Popular stores: the salon&apos;s own photo instead of a grey glyph
        </h2>
        <p className="mt-1 max-w-[720px] text-[14px] leading-relaxed text-s-ink">
          The panel already asks the server for these three salons when it opens, and that answer
          already contains each one&apos;s photo, rating, review count and price. It keeps the
          address and throws the rest away.
        </p>
        <p className="mt-1 max-w-[720px] text-[14px] leading-relaxed text-s-ink-2">
          The cost: a 48px photo is small, so a dark or busy cover reads as a smudge at that size.
          It also makes the grey fallback for a salon with no photo stand out more than it does now.
        </p>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Now" note="Three salons, one grey storefront glyph, three times.">
            <SectionLabel>Popular stores</SectionLabel>
            {salons.map((s) => <RowNow key={s.id} name={s.name} sub={s.address} Icon={Store} />)}
          </Phone>
          <Phone label="Proposed" note="Their real photo and their real rating, from the same answer.">
            <SectionLabel>Popular stores</SectionLabel>
            {salons.map((s) => <RowStoreNew key={s.id} s={s} />)}
          </Phone>
        </div>
      </section>

      <section>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          B. Categories: the colours the categories already have
        </h2>
        <p className="mt-1 max-w-[720px] text-[14px] leading-relaxed text-s-ink">
          Every category in this app has carried its own two colours since the file was written.
          The panel passes neither, so all four tiles are the same grey, and the first two are
          handed the identical scissors, which is visible twice in your screenshot.
        </p>
        <p className="mt-1 max-w-[720px] text-[14px] leading-relaxed text-s-ink-2">
          The cost of B2 over B1: the drawn icons are art, not line glyphs, so they carry their own
          style and will not match the icon set used everywhere else in the panel. B1 keeps one
          drawing style and only adds colour, but it leaves the first two sharing a glyph.
        </p>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Now" note="Four grey tiles, and the first two share a glyph.">
            <SectionLabel>Categories</SectionLabel>
            {CATEGORIES.map((c) => <RowNow key={c.label} name={enName(c.label)} Icon={c.icon} />)}
          </Phone>
          <Phone label="B1, tint only" note="Each tile takes its category's own colour. Same glyphs.">
            <SectionLabel>Categories</SectionLabel>
            {CATEGORIES.map((c) => <RowCatTint key={c.label} c={c} />)}
          </Phone>
          <Phone label="B2, tint and the drawn icon" note="Also ends the twin scissors.">
            <SectionLabel>Categories</SectionLabel>
            {CATEGORIES.map((c) => <RowCatArt key={c.label} c={c} />)}
          </Phone>
        </div>
      </section>

      <section>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          C. The for-you feed: stop cutting the titles in half
        </h2>
        <p className="mt-1 max-w-[720px] text-[14px] leading-relaxed text-s-ink">
          This section is the only colour on the whole screen already, because it is photographs.
          What is wrong with it is the words: at this width every title is cut, so your screenshot
          reads &quot;Hybrid Microblading and ...&quot; and &quot;Combination Nano and P...&quot;,
          which tells you nothing. Two lines fixes it without touching the picture.
        </p>
        <p className="mt-1 max-w-[720px] text-[14px] leading-relaxed text-s-ink-2">
          The cost: rows stop being exactly level when one title runs to two lines and its
          neighbour does not. A fixed two-line box would keep them level and add empty space under
          the short ones instead.
        </p>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Now" note="One line, cut mid-word.">
            <SectionLabel>For you</SectionLabel>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {looks.map((l) => <LookNow key={l.id} image={l.image} title={l.title} />)}
            </div>
          </Phone>
          <Phone label="Proposed" note="Same card, same grid, the title gets its second line.">
            <SectionLabel>For you</SectionLabel>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {looks.map((l) => <LookNew key={l.id} image={l.image} title={l.title} />)}
            </div>
          </Phone>
        </div>
      </section>
    </div>
  );
}
