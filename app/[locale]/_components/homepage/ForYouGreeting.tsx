"use client";

// ForYouGreeting (V3-D348) — a light personal opener at the top of the feed for
// logged-in users ("Willkommen zurück, Sarah"). Renders null for logged-out /
// pre-hydration, so the cached homepage is unchanged for anonymous visitors.

import { useCustomerPrefs, type CustomerPrefs } from "./useCustomerPrefs";

export function ForYouGreetingView({ prefs }: { prefs: CustomerPrefs | null }) {
  if (!prefs) return null;
  const hasPicks = prefs.categories.length > 0;
  return (
    <section aria-label="Willkommen" className="relative z-[1]">
      <div className="mx-auto max-w-[1280px] px-6 pt-1 pb-2 md:px-4">
        <h2 className="font-display text-[clamp(20px,2.4vw,24px)] font-semibold leading-[1.2] tracking-[-0.015em] text-s-ink">
          {prefs.name ? `Willkommen zurück, ${prefs.name}` : "Willkommen zurück"}
        </h2>
        <p className="mt-1 text-[14px] leading-[1.4] text-s-ink-2">
          {hasPicks
            ? "Deine Startseite — auf deine Vorlieben zugeschnitten."
            : "Schön, dass du wieder da bist."}
        </p>
      </div>
    </section>
  );
}

export default function ForYouGreeting() {
  const prefs = useCustomerPrefs();
  return <ForYouGreetingView prefs={prefs} />;
}
