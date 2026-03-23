/**
 * Calculate next infill date based on service's reminder_cycle_days.
 */
export function calculateNextInfill(
  lastBookingDate: Date,
  reminderCycleDays: number
): { reminderDate: Date; daysRemaining: number; isOverdue: boolean } {
  const reminderDate = new Date(lastBookingDate);
  reminderDate.setDate(reminderDate.getDate() + reminderCycleDays);
  const now = new Date();
  const daysRemaining = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { reminderDate, daysRemaining, isOverdue: daysRemaining < 0 };
}
