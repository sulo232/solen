"use client";

import { useEffect } from "react";
import { findNearestCity } from "@/lib/cities";
import { getPersistedCity, setPersistedCity } from "@/lib/city-cookie";

/**
 * Passively detect user's city from geolocation.
 * Only runs if no city is already set AND geolocation permission is already granted.
 * NEVER triggers a permission popup.
 */
export function useCityDetection() {
  useEffect(() => {
    // Skip if city already set
    if (getPersistedCity()) return;

    // Only auto-detect if permission is already granted (no popup!)
    if (!navigator.permissions) return;

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
            setPersistedCity(nearest);
          },
          () => {} // Silently fail
        );
      }
    }).catch(() => {}); // Silently fail
  }, []);
}
