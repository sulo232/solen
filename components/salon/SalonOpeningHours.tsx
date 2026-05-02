"use client";

import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OpeningHours } from "@/lib/types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

interface SalonOpeningHoursProps {
  openingHours: Record<string, OpeningHours | null>;
  locale: string;
}

export default function SalonOpeningHours({ openingHours, locale }: SalonOpeningHoursProps) {
  const t = useTranslations("salonDetail");
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const DAYS = [t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")];

  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const todayHours = openingHours?.[dayKey] as OpeningHours | null | undefined;
  const isOpen = (() => {
    if (!todayHours) return false;
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  })();

  if (Object.keys(openingHours ?? {}).length === 0) return null;

  return (
    <div
      className="rounded-[20px] p-5"
      style={{
        background: "rgba(255,255,255,.62)",
        backdropFilter: "blur(16px) saturate(1.2)",
        WebkitBackdropFilter: "blur(16px) saturate(1.2)",
        border: "1px solid rgba(255,255,255,.55)",
        boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)",
      }}
    >
      <h2 className="font-heading font-semibold text-base text-s-ink mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-s-ink/60" />
        {t("openingHours")}
      </h2>

      {/* Mobile: today preview + expand */}
      <div className="md:hidden">
        <button
          onClick={() => setHoursExpanded(!hoursExpanded)}
          aria-expanded={hoursExpanded}
          className="w-full flex items-center justify-between py-2 text-sm"
        >
          <span className="flex items-center gap-2 text-s-ink/70">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpen ? "bg-s-sage shadow-[0_0_4px_rgba(46,204,113,0.4)]" : "bg-s-ink/30"
              }`}
            />
            {t("todayPrefix")}: {todayHours ? `${todayHours.open}–${todayHours.close}` : t("closed")}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-s-ink/40 transition-transform ${hoursExpanded ? "rotate-180" : ""}`}
          />
        </button>
        {hoursExpanded && (
          <div className="grid grid-cols-1 gap-y-1.5 mt-1">
            {DAY_KEYS.map((key, i) => {
              const h = openingHours[key] as OpeningHours | null;
              const isToday = key === dayKey;
              const label = DAYS[i];
              return (
                <div
                  key={key}
                  className={`flex justify-between items-center text-sm py-1.5 px-2 rounded-[8px] ${
                    isToday ? "bg-s-coral/[0.08]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${h ? "bg-s-sage" : "bg-s-ink/15"} ${
                        isToday && h ? "shadow-[0_0_4px_rgba(46,204,113,0.4)]" : ""
                      }`}
                    />
                    <span className={isToday ? "font-heading font-bold text-s-ink" : "text-s-ink/50"}>
                      {label}
                    </span>
                  </div>
                  <span
                    className={`data-text ${
                      h ? (isToday ? "font-bold text-s-coral" : "text-s-ink") : "text-s-ink/20"
                    }`}
                  >
                    {h ? `${h.open}–${h.close}` : t("closed")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: full grid */}
      <div className="hidden md:grid grid-cols-2 gap-x-8 gap-y-1.5">
        {DAY_KEYS.map((key, i) => {
          const h = openingHours[key] as OpeningHours | null;
          const isToday = key === dayKey;
          const label = DAYS[i];
          return (
            <div
              key={key}
              className={`flex justify-between items-center text-sm py-1.5 px-2 rounded-[8px] ${
                isToday ? "bg-s-coral/[0.08]" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${h ? "bg-s-sage" : "bg-s-ink/15"} ${
                    isToday && h ? "shadow-[0_0_4px_rgba(46,204,113,0.4)]" : ""
                  }`}
                />
                <span className={isToday ? "font-heading font-bold text-s-ink" : "text-s-ink/50"}>
                  {label}
                </span>
              </div>
              <span
                className={`data-text ${
                  h ? (isToday ? "font-bold text-s-coral" : "text-s-ink") : "text-s-ink/20"
                }`}
              >
                {h ? `${h.open}–${h.close}` : t("closed")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
