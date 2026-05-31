"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Mic } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function DiscoverySearchBar({ value, onChange, placeholder = "Search styles...", onFocus, onBlur }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const [listening, setListening] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 300);
  };

  // V3-D397: voice input via the Web Speech API (Chrome/Edge/Safari). Fills the search with the transcript. No-op +
  // logged if unsupported — the mic still shows but does nothing rather than crashing.
  const startVoice = () => {
    const SR = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
    if (!SR) { console.error("[SearchBar] voice input unsupported in this browser"); return; }
    try {
      const rec = new SR();
      rec.lang = (typeof document !== "undefined" && document.documentElement.lang) || "de-CH";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        const transcript = e?.results?.[0]?.[0]?.transcript ?? "";
        if (transcript) handleChange(transcript);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      setListening(true);
      rec.start();
    } catch (err) {
      console.error("[SearchBar] voice input failed:", err);
      setListening(false);
    }
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
      {/* V3-D397: mic (voice input) when empty → clear (X) once typing, matching Pinterest's resting-vs-typing search. */}
      {local ? (
        <button onClick={() => handleChange("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/30 hover:text-s-ink/60 transition-colors duration-150">
          <X size={14} />
        </button>
      ) : (
        <button onClick={startVoice} aria-label="Voice search" className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150 ${listening ? "text-s-accent" : "text-s-ink/40 hover:text-s-ink/70"}`}>
          <Mic size={16} />
        </button>
      )}
    </div>
  );
}
