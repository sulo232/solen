-- ============================================================
-- 20260602110000_vat_mwst_foundation
-- Swiss VAT / MWST backend foundation.
--
-- OWNER DECISIONS (2026-06-02):
--   • PER-SALON model — the salon is the merchant. A VAT-registered
--     salon charges Swiss standard VAT on its service; a non-registered
--     salon shows NO VAT at all.
--   • Standard rate 8.1% (Swiss Normalsatz, valid from 2024-01-01).
--   • Prices are VAT-INCLUSIVE — the displayed price already contains
--     VAT, so VAT is derived from the gross by subtraction (see lib/vat.ts).
--
-- This migration only adds the storage. The compute+store happens at
-- PAYMENT time in the Stripe webhook (bookings) and purchase-handler
-- (packages/retail). Money columns are integer Rappen, matching
-- bookings.paid_amount / package_purchases.paid_amount.
--
-- DEFERRED (NOT in this migration): commission VAT — Solen's own VAT on
-- its platform fee. That needs Solen's own VAT-registration status and is
-- a separate accounting concern (flagged for a later epic).
--
-- Forward-only, fully guarded (IF NOT EXISTS), re-runnable.
-- ============================================================

-- ── SALON VAT REGISTRATION ──────────────────────────────────
-- vat_registered drives whether VAT is charged at all (false ⇒ no VAT).
-- vat_number is the salon's Swiss UID (CHE-###.###.### MWST) — nullable;
-- non-registered salons have none. vat_rate lets a salon override the
-- standard rate (kept per-salon so a future reduced/special rate, or a
-- rate change, is data not code); defaults to the 8.1% standard.
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS vat_registered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_number     text,
  ADD COLUMN IF NOT EXISTS vat_rate       numeric DEFAULT 8.1;

-- ── BOOKINGS VAT BREAKDOWN ──────────────────────────────────
-- Stored at payment time from the booking's final paid_amount + the
-- salon's registration. VAT-inclusive: net + vat == gross (paid_amount).
-- vat_amount = 0 / net = gross for a non-registered salon. Integer Rappen.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS vat_amount integer,   -- Rappen; VAT portion of paid_amount.
  ADD COLUMN IF NOT EXISTS net_amount integer,   -- Rappen; paid_amount − vat_amount.
  ADD COLUMN IF NOT EXISTS vat_rate   numeric;   -- rate actually applied (0 if not registered).

-- ── PURCHASE VAT BREAKDOWN ──────────────────────────────────
-- package_purchases + retail_purchases were created / extended by
-- 20260602100000_purchase_refunds.sql (paid_amount in Rappen). Same three
-- VAT columns, same VAT-inclusive contract, stored by the purchase-handler
-- at payment time. IF NOT EXISTS so this is safe whether or not those
-- tables/columns already carry these (idempotent + order-independent).
-- GUARDED: package_purchases + retail_purchases may not exist yet on a given
-- environment under this project's schema drift (migration 071 / the retail
-- table never landed on live as of 2026-06-02). Add the VAT columns only when
-- the table is present, so this migration applies cleanly either way and never
-- half-fails. When those tables are later created, re-run this migration (it is
-- idempotent) to backfill their VAT columns.
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='package_purchases') THEN
    ALTER TABLE public.package_purchases
      ADD COLUMN IF NOT EXISTS vat_amount integer,
      ADD COLUMN IF NOT EXISTS net_amount integer,
      ADD COLUMN IF NOT EXISTS vat_rate   numeric;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='retail_purchases') THEN
    ALTER TABLE public.retail_purchases
      ADD COLUMN IF NOT EXISTS vat_amount integer,
      ADD COLUMN IF NOT EXISTS net_amount integer,
      ADD COLUMN IF NOT EXISTS vat_rate   numeric;
  END IF;
END $$;
