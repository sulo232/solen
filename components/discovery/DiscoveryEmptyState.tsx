"use client";

import { Compass } from "lucide-react";

export default function DiscoveryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Compass size={40} className="text-s-ink/10 dark:text-s-dm-text/10 mb-4" />
      <h3 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text mb-1">No styles found</h3>
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 max-w-xs">
        Try adjusting your filters or search for something different.
      </p>
    </div>
  );
}
