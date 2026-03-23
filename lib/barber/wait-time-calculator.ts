/** Rounds-based wait time estimation for walk-in queues. */
export function estimateWaitMinutes(
  queuePositionsBefore: number,
  avgServiceMinutes: number,
  activeBarberCount: number,
  bufferMinutes: number = 5
): number {
  if (activeBarberCount <= 0) return 0;
  const rounds = Math.ceil(queuePositionsBefore / activeBarberCount);
  return rounds * (avgServiceMinutes + bufferMinutes);
}
