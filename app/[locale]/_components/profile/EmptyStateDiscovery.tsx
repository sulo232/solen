import Link from "next/link";
import { Heart, Stamp, Bookmark, ChevronRight, Star } from "lucide-react";

/**
 * EmptyStateDiscovery — Layer 1 chrome + Layer 3 hint (mockup 19 v3 Option B,
 * owner-picked 2026-06-11). The full-height profile empty state: message top,
 * discovery banner + hint row middle, REAL salon rail bottom — replaces the
 * centered minimal empties that read unbalanced/empty ("I can see the footer").
 *
 * Server component (no hooks). The rail expects REAL salons from the caller's
 * query — never demo data (no-fabricated-data rule).
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
  title,
  lead,
  bannerImg,
  bannerTitle,
  bannerSub,
  bannerHref,
  hintIcon,
  hintText,
  railTitle,
  railHref,
  salons,
}: {
  locale: string;
  title: string;
  lead: string;
  /** Real image URL (e.g. the top salon's cover photo) — never a stock placeholder. */
  bannerImg: string | null;
  bannerTitle: string;
  bannerSub: string;
  bannerHref: string;
  hintIcon: keyof typeof HINT_ICONS;
  hintText: string;
  railTitle: string;
  railHref: string;
  salons: EmptyRailSalon[];
}) {
  const HintIcon = HINT_ICONS[hintIcon];

  return (
    <div className="flex min-h-[70vh] flex-col">
      <h2 className="font-heading text-[22px] font-bold tracking-[-0.01em] text-s-ink">
        {title}
      </h2>
      <p className="mt-1.5 font-body text-[14px] leading-[1.55] text-s-ink-2">{lead}</p>

      {/* Discovery banner — DS-10 scrim, top stays clean */}
      <Link
        href={bannerHref}
        className="relative mt-[18px] block h-[220px] shrink-0 overflow-hidden rounded-[18px] bg-s-bg-sunken"
      >
        {bannerImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerImg} alt="" className="h-full w-full object-cover" />
        )}
        <span
          className="absolute inset-0 flex flex-col justify-end p-4"
          style={{ background: "linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.62))" }}
        >
          <b className="font-heading text-[18px] font-bold text-white">{bannerTitle}</b>
          <span className="mt-0.5 font-body text-[13px] text-white/85">{bannerSub}</span>
        </span>
      </Link>

      {/* Hint row */}
      <div className="mt-3.5 flex shrink-0 items-center gap-2.5 rounded-[14px] bg-s-bg-sunken px-3.5 py-3">
        <span className="animate-breathe grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
          {/* Heart hint keeps the universal saved color #FF3366 (V3-D103); others ink */}
          <HintIcon
            size={18}
            strokeWidth={1.9}
            className={hintIcon === "heart" ? "text-[#FF3366]" : "text-s-ink"}
          />
        </span>
        <p className="font-body text-[12.5px] leading-[1.5] text-s-ink-2">{hintText}</p>
      </div>

      {/* Real-salon rail anchored low */}
      <div className="mt-auto flex items-center justify-between pt-5">
        <h3 className="font-heading text-[17px] font-semibold tracking-[-0.01em] text-s-ink">
          {railTitle}
        </h3>
        <Link
          href={railHref}
          className="inline-flex items-center gap-0.5 font-body text-[13.5px] font-semibold text-s-ink transition-colors hover:text-s-ink-2"
        >
          Alle
          <ChevronRight size={14} strokeWidth={1.6} aria-hidden />
        </Link>
      </div>
      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {salons.map((s) => (
          <Link key={s.slug} href={`/${locale}/salon/${s.slug}`} className="w-[210px] shrink-0">
            <span className="block h-[160px] overflow-hidden rounded-[16px] bg-s-bg-sunken">
              {s.cover_photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover_photo_url} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <span className="mt-2 block font-heading text-[14.5px] font-semibold text-s-ink">
              {s.name}
            </span>
            <span className="mt-0.5 flex items-center gap-1 font-body text-[12.5px] text-s-ink-2">
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
