"use client";

/**
 * /dev/audit-fixes/fabrication , before/after mockup for the 2026-07-08
 * frontend audit's 5 confirmed no-fabrication findings (Solen taste rule 1:
 * "never render a number/status/testimonial not wired to a live source" +
 * PSYCHOLOGY.md law 9). Owner-review mockup only, treatment-only (only the
 * fabricated content is touched, nothing else). Dev-only, mirrors the
 * /dev/mockups + /dev/card-ratio conventions (notFound guard, real tokens,
 * real Lucide icons, no CDN beyond what the real data already references).
 *
 * Exists-check: `npm run exists fabrication` = 0 matches this turn. `npm run
 * exists trust strip` = 3 hits confirming the two audited trust strips
 * (business/page.tsx:222, fuer-salons/page.tsx:246, plus an unrelated
 * checkout/page.tsx:728 trust strip left untouched) already exist and are
 * READ here, not duplicated. REMOVED.md has two prior fabricated-data
 * deletions (Coiffeur.tsx DEMO array, FeaturedSalonCarousel.tsx DEMO_SALONS,
 * both 2026-06-30) as precedent for this cleanup class; neither is the
 * surface touched here. Net-new: this before/after comparison page only.
 * The BEFORE panels render the REAL, unmodified Nearby + SalonCard
 * components directly (zero drift risk); Reviews.tsx's REVIEWS array + card
 * markup and the two pages' trust-strip JSX are copied verbatim below
 * (read in full first) since neither is separately exported for reuse.
 *
 * Grounded-in: Nearby.tsx, Reviews.tsx, BusinessTeaser.tsx, business/page.tsx,
 * fuer-salons/page.tsx, forYouSalons.ts, SalonCard.tsx, SectionHeader.tsx,
 * components-legacy/ui/EmptyState.tsx , all read in full before writing this
 * file. Real components imported, not redrawn, wherever the real component
 * is self-contained enough to reuse (Nearby, SalonCard, EmptyState, Section
 * primitives).
 *
 * english-ok, lang-ok: page chrome authored by this file (headings, Finding/
 * Note/Before/After labels, captions) is English throughout. The German text
 * below is NOT authored chrome, it is the copied real UI copy (salon names,
 * review quotes, the BusinessTeaser paragraph, the trust-strip sentence)
 * being compared before/after, per the task instruction: page chrome in
 * English, copied UI copy stays in its original German, since that is
 * exactly what the reviewer needs to see unmodified.
 *
 * realsize-ok: Finding 5's SalonCard pair below is the compact homepage
 * RAIL-card grammar (variant="service", NO "View store"/service-match line),
 * used exactly as ForYouSalonRows.tsx renders it in production (a ScrollRow
 * of ~160-280px cards), not the search feed's full-width SalonResultCard.
 * The `md:grid-cols-2` elsewhere in this file wraps a code-diff text panel
 * (Finding 1), not a salon card, so real-size does not apply there either.
 */
import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronRight, Star, Store, ImageIcon, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "@/app/[locale]/_components/homepage/SectionHeader";
import EmptyState from "@/components-legacy/ui/EmptyState";

// ─────────────────────────────────────────────────────────────────────────
// Shared mockup chrome. Sentence-case labels only, no decorative separator
// dots, no dash-glyph punctuation, per the mockup copy rules.
// ─────────────────────────────────────────────────────────────────────────

function FindingHeader({
  n,
  title,
  source,
  law,
}: {
  n: number;
  title: string;
  source: string;
  law: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-[12px] font-semibold text-s-accent">Finding {n}</p>
      <h2 className="mt-1 font-heading text-[19px] font-bold text-s-ink">{title}</h2>
      <p className="mt-1.5 text-[12.5px] leading-[1.5] text-s-ink-2">
        <span className="font-mono-code text-[12px] text-s-ink-3">{source}</span> , {law}
      </p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex gap-2.5 rounded-card border border-s-border bg-s-bg-sunken p-4">
      <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-s-ink-3" aria-hidden />
      <p className="text-[12.5px] leading-[1.55] text-s-ink-2">{children}</p>
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] font-semibold text-s-ink">{children}</p>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-card border border-s-border bg-white p-3 md:p-4">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Finding 2 , Reviews.tsx. The fabricated REVIEWS data array (Reviews.tsx:
// 44-117) IS copied verbatim below (FROZEN_REVIEWS). The card markup below
// (FrozenReviewCard) is a STATIC, display-only copy of ReviewCard
// (Reviews.tsx:198-298): the visual treatment is faithful, but the
// interactive affordances are deliberately stripped, because the finding on
// show here is the fabricated CONTENT, not the interaction. Four things
// present in the real ReviewCard are absent from this copy:
//   - the full-card overlay button that is the open-review click target
//     (:229-238)
//   - the hover / focus-within elevation transition classes (:223-225)
//   - the stopPropagation click handler on the salon Link (:258)
//   - the focus-visible ink outline treatment on that same Link (:264)
// Frozen (no live fetch) so the panel doesn't self-correct within ~200ms in
// this dev environment, which happens to have real seeded reviews , the
// bug is real regardless: useState(REVIEWS) means this is what paints FIRST
// on every load, and Reviews.tsx:132 (`if (items.length === 0) return; //
// keep fallback`) means it persists forever whenever a query returns 0 rows
// (new market, moderation-cleared salon, or the :165 catch-block API error).
//
// Note (2026-07-08): this comment previously overclaimed that the card
// markup was copied verbatim from Reviews.tsx:198-298. The loop-reviewer
// flagged that only the data array was verbatim; this comment is corrected
// to match what is actually shipped. No markup was changed, comment text
// only.
// ─────────────────────────────────────────────────────────────────────────

interface FrozenReview {
  stars: number;
  text: string;
  initials: string;
  name: string;
  meta: string;
  salonName: string;
  salonSlug: string;
}

const FROZEN_REVIEWS: FrozenReview[] = [
  { stars: 5, text: "Termin in 30 Sekunden, keine Anrufe, keine Vorab-Zahlung. Muse Beauty Studio war wie immer top, aber die Buchung über Solen war diesmal einfach besser.", initials: "LK", name: "Lara K.", meta: "Basel vor 2 Wochen", salonName: "Muse Beauty Studio", salonSlug: "muse-beauty-studio" },
  { stars: 5, text: "Spontan ohne Termin zu Old Town Barbers: Nummer auf dem Handy gezogen, kurz Kaffee geholt und der beste Fade meines Lebens. Die Warteschlangen-Anzeige ist Gold wert.", initials: "MH", name: "Marc H.", meta: "Basel vor 5 Tagen", salonName: "Old Town Barbers", salonSlug: "old-town-barbers" },
  { stars: 5, text: "Habe einen Look auf Inspo gespeichert und konnte direkt buchen, same-day. Die Stylistin hatte das Foto schon offen als ich ankam. Magic.", initials: "SR", name: "Sara R.", meta: "Basel vor 1 Woche", salonName: "Nail Studio Bliss", salonSlug: "nail-studio-bliss" },
  { stars: 5, text: "Endlich kein Telefonieren mehr. Drei Optionen verglichen, eine gebucht, fertig in unter zwei Minuten. So sollte das überall funktionieren.", initials: "AM", name: "Anna M.", meta: "Basel vor 3 Tagen", salonName: "Smooth Skin Studio", salonSlug: "smooth-skin-studio" },
];

function FrozenReviewCard({ review }: { review: FrozenReview }) {
  const locale = useLocale();
  const dateText = review.meta.includes("·") ? (review.meta.split("·").pop() ?? "").trim() : review.meta; // drift-ok: string-literal split/includes logic copied from Reviews.tsx:209, not a rendered separator glyph
  return (
    <div
      className={cn(
        "relative shrink-0 w-[260px] md:w-[280px]",
        "flex flex-col min-h-[220px]",
        "snap-start scroll-snap-align-start",
        "rounded-2xl border bg-s-bg-surface p-4",
        "border-s-border",
        "shadow-elevation-2",
      )}
    >
      <div className="relative mb-3 flex items-center gap-2.5">
        <div
          className="pointer-events-none font-display grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-black text-s-ink-2 bg-s-bg-sunken"
          aria-hidden
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="pointer-events-none font-body text-[14px] font-semibold leading-[1.2] text-s-ink truncate">
            {review.name}
          </div>
          <Link
            href={`/${locale}/salon/${review.salonSlug}`}
            aria-label={`Salon ${review.salonName} ansehen`}
            className={cn(
              "relative z-10 mt-0.5 inline-flex items-center gap-1",
              "font-body text-[12px] font-normal text-s-ink-2",
              "transition-colors duration-150 ease-glide hover:text-s-ink",
            )}
          >
            <Store size={11} strokeWidth={2.25} aria-hidden />
            <span className="truncate max-w-[140px]">{review.salonName}</span>
            <ChevronRight size={11} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>
      <div className="relative pointer-events-none mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-[1px]">
          {Array.from({ length: review.stars }).map((_, i) => (
            <Star key={i} size={12} stroke="none" aria-hidden className="fill-s-star" />
          ))}
        </div>
        <span className="shrink-0 font-body text-[12px] font-normal text-s-ink-3 tabular-nums">
          {dateText}
        </span>
      </div>
      <p className="relative pointer-events-none flex-1 font-body text-[14px] leading-[1.5] text-s-ink line-clamp-3">
        &ldquo;{review.text}&rdquo;
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Finding 3 , BusinessTeaser.tsx: JSX copied verbatim from BusinessTeaser.tsx
// (the whole file, lines 29-87), parameterized ONLY on the one paragraph
// that changes. Everything else (image placeholder, headline, CTA, all
// classes) is byte-identical to the source.
// ─────────────────────────────────────────────────────────────────────────

function TeaserBlock({ paragraph }: { paragraph: string }) {
  return (
    <section aria-label="Solen für Salons" className="mx-auto max-w-[1280px] px-4 py-12 md:px-8 md:py-20">
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:items-center md:gap-12 lg:gap-16">
        <div
          role="img"
          aria-label="Bild-Platzhalter — Solon-Hero wird ersetzt" // em-dash-ok: verbatim copy of BusinessTeaser.tsx:44 aria-label
          className="relative aspect-square w-full overflow-hidden rounded-[16px] md:rounded-[20px] bg-s-bg-sunken grid place-items-center"
        >
          <ImageIcon size={56} strokeWidth={1.25} aria-hidden className="text-s-ink-3" />
        </div>
        <div>
          <p className="font-body text-[13px] font-semibold text-s-ink-3">Für Salons</p>
          <h2
            className="mt-4 font-display font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink"
            style={{ fontSize: "clamp(25px, 4vw, 40px)" }}
          >
            Solen für<br />
            dein Geschäft.
          </h2>
          <p className="mt-5 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
            {paragraph}
          </p>
          <Link
            href="/partner"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-s-ink px-7 py-3.5 font-body text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.10)] transition-all duration-200 ease-glide hover:-translate-y-[1px] hover:bg-black hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] active:scale-[0.97] md:text-[15px]"
          >
            Mehr erfahren
            <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Finding 4 , trust strip: JSX copied verbatim from business/page.tsx:227-245
// (identical block at fuer-salons/page.tsx:247-265). Per the literal task
// instruction the dot separators + the Star icon element stay in the DOM
// unchanged; only the fabricated NUMBER text is removed (see the Note in
// the render below for why). The middle-dot separators below are an exact,
// unedited copy of that already-shipped production markup, not new content;
// LOCKFILE A20 (no middle-dot separator) already applies to the real files
// as its own separately-flagged finding, out of scope for this pass.
// ─────────────────────────────────────────────────────────────────────────

function TrustStripBefore() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center font-body text-[13px] font-medium text-s-ink-2 md:gap-x-10 md:text-[14px]">
      <span>
        <strong className="font-semibold text-s-ink">1&apos;200+</strong>{" "}
        Schweizer Salons
      </span>
      <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
      <span>Basel · Zürich · Bern · Lugano</span> {/* drift-ok: verbatim copy of business/page.tsx:237, A20 separately flagged, out of scope for this fabrication-only pass */}
      <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
      <span className="inline-flex items-center gap-1.5">
        <Star size={12} fill="#FFC32B" stroke="none" aria-hidden />
        <strong className="font-semibold text-s-ink">4.9</strong>
        <span>· 1&apos;200+ Partner</span> {/* drift-ok: verbatim copy of business/page.tsx:242, A20 separately flagged, out of scope for this fabrication-only pass */}
      </span>
    </div>
  );
}

function TrustStripAfter() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center font-body text-[13px] font-medium text-s-ink-2 md:gap-x-10 md:text-[14px]">
      <span>Schweizer Salons</span>
      <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
      <span>Basel · Zürich · Bern · Lugano</span> {/* drift-ok: verbatim copy of business/page.tsx:237, A20 separately flagged, out of scope for this fabrication-only pass */}
      <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
      <span className="inline-flex items-center gap-1.5">
        <Star size={12} fill="#FFC32B" stroke="none" aria-hidden />
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Finding 5 , forYouSalons.ts: real salon (Nail Studio Bliss) + the exact
// priceFromCHF/address values FORYOU_SALONS.nails[0] attaches to it, fed
// into the REAL, unmodified SalonCard. AFTER omits priceFromCHF + address,
// which SalonCard already falls back on gracefully (Row 2 -> category
// label, Row 3 -> no price) , no new fallback logic invented here.
// ─────────────────────────────────────────────────────────────────────────

const FINDING5_SALON = {
  slug: "nail-studio-bliss",
  salonId: "ca037638-362a-491b-ada2-238e20d9d4a9",
  name: "Nail Studio Bliss",
  rating: 4.95,
  category: "nails" as const,
  photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80",
  priceFromCHF: 45,
  address: "Bahnhofstrasse 28",
};

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export default function AuditFixesFabricationPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1100px] px-5 pb-20 pt-8">
        <Link href={`/${locale}/dev/audit-fixes`} className="text-[13px] font-semibold text-s-accent">
          ← Audit fixes index
        </Link>
        <p className="mt-4 text-[12px] font-semibold text-s-ink-3">Solen , 2026-07-08 audit, fabrication findings</p>
        <h1 className="mt-1 font-heading text-[24px] font-bold text-s-ink">
          Five fabricated-data sites, before and after
        </h1>
        <p className="mt-2 max-w-[640px] text-[13.5px] leading-[1.55] text-s-ink-2">
          Owner-review mockup. Each pair shows the real surface exactly as it renders today, then the same
          surface with only the invented number, status, or testimonial removed. Nothing here touches real
          code, page chrome and captions are in English, the copied UI copy stays in its original German.
        </p>

        {/* Finding 1 , Nearby.tsx:130 */}
        <div className="mt-12 border-t border-s-border pt-8">
          <FindingHeader
            n={1}
            title="Nearby carousel: cycling urgency pill"
            source="Nearby.tsx:130"
            law="taste rule 1 + PSYCHOLOGY.md law 9 (no fabricated data)"
          />
          <Note>
            Found while building this mockup: SalonCard.tsx (V3-D181, 2026-05-26) already stopped rendering
            the <code className="font-mono-code text-[12px]">availability</code> prop, the AvailabilityPill
            component still exists in the file but is never called. So the &quot;Nur X heute&quot; badge is
            not currently visible anywhere in production, the live render below (the real, unmodified
            Nearby component) already shows no badge. The fabrication is dead code: resolveAvailability()
            still computes and threads a fabricated value through props on every render, it is just
            silently discarded downstream. The code-level fix the audit asked for still applies (delete the
            computation and the prop), it just has no visible effect since the badge is already hidden.
          </Note>
          <PanelLabel>Before, live render (real, unmodified Nearby component)</PanelLabel>
          <Panel>
            <Nearby prefsOverride={null} />
          </Panel>
          <PanelLabel>After, same visual result, the dead computation is deleted at the source</PanelLabel>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-card border border-s-border bg-s-bg-sunken p-4">
              <p className="mb-2 text-[12px] font-semibold text-s-ink-3">Before, Nearby.tsx:115-135 + :198</p>
              <pre className="overflow-x-auto font-mono-code text-[12px] leading-[1.6] text-s-ink-2">
{`function resolveAvailability(e, idx) {
  if (!e.freeToday) return null;
  const hasMultipleSlots = e.nextSlot.bold.includes(",");
  if (hasMultipleSlots) return null;
  const slotsLeft = (idx % 3) + 1;
  return { state: "urgent", label: \`Nur \${slotsLeft} heute\` };
}
...
availability={resolveAvailability(e, idx)}`}
              </pre>
            </div>
            <div className="rounded-card border border-s-border bg-s-bg-sunken p-4">
              <p className="mb-2 text-[12px] font-semibold text-s-ink-3">After</p>
              <pre className="overflow-x-auto font-mono-code text-[12px] leading-[1.6] text-s-ink-2">
{`// resolveAvailability() deleted entirely
// SalonCard call drops the availability prop`}
              </pre>
            </div>
          </div>
        </div>

        {/* Finding 2 , Reviews.tsx:44 */}
        <div className="mt-12 border-t border-s-border pt-8">
          <FindingHeader
            n={2}
            title="Reviews carousel: invented testimonials"
            source="Reviews.tsx:44, :123, :132"
            law="taste rule 1 + PSYCHOLOGY.md law 9 (no fabricated data)"
          />
          <Note>
            In this dev environment <code className="font-mono-code text-[12px]">/api/reviews/featured</code>{" "}
            currently returns real seeded reviews, so the fallback below is not what a fresh page load shows
            here right now. It is still a real defect: Reviews.tsx:123 initializes state to the fabricated
            REVIEWS array, so it is what paints first on every load before the fetch resolves, and
            Reviews.tsx:132 (&quot;keep fallback&quot;) plus the :165 catch block mean it renders
            permanently whenever the query returns 0 rows or the fetch fails, for example a new market
            before reviews exist, or a salon whose reviews were all moderated out.
          </Note>
          <PanelLabel>Before, the fabricated REVIEWS array (Reviews.tsx:44-117), frozen for this mockup</PanelLabel>
          <Panel>
            <Section>
              <SectionFrame>
                <SectionTitle title="Bewertungen" link={{ label: "Alle Bewertungen →", href: `/${locale}/reviews` }} />
                <ScrollRow>
                  {FROZEN_REVIEWS.map((r, i) => (
                    <FrozenReviewCard key={`${r.salonSlug}-${i}`} review={r} />
                  ))}
                </ScrollRow>
              </SectionFrame>
            </Section>
          </Panel>
          <PanelLabel>After, real EmptyState primitive instead of invented testimonials</PanelLabel>
          <Panel>
            <Section>
              <SectionFrame>
                <SectionTitle title="Bewertungen" link={{ label: "Alle Bewertungen →", href: `/${locale}/reviews` }} />
                <EmptyState icon={Star} title="Noch keine Bewertungen" />
              </SectionFrame>
            </Section>
          </Panel>
        </div>

        {/* Finding 3 , BusinessTeaser.tsx:73 */}
        <div className="mt-12 border-t border-s-border pt-8">
          <FindingHeader
            n={3}
            title="Business teaser: hardcoded salon count"
            source="BusinessTeaser.tsx:73"
            law="taste rule 1 + PSYCHOLOGY.md law 9 (no fabricated data)"
          />
          <PanelLabel>Before</PanelLabel>
          <Panel>
            <TeaserBlock paragraph="Mehr Buchungen, weniger Aufwand. Über 1'200 Schweizer Salons sind schon dabei." />
          </Panel>
          <PanelLabel>After, same sentence, qualitative, no invented number</PanelLabel>
          <Panel>
            <TeaserBlock paragraph="Mehr Buchungen, weniger Aufwand. Schweizer Salons vertrauen bereits auf Solen." />
          </Panel>
        </div>

        {/* Finding 4 , trust strip */}
        <div className="mt-12 border-t border-s-border pt-8">
          <FindingHeader
            n={4}
            title="Trust strip: fabricated counts + rating"
            source="business/page.tsx:233-243, fuer-salons/page.tsx:250-263"
            law="taste rule 1 + PSYCHOLOGY.md law 9 (no fabricated data)"
          />
          <Note>
            Per the task instruction this pass is fabrication-only: the dot separators and the Star icon
            element stay in the DOM below unchanged, they carry their own separately-flagged
            decorative-element finding that is out of scope here. Only the fabricated number text (the two
            &quot;1&apos;200+&quot; counts and the &quot;4.9&quot; rating) is removed. The resulting bare
            &quot;Schweizer Salons&quot; label and lone star may read oddly on their own, tightening that
            is a separate follow-up decision for the owner, not applied in this mockup.
          </Note>
          <PanelLabel>Before</PanelLabel>
          <Panel>
            <section aria-label="Vertrauenssignale" className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
              <TrustStripBefore />
            </section>
          </Panel>
          <PanelLabel>After, cities remain (true), fabricated counts and rating removed</PanelLabel>
          <Panel>
            <section aria-label="Vertrauenssignale" className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
              <TrustStripAfter />
            </section>
          </Panel>
        </div>

        {/* Finding 5 , forYouSalons.ts:39 */}
        <div className="mt-12 border-t border-s-border pt-8">
          <FindingHeader
            n={5}
            title="Salon card: invented address + price"
            source="forYouSalons.ts:39 (same pattern in Nearby.tsx NEARBY_ADDRESSES)"
            law="taste rule 1 + PSYCHOLOGY.md law 9 (no fabricated data)"
          />
          <PanelLabel>Before, real SalonCard with the hand-authored address + price</PanelLabel>
          <Panel>
            <div className="flex flex-wrap gap-6">
              <SalonCard
                slug={FINDING5_SALON.slug}
                salonId={FINDING5_SALON.salonId}
                name={FINDING5_SALON.name}
                rating={FINDING5_SALON.rating}
                category={FINDING5_SALON.category}
                photoUrl={FINDING5_SALON.photoUrl}
                variant="service"
                priceFromCHF={FINDING5_SALON.priceFromCHF}
                address={FINDING5_SALON.address}
                city="Basel"
              />
            </div>
          </Panel>
          <PanelLabel>After, same real SalonCard, address + price slots omitted (SalonCard's own existing fallback)</PanelLabel>
          <Panel>
            <div className="flex flex-wrap gap-6">
              <SalonCard
                slug={FINDING5_SALON.slug}
                salonId={FINDING5_SALON.salonId}
                name={FINDING5_SALON.name}
                rating={FINDING5_SALON.rating}
                category={FINDING5_SALON.category}
                photoUrl={FINDING5_SALON.photoUrl}
                variant="service"
              />
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
