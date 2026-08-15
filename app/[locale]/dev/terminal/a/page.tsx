/**
 * Mockup-scope: whole-page
 *
 * Exists-check: npm run exists terminal , the terminal family only (Terminal.tsx, the sibling
 * b/ and c/ routes, and the chooser at ../page.tsx). Net-new: direction A, "one stream".
 *
 * Dev-only preview route. Not linked from any production nav; blocked in production below.
 */
import { notFound } from "next/navigation";
import { loadTerminalData } from "../loadTerminalData";
import A from "./A";

export default async function TerminalADirectionPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { salonName, bookings, queue } = await loadTerminalData();

  return <A salonName={salonName} bookings={bookings} queue={queue} />;
}
