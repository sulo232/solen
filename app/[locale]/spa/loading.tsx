import { Skeleton, SkeletonCard } from "@/app/[locale]/_components/primitives";

/**
 * H2 (2026-08-02, owner: "when you switch between the categories it loads like another page").
 * MEASURED cause, not guessed: switching from /de to a category route sits ~360-400ms with ZERO
 * visual feedback before anything changes. Coiffeur then shows a skeleton; barbershop, nails and
 * spa had NO loading.tsx at all, so those three routes showed the old page frozen for the whole
 * wait, which is exactly the "loads like another page" feeling. Copied 1:1 from
 * app/[locale]/coiffeur/loading.tsx so all four categories share one loading anatomy
 * (FLOORS LAW 8, the same thing looks the same everywhere), rather than inventing a per-category
 * variant. The remaining dead window before this mounts is the separate, harder half of H2.
 */
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero banner */}
      <Skeleton className="w-full h-48 mb-6" rounded={12} />
      {/* Salon card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
