"use client";

import { useRef } from "react";
import Link from "next/link";

const MOCK_DISCOVER_ITEMS = [
  { id: "1", src: "/assets/placeholder/discover-1.jpg", alt: "Balayage" },
  { id: "2", src: "/assets/placeholder/discover-2.jpg", alt: "Nail Art" },
  { id: "3", src: "/assets/placeholder/discover-3.jpg", alt: "Barber Fade" },
  { id: "4", src: "/assets/placeholder/discover-4.jpg", alt: "Makeup Look" },
  { id: "5", src: "/assets/placeholder/discover-5.jpg", alt: "Spa Day" },
  { id: "6", src: "/assets/placeholder/discover-6.jpg", alt: "Hair Coloring" },
  { id: "7", src: "/assets/placeholder/discover-7.jpg", alt: "Manicure" },
  { id: "8", src: "/assets/placeholder/discover-8.jpg", alt: "Beard Trim" },
  { id: "9", src: "/assets/placeholder/discover-1.jpg", alt: "Wedding Makeup" },
  { id: "10", src: "/assets/placeholder/discover-2.jpg", alt: "Facial" },
];

export default function DiscoverCarousel({ locale }: { locale: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // We rely on CSS snap to keep the UX smooth.
  // The "middle is big" will be achieved with a simple hover scale for now,
  // or via scroll-driven animations if deployed on modern browsers.
  
  return (
    <div className="w-full relative py-8 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 md:px-12 pb-8 pt-4 hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {MOCK_DISCOVER_ITEMS.map((item, index) => (
          <Link
            key={item.id}
            href={`/${locale}/discover?id=${item.id}`}
            className="shrink-0 snap-center group relative block"
          >
            {/* 3D rotation and scale to keep the "bouncy, playful" vibe the user liked */}
            <div className={`
              w-44 h-64 md:w-56 md:h-80 rounded-[20px] overflow-hidden 
              shadow-warm-sm group-hover:shadow-warm-lg transition-all duration-500
              transform group-hover:-translate-y-2 group-hover:scale-[1.03]
              ${index % 2 === 0 ? "rotate-2 group-hover:-rotate-1" : "-rotate-2 group-hover:rotate-1"}
            `}>
              <div className="absolute inset-0 bg-s-ink/5 dark:bg-black/20 z-10 group-hover:bg-transparent transition-colors duration-300" />
              <img 
                src={item.src} 
                alt={item.alt} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback for missing mock images
                  e.currentTarget.src = "/assets/placeholder/discover-1.jpg";
                }}
              />
            </div>
          </Link>
        ))}

        {/* 11th item: "Go to Entdecken" card */}
        <Link
          href={`/${locale}/discover`}
          className="shrink-0 snap-center group relative block"
        >
          <div className="w-44 h-64 md:w-56 md:h-80 rounded-[20px] overflow-hidden bg-s-coral/10 dark:bg-s-coral/5 border-2 border-dashed border-s-coral/30 shadow-warm-sm group-hover:shadow-warm-md group-hover:-translate-y-2 group-hover:border-s-coral transition-all duration-300 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-s-coral text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <h3 className="font-display text-xl text-s-ink dark:text-s-dm-text leading-tight group-hover:text-s-coral transition-colors">
              Alle entdecken
            </h3>
            <p className="text-xs font-body text-s-ink/60 dark:text-s-dm-text/60 mt-2">
              Lass dich von tausenden Styles inspirieren
            </p>
          </div>
        </Link>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
