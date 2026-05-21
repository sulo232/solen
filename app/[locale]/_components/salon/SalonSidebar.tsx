"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Instagram,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import type { SalonDetail } from "./_shared";
import { DAY_KEYS, DAY_LABEL, type DayKey, computeOpenStatus } from "./_shared";
import { SalonBuy } from "./SalonBuy";
import { cn } from "@/lib/utils";

/**
 * SalonSidebar — V2-D53.3 (2026-05-11), expand-on-scroll polish 2026-05-11.
 *
 * Sticky right rail on desktop. Two-state behavior:
 *
 * • COLLAPSED (window.scrollY <= 200): only the emerald "Termin buchen" pill
 *   renders. No card chrome, no rating/address/contact/Gift Cards. At the
 *   top of the page the user can already see all that in the main content
 *   header — repeating it in the sidebar adds visual noise.
 *
 * • EXPANDED (window.scrollY > 200, matching the header/tab-nav threshold):
 *   full booking card slides in — salon name, rating, Featured pill, status
 *   with expandable hours, address, contact rows, Gift Cards. This is the
 *   sticky reference the user wants once they've scrolled past the hero
 *   and title block.
 *
 * Hysteresis (100/200) matches Header.tsx + SalonStickyTabNav so all three
 * sticky-chrome transitions happen at the same boundary without flicker.
 *
 * Brand: emerald primary CTA (V2-D49j), terracotta Featured pill
 * (V3 heartbeat highlight), Open Sauce One typography (V2-D42).
 */
export function SalonSidebar({
  salon,
  locale,
}: {
  salon: SalonDetail;
  locale: string;
}) {
  const status = computeOpenStatus(salon.opening_hours);
  const [showHours, setShowHours] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  // V2-D53.3 fix #8 (R2-G1): salon.address already includes city, don't append postal.
  const fullAddress = salon.address;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  React.useEffect(() => {
    function onScroll() {
      // V2-D53.3 polish (user feedback): expand much sooner. Sidebar lives
      // alongside the title block from scrollY=0, so any meaningful scroll
      // already moves the user toward the services. Tight hysteresis (200
      // expand, 50 collapse) so the transition happens in the first scroll
      // gesture without flickering at the boundary.
      setExpanded((prev) => {
        if (prev) return window.scrollY > 50;
        return window.scrollY > 200;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // V2-D53.3 polish: keep the white card chrome (border + padding + shadow)
    // ALWAYS visible, both collapsed and expanded. Only the content above /
    // below the Book button expands/collapses. Matches Fresha — a small
    // white card with just the Book button at top, then it grows as you
    // scroll. Avoids the "naked floating button" look the earlier version had.
    <div className="rounded-2xl border border-s-border bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out md:p-6">

      {/* Top section — salon name + rating + Featured pill. Collapsed when
          !expanded; revealed when scrolled. */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          expanded ? "mb-5 max-h-[200px] opacity-100" : "mb-0 max-h-0 opacity-0"
        )}
      >
        <div className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
          {salon.name}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <Star size={13} fill="#F3A864" stroke="none" />
          <strong className="font-body text-[13px] text-s-ink">
            {salon.average_rating?.toFixed(1) ?? "—"}
          </strong>
          <span className="font-body text-[12px] text-s-ink-3">
            ({salon.review_count.toLocaleString("de-CH")})
          </span>
        </div>

        {salon.is_featured && (
          <div className="mt-3">
            <span className="font-body inline-flex items-center rounded-full bg-s-accent/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-s-accent">
              Empfohlen
            </span>
          </div>
        )}
      </div>

      {/* Primary CTA — always visible. Stays anchored to the sidebar slot
          regardless of expanded state. */}
      <Link
        href={`/${locale}/salon/${salon.slug}/booking`}
        className="font-body inline-flex w-full items-center justify-center gap-2 rounded-full bg-s-brand py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(31,92,66,0.18)] transition-colors hover:bg-s-brand-mid active:bg-s-brand-deep"
      >
        Termin buchen
        <ChevronRight size={15} strokeWidth={2.5} />
      </Link>

      {/* Bottom section — status, address, contact, Gift Cards. Collapsed
          when !expanded; revealed when scrolled. */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          expanded ? "mt-5 max-h-[800px] opacity-100" : "mt-0 max-h-0 opacity-0"
        )}
      >
        <div className="mb-5 border-t border-s-border" />

        {/* Open status (tappable, expandable hours) */}
        <button
          type="button"
          onClick={() => setShowHours((v) => !v)}
          className="font-body -mx-2 flex w-[calc(100%+1rem)] items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-s-ink-2 transition-colors hover:bg-s-bg-sunken"
          aria-expanded={showHours}
        >
          <Clock size={14} className="shrink-0 text-s-ink-3" strokeWidth={2} />
          <span
            className={cn(
              "font-semibold",
              status.isOpen ? "text-emerald-600" : "text-amber-700"
            )}
          >
            {status.label}
          </span>
          {salon.opening_hours && (
            <ChevronDown
              size={15}
              strokeWidth={2.25}
              className={cn(
                "ml-auto shrink-0 text-s-ink-3 transition-transform duration-200",
                showHours && "rotate-180"
              )}
            />
          )}
        </button>

        {showHours && salon.opening_hours && (
          <ul className="mt-2 space-y-1.5 rounded-lg bg-s-bg-sunken/50 px-3 py-2.5 pl-7">
            {DAY_KEYS.map((day) => {
              const h = salon.opening_hours![day];
              const todayKey = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]) as DayKey;
              const isToday = day === todayKey;
              return (
                <li
                  key={day}
                  className={cn(
                    "font-body flex items-center justify-between text-[12px]",
                    isToday ? "font-semibold text-s-ink" : "text-s-ink-2"
                  )}
                >
                  <span>{DAY_LABEL[day]}</span>
                  <span>{h ? `${h.open} – ${h.close}` : "Geschlossen"}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Address */}
        <div className="font-body mt-4 flex items-start gap-2 text-[13px] text-s-ink-2">
          <MapPin size={14} className="mt-0.5 shrink-0 text-s-ink-3" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <div>{fullAddress}</div>
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-flex items-center gap-0.5 font-semibold text-s-brand hover:underline"
            >
              Wegbeschreibung
              <ExternalLink size={10} strokeWidth={2} className="opacity-60" />
            </a>
          </div>
        </div>

        {/* Contact rows */}
        {(salon.phone || salon.website_url || salon.instagram_url) && (
          <>
            <div className="my-5 border-t border-s-border" />
            <div className="space-y-2.5">
              {salon.phone && (
                <a
                  href={`tel:${salon.phone}`}
                  className="font-body flex items-center gap-2 text-[13px] text-s-ink-2 transition-colors hover:text-s-brand"
                >
                  <Phone size={14} strokeWidth={2} className="text-s-ink-3" />
                  {salon.phone}
                </a>
              )}
              {salon.website_url && (
                <a
                  href={salon.website_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-body flex items-center gap-2 text-[13px] text-s-ink-2 transition-colors hover:text-s-brand"
                >
                  <Globe size={14} strokeWidth={2} className="text-s-ink-3" />
                  Website
                  <ExternalLink size={11} strokeWidth={2} className="opacity-50" />
                </a>
              )}
              {salon.instagram_url && (
                <a
                  href={salon.instagram_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-body flex items-center gap-2 text-[13px] text-s-ink-2 transition-colors hover:text-s-brand"
                >
                  <Instagram size={14} strokeWidth={2} className="text-s-ink-3" />
                  Instagram
                </a>
              )}
            </div>
          </>
        )}

        <div className="my-5 border-t border-s-border" />

        <SalonBuy locale={locale} slug={salon.slug} salonName={salon.name} variant="sidebar" />
      </div>
    </div>
  );
}
