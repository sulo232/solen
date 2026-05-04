"use client";

import React, { createContext, useContext, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
  animate: true,
});

export function useSidebar() {
  return useContext(SidebarContext);
}

interface SidebarProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}

export function Sidebar({ children, open: controlledOpen, setOpen: controlledSetOpen, animate = true }: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarBody({ children, className }: SidebarBodyProps) {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.aside
      className={cn(
        "hidden md:flex flex-col fixed left-0 top-0 h-full w-[240px] bg-s-bg-raised border-r border-s-ink/[0.06] z-30 overflow-hidden",
        className
      )}
    >
      {children}
    </motion.aside>
  );
}

interface SidebarLinkData {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarLinkProps {
  link: SidebarLinkData;
  active?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
  className?: string;
}

export function SidebarLink({ link, active, onClick, badge, className }: SidebarLinkProps) {
  const { open, animate } = useSidebar();

  return (
    <Link
      href={link.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-input text-sm font-medium transition-colors mb-0.5 relative group",
        active ? "text-s-coral" : "text-s-ink/60 hover:bg-s-bg-surface hover:text-s-ink",
        className
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute inset-0 rounded-input bg-s-coral/10"
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        />
      )}
      <span className="relative z-10 shrink-0">{link.icon}</span>
      <AnimatePresence>
        <motion.span
          className="relative z-10 flex-1 overflow-hidden whitespace-nowrap"
        >
          {link.label}
        </motion.span>
      </AnimatePresence>
      {badge && <span className="relative z-10 ml-auto">{badge}</span>}
    </Link>
  );
}
