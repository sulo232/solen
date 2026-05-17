"use client";

import * as React from "react";
import { ExternalLink, Globe, Instagram, Phone } from "lucide-react";
import type { SalonDetail } from "./_shared";

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
  const hasAny = Boolean(salon.phone || salon.website_url || salon.instagram_url);
  if (!hasAny) return null;

  return (
    <section className="lg:hidden">
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink">
        Kontakt
      </h2>

      <ul className="mt-3 space-y-3">
        {salon.phone && (
          <li>
            <a
              href={`tel:${salon.phone}`}
              className="font-body flex items-center gap-3 text-[14px] text-s-ink transition-colors hover:text-s-brand"
            >
              <Phone size={16} strokeWidth={2} className="shrink-0 text-s-ink-3" />
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
              className="font-body flex items-center gap-3 text-[14px] text-s-ink transition-colors hover:text-s-brand"
            >
              <Globe size={16} strokeWidth={2} className="shrink-0 text-s-ink-3" />
              <span className="flex-1 truncate">
                {salon.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
              <ExternalLink size={12} strokeWidth={2} className="shrink-0 text-s-ink-3 opacity-60" />
            </a>
          </li>
        )}
        {salon.instagram_url && (
          <li>
            <a
              href={salon.instagram_url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-body flex items-center gap-3 text-[14px] text-s-ink transition-colors hover:text-s-brand"
            >
              <Instagram size={16} strokeWidth={2} className="shrink-0 text-s-ink-3" />
              <span className="flex-1 truncate">
                {salon.instagram_url
                  .replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")
                  .replace(/\/$/, "")}
              </span>
              <ExternalLink size={12} strokeWidth={2} className="shrink-0 text-s-ink-3 opacity-60" />
            </a>
          </li>
        )}
      </ul>
    </section>
  );
}
