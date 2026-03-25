"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DiscoverySearchBar({ value, onChange, placeholder = "Search styles..." }: SearchBarProps) {
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
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30" />
      <input
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-3 rounded-pill bg-s-bg-sunken dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.06] text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 dark:focus:border-s-coral transition-colors"
      />
      {local && (
        <button onClick={() => handleChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/30 hover:text-s-ink/60">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
