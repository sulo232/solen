-- Walk-in P1: pay → number.
-- Adds the per-ticket fields the queue table needs so a successful payment can issue
-- a stable ticket code (e.g. "A47") and link the Stripe PaymentIntent to the entry.

ALTER TABLE barber_walkin_queue
  ADD COLUMN IF NOT EXISTS ticket_code text,
  ADD COLUMN IF NOT EXISTS payment_intent_id text;

-- Unique per payment intent: a client + webhook-backstop race can't double-issue a
-- ticket for one payment. Partial (NULLs allowed) so non-paid entries are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_barber_walkin_queue_payment_intent
  ON barber_walkin_queue (payment_intent_id) WHERE payment_intent_id IS NOT NULL;

-- Ticket code unique per salon (per-day uniqueness comes from generation logic;
-- NULL ticket_codes never conflict in a Postgres unique index).
CREATE UNIQUE INDEX IF NOT EXISTS uq_barber_walkin_queue_salon_ticket
  ON barber_walkin_queue (salon_id, ticket_code);
