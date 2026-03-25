"use client";

import { BookOpen } from "lucide-react";

interface CutGuideProps {
  guide: string;
}

export default function CutGuide({ guide }: CutGuideProps) {
  return (
    <div className="p-4 rounded-[16px] bg-s-blue/5 border border-s-blue/10">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={14} className="text-s-blue" />
        <span className="text-xs font-medium text-s-blue">Cut Guide</span>
      </div>
      <p className="text-sm text-s-ink/80 dark:text-s-dm-text/80 leading-relaxed whitespace-pre-line">
        {guide}
      </p>
    </div>
  );
}
