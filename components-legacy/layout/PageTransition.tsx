"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_SOLEN } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  pathname: string;
}

export default function PageTransition({ children, pathname: _pathname }: PageTransitionProps) {
  // V3-D75-pt-fix: AnimatePresence + mode="wait" was blocking child mount in
  // some Next.js App Router hydration paths — useEffects in nested client
  // components (Typewriter, SearchBar matchMedia, MorphingDialog mount) were
  // silently no-op'ing. Reverting to a plain pass-through; the 200ms page-fade
  // on route change is dropped in favor of children actually rendering.
  return <>{children}</>;
}
