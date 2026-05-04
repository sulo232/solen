"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import SalonCard from "@/components-legacy/SalonCard";
import Skeleton from "@/components-legacy/ui/Skeleton";

interface NearbySalon {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  categories: string[];
  average_rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  opening_hours: Record<string, { open: string; close: string } | null>;
  last_minute_discount_percent: number;
  distance_km: number;
  min_price: number | null;
}

interface NearbySalonsProps {
  salonSlug: string;
}

export default function NearbySalons({ salonSlug }: NearbySalonsProps) {
  const locale = useLocale();
  const t = useTranslations("home.nearby") as any;
  const [salons, setSalons] = useState<NearbySalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/salons/${salonSlug}/nearby`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (cancelled) return;
        setSalons(d?.items ?? []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [salonSlug]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (salons.length === 0) return null;

  return (
    <div>
      <span className="block font-heading text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
        {t("eyebrow")}
      </span>
      <h2 className="font-heading text-s-ink mb-6"
        style={{ fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "-0.02em" }}>
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {salons.map((salon) => (
          <SalonCard
            key={salon.id}
            salon={salon as any}
            locale={locale}
            variant="compact"
            showDistance
          />
        ))}
      </div>
    </div>
  );
}
