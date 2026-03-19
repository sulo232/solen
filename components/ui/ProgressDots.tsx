"use client";

interface ProgressDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

export default function ProgressDots({ total, current, onDotClick }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < current;
        const isCurrent = i === current;
        return (
          <button
            key={i}
            onClick={() => isCompleted && onDotClick?.(i)}
            disabled={!isCompleted}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isCurrent
                ? "bg-s-coral scale-125"
                : isCompleted
                ? "bg-s-coral/50 cursor-pointer hover:bg-s-coral/70"
                : "bg-s-sand"
            }`}
            aria-label={`Step ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
