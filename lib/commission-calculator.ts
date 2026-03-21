/**
 * Calculate platform commission and salon payout.
 * All amounts in cents (CHF).
 */
export function calculateCommission(
  totalAmount: number,
  ratePercent: number
): { platformFee: number; salonPayout: number } {
  const platformFee = Math.round(totalAmount * (ratePercent / 100));
  const salonPayout = totalAmount - platformFee;
  return { platformFee, salonPayout };
}

/**
 * Calculate staff commission from a booking.
 */
export function calculateStaffCommission(
  bookingAmount: number,
  staffCommissionPercent: number
): { staffPayout: number; salonKeeps: number } {
  const staffPayout = Math.round(bookingAmount * (staffCommissionPercent / 100));
  const salonKeeps = bookingAmount - staffPayout;
  return { staffPayout, salonKeeps };
}
