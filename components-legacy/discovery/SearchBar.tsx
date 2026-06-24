"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  /** V3-D414: fires on Enter with the current text — the page commits THIS to the feed query. Typing alone
      (onChange) only drives the dropdown; it no longer searches or logs partial terms. */
  onSubmit?: (value: string) => void;
}

export default function DiscoverySearchBar({ value, onChange, placeholder = "Search styles...", onFocus, onBlur, onSubmit }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
      <input
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (debounceRef.current) clearTimeout(debounceRef.current); // cancel the pending debounce
            onChange(local);   // flush the typed text immediately
            onSubmit?.(local);  // commit → the page runs the actual search + logs it once
          }
        }}
        placeholder={placeholder}
        /* NO focus ring (owner 2026-06-23: "ditch the focus ring"). The expand + dropdown are the focus signal on
           this touch search, so the input stays the calm sunken pill on focus — the `!` focus overrides kill BOTH
           the old blue ring AND the global ink halo (globals.css input:focus-visible). `!` modifiers also restore
           the pill + sunken + pl-9 over the globals base reset. 48px min-height + 16px font (touch + iOS no-zoom).
           `discovery-searchbar` hooks the globals.css override that fixes the warm LEFT edge: Tailwind parses
           `!border-s-border` two ways and ALSO emits `border-inline-start-color: hsl(var(--border))` (the legacy
           WARM token), which wins the left edge over the cool `border-color`. The override forces all four cool. */
        className="discovery-searchbar w-full !pl-9 !pr-8 py-3 !rounded-pill !bg-white border !border-s-border font-body text-s-ink placeholder:text-s-ink/40 transition-colors focus:outline-none focus:!border-s-border focus:!bg-white focus:!shadow-none"
      />
      {/* V3-D414: voice/mic removed (no voice feature). Clear (X) shows only while typing. */}
      {local && (
        <button
          onClick={() => handleChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/30 transition-colors duration-150 hover:text-s-ink-2"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
