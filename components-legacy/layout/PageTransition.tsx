"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_SOLEN } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  pathname: string;
}

export default function PageTransition({ children, pathname }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE_SOLEN }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
