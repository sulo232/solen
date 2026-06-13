import Link from "next/link";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <Scissors className="w-16 h-16 text-s-ink-3 mb-6 rotate-45" />
      <h1 className="font-heading text-6xl font-bold text-s-ink mb-2">404</h1>
      <p className="text-lg text-s-ink/60 font-body mb-8 text-center max-w-md">
        Diese Seite wurde leider nicht gefunden — vielleicht wurde sie umgestylt?
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-s-ink text-white rounded-btn font-medium text-sm hover:brightness-[1.06] transition-[filter]"
        >
          Zur Startseite
        </Link>
        <Link
          href="/coiffeur"
          className="px-6 py-3 border border-s-border text-s-ink-2 rounded-btn font-medium text-sm hover:bg-s-bg-sunken transition-colors"
        >
          Salons entdecken
        </Link>
      </div>
    </div>
  );
}
