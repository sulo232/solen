"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import { containerVariants, itemVariants } from "@/lib/animations";
import type { Salon } from "@/lib/types";

interface RecommendedSalonsProps {
  maxItems?: number;
}

export default function RecommendedSalons({ maxItems = 4 }: RecommendedSalonsProps) {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [source, setSource] = useState<"personalized" | "popular">("popular");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salons/recommendations")
      .then((r) => r.json())
      .then((d) => {
        setSalons((d.salons ?? []).slice(0, maxItems));
        setSource(d.source ?? "popular");
      })
      .catch(() => setSalons([]))
      .finally(() => setLoading(false));
  }, [maxItems]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (salons.length === 0) return null;

  return (
    <section>
      <h2 className="font-heading font-bold text-xl text-s-ink mb-4">
        {source === "personalized" ? "Für dich empfohlen" : "Beliebt in Basel"}
      </h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {salons.map((salon) => (
          <motion.div key={salon.id} variants={itemVariants}>
            <SalonCard salon={salon} variant="compact" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
