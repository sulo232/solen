"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * WaxingIcon — 3D wax strip icon with hover bounce animation
 */
export function WaxingIcon({
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
        src="/icons/category/waxing.png"
        alt="Waxing"
        width={128}
        height={128}
        priority
        className="w-full h-full"
      />
    </motion.div>
  );
}
