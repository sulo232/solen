import { useState, useEffect, useRef } from "react";
import { Search, Calendar, MapPin, Heart, Clock, ChevronRight } from "lucide-react";

const ACTIONS = [
  { icon: Search, label: "Salon finden", sub: "Salons in der Nähe entdecken", end: "Entdecken", action: "home" },
  { icon: Calendar, label: "Termin buchen", sub: "Einen Besuch planen", end: "Buchung", action: "discover" },
  { icon: Clock, label: "Meine Buchungen", sub: "Bevorstehende & vergangene", end: "Profil", action: "bookings" },
  { icon: Heart, label: "Meine Favoriten", sub: "Gespeicherte Salons", end: "Profil", action: "profile" },
  { icon: MapPin, label: "Salon in meiner Nähe", sub: "Meinen Standort verwenden", end: "Standort", action: "locate" }
];

export function ActionSearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter actions based on search
  const filtered = ACTIONS.filter(a => 
    (a.label + " " + a.sub).toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.classList.remove("modal-open");
      setQuery("");
    }
  }, [isOpen]);

  // Execute the action by triggering Vanilla JS router functions globally
  const handleAction = (actionStr: string) => {
    setIsOpen(false);
    setTimeout(() => {
      if (actionStr === "locate") {
        // @ts-ignore
        if (window.geoLocateMe) window.geoLocateMe();
      } else if (actionStr === "bookings" || actionStr === "profile") {
        // @ts-ignore
        if (window.currentUser) { window.showPage(actionStr); } else { window.openAuth('login'); }
      } else {
        // @ts-ignore
        if (window.showPage) window.showPage(actionStr);
        if (actionStr === "home") {
          setTimeout(() => {
            const s = document.getElementById("discoverySection");
            if (s) s.scrollIntoView({ behavior: "smooth" });
          }, 200);
        }
      }
    }, 150);
  };

  return (
    <>
      <div 
        className="hero-search cursor-pointer hover:shadow-lg transition-all"
        onClick={() => setIsOpen(true)}
      >
        <div className="hero-search-field">
          <Search size={18} className="text-[#9B1D30]" />
          <div className="hero-search-field-text">
            <span className="hero-search-field-label">Wonach suchst du?</span>
            <span className="hero-search-field-value text-gray-400">Salon, Service, Ort...</span>
          </div>
        </div>
        <button className="hero-search-submit flex items-center justify-center gap-2">
          Suchen <span className="opacity-70 text-sm border whitespace-nowrap border-white/30 rounded px-1.5 py-0.5 ml-1 hidden sm:inline-block">⌘ K</span>
        </button>
      </div>

      {/* Modern Command Palette Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1200] flex items-start justify-center pt-20 sm:pt-32 px-4 isolate">
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <Search className="text-gray-400" size={20} />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 placeholder-gray-400"
                placeholder="Aktion suchen..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Keine Aktionen gefunden für "{query}"
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filtered.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAction(item.action)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 text-left group transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-[#9B1D30]/10 group-hover:text-[#9B1D30] transition-colors shrink-0">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-[15px] group-hover:text-[#9B1D30] transition-colors">
                            {item.label}
                          </div>
                          <div className="text-[13px] text-gray-500 truncate">
                            {item.sub}
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 group-hover:text-[#9B1D30]/70 flex items-center gap-1 shrink-0">
                          {item.end}
                          <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
