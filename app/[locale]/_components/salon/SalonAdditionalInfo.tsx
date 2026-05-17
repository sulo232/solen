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
import type { SalonDetail } from "./_shared";

/**
 * SalonAdditionalInfo — V2-D53.3 (2026-05-11).
 *
 * Vertical checklist (NOT pills). Each amenity = lucide icon + label.
 * Replaces the V2-D53.0 pill-chips treatment per Fresha audit.
 *
 * Icon mapping intentionally mimics Fresha:
 *   ✓ Instant Confirmation, 💳 Pay by app, 🐕 Pet-friendly, 👶 Kid-friendly,
 *   ♿ Wheelchair, 🚌 Near public transport, ❤️ LGBTQ+, ⭐ Woman-owned,
 *   🏠 Family-owned, 🎓 Student discount, ♻ Cancellable
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
    { icon: Dog, label: "Haustiere willkommen", show: Boolean(salon.pet_friendly) },
    { icon: Baby, label: "Kinderfreundlich", show: Boolean(salon.kid_friendly) },
    { icon: Wifi, label: "Kostenloses WLAN", show: Boolean(salon.wifi_friendly) },
    { icon: Accessibility, label: "Rollstuhlgerecht", show: Boolean(salon.wheelchair_accessible) },
    { icon: Bus, label: "Nähe ÖV", show: Boolean(salon.near_public_transport) },
    { icon: Heart, label: "LGBTQ+ willkommen", show: Boolean(salon.lgbtq_friendly) },
    { icon: Star, label: "Frauengeführt", show: Boolean(salon.woman_owned) },
    { icon: Home, label: "Familiengeführt", show: Boolean(salon.family_owned) },
    { icon: GraduationCap, label: "Studentenrabatt", show: Boolean(salon.student_discount) },
  ];

  const shown = items.filter((i) => i.show);
  if (shown.length === 0) return null;

  return (
    <section>
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[20px]">
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
