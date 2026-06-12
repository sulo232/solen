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
