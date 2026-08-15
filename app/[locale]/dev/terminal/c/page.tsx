/**
 * Mockup-scope: whole-page
 *
 * Exists-check: npm run exists terminal , the terminal family only (Terminal.tsx, the sibling
 * a/ and b/ routes, and the chooser at ../page.tsx). Net-new: direction C, "now and next".
 *
 * Dev-only preview route. Not linked from any production nav; blocked in production below.
 */
import { notFound } from "next/navigation";
import { loadTerminalData } from "../loadTerminalData";
import C from "./C";

export default async function TerminalCDirectionPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { salonName, bookings, queue, staff } = await loadTerminalData();

  return <C salonName={salonName} bookings={bookings} queue={queue} staff={staff} />;
}
