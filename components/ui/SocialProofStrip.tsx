"use client";

import { Shield, Users, MapPin } from "lucide-react";

const STATS = [
  { Icon: Users,  text: "Vertraut von Basler:innen seit 2026" },
  { Icon: Shield, text: "Geprüfte Salons" },
  { Icon: MapPin, text: "Lokal in Basel" },
] as const;

export default function SocialProofStrip() {
  return (
    <div className="bg-teal/5 border-y border-teal/10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
        {STATS.map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon size={14} className="text-teal shrink-0" />
            <span
              className="text-xs text-dark/60 font-body font-medium"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
