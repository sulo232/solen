"use client";

import { useTranslations } from "next-intl";
import { Search, CalendarDays, Sparkles } from "lucide-react";

/**
 * "So funktioniert's" — Component Map §22 #2 (Pre-launch section)
 *
 * Design intent: "This section should feel reassuring because new users
 * need to understand the booking flow before they trust it."
 *
 * - 3 steps: Finde → Buche → Geniesse
 * - Section heading: Pattern A (DM Sans 28px/700)
 * - Coral label: Syne 12px/700 uppercase
 * - Icons: 48px SVG stroke in coral
 * - Step title: DM Sans 16px/600
 * - Step description: DM Sans 13px/400
 * - Layout: horizontal on desktop, vertical stack on mobile
 * - DELETE once real reviews and stats exist
 */

const STEPS = [
  { key: "find", Icon: Search },
  { key: "book", Icon: CalendarDays },
  { key: "enjoy", Icon: Sparkles },
] as const;

interface HowItWorksProps {
  /** If true, hides the section (set when real data exists) */
  hidden?: boolean;
}

export default function HowItWorks({ hidden }: HowItWorksProps) {
  const t = useTranslations("home.howItWorks") as any;

  if (hidden) return null;

  return (
    <section className="px-5 md:px-10 lg:px-20">
      {/* Section header — Pattern A */}
      <span className="block font-heading text-[11px] font-bold uppercase tracking-[.1em] mb-1" style={{ color: "#E8624A" }}>
        {t("eyebrow") || "Für Neukunden"}
      </span>
      <h2
        className="font-heading text-s-ink mb-6"
        style={{ fontSize: 24, lineHeight: 1.2 }}
      >
        {t("title") || "So funktioniert's"}
      </h2>

      {/* Steps — horizontal on md+, vertical on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map(({ key, Icon }, i) => (
          <div
            key={key}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: "rgba(232,98,74,0.1)" }}
            >
              <Icon size={24} strokeWidth={1.8} style={{ color: "#E8624A" }} aria-hidden="true" />
            </div>

            {/* Step number + title */}
            <p className="font-body font-semibold text-base text-s-ink">
              <span style={{ color: "#E8624A" }}>{i + 1}.</span>{" "}
              {t(`step${i + 1}.title`) || ["Finde", "Buche", "Geniesse"][i]}
            </p>

            {/* Description */}
            <p
              className="font-body text-[13px] leading-relaxed mt-1"
              style={{ color: "rgba(26,18,9,0.55)", maxWidth: 260 }}
            >
              {t(`step${i + 1}.desc`) || [
                "Entdecke Salons in deiner Nähe.",
                "Wähle Termin & Service online.",
                "Lehn dich zurück & geniesse.",
              ][i]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
