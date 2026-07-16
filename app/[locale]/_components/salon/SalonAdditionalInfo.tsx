"use client";

import * as React from "react";
import {
  Accessibility,
  Baby,
  Bus,
  Check,
  CreditCard,
  Dog,
  GraduationCap,
  Heart,
  Home,
  Repeat,
  ShieldCheck,
  Star,
  Wifi,
} from "lucide-react";
import { AMENITIES_SELF_REPORTED, type SalonDetail } from "./_shared";

/**
 * SalonAdditionalInfo — V2-D53.3 (2026-05-11).
 *
 * Vertical checklist (NOT pills). Each amenity = lucide icon + label.
 * Replaces the V2-D53.0 pill-chips treatment per Fresha audit.
 *
 * Icon mapping intentionally mimics Fresha (lucide swap per V3-D203):
 *   ShieldCheck = Instant Confirmation, CreditCard = Pay by app,
 *   Dog = Pet-friendly, Baby = Kid-friendly, Accessibility = Wheelchair,
 *   Bus = Near public transport, Heart = LGBTQ+, Star = Woman-owned,
 *   Home = Family-owned, GraduationCap = Student discount, Recycle = Cancellable
 *
 * Renders nothing if no flags are true.
 */
export function SalonAdditionalInfo({ salon }: { salon: SalonDetail }) {
  const items: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; show: boolean }[] = [
    {
      icon: ShieldCheck,
      label: "Sofortbestätigung",
      show: Boolean(salon.instant_booking_enabled) || salon.booking_confirmation_mode === "instant",
    },
    {
      icon: CreditCard,
      label: "Online bezahlen",
      show: Boolean(salon.accepts_online_payment),
    },
    {
      icon: Repeat,
      label: salon.free_cancel_hours > 0
        ? `Kostenlos bis ${salon.free_cancel_hours}h vorher stornieren`
        : "",
      show: (salon.free_cancel_hours ?? 0) > 0,
    },
    // AMENITIES_SELF_REPORTED (see _shared.ts): these 9 badges are hidden until salons
    // self-report real answers, since the seeded values were fabricated from a hash of
    // the salon's id, not a real fact. Nothing renders in place of a hidden badge (null
    // is unknown, not "no").
    ...(AMENITIES_SELF_REPORTED
      ? [
          { icon: Dog, label: "Haustiere willkommen", show: Boolean(salon.pet_friendly) },
          { icon: Baby, label: "Kinderfreundlich", show: Boolean(salon.kid_friendly) },
          { icon: Wifi, label: "Kostenloses WLAN", show: Boolean(salon.wifi_friendly) },
          { icon: Accessibility, label: "Rollstuhlgerecht", show: Boolean(salon.wheelchair_accessible) },
          { icon: Bus, label: "Nähe ÖV", show: Boolean(salon.near_public_transport) },
          { icon: Heart, label: "LGBTQ+ willkommen", show: Boolean(salon.lgbtq_friendly) },
          { icon: Star, label: "Frauengeführt", show: Boolean(salon.woman_owned) },
          { icon: Home, label: "Familiengeführt", show: Boolean(salon.family_owned) },
          { icon: GraduationCap, label: "Studentenrabatt", show: Boolean(salon.student_discount) },
        ]
      : []),
  ];

  const shown = items.filter((i) => i.show);
  if (shown.length === 0) return null;

  return (
    <section>
      {/* V3-D202 (A14): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Zusatzinformationen
      </h2>

      <ul className="mt-4 space-y-3">
        {shown.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.label}
              className="font-body flex items-start gap-3 text-[14px] text-s-ink"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-s-ink-2">
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className="leading-relaxed">{item.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
