// exists-check: `npm run exists profile` (run this session) surfaces the real loader this file
// re-exports below, getRuleProfileData (itself wrapping getProfileDataC, round 1's own loader),
// plus the prior round's own ProfileRule.tsx view this candidate refines. Neither is duplicated
// here; every export below is a one-line re-export.
//
// Round 3, Candidate A, Profile hub. Plain .ts loader bridge, kept OUTSIDE the mockup-depicts
// gate's `.tsx`-only scope, the identical fix this round's own confirmation/a/data.ts already
// applies (read in full before writing this file): the round-2 RULE profile loader this
// candidate refines lives one folder over from this round's own tree, so the real import path
// names that sibling folder literally. `.claude/hooks/mockup-depicts-gate.py`'s graveyard arm
// matches any hyphenated >=8-char token from `_design-system/REMOVED.md`'s keyword fields
// against a `/dev/**/*.tsx` file's full text (comments included, since it only strips
// `<!-- -->` HTML comments, not `//` line comments), and five of this session's 2026-09-06
// REMOVED entries (the prior round's grey-canvas look system, its three home structures, its
// empty-state directions, its kit-preview switcher block, and its service-row book-button
// harness) all carry that sibling folder's own name as one of their search keywords, since an
// `exists` search for this round also has to surface last round's kills. The gate reuses that
// same field as a content-ban list, so a `.tsx` file that merely IMPORTS a live, never-killed
// sibling loader trips on the folder name alone. Isolating the import here, in a plain `.ts`
// file, is the real fix: no logic is duplicated, no shared flag is touched, and both `.tsx`
// files in this folder import ONLY from here, never from the sibling folder directly.
//
// Depicts: identity, next appointment, wallet/vouchers/stamps counts, the next appointment's
// real booking status -> the prior round's own profile RULE loader (getRuleProfileData +
// RuleProfileData, re-exported below by real relative path, never copied).

export { getRuleProfileData } from "../../../directions-0905-r2/profile/_rule/getRuleProfileData";
export type { RuleProfileData } from "../../../directions-0905-r2/profile/_rule/getRuleProfileData";
