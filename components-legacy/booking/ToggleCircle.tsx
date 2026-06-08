'use client';

import { Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';

// Smoothly cross-fades the plus into the check instead of an instant icon swap.
export default function ToggleCircle({
  selected,
  size = 'lg',
}: {
  selected: boolean;
  size?: 'lg' | 'sm';
}) {
  const box = size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const icon = size === 'lg' ? 17 : 14;
  // Softer spring + quarter-turn so the plus spins smoothly into the check.
  const spring = { type: 'spring' as const, stiffness: 360, damping: 24, mass: 0.9 };
  return (
    <span
      className={`relative shrink-0 ${box} rounded-full grid place-items-center transition-colors duration-300 ${
        selected ? 'bg-s-ink text-white' : 'border border-s-border text-s-ink/50'
      }`}
      aria-hidden
    >
      <motion.span
        className="absolute inset-0 grid place-items-center"
        initial={false}
        animate={{ scale: selected ? 0 : 1, opacity: selected ? 0 : 1, rotate: selected ? 90 : 0 }}
        transition={spring}
      >
        <Plus size={icon} strokeWidth={2} />
      </motion.span>
      <motion.span
        className="absolute inset-0 grid place-items-center"
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0, rotate: selected ? 0 : -90 }}
        transition={spring}
      >
        <Check size={icon} strokeWidth={2.5} />
      </motion.span>
    </span>
  );
}
