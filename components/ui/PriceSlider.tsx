"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";

interface PriceSliderProps {
  min?: number;
  max?: number;
  step?: number;
}

export default function PriceSlider({ min = 0, max = 200, step = 5 }: PriceSliderProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<[number, number]>([
    Number(searchParams.get("min_price") ?? min),
    Number(searchParams.get("max_price") ?? max),
  ]);

  // Debounced URL update — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("min_price", String(values[0]));
      params.set("max_price", String(values[1]));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [values, pathname, router, searchParams]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between text-xs data-text text-s-ink/60">
        <span>{formatCurrency(values[0], locale)}</span>
        <span>{formatCurrency(values[1], locale)}</span>
      </div>

      <SliderPrimitive.Root
        min={min}
        max={max}
        step={step}
        value={values}
        onValueChange={(v) => setValues([v[0], v[1]] as [number, number])}
        className="relative flex items-center w-full h-5"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-pill bg-s-sand">
          <SliderPrimitive.Range className="absolute h-full bg-s-coral" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-s-coral bg-white shadow-card ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing"
          aria-label="Mindestpreis"
        />
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-s-coral bg-white shadow-card ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing"
          aria-label="Maximalpreis"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
