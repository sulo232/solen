/**
 * Smart visit cycle algorithm for barber rebooking predictions.
 * Uses weighted moving average (recent visits weighted more).
 * Weights: [1.5, 1.3, 1.1, 1.0, 0.9, 0.8, ...]
 * Ignores gaps > 120 days (inactive period).
 * Confidence: CV < 0.15 = high, < 0.3 = medium, else low.
 */
export function calculateVisitCycle(
  visitDates: Date[],
  minVisits = 3
): {
  avgCycleDays: number | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  nextDueDate: Date | null;
  daysOverdue: number;
} {
  if (visitDates.length < minVisits) {
    return { avgCycleDays: null, confidence: "insufficient", nextDueDate: null, daysOverdue: 0 };
  }

  const gaps: number[] = [];
  for (let i = 0; i < visitDates.length - 1; i++) {
    const gap = Math.round(
      (visitDates[i].getTime() - visitDates[i + 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gap > 0 && gap < 120) gaps.push(gap);
  }

  if (gaps.length < 2) {
    return { avgCycleDays: null, confidence: "insufficient", nextDueDate: null, daysOverdue: 0 };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  gaps.forEach((gap, i) => {
    const weight = Math.max(0.7, 1.5 - i * 0.2);
    weightedSum += gap * weight;
    weightTotal += weight;
  });
  const avgCycleDays = Math.round(weightedSum / weightTotal);

  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;
  const confidence = cv < 0.15 ? "high" : cv < 0.3 ? "medium" : "low";

  const nextDueDate = new Date(visitDates[0]);
  nextDueDate.setDate(nextDueDate.getDate() + avgCycleDays);

  const daysOverdue = Math.max(
    0,
    Math.round((new Date().getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return { avgCycleDays, confidence, nextDueDate, daysOverdue };
}
