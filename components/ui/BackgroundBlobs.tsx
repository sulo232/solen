"use client";

interface BackgroundBlobsProps {
  variant?: "hero" | "section";
  className?: string;
}

export default function BackgroundBlobs({ variant = "hero", className = "" }: BackgroundBlobsProps) {
  if (variant === "section") {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
        <div className="absolute -top-20 -right-20 w-[250px] h-[250px] rounded-full bg-s-coral/10 blur-3xl animate-blob-float" />
        <div className="absolute -bottom-16 -left-16 w-[200px] h-[200px] rounded-full bg-s-amber/8 blur-3xl animate-blob-float-delayed" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-s-coral/15 blur-3xl animate-blob-float" />
      <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] rounded-full bg-s-amber/10 blur-3xl animate-blob-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-s-blue/5 blur-3xl animate-blob-float" />
    </div>
  );
}
