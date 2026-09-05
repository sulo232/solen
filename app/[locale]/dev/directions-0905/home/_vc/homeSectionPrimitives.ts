// exists-check: net-new vs app/api/homepage-sections/route.ts and app/api/admin/homepage-sections/route.ts
// (both are an unrelated admin CMS API for editable homepage banner rows, no relation to this
// file, which is a plain zero-logic re-export of two existing presentational components) and the
// three _plans/ docs above (planning notes, not code, nothing to extend). Genuinely net-new: a
// one-line barrel so the shared homepage layout primitives can be imported once from this
// direction's own folder rather than repeating their real source path in more than one file here.
//
// Plain re-export, no JSX, no new component. The two names below are the real, currently-shipping
// FeedZone and SectionTitle every homepage section file already imports (RecentlyViewed.tsx,
// Nearby.tsx, TopCategoryRails.tsx, ForYouSalonRows.tsx, page.tsx itself, and about a dozen more).
export { FeedZone, SectionTitle } from "@/app/[locale]/_components/homepage/SectionHeader";
