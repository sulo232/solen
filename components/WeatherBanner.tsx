"use client";

import { useEffect, useState } from "react";
import { CloudRain, Snowflake, Thermometer, X } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

const CACHE_KEY = "solen_weather";
const DISMISS_KEY = "solen_weather_dismiss";
const CACHE_HOURS = 1;
const DISMISS_HOURS = 24;

interface WeatherData {
  code: number;
  temperature: number;
  timestamp: number;
}

type WeatherType = "rain" | "snow" | "cold" | null;

function getWeatherType(code: number, temp: number): WeatherType {
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (temp < 5) return "cold";
  return null;
}

const WEATHER_CONFIG = {
  rain: {
    Icon: CloudRain,
    text: "Regentag? Gönn dir was Gutes.",
    link: "spa",
  },
  snow: {
    Icon: Snowflake,
    text: "Schneewetter! Perfekt für Wellness.",
    link: "spa",
  },
  cold: {
    Icon: Thermometer,
    text: "Kalt draussen? Wärm dich auf mit Wellness.",
    link: "spa",
  },
};

export default function WeatherBanner() {
  const locale = useLocale();
  const [weatherType, setWeatherType] = useState<WeatherType>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check dismiss cache
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_HOURS * 60 * 60 * 1000) return;
    }
    setDismissed(false);

    // Check weather cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data: WeatherData = JSON.parse(cached);
        const elapsed = Date.now() - data.timestamp;
        if (elapsed < CACHE_HOURS * 60 * 60 * 1000) {
          setWeatherType(getWeatherType(data.code, data.temperature));
          return;
        }
      } catch { /* ignore */ }
    }

    // Fetch from Open-Meteo (Basel coordinates)
    fetch("https://api.open-meteo.com/v1/forecast?latitude=47.56&longitude=7.59&current=weather_code,temperature_2m")
      .then((r) => r.json())
      .then((data) => {
        const code = data?.current?.weather_code ?? 0;
        const temp = data?.current?.temperature_2m ?? 20;
        const cached: WeatherData = { code, temperature: temp, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        setWeatherType(getWeatherType(code, temp));
      })
      .catch(() => {});
  }, []);

  if (dismissed || !weatherType) return null;

  const config = WEATHER_CONFIG[weatherType];
  const { Icon } = config;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-card bg-s-coral/5 dark:bg-s-coral/10 border border-s-coral/15 dark:border-s-coral/20">
        <Icon size={18} className="text-s-coral shrink-0" />
        <p className="flex-1 text-sm text-dark/70 dark:text-s-dm-text/70 font-body">
          {config.text}
        </p>
        <Link
          href={`/${locale}/${config.link}`}
          className="shrink-0 px-3 py-1.5 rounded-button bg-s-coral text-white text-xs font-medium hover:bg-s-coral/90 transition-colors"
        >
          Entdecken
        </Link>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-dark/30 hover:text-dark/60 transition-colors"
          aria-label="Banner schliessen"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
