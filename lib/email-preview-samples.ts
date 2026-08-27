// =============================================================================
// lib/email-preview-samples.ts , the catalogue behind /dev/emails
//
// WHY THIS EXISTS (2026-08-15): there are 67 email templates across lib/email.ts
// and lib/email-templates/**, and until now the ONLY way to see any of them was to
// trigger the real event and read your own inbox. That is why presentation drifted
// while content improved: six passes in July fixed localisation, the plain-text
// part, the unsubscribe route, the calendar file and the confirmation's address,
// and not one of them could look at the result.
//
// exists-check: `npm run exists email` (run 2026-08-15) , 61 hits, all of them the
// templates + DB columns below. No preview surface existed. Net-new.
//
// The sample values here are PREVIEW FIXTURES, not product data. Nothing in this
// file is ever sent to anyone: it exists so a designer can look at a template. The
// no-fabrication rule binds what a CUSTOMER sees on a real surface; this module is
// imported by exactly one dev-only page that returns 404 in production.
// =============================================================================

import type { EmailLocale, EmailPayload } from "@/lib/email";
import * as E from "@/lib/email";
import { salonOutreachInvitation } from "@/lib/email-outreach";
import * as Audit from "@/lib/email-templates/audit-notifications";
import * as BookingNote from "@/lib/email-templates/booking-notifications";
import * as Onboarding from "@/lib/email-templates/salon-onboarding";
import * as Welcome from "@/lib/email-templates/welcome-series";
import { offPeakAlert } from "@/lib/email-templates/off-peak";

export interface EmailPreviewEntry {
  /** Stable slug, used as the anchor id on the page. */
  id: string;
  /** Human label shown above the frame. */
  label: string;
  /** Which section of the page it sits under. */
  group: string;
  /** Who receives it. Drives the badge. */
  audience: "customer" | "salon" | "admin";
  /** Build the payload for one locale. */
  build: (locale: EmailLocale) => EmailPayload;
}

const TO = "preview@solen.ch";

// Fixed sample values. Deliberately obvious as samples, and deliberately LONG in a
// few places (the salon name, the review comment) so the preview shows the
// worst-case wrap rather than a flattering short string.
const S = {
  service: "Damenhaarschnitt & Föhnen",
  salon: "Coiffure Belle Époque Niederdorf",
  date: "Dienstag, 26. August 2026",
  time: "14:30",
  customer: "Lea Bianchi",
  stylist: "Marco Rossi",
  address: "Niederdorfstrasse 42, 8001 Zürich",
  amount: "CHF 89.00",
  code: "SOLEN-4K7M-92XQ",
  url: "https://solen.ch/de/profile/bookings",
};

export const EMAIL_PREVIEWS: EmailPreviewEntry[] = [
  // ---------------------------------------------------------------- booking, customer
  {
    id: "booking-confirmation",
    label: "Booking confirmed",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) =>
      E.bookingConfirmation(
        TO,
        {
          service: S.service,
          salon: S.salon,
          date: S.date,
          time: S.time,
          total: S.amount,
          net: "CHF 82.33",
          vat: "CHF 6.67",
          rate: "8.1",
          vatNumber: "CHE-123.456.789 MWST",
          address: S.address,
          manageUrl: S.url,
          icsStartsAt: "2026-08-26T12:30:00.000Z",
          icsEndsAt: "2026-08-26T13:30:00.000Z",
          bookingId: "preview-booking-id",
        },
        l
      ),
  },
  {
    id: "booking-cancellation",
    label: "Booking cancelled",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => E.bookingCancellation(TO, { service: S.service, salon: S.salon, date: S.date }, l),
  },
  {
    id: "booking-reschedule",
    label: "Booking moved",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) =>
      E.bookingReschedule(
        TO,
        { service: S.service, salon: S.salon, oldDate: "2026-08-26T12:30:00.000Z", newDate: "2026-09-02T09:00:00.000Z" },
        l
      ),
  },
  {
    id: "booking-reminder",
    label: "Reminder, tomorrow",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => E.bookingReminder(TO, { service: S.service, salon: S.salon, time: S.time }, l),
  },
  {
    id: "booking-pending-approval-customer",
    label: "Waiting for the salon to approve",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) =>
      Audit.bookingPendingApprovalEmail(
        TO,
        { service: S.service, customerName: S.customer, date: S.date, time: S.time, approvalUrl: S.url },
        l
      ),
  },
  {
    id: "booking-approved",
    label: "Salon approved it",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => Audit.bookingApprovedEmail(TO, { service: S.service, salonName: S.salon, date: S.date, time: S.time }, l),
  },
  {
    id: "booking-rejected",
    label: "Salon declined it",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) =>
      Audit.bookingRejectedEmail(
        TO,
        { service: S.service, salonName: S.salon, date: S.date, time: S.time, reason: "Der Termin ist leider bereits vergeben." },
        l
      ),
  },
  {
    id: "booking-modified",
    label: "Booking changed",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) =>
      Audit.bookingModifiedEmail(
        TO,
        { service: S.service, customerName: S.customer, date: S.date, time: S.time, detailsUrl: S.url },
        l
      ),
  },
  {
    id: "salon-cancelled-booking",
    label: "Salon cancelled on you",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => BookingNote.salonCancelledBooking(TO, { service: S.service, salon: S.salon, date: S.date, time: S.time }, l),
  },
  {
    id: "recurring-confirmation",
    label: "Repeat booking set up",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => E.recurringConfirmation(TO, { frequency: "alle 4 Wochen", service: S.service, salon: S.salon }, l),
  },
  {
    id: "recurring-failed",
    label: "Repeat booking could not be made",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => E.recurringFailed(TO, { service: S.service, salon: S.salon, date: S.date }, l),
  },
  {
    id: "waitlist-slot-freed",
    label: "A slot opened up",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => E.waitlistSlotFreed(TO, { service: S.service, salon: S.salon, date: S.date }, l),
  },
  {
    id: "customer-booking-suspended",
    label: "Your booking was suspended",
    group: "Booking (to the customer)",
    audience: "customer",
    build: (l) => E.customerBookingSuspended(TO, { salon: S.salon, service: S.service, date: S.date }, l),
  },

  // ---------------------------------------------------------------- booking, salon
  {
    id: "salon-new-booking",
    label: "New booking came in",
    group: "Booking (to the salon)",
    audience: "salon",
    build: (l) =>
      E.salonNewBooking(TO, { customerName: S.customer, service: S.service, date: S.date, time: S.time, price: 89 }, l),
  },
  {
    id: "customer-cancelled-notification",
    label: "Customer cancelled",
    group: "Booking (to the salon)",
    audience: "salon",
    build: (l) =>
      BookingNote.customerCancelledNotification(
        TO,
        { service: S.service, salon: S.salon, date: S.date, customerName: S.customer },
        l
      ),
  },
  {
    id: "nail-allergy-alert",
    label: "Customer has allergies on file",
    group: "Booking (to the salon)",
    audience: "salon",
    build: (l) =>
      E.nailAllergyAlertEmail(
        TO,
        { salonName: S.salon, customerName: S.customer, allergies: "Acrylate, Formaldehyd", bookingDate: S.date },
        l
      ),
  },

  // ---------------------------------------------------------------- money
  {
    id: "walkin-payment",
    label: "Pay for your walk-in",
    group: "Money",
    audience: "customer",
    build: (l) =>
      E.walkInPaymentEmail(
        TO,
        { customerName: S.customer, salonName: S.salon, serviceName: S.service, paymentUrl: S.url, amount: S.amount },
        l
      ),
  },
  {
    id: "payment-failed",
    label: "Payment failed",
    group: "Money",
    audience: "customer",
    build: (l) => BookingNote.paymentFailedNotification(TO, { service: S.service, salon: S.salon, date: S.date }, l),
  },
  {
    id: "precharge-declined",
    label: "Card declined before the appointment",
    group: "Money",
    audience: "customer",
    build: (l) => BookingNote.preChargeDeclinedNotification(TO, { salon: S.salon, date: S.date }, l),
  },
  {
    id: "refund-processed",
    label: "Refund sent",
    group: "Money",
    audience: "customer",
    build: (l) =>
      Audit.refundProcessedEmail(
        TO,
        { service: S.service, salonName: S.salon, amount: S.amount, net: "CHF 82.33", vat: "CHF 6.67", rate: "8.1", vatNumber: "CHE-123.456.789 MWST" },
        l
      ),
  },
  {
    id: "no-show-charge",
    label: "No-show fee charged",
    group: "Money",
    audience: "customer",
    build: (l) => Audit.noShowChargeEmail(TO, { service: S.service, salonName: S.salon, date: S.date, feeAmount: "CHF 25.00" }, l),
  },
  {
    id: "late-cancellation-fee",
    label: "Late-cancellation fee charged",
    group: "Money",
    audience: "customer",
    build: (l) => Audit.lateCancellationFeeEmail(TO, { service: S.service, salonName: S.salon, date: S.date, feeAmount: "CHF 25.00" }, l),
  },
  {
    id: "upcharge-charged",
    label: "Extra charge added",
    group: "Money",
    audience: "customer",
    build: (l) => Audit.upchargeChargedEmail(TO, { service: S.service, salonName: S.salon, amount: "CHF 15.00" }, l),
  },
  {
    id: "tip-prompt",
    label: "Leave a tip",
    group: "Money",
    audience: "customer",
    build: (l) =>
      E.tipPromptEmail(
        TO,
        { customerName: S.customer, stylistName: S.stylist, stylistPhoto: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=128&h=128&fit=crop", tipUrl: S.url },
        l
      ),
  },
  {
    id: "payout-completed",
    label: "Payout sent",
    group: "Money",
    audience: "salon",
    build: (l) => Audit.payoutCompletedEmail(TO, { amount: "CHF 1'240.50", date: S.date, downloadUrl: S.url }, l),
  },
  {
    id: "payout-failed",
    label: "Payout failed",
    group: "Money",
    audience: "salon",
    build: (l) => Audit.payoutFailedEmail(TO, { amount: "CHF 1'240.50", reason: "Bankverbindung ungültig" }, l),
  },
  {
    id: "gift-card-delivery",
    label: "Gift card (platform)",
    group: "Money",
    audience: "customer",
    build: (l) =>
      E.giftCardDeliveryEmail(
        TO,
        { recipientName: S.customer, senderName: "Nina Keller", amount: "CHF 100.00", code: S.code, message: "Alles Gute zum Geburtstag!" },
        l
      ),
  },
  {
    id: "salon-voucher-delivery",
    label: "Voucher (from a salon)",
    group: "Money",
    audience: "customer",
    build: (l) =>
      E.salonVoucherDeliveryEmail(
        TO,
        { recipientName: S.customer, salonName: S.salon, amountChf: "100.00", code: S.code, message: "Viel Freude!", expiresDate: "31.12.2026" },
        l
      ),
  },

  // ---------------------------------------------------------------- reviews
  {
    id: "review-prompt",
    label: "How was it? (review request)",
    group: "Reviews",
    audience: "customer",
    build: (l) => E.reviewPrompt(TO, { service: S.service, salon: S.salon, reviewUrl: S.url }, l),
  },
  {
    id: "review-posted",
    label: "Your review is live",
    group: "Reviews",
    audience: "customer",
    build: (l) =>
      E.reviewPostedEmail(TO, { salon: S.salon, rating: 5, comment: "Sehr freundliches Team und ein tolles Ergebnis. Ich komme auf jeden Fall wieder." }, l),
  },
  {
    id: "review-replied",
    label: "The salon replied to your review",
    group: "Reviews",
    audience: "customer",
    build: (l) => E.reviewRepliedEmail(TO, { salon: S.salon, salonSlug: "belle-epoque", replyText: "Vielen Dank für Ihr Feedback!" }, l),
  },
  {
    id: "new-review",
    label: "You got a new review",
    group: "Reviews",
    audience: "salon",
    build: (l) => Audit.newReviewEmail(TO, { customerName: S.customer, rating: 5, salonUrl: S.url }, l),
  },
  {
    id: "review-response",
    label: "Reply posted to a review",
    group: "Reviews",
    audience: "salon",
    build: (l) => Audit.reviewResponseEmail(TO, { salonName: S.salon, response: "Vielen Dank für Ihr Feedback!", reviewUrl: S.url }, l),
  },
  {
    id: "review-flagged",
    label: "A review was reported",
    group: "Reviews",
    audience: "salon",
    build: (l) => Audit.reviewFlaggedEmail(TO, { salonName: S.salon }, l),
  },

  // ---------------------------------------------------------------- account and moderation
  {
    id: "welcome",
    label: "Welcome (account created)",
    group: "Account and moderation",
    audience: "customer",
    build: (l) => E.welcomeEmail(TO, { name: S.customer }, l, 1),
  },
  {
    id: "welcome-step2",
    label: "Welcome, step 2",
    group: "Account and moderation",
    audience: "customer",
    build: (l) => E.welcomeEmail(TO, { name: S.customer }, l, 2),
  },
  // No step 3: only two bodies were ever written, and the job moved to the day0/3/7
  // welcome series below. See the note on welcomeEmail in lib/email.ts.
  {
    id: "new-message",
    label: "New message",
    group: "Account and moderation",
    audience: "customer",
    build: (l) => E.newMessageNotification(TO, { senderName: S.salon, preview: "Guten Tag, wir haben noch eine Frage zu Ihrem Termin.", conversationUrl: S.url }, l),
  },
  {
    id: "account-warning",
    label: "Account warning",
    group: "Account and moderation",
    audience: "customer",
    build: (l) => Audit.accountWarningEmail(TO, { reason: "Wiederholtes Nichterscheinen" }, l),
  },
  {
    id: "account-suspension",
    label: "Account suspended",
    group: "Account and moderation",
    audience: "customer",
    build: (l) => Audit.accountSuspensionEmail(TO, { reason: "Wiederholtes Nichterscheinen" }, l),
  },
  {
    id: "terms-changed",
    label: "Terms changed",
    group: "Account and moderation",
    audience: "customer",
    build: (l) => Audit.termsChangedEmail(TO, { effectiveDate: "01.09.2026", detailsUrl: S.url }, l),
  },
  {
    id: "tos-update",
    label: "Terms update (versioned)",
    group: "Account and moderation",
    audience: "customer",
    build: (l) => E.tosUpdateNotification(TO, { tosVersion: "2.1", effectiveDate: "01.09.2026", termsUrl: S.url }, l),
  },
  {
    id: "staff-invite",
    label: "Invite to join a salon team",
    group: "Account and moderation",
    audience: "salon",
    build: (l) => E.staffInviteEmail(TO, { salonName: S.salon, staffName: S.stylist, inviteUrl: S.url }, l),
  },
  {
    id: "salon-verification-request",
    label: "Confirm your salon",
    group: "Account and moderation",
    audience: "salon",
    build: (l) => E.salonVerificationRequest(TO, { salon: S.salon, confirmUrl: S.url }, l),
  },
  {
    id: "salon-verification-warning",
    label: "Confirm your salon (warning)",
    group: "Account and moderation",
    audience: "salon",
    build: (l) => E.salonVerificationWarning(TO, { salon: S.salon, confirmUrl: S.url, warningNum: 2 }, l),
  },
  {
    id: "salon-frozen",
    label: "Salon frozen",
    group: "Account and moderation",
    audience: "salon",
    build: (l) => E.salonFrozen(TO, { salon: S.salon }, l),
  },
  {
    id: "salon-approved",
    label: "Salon approved",
    group: "Account and moderation",
    audience: "salon",
    build: (l) => E.salonApproved(TO, { salon: S.salon }, l),
  },
  {
    id: "salon-rejected",
    label: "Salon rejected",
    group: "Account and moderation",
    audience: "salon",
    build: (l) => E.salonRejected(TO, { salon: S.salon, reason: "Adresse konnte nicht verifiziert werden." }, l),
  },
  {
    id: "salon-strike",
    label: "Salon strike",
    group: "Account and moderation",
    audience: "salon",
    build: (l) => Audit.salonStrikeEmail(TO, { strikeCount: 2, reason: "Wiederholte kurzfristige Absagen" }, l),
  },
  {
    id: "admin-new-salon",
    label: "New salon signed up",
    group: "Account and moderation",
    audience: "admin",
    // No locale parameter on this one: it goes to the Solen admin inbox, not a customer.
    build: () => E.adminNewSalonNotification(TO, { salon: S.salon, email: "kontakt@belle-epoque.ch", address: S.address }),
  },

  // ---------------------------------------------------------------- lifecycle and marketing
  {
    id: "welcome-day0",
    label: "Welcome series, day 0",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => Welcome.welcomeDay0(TO, { name: S.customer }, l),
  },
  {
    id: "welcome-day3",
    label: "Welcome series, day 3",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => Welcome.welcomeDay3(TO, { name: S.customer }, l),
  },
  {
    id: "welcome-day7",
    label: "Welcome series, day 7",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => Welcome.welcomeDay7(TO, { name: S.customer }, l),
  },
  {
    id: "rebooking-nudge",
    label: "Time to rebook",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => E.rebookingNudge(TO, { service: S.service, salon: S.salon, daysSince: 42 }, l),
  },
  {
    id: "barber-smart-reminder",
    label: "Barber, time for a cut",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => E.barberSmartReminderEmail(TO, { customerName: S.customer, salonName: S.salon, daysSince: 28, bookingUrl: S.url }, l),
  },
  {
    id: "nail-infill-reminder",
    label: "Nails, time for an infill",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) =>
      E.nailInfillReminderEmail(
        TO,
        { customerName: S.customer, salonName: S.salon, serviceName: "Gel-Nägel", lastVisitDate: "12.07.2026", bookingUrl: S.url },
        l
      ),
  },
  {
    id: "barber-loyalty-reward",
    label: "Loyalty reward unlocked",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => E.barberLoyaltyRewardEmail(TO, { customerName: S.customer, salonName: S.salon, reward: "Gratis Bartpflege", redeemUrl: S.url }, l),
  },
  {
    id: "birthday",
    label: "Birthday (from a salon)",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => E.birthdayEmail(TO, { customerName: S.customer, salonName: S.salon }, l),
  },
  {
    id: "platform-birthday",
    label: "Birthday (from Solen)",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => E.platformBirthdayEmail(TO, { customerName: S.customer }, l),
  },
  {
    id: "off-peak-alert",
    label: "Off-peak discount",
    group: "Lifecycle and marketing",
    audience: "customer",
    build: (l) => offPeakAlert(TO, { salonName: S.salon, discountPercent: 20, salonUrl: S.url }, l),
  },
  {
    id: "salon-outreach-invitation",
    label: "Claim your salon (cold outreach)",
    group: "Lifecycle and marketing",
    audience: "salon",
    // German-only by design: cold outreach to Swiss salons, no locale parameter exists.
    build: () => salonOutreachInvitation(TO, { salonName: S.salon, claimUrl: S.url }),
  },
  {
    id: "directory-claim-code",
    label: "Claim code",
    group: "Lifecycle and marketing",
    audience: "salon",
    build: (l) => E.directoryClaimCode(TO, { salonName: S.salon, code: "482913" }, l),
  },

  // ---------------------------------------------------------------- salon onboarding drip
  {
    id: "onboarding-welcome",
    label: "Onboarding 1, welcome partner",
    group: "Salon onboarding",
    audience: "salon",
    build: (l) => Onboarding.onboardingWelcome(TO, { salonName: S.salon }, l),
  },
  {
    id: "onboarding-complete-profile",
    label: "Onboarding 2, finish your profile",
    group: "Salon onboarding",
    audience: "salon",
    build: (l) => Onboarding.onboardingCompleteProfile(TO, { salonName: S.salon }, l),
  },
  {
    id: "onboarding-add-services",
    label: "Onboarding 3, add services",
    group: "Salon onboarding",
    audience: "salon",
    build: (l) => Onboarding.onboardingAddServices(TO, { salonName: S.salon }, l),
  },
  {
    id: "onboarding-add-photo",
    label: "Onboarding 4, add photos",
    group: "Salon onboarding",
    audience: "salon",
    build: (l) => Onboarding.onboardingAddPhoto(TO, { salonName: S.salon }, l),
  },
  {
    id: "onboarding-ready",
    label: "Onboarding 5, you are live",
    group: "Salon onboarding",
    audience: "salon",
    build: (l) => Onboarding.onboardingReady(TO, { salonName: S.salon }, l),
  },
];

/** Section order on the page. */
export const EMAIL_PREVIEW_GROUPS = [
  "Booking (to the customer)",
  "Booking (to the salon)",
  "Money",
  "Reviews",
  "Account and moderation",
  "Lifecycle and marketing",
  "Salon onboarding",
] as const;
