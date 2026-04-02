"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * SpaIcon — 3D lotus flower icon with hover bounce animation
 */
export function SpaIcon({
  animate = false,
  className = "",
}: { animate?: boolean; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      whileHover={{ scale: animate ? 1.08 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`inline-flex ${className}`}
    >
      <Image
        src="/icons/category/spa.png"
        alt="Spa"
        width={128}
        height={128}
        priority
        className="w-full h-full"
      />
    </motion.div>
  );
}
