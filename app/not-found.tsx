import Link from "next/link";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center px-4">
      <Scissors className="w-16 h-16 text-s-coral mb-6 rotate-45" />
      <h1 className="font-heading text-6xl font-bold text-s-ink dark:text-s-dm-text mb-2">404</h1>
      <p className="text-lg text-s-ink/60 dark:text-s-dm-text/60 font-body mb-8 text-center max-w-md">
        Diese Seite wurde leider nicht gefunden — vielleicht wurde sie umgestylt?
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-s-coral text-white rounded-button font-medium text-sm hover:bg-s-coral/90 transition-colors"
        >
          Zur Startseite
        </Link>
        <Link
          href="/coiffeur"
          className="px-6 py-3 border border-s-ink/10 text-s-ink/70 rounded-button font-medium text-sm hover:bg-s-bg-surface transition-colors"
        >
          Salons entdecken
        </Link>
      </div>
    </div>
  );
}
