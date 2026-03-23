import { sendEmail, EmailLocale } from './email';
import { createAdminSupabaseClient } from './supabase';

import {
  bookingPendingApprovalEmail,
  bookingApprovedEmail,
  bookingRejectedEmail,
  bookingModifiedEmail,
  noShowChargeEmail,
  lateCancellationFeeEmail,
  refundProcessedEmail,
  newReviewEmail,
  reviewResponseEmail,
  reviewFlaggedEmail,
  accountWarningEmail,
  accountSuspensionEmail,
  payoutCompletedEmail,
  payoutFailedEmail,
  termsChangedEmail,
  salonStrikeEmail
} from './email-templates/audit-notifications';
import { bookingConfirmation, bookingCancellation } from './email';

// Supabase Admin client for backend operations
const supabaseAdmin = createAdminSupabaseClient();

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_pending'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_modified'
  | 'booking_cancelled_by_customer'
  | 'booking_cancelled_by_salon'
  | 'no_show_charge'
  | 'late_cancellation_fee'
  | 'refund_processed'
  | 'new_review'
  | 'review_response'
  | 'review_flagged'
  | 'account_warning'
  | 'account_suspension'
  | 'payout_completed'
  | 'payout_failed'
  | 'ts_changes'
  | 'salon_strike';

export async function sendNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  emailParams?: {
    to: string;
    locale?: EmailLocale;
    vars: any;
  };
}) {
  // 1. Insert in-app notification
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data || {}
      });
      
    if (error) {
      console.error('[sendNotification] Error inserting into DB:', error);
    }
  } catch (err) {
    console.error('[sendNotification] Exception inserting into DB:', err);
  }

  // 2. Send email if requested
  if (params.emailParams && params.emailParams.to) {
    const { to, locale = 'de', vars } = params.emailParams;
    let emailPayload = null;

    switch (params.type) {
      case 'booking_confirmed':
        emailPayload = bookingConfirmation(to, vars, locale);
        break;
      case 'booking_cancelled_by_customer':
      case 'booking_cancelled_by_salon':
        emailPayload = bookingCancellation(to, vars, locale);
        break;
      case 'booking_pending':
        emailPayload = bookingPendingApprovalEmail(to, vars, locale);
        break;
      case 'booking_approved':
        emailPayload = bookingApprovedEmail(to, vars, locale);
        break;
      case 'booking_rejected':
        emailPayload = bookingRejectedEmail(to, vars, locale);
        break;
      case 'booking_modified':
        emailPayload = bookingModifiedEmail(to, vars, locale);
        break;
      case 'no_show_charge':
        emailPayload = noShowChargeEmail(to, vars, locale);
        break;
      case 'late_cancellation_fee':
        emailPayload = lateCancellationFeeEmail(to, vars, locale);
        break;
      case 'refund_processed':
        emailPayload = refundProcessedEmail(to, vars, locale);
        break;
      case 'new_review':
        emailPayload = newReviewEmail(to, vars, locale);
        break;
      case 'review_response':
        emailPayload = reviewResponseEmail(to, vars, locale);
        break;
      case 'review_flagged':
        emailPayload = reviewFlaggedEmail(to, vars, locale);
        break;
      case 'account_warning':
        emailPayload = accountWarningEmail(to, vars, locale);
        break;
      case 'account_suspension':
        emailPayload = accountSuspensionEmail(to, vars, locale);
        break;
      case 'payout_completed':
        emailPayload = payoutCompletedEmail(to, vars, locale);
        break;
      case 'payout_failed':
        emailPayload = payoutFailedEmail(to, vars, locale);
        break;
      case 'ts_changes':
        emailPayload = termsChangedEmail(to, vars, locale);
        break;
      case 'salon_strike':
        emailPayload = salonStrikeEmail(to, vars, locale);
        break;
      default:
        console.warn('[sendNotification] Unsupported email type:', params.type);
    }

    if (emailPayload) {
      try {
        await sendEmail(emailPayload);
      } catch (err) {
        console.error('[sendNotification] Failed to send email:', err);
      }
    }
  }
}
