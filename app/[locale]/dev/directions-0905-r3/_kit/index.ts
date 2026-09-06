// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits
// (TRAY, home A/B/C, empty-state directions, the search heading line, the review count, the
// kit-preview switcher block, the salon-book-button harness), none of them a shared kit re-export
// barrel. The round-2 kit itself (app/[locale]/dev/directions-0905-r2/_kit/*) already exists and
// now carries the three round-3 candidates (systems.ts SYSTEMS.a/b/c) plus TimingPill/DateLine;
// this file is NOT a second kit, it is the one-line re-export the brief asks for so a round-3
// screen imports from "../_kit" instead of reaching two folders up into round 2's private `_kit`.

/**
 * index.ts - round 3's own import surface.
 *
 * A round-3 mockup does:
 *
 *   import { KitProvider, Pill, StatusBadge, PrimaryButton, SecondaryButton, TextLink, Card,
 *            SectionTitle, Meta, Price, TimingPill, DateLine,
 *            TYPE_RAMP, SPACING, RADIUS, COLOR, SYSTEMS } from "../_kit";
 *
 *   <KitProvider system="a" | "b" | "c">   (exactly one candidate per screen)
 *
 * No component is duplicated here: every export below is a re-export of the SAME file the
 * round-2 kit already ships (`../../directions-0905-r2/_kit/index.ts`), which itself now carries
 * the three round-3 value sheets and the two new primitives Part 3 of ROOT_CAUSES.md names
 * (TimingPill, DateLine) alongside every round-2 export (Pill, Card, StatusBadge, PrimaryButton,
 * SecondaryButton, TextLink, SectionTitle, Meta, Price, tokens, systems). A second Pill/Card/
 * StatusBadge here would be exactly the "a second Pill is a defect" case the brief warns against.
 */

export * from "../../directions-0905-r2/_kit";
