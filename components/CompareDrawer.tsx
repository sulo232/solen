"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Clock } from "lucide-react";
import type { Salon } from "@/lib/types";

interface CompareDrawerProps {
  salons: Salon[];
  open: boolean;
  onClose: () => void;
}

export default function CompareDrawer({ salons, open, onClose }: CompareDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "15%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-glass"
            style={{ height: "85vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-heading font-bold text-lg text-dark">Salons vergleichen</h2>
              <button onClick={onClose} className="p-1.5 text-dark/40 hover:text-dark">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-5" style={{ maxHeight: "calc(85vh - 60px)" }}>
              <div className="grid grid-cols-2 gap-4">
                {salons.map((salon) => (
                  <div key={salon.id} className="bg-white rounded-card border border-gray-100 shadow-card p-4 space-y-3">
                    {/* Name + Rating */}
                    <div>
                      <h3 className="font-heading font-bold text-base text-dark">{salon.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star size={12} className="fill-coral text-coral" />
                        <span className="text-xs font-data font-medium text-dark">
                          {salon.average_rating?.toFixed(1) ?? "–"}
                        </span>
                        <span className="text-xs text-dark/30">
                          ({salon.review_count ?? 0} Bewertungen)
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    {salon.quartier && (
                      <div className="flex items-center gap-1.5 text-xs text-dark/50">
                        <MapPin size={12} className="text-teal shrink-0" />
                        {salon.quartier}
                      </div>
                    )}

                    {/* Categories */}
                    {salon.categories && salon.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {salon.categories.map((cat: string) => (
                          <span key={cat} className="px-2 py-0.5 rounded-pill bg-gray-50 text-[10px] text-dark/50 font-medium">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Opening hours */}
                    {salon.opening_hours && (
                      <div className="flex items-center gap-1.5 text-xs text-dark/50">
                        <Clock size={12} className="text-teal shrink-0" />
                        <span>Öffnungszeiten verfügbar</span>
                      </div>
                    )}

                    {/* CTA */}
                    <a
                      href={`/de/salon/${salon.slug}`}
                      className="block w-full text-center py-2 rounded-button bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition-colors"
                    >
                      Jetzt buchen
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
