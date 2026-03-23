import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Calendar, User, Heart } from "lucide-react";

interface Tab {
  title: string;
  icon: any;
  action: string;
}

const defaultTabs: Tab[] = [
  { title: "Entdecken", icon: Search, action: "home" },
  { title: "Buchung", icon: Calendar, action: "discover" },
  { title: "Favoriten", icon: Heart, action: "profile" },
  { title: "Profil", icon: User, action: "bookings" },
];

export function ExpandableTabs({ tabs = defaultTabs }: { tabs?: Tab[] }) {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleSelect = (idx: number, actionStr: string) => {
    setActiveTab(idx);
    
    // Trigger vanilla JS routing
    setTimeout(() => {
      // @ts-ignore
      if (actionStr === "profile" || actionStr === "bookings") {
        // @ts-ignore
        if (window.currentUser) { window.showPage(actionStr); } else { window.openAuth('login'); }
      } else {
        // @ts-ignore
        if (window.showPage) window.showPage(actionStr);
      }
    }, 100);
  };

  return (
    <div className="flex bg-white/80 backdrop-blur-xl border border-gray-200/50 p-1.5 rounded-2xl shadow-lg gap-1 items-center mx-auto max-w-fit pointer-events-auto">
      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeTab === idx;
        
        return (
          <button
            key={tab.title}
            onClick={() => handleSelect(idx, tab.action)}
            className={cn(
              "relative flex items-center h-10 px-4 rounded-xl transition-all duration-300",
              isActive ? "text-[#9B1D30]" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-bg"
                className="absolute inset-0 bg-[#9B1D30]/10 rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            
            <Icon size={18} className="relative z-10 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
            
            <AnimatePresence>
              {isActive && (
                <motion.span
                  initial={{ width: 0, opacity: 0, paddingLeft: 0 }}
                  animate={{ width: "auto", opacity: 1, paddingLeft: 8 }}
                  exit={{ width: 0, opacity: 0, paddingLeft: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="relative z-10 font-semibold text-sm whitespace-nowrap overflow-hidden"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
