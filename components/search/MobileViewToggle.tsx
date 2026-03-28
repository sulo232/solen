"use client";

import { Map, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

interface MobileViewToggleProps {
  view: "grid" | "map";
  onToggle: (view: "grid" | "map") => void;
}

export default function MobileViewToggle({ view, onToggle }: MobileViewToggleProps) {
  const t = useTranslations("ui.viewToggle") as any;
  return (
    <button
      onClick={() => onToggle(view === "grid" ? "map" : "grid")}
      className="fixed bottom-24 right-4 z-40 md:hidden bg-s-coral text-white p-4 rounded-pill shadow-coral-glow hover:shadow-warm-md transition-[transform,box-shadow]"
      aria-label={view === "grid" ? t("mapView") : t("gridView")}
    >
      {view === "grid" ? <Map size={20} /> : <LayoutGrid size={20} />}
    </button>
  );
}
