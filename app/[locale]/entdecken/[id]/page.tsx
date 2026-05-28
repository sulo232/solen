// V3-D159 (2026-05-25): German alias for /discover/[id]. Look detail
// links from the homepage Entdecken section render as
// /entdecken/${look.slug}; this re-export resolves them to the canonical
// detail page at app/[locale]/discover/[id]/page.tsx. Both default
// component AND generateMetadata are re-exported so OG / SEO tags match.
export { default, generateMetadata } from "../../discover/[id]/page";
