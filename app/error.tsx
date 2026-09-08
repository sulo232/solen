"use client";

import { useEffect, useState } from "react";
import { detectLocaleFromPathname } from "@/lib/detect-locale";
import deMessages from "@/messages/de.json";

const { ui, errors } = deMessages;

// Outside the locale provider, resolve the existing message keys after hydration.
const DE_STRINGS = {
  title: ui.error.title,
  message: ui.error.defaultMessage,
  retry: ui.error.retry,
  home: errors["404_home"],
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [strings, setStrings] = useState(DE_STRINGS);
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  useEffect(() => {
    let active = true;
    const locale = detectLocaleFromPathname(window.location.pathname);
    setHomeHref(`/${locale}`);
    if (locale === "de") return;
    import(`@/messages/${locale}.json`)
      .then((mod) => {
        if (!active) return;
        const data = mod.default ?? mod;
        setStrings({
          title: data?.ui?.error?.title ?? DE_STRINGS.title,
          message: data?.ui?.error?.defaultMessage ?? DE_STRINGS.message,
          retry: data?.ui?.error?.retry ?? DE_STRINGS.retry,
          home: data?.errors?.["404_home"] ?? DE_STRINGS.home,
        });
      })
      .catch((err) => {
        console.error("[app/error.tsx] locale messages load failed:", err);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <span
        className="font-heading text-[clamp(64px,14vw,84px)] font-bold leading-none tracking-[-0.04em] bg-gradient-to-b from-s-ink from-30% to-[#BBBBBB] bg-clip-text text-transparent"
        aria-hidden
      >
        Uff.
      </span>
      <h1 className="mt-4 font-heading text-[clamp(19px,2.6vw,22px)] font-bold tracking-[-0.02em] text-s-ink">
        {strings.title}
      </h1>
      <p className="mx-auto mt-3 max-w-[320px] font-body text-[14.5px] leading-relaxed text-s-ink-2">
        {strings.message}
      </p>
      <div className="mt-7 flex flex-col items-center gap-4">
        <button
          onClick={reset}
          className="rounded-btn bg-s-ink px-7 py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97]"
        >
          {strings.retry}
        </button>
        <a href={homeHref} className="font-body text-[13.5px] font-semibold text-s-ink-2 transition-colors duration-150 hover:text-s-ink">
          {strings.home}
        </a>
      </div>
    </div>
  );
}
