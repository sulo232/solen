"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SalonCategory } from "@/lib/types";

const SUBCATEGORY_DATA: Record<SalonCategory, string[]> = {
  coiffeur:   ["Haarschnitt", "Balayage", "Färben", "Strähnchen", "Föhnen", "Extensions"],
  nails:      ["Gel Nägel", "Maniküre", "Pediküre", "Nail Art", "Acryl"],
  barbershop: ["Herrenschnitt", "Bartpflege", "Rasur", "Fade"],
  spa:        ["Massage", "Gesichtsbehandlung", "Hot Stone", "Sauna"],
  makeup:     ["Braut-Makeup", "Abend-Makeup", "Permanent Makeup"],
  waxing:     ["Ganzkörper", "Beine", "Bikini", "Gesicht", "Achseln"],
};

interface SubCategoryChipsProps {
  category: SalonCategory;
}

export default function SubCategoryChips({ category }: SubCategoryChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chips = SUBCATEGORY_DATA[category] ?? [];
  const activeService = searchParams.get("service");

  if (chips.length === 0) return null;

  const handleChipClick = (chip: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeService === chip) {
      params.delete("service");
    } else {
      params.set("service", chip);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2" role="group" aria-label="Sub-Kategorien">
      {chips.map((chip) => {
        const isActive = activeService === chip;
        return (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            aria-pressed={isActive}
            aria-label={chip}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-pill text-[12px] font-heading transition-[background-color,color,border-color] duration-150 whitespace-nowrap",
              isActive
                ? "bg-s-ink text-white border-transparent"
                : "bg-[--raised] text-s-ink/65 border border-s-ink/[0.08] hover:border-s-ink/20 hover:text-s-ink/80"
            )}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}
