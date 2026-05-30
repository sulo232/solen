"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function DiscoverySearchBar({ value, onChange, placeholder = "Search styles...", onFocus, onBlur }: SearchBarProps) {
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
        placeholder={placeholder}
        /* V3-D346 (2026-05-29): input-focus accent KEPT (§1.5 allowed) — fixed malformed ring class to canonical pale ring.
           V3-D378 (2026-05-30): globals.css @layer base `input[type=search]` reset (specificity 0,1,1) was beating the
           pl/radius/bg utilities (0,1,0) → 12px icon/placeholder overlap + 8px radius + white bg. `!` modifiers restore the
           intended pill + sunken + pl-9. Keep the reset's 48px min-height + 16px font-size (touch target + iOS no-zoom). */
        className="w-full !pl-9 !pr-8 py-3 !rounded-pill !bg-s-bg-sunken border border-s-border font-body text-s-ink placeholder:text-s-ink/40 focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent-pale transition-colors"
      />
      {local && (
        <button onClick={() => handleChange("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/30 hover:text-s-ink/60 transition-colors duration-150">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
