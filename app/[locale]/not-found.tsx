import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="font-display text-7xl text-s-coral mb-4">404</p>
        <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
          Seite nicht gefunden
        </h2>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mb-6">
          Die Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/de"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] active:scale-[0.98] transition-all shadow-warm-sm"
        >
          <Search size={14} />
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
