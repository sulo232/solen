"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, User, Loader2 } from "lucide-react";

interface Client {
  user_id: string; // The ID from backend is user_id
  display_name: string;
}

interface ClientSelectorDropdownProps {
  salonId?: string;
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}

export default function ClientSelectorDropdown({ salonId, value, onChange, placeholder = "Kunden auswählen..." }: ClientSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!salonId || !isOpen) return;
    
    // Only fetch once
    if (clients.length > 0) return;

    setLoading(true);
    fetch(`/api/salon/clients?salon_id=${salonId}`)
      .then(res => res.json())
      .then(data => {
        if (data.clients) {
          setClients(data.clients);
        }
      })
      .catch((err) => console.error("[ClientSelectorDropdown] failed to load salon clients:", err))
      .finally(() => setLoading(false));
  }, [salonId, isOpen, clients.length]);

  const selectedClient = clients.find(c => c.user_id === value) || (value ? { user_id: value, display_name: "Loading/Unknown" } : null);
  
  const filtered = clients.filter(c => 
    c.display_name.toLowerCase().includes(search.toLowerCase()) || 
    c.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-sm" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] border bg-white dark:bg-s-dm-raised transition-[border-color,box-shadow] ${isOpen ? 'border-s-coral ring-2 ring-s-coral/10' : 'border-s-ink/[0.10] dark:border-white/10'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <User size={14} className="text-s-ink/40 dark:text-s-dm-text/40 shrink-0" />
          <span className={`text-xs truncate ${selectedClient ? 'text-s-ink dark:text-s-dm-text font-medium' : 'text-s-ink/40 dark:text-s-dm-text/40'}`}>
            {selectedClient ? `${selectedClient.display_name} (${selectedClient.user_id.split('-')[0]})` : placeholder}
          </span>
        </div>
        <ChevronDown size={14} className="text-s-ink/40 dark:text-s-dm-text/40" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 rounded-[12px] z-50 overflow-hidden" 
             style={{ boxShadow: "0 4px 20px rgba(26,18,9,.08)" }}>
          <div className="p-2 border-b border-s-ink/5 dark:border-white/5 flex items-center gap-2">
            <Search size={12} className="text-s-ink/40" />
            <input 
              autoFocus
              className="w-full text-xs bg-transparent focus:outline-none dark:text-s-dm-text"
              placeholder="Name oder ID suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="p-4 flex justify-center text-s-ink/40 dark:text-s-dm-text/40">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : filtered.length > 0 ? filtered.map((c) => (
              <button
                key={c.user_id}
                onClick={() => {
                  onChange(c.user_id);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 rounded-[8px] text-xs transition-colors flex justify-between items-center ${value === c.user_id ? 'bg-s-coral/10 text-s-coral font-bold' : 'hover:bg-s-ink/5 dark:hover:bg-white/5 text-s-ink dark:text-s-dm-text'}`}
              >
                <span className="truncate pr-2">{c.display_name}</span>
                <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 font-mono shrink-0">
                  {c.user_id.split('-').slice(0, 2).join('-')}
                </span>
              </button>
            )) : (
              <div className="p-3 text-center text-xs text-s-ink/40 dark:text-s-dm-text/40">Keine Kunden gefunden.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
