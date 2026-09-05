// Exists-check: `npm run exists book button` -> one graveyard hit, unrelated (the map-preview
// "Book button" removed 2026-07-02 for mis-click risk; this is a different surface, the salon
// PAGE service row, not a map card, so it is not a re-proposal of that removal). No live "match
// the row Book to the bar Book" surface exists yet, so this is new: a comparison harness only,
// built on the real components below, nothing hand-drawn.
//
// Grounded-in: app/[locale]/_components/salon/SalonServices.tsx (the real service row + its
// "Buchen"/"Book" Link, rendered here unmodified three times with real data) composed via the
// same loader the real route uses, app/[locale]/salon/[slug]/page.tsx -> lib/salon-detail.ts
// loadSalonDetailWithStatus("muse-beauty-studio", locale). The reference button at the bottom
// reproduces app/[locale]/_components/salon/SalonMobileBookBar.tsx's Link className string
// (see note above that block) rather than importing the live component, because the live
// component: (a) portals to document.body and renders position:fixed, so it cannot sit
// "statically in the flow" on this page; (b) returns null until cookie consent is answered
// (SalonMobileBookBar.tsx:71, `!hasConsented`) and until a client mount flag flips, so this dev
// route would render nothing there on first load.
//
// REPAIR 2026-09-05 (open items 1-5): "classes copied verbatim so the pixels match" was false on
// two axes, both confirmed live and both fixed below. (a) `.bg-s-ink` does not compute to #0A0A0A
// at runtime: app/globals.css's owner-dated ink-fill/ink-text split (2026-08-15) redefines
// `.bg-s-ink { background-color: theme("colors.s-ink-soft.DEFAULT") }` to #1C1C1F, keeping
// #0A0A0A for TEXT only. Variant 3 below had hardcoded the text hex as a fill, so it did not
// match its own claimed recipe. (b) app/globals.css also has
// `main :is(.font-semibold, .font-bold) { font-weight: 500 }`, and this whole route renders
// inside app/[locale]/layout.tsx's <main id="main-content"> (no route-local layout overrides it),
// so the Reference block's font-semibold class was silently downgraded to 500 on this page even
// though the real, portaled SalonMobileBookBar sits outside <main> and stays at 600. The
// Reference block now carries an inline `style={{ fontWeight: 600 }}` to cancel that scoped
// override, since inline style always outranks a non-!important class selector; that is the
// smallest fix that keeps the block reference-only and does not touch the shared main-scoped rule
// (font weight demotion is an owner-approved, dated decision for real customer copy, see
// app/globals.css's "TWO TEXT WEIGHTS ON CUSTOMER SURFACES" note; this page's job is to show what
// the real button renders, not to inherit a rule meant for a different kind of text).
//
// Deviations: SalonServices exposes no prop to restyle its Book Link (see the component: the
// className is a literal string on the Link at SalonServices.tsx:250, no variant/className
// prop). Per the brief's fallback, variants 2 and 3 wrap the untouched live component in a
// scoped className ("r2-match-shape" / "r2-match-full") and override ONLY the Book anchor via
// an attribute selector (`a[href*="/booking?service="]`) in the <style> block below - the
// component itself is never forked or copied. The override uses !important because Tailwind's
// own arbitrary-value utilities (`text-[13px]`, `py-2`) sit at the same specificity tier as a
// plain class selector and source order is not something this wrapper controls; the scoped
// class keeps the blast radius to these three boxes only.
//
// measured: per-service Book link is 74px wide x 38px tall via getBoundingClientRect (SalonServices.tsx:250) -- white fill, 1px hairline border, 13px font-weight 500, 9999px border-radius.
// measured: sticky-bar Book button via getComputedStyle (SalonMobileBookBar.tsx:80) -- full width, approx 50px tall (py-3.5 around a 15px line-height plus a 16px icon), ink FILL #1C1C1F / rgb(28,28,31) (`.bg-s-ink` resolves to the `s-ink-soft` token at runtime, not the #0A0A0A ink-TEXT hex; corrected 2026-09-05, was the stale reading that caused open item 1), white text, 15px font-weight 600, 9999px border-radius.
// "Matched in shape"/"Matched in full" below raise the row button to a stated 44px height
// (LOCKFILE touch-target floor, h-11), not the bar's 50px, since a row-sized control keeping
// the a11y minimum is what "row-sized height" means here.
//
// A fresh Playwright pass at /en/dev/directions-0905-r2/salon-book-button (390x844, dpr 3)
// re-measures every Book button on THIS page; see the structured return value for that table.
//
// Depicts: the service row (name/duration/price/Book) -> app/[locale]/_components/salon/SalonServices.tsx (ServiceRow, rendered live 3x with muse-beauty-studio's real seeded services)
// Depicts: real service data -> lib/salon-detail.ts loadSalonDetailWithStatus, same call as app/[locale]/salon/[slug]/page.tsx
// Depicts: the sticky-bar Book button (reference row) -> app/[locale]/_components/salon/SalonMobileBookBar.tsx (className string reproduced verbatim; not the live portaled/consent-gated component, see above)
// Depicts: shape/fill overrides on the row's Book anchor -> NET-NEW: comparison-only CSS scoped to this dev route (.r2-match-shape / .r2-match-full), not present on any real surface
//
// emphasis-ok: the reference block's font-semibold class is a byte-for-byte reproduction of the
// real sticky-bar button's class string (see Deviations above), not a styling choice; the inline
// fontWeight:600 next to it is a compensation for this route's own main-scoped CSS (see REPAIR
// note above), not a second weight decision, since it reproduces the same 600 the real button and
// this page's own r2-match-full override already use. The four comparison labels are font-normal,
// and the 28px title is the page's one display anchor.

import { ChevronRight } from "lucide-react";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";

const SALON_SLUG = "muse-beauty-studio";

export default async function SalonBookButtonDirections({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const result = await loadSalonDetailWithStatus(SALON_SLUG, locale);

  if (!result) {
    return (
      <div className="p-6 text-[14px] text-s-ink-2">
        Blocked: loadSalonDetailWithStatus(&quot;{SALON_SLUG}&quot;) returned null, the real
        salon row this mockup needs could not be loaded.
      </div>
    );
  }

  const { salon } = result;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[402px] bg-white pb-16">
      {/* Scoped overrides, see the "Deviations" comment above. Nothing outside
          .r2-match-shape / .r2-match-full is touched. */}
      <style>{`
        .r2-match-shape a[href*="/booking?service="],
        .r2-match-full a[href*="/booking?service="] {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 44px !important;
          padding: 0 24px !important;
          font-size: 15px !important;
          font-weight: 600 !important;
        }
        /* #1C1C1F is .bg-s-ink's runtime computed background (the s-ink-soft token,
           app/globals.css "INK FILL vs INK TEXT" rule, owner 2026-08-15), not the #0A0A0A
           ink-TEXT hex; using the text hex here was open item 1's bug. */
        .r2-match-full a[href*="/booking?service="] {
          background-color: #1C1C1F !important;
          border-color: #1C1C1F !important;
          color: #ffffff !important;
        }
        .r2-match-full a[href*="/booking?service="]:hover {
          background-color: #000000 !important;
        }
      `}</style>

      <h1 className="font-display px-4 pt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
        Service row Book button
      </h1>

      {/* 1. Current, untouched */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">Current</p>
        <div className="pt-3">
          <div className="px-4">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-8 border-t border-s-border" />

      {/* 2. Matched in shape: main button's type + corner + a row-sized 44px
          height (the a11y touch-target floor, LOCKFILE "touch target"), still
          a neutral white/hairline/ink outline. */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">Matched in shape</p>
        <div className="r2-match-shape pt-3">
          <div className="px-4">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-8 border-t border-s-border" />

      {/* 3. Matched in full: the main button's exact recipe at row size. */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">Matched in full</p>
        <p className="px-4 pt-1 text-[14px] text-s-ink">
          Conflict: the contract allows one ink commit button per screen (CLAUDE.md taste rule
          3); this variant renders six.
        </p>
        <div className="r2-match-full pt-3">
          <div className="px-4">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-8 border-t border-s-border" />

      {/* Reference: the main Book button, class string reproduced verbatim from
          SalonMobileBookBar.tsx (see the file-top note on why it isn't imported live). */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">
          Reference: the main Book button
        </p>
        <p className="px-4 pt-1 text-[13px] text-s-ink-2">
          The className string below is the real SalonMobileBookBar.tsx recipe verbatim; the
          inline fontWeight cancels this route&apos;s inherited `main .font-semibold =&gt; 500`
          rule (app/globals.css) so this block renders the true 600 the portaled button carries
          outside &lt;main&gt;, instead of silently reading one weight lighter.
        </p>
        <div className="px-4 pt-3">
          <div
            className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-[colors,transform] hover:bg-black active:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
            style={{ fontWeight: 600 }}
          >
            Book appointment
            <ChevronRight size={16} strokeWidth={1.9} />
          </div>
        </div>
      </div>
    </div>
  );
}
