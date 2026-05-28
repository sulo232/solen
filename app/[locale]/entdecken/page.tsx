// V3-D159 (2026-05-25): German alias for /discover. All user-facing
// links across the German UI (Header nav, MobileMenu category chip,
// homepage Entdecken section "Alle entdecken →") point at /entdecken
// — this re-export makes those work without duplicating page logic.
// The canonical implementation lives at app/[locale]/discover/page.tsx;
// if you need to change discovery behavior, edit there, not here.
export { default } from "../discover/page";
