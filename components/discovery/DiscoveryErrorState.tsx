"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DiscoveryErrorStateProps {
  onRetry: () => void;
}

export default function DiscoveryErrorState({ onRetry }: DiscoveryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle size={40} className="text-s-coral mb-3" />
      <h3 className="text-base font-medium text-s-ink dark:text-s-dm-text mb-1">Something went wrong</h3>
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mb-4">Could not load discovery items</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium"
      >
        <RefreshCw size={14} /> Try Again
      </button>
    </div>
  );
}
