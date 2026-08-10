// Color constants for transactional / marketing emails (lib/email.ts,
// lib/email-templates/*.ts). Emails cannot use Tailwind classes, so every
// hex literal inside an email template string must come from here instead
// of being typed by hand. Values mirror the live LOCKFILE.md §1 tokens --
// if a token changes there, update it here too.
// See _design-system/LOCKFILE.md "Email surfaces".

export const EMAIL_COLORS = {
  ink: "#0A0A0A",         // s-ink DEFAULT
  ink2: "#6B6B6B",        // s-ink-2 / s-ink.secondary
  border: "#E4E4E7",      // s-border
  bgSunken: "#F4F4F5",    // s-bg.sunken
  warningBg: "#FDF6E7",   // s-warning.bg
  warningText: "#B45309", // s-warning.text
} as const;
