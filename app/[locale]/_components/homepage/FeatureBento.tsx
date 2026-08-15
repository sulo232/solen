import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * FeatureBento — V3-D124 (2026-05-24).
 *
 * 2×2 bento grid of Solen's 4 user-facing app features. Same tile vocabulary
 * as MobileCategoriesRow (Für dich) so the page reads as one visual family:
 * rounded-3xl tiles, bg #F3F3F3, illustration centered, label inside bottom-band.
 *
 * Illustrations: user-generated flat-editorial PNGs (fakejolart style)
 * at public/illustrations/features/. Each ~1024px square, transparent bg.
 *  - walk-in.png    → Walk-in jetzt (live barbershop chair availability)
 *  - loyalty.png    → Treuekarte (loyalty stamp card)
 *  - chat.png       → Direkt-Chat (in-app message with salon)
 *  - reschedule.png → Verschieben (1-tap reschedule)
 *
 * Mobile-only for now (md:hidden) — matches MobileCategoriesRow placement
 * pattern. Desktop equivalent can be added later (3-column or 4-column
 * row beneath the hero search).
 */

interface Feature {
  slug: string;
  label: string;
  /** Path under /public — next/image src */
  image: string;
  /** Route the tile links to (Phase-2 wiring; placeholder for now) */
  href: string;
}

const FEATURES: Feature[] = [
  { slug: "walk-in",    label: "Walk-in",    image: "/illustrations/features/walk-in.png",    href: "/de/walk-in" },
  { slug: "loyalty",    label: "Treuekarte", image: "/illustrations/features/loyalty.png",    href: "/de/treue" },
  { slug: "chat",       label: "Chat",       image: "/illustrations/features/chat.png",       href: "/de/chat" },
  { slug: "reschedule", label: "Verschieben",image: "/illustrations/features/reschedule.png", href: "/de/buchungen" },
];

export default function FeatureBento() {
  // 2026-08-15 i18n sweep: these were hardcoded German literals, so they rendered German
  // on /en, /fr and /it. Same class the owner caught on the recently-viewed row.
  const t = useTranslations("home.sections");
  return (
    <section
      aria-label={t("whatYouCanLong")}
      className="relative z-[1] mb-4 md:hidden"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-3">
        <h2 className="mb-3 font-body text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.025em] text-s-ink">
          {t("whatYouCan")}
        </h2>

        {/* 2×2 grid — same tile vocabulary as MobileCategoriesRow */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {FEATURES.map(({ slug, label, image }) => (
            <Link
              key={slug}
              href={`/de/${slug}`}
              aria-label={label}
              className="group focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-4 focus-visible:rounded-3xl"
            >
              <div
                className="
                  flex aspect-[1.15/1] flex-col items-center justify-between
                  rounded-3xl bg-[#F3F3F3] p-3
                  transition-transform duration-200 ease-glide
                  group-hover:-translate-y-[2px] group-hover:bg-[#EFEFEF]
                  group-active:scale-[0.97] group-active:duration-[80ms]
                "
              >
                {/* Illustration zone — takes most of the tile height.
                    Bigger than category icons (90% vs 60%) since these
                    are character/scene illustrations, not single objects. */}
                <div className="relative grid w-full flex-1 place-items-center">
                  <Image
                    src={image}
                    alt=""
                    width={140}
                    height={140}
                    className="h-auto w-[80%] max-w-[140px] object-contain"
                  />
                </div>
                {/* Label band at bottom — matches Für dich pattern */}
                <span className="font-body text-[13px] font-semibold leading-tight text-s-ink">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
