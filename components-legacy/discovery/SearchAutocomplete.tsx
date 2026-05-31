"use client";

import { Search } from "lucide-react";

/**
 * SearchAutocomplete — typed-query suggestion list (V3-D395), matching the Pinterest autocomplete in the mockup:
 * search-glyph row + the typed prefix in recessive ink, the completion in ink-semibold.
 *
 * Front-end only — filters a static pool of popular Solen style queries (no backend). The first row is always the
 * raw query so any text is searchable. Real ranked suggestions + thumbnails wait for the search backend (task #20/#22).
 */
const POOL = [
  // hair
  "Balayage", "Curtain Bangs", "Wolf Cut", "Bob", "Pixie Cut", "Shag", "Long Layers", "Locken",
  "Highlights", "Babylights", "Herrenschnitt", "Skin Fade", "Buzz Cut", "Mullet", "Braut-Styling", "Olaplex",
  // nails
  "Gel Nails", "French Tips", "Nail Art", "Chrome Nails", "Maniküre", "Pediküre", "Acryl",
  // lashes / brows
  "Wimpernverlängerung", "Lash Lift", "Volumen Lashes", "Klassische Wimpern",
  "Augenbrauen", "Brow Lamination", "Microblading",
  // spa
  "Facial", "Make-up", "Massage",
];

interface SearchAutocompleteProps {
  query: string;
  onSelect: (term: string) => void;
}

export default function SearchAutocomplete({ query, onSelect }: SearchAutocompleteProps) {
  const q = query.trim();
  const ql = q.toLowerCase();
  const matches = POOL.filter((s) => s.toLowerCase().includes(ql) && s.toLowerCase() !== ql).slice(0, 8);

  return (
    <ul className="flex flex-col">
      {/* Raw query — always searchable */}
      <li>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(q)}
          className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2.5 text-left transition-colors duration-150 hover:bg-s-ink/[0.04]"
        >
          <Search size={16} className="shrink-0 text-s-ink-2" aria-hidden />
          <span className="truncate text-[15px] text-s-ink">{q}</span>
        </button>
      </li>
      {matches.map((s) => {
        const idx = s.toLowerCase().indexOf(ql);
        const pre = idx >= 0 ? s.slice(0, idx + q.length) : "";
        const post = idx >= 0 ? s.slice(idx + q.length) : s;
        return (
          <li key={s}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(s)}
              className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2.5 text-left transition-colors duration-150 hover:bg-s-ink/[0.04]"
            >
              <Search size={16} className="shrink-0 text-s-ink-2" aria-hidden />
              <span className="truncate text-[15px] text-s-ink-2">
                {pre}
                <span className="font-semibold text-s-ink">{post}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
