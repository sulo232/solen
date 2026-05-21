"use client";

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Hair texture icons
export const HairStraight: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M6 3v14M10 3v14M14 3v14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const HairWavy: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M6 3c0 2 1 3 1 5s-1 3-1 5 1 3 1 4M10 3c0 2 1 3 1 5s-1 3-1 5 1 3 1 4M14 3c0 2 1 3 1 5s-1 3-1 5 1 3 1 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const HairCurly: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M6 3c1 1 0 2 0 3s1 2 0 3-1 2 0 3 0 2 0 3M10 3c1 1 0 2 0 3s1 2 0 3-1 2 0 3 0 2 0 3M14 3c1 1 0 2 0 3s1 2 0 3-1 2 0 3 0 2 0 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const HairThick: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M5 4h10M5 8h10M5 12h10M5 16h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

export const HairFine: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M5 4h10M5 8h10M5 12h10M5 16h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export const HairLong: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M8 2v16M12 2v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M6 18h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const HairShort: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M8 6v8M12 6v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M6 14h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const HairDry: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M10 3v14M6 7l8 6M14 7l-8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

// Nail shape icons
export const NailAlmond: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M7 16c0-3 0-6 0-7 0-2 1-3 3-3s3 1 3 3c0 1 0 4 0 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M7 16c0 1 1.3 2 3 2s3-1 3-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const NailSquare: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <rect x="7" y="6" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.7"/>
  </svg>
);

export const NailCoffin: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M7.5 6h5l1 8h-7l1-8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 14h7v3h-7v-3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const NailStiletto: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M7 6l3 12 3-12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const NailRound: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M7 8v6c0 1.7 1.3 3 3 3s3-1.3 3-3V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M7 8c0-1 1.3-2 3-2s3 1 3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const NailGel: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M8 7h4v8c0 1.1-.9 2-2 2s-2-.9-2-2V7z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7c0-1.1.9-2 2-2s2 .9 2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <circle cx="10" cy="11" r="1.5" fill="currentColor" opacity="0.3"/>
  </svg>
);

// Skin type icons
export const SkinNormal: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M7 9h6M7 11h6M7 13h6" stroke="currentColor" strokeWidth="1.3" opacity="0.5"/>
  </svg>
);

export const SkinDry: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M6 8l2 2-2 2M14 8l-2 2 2 2M8 14l2-2 2 2" stroke="currentColor" strokeWidth="1.3" opacity="0.5"/>
  </svg>
);

export const SkinOily: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7"/>
    <circle cx="8" cy="9" r="1" fill="currentColor" opacity="0.4"/>
    <circle cx="12" cy="9" r="1" fill="currentColor" opacity="0.4"/>
    <circle cx="10" cy="12" r="1" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const SkinSensitive: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const SkinMixed: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.3" opacity="0.4"/>
  </svg>
);

// Gender preference icons
export const GenderFemale: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M10 11v6M7 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

export const GenderMale: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="9" cy="11" r="4" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M12 8l5-5M14 3h3v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GenderNeutral: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.3" opacity="0.5"/>
  </svg>
);

// Style vibe icons
export const StyleMinimal: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <rect x="5" y="5" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.7"/>
  </svg>
);

export const StyleNatural: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M10 3c-2 0-3 1-3 3v8c0 2 1 3 3 3s3-1 3-3V6c0-2-1-3-3-3z" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M8 8c.5-.5 1-.5 2-.5s1.5 0 2 .5" stroke="currentColor" strokeWidth="1.3" opacity="0.5"/>
  </svg>
);

export const StyleBold: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M6 4l8 12M14 4L6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const StyleEdgy: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M10 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1 3-6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);

// Icon mapping helper
export const beautyIconMap = {
  // Hair
  straight: HairStraight,
  wavy: HairWavy,
  curly: HairCurly,
  thick: HairThick,
  fine: HairFine,
  long: HairLong,
  short: HairShort,
  dry: HairDry,
  // Nails
  almond: NailAlmond,
  square: NailSquare,
  coffin: NailCoffin,
  stiletto: NailStiletto,
  round: NailRound,
  gel: NailGel,
  // Skin
  normal: SkinNormal,
  oily: SkinOily,
  sensitive: SkinSensitive,
  mixed: SkinMixed,
  // Gender
  female: GenderFemale,
  male: GenderMale,
  neutral: GenderNeutral,
  'no-preference': GenderNeutral,
  // Style
  minimal: StyleMinimal,
  natural: StyleNatural,
  bold: StyleBold,
  edgy: StyleEdgy,
} as const;
