-- All-language sweep, 2026-07-27. Owner: "make an all lang sweep english german italian and
-- french". APPLIED LIVE via apply_migration, then backfilled here per _rules/DB_SCHEMA.md s7.
--
-- THE STRUCTURAL HOLE. Solen ships de/en/fr/it, but six localizable columns existed in de+en
-- ONLY, so a French or Italian customer read GERMAN service names, German service
-- descriptions, German salon descriptions, German option names and German badge names. No
-- amount of work in messages/*.json could fix that, because this text lives in the database.
-- site_content had fr but not it.
--
-- Additive and idempotent. Nullable with no default: NULL means "not translated yet" and the
-- read helper falls back de -> en, which is exactly today's behaviour, so this migration alone
-- changes nothing a customer sees. The translations land as data afterwards.

alter table public.services            add column if not exists name_fr text;
alter table public.services            add column if not exists name_it text;
alter table public.services            add column if not exists description_fr text;
alter table public.services            add column if not exists description_it text;

alter table public.salons              add column if not exists description_fr text;
alter table public.salons              add column if not exists description_it text;

alter table public.service_options     add column if not exists name_fr text;
alter table public.service_options     add column if not exists name_it text;

alter table public.salon_badges        add column if not exists name_fr text;
alter table public.salon_badges        add column if not exists name_it text;

alter table public.nail_dynamic_pricing_rules add column if not exists label_fr text;
alter table public.nail_dynamic_pricing_rules add column if not exists label_it text;

alter table public.site_content        add column if not exists value_it text;

comment on column public.services.name_fr is
  'French service name. NULL = not translated yet; readers fall back de -> en (lib/i18n/localized-field.ts).';
comment on column public.services.name_it is
  'Italian service name. NULL = not translated yet; readers fall back de -> en.';
