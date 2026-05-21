"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import PageTransition from "./PageTransition";

interface PageTransitionWrapperProps {
  children: ReactNode;
}

export default function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  const pathname = usePathname();
  return <PageTransition pathname={pathname}>{children}</PageTransition>;
}
