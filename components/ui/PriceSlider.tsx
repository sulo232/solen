"use client";

import { useEffect, useState, useCallback } from "react";
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

  const pct = useCallback(
    (v: number) => ((v - min) / (max - min)) * 100,
    [min, max]
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between text-xs data-text text-s-ink/60">
        <span>{formatCurrency(values[0], locale)}</span>
        <span>{formatCurrency(values[1], locale)}</span>
      </div>

      <div className="relative flex items-center w-full h-5">
        {/* Track background */}
        <div className="absolute h-2 w-full rounded-pill bg-s-sand" />
        {/* Active range */}
        <div
          className="absolute h-2 bg-s-coral rounded-pill"
          style={{
            left: `${pct(values[0])}%`,
            width: `${pct(values[1]) - pct(values[0])}%`,
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={values[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            setValues(([, hi]) => [Math.min(v, hi - step), hi]);
          }}
          aria-label="Mindestpreis"
          className="absolute w-full h-5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-s-coral [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-card [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-s-coral [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-card [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          style={{ zIndex: values[0] > max - step * 2 ? 3 : 1 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={values[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            setValues(([lo]) => [lo, Math.max(v, lo + step)]);
          }}
          aria-label="Maximalpreis"
          className="absolute w-full h-5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-s-coral [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-card [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-s-coral [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-card [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          style={{ zIndex: 2 }}
        />
      </div>
    </div>
  );
}
