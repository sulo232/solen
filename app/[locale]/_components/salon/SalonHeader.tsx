"use client";

import * as React from "react";
import { MapPin, Share, Star, TicketPercent } from "lucide-react";
import { HeartButton } from "../homepage/HeartButton";
import type { SalonDetail } from "./_shared";
import { computeOpenStatus } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonHeader — V2-D53.3 (2026-05-11).
 *
 * Title block under the hero. Bullet-separated meta row matches Fresha:
 *   {rating} · {status} · {address} · Get directions
 *
 * Featured pill uses TERRACOTTA `s-accent` per V3 brand discipline
 * (heartbeat highlight semantic) — NOT Fresha's purple. User picked
 * "use the Solen brand" over Fresha-match for this token.
 *
 * Share + Heart only render here on DESKTOP. Mobile has them in the cover
 * photo overlay (SalonHero).
 */
export function SalonHeader({ salon }: { salon: SalonDetail }) {
  const status = computeOpenStatus(salon.opening_hours);
  // V2-D53.3 fix: salon.address already contains the city (e.g. "Freie Strasse 12, Basel").
  // Appending salon.postal_code produced the awkward "Freie Strasse 12, Basel, 4001"
  // (postal AFTER city, contra Swiss convention). Match Fresha — show street + city only,
  // skip postal in this row. (Postal still available to the city-prefix lookup.)
  const fullAddress = salon.address;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <header className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* V2-D53.3 font swap: dropped Peace Sans (font-display) on this
              commerce-surface title in favor of Open Sauce One bold
              (font-body). Peace Sans is the marketing-hub display font and
              reads chunky next to the dense meta row + Featured pill below.
              Body-font bold at slightly larger sizes (24/36/44) feels like
              a commerce-page heading, not a marketing billboard. */}
          <h1 className="font-body text-[24px] font-bold leading-[1.15] tracking-tight text-s-ink md:text-[36px] lg:text-[44px]">
            {salon.name}
          </h1>

          {/* Meta row — bullet-separated, wraps on mobile */}
          <div className="font-body mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-s-ink-2 md:text-[14px]">
            <span className="inline-flex items-center gap-1">
              <Star size={14} fill="#F3A864" stroke="none" />
              <strong className="text-s-ink">{salon.average_rating?.toFixed(1) ?? "—"}</strong>
              <span className="text-s-ink-3">
                ({salon.review_count.toLocaleString("de-CH")})
              </span>
            </span>
            <Dot />
            <span
              className={cn(
                "font-semibold",
                status.isOpen ? "text-emerald-600" : "text-amber-700"
              )}
            >
              {status.label}
            </span>
            <Dot />
            <span className="inline-flex items-center gap-1 text-s-ink-2">
              <MapPin size={13} className="shrink-0 text-s-ink-3" strokeWidth={2} />
              {fullAddress}
            </span>
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-s-brand hover:underline"
            >
              Wegbeschreibung
            </a>
          </div>

          {/* Featured + last-minute pills */}
          {(salon.is_featured || salon.last_minute_discount_percent > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {salon.is_featured && (
                <span className="font-body inline-flex items-center rounded-full bg-s-accent/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-s-accent">
                  Empfohlen
                </span>
              )}
              {salon.last_minute_discount_percent > 0 && (
                <span className="font-body inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-amber-900">
                  <TicketPercent size={11} strokeWidth={2.25} />
                  -{salon.last_minute_discount_percent}% Last-Minute
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop-only share + heart cluster. Matches the mobile hero
            overlay icons — outline-only, no circular bg, no border.
            iOS-style Share icon (square + up-arrow), dark stroke since these
            sit on the white page bg (mobile uses white stroke on photos). */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <button
            type="button"
            aria-label="Salon teilen"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator
                  .share({ title: salon.name, url: window.location.href })
                  .catch(() => {});
              } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
            }}
            className="grid h-10 w-10 place-items-center bg-transparent transition-transform hover:scale-110 active:scale-95"
          >
            <Share size={22} strokeWidth={2.25} className="text-s-ink" aria-hidden />
          </button>
          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            tone="dark"
            className="!relative !right-auto !top-auto"
          />
        </div>
      </div>
    </header>
  );
}

function Dot() {
  return <span className="text-s-ink-3" aria-hidden>·</span>;
}
