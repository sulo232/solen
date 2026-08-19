"use client";

import * as React from "react";
import { ExternalLink, Globe, Instagram, Phone } from "lucide-react";
import type { SalonDetail } from "./_shared";
import { useTranslations } from "next-intl";

/**
 * SalonContact — V2-D53.3 fix (2026-05-11) for mobile-vs-desktop info parity.
 *
 * Desktop has phone/website/Instagram in the sticky sidebar. Mobile had
 * NO equivalent — these contact links never rendered on small viewports.
 *
 * This component lives in the main content column and renders ONLY on
 * mobile (`md:hidden`). On desktop the same info is in SalonSidebar.
 *
 * Conditional render: returns null if salon has none of phone/website/IG.
 * Same render logic as the sidebar contact rows — single source of truth
 * on which links exist.
 */
export function SalonContact({ salon }: { salon: SalonDetail }) {
  const t = useTranslations("salonDetail");
  const hasAny = Boolean(salon.phone || salon.website_url || salon.instagram_url);
  if (!hasAny) return null;

  return (
    <section className="lg:hidden">
      {/* V3-D202 (A15): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("contact")}
      </h2>

      <ul className="mt-3 space-y-3">
        {salon.phone && (
          <li>
            <a
              href={`tel:${salon.phone}`}
              className="font-body flex items-center gap-3 text-[14px] text-s-ink transition-colors hover:text-s-ink"
            >
              <Phone size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
              <span>{salon.phone}</span>
            </a>
          </li>
        )}
        {salon.website_url && (
          <li>
            <a
              href={salon.website_url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-body flex items-center gap-3 text-[14px] text-s-ink transition-colors hover:text-s-ink"
            >
              <Globe size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
              <span className="flex-1 truncate">
                {salon.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
              <ExternalLink size={12} strokeWidth={2} className="shrink-0 text-s-ink-2 opacity-60" />
            </a>
          </li>
        )}
        {salon.instagram_url && (
          <li>
            <a
              href={salon.instagram_url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-body flex items-center gap-3 text-[14px] text-s-ink transition-colors hover:text-s-ink"
            >
              <Instagram size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
              <span className="flex-1 truncate">
                {salon.instagram_url
                  .replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")
                  .replace(/\/$/, "")}
              </span>
              <ExternalLink size={12} strokeWidth={2} className="shrink-0 text-s-ink-2 opacity-60" />
            </a>
          </li>
        )}
      </ul>
    </section>
  );
}
