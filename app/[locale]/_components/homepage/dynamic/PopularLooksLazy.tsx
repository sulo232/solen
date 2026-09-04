"use client";

// exists-check: ran `npm run exists dynamic` (fix round, 2026-09-04): the only COMPONENTS hit was
// PopularLooksDynamic (the skeleton this file already imports below); no existing "use client"
// wrapper puts PopularLooks behind next/dynamic({ssr:false}), so this is net-new, not a duplicate.
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md, directly under
// PopularLooksDynamic's own row.
//
// perf-first-load slice, FIX ROUND (2026-09-04): the reviewer's punch list caught a hard crash,
// `ssr: false is not allowed with next/dynamic in Server Components. Please move it into a client
// component.`, verified live on every request to /de on this worktree's own server (port 3461).
// app/[locale]/page.tsx is an async SERVER component (no "use client"), and Next.js refuses a
// `dynamic(..., { ssr: false })` call written directly inside a Server Component.
//
// The fix: the ssr:false dynamic() import moves into THIS "use client" wrapper file instead. A
// Client Component is allowed to call dynamic() with ssr:false, so page.tsx now only imports this
// file directly (a normal, non-dynamic import of a client component) and renders <PopularLooksLazy
// />; the deferred-chunk behaviour for PopularLooks itself (the actual perf win this slice measured,
// its JS chunk pulled out of the route's First Load JS) is unchanged, only WHERE the dynamic() call
// lives moved.
import dynamic from "next/dynamic";
import PopularLooksSkeleton from "./PopularLooksDynamic";

const PopularLooks = dynamic(() => import("../PopularLooks"), {
  ssr: false,
  loading: PopularLooksSkeleton,
});

export default function PopularLooksLazy() {
  return <PopularLooks />;
}
