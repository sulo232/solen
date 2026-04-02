"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * BarberIcon — 3D barber pole icon with hover bounce animation
 */
export function BarberIcon({
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
        src="/icons/category/barbershop.png"
        alt="Barbershop"
        width={128}
        height={128}
        priority
        className="w-full h-full"
      />
    </motion.div>
  );
}
