"use client";

import { useEffect } from "react";
import { useFocusVisible } from "react-aria";

// Recovered approved page flag; React Aria already owns global input tracking
// for the shared primitives, so this bridge installs no parallel event tracker.
export default function InputModality() {
  const { isFocusVisible } = useFocusVisible();

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-input");
    root.dataset.input = isFocusVisible ? "keyboard" : "pointer";
    return () => {
      if (previous === null) root.removeAttribute("data-input");
      else root.setAttribute("data-input", previous);
    };
  }, [isFocusVisible]);

  return null;
}
