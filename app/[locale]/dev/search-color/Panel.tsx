"use client";

// measured: HIS OWN CAPTURE, IMG_7123 at 1206x2622px = 402x874pt, scale 3. pixel-spec-auto was run
// first and returned FAILURE ("could not detect a card structure"), the documented borderless case,
// so the reference was PIL pixel-sampled directly:
//     grey icon tile   46.7pt through the rounded edge (a 48pt box), left edge at 16.0pt
//     row pitch        68.0pt, 68.0pt, 68.0pt down the three store rows
// measured: THE LIVE PANEL at 402x874, getBoundingClientRect + getComputedStyle:
//     icon tile 48x48px radius 16px fill rgb(244,244,245) - row 68px, gap 14px
//     name 15px/600 rgb(10,10,10) - sub 13px/400 rgb(107,107,107) - section label 13px/600
//     look card 179x239px radius 14px, ratio 0.75
// measured: THE LIVE INSPO PAGE at the same size, which is what question C is about:
//     its cards are 192x341px and 80x142px, ratio 0.563 (9:16), with two at 0.698
// So the panel crops a 9:16 thumbnail into a 0.75 box. That is the answer to "does it acc reflect
// the inspo page": no, and the difference is measured, not felt.
//
// reinvent-ok: this file does NOT re-declare the category list. It imports CATEGORIES from
// searchCategories.ts and indexes into it, so the order and the labels keep exactly one source. The
// only literals here are the candidate colour tokens this mockup exists to propose, and the English
// display strings the house rule requires on a dev surface while the app itself ships German.
//
// emphasis-ok: a dev comparison surface, not a customer screen, so its weight count is not one
// screen's budget. Every `font-semibold` belongs to ONE of the small phone frames rendered side by
// side, and half are the BEFORE column, which is `SuggestRow` and `LookCard` copied out of
// SearchOverlay.tsx byte for byte so the comparison is honest. Per frame the budget holds: weight
// sits on the row's anchor, the name, and the meta stays normal.
//
// exists-check: `npm run exists "search panel colour"` = 0; `npm run exists "category icon"` returns
// graveyard hits only (makeup/waxing, the walk-in pill), neither touched here.
//
// ROUND 2, owner 2026-08-12: "1 proposed but wout revoew counts hst star n4.2 yk 2 B1 but acc make
// system for tint not jst random n also the icons make ot make scence and c proposed but is
// aespectcratio good like does it acc reflect the inspo page and also is it personalized and also
// how to jump to the inspo page from there".

import * as React from "react";
import { Brush, Hand, Leaf, Scissors, Star, Store, ChevronRight, type LucideIcon } from "lucide-react";
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

/**
 * THE TINT SYSTEM, which is what he asked for instead of four colours somebody picked. Indexed to
 * CATEGORIES so the labels and the order stay in that one file.
 *
 * ONE RULE: every tile's fill sits at the same lightness and the same colourfulness, and only the
 * HUE changes. Written in CIE Lab, where those two are measurable quantities rather than a feeling:
 * tint L*=92 C*=12, glyph L*=42 C*=38, hue per category. Everything below was computed from that
 * rule, not chosen.
 *
 * WHY THE CURRENT FOUR ARE NOT A SYSTEM, measured on the values `searchCategories.ts` ships today:
 *     tint   L* 86.94 to 95.78  (8.8 apart)   C* 7.23 to 12.50
 *     glyph  L* 12.85 to 59.00  (46.1 apart)  <- one is nearly black, another is a mid brown
 *     hue    86.0, 87.7, 126.1, 150.5         <- the first two are 1.7 degrees apart, i.e. the same
 * That last line is why the first two rows read as two greys even once you tint them.
 *
 * HUE IS NOT RANDOM EITHER, one line of reasoning each, in CATEGORIES order:
 *     75   warm gold, the hue it already had
 *     32   terracotta, the barber pole, and 43 degrees clear of the one above it
 *      0   rose, nail polish
 *    150   green, the hue it already had
 *
 * MEASURED RESULT: glyph against its own tile is 4.87, 4.86, 4.87 and 4.91 to 1, all four above the
 * 3:1 floor a graphical element needs and above the 4.5:1 text floor as well. The old set could not
 * say that, because it never held anything constant.
 *
 * On approval these four pairs REPLACE the values in `searchCategories.ts`. They do not live here.
 *
 * THE ICONS, and why each one.
 *   1  Scissors, unchanged, it is the cut.
 *   2  Brush, a shaving brush, and NOT a second scissors, which is the whole point: today both rows
 *      carry the identical glyph and `SearchBar.tsx:106` documents that as deliberate. All 5842
 *      icons in our set were checked for a razor or clippers and there is none, so the shaving
 *      brush is the closest true tool available. We already own a clippers drawing if he wants art.
 *   3  Hand, the thing being treated. The current diamond is not a nail, and the obvious
 *      alternative glyph is banned in this project by name.
 *   4  Leaf, unchanged.
 */
const TINT_SYSTEM = [
  { tint: "#F7E5D2", glyph: "#825C25", icon: Scissors, en: "Hair salon" }, // drift-ok: candidate token for searchCategories.ts, computed from the L*/C* rule above
  { tint: "#FFE1DC", glyph: "#9B4C44", icon: Brush, en: "Barbershop" }, // drift-ok: candidate token, same rule
  { tint: "#FFE0E8", glyph: "#9B4864", icon: Hand, en: "Nails" }, // drift-ok: candidate token, same rule
  { tint: "#D8EEDC", glyph: "#2B7042", icon: Leaf, en: "Spa and wellness" }, // drift-ok: candidate token, same rule
];

const enName = (i: number) => TINT_SYSTEM[i]?.en ?? CATEGORIES[i].label;

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

/** SearchOverlay.tsx `LookCard`, unchanged. measured: 179x239px, radius 14px, ratio 0.75. */
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

/* ----------------------------------------------------------------- AFTER */

/**
 * A, as he picked it: the photo and the star and the value, and NO review count.
 * measured: tile still 48x48px radius 16px, name still 15px/600, sub still 13px.
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
              </span>
            )}
          </span>
          <span className="block truncate text-[13px] text-s-ink-2">{s.address}</span>
        </span>
      </div>
    </div>
  );
}

/** B1 as a system: computed tint, computed glyph colour, and an icon that means the category. */
function RowCatSystem({ i }: { i: number }) {
  const t = TINT_SYSTEM[i];
  const Icon = t.icon;
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: t.tint, color: t.glyph }}>
          <Icon size={20} strokeWidth={1.9} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{enName(i)}</span>
        </span>
      </div>
    </div>
  );
}

/** The same rows with the app's CURRENT four colours, so the difference is visible not argued. */
function RowCatToday({ c, i }: { c: (typeof CATEGORIES)[number]; i: number }) {
  const Icon = c.icon;
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${c.bg} ${c.fg}`}>
          <Icon size={20} strokeWidth={1.9} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{enName(i)}</span>
        </span>
      </div>
    </div>
  );
}

/** C: the title gets its second line, and the card takes the Inspo page's own 9:16. */
function LookNew({ image, title, ratio }: { image: string; title: string; ratio: string }) {
  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <span className="block w-full overflow-hidden rounded-[14px] bg-s-bg-sunken" style={{ aspectRatio: ratio }}>
        {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
      </span>
      <span className="line-clamp-2 px-0.5 text-[13px] font-semibold leading-snug text-s-ink">{title}</span>
    </div>
  );
}

/** C: the way into the Inspo page. Ink chevron, never blue, per the see-all rule. */
function FeedHeading({ withLink }: { withLink: boolean }) {
  if (!withLink) return <SectionLabel>For you</SectionLabel>;
  return (
    <div className="flex items-center justify-between pb-1 pt-4">
      <p className="text-[13px] font-semibold text-s-ink">For you</p>
      <span className="flex items-center gap-0.5 text-[13px] font-semibold text-s-ink">
        Inspo <ChevronRight size={15} strokeWidth={2.2} />
      </span>
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

function Answer({ q, a, detail }: { q: string; a: string; detail: string }) {
  return (
    <div className="mt-4 max-w-[760px] rounded-[16px] bg-s-bg-sunken p-4">
      <p className="text-[14px] font-semibold text-s-ink">{q}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-s-ink">{a}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-s-ink-2">{detail}</p>
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
          A. Built as you asked: the star and the value, no review count
        </h2>
        <p className="mt-1 max-w-[760px] text-[14px] leading-relaxed text-s-ink">
          Photo, name, star, 4.2. The count in brackets is gone. The address keeps the line under it,
          and the gold star against that grey is what separates the two, so nothing is added between
          them.
        </p>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Now" note="Grey glyph, no rating anywhere.">
            <SectionLabel>Popular stores</SectionLabel>
            {salons.map((s) => <RowNow key={s.id} name={s.name} sub={s.address} Icon={Store} />)}
          </Phone>
          <Phone label="Your version" note="Photo, star, value. No count.">
            <SectionLabel>Popular stores</SectionLabel>
            {salons.map((s) => <RowStoreNew key={s.id} s={s} />)}
          </Phone>
        </div>
      </section>

      <section>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          B1 as a system, not four colours somebody liked
        </h2>
        <p className="mt-1 max-w-[760px] text-[14px] leading-relaxed text-s-ink">
          One rule: every tile sits at the same lightness and the same colourfulness, and only the
          hue changes. Measured on the four the app ships today, they break that rule badly. Their
          glyph colours run from nearly black to mid brown, 46 points of lightness apart, and the
          first two hues are 1.7 degrees apart, which is to say the same colour. That is why they
          still read as grey once tinted.
        </p>
        <div className="mt-3 max-w-[760px] overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-s-ink-2">
              <tr><th className="py-1 pr-4 font-medium">Measured</th><th className="py-1 pr-4 font-medium">Today</th><th className="py-1 font-medium">This system</th></tr>
            </thead>
            <tbody className="text-s-ink">
              <tr><td className="py-1 pr-4">Tile lightness spread</td><td className="py-1 pr-4">8.8</td><td className="py-1">0, all four identical</td></tr>
              <tr><td className="py-1 pr-4">Glyph lightness spread</td><td className="py-1 pr-4">46.1</td><td className="py-1">0, all four identical</td></tr>
              <tr><td className="py-1 pr-4">Closest two hues</td><td className="py-1 pr-4">1.7 degrees</td><td className="py-1">32 degrees</td></tr>
              <tr><td className="py-1 pr-4">Glyph contrast on its tile</td><td className="py-1 pr-4">never held</td><td className="py-1">4.86 to 4.91, all pass</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-s-ink">
          The hues are reasoned, not spun: hair salon keeps its warm gold, barbershop takes the
          terracotta of a barber pole and lands 43 degrees clear of it, nails takes polish rose, spa
          keeps its green.
        </p>
        <p className="mt-1 max-w-[760px] text-[14px] leading-relaxed text-s-ink-2">
          The icons: barbershop stops being a second scissors. All 5842 icons in our set were checked
          for a razor or clippers and there is none, so it takes a shaving brush. If you want real
          clippers, we already own that drawing and that one row would use art instead. Nails takes
          a hand, the thing being treated, because the current diamond is not a nail and the obvious
          alternative is banned here by name.
        </p>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Now" note="All grey, and the first two share a glyph.">
            <SectionLabel>Categories</SectionLabel>
            {CATEGORIES.map((c, i) => <RowNow key={c.label} name={enName(i)} Icon={c.icon} />)}
          </Phone>
          <Phone label="Today's four colours" note="Tinted, but not a system: two near-identical hues.">
            <SectionLabel>Categories</SectionLabel>
            {CATEGORIES.map((c, i) => <RowCatToday key={c.label} c={c} i={i} />)}
          </Phone>
          <Phone label="The system" note="One lightness, one colourfulness, hue per category. New icons.">
            <SectionLabel>Categories</SectionLabel>
            {CATEGORIES.map((c, i) => <RowCatSystem key={c.label} i={i} />)}
          </Phone>
        </div>
      </section>

      <section>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          C. Your three questions, measured
        </h2>

        <Answer
          q="Is the shape right, does it reflect the Inspo page?"
          a="No. Measured on both today: the Inspo page renders its cards at 9:16, and this panel squeezes the same thumbnails into 3:4."
          detail="So every look here is cropped by about a quarter against how the same look appears on Inspo, top and bottom. The right-hand frame below uses the Inspo ratio, so a look is the same shape in both places."
        />
        <Answer
          q="Is it personalized?"
          a="Only when you are signed in. The ranking by your own taste runs only for a signed-in viewer on a plain browse; signed out, it is the popular order with a personal name on it."
          detail="That is a promise the title does not keep for a logged-out visitor. Two honest ways out: call it something neutral until they sign in, or keep the name and earn it by signing them in. Your call, and it is a copy decision, not a layout one."
        />
        <Answer
          q="How do you get to the Inspo page from here?"
          a="Today you cannot. Nothing on this section links to it; tapping a look opens that one look."
          detail="The right-hand frame adds the way in on the section heading itself, in ink with a chevron, because see-all controls in this app are never blue."
        />

        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Now" note="3:4 crop, cut titles, no way to Inspo.">
            <FeedHeading withLink={false} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              {looks.map((l) => <LookNow key={l.id} image={l.image} title={l.title} />)}
            </div>
          </Phone>
          <Phone label="Proposed" note="The Inspo page's own 9:16, two-line titles, and a way in.">
            <FeedHeading withLink />
            <div className="grid grid-cols-2 gap-3 pt-1">
              {looks.map((l) => <LookNew key={l.id} image={l.image} title={l.title} ratio="9 / 16" />)}
            </div>
          </Phone>
        </div>
      </section>
    </div>
  );
}
