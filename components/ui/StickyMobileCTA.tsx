"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

export default function StickyMobileCTA() {
  const locale = useLocale();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-20 left-4 right-4 md:hidden z-40"
        >
          <div onClick={() => router.push(`/${locale}/coiffeur`)}>
            <InteractiveHoverButton
              text="Salons entdecken"
              className="w-full border-s-coral/20 shadow-surface"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
