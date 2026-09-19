-- Execute against a disposable PostgreSQL database or Neon validation branch.
-- All fixtures are rolled back even on successful tests.
DO $test$
DECLARE rid uuid; slot uuid; oid uuid; again uuid; idem uuid:=gen_random_uuid(); qty integer;
BEGIN
 BEGIN
 INSERT INTO restaurants(name,email,address,vat_number,verified,approval_status)
 VALUES('Validation fixture','validation@example.invalid','Validation address','TEST',true,'APPROVED') RETURNING id INTO rid;
 INSERT INTO categories(id,name) VALUES('__rb_test__','Validation');
 INSERT INTO products(id,title,category,package_type,price_netto,vat_rate,stock)
 VALUES('__rb_test__','Validation','__rb_test__','5 kg',1000,700,10);
 INSERT INTO delivery_slots(delivery_date,"window",cutoff_at)
 VALUES(current_date+2,'08:00–12:00',now()+interval '1 day') RETURNING id INTO slot;
 oid:=rb_place_order(rid,idem,'test',slot,'card_on_delivery','[{"productId":"__rb_test__","quantity":2}]');
 again:=rb_place_order(rid,idem,'test',slot,'card_on_delivery','[{"productId":"__rb_test__","quantity":2}]');
 IF oid<>again THEN RAISE EXCEPTION 'Idempotency failed'; END IF;
 SELECT stock INTO qty FROM products WHERE id='__rb_test__';
 IF qty<>8 THEN RAISE EXCEPTION 'Reservation failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM orders WHERE id=oid AND total_amount_netto=2000 AND total_vat=140 AND total_amount_brutto=2140) THEN RAISE EXCEPTION 'Totals failed'; END IF;
 BEGIN
  PERFORM rb_place_order(rid,idem,'changed',slot,'card_on_delivery','[{"productId":"__rb_test__","quantity":1}]');
  RAISE EXCEPTION 'Conflicting retry accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Idempotency conflict' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM rb_place_order(rid,gen_random_uuid(),'invoice',slot,'invoice','[{"productId":"__rb_test__","quantity":1}]');
  RAISE EXCEPTION 'Unauthorized invoice accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Invoice not allowed' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE delivery_slots SET "window"='12:00–16:00' WHERE id=slot;
  RAISE EXCEPTION 'Booked slot changed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Booked delivery slots cannot change date or window' THEN RAISE; END IF;
 END;
 IF NOT rb_cancel_order(oid,'pending') THEN RAISE EXCEPTION 'Cancellation failed'; END IF;
 IF rb_cancel_order(oid,'pending') THEN RAISE EXCEPTION 'Double cancellation'; END IF;
 SELECT stock INTO qty FROM products WHERE id='__rb_test__';
 IF qty<>10 THEN RAISE EXCEPTION 'Stock release failed'; END IF;
 UPDATE categories SET active=false WHERE id='__rb_test__';
 BEGIN
  PERFORM rb_place_order(rid,gen_random_uuid(),'archived',slot,'card_on_delivery','[{"productId":"__rb_test__","quantity":1}]');
  RAISE EXCEPTION 'Archived category accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Insufficient stock' THEN RAISE; END IF;
 END;
 UPDATE restaurants SET verified=false,approval_status='DISABLED' WHERE id=rid;
 BEGIN
  PERFORM rb_place_order(rid,gen_random_uuid(),'blocked',slot,'card_on_delivery','[{"productId":"__rb_test__","quantity":1}]');
  RAISE EXCEPTION 'Unverified company accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Restaurant not verified' THEN RAISE; END IF;
 END;
 RAISE SQLSTATE 'ZX001' USING MESSAGE='rollback fixtures';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
END; $test$;
