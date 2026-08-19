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
  /** 2026-08-01 (Inspo tap-to-edit): this bar now only mounts once the resting HomeSearchPill
      is tapped (page.tsx), so a fresh mount needs to grab the keyboard itself, the native
      "autoFocus" HTML attribute does that on mount, no ref plumbing needed. */
  autoFocus?: boolean;
}

export default function DiscoverySearchBar({ value, onChange, placeholder = "Search styles...", onFocus, onBlur, onSubmit, autoFocus }: SearchBarProps) {
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
      {/* Owner 2026-08-01, "I only want the search bar to be bigger ... make the size of the search
          bar also the same": this bar now carries the SAME geometry as the home pill
          (HomeSearchPill / SearchTemplate: 66px tall, 18px icon at 14px inset, 16px medium label,
          hairline + the 0 2px 8px 7% lift), instead of a second pill stacked above it. */}
      <Search size={18} strokeWidth={1.9} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-s-ink-2" /> {/* mockup-ok: search-a.html Inspo tab, .sa-pill leading icon, copied 1:1 */}
      <input
        type="search"
        value={local}
        autoFocus={autoFocus}
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
        /* mockup-ok: search-a.html Inspo tab, .sa-pill , 66px / 16px medium / the home lift, 1:1 */
        className="discovery-searchbar h-[66px] w-full !pl-[44px] !pr-8 !rounded-pill !bg-white border !border-s-border font-body text-[16px] font-medium text-s-ink shadow-[0_2px_8px_0_rgba(0,0,0,0.07)] placeholder:font-medium placeholder:text-s-ink-2 transition-colors focus:outline-none focus:!border-s-border focus:!bg-white focus:!shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]" /* mockup-ok: same resting lift held on focus, so the pill does not jump and no halo returns */
      />
      {/* V3-D414: voice/mic removed (no voice feature). Clear (X) shows only while typing. */}
      {local && (
        <button
          onClick={() => handleChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/30 transition-colors duration-150 hover:text-s-ink-2"
        >
          <X size={14} strokeWidth={1.6} />
        </button>
      )}
    </div>
  );
}
