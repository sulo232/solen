"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Salon } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import CompareBar from "./CompareBar";
import CompareDrawer from "./CompareDrawer";
import { useLocale } from "next-intl";

interface CompareContextValue {
  comparedSalons: Salon[];
  toggleCompare: (salon: Salon) => void;
  removeSalon: (id: string) => void;
  clearCompare: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  isCompareOpen: boolean;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

function CompareProviderInner({ children }: { children: React.ReactNode }) {
  const [comparedSalons, setComparedSalons] = useState<Salon[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();

  // Load salons from URL on initial load if present, OR from localStorage
  useEffect(() => {
    async function loadHydratedSalons() {
      const idsParam = searchParams.get("compare");
      
      if (idsParam) {
        // Hydrate from URL
        try {
          const res = await fetch(`/api/salons?ids=${encodeURIComponent(idsParam)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
              setComparedSalons(data.items);
              setIsDrawerOpen(true);
              return; // skip localstorage if URL dictates compare
            }
          }
        } catch (err) {
          console.error("Failed to load compare salons from URL", err);
        }
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("solen_compare_items");
        if (stored) {
          setComparedSalons(JSON.parse(stored));
        }
      } catch (err) {
         // ignore parse errors
      } finally {
        setIsLoading(false);
      }
    }
    
    loadHydratedSalons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isLoading) {
      if (comparedSalons.length > 0) {
        localStorage.setItem("solen_compare_items", JSON.stringify(comparedSalons));
      } else {
        localStorage.removeItem("solen_compare_items");
      }
    }
  }, [comparedSalons, isLoading]);

  const toggleCompare = (salon: Salon) => {
    setComparedSalons(prev => {
      const exists = prev.some(s => s.id === salon.id);
      if (exists) return prev.filter(s => s.id !== salon.id);
      // max 4 salons
      if (prev.length >= 4) {
        return [...prev.slice(1), salon];
      }
      return [...prev, salon];
    });
  };

  const removeSalon = (id: string) => setComparedSalons(prev => prev.filter(s => s.id !== id));
  
  const clearCompare = () => {
    setComparedSalons([]);
    setIsDrawerOpen(false);
    
    // remove ?compare query param if present
    const idsParam = searchParams.get("compare");
    if (idsParam) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("compare");
      router.replace(`?${newSearchParams.toString()}`);
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  
  const isInCompare = (id: string) => comparedSalons.some(s => s.id === id);

  return (
    <CompareContext.Provider value={{
      comparedSalons,
      toggleCompare,
      removeSalon,
      clearCompare,
      openDrawer,
      closeDrawer,
      isCompareOpen: isDrawerOpen,
      isInCompare
    }}>
      {children}
      {comparedSalons.length > 0 && !isDrawerOpen && (
        <CompareBar salons={comparedSalons} onRemove={removeSalon} onCompare={openDrawer} />
      )}
      <CompareDrawer salons={comparedSalons} open={isDrawerOpen} onClose={closeDrawer} />
    </CompareContext.Provider>
  );
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<>{children}</>}>
      <CompareProviderInner>
        {children}
      </CompareProviderInner>
    </React.Suspense>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider");
  return ctx;
}
