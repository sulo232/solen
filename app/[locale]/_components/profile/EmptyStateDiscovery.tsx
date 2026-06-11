import Link from "next/link";
import { Heart, Stamp, Bookmark, ChevronRight, Star } from "lucide-react";
import { FROST_GLASS } from "@/lib/frost-glass";

/**
 * EmptyStateDiscovery — Layer 1 chrome + Layer 3 hint icon (mockup 19 Option B,
 * council-balanced v2, 2026-06-11).
 *
 * Council recipe (Opus, confirmed by Grok) after the owner's "not balanced":
 * ONE heading per page (the page H1 owns it — this component renders NO title),
 * the hint copy merges into the lead, the banner is promoted to a true HERO
 * (~330px, eyebrow + 20px headline in the scrim, frosted icon button in-situ
 * teaching the gesture), and the gap rhythm is binary: 16px = belongs together,
 * 32px = new chapter. Rail "Alle" stays INK + chevron (1.5 v3 lock; the council's
 * blue suggestion is overridden by the lock).
 *
 * Server component. `salons` = REAL rows from the caller's query, never demo data.
 */

export interface EmptyRailSalon {
  slug: string;
  name: string;
  cover_photo_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  quartier: string | null;
}

const HINT_ICONS = {
  heart: Heart,
  stamp: Stamp,
  bookmark: Bookmark,
} as const;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function EmptyStateDiscovery({
  locale,
  lead,
  heroImg,
  heroEyebrow,
  heroTitle,
  heroHref,
  hintIcon,
  railTitle,
  railHref,
  salons,
}: {
  locale: string;
  /** ONE paragraph, max ~2 lines: the empty message + the gesture hint merged. */
  lead: string;
  /** Real image URL (e.g. the top salon's cover photo) — never a stock placeholder. */
  heroImg: string | null;
  /** Normal-case 13px label inside the scrim (NOT a tracked eyebrow). */
  heroEyebrow: string;
  heroTitle: string;
  heroHref: string;
  /** Icon shown as the frosted in-situ button on the hero photo. */
  hintIcon: keyof typeof HINT_ICONS;
  railTitle: string;
  railHref: string;
  salons: EmptyRailSalon[];
}) {
  const HintIcon = HINT_ICONS[hintIcon];

  return (
    <div>
      {/* 16px under the page H1: lead carries the empty message + gesture hint */}
      <p className="mt-4 max-w-[300px] font-body text-[14px] leading-[1.55] text-s-ink-2">
        {lead}
      </p>

      {/* CHAPTER BREAK 32px → HERO (the one focal element, ~39% of the viewport) */}
      <Link
        href={heroHref}
        className="relative mt-8 block h-[330px] overflow-hidden rounded-card bg-s-bg-sunken"
      >
        {heroImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
        )}
        {/* In-situ gesture lesson: the frosted icon button exactly where it lives on salon cards */}
        <span
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full"
          style={FROST_GLASS}
        >
          <HintIcon
            size={18}
            strokeWidth={1.9}
            className={hintIcon === "heart" ? "text-[#FF3366]" : "text-s-ink"}
          />
        </span>
        <span
          className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5 pt-16"
          style={{ background: "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.72) 100%)" }}
        >
          <span className="font-body text-[13px] font-semibold text-white/85">{heroEyebrow}</span>
          <b className="mt-0.5 font-heading text-[20px] font-bold leading-[1.15] text-white">
            {heroTitle}
          </b>
        </span>
      </Link>

      {/* CHAPTER BREAK 32px → supporting rail */}
      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-heading text-[14px] font-semibold text-s-ink">{railTitle}</h3>
        <Link
          href={railHref}
          className="inline-flex items-center gap-0.5 font-body text-[13.5px] font-semibold text-s-ink transition-colors hover:text-s-ink-2"
        >
          Alle
          <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {salons.map((s) => (
          <Link key={s.slug} href={`/${locale}/salon/${s.slug}`} className="w-[210px] shrink-0">
            <span className="block h-[140px] overflow-hidden rounded-[16px] bg-s-bg-sunken">
              {s.cover_photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover_photo_url} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <span className="mt-2 block font-heading text-[14px] font-semibold text-s-ink">
              {s.name}
            </span>
            <span className="mt-0.5 flex items-center gap-1 font-body text-[12px] text-s-ink-2">
              <Star size={12} className="fill-s-star text-s-star" aria-hidden />
              {s.average_rating != null && (
                <b className="font-semibold tabular-nums text-s-ink">{s.average_rating.toFixed(1)}</b>
              )}
              {s.review_count != null && s.review_count > 0 && (
                <span className="tabular-nums text-s-accent">({s.review_count})</span>
              )}
              {s.quartier && <span>· {capitalize(s.quartier)}</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
