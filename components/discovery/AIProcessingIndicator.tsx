"use client";

import { Sparkles } from "lucide-react";

export default function AIProcessingIndicator({ text = "Analyzing your image..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[16px] bg-s-coral/5 border border-s-coral/10">
      <div className="relative">
        <Sparkles size={18} className="text-s-coral animate-pulse" />
      </div>
      <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">{text}</span>
    </div>
  );
}
