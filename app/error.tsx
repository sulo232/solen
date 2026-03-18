"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <AlertTriangle className="w-14 h-14 text-coral mb-6" />
      <h1 className="font-heading text-3xl font-bold text-dark dark:text-dm-text mb-2">
        Etwas ist schiefgelaufen
      </h1>
      <p className="text-dark/60 dark:text-dm-text/60 font-body mb-8 text-center max-w-md">
        Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-teal text-white rounded-button font-medium text-sm hover:bg-teal/90 transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
