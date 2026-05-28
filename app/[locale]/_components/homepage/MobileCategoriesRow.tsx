import Image from "next/image";
import Link from "next/link";

/**
 * MobileCategoriesRow — V3-D113 (2026-05-23).
 *
 * Uber-style 3-col tile grid of categories. Sits between Hero and FeedZone,
 * MOBILE-ONLY (md:hidden) — desktop already has the Services dropdown in
 * the header, mobile collapses categories behind the hamburger.
 *
 * Spec source: `_audits/screenshots/uber-explore-grid-spec.md`
 *   Reference: `public/_screenshot-spec/uber-explore-grid/source.png`
 *   Method: pixel-spec-auto (custom grid scanner; PIL color-transition).
 *   Measured: tile aspect 1.15:1, h-gap 3%, v-gap 4%, side padding 6%,
 *   tile bg #F3F3F3, label inside tile bottom-band.
 *
 * Launch scope (per user, 2026-05-23): only coiffeur + barber + nails.
 * Spa / makeup / waxing routes still exist in the backend (sitemap, salon
 * detail i18n, /waxing route, etc.) but are NOT promoted on the homepage
 * surface for launch. Re-add to this array when scope expands.
 *
 * Icons: user-supplied 3D rendered PNGs at `public/icons/categories/`.
 *  - scissors.png (orange-handled scissors)  → coiffeur
 *  - clippers.png (black hair clippers)      → barber
 *  - nails.png    (peach nail-polish bottle) → nails
 *
 * Color discipline per `_rules/solen-color-60-30-10.md`:
 *  - Tile bg: `#F3F3F3` (per Uber spec, neutral light grey) — does NOT
 *    spend the brand-green CTA budget. Could token-ize to a Solen neutral
 *    later; literal hex for now to match the Uber pattern exactly.
 *  - Label: `text-s-ink` (no green on small accents).
 */

interface Category {
  slug: string;
  label: string;
  /** Path under /public — next/image src */
  icon: string;
  /** Optional override when the source PNG has extra transparent padding.
   *  Default sizing is `w-[60%] max-w-[64px]`. Bump for icons whose subject
   *  fills less of the canvas (e.g. walk-in shoe, map pin). */
  iconClass?: string;
}

// V3-D152 (2026-05-25): Walk-in tile added per user. 4-tile row.
// V3-D153 (2026-05-25): Map ("Karte") tile added as 5th.
// V3-D154 (2026-05-25): Spa tile added as 6th → switched back to 3×2 grid
// (was horizontal-scroll between V3-D152 and V3-D153). Six tiles all
// visible on first paint; no swipe needed.
const CATEGORIES: Category[] = [
  { slug: "coiffeur",   label: "Coiffeur", icon: "/icons/categories/scissors.png" },
  { slug: "barbershop", label: "Barber",   icon: "/icons/categories/clippers.png" },
  { slug: "nails",      label: "Nails",    icon: "/icons/categories/nails.png" },
  { slug: "map",        label: "Karte",    icon: "/icons/categories/map.png" },
  { slug: "walk-in",    label: "Walk-in",  icon: "/icons/categories/walkin.png" },
  { slug: "spa",        label: "Spa",      icon: "/icons/categories/spa.png" },
];

export default function MobileCategoriesRow() {
  return (
    <section
      aria-label="Kategorien"
      // V3-D132 (2026-05-25): mb-4 → mb-2 + py-3 → py-2 per global section
      // gap shrink (Airbnb match).
      className="relative z-[1] mb-2 md:hidden"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-2">
        {/* Header — same h2 pattern as SectionTitle but lighter (no inline arrow
            since the row is self-explanatory + cats only have 3 entries) */}
        {/* V3-D193 (2026-05-26): "Für dich" weight 800 → 700 per "too bold" sweep. */}
        {/* V3-D326 (2026-05-27): "Für dich" is a SECTION H2 (not subsection H3).
            Bump 16-18 (subsection) → 18-20 (Section H2 per LOCKFILE §2). */}
        <h2 className="mb-3 font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
          Für dich
        </h2>

        {/* 3×2 grid (V3-D154 reverted from horizontal-scroll back to grid when
            Spa was added as 6th tile — clean 3×2, no swipe needed, all six
            visible on first paint).
              gap-x-3 = 12px ≈ 3% of 393px viewport (uber-explore-grid spec)
              gap-y-4 = 16px ≈ 4% of viewport (uber-explore-grid spec)
              aspect 1.15:1 — basically square, slight landscape lean */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {CATEGORIES.map(({ slug, label, icon, iconClass }) => (
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
                {/* Illustration zone — takes most of the tile height */}
                <div className="relative grid w-full flex-1 place-items-center">
                  <Image
                    src={icon}
                    alt=""
                    width={64}
                    height={64}
                    className={`h-auto object-contain ${iconClass ?? "w-[60%] max-w-[64px]"}`}
                  />
                </div>
                {/* Label band at bottom (spec said label sits inside tile
                    bottom-third, not below it) */}
                {/* V3-D192 (2026-05-26): tile label weight 700→500 per user
                    "tiles still too heavy." Matches new Hanken-300 body rhythm. */}
                <span className="font-body text-[13px] font-medium leading-tight text-s-ink">
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
