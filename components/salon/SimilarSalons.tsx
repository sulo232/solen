"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import type { SalonCard as SalonCardType } from "@/lib/types";

interface SimilarSalonsProps {
  currentSalonId: string;
  category: string;
  locale: string;
}

export default function SimilarSalons({ currentSalonId, category, locale }: SimilarSalonsProps) {
  const t = useTranslations("salon") as any;
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const res = await fetch(
          `/api/salons/similar?current_id=${currentSalonId}&category=${category}&limit=3`
        );
        if (res.ok) {
          const data = await res.json();
          setSalons(data.salons || []);
        }
      } catch (err) {
        console.error("Failed to fetch similar salons:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [currentSalonId, category]);

  if (loading) {
    return (
      <section className="py-12 border-t border-s-ink/5">
        <h2 className="text-2xl font-heading text-s-ink mb-6">
          {t("similarSalons")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </section>
    );
  }

  if (salons.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-s-ink/5">
      <h2 className="text-2xl font-heading text-s-ink mb-6">
        {t("similarSalons")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {salons.map((salon) => (
          <SalonCard key={salon.id} salon={salon} locale={locale} />
        ))}
      </div>
    </section>
  );
}
