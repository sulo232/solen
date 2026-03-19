"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/${locale}/coiffeur?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto" role="search" aria-label="Salon suchen">
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche Salon in Basel..."
          aria-label="Salon, Service oder Quartier suchen"
          className="w-full rounded-2xl bg-white shadow-card py-4 pl-12 pr-4 text-sm font-body text-dark placeholder:text-dark/40 border border-s-ink/5 focus:outline-none focus:ring-2 focus:ring-s-coral/30 transition-shadow duration-200"
        />
      </div>
    </form>
  );
}
