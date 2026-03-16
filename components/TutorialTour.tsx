"use client";

import { useEffect } from "react";

const TOUR_KEY = "solen_tour_done";

/**
 * Phase 8 — First-time tutorial using driver.js
 * Triggers once after first login if localStorage flag is not set.
 * Props:
 *   isLoggedIn — only run after auth check resolves
 */
export default function TutorialTour({ isLoggedIn }: { isLoggedIn: boolean }) {
  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof localStorage !== "undefined" && localStorage.getItem(TOUR_KEY)) return;

    let cleanup: (() => void) | undefined;

    const startTour = async () => {
      const { driver } = await import("driver.js");
      await import("driver.js/dist/driver.css");

      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(26,26,46,0.5)",
        stagePadding: 8,
        popoverClass: "solen-tour-popover",
        nextBtnText: "Weiter →",
        prevBtnText: "← Zurück",
        doneBtnText: "Los geht's!",
        onDestroyStarted: () => {
          localStorage.setItem(TOUR_KEY, "1");
          driverObj.destroy();
        },
        steps: [
          {
            element: "#tour-search",
            popover: {
              title: "Salon oder Service suchen",
              description: "Suche nach Salons, Services oder Quartieren — alles auf einen Blick.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: "#tour-services",
            popover: {
              title: "Kategorien entdecken",
              description: "Tippe auf eine Kategorie für mehr — von Coiffeur bis Nail-Art.",
              side: "top",
              align: "start",
            },
          },
          {
            element: "#tour-last-minute",
            popover: {
              title: "Last-Minute Angebote",
              description: "Dringende Termine? Hier findest du freie Slots mit Rabatt.",
              side: "top",
              align: "start",
            },
          },
          {
            element: "#tour-messages",
            popover: {
              title: "Direkt chatten",
              description: "Schreib deinem Salon direkt — Fragen, Wünsche, alles hier.",
              side: "bottom",
              align: "end",
            },
          },
        ],
      });

      // Small delay so the page layout is settled
      const timer = setTimeout(() => driverObj.drive(), 800);
      cleanup = () => {
        clearTimeout(timer);
        driverObj.destroy();
      };
    };

    startTour();
    return () => cleanup?.();
  }, [isLoggedIn]);

  return null;
}
