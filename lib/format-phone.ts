import { useRef, useLayoutEffect, useCallback, type ChangeEvent } from "react";

/**
 * Live Swiss phone formatting for inputs (owner 2026-06-12: "as you type, automatic
 * spacing"): "0791234567" -> "079 123 45 67"; "+41791234567" -> "+41 79 123 45 67".
 * Keeps a single leading +, strips other non-digits, caps at CH lengths.
 */
export function formatSwissPhoneInput(raw: string): string {
  let v = raw.replace(/[^\d+]/g, "");
  if (v.startsWith("00")) v = "+" + v.slice(2);
  const plus = v.startsWith("+");
  const digits = v.replace(/\D/g, "");
  if (plus) {
    const cc = digits.slice(0, 2);
    const rest = digits.slice(2, 11);
    const parts = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5, 7), rest.slice(7, 9)].filter(Boolean);
    return ("+" + cc + (parts.length ? " " + parts.join(" ") : "")).trimEnd();
  }
  if (!digits.startsWith("0")) {
    // national part without the leading 0 (e.g. behind a +41 chip): 79 123 45 67
    const n = digits.slice(0, 9);
    return [n.slice(0, 2), n.slice(2, 5), n.slice(5, 7), n.slice(7, 9)].filter(Boolean).join(" ");
  }
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(" ");
}

/** A char formatSwissPhoneInput keeps (digit or the single leading +), the only chars whose
 *  relative order/count survives formatting, so they're what caret-mapping counts. */
const isSignificantPhoneChar = (ch: string) => /[\d+]/.test(ch);

/**
 * Caret-aware wrapper around formatSwissPhoneInput (ig2, 2026-07-16). formatSwissPhoneInput
 * rebuilds the WHOLE string from digits on every keystroke, so a plain
 * `setPhone(formatSwissPhoneInput(e.target.value))` throws the caret to the end every time,
 * editing mid-number is unusable. This maps the caret instead of guessing at it:
 *   1. Count the significant chars (digits + leading +) before the caret in the RAW pre-format
 *      value (works identically for typing, deletion, and paste, all three just hand us a new
 *      raw string plus a caret position already advanced or retreated by the browser).
 *   2. Format that raw value.
 *   3. Walk the formatted string and land right after the same significant-char count.
 * If formatting dropped some trailing significant chars (the CH-length cap), the caret clamps
 * to the end of the formatted string rather than overshooting.
 */
export function formatSwissPhoneWithCaret(
  raw: string,
  caretPos: number,
): { formatted: string; caret: number } {
  let significantBeforeCaret = 0;
  const boundedCaret = Math.max(0, Math.min(caretPos, raw.length));
  for (let i = 0; i < boundedCaret; i++) {
    if (isSignificantPhoneChar(raw[i])) significantBeforeCaret++;
  }
  const formatted = formatSwissPhoneInput(raw);
  if (significantBeforeCaret === 0) return { formatted, caret: 0 };
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (isSignificantPhoneChar(formatted[i])) {
      count++;
      if (count === significantBeforeCaret) return { formatted, caret: i + 1 };
    }
  }
  // Fewer significant chars survived formatting than preceded the caret (the CH-length cap
  // dropped some), land at the end rather than an out-of-range offset.
  return { formatted, caret: formatted.length };
}

/**
 * Reusable caret-preserving onChange for a controlled Swiss-phone <input> (ig2, 2026-07-16).
 * Both call sites (GuestBookingForm, PayConfirmStep) shared the exact same bug: onChange only
 * called setState(formatSwissPhoneInput(...)), so React's controlled re-render reset the caret
 * to the end on every keystroke. This hook is the ONE place that does the caret math (via
 * formatSwissPhoneWithCaret) plus the DOM restore: React commits the new formatted `value` to
 * the input first (which is when the browser resets the caret to the end), THEN this hook's
 * useLayoutEffect runs synchronously after that commit and moves the caret back to the mapped
 * position, before the next paint.
 *
 * Usage: attach the returned `inputRef` to the <input> and its `onChange` in place of a plain
 * `onChange={(e) => setValue(formatSwissPhoneInput(e.target.value))}`. `onFormatted` receives
 * both the formatted value (for setState) and the raw pre-format value (for callers, like
 * GuestBookingForm's `sync`, that also need the untouched typed text).
 */
export function usePhoneCaretInput(onFormatted: (formatted: string, raw: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  const onChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const raw = ev.target.value;
      const caretPos = ev.target.selectionStart ?? raw.length;
      const { formatted, caret } = formatSwissPhoneWithCaret(raw, caretPos);
      pendingCaret.current = caret;
      onFormatted(formatted, raw);
    },
    [onFormatted],
  );

  return { inputRef, onChange };
}
