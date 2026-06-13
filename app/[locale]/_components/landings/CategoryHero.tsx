import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CATEGORY_PHOTOS, type Category } from "@/lib/category-photos";

/**
 * CategoryHero — V3-D340 (W11, 2026-05-28)
 *
 * Editorial split-hero for the 6 category landing routes:
 *   /coiffeur · /barbershop · /nails · /spa
 *
 * Pattern: LOCKFILE §11 Pattern 1 ("Split-hero" — Text LEFT, photo RIGHT, no overlay).
 *
 * Why Pattern 1 (not Pattern 2 full-bleed editorial):
 *   §11 Pattern 2 requires art-directed photos with empty negative space for text legibility.
 *   T6 photo strategy doc is DEFERRED — tonight uses Unsplash placeholders which cannot
 *   guarantee an art-directed empty zone. Pattern 1 survives any photo (text on its own
 *   surface, no scrim). Pattern 2 is the right end-state once real photos arrive.
 *
 * Universal-components rule (V3-D205): single component renders correctly for ALL 6
 * categories via props + lookup tables. NO `if category === 'X'` branches.
 *
 * Non-negotiables per §11:
 *   - aspect-[3/2] on the photo (canonical set)
 *   - rounded-none on the img (0 border-radius)
 *   - no rgba scrim, no gradient overlay
 *
 * Structure decision (per §10.5 dual-axis conflict resolution):
 *   Fresha has NO equivalent /coiffeur landing route. STRUCTURE source = Solen precedent
 *   (the 6 routes already exist with shape SearchTemplate + above/below grids). This hero
 *   is ADDED ABOVE SearchTemplate. No structural change to existing routes.
 *
 * i18n (per V3-D339 i18n REVERSED rule — full DE/EN/FR/IT in same wave):
 *   Reads `categoryHero.<category>.title` + `.subtitle` from messages/{de,en,fr,it}.json.
 *   Reuses the existing `categoryHero` namespace (legacy keys `label` + `titleSuffix`
 *   preserved for potential future use; `title` is NEW, `subtitle` is refreshed to
 *   Switzerland-national scope instead of the legacy Basel-only copy).
 */
export default async function CategoryHero({ category, locale }: { category: Category; locale: string }) {
  // V3-D343 (W17 polish): explicit locale prop per next-intl server pattern. Without
  // this, getTranslations() falls back to defaultLocale (DE) on /en, /fr, /it routes
  // because request-locale resolution doesn't bubble into nested server components reliably.
  const t = await getTranslations({ locale, namespace: `categoryHero.${category}` });
  const photoUrl = CATEGORY_PHOTOS[category];

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-14">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          {/* Text LEFT */}
          <div>
            <h1 className="font-heading text-[clamp(32px,5vw,52px)] font-semibold leading-[1.05] tracking-[-0.02em] text-s-ink">
              {t("title")}
            </h1>
            <p className="mt-3 text-[clamp(15px,1.5vw,18px)] leading-[1.5] text-s-ink-2 max-w-md">
              {t("subtitle")}
            </p>
          </div>
          {/* Photo RIGHT — Pattern 1: aspect-[3/2], rounded-none per §11 non-negotiable, no overlay */}
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <Image
              src={photoUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
