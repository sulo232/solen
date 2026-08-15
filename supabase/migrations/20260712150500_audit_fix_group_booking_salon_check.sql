-- exists-check: extends supabase/migrations/20260709184658_audit_fix_create_group_booking_rpc_2.sql
-- (CREATE OR REPLACE of the same create_group_booking() function; additive migration,
-- not a new table/route. npm run exists group_booking_salon_check -> 0 matches, genuinely new)
-- Security fix: create_group_booking() never verified the client-supplied p_salon_id
-- against the actual salon_id of the slot/service/staff being booked. A caller could
-- book a real slot at Salon A while attributing the group booking to Salon B,
-- corrupting both salons' calendars. Mirrors the same fix already shipped in
-- app/api/bookings/express-rebook/confirm/route.ts (slot.salon_id is the source of
-- truth; service_id/staff_member_id must belong to that same salon).
CREATE OR REPLACE FUNCTION public.create_group_booking(p_organizer_name text, p_salon_id uuid, p_group_size integer, p_event_type text, p_members jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
DECLARE
  v_group_id uuid; v_member jsonb; v_status text;
  v_starts timestamptz; v_ends timestamptz; v_slot_staff uuid; v_override numeric; v_price numeric; v_booking_id uuid;
  v_slot_salon_id uuid; v_service_salon_id uuid; v_staff_salon_id uuid; v_staff_member_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Must be signed in to create a group booking' USING ERRCODE = '42501';
  END IF;
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    SELECT status, salon_id INTO v_status, v_slot_salon_id FROM availability_slots WHERE id = (v_member->>'slot_id')::uuid FOR UPDATE;
    IF v_status IS NULL OR v_status <> 'available' THEN
      RAISE EXCEPTION 'Slot % is not available', v_member->>'slot_id';
    END IF;
    IF v_slot_salon_id IS DISTINCT FROM p_salon_id THEN
      RAISE EXCEPTION 'Slot % does not belong to salon %', v_member->>'slot_id', p_salon_id USING ERRCODE = '42501';
    END IF;
    SELECT salon_id INTO v_service_salon_id FROM services WHERE id = (v_member->>'service_id')::uuid;
    IF v_service_salon_id IS DISTINCT FROM p_salon_id THEN
      RAISE EXCEPTION 'Service % does not belong to salon %', v_member->>'service_id', p_salon_id USING ERRCODE = '42501';
    END IF;
    v_staff_member_id := nullif(v_member->>'staff_member_id','')::uuid;
    IF v_staff_member_id IS NOT NULL THEN
      SELECT salon_id INTO v_staff_salon_id FROM staff_members WHERE id = v_staff_member_id;
      IF v_staff_salon_id IS DISTINCT FROM p_salon_id THEN
        RAISE EXCEPTION 'Staff member % does not belong to salon %', v_staff_member_id, p_salon_id USING ERRCODE = '42501';
      END IF;
    END IF;
  END LOOP;
  INSERT INTO group_bookings (organizer_name, organizer_user_id, salon_id, group_size, event_type)
  VALUES (p_organizer_name, (SELECT auth.uid()), p_salon_id, p_group_size, p_event_type)
  RETURNING id INTO v_group_id;
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    SELECT starts_at, ends_at, staff_member_id, price_override
      INTO v_starts, v_ends, v_slot_staff, v_override
      FROM availability_slots WHERE id = (v_member->>'slot_id')::uuid;
    SELECT price INTO v_price FROM services WHERE id = (v_member->>'service_id')::uuid;
    INSERT INTO bookings (user_id, salon_id, slot_id, service_id, staff_member_id, group_booking_id,
                          starts_at, ends_at, price_paid, status, payment_status)
    VALUES ((SELECT auth.uid()), p_salon_id, (v_member->>'slot_id')::uuid, (v_member->>'service_id')::uuid,
            coalesce(nullif(v_member->>'staff_member_id','')::uuid, v_slot_staff), v_group_id,
            v_starts, v_ends, coalesce(v_override, v_price, 0), 'pending', 'pending')
    RETURNING id INTO v_booking_id;
    UPDATE availability_slots SET status = 'booked', booked_by = (SELECT auth.uid()), booking_id = v_booking_id
      WHERE id = (v_member->>'slot_id')::uuid;
  END LOOP;
  RETURN v_group_id;
END; $function$;
