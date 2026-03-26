"use client";

import type { CitySlug } from "@/lib/cities";
import { isValidCitySlug } from "@/lib/cities";

const COOKIE_NAME = "solen-city";
const STORAGE_KEY = "solen-city";
const MAX_AGE_DAYS = 365;

/** Get the persisted city from cookie or localStorage */
export function getPersistedCity(): CitySlug | null {
  // 1. Try cookie
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (match && isValidCitySlug(match[1])) return match[1];
  }

  // 2. Fallback to localStorage
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidCitySlug(stored)) return stored as CitySlug;
  }

  return null;
}

/** Set the city in both cookie and localStorage */
export function setPersistedCity(slug: CitySlug): void {
  // Cookie (accessible server-side too)
  if (typeof document !== "undefined") {
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${slug};path=/;max-age=${maxAge};SameSite=Lax`;
  }

  // localStorage backup
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, slug);
  }
}

/** Clear the city cookie (revert to "all cities") */
export function clearPersistedCity(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
