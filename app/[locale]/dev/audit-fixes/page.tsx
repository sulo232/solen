/**
 * /dev/audit-fixes , INDEX for the 2026-07-08 frontend audit's fabricated-data
 * fixes. Owner must SEE each surface with the invented content removed
 * (mockup-first law) before real code is touched. Dev-only, mirrors the
 * /dev/mockups index shape (same notFound guard, Link list, group heading).
 *
 * Exists-check: `npm run exists audit-fixes` = 0 matches this turn. `npm run
 * exists mockup` shows `app/[locale]/dev/mockups/page.tsx` as the ONE existing
 * dev-mockup index , this page EXTENDS that pattern (same conventions) rather
 * than duplicating a second unrelated index; it does not touch or link from
 * that file since /dev/mockups is scoped to map/search/checkout mockups only.
 * Net-new: this index + the fabrication before/after page it links to.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

const ITEMS: { slug: string; label: string; desc: string }[] = [
  {
    slug: "fabrication",
    label: "Fabricated data, 5 sites",
    desc: "before/after for Nearby, Reviews, BusinessTeaser, trust strips, forYouSalons",
  },
];

export default async function AuditFixesIndex({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[560px] px-5 pb-16 pt-8">
        <p className="text-[12px] font-semibold text-s-ink-3">Solen , audit fixes index</p>
        <h1 className="mt-1 font-heading text-[22px] font-bold text-s-ink">2026-07-08 frontend audit, fixes</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          Before/after mockups for the audit's confirmed findings. Owner-review only, nothing here touches
          real code.
        </p>

        <section className="mt-7">
          <h2 className="text-[14px] font-bold text-s-ink">No-fabrication findings</h2>
          <p className="mb-3 text-[12.5px] text-s-ink-2">
            Taste rule 1 + PSYCHOLOGY.md law 9: never render a number/status/testimonial not wired to a
            live source.
          </p>
          <div className="space-y-2">
            {ITEMS.map((it) => (
              <Link
                key={it.slug}
                href={`/${locale}/dev/audit-fixes/${it.slug}`}
                className="flex items-center justify-between gap-3 rounded-[16px] border border-s-border bg-white px-4 py-3.5 active:scale-[0.99]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-s-ink">{it.label}</span>
                  <span className="block truncate text-[12.5px] text-s-ink-2">{it.desc}</span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-s-accent">Open</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
