"use client";

import { useEffect, useState } from "react";

const TOUR_KEY = "tutorial_completed";

/**
 * Streamlined tutorial: 3 driver.js tooltip steps with skip buttons.
 * Shows once on first visit (checks localStorage).
 */
export default function TutorialTour({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof localStorage !== "undefined" && localStorage.getItem(TOUR_KEY)) return;
    // Small delay to let the page render target elements
    const timer = setTimeout(() => setStarted(true), 600);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!started) return;
    let destroyed = false;

    (async () => {
      try {
        const { driver } = await import("driver.js");
        await import("driver.js/dist/driver.css");

        if (destroyed) return;

        const complete = () => {
          localStorage.setItem(TOUR_KEY, "true");
        };

        const driverObj = driver({
          showProgress: true,
          animate: true,
          overlayColor: "rgba(26,26,46,0.5)",
          stagePadding: 8,
          popoverClass: "solen-tour-popover",
          nextBtnText: "Weiter →",
          prevBtnText: "← Zurück",
          doneBtnText: "Los geht's!",
          showButtons: ["next", "previous", "close"],
          onDestroyStarted: () => {
            complete();
            driverObj.destroy();
          },
          onDestroyed: () => {
            complete();
          },
          steps: [
            {
              element: "#tour-search",
              popover: {
                title: "🔍 Suche",
                description:
                  "Suche nach Salons, Services oder Quartieren — alles auf einen Blick.",
                side: "bottom",
                align: "center",
                onNextClick: () => driverObj.moveNext(),
                onPrevClick: () => driverObj.movePrevious(),
              },
            },
            {
              element: "#tour-services",
              popover: {
                title: "✨ Solen Extras",
                description:
                  "Chat mit deinem Salon, Preise auf der Karte, Stempelkarten & Last-Minute Deals — nur bei Solen.",
                side: "top",
                align: "start",
                onNextClick: () => driverObj.moveNext(),
                onPrevClick: () => driverObj.movePrevious(),
              },
            },
            {
              element: "#tour-last-minute",
              popover: {
                title: "📅 Buche",
                description:
                  "Wähle deinen Wunschtermin und buche in wenigen Sekunden — auch Last-Minute mit Rabatt.",
                side: "top",
                align: "start",
                onNextClick: () => {
                  complete();
                  driverObj.destroy();
                },
                onPrevClick: () => driverObj.movePrevious(),
              },
            },
          ],
        });

        driverObj.drive();
      } catch {
        localStorage.setItem(TOUR_KEY, "true");
      }
    })();

    return () => {
      destroyed = true;
    };
  }, [started]);

  // No visible DOM — driver.js manages its own overlay
  return null;
}
