"use client";

import React, { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem {
  title: string;
  icon: LucideIcon;
  href?: string;
  type?: undefined;
}

export interface SeparatorItem {
  type: "separator";
}

export type ExpandableTabsItem = TabItem | SeparatorItem;

interface ExpandableTabsProps extends React.ComponentPropsWithoutRef<"div"> {
  tabs: ExpandableTabsItem[];
  activeColor?: string;
  className?: string;
  onTabChange?: (index: number | null) => void;
  activeIndex?: number | null;
}

const buttonVariants = {
  initial: { gap: 0, paddingLeft: 12, paddingRight: 12 },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? 8 : 0,
    paddingLeft: isSelected ? 16 : 12,
    paddingRight: isSelected ? 16 : 12,
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { type: "spring", bounce: 0.15, duration: 0.5 };

export default function ExpandableNavTabs({
  tabs,
  activeColor = "text-s-coral",
  className,
  onTabChange,
  activeIndex: controlledIndex,
  ...rest
}: ExpandableTabsProps) {
  const [internalIndex, setInternalIndex] = useState<number | null>(null);
  const activeIndex = controlledIndex ?? internalIndex;
  const outsideRef = useRef<HTMLDivElement>(null!);

  useOnClickOutside(outsideRef, () => {
    if (controlledIndex === undefined) setInternalIndex(null);
  });

  const handleSelect = useCallback(
    (index: number) => {
      if (controlledIndex === undefined) setInternalIndex(index);
      onTabChange?.(index);
    },
    [controlledIndex, onTabChange]
  );

  return (
    <div
      ref={outsideRef}
      role="navigation"
      {...rest}
      className={cn(
        "flex items-center gap-1 rounded-pill border border-s-ink/10 bg-white p-1.5 shadow-surface",
        className
      )}
    >
      {tabs.map((tab, idx) => {
        if ("type" in tab && tab.type === "separator") {
          return (
            <div key={`sep-${idx}`} className="h-5 w-px bg-s-sand/60 mx-0.5" />
          );
        }

        const isSelected = activeIndex === idx;
        const Icon = (tab as TabItem).icon;

        return (
          <motion.button
            key={(tab as TabItem).title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(idx)}
            transition={transition}
            aria-current={isSelected ? "page" : undefined}
            className={cn(
              "relative flex items-center rounded-btn py-2.5 text-sm font-medium font-body transition-colors",
              isSelected ? `${activeColor} bg-s-coral/10` : "text-s-ink/40 hover:text-s-ink/60:text-s-dm-text/60"
            )}
          >
            <Icon size={18} />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap text-xs"
                >
                  {(tab as TabItem).title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
