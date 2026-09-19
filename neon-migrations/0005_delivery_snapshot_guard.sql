-- A checkout takes a row lock on its delivery slot. The trigger rechecks references
-- after an admin UPDATE obtains the row lock, closing the API pre-check race.
CREATE OR REPLACE FUNCTION rb_guard_delivery_slot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.delivery_date IS DISTINCT FROM OLD.delivery_date OR NEW."window" IS DISTINCT FROM OLD."window")
    AND EXISTS(SELECT 1 FROM orders WHERE delivery_slot_id=OLD.id) THEN
  RAISE EXCEPTION 'Booked delivery slots cannot change date or window';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER delivery_slot_snapshot_guard BEFORE UPDATE ON delivery_slots
FOR EACH ROW EXECUTE FUNCTION rb_guard_delivery_slot();
