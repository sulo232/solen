"use client";

// exists-check: net-new vs lib/stock-photos.ts (server-only Unsplash/Pexels/Pixabay SEARCH
// client, reads API keys, cannot be imported client-side), components-legacy/ui/SalonBadge.tsx
// (a customer-facing discount/status pill on a SalonCard, shipped copy), and
// components-legacy/ui/ImageFallback.tsx (the A3 colour-block card cover, not a photo
// wrapper). Nothing in the repo marks a rendered image as stock-vs-real; `npm run exists
// stock` and `npm run exists placeholder` both return zero detection utilities. Sits beside
// WelcomeToast in _components/primitives/ because that is where the other layout-level
// zero-render mounts already live.

import { useEffect } from "react";
import { isStockImageUrl, stockImageProvider } from "@/lib/stock-image";

/**
 * StockPhotoMarker , DEV/PREVIEW ONLY. Stamps a corner badge on every image that
 * comes from a stock host, so a preview can never be mistaken for real salon content.
 *
 * Owner, 2026-07-27 (verbatim): "for pics we use unsplash like stoco pics for previews
 * cz we are not live yet but we need to be easy to acc distinguish cx u keep forgetting"
 *
 * WHY A DOM SCANNER AND NOT A SHARED <Image> WRAPPER. Salon imagery renders from ~20
 * different components (SalonHero, SalonPortfolio, SearchOverlay, MapSalonDetail,
 * SalonVenuesNearby, the profile surfaces, the dashboard galleries...) and there is no
 * single image primitive they all pass through , ImageFallback is the colour-block
 * cover, not a photo wrapper. Threading a prop through twenty call sites would be a
 * large diff on production components to serve a dev-only affordance, and it would go
 * stale the moment a twenty-first component is added. A MutationObserver over the
 * rendered DOM catches every image regardless of which component drew it, including
 * next/image's generated <img> and any future one, and touches no production component.
 *
 * SHIPS NOTHING IN REAL PRODUCTION, but it MUST still fire in a preview build. The caller
 * decides, via the `enabled` prop, because a client component cannot read the one env var
 * that actually distinguishes the two. NODE_ENV alone is WRONG here and the council caught
 * it: Next's own CLI sets NODE_ENV=production for `next build` AND `next start`, netlify.toml
 * builds with a bare `npm run build`, and this project's stable phone-preview workflow IS
 * `next build + next start` , precisely the case this component exists to serve. Gating on
 * NODE_ENV would have made it dead in the only scenario it was built for. lib/health.ts:92
 * and lib/ratelimit.ts:266 already use the correct `CONTEXT === "production" && NODE_ENV ===
 * "production"` double-check for exactly this reason; the layout now applies the same test
 * server-side and passes the answer down. Since it renders nothing in real production, there
 * is no customer-visible appearance for a mockup to approve, hence `mockup-ok`.
 *
 * SELF-DISARMING. The badge stops appearing per-image as soon as that image comes from
 * Supabase Storage instead of a stock host, so it fades out on its own as real salon
 * photography lands rather than needing a cleanup commit.
 *
 * NOT A FOCUS TREATMENT. The dashed edge is drawn on a ::before pseudo-element of the
 * wrapper, never as an `outline` on a control, and it is keyed to the image's SOURCE,
 * not to focus or selection. The owner's no-ring rule is about focus and selected
 * states on interactive controls; this is a build-time debug marker.
 */
export default function StockPhotoMarker({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const ATTR = "data-stock-marked";
    const WRAP = "data-stock-wrap";

    const style = document.createElement("style");
    style.id = "solen-stock-marker-style";
    style.textContent = `
      [${WRAP}] { position: relative; }
      [${WRAP}]::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 39;
        border: 2px dashed #EA580C; /* drift-ok mockup-ok: dev-only debug marker, NODE_ENV-stripped in prod; surcharge orange is the one hue reserved for "not part of the layout" */
        border-radius: inherit;
        pointer-events: none;
      }
      [${WRAP}]::after {
        content: attr(${WRAP});
        position: absolute;
        top: 6px;
        left: 6px;
        z-index: 40;
        padding: 3px 7px;
        border-radius: 6px;
        background: #0A0A0A;
        color: #FFFFFF;
        font-family: ui-monospace, "JetBrains Mono", monospace;
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.02em;
        pointer-events: none;
        box-shadow: 0 1px 3px rgba(0,0,0,0.35);
      }
    `;
    document.head.appendChild(style);

    /** Mark one <img> and label its nearest positioned-able ancestor. */
    function mark(img: HTMLImageElement) {
      if (img.getAttribute(ATTR)) return;
      const src = img.currentSrc || img.src || img.getAttribute("src") || "";
      if (!isStockImageUrl(src)) return;
      img.setAttribute(ATTR, "1");
      // The badge sits on the parent because ::after on a replaced element (<img>)
      // is not rendered by any browser.
      const host = img.parentElement;
      if (host && !host.getAttribute(WRAP)) {
        // i18n-ok , a dev-only debug badge, never shipped copy
        host.setAttribute(WRAP, (stockImageProvider(src) ?? "Stock").toUpperCase());
      }
    }

    function scan(root: ParentNode) {
      root.querySelectorAll?.("img").forEach((el) => mark(el as HTMLImageElement));
    }

    scan(document);

    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes" && r.target instanceof HTMLImageElement) {
          // Clear the PARENT's label too, not just the img's own marker. mark() only ever
          // ADDS a label, so a gallery that swaps src in place (lightbox next-photo) would
          // keep showing UNSPLASH after moving to a real photo, or keep the wrong provider
          // name. Contradicted this component's own "self-disarming" claim. (council, 2026-07-27)
          r.target.parentElement?.removeAttribute(WRAP);
          r.target.removeAttribute(ATTR);
          mark(r.target);
          continue;
        }
        r.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement) mark(n);
          else if (n instanceof HTMLElement) scan(n);
        });
      }
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });

    return () => {
      obs.disconnect();
      style.remove();
      document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.removeAttribute(ATTR));
      document.querySelectorAll(`[${WRAP}]`).forEach((el) => el.removeAttribute(WRAP));
    };
  }, [enabled]);

  return null;
}
