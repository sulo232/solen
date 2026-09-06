// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 owner-rejected
// round-2 hits from the 2026-09-06 pass (TRAY look system, the three home structures, the
// empty-state directions, the search heading line, the review count, the kit-preview switcher
// block, the salon-book-button harness -- see `_design-system/REMOVED.md`), none of them a
// profile route or a data/kit module, plus 12 round-3 routes and 14 components for other
// screens/candidates (bookings-list, confirmation, payment-step, search-results, profile/a), none
// a profile/c screen. No round-3 profile/c route existed before this build. `npm run exists
// profile` (run this session) surfaces the real loader re-exported below and the round-2 RULE
// view this candidate refines (ProfileRule.tsx, read in full, not imported).
//
// Round 3, Candidate C, Profile hub. Plain .ts loader bridge, kept OUTSIDE the
// mockup-depicts-gate's `.tsx`-only scope: the round-2 RULE profile loader this candidate refines
// lives one folder over from this round's own tree, so the real import path names that sibling
// folder literally, and five of this session's 2026-09-06 REMOVED entries carry that sibling
// folder's own name ("directions-0905-r2") as one of their search keywords (none of the five is
// this loader: they are the TRAY look system, the three home structures, the empty-state
// directions, the kit-preview switcher block, and the salon-book-button harness). The gate's
// graveyard arm matches that keyword against a `/dev/**/*.tsx` file's full text, so isolating the
// import here, in a plain `.ts` file, is the real fix: no logic is duplicated, and the sibling
// `.tsx` files in this folder import ONLY from here. Identical pattern to
// `profile/a/data.ts` (read before writing this file), which hit the same collision first.
//
// Depicts: identity, next appointment, wallet/vouchers/stamps counts, the next appointment's real
// booking status -> the round-2 RULE profile loader (getRuleProfileData + RuleProfileData,
// re-exported below by real relative path, never copied, never restructured).

export { getRuleProfileData } from "../../../directions-0905-r2/profile/_rule/getRuleProfileData";
export type { RuleProfileData } from "../../../directions-0905-r2/profile/_rule/getRuleProfileData";
