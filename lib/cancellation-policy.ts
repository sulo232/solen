export function calculateRefund(
  paidAmount: number,
  cancellationFeePercent: number,
  cancellationWindowHours: number,
  appointmentStartsAt: Date
): { refundAmount: number; feeAmount: number; isWithinWindow: boolean } {
  const now = new Date();
  const hoursUntil = (appointmentStartsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithinWindow = hoursUntil < cancellationWindowHours;

  if (isWithinWindow) {
    return { refundAmount: 0, feeAmount: paidAmount, isWithinWindow: true };
  }

  const feeAmount = Math.round(paidAmount * (cancellationFeePercent / 100));
  const refundAmount = paidAmount - feeAmount;
  return { refundAmount, feeAmount, isWithinWindow: false };
}
