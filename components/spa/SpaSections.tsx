"use client";

import { Sparkles } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export function SpaBelowGrid() {
  return (
    <section className="py-16 px-4">
      <EmptyState
        icon={Sparkles}
        title="Kommt bald"
        message="Wir arbeiten daran, diese Kategorie für dich verfügbar zu machen."
        illustration="coming-soon"
      />
    </section>
  );
}
