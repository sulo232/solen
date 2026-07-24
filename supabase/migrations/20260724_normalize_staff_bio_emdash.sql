-- No em-dashes in user-facing copy (owner rule). Staff bios were backfilled with an
-- em-dash separator ("Teil unseres Teams — freut sich auf deinen Besuch"); the stylist
-- profile renders staff_members.bio verbatim (StaffProfilePage.tsx:317), so normalize any
-- em-dash in a bio to a comma. Idempotent; only touches rows that still contain one.
update public.staff_members
set bio = regexp_replace(bio, '\s*—\s*', ', ', 'g')
where bio like '%—%';
