import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * BusinessTeaser — V3-D220 (2026-05-26, /business rebuild). Originally V3-D149 (2026-05-25).
 *
 * Uber image-above-text pattern (measured from user-supplied Uber mobile ref
 * at public/_screenshot-spec/uber-business-layout/IMG_4666.png):
 *   - Image: square 1:1, full width on mobile, ~50% width on desktop
 *   - Mobile: image top + text below (stacked)
 *   - Desktop: image LEFT + text RIGHT (side-by-side)
 *
 * Image source: public/illustrations/business/business-hero-square.png
 *   (1038x1050 ≈ 1:1, the user-finalized salon illustration)
 *
 * Spec measurements from Uber ref:
 *   - Image to headline gap: 88px
 *   - Headline 28-32px font-semibold, 2 lines
 *   - Headline to sub gap: 24px
 *   - Sub 16-18px, 2-3 lines
 *   - Sub to CTA gap: 35px
 *   - CTA: 48px height, dark filled pill
 *
 * Replaces the V3-D148 full-bleed-with-overlay variant (Variant C-no-shadow).
 * User picked Uber's image-above-text pattern over the overlay pattern after
 * seeing the new square illustration alongside the Uber refs.
 */

export default function BusinessTeaser() {
  // 2026-08-15: this label was a hardcoded German literal, so it rendered German on /en,
  // /fr and /it. Same bug class the owner caught on the recently-viewed row that day.
  const t = useTranslations("home.partner");
  return (
    <section
      aria-label={t("forSalons")}
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-8 md:py-20"
    >
      <div className="mx-auto max-w-[620px] text-center">
      {/* THE PLACEHOLDER IS DELETED. Owner picked stop 2 on /dev/mock/versions/business-teaser,
          2026-08-14, after "i never want this anywhere".
          History, because an empty grey square does not sit on a home page by accident: he removed
          the real illustration on 2026-05-26 (V3-D166) and the code left a placeholder "while a
          replacement is in flight". It never came, and nothing tracked it, so the temporary state
          became the design for two and a half months. Measured before deleting: the section stood
          723pt tall on a 402pt phone and 325pt without the box, so more than half of it was empty.
          NOT replaced with another picture on purpose: a decorative image baked into a component is
          refused by the imagery floor and by the no-decorative-image gate, which say this slot is
          real salon content or nothing. Old files remain at public/illustrations/business/. */}

        {/* Text block — headline + sub + CTA stacked. On desktop, sits in the
            right grid cell, vertically centered with the image. */}
        <div>
          {/* mockup-ok: owner decision 5A (2026-08-09) , the section eyebrow stays,
              at the SAME size as the small grey text on a salon card. Measured on
              the live homepage: card meta = 12px, this eyebrow was 13px. */}
          <p className="font-body text-[12px] font-semibold text-s-ink-2">
            {t("eyebrow")}
          </p>
          {/* V3-D193 (2026-05-26): Page H2 weight 900 → 800 per "too bold" sweep.
              Tracking widened -0.035 → -0.03em. V3-D190 size kept. */}
          <h2
            className="mt-4 font-display font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink"
            style={{ fontSize: "clamp(25px, 4vw, 40px)" }}
          >
            {t("headlineLine1")}<br />
            {t("headlineLine2")}
          </h2>
          {/* V3-D220 (2026-05-26, /business rebuild): dropped md:text-[17px] step (out of Scale B).
              Use clamp(14,3.5vw,16) hero-sub spec from SOURCE.md §3. */}
          <p className="mt-5 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
            {t("teaserSub")}
          </p>
          <Link
            href="/partner"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-s-ink px-7 py-3.5 font-body text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.10)] transition-all duration-200 ease-glide hover:-translate-y-[1px] hover:bg-black hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] active:scale-[0.97] active:duration-[80ms] md:text-[15px]"
          >
            {t("learnMore")}
            <ArrowRight size={16} strokeWidth={1.9} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
