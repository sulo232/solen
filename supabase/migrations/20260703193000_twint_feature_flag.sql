-- exists-check: net-new gate flag. Applied via apply_migration; mirrored here. Additive.
-- Gates the Karte/TWINT checkout chooser so it does not render a broken control before TWINT is
-- enabled on the Stripe platform + connected accounts hold the twint_payments capability.
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('twint', false, 'Offer TWINT at checkout (flip on once TWINT is enabled on the Stripe platform + connected accounts have the twint_payments capability)')
ON CONFLICT (key) DO NOTHING;
