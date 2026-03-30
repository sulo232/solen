"use client";

import React from 'react';
import type { SalonCategory } from "@/lib/types";

export interface CategoryIconProps {
  className?: string;
  size?: number | string;
}

export const CoiffeurIcon: React.FC<CategoryIconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

export const BarbershopIcon: React.FC<CategoryIconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 4h8"/>
    <path d="M8 20h8"/>
    <rect x="9" y="4" width="6" height="16" rx="1"/>
    <path d="M9 8l6-4"/>
    <path d="M9 14l6-4"/>
    <path d="M9 20l6-4"/>
  </svg>
);

export const NailsIcon: React.FC<CategoryIconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 9h6v3H9z"/>
    <path d="M10 4h4v5h-4z"/>
    <path d="M7 15c0-2 2-3 5-3s5 1 5 3v4c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-4z"/>
    <path d="M12 16v-1"/>
    <path d="M11 4V3a1 1 0 0 1 2 0v1"/>
    <path d="M8 12h8"/>
  </svg>
);

export const SpaIcon: React.FC<CategoryIconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-3" />
    <path d="M12 19c-3-1-6-4-6-8 0-3.5 2-5 3.5-5S12 8 12 11c0-3 1-5 2.5-5S18 7.5 18 11c0 4-3 7-6 8z" />
    <path d="M4.5 15c-1.5 0-2.5-1-2.5-2.5C2 9.5 5.5 8 6 8s2.5.5 3 2.5" />
    <path d="M19.5 15c1.5 0 2.5-1 2.5-2.5C22 9.5 18.5 8 18 8s-2.5.5-3 2.5" />
    <path d="M12 6V3" />
  </svg>
);

export const MakeupIcon: React.FC<CategoryIconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 13h6v8H9z"/>
    <path d="M10 13V7l2-4 2 4v6"/>
    <path d="M7 21h10"/>
    <path d="M9 17h6"/>
  </svg>
);

export const WaxingIcon: React.FC<CategoryIconProps> = ({ className, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 4s-4 0-8 3C8 10 4 16 3 21c2 0 6-2 9-5 4-4 8-10 8-12z"/>
    <path d="M12 16L3 21"/>
    <path d="M11 11l4-4"/>
    <path d="M15 15l4-4"/>
    <path d="M8 14l4-4"/>
  </svg>
);

export const categoryIconMap: Record<SalonCategory, React.FC<CategoryIconProps>> = {
  coiffeur: CoiffeurIcon,
  barbershop: BarbershopIcon,
  nails: NailsIcon,
  spa: SpaIcon,
  makeup: MakeupIcon,
  waxing: WaxingIcon,
};
