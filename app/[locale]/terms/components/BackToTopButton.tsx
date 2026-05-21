"use client";

import { ChevronUp } from "lucide-react";

export default function BackToTopButton() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 p-3 bg-s-ink text-white rounded-full shadow-elevation-3 hover:scale-110 transition-transform print:hidden z-50"
      aria-label="Back to top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
