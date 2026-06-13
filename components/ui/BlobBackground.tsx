import React from 'react';

interface BlobBackgroundProps {
  zone?: 1 | 2; // 1 = Full Maximalist, 2 = Soft Maximalist (less clutter)
}

export default function BlobBackground({ zone = 1 }: BlobBackgroundProps) {
  const isZone2 = zone === 2;
  const opacityClass = isZone2 ? "opacity-50" : "opacity-100";

  return (
    <>
      <div 
        className={`fixed inset-0 pointer-events-none z-[-1] overflow-hidden transition-opacity duration-500 ${opacityClass}`} 
        aria-hidden="true"
      >
        {/* Coral Blob */}
        <div className="absolute w-[500px] h-[500px] sm:w-[640px] sm:h-[640px] -right-[20%] -top-[10%] rounded-full blur-[1px] bg-s-coral/15 dark:bg-s-coral/10 max-md:bg-s-coral/10 animate-blob-float" />
        
        {/* Blue Blob */}
        <div className="absolute w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] -left-[10%] -bottom-[10%] rounded-full blur-[1px] bg-s-blue/15 dark:bg-s-blue/10 max-md:bg-s-blue/10 animate-blob-float-delayed" />
        
        {/* Amber Blob */}
        <div className="absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] left-[45%] top-[15%] rounded-full blur-[1px] bg-s-amber/15 dark:bg-s-amber/10 max-md:bg-s-amber/10 animate-blob-float" />

        {/* Sage Blob for extra depth on larger screens */}
        <div className="hidden lg:block absolute w-[400px] h-[400px] right-[20%] bottom-[-5%] rounded-[70%_30%_50%_50%/40%_60%_40%_60%] blur-[1px] bg-s-sage/10 dark:bg-s-sage/5 animate-blob-float-delayed" />
      </div>

      {/* Grain overlay ONLY in Zone 1 (desktop only) */}
      {!isZone2 && (
        <div className="grain-overlay" />
      )}
    </>
  );
}
