"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface UseScrollRevealOptions {
  /** IntersectionObserver threshold (0-1). Default: 0.15 */
  threshold?: number;
  /** Root margin to trigger earlier/later. Default: "0px 0px -40px 0px" */
  rootMargin?: string;
  /** Only trigger once. Default: true */
  once?: boolean;
}

/**
 * V4 Scroll-Triggered Reveal Hook
 *
 * Adds `.is-visible` class when element enters viewport.
 * Works with `reveal-on-scroll` and `heading-reveal` CSS classes.
 *
 * Usage:
 * ```tsx
 * const ref = useScrollReveal<HTMLDivElement>();
 * return <div ref={ref} className="reveal-on-scroll">...</div>
 * ```
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
): RefObject<T | null> {
  const { threshold = 0.15, rootMargin = "0px 0px -40px 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || (once && hasTriggered)) return;

    // Respect prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          setHasTriggered(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove("is-visible");
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, hasTriggered]);

  return ref;
}

/**
 * V4 Stagger Reveal - applies to container, children animate in sequence.
 * Use with `stagger-v4` CSS class on the container.
 */
export function useStaggerReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
): RefObject<T | null> {
  const { threshold = 0.1, rootMargin = "0px 0px -20px 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || (once && hasTriggered)) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("stagger-v4");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("stagger-v4");
          setHasTriggered(true);
          if (once) observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, hasTriggered]);

  return ref;
}
