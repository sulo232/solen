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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("salonDetail");
  const items: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; show: boolean }[] = [
    {
      icon: ShieldCheck,
      label: t("amInstant"),
      show: Boolean(salon.instant_booking_enabled) || salon.booking_confirmation_mode === "instant",
    },
    {
      icon: CreditCard,
      label: t("amOnlinePay"),
      show: Boolean(salon.accepts_online_payment),
    },
    {
      icon: Repeat,
      label: salon.free_cancel_hours > 0
        ? t("amFreeCancel", { hours: salon.free_cancel_hours })
        : "",
      show: (salon.free_cancel_hours ?? 0) > 0,
    },
    { icon: Dog, label: t("amPets"), show: Boolean(salon.pet_friendly) },
    { icon: Baby, label: t("amKids"), show: Boolean(salon.kid_friendly) },
    { icon: Wifi, label: t("amWifi"), show: Boolean(salon.wifi_friendly) },
    { icon: Accessibility, label: t("amWheelchair"), show: Boolean(salon.wheelchair_accessible) },
    { icon: Bus, label: t("amTransit"), show: Boolean(salon.near_public_transport) },
    { icon: Heart, label: t("amLgbtq"), show: Boolean(salon.lgbtq_friendly) },
    { icon: Star, label: t("amWomanOwned"), show: Boolean(salon.woman_owned) },
    { icon: Home, label: t("amFamilyOwned"), show: Boolean(salon.family_owned) },
    { icon: GraduationCap, label: t("amStudent"), show: Boolean(salon.student_discount) },
  ];

  const shown = items.filter((i) => i.show);
  if (shown.length === 0) return null;

  return (
    <section>
      {/* V3-D202 (A14): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("additionalInfo")}
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
                <Icon size={16} strokeWidth={1.9} />
              </span>
              <span className="leading-relaxed">{item.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
