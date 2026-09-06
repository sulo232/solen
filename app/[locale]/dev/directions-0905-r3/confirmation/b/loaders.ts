// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a loader module (they cover the TRAY look system, the home A/B/C directions, the
// empty-state directions, the search heading line, the review count, the round-2 index's
// kit-preview switcher block, and the salon-book-button harness). `npm run exists confirmation`
// (this session) surfaces the real loader this barrel re-exports.
//
// A one-line re-export, never a second loader, same pattern the round-3 kit's own index.ts
// documents: "a second Pill/Card/StatusBadge here would be exactly the 'a second X is a defect'
// case." getAlternatePhoto() already exists (round 2's own LIFT confirmation builder wrote it,
// see its own header for the real salon_portfolio_images query it runs); this file adds no logic
// of its own, it only gives round 3's own confirmation folder a same-round import path so the
// page component below never spells out a cross-round relative path itself.
export { getAlternatePhoto, BANNED_GREYSCALE_PHOTO_ID } from "../../../directions-0905-r2/confirmation/_lift/getAlternatePhoto";
