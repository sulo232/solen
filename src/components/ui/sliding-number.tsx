import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function SlidingNumber({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const [currentValue, setCurrentValue] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      // Small delay for effect
      const t = setTimeout(() => {
        setCurrentValue(value);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [value, isInView]);

  const valueStr = String(currentValue);
  const digits = valueStr.split('');

  return (
    <div ref={containerRef} className="flex items-center text-inherit font-inherit">
      {prefix && <span>{prefix}</span>}
      <div className="flex overflow-hidden relative">
        {digits.map((digit, i) => (
          <div key={`${i}-${digit}`} className="relative">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1,
                delay: i * 0.1
              }}
              className="px-[1px]"
            >
              {digit}
            </motion.div>
          </div>
        ))}
      </div>
      {suffix && <span>{suffix}</span>}
    </div>
  );
}
