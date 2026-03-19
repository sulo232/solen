"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";

interface NearbySalon {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  categories: string[];
  quartier: string;
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
  const [salons, setSalons] = useState<NearbySalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/salons/${salonSlug}/nearby`)
      .then((r) => r.json())
      .then((d) => {
        setSalons(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      <h2 className="font-heading font-semibold text-base text-dark dark:text-s-dm-text mb-4">
        Ähnliche Salons in der Nähe
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {salons.map((salon) => (
          <SalonCard
            key={salon.id}
            salon={salon as any}
            locale={locale}
            variant="compact"
            showDistance
            minPrice={salon.min_price ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
