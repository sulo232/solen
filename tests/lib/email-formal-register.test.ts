import { describe, expect, it } from "vitest";
import * as Email from "@/lib/email";
import * as Audit from "@/lib/email-templates/audit-notifications";
import * as Booking from "@/lib/email-templates/booking-notifications";

const vars = {
  service: "Cut", serviceName: "Cut", salon: "Fixture Store", salonName: "Fixture Store", customerName: "Alex",
  senderName: "Sam", recipientName: "Alex", stylistName: "Taylor", stylistPhoto: "",
  oldDate: "2026-09-08T10:00:00.000Z", newDate: "2026-09-09T10:00:00.000Z",
  date: "09.09.2026", time: "10:00", frequency: "monthly", price: 45,
  amount: "CHF 45.00", amountChf: "45.00", feeAmount: "CHF 20.00",
  reason: "Fixture reason", response: "Fixture response", rating: 5, warningNum: 1,
  strikeCount: 1, daysSince: 35, position: 2, estimatedMinutes: 15,
  reward: "Free cut", code: "ABC123", expiresDate: "09.09.2027",
  approvalUrl: "https://solen.ch/approve", detailsUrl: "https://solen.ch/details",
  salonUrl: "https://solen.ch/salon/fixture", reviewUrl: "https://solen.ch/review",
  downloadUrl: "https://solen.ch/download", confirmUrl: "https://solen.ch/confirm",
  conversationUrl: "https://solen.ch/messages", reviewUrl2: "https://solen.ch/review",
  bookingUrl: "https://solen.ch/book", tipUrl: "https://solen.ch/tip",
  redeemUrl: "https://solen.ch/redeem", salonSlug: "fixture", replyText: "Thanks",
  inviteUrl: "https://solen.ch/invite", lastVisitDate: "01.08.2026", message: "Enjoy",
  name: "Alex", preview: "Hello",
};

const text = (payload: { subject: string; html: string }) => `${payload.subject}\n${payload.html}`;
const germanInformal = /\b(?:du|dich|dir|dein(?:e|en|em|er|es)?)\b/i;
const italianInformal = /\b(?:tu|ti|tuo|tua|tuoi|tue|hai)\b/i;
const frenchInformal = /(?:^|[>\s])(?:salut|tu|te|toi|ta|ton|tes)(?=[\s,.!?<])/i;
const prohibitedPunctuation = /[–—]|[\u{1F300}-\u{1FAFF}]/u;
const locales = ["de", "en", "fr", "it"] as const;

const auditBuilders = [
  Audit.bookingPendingApprovalEmail, Audit.bookingApprovedEmail, Audit.bookingRejectedEmail,
  Audit.bookingModifiedEmail, Audit.noShowChargeEmail, Audit.lateCancellationFeeEmail,
  Audit.refundProcessedEmail, Audit.upchargeChargedEmail, Audit.newReviewEmail,
  Audit.reviewResponseEmail, Audit.reviewFlaggedEmail, Audit.accountWarningEmail,
  Audit.accountSuspensionEmail, Audit.payoutCompletedEmail, Audit.payoutFailedEmail,
  Audit.termsChangedEmail, Audit.salonStrikeEmail,
];

const bookingBuilders = [
  Booking.salonCancelledBooking, Booking.paymentFailedNotification,
  Booking.preChargeDeclinedNotification,
];

const emailBuilders = [
  Email.bookingReschedule, Email.recurringConfirmation, Email.salonNewBooking,
  Email.salonVerificationRequest, Email.salonVerificationWarning, Email.salonFrozen,
  Email.customerBookingSuspended, Email.salonApproved, Email.salonRejected,
  Email.newMessageNotification, Email.reviewPrompt, Email.welcomeEmail,
  Email.tipPromptEmail, Email.birthdayEmail, Email.giftCardDeliveryEmail,
  Email.nailInfillReminderEmail, Email.barberSmartReminderEmail,
  Email.barberLoyaltyRewardEmail, Email.reviewPostedEmail, Email.reviewRepliedEmail,
  Email.directoryClaimCode, Email.staffInviteEmail, Email.platformBirthdayEmail,
  Email.salonVoucherDeliveryEmail,
];

describe("formal German and Italian notification register", () => {
  it("renders every changed audit notification through its actual builder", () => {
    for (const builder of auditBuilders) {
      expect(text(builder("reader@example.com", vars, "de"))).not.toMatch(germanInformal);
      expect(text(builder("reader@example.com", vars, "it"))).not.toMatch(italianInformal);
    }
  });

  it("renders every changed booking notification through its actual builder", () => {
    for (const builder of bookingBuilders) {
      expect(text(builder("reader@example.com", vars, "de"))).not.toMatch(germanInformal);
      expect(text(builder("reader@example.com", vars, "it"))).not.toMatch(italianInformal);
    }
  });

  it("renders every changed general notification through its actual builder", () => {
    for (const builder of emailBuilders) {
      expect(text((builder as any)("reader@example.com", vars, "de"))).not.toMatch(germanInformal);
      expect(text((builder as any)("reader@example.com", vars, "it"))).not.toMatch(italianInformal);
    }
  });

  it("renders the changed queue message through its actual SMS builder", () => {
    expect(Email.barberQueuePositionSMS(vars, "de")).not.toMatch(germanInformal);
    expect(Email.barberQueuePositionSMS(vars, "it")).not.toMatch(italianInformal);
  });

  it("uses formal French in both source-touched barber emails", () => {
    expect(text(Email.barberSmartReminderEmail("reader@example.com", vars, "fr"))).not.toMatch(frenchInformal);
    expect(text(Email.barberLoyaltyRewardEmail("reader@example.com", vars, "fr"))).not.toMatch(frenchInformal);
  });

  it("uses the formal Italian invite clitic in the actual staff builder", () => {
    const subject = Email.staffInviteEmail("reader@example.com", vars, "it").subject;
    expect(subject).toBe("Invito a unirsi a Fixture Store - solen.ch");
    expect(subject).not.toContain("unirti");
  });

  it("keeps emoji and long dashes out of every source-touched builder output", () => {
    for (const locale of locales) {
      for (const builder of auditBuilders) expect(text(builder("reader@example.com", vars, locale))).not.toMatch(prohibitedPunctuation);
      for (const builder of bookingBuilders) expect(text(builder("reader@example.com", vars, locale))).not.toMatch(prohibitedPunctuation);
      for (const builder of emailBuilders) expect(text((builder as any)("reader@example.com", vars, locale))).not.toMatch(prohibitedPunctuation);
      expect(Email.barberQueuePositionSMS(vars, locale)).not.toMatch(prohibitedPunctuation);
    }
  });

  it("does not import the source commit's unrelated destination changes", () => {
    expect(Email.recurringFailed("reader@example.com", vars, "it").html).toContain('href="https://solen.ch"');
    expect(Email.rebookingNudge("reader@example.com", vars, "de").html).toContain('href="https://solen.ch"');
    expect(Email.waitlistSlotFreed("reader@example.com", vars, "fr").html).toContain('href="https://solen.ch"');
    expect(Email.salonNewBooking("reader@example.com", vars, "it").html).toContain('href="https://solen.ch"');
    expect(Email.salonApproved("reader@example.com", vars, "de").html).toContain('href="https://solen.ch"');
    expect(Email.birthdayEmail("reader@example.com", vars, "it").html).toContain('href="https://solen.ch"');
    expect(Email.giftCardDeliveryEmail("reader@example.com", vars, "de").html).toContain('href="https://solen.ch"');
    expect(Email.platformBirthdayEmail("reader@example.com", vars, "it").html).toContain('href="https://www.solen.ch"');
    expect(Email.salonVoucherDeliveryEmail("reader@example.com", vars, "de").html).toContain('href="https://www.solen.ch"');
  });
});
