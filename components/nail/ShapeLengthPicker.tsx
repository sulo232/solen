"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { NailShape, NailLength } from "@/lib/types";

interface ShapeLengthPickerProps {
  shape: NailShape | null;
  length: NailLength | null;
  onShapeChange: (shape: NailShape) => void;
  onLengthChange: (length: NailLength) => void;
}

const SHAPES: { value: NailShape; key: string; svg: string }[] = [
  { value: "round", key: "shape_round", svg: "M10 2C6 2 2 6 2 12h16c0-6-4-10-8-10z" },
  { value: "square", key: "shape_square", svg: "M2 2h16v10H2z" },
  { value: "oval", key: "shape_oval", svg: "M10 1C5 1 1 5 1 10c0 2 4 3 9 3s9-1 9-3c0-5-4-9-9-9z" },
  { value: "almond", key: "shape_almond", svg: "M10 1C7 1 4 4 3 8c-1 3 3 5 7 5s8-2 7-5C16 4 13 1 10 1z" },
  { value: "coffin", key: "shape_coffin", svg: "M4 2L2 10h16L16 2H4z" },
  { value: "stiletto", key: "shape_stiletto", svg: "M10 1L2 12h16L10 1z" },
  { value: "squoval", key: "shape_squoval", svg: "M4 2C2 2 2 4 2 6v6h16V6c0-2 0-4-2-4H4z" },
  { value: "ballerina", key: "shape_ballerina", svg: "M5 1L3 10h14L15 1H5z" },
  { value: "lipstick", key: "shape_lipstick", svg: "M4 4L2 10h16L12 2H4z" },
  { value: "edge", key: "shape_edge", svg: "M10 1L4 6v6h12V6L10 1z" },
];

const LENGTHS: { value: NailLength; key: string; barHeight: string }[] = [
  { value: "natural", key: "length_natural", barHeight: "h-3" },
  { value: "short", key: "length_short", barHeight: "h-5" },
  { value: "medium", key: "length_medium", barHeight: "h-7" },
  { value: "long", key: "length_long", barHeight: "h-9" },
  { value: "extra_long", key: "length_extra_long", barHeight: "h-11" },
];

export default function ShapeLengthPicker({ shape, length, onShapeChange, onLengthChange }: ShapeLengthPickerProps) {
  const t = useTranslations("booking") as any;

  return (
    <div className="space-y-4">
      {/* Shape selector */}
      <div>
        <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">{t("nail_shape")}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {SHAPES.map(({ value: v, key, svg }) => (
            <button
              key={v}
              type="button"
              onClick={() => onShapeChange(v)}
              className={`flex flex-col items-center gap-1 p-2 rounded-[12px] border transition-[border-color,background-color,box-shadow] duration-150 ${
                shape === v
                  ? "border-s-coral bg-s-coral/5 dark:bg-s-coral/10 shadow-coral-glow"
                  : "border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface hover:border-s-coral/20"
              }`}
            >
              <svg viewBox="0 0 20 14" className={`w-8 h-6 ${shape === v ? "fill-s-coral/20 stroke-s-coral" : "fill-s-ink/5 stroke-s-ink/30 dark:fill-s-dm-text/5 dark:stroke-s-dm-text/30"}`} strokeWidth="1">
                <path d={svg} />
              </svg>
              <span className={`text-[9px] leading-tight ${shape === v ? "text-s-coral font-medium" : "text-s-ink/50 dark:text-s-dm-text/50"}`}>
                {t(key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Length selector */}
      <div>
        <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">{t("nail_length")}</p>
        <div className="flex items-end justify-between gap-2">
          {LENGTHS.map(({ value: v, key, barHeight }) => (
            <button
              key={v}
              type="button"
              onClick={() => onLengthChange(v)}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div
                className={`w-full ${barHeight} rounded-t-sm transition-colors ${
                  length === v
                    ? "bg-s-coral"
                    : "bg-s-ink/10 dark:bg-s-dm-text/10 hover:bg-s-coral/20"
                }`}
              />
              <span className={`text-[9px] ${length === v ? "text-s-coral font-medium" : "text-s-ink/40 dark:text-s-dm-text/40"}`}>
                {t(key)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
