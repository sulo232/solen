"use client";

// exists-check: `npm run exists "motion gallery snap glide demo"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { RotateCcw } from "lucide-react";
import type { SalonCardData } from "@/app/[locale]/_components/homepage/salonCardData";
import { TabSwitchDemo } from "./TabSwitchDemo";
import { ChipSelectDemo } from "./ChipSelectDemo";
import { SheetDemo } from "./SheetDemo";
import { CardEnterDemo } from "./CardEnterDemo";
import { PressFeedbackDemo } from "./PressFeedbackDemo";
import { TitleSlideDemo } from "./TitleSlideDemo";
import { BlurSpeedDemo, type DemoService } from "./BlurSpeedDemo";

export function MotionGallery({
  salonName,
  salonPhotoUrl,
  salonRating,
  salonReviewCount,
  cardSalons,
  demoServices,
}: {
  salonName: string;
  salonPhotoUrl: string | null;
  salonRating: number | null;
  salonReviewCount: number | null;
  cardSalons: { id: string; data: SalonCardData }[];
  demoServices: DemoService[];
}) {
  const [globalTick, setGlobalTick] = React.useState(0);

  return (
    <div className="mx-auto max-w-[600px] px-4 pb-16">
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-s-border bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setGlobalTick((v) => v + 1)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-s-ink font-body text-[15px] font-semibold text-white transition-transform duration-150 ease-glide active:scale-[0.97]"
        >
          <RotateCcw size={16} strokeWidth={2.25} aria-hidden />
          Replay all
        </button>
      </div>

      <div className="space-y-4">
        <TabSwitchDemo globalTick={globalTick} />
        <ChipSelectDemo globalTick={globalTick} />
        <SheetDemo globalTick={globalTick} />
        <CardEnterDemo globalTick={globalTick} salons={cardSalons} />
        <PressFeedbackDemo globalTick={globalTick} />
        <TitleSlideDemo
          globalTick={globalTick}
          name={salonName}
          photoUrl={salonPhotoUrl}
          rating={salonRating}
          reviewCount={salonReviewCount}
        />
        <BlurSpeedDemo globalTick={globalTick} services={demoServices} />
      </div>
    </div>
  );
}
