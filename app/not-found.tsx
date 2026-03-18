import Link from "next/link";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Scissors className="w-16 h-16 text-s-coral mb-6 rotate-45" />
      <h1 className="font-heading text-6xl font-bold text-dark mb-2">404</h1>
      <p className="text-lg text-dark/60 font-body mb-8 text-center max-w-md">
        Diese Seite wurde leider nicht gefunden — vielleicht wurde sie umgestylt?
      </p>
      <div className="flex gap-3">
        <Link
          href="/de"
          className="px-6 py-3 bg-s-coral text-white rounded-button font-medium text-sm hover:bg-s-coral/90 transition-colors"
        >
          Zur Startseite
        </Link>
        <Link
          href="/de/coiffeur"
          className="px-6 py-3 border border-gray-200 text-dark/70 rounded-button font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          Salons entdecken
        </Link>
      </div>
    </div>
  );
}
