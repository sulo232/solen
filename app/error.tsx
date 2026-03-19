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
      <AlertTriangle className="w-14 h-14 text-s-coral mb-6" />
      <h1 className="font-heading text-3xl font-bold text-dark dark:text-s-dm-text mb-2">
        Etwas ist schiefgelaufen
      </h1>
      <p className="text-dark/60 dark:text-s-dm-text/60 font-body mb-8 text-center max-w-md">
        Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-s-coral text-white rounded-button font-medium text-sm hover:bg-s-coral/90 transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
