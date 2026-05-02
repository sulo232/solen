"use client";

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1 text-sm text-s-ink/50 px-4 py-1">
      <span>{name} tippt</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-s-ink/40 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-s-ink/40 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-s-ink/40 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}
