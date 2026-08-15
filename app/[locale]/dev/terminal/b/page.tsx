/**
 * Mockup-scope: whole-page
 *
 * Exists-check: npm run exists terminal , the terminal family only (Terminal.tsx, the sibling
 * a/ and c/ routes, and the chooser at ../page.tsx). Net-new: direction B, "attention bar".
 *
 * Dev-only preview route. Not linked from any production nav; blocked in production below.
 */
import { notFound } from "next/navigation";
import { loadTerminalData } from "../loadTerminalData";
import B from "./B";

export default async function TerminalBDirectionPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { salonName, bookings, queue, staff } = await loadTerminalData();

  return <B salonName={salonName} bookings={bookings} queue={queue} staff={staff} />;
}
