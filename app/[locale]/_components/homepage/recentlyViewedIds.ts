// DELETED 2026-07-16 (owner "make it all real"): this file's only export
// (the recently-viewed demo id list) fed RecentlyViewed.tsx's fabricated
// fallback list. The fallback is now real (topSalonIds -> getTopSalonIds()
// in salonCardData.ts, threaded through page.tsx), so this id list has zero
// consumers. Sandbox write restrictions blocked an actual `rm` of this file
// from the coder tool run (Bash rm/git rm both returned "Operation not
// permitted" on every path tried in this project tree) -- this file is
// emptied to a no-op stub instead. Safe to physically delete with a real
// shell, no import references it anywhere in app/.
export {};
