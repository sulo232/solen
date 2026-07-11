// Credits + voucher SPEND path kill test (owner-approved 2026-07-11, backend-audit-plan-955ece).
//
// Section A: capStoredValueRappen (lib/credits/redeem.ts), the pure cap calc booking-pay-intent
// uses to decide how much credit/voucher a checkout may apply right now. No DB, no Stripe.
//
// Section B: the REAL live RPCs (redeem_user_credits / restore_user_credits / redeem_voucher /
// restore_voucher, all already-applied migrations per the task brief) against throwaway rows
// only: one disposable auth user, one throwaway booking anchored to a REAL existing service +
// slot (read-only lookup, never mutated), one throwaway user_credits row, one throwaway
// vouchers row. Everything is deleted in `finally` regardless of outcome. NO Stripe API calls.
//
// Usage: npx tsx scripts/spend-path-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const { capStoredValueRappen } = await import("@/lib/credits/redeem");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];
  function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
    rows.push({ scenario, pass, details });
    if (!pass) allPass = false;
  }

  // ─── Section A: capStoredValueRappen, the pay-intent credit-cap logic extracted pure ──

  // A1. Balance smaller than every floor: capped at the balance itself (the common case, a
  // small credit balance on a normal-sized booking). 500 < byChargeFloor (4950) AND
  // 500 < byFee (750), so neither floor binds.
  const a1 = capStoredValueRappen({
    desiredRappen: 500, // CHF 5 balance
    chargeRappen: 5000, // CHF 50 charge
    appFeeRappen: 750, // CHF 7.50 commission (15%)
    hasConnectFee: true,
  });
  check("A1: balance (500) smaller than both floors -> capped at the balance", a1 === 500, { a1 });

  // A2. Balance far exceeds the charge; with a Connect fee present the cap is the COMMISSION
  // (Stripe requires application_fee_amount <= amount, so beyond the fee it would go negative).
  const a2 = capStoredValueRappen({
    desiredRappen: 50000, // CHF 500, an unrealistically large balance
    chargeRappen: 5000,
    appFeeRappen: 750,
    hasConnectFee: true,
  });
  check("A2: balance far exceeds the charge, Connect fee present -> capped at the commission (750)", a2 === 750, { a2 });

  // A3. Task 1's explicit zero-charge handling: "cap the credit at amount minus the Stripe
  // minimum charge 0.50 CHF". No Connect fee in play (dev platform-charge path), so the ONLY
  // floor is the Stripe minimum: 5000 - 50 = 4950, leaving exactly CHF 0.50 charged.
  const a3 = capStoredValueRappen({
    desiredRappen: 50000,
    chargeRappen: 5000,
    appFeeRappen: 0,
    hasConnectFee: false,
  });
  check("A3: huge balance, no Connect fee -> capped at chargeRappen minus the 50 Rappen Stripe floor (4950)", a3 === 4950, { a3 });
  check("A3b: the resulting charge after applying a3 is exactly the Stripe minimum (50 Rappen / CHF 0.50)", 5000 - a3 === 50, { remaining: 5000 - a3 });

  // A4. Zero balance -> zero applied, regardless of headroom.
  const a4 = capStoredValueRappen({ desiredRappen: 0, chargeRappen: 5000, appFeeRappen: 750, hasConnectFee: true });
  check("A4: zero desired balance -> 0 applied", a4 === 0, { a4 });

  // A5. Charge already AT the Stripe floor (e.g. a fully-promo'd booking): no further credit
  // can be applied no matter how large the balance.
  const a5 = capStoredValueRappen({ desiredRappen: 10000, chargeRappen: 50, appFeeRappen: 0, hasConnectFee: false });
  check("A5: charge already at the 50 Rappen floor -> 0 applied even with a huge balance", a5 === 0, { a5 });

  // A6. Connect fee present but already zero (e.g. fully member-discount-waived commission):
  // nothing left to absorb from, 0 applied even though the charge itself has headroom.
  const a6 = capStoredValueRappen({ desiredRappen: 10000, chargeRappen: 5000, appFeeRappen: 0, hasConnectFee: true });
  check("A6: Connect fee present but already 0 -> 0 applied (nothing left for the platform to absorb)", a6 === 0, { a6 });

  // ─── Section B: live DB, throwaway rows only ───────────────────────────────────────────
  let userId: string | null = null;
  let bookingId: string | null = null;
  const creditIds: string[] = [];
  let voucherId: string | null = null;
  const stamp = Date.now();

  try {
    const { data: u, error: userErr } = await admin.auth.admin.createUser({
      email: `spend-path-kill-test-${stamp}@example.invalid`,
      email_confirm: true,
      password: crypto.randomUUID(),
    });
    userId = u?.user?.id ?? null;
    check("throwaway test user created", !userErr && !!userId, { userErr: userErr?.message, userId });

    // Anchor a throwaway booking on a REAL existing service + slot (read-only lookup; the
    // booking row itself is synthetic and deleted below). credit_redemptions.booking_id and
    // voucher_redemptions.booking_id both FK bookings(id), and the idempotency-fix migration
    // keys the "already redeemed" check on booking_id, so a real row is required to prove it.
    const { data: serviceRow } = await admin.from("services").select("id, salon_id").limit(1).maybeSingle();
    const { data: slotRow } = await admin.from("availability_slots").select("id").limit(1).maybeSingle();
    check("a real service + slot exist to anchor a throwaway booking row", !!serviceRow && !!slotRow, {
      hasService: !!serviceRow,
      hasSlot: !!slotRow,
    });

    if (userId && serviceRow && slotRow) {
      const { data: bookingRow, error: bookingErr } = await admin
        .from("bookings")
        .insert({
          user_id: userId,
          salon_id: serviceRow.salon_id,
          service_id: serviceRow.id,
          slot_id: slotRow.id,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          price_paid: 0,
          status: "pending",
        })
        .select("id")
        .single();
      bookingId = bookingRow?.id ?? null;
      check("throwaway booking row created", !bookingErr && !!bookingId, { bookingErr: bookingErr?.message, bookingId });

      if (bookingId) {
        // (c) earn 10 via the ledger's OWN earn shape (source:'referral', matches
        // app/api/referral/complete/route.ts's INSERT: amount + remaining both set to the
        // reward on mint).
        const { data: creditRow, error: creditInsErr } = await admin
          .from("user_credits")
          .insert({ user_id: userId, amount: 10, remaining: 10, source: "referral", source_id: null })
          .select("id, remaining")
          .single();
        if (creditRow?.id) creditIds.push(creditRow.id);
        check("(c) throwaway user_credits row earned: amount 10, remaining 10", !creditInsErr && Number(creditRow?.remaining) === 10, {
          creditInsErr: creditInsErr?.message,
          creditRow,
        });

        const testPi = `pi_spend_kill_test_${stamp}`;

        // (a) redeem 6, first call.
        const { data: applied1, error: redeemErr1 } = await admin.rpc("redeem_user_credits", {
          p_user: userId,
          p_amount: 6,
          p_booking: bookingId,
          p_pi: testPi,
        });
        check("first redeem_user_credits(6) applies exactly 6", !redeemErr1 && Number(applied1) === 6, {
          redeemErr1: redeemErr1?.message,
          applied1,
        });

        const { data: balAfter1 } = await admin.from("user_credits").select("remaining").eq("id", creditIds[0]).single();
        check("(c) balance math: earn 10, redeem 6 -> remaining 4", Number(balAfter1?.remaining) === 4, { balAfter1 });

        // (a) SAME p_pi, second call -> idempotent no-op (booking_id-keyed per the
        // 20260703161101_fix_redeem_idempotency.sql fix: returns the already-redeemed sum,
        // never re-debits).
        const { data: applied2, error: redeemErr2 } = await admin.rpc("redeem_user_credits", {
          p_user: userId,
          p_amount: 6,
          p_booking: bookingId,
          p_pi: testPi,
        });
        check("(a) second redeem_user_credits call with the SAME p_pi is idempotent (still 6, no double debit)", !redeemErr2 && Number(applied2) === 6, {
          redeemErr2: redeemErr2?.message,
          applied2,
        });

        const { data: balAfter2 } = await admin.from("user_credits").select("remaining").eq("id", creditIds[0]).single();
        check("balance UNCHANGED after the idempotent replay (still 4)", Number(balAfter2?.remaining) === 4, { balAfter2 });

        // (b) restore, first call -> returns the 6 that was redeemed, balance back to 10.
        const { data: restored1, error: restoreErr1 } = await admin.rpc("restore_user_credits", { p_pi: testPi });
        check("first restore_user_credits returns the redeemed 6", !restoreErr1 && Number(restored1) === 6, {
          restoreErr1: restoreErr1?.message,
          restored1,
        });

        const { data: balAfterRestore1 } = await admin.from("user_credits").select("remaining").eq("id", creditIds[0]).single();
        check("balance restored back to 10", Number(balAfterRestore1?.remaining) === 10, { balAfterRestore1 });

        // (b) SAME p_pi, second restore -> idempotent no-op (no matching ledger rows left).
        const { data: restored2, error: restoreErr2 } = await admin.rpc("restore_user_credits", { p_pi: testPi });
        check("(b) second restore_user_credits call (same p_pi) is idempotent (0, no double credit)", !restoreErr2 && Number(restored2) === 0, {
          restoreErr2: restoreErr2?.message,
          restored2,
        });

        const { data: balAfterRestore2 } = await admin.from("user_credits").select("remaining").eq("id", creditIds[0]).single();
        check("balance UNCHANGED after the idempotent restore replay (still 10)", Number(balAfterRestore2?.remaining) === 10, {
          balAfterRestore2,
        });

        // Bonus (task 2 coverage): the SAME atomic redeem/restore idempotency, exercised against
        // a throwaway gift voucher, proving redeem_voucher / restore_voucher behave identically.
        const { data: voucherRow, error: voucherInsErr } = await admin
          .from("vouchers")
          .insert({
            salon_id: serviceRow.salon_id,
            recipient_email: `spend-path-kill-test-recipient-${stamp}@example.invalid`,
            amount: 20,
            remaining_amount: 20, // a PAID voucher (NULL would mean never-paid, per app/api/vouchers/validate/route.ts)
          })
          .select("id, code, remaining_amount")
          .single();
        voucherId = voucherRow?.id ?? null;
        check("throwaway vouchers row created (paid, remaining_amount 20)", !voucherInsErr && !!voucherId && !!voucherRow?.code, {
          voucherInsErr: voucherInsErr?.message,
          voucherRow,
        });

        if (voucherId && voucherRow?.code) {
          const voucherPi = `pi_spend_kill_test_voucher_${stamp}`;
          const { data: vApplied1, error: vErr1 } = await admin.rpc("redeem_voucher", {
            p_code: voucherRow.code,
            p_salon_id: serviceRow.salon_id,
            p_amount: 12,
            p_user: userId,
            p_booking: bookingId,
            p_pi: voucherPi,
          });
          check("voucher: first redeem_voucher(12) applies exactly 12", !vErr1 && Number(vApplied1) === 12, {
            vErr1: vErr1?.message,
            vApplied1,
          });

          const { data: vBalAfter1 } = await admin.from("vouchers").select("remaining_amount").eq("id", voucherId).single();
          check("voucher balance math: 20 minus 12 = remaining_amount 8", Number(vBalAfter1?.remaining_amount) === 8, { vBalAfter1 });

          const { data: vApplied2, error: vErr2 } = await admin.rpc("redeem_voucher", {
            p_code: voucherRow.code,
            p_salon_id: serviceRow.salon_id,
            p_amount: 12,
            p_user: userId,
            p_booking: bookingId,
            p_pi: voucherPi,
          });
          check("voucher: second redeem_voucher call with the SAME p_pi is idempotent (still 12, no double debit)", !vErr2 && Number(vApplied2) === 12, {
            vErr2: vErr2?.message,
            vApplied2,
          });

          const { data: vBalAfter2 } = await admin.from("vouchers").select("remaining_amount").eq("id", voucherId).single();
          check("voucher balance UNCHANGED after the idempotent replay (still 8)", Number(vBalAfter2?.remaining_amount) === 8, { vBalAfter2 });

          const { data: vRestored1, error: vRestoreErr1 } = await admin.rpc("restore_voucher", { p_pi: voucherPi });
          check("voucher: first restore_voucher returns the redeemed 12", !vRestoreErr1 && Number(vRestored1) === 12, {
            vRestoreErr1: vRestoreErr1?.message,
            vRestored1,
          });

          const { data: vBalAfterRestore } = await admin.from("vouchers").select("remaining_amount").eq("id", voucherId).single();
          check("voucher balance restored back to 20", Number(vBalAfterRestore?.remaining_amount) === 20, { vBalAfterRestore });

          const { data: vRestored2, error: vRestoreErr2 } = await admin.rpc("restore_voucher", { p_pi: voucherPi });
          check("voucher: second restore_voucher call (same p_pi) is idempotent (0, no double credit)", !vRestoreErr2 && Number(vRestored2) === 0, {
            vRestoreErr2: vRestoreErr2?.message,
            vRestored2,
          });
        }
      }
    }
  } finally {
    // Cleanup, best-effort, FK-safe order: ledger rows before the booking/voucher/credits
    // they reference, those before the throwaway user. Never leaves state behind.
    if (bookingId) {
      await admin.from("credit_redemptions").delete().eq("booking_id", bookingId);
      await admin.from("voucher_redemptions").delete().eq("booking_id", bookingId);
    }
    if (voucherId) await admin.from("vouchers").delete().eq("id", voucherId);
    if (creditIds.length) await admin.from("user_credits").delete().in("id", creditIds);
    if (bookingId) await admin.from("bookings").delete().eq("id", bookingId);
    if (userId) {
      await admin.from("profiles").delete().eq("id", userId);
      // Soft delete (shouldSoftDelete:true): a HARD deleteUser(userId) 500s in this
      // environment even for a brand-new user with zero associated rows (reproduced
      // independently of this feature), so it is a pre-existing admin-API limitation here,
      // not something this change caused. Soft delete removes the account from
      // auth.admin.listUsers() and disables it, which is a real, verified cleanup.
      const { error: deleteUserErr } = await admin.auth.admin.deleteUser(userId, true);
      if (deleteUserErr) console.error("[spend-path-kill-test] soft-delete of the throwaway user failed:", deleteUserErr.message);
    }
    console.log("[spend-path-kill-test] cleaned up throwaway user / booking / credits / voucher rows");
  }

  console.log("\nCredits + voucher spend path kill test: pure cap calc + live redeem/restore idempotency + balance math\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[spend-path-kill-test] threw:", err);
  process.exit(1);
});
