// Grounded-in: app/[locale]/_components/homepage/SearchBar.tsx (collapsed-row anatomy + the
// openOverlay wiring COPIED, not imported, per the punch-list fix below) and
// app/[locale]/_components/search/SearchOverlay.tsx (imported unmodified).
//
// Exists-check: `npm run exists SearchOverlay` -> real, wired component at
// app/[locale]/_components/search/SearchOverlay.tsx (imported below, unmodified, same props
// SearchBar.tsx itself passes: open/onClose/locale/initialService/initialCity/initialFocus/
// autoFocusService/serviceInputRef). `npm run exists CollapsedRow` -> only inside SearchBar.tsx
// (not exported), so its icon+placeholder ROW idea is reproduced here, not imported, per the
// brief's "copy that component into your own folder, rename it, change the copy" clause.
//
// REPAIR ROUND, punch item 3: the critic measured the previous version of this direction (3
// bordered stacked rows + a separate button below, SearchBar.tsx's real MOBILE layout) against
// fresha--home.md item 3 ("one continuous rounded pill container, divided into ... segments ...
// no visible separators beyond whitespace ... a solid black circular-ended Search button closing
// the bar") and found the header's claim of Fresha fidelity overstated. Fix picked: MATCH the
// anatomy (the critic's first option), not just reword the claim, because the same change also
// fixes punch item 2 (imagery floor): SearchBar's real mobile stack is a fixed 250px-tall card
// (HEIGHT.mobile.collapsed in SearchBar.tsx, off-limits/unmodified), and that 250px anatomy is
// the biggest single block of non-photo space above the fold. A one-row pill is ~56-64px, freeing
// roughly 190-200px for real salon photography to rise into the first viewport, the exact fix the
// floor asks for ("surfacing more real salon content higher... the real feed earlier").
//
// This is a FORK, not an import, of SearchBar's collapsed-row anatomy and wiring: the state
// machine (which field opens which overlay step), the real SearchOverlay mount, and the real
// translation keys are reproduced verbatim off SearchBar.tsx's openOverlay/CollapsedRow/render
// (lines ~120-165 and ~268-330 of that file); the throwaway bits (the island morph/expand
// machinery, the desktop horizontal-pill breakpoint logic) are dropped because this direction
// only ever needs the resting/mobile shape, never the island. Submits through the identical
// path: tapping any segment opens the real SearchOverlay, which itself submits to /{locale}/search.
//
// Depicts: the 3 tappable segments (Service/City/Time) -> SearchBar.tsx's real openOverlay + CollapsedRow logic, reproduced in ./FreshaQueryPillClient.tsx (anatomy had to change per the punch list above, so this is a fork, not an import).
// Depicts: the full-page search surface each segment opens -> app/[locale]/_components/search/SearchOverlay.tsx (real, imported unmodified, same props SearchBar.tsx passes; submits to the real /{locale}/search route unchanged).
// Depicts: the field labels and the submit aria-label -> real next-intl keys ui.searchOverlay.serviceField/cityField/timeField/findAppointmentsCta in messages/en.json, the same keys SearchBar.tsx's CollapsedRow reads.
//
// Direction (unchanged from the direction brief): ENTRY, Fresha's query builder leads the screen.
// This file is the corrected anatomy for that entry point.
//
// Sources: fresha--home.md item 3, quoted above -> the segment order here is Service | City |
// Time (3 segments), not Fresha's 4 (Treatment | Location | Date | Time), named as the one
// remaining, honest deviation: Solen's real data model already merges date + time-of-day into a
// single "Zeit" field (SearchBar.tsx's own `zeit` state, `PERIODS` list), and splitting that into
// two independently-wired fields would mean forking SearchOverlay's step machine too, which goes
// past a treatment-only anatomy change into rebuilding real product logic the brief's own
// Conflicts note (see HomeVariantA.tsx) already declined to do for the identical reason. Every
// other part of item 3 is matched: one continuous rounded-full container, segments separated by
// whitespace/a hairline only (no boxed borders per segment), one solid closing button on the
// right.
//
// Conflicts (LOCK MODE, Solen tokens only, no Airbnb value ported, this direction is not
// LOOK-FULL): the closing button is icon-only (a Search glyph, per the Fresha spec) rather than
// Solen's usual label CTA; it carries the real "Find appointments" i18n string as its aria-label
// (copy economy rule 3: icon-only is legal only with an aria-label, kept). Its fill reuses the
// existing Solen ink token, the same one the real hero CTA above it already used (the one named
// commit-button exception, not a new use of it). Radius, shadow token and icon set are otherwise
// unchanged Solen values (rounded-full, the existing elevation-2 shadow token, Lucide icons only).
import FreshaQueryPillClient from "./FreshaQueryPillClient";
import { getTranslations } from "next-intl/server";

export default async function FreshaQueryPill({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "ui.searchOverlay" });
  return (
    <FreshaQueryPillClient
      locale={locale}
      labels={{
        service: t("serviceField"),
        city: t("cityField"),
        time: t("timeField"),
        ariaService: t("ariaSearchService"),
        ariaCity: t("ariaChooseCity"),
        ariaTime: t("ariaChooseTime"),
        ariaSubmit: t("findAppointmentsCta"),
      }}
    />
  );
}
