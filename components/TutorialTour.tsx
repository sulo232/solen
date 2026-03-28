"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const TOUR_KEY = "tutorial_completed";

/**
 * Streamlined tutorial: 3 driver.js tooltip steps with skip buttons.
 * Shows once on first visit (checks localStorage).
 */
export default function TutorialTour({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("tour") as any;
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
          overlayColor: "rgba(26,18,9,0.5)",
          stagePadding: 8,
          popoverClass: "solen-tour-popover",
          nextBtnText: t("next"),
          prevBtnText: t("prev"),
          doneBtnText: t("done"),
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
                title: t("step1Title"),
                description: t("step1Desc"),
                side: "bottom",
                align: "center",
                onNextClick: () => driverObj.moveNext(),
                onPrevClick: () => driverObj.movePrevious(),
              },
            },
            {
              element: "#tour-services",
              popover: {
                title: t("step2Title"),
                description: t("step2Desc"),
                side: "top",
                align: "start",
                onNextClick: () => driverObj.moveNext(),
                onPrevClick: () => driverObj.movePrevious(),
              },
            },
            {
              element: "#tour-last-minute",
              popover: {
                title: t("step3Title"),
                description: t("step3Desc"),
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
  }, [started, t]);

  // No visible DOM — driver.js manages its own overlay
  return null;
}
