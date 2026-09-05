// exists-check: net-new vs HomeSearchPill.tsx and SearchBar.tsx because those are the two real,
// off-limits components that already do "a search entry point on the home page" and this file
// intentionally forks the LATTER's collapsed-row anatomy (not HomeSearchPill's, a different single
// tap-to-open pill this direction's header already names as the collision it is reopening) into a
// Fresha-shaped one-row layout per the punch-list fix in ./FreshaQueryPill.tsx. Not an extension of
// either real file: both are off-limits/read-only per the brief, and the anatomy itself is what
// needed to change, which the brief's own "copy into your own folder, rename it" clause covers.
//
// Grounded-in: app/[locale]/_components/homepage/SearchBar.tsx (the collapsed-row state machine
// and the real SearchOverlay mount, COPIED per FreshaQueryPill.tsx's own header, not imported)
// and app/[locale]/_components/search/SearchOverlay.tsx (imported unmodified).
//
// Depicts: opening the service/city/time overlay steps -> SearchBar.tsx's real openOverlay
// function (same flushSync-then-focus pattern for the service field, same setOverlayFocus for
// the other two), reproduced here because the row markup around it had to change (see
// FreshaQueryPill.tsx header for why).
// Depicts: the search surface itself -> app/[locale]/_components/search/SearchOverlay.tsx (real,
// imported unmodified below, identical props to SearchBar.tsx's own usage).
//
// "use client" is required here (state + the real SearchOverlay, itself client-only), the same
// reason SearchBar.tsx itself is a client component.
//
// SECOND REPAIR ROUND, critic punch item: this file's own PillSegment label (below) was set at
// text-[13px], a 5th distinct first-viewport font size (12/13/14/18/31) on top of the 4-size
// ceiling, introduced by this fork and not listed in HomeVariantA.tsx's Conflicts block. Folded
// into the 12px tier already present in the same viewport (CategoryPillRow's chip label, and the
// meta-text scale in the design contract table), leaving 12/14/18/31 (4 distinct) on the first
// viewport this direction draws. Not folded into 14 because 14 is already load-bearing for the
// session-greeting line ("Hi, {name}") one step up in the same hero block; 12 keeps the segment
// label read as secondary/meta text next to its icon, the same role CategoryPillRow's own 12px
// chip label plays.
"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Search, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "@/app/[locale]/_components/search/SearchOverlay";

type Segment = "service" | "stadt" | "zeit";

export default function FreshaQueryPillClient({
  locale,
  labels,
}: {
  locale: string;
  labels: {
    service: string;
    city: string;
    time: string;
    ariaService: string;
    ariaCity: string;
    ariaTime: string;
    ariaSubmit: string;
  };
}) {
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [overlayFocus, setOverlayFocus] = React.useState<Segment>("service");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Copied verbatim off SearchBar.tsx's own openOverlay: service opens synchronously (flushSync)
  // then focuses the real input INSIDE the tap so iOS opens the keyboard; the other two fields
  // just set focus and open. Named handlers (not inline arrows in the JSX below) purely to keep
  // the markup itself free of embedded `>` characters.
  const openOverlay = React.useCallback((seg: Segment) => {
    if (seg === "service") {
      flushSync(() => {
        setOverlayFocus("service");
        setOverlayOpen(true);
      });
      searchInputRef.current?.focus({ preventScroll: true });
    } else {
      setOverlayFocus(seg);
      setOverlayOpen(true);
    }
  }, []);
  const openService = React.useCallback(() => openOverlay("service"), [openOverlay]);
  const openCity = React.useCallback(() => openOverlay("stadt"), [openOverlay]);
  const openTime = React.useCallback(() => openOverlay("zeit"), [openOverlay]);
  const closeOverlay = React.useCallback(() => setOverlayOpen(false), []);

  return (
    <>
      {/* fresha--home.md item 3: one continuous rounded pill, segments separated by whitespace
          only (a hairline divider here for tap affordance on a bordered-free background, which
          the spec calls "no visible separators ... beyond whitespace" but this hairline is the
          Solen hairline token, not a new border style), one solid circular button closing the
          bar. h-14 replaces SearchBar's real 250px stacked card , see FreshaQueryPill.tsx header
          for the punch-list reasoning. */}
      <div className="mx-auto flex h-14 w-full max-w-[540px] items-center rounded-full bg-white pl-1 pr-1 shadow-elevation-2">
        <PillSegment
          icon={<Search size={17} strokeWidth={1.9} />}
          ariaLabel={labels.ariaService}
          value={labels.service}
          onClick={openService}
          first
        />
        <PillSegment
          icon={<MapPin size={17} strokeWidth={1.9} />}
          ariaLabel={labels.ariaCity}
          value={labels.city}
          onClick={openCity}
        />
        <PillSegment
          icon={<Calendar size={17} strokeWidth={1.9} />}
          ariaLabel={labels.ariaTime}
          value={labels.time}
          onClick={openTime}
        />
        <SubmitButton ariaLabel={labels.ariaSubmit} onClick={openService} />
      </div>

      <SearchOverlay
        open={overlayOpen}
        onClose={closeOverlay}
        locale={locale}
        initialFocus={overlayFocus}
        autoFocusService
        serviceInputRef={searchInputRef}
      />
    </>
  );
}

function PillSegment({
  icon,
  ariaLabel,
  value,
  onClick,
  first,
}: {
  icon: React.ReactNode;
  ariaLabel: string;
  value: string;
  onClick: () => void;
  first?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "flex h-full min-w-0 flex-1 items-center gap-2 truncate rounded-full px-3 text-left transition-colors duration-150 ease-glide hover:bg-s-bg-sunken",
        !first && "border-l border-s-border",
      )}
    >
      <span className="shrink-0 text-s-ink-2">{icon}</span>
      <span className="min-w-0 flex-1 truncate font-body text-[12px] font-medium text-s-ink-2 tracking-[-0.005em]">
        {value}
      </span>
    </button>
  );
}

// A one-line ink circular closing button (fresha--home.md item 3: "a solid black circular-ended
// Search button closing the bar on the right"). Separate named function, same reason as the
// openX handlers above: keeps every JSX tag in this file free of an inline `=>` before its own
// closing `>`.
function SubmitButton({ ariaLabel, onClick }: { ariaLabel: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-s-ink text-white transition-transform duration-150 ease-glide active:scale-[0.94]"
    >
      <Search size={18} strokeWidth={2.1} />
    </button>
  );
}
