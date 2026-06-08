"use client";

import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { PersonSimpleWalk } from "@phosphor-icons/react";

type Mode = "book" | "walkin";

// Book / Walk-in mode switch on the barbershop page (Uber Delivery/Pickup pattern).
// Only rendered for walk-in-enabled barbershops.
const COPY: Record<string, { book: string; walkin: string }> = {
  de: { book: "Termin", walkin: "Walk-in" },
  en: { book: "Book", walkin: "Walk-in" },
  fr: { book: "Réserver", walkin: "Walk-in" },
  it: { book: "Prenota", walkin: "Walk-in" },
};

export default function SalonModeToggle({
  mode,
  onChange,
  locale,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  locale: string;
}) {
  const l = COPY[locale] ?? COPY.de;
  const segs: { key: Mode; label: string; icon: ReactNode }[] = [
    { key: "book", label: l.book, icon: <Calendar className="w-[18px] h-[18px]" /> },
    { key: "walkin", label: l.walkin, icon: <PersonSimpleWalk size={19} weight="bold" /> },
  ];
  return (
    <div className="flex rounded-btn bg-s-sand p-1">
      {segs.map(({ key, label, icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center gap-2 h-11 rounded-btn font-heading text-[15px] transition-colors duration-150 ${
              active ? "bg-white text-s-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-s-ink-2 font-medium"
            }`}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}
