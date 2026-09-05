// Exists-check: `npm run exists input` -> 27 matches. 2 REMOVED hits (the Inspo search
// focused-state overrides; the old /profile tabbed hub's search field), neither relevant to a
// corner-radius comparison, nothing from either is reused or re-proposed here. 20 page-inline
// "mockup-ok" dead-class-removal markers on dashboard/settings inputs (all downstream of the
// 2026-07-17 base-input-law rewrite this page is about). 1 COMPONENT hit: TextInput
// (primitives/TextInput.tsx), the real registered Input primitive. 4 exported symbols
// (formatSwissPhoneInput, TextInput, usePhoneCaretInput, wrapUntrustedInput), none new here.
// Nothing new is built below; this composes the existing TextInput twice.
//
// Grounded-in: app/[locale]/_components/primitives/TextInput.tsx, the real registered Input
// primitive per _design-system/COMPONENT_REGISTRY.md's Input row ("Filled-gray-at-rest, pops to
// white+ink-border on focus"). Placeholder copy is the live search input's own English string:
// messages/en.json "queryPlaceholder": "Service, salon or stylist", already shown on the real
// search overlay input.
//
// Depicts: both input rows -> app/[locale]/_components/primitives/TextInput.tsx (rendered live, unmodified except an external border-radius override on row 2)
// Depicts: the placeholder copy -> app/[locale]/_components/search/SearchOverlay.tsx:1855 (messages/en.json "queryPlaceholder")
// Depicts: comparison labels and footer line -> NET-NEW: decision-harness captions comparing two radius values, not present on any real screen.
//
// THE DECISION, three citations grepped live before writing this file, quoted verbatim:
// - tailwind.config.js:289   input: "16px", // DESIGN_SPEC §3.3: form inputs (stable, not pill)
// - _design-system/LOCKFILE.md:580   | `input` | 12px | Form inputs (stable, NOT pill). Owner
//   kept shipped 12 over 16, 2026-06-08 , LOCKFILE had drifted ahead of code. |
// - CLAUDE.md:140 (design-contract "radius" row)   ... input **12** (corrected 2026-07-17,
//   see below) ...
// All three confirmed present at those lines.
//
// A finding surfaced while building this, reported because it changes what "Row 1" actually
// proves: none of the 37 live `rounded-input` call sites (grepped across app/, components/,
// components-legacy/, lib/) puts that class on a native <input> tag , every one is a wrapper
// <div>, an icon button, an <img>, or a card shell (SalonCard avatar, StaffReviewsSheet photos,
// dashboard modal shells, a phone-prefix box in GuestBookingForm, etc). The real <input>
// element's radius today is set by a SEPARATE, hardcoded rule in app/globals.css (`@layer base`,
// the "input:not([type=checkbox])...:not([type=hidden])" block, ~line 434): `border-radius:
// 12px` on every native input/textarea/select, unconditionally, with no reference to the
// `rounded-input` token at all. So Row 1 below puts the literal `rounded-input` class straight
// onto the real primitive's <input> element, untouched, to show what the token itself does to a
// real field. Whether that wins over the base-layer 12px or loses to it is a cascade question
// (globals.css's own comments argue it should lose, via a specificity/layer argument), not
// something to assume, so it is measured live below via Playwright and reported as-is, not
// adjusted to match the brief's framing either way.

import { TextInput } from "@/app/[locale]/_components/primitives/TextInput";

const PLACEHOLDER = "Service, salon or stylist";

export default async function InputRadiusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[402px] bg-white pb-[125px]">
      {/* Scoped override for Row 2 only, per the brief: a wrapper class, never touching the
          primitive or tailwind.config.js. Row 1 carries no override, see the file-top note. */}
      <style>{`
        .r2-input-radius-locked input {
          border-radius: 12px !important;
        }
      `}</style>

      <h1 className="font-display px-4 pt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
        Input corner
      </h1>

      <div className="mt-8 px-4">
        <p className="text-[13px] font-normal text-s-ink-2">
          Measured live: 12px, from the base rule in app/globals.css:441 (inside the
          input:not(...) block starting line 434), not the 16px rounded-input declares
          (tailwind.config.js:289). Tailwind 3.4 compiles @layer to plain CSS with no real
          cascade layers, so the base rule&apos;s ten-clause :not() selector out-specifies
          the single .rounded-input class below.
        </p>
        <div className="mt-3">
          <TextInput className="rounded-input" placeholder={PLACEHOLDER} aria-label={PLACEHOLDER} />
        </div>
      </div>

      <div className="mt-8 px-4">
        <p className="text-[13px] font-normal text-s-ink-2">
          As locked: 12px (LOCKFILE.md:580, kept over 16 on 2026-06-08), forced here via a
          scoped override; measured identical to Row 1&apos;s unmodified real render above,
          since the base rule already ships 12px unprompted.
        </p>
        <div className="r2-input-radius-locked mt-3">
          <TextInput placeholder={PLACEHOLDER} aria-label={PLACEHOLDER} />
        </div>
      </div>

      <p className="mt-8 px-4 text-[14px] text-s-ink">
        Every native input already renders 12. The 16px token is used 37 times, never on an
        input, so changing it would move 37 wrappers and photos, not one field.
      </p>
    </div>
  );
}
