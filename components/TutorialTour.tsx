"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Calendar, MessageCircle, Sparkles, X, ChevronRight, ChevronLeft } from "lucide-react";

const TOUR_KEY = "solen_tour_done";

const WELCOME_SLIDES = [
  {
    Icon: Scissors,
    title: "Willkommen bei Solen",
    description: "Entdecke die besten Salons in Basel — Coiffeur, Nails, Spa und mehr.",
    color: "text-teal",
    bg: "bg-teal/10",
  },
  {
    Icon: Calendar,
    title: "Einfach buchen",
    description: "Wähle deinen Wunschtermin und buche in wenigen Sekunden online.",
    color: "text-coral",
    bg: "bg-coral/10",
  },
  {
    Icon: MessageCircle,
    title: "Direkt chatten",
    description: "Schreib deinem Salon direkt — für Fragen, Wünsche oder Beratung.",
    color: "text-teal",
    bg: "bg-teal/10",
  },
  {
    Icon: Sparkles,
    title: "Last-Minute Deals",
    description: "Schnapp dir kurzfristig freie Termine mit exklusiven Rabatten.",
    color: "text-coral",
    bg: "bg-coral/10",
  },
];

/**
 * Enhanced tutorial: 4 full-screen welcome slides → tooltip tour via driver.js
 * Triggers once after first login if localStorage flag is not set.
 */
export default function TutorialTour({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof localStorage !== "undefined" && localStorage.getItem(TOUR_KEY)) return;
    setShowWelcome(true);
  }, [isLoggedIn]);

  const handleSkip = () => {
    setShowWelcome(false);
    localStorage.setItem(TOUR_KEY, "1");
  };

  const handleNext = () => {
    if (slideIndex < WELCOME_SLIDES.length - 1) {
      setSlideIndex((i) => i + 1);
    } else {
      setShowWelcome(false);
      startTooltipTour();
    }
  };

  const handlePrev = () => {
    if (slideIndex > 0) setSlideIndex((i) => i - 1);
  };

  const startTooltipTour = async () => {
    try {
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

      setTimeout(() => driverObj.drive(), 400);
    } catch {
      localStorage.setItem(TOUR_KEY, "1");
    }
  };

  const slide = WELCOME_SLIDES[slideIndex];

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center px-6"
        >
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 p-2 rounded-full text-dark/40 hover:text-dark/70 hover:bg-gray-100 transition-colors"
            aria-label="Tutorial überspringen"
          >
            <X size={20} />
          </button>

          {/* Slide content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center max-w-sm"
            >
              <div className={`w-20 h-20 rounded-2xl ${slide.bg} flex items-center justify-center mb-6`}>
                <slide.Icon size={36} className={slide.color} />
              </div>
              <h2 className="font-heading font-bold text-2xl text-dark mb-3">{slide.title}</h2>
              <p className="font-body text-dark/60 text-base leading-relaxed">{slide.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-10">
            {WELCOME_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === slideIndex ? "w-6 bg-teal" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 mt-8">
            {slideIndex > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2.5 rounded-button text-sm font-body font-medium text-dark/50 hover:text-dark/70 transition-colors"
              >
                <ChevronLeft size={16} />
                Zurück
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-6 py-2.5 rounded-button bg-teal text-white text-sm font-body font-medium hover:bg-teal-dark transition-colors shadow-teal-glow"
            >
              {slideIndex < WELCOME_SLIDES.length - 1 ? "Weiter" : "Tour starten"}
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
