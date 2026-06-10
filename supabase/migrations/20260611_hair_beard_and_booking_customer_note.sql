-- Approved hair-step v3 (2026-06-11): beard preference lives on the PROFILE
-- (a lasting fact about the customer), the note lives on the BOOKING (a wish
-- for this one appointment, read by the salon).
alter table public.profiles add column if not exists hair_beard text;
alter table public.bookings add column if not exists customer_note text;
comment on column public.profiles.hair_beard is 'none | short | full — beard preference for barber bookings (hair step v3)';
comment on column public.bookings.customer_note is 'Optional one-line customer wish for this appointment, entered in the booking hair step';
