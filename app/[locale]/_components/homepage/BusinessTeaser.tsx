import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";

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
 *   - Headline 28-32px font-bold, 2 lines
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
  return (
    <section
      aria-label="Solen für Salons"
      // 2026-08-01 (home-v3 mockup, public/_mockups/home-v3/search-a.html): the mockup's home
      // state has no "Solen für dein Geschäft" section. Hidden below md; desktop keeps it
      // (component not deleted, only the mobile render).
      className="mx-auto hidden max-w-[1280px] px-4 py-12 md:block md:px-8 md:py-20"
    >
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:items-center md:gap-12 lg:gap-16">
        {/* V3-D166 (2026-05-26): real illustration removed per user —
            placeholder while a replacement is in flight. Source file
            kept at `public/illustrations/business/business-hero-square.png`
            for revert; restore by swapping this block back to the
            previous `<Image src=...>` and re-adding `import Image from
            "next/image"` at top. */}
        <div
          role="img"
          aria-label="Bild-Platzhalter — Solon-Hero wird ersetzt"
          className="relative aspect-square w-full overflow-hidden rounded-[16px] md:rounded-[20px] bg-s-bg-sunken grid place-items-center"
        >
          <ImageIcon
            size={56}
            strokeWidth={1.25}
            aria-hidden
            className="text-s-ink-2"
          />
        </div>

        {/* Text block — headline + sub + CTA stacked. On desktop, sits in the
            right grid cell, vertically centered with the image. */}
        <div>
          <p className="font-body text-[13px] font-semibold text-s-ink-2">
            Für Salons
          </p>
          {/* V3-D193 (2026-05-26): Page H2 weight 900 → 800 per "too bold" sweep.
              Tracking widened -0.035 → -0.03em. V3-D190 size kept. */}
          <h2
            className="mt-4 font-display font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink"
            style={{ fontSize: "clamp(25px, 4vw, 40px)" }}
          >
            Solen für<br />
            dein Geschäft.
          </h2>
          {/* V3-D220 (2026-05-26, /business rebuild): dropped md:text-[17px] step (out of Scale B).
              Use clamp(14,3.5vw,16) hero-sub spec from SOURCE.md §3. */}
          <p className="mt-5 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
            Mehr Buchungen, weniger Aufwand, für dein Salon-Team.
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
