"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "solen_theme";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemPreference() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored || "system";
    setTheme(initial);
    applyTheme(initial);

    // Listen for OS preference changes when in "system" mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if ((localStorage.getItem(STORAGE_KEY) || "system") === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={toggle}
      className="p-1.5 min-h-10 min-w-10 flex items-center justify-center rounded-btn text-s-ink/50 hover:text-s-ink/80 dark:text-s-dm-text/50 dark:hover:text-s-dm-text/80 transition-colors"
      aria-label={isDark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"}
      title={theme === "system" ? "System" : theme === "dark" ? "Dunkel" : "Hell"}
    >
      {isDark ? (
        <Moon size={18} className="fill-current" />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}
