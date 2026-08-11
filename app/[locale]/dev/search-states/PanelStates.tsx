"use client";

// exists-check: `npm run exists "search states mockup"` = 0; `npm run exists "recent searches"` = 5
// and the recents hook this needs ALREADY EXISTS (app/[locale]/_components/homepage/useRecentSearches.ts,
// localStorage, last 5, written on submit, already imported by SearchOverlay.tsx:337). Nothing here
// proposes building a recents feature. The "now" frame in each row reproduces the live recipe out of
// SearchOverlay.tsx rather than redrawing it. Copy is English by house rule, though the app ships German.
//
// THE THREE THINGS HE SAID, verbatim:
//   1. "i dont like how when hu tap the search sh is alredy open look at airbnb okay"
//   2. "i dont like the positioning of the dotts while searching yk the three dots"
//   3. "also when searchd n nth comes up n u close it still says nth yk n looks wierd"
//
// RESEARCH RUN THIS TURN on Mobbin, iOS, not from memory: ~44 screens across Airbnb, Fresha, Uber
// Eats, Bluesky, Reddit and a 32-app no-results sweep. Where a state could not be retrieved it is
// named as not captured rather than filled in with a guess.

import * as React from "react";
import { ChevronLeft, Clock, MapPin, Scissors, Search, Sparkles, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- shared parts, copied 1:1 */

const CAPSULE = "flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-s-bg-sunken px-4";

function Field({ value, showDots }: { value?: string; showDots?: boolean }) {
  return (
    <div className="flex h-12 items-center gap-2">
      <span className="grid h-10 w-8 shrink-0 place-items-center text-s-ink">
        <ChevronLeft size={24} strokeWidth={2} aria-hidden />
      </span>
      <div className={CAPSULE}>
        <Search size={19} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
        <span className={cn("min-w-0 flex-1 truncate text-[16px]", value ? "text-s-ink" : "text-s-ink-2")}>
          {value || "Service, salon or stylist"}
        </span>
        {value ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink">
            <X size={13} strokeWidth={2.6} aria-hidden />
          </span>
        ) : null}
        {showDots ? (
          <span className="flex shrink-0 items-center gap-[3px] pl-1.5" aria-hidden>
            {[0.3, 1, 0.5].map((o, i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-s-ink-2" style={{ opacity: o }} />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mb-1 text-[13px] font-semibold text-s-ink", className)}>{children}</p>;
}

function Row({ name, sub, Icon }: { name: string; sub?: string; Icon: typeof Search }) {
  return (
    <div className="flex w-full items-center gap-3.5 py-2.5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-s-bg-sunken text-s-ink-2">
        <Icon size={20} strokeWidth={1.9} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-s-ink">{name}</span>
        {sub ? <span className="block truncate text-[13px] text-s-ink-2">{sub}</span> : null}
      </span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 pt-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3.5">
          <span className="h-12 w-12 shrink-0 rounded-2xl bg-s-bg-sunken" />
          <span className="h-4 flex-1 rounded-full bg-s-bg-sunken" />
        </div>
      ))}
    </div>
  );
}

/** A 390-wide phone, cropped to the top of the panel, so every frame compares like for like. */
function Phone({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="w-[390px] shrink-0">
      <p className="mb-1 text-[13px] text-s-ink">{label}</p>
      {note ? (
        <p className="mb-2 h-[34px] text-[13px] leading-snug text-s-ink-2">{note}</p>
      ) : (
        <div className="mb-2 h-[34px]" />
      )}
      <div className="relative h-[560px] overflow-hidden rounded-[20px] border border-s-border bg-s-bg-sunken">
        <div className="absolute inset-x-0 top-0 h-full rounded-t-[20px] bg-white px-4 pt-4">{children}</div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { label: "Hair", Icon: Scissors },
  { label: "Barbershop", Icon: Scissors },
  { label: "Nails", Icon: Sparkles },
  { label: "Spa & wellness", Icon: Sparkles },
];

const STORES = [
  { name: "Muse Beauty Studio", sub: "Rumelinsplatz 4, Basel" },
  { name: "Glow Lab Basel", sub: "Steinenberg 14, Basel" },
  { name: "Salon Lumiere", sub: "Spalenvorstadt 22, Basel" },
];

/* ---------------------------------------------------------------- 1. tapping the search bar */

function TapNow() {
  return (
    <>
      <Field />
      <div className="pt-4">
        <Label>Popular stores</Label>
        {STORES.map((s) => (
          <Row key={s.name} name={s.name} sub={s.sub} Icon={Store} />
        ))}
        <Label className="mt-3">Categories</Label>
        {CATEGORIES.map((c) => (
          <Row key={c.label} name={c.label} Icon={c.Icon} />
        ))}
        <Label className="mt-3">For you</Label>
        <div className="grid grid-cols-2 gap-3 pt-1">
          {[0, 1].map((i) => (
            <span key={i} className="block w-full rounded-[14px] bg-s-bg-sunken" style={{ aspectRatio: "3 / 4" }} />
          ))}
        </div>
      </div>
    </>
  );
}

function TapOneList({ firstVisit }: { firstVisit?: boolean }) {
  return (
    <>
      <Field />
      <div className="pt-4">
        {firstVisit ? (
          <>
            <Label>Categories</Label>
            {CATEGORIES.map((c) => (
              <Row key={c.label} name={c.label} Icon={c.Icon} />
            ))}
          </>
        ) : (
          <>
            <Label>Recent searches</Label>
            <Row name="Balayage" sub="Basel" Icon={Clock} />
            <Row name="Women's haircut" sub="Zurich" Icon={Clock} />
            <Row name="Muse Beauty Studio" Icon={Clock} />
            <Label className="mt-3">Categories</Label>
            {CATEGORIES.slice(0, 2).map((c) => (
              <Row key={c.label} name={c.label} Icon={c.Icon} />
            ))}
          </>
        )}
      </div>
    </>
  );
}

function TapBlank() {
  return <Field />;
}

/* ---------------------------------------------------------------- 2. while typing */

function TypingNow() {
  return (
    <>
      <Field value="Balay" showDots />
      <div className="pt-4">
        <SkeletonRows />
      </div>
    </>
  );
}

function TypingProposed() {
  return (
    <>
      <Field value="Balay" />
      <div className="pt-4">
        <SkeletonRows />
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- 3. nothing found */

function EmptyNow() {
  return (
    <>
      <Field value="qqqzzz" />
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
          <div className="absolute -inset-5 rounded-full bg-s-bg-sunken blur-xl" />
          <div className="relative grid h-16 w-16 place-items-center rounded-[20px] bg-s-bg-sunken">
            <Search size={32} strokeWidth={1.5} className="text-s-ink-2" aria-hidden />
          </div>
        </div>
        <h3 className="mb-1.5 font-heading text-[18px] text-s-ink">No hits</h3>
        <p className="max-w-xs text-[14px] leading-relaxed text-s-ink-2">
          We could not find anything for &quot;qqqzzz&quot;.
        </p>
      </div>
    </>
  );
}

function EmptyProposed() {
  return (
    <>
      <Field value="qqqzzz" />
      <div className="pt-4">
        <p className="text-[15px] font-semibold text-s-ink">Nothing found for &quot;qqqzzz&quot;.</p>
        <p className="mb-4 text-[14px] text-s-ink-2">Try one of these instead.</p>
        {CATEGORIES.map((c) => (
          <Row key={c.label} name={c.label} Icon={c.Icon} />
        ))}
        <Row name="Search everywhere in Switzerland" Icon={MapPin} />
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- page */

function Block({
  n,
  said,
  found,
  pick,
  cost,
  children,
}: {
  n: string;
  said: string;
  found: React.ReactNode;
  pick: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">{n}</h2>
      <p className="mt-1 max-w-[760px] text-[15px] text-s-ink-2">He said: &quot;{said}&quot;</p>
      <div className="mt-3 max-w-[760px] space-y-1.5 text-[14px] leading-relaxed text-s-ink">{found}</div>
      <p className="mt-3 max-w-[760px] text-[14px] text-s-ink">My pick: {pick}</p>
      <p className="mt-1 max-w-[760px] text-[14px] text-s-ink-2">What it costs: {cost}</p>
      <div className="mt-6 flex gap-6 overflow-x-auto pb-3">{children}</div>
    </section>
  );
}

export default function PanelStates() {
  return (
    <div className="mt-10">
      <Block
        n="1. Tapping the search bar"
        said="i dont like how when hu tap the search sh is alredy open look at airbnb okay"
        pick="B, one list. Recent searches when you have them, the categories under them, and nothing else. Right now, before launch, nobody has a recent search, so what everyone actually sees is the categories."
        cost="It takes every photo out of the search panel, and one of our own rules says a browse surface carries about a third photography. That rule names its exemptions and search is not one of them, so this needs your call, not mine. C is the other option you named, and C shows a first-timer an empty white screen with a keyboard on it, which no shopping app does."
        found={
          <>
            <p>
              Airbnb, off the real screens: tapping the bar opens a sheet where the field is not even
              focused and no keyboard comes up. One list under it, four rows. Tapping the field is a second,
              separate step that goes full screen with the keyboard, and the same one list stays.
            </p>
            <p>
              Fresha, the one we copy structurally: the panel shows a photo grid of categories while the
              field is untouched, and the moment the field is tapped it becomes a new screen with a plain
              icon-and-label list and the photos gone.
            </p>
            <p>
              The rule all three share is that focus SUBTRACTS. Uber Eats drops its chips and its product
              rail down to four plain recent rows. Nobody adds. A blank body does exist at Airbnb, but only
              on address pickers, never on the browse search.
            </p>
          </>
        }
      >
        <Phone label="A. Now" note="Four sections: popular stores, categories, and a photo grid.">
          <TapNow />
        </Phone>
        <Phone label="B. One list (my pick)" note="Recent searches first, categories under them.">
          <TapOneList />
        </Phone>
        <Phone label="B, as it looks today" note="Nobody has recents before launch, so it is the categories.">
          <TapOneList firstVisit />
        </Phone>
        <Phone label="C. Blank" note="Nothing at all until you type.">
          <TapBlank />
        </Phone>
      </Block>

      <Block
        n="2. The three dots while searching"
        said="i dont like the positioning of the dotts while searching yk the three dots"
        pick="Delete the dots. The three grey placeholder rows underneath already say loading, and they say it where the answer is about to appear."
        cost="For about a third of a second on the first keystroke there is no feedback at all. Ten captured apps ship exactly that. I have not measured how fast our own suggestions come back, so if it turns out slow the fallback is a line of text, not a glyph."
        found={
          <>
            <p>
              One correction to what you saw, because it changes the fix: the dots are not outside the field.
              Measured, they sit inside it, but to the RIGHT of the clear X, so the row reads text, then X,
              then dots. That last slot is where a menu button lives. Both slots also stay mounted while
              empty, so they cost the typing area 48px permanently.
            </p>
            <p>
              Across 30 captured apps, that position was used zero times. The clear X is at the field&apos;s
              right edge in all 30, and nothing is ever allowed past it. Twelve apps centre a spinner in the
              empty body, thirteen show grey placeholder rows and no indicator at all, and Airbnb across ten
              screens shows no loading indicator anywhere.
            </p>
            <p>
              We already draw the placeholder rows at that same moment, so the dots are a third thing saying
              one thing.
            </p>
          </>
        }
      >
        <Phone label="A. Now" note="Dots past the X, with the placeholder rows below.">
          <TypingNow />
        </Phone>
        <Phone label="B. Dots deleted (my pick)" note="The placeholder rows carry it alone, X back at the edge.">
          <TypingProposed />
        </Phone>
      </Block>

      <Block
        n="3. Nothing found, and closing it"
        said="also when searchd n nth comes up n u close it still says nth yk n looks wierd"
        pick="Two changes. The message moves up and gets somewhere to go, and closing actually leaves: what you typed is cleared, the message goes, and the panel reopens on its one list."
        cost="Reopening on a results page will show the placeholder instead of the search that produced those results, which is worse for editing a query. What you typed is the first recent row, so it is one tap back. If that is not good enough the panel can keep it on the results page only, which is more moving parts."
        found={
          <>
            <p>
              This one is a dead button, not a look. The back arrow only blurs the field, so with a failed
              search on screen it changes nothing at all. Measured before and after the tap: the field still
              holds qqqzzz and the message is still there.
            </p>
            <p>
              Of 32 captured no-result screens, 22 give you something to tap. A centred icon with two lines
              and no way forward turns up once in 32. Ours also sits about a third of the way down with a
              large void under it, and that position is used by nobody: too low to read as a caption, too
              high to read as a centred state.
            </p>
            <p>
              On leaving, two apps show the whole cycle, Bluesky and Reddit, and both do the same thing:
              while you are still in search what you typed stays in the field so you can fix it, and the
              moment you leave, the field goes back to its placeholder and the query becomes a recent row.
              Ours does neither.
            </p>
            <p className="text-s-ink-2">
              Airbnb has no captured no-results screen of its own, because its destination field resolves
              places and rarely has one. That gap is named here rather than filled in with a guess.
            </p>
          </>
        }
      >
        <Phone label="A. Now" note="Grey disc, two lines, a void, and a back arrow that does nothing.">
          <EmptyNow />
        </Phone>
        <Phone label="B. A way out and a way on (my pick)" note="Message high, categories under it, closing clears.">
          <EmptyProposed />
        </Phone>
      </Block>
    </div>
  );
}
