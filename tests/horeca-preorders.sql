-- Isolated Preview branch only, after 0032 and the opted-in announcement fixtures.
-- The nested savepoint rolls back every synthetic company, task, vote and preorder.
DO $test$
DECLARE sub text:='hx-fixture-'||gen_random_uuid();sub2 text:='hx-fixture-'||gen_random_uuid();cid uuid;cid2 uuid;r1 uuid;r2 uuid;task uuid;before_orders bigint;oid uuid;wh uuid;slot uuid;pid uuid:='a801b313-f911-4444-8000-000000000001';planned uuid:='c6d74e52-16f8-4510-bcc3-adb8c181e877';
BEGIN
 BEGIN
  SELECT count(*) INTO before_orders FROM orders;
  INSERT INTO customer_auth."user"(id,name,email,email_verified,created_at,updated_at) VALUES(sub,'PREVIEW INVARIANT buyer',sub||'@example.invalid',true,now(),now()),(sub2,'PREVIEW INVARIANT other',sub2||'@example.invalid',true,now(),now());
  cid:=(platform_register(sub,jsonb_build_object('name','PREVIEW INVARIANT buyer','address','TEST ONLY address','vatNumber',sub))->>'id')::uuid;
  cid2:=(platform_register(sub2,jsonb_build_object('name','PREVIEW INVARIANT other','address','TEST ONLY address','vatNumber',sub2))->>'id')::uuid;
  BEGIN PERFORM horeca_product_intent(sub,'reserve',pid,3,NULL);RAISE EXCEPTION 'Pending company accepted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CUSTOMER_APPROVAL_REQUIRED' THEN RAISE;END IF;END;
  UPDATE companies SET customer_state='approved' WHERE id IN(cid,cid2);
  r1:=(horeca_product_intent(sub,'reserve',pid,3,NULL)->>'id')::uuid;
  IF (horeca_product_intent(sub,'reserve',pid,3,NULL)->>'id')::uuid<>r1 THEN RAISE EXCEPTION 'Retry duplicated preorder';END IF;
  PERFORM horeca_product_intent(sub,'reserve',pid,7,NULL);
  IF NOT EXISTS(SELECT 1 FROM horeca_preorders WHERE id=r1 AND company_id=cid AND quantity=7 AND status='reserved') THEN RAISE EXCEPTION 'Quantity did not replace';END IF;
  IF jsonb_array_length(horeca_launch_state(sub2)->'preorders')<>0 THEN RAISE EXCEPTION 'Other company saw preorders';END IF;
  SELECT task_id INTO task FROM horeca_preorders WHERE id=r1;
  IF NOT EXISTS(SELECT 1 FROM platform_tasks WHERE id=task AND company_id=cid AND description LIKE '7 colis%' AND assignee_id IS NOT NULL) THEN RAISE EXCEPTION 'CRM task missing client or quantity';END IF;
  BEGIN PERFORM horeca_product_intent(sub,'reserve',planned,1,NULL);RAISE EXCEPTION 'Planned product reserved';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PREORDER_UNAVAILABLE' THEN RAISE;END IF;END;
  BEGIN PERFORM horeca_product_intent(sub,'reserve',pid,1001,NULL);RAISE EXCEPTION 'Oversized quantity accepted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'INVALID_QUANTITY' THEN RAISE;END IF;END;
  BEGIN PERFORM horeca_preorder_convert(rb_root_staff_id(),r1,gen_random_uuid());RAISE EXCEPTION 'Goods not received converted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PREORDER_STOCK_UNAVAILABLE' THEN RAISE;END IF;END;
  PERFORM horeca_product_intent(sub,'reserve',pid,0,NULL);
  IF NOT EXISTS(SELECT 1 FROM horeca_preorders WHERE id=r1 AND status='cancelled') OR NOT EXISTS(SELECT 1 FROM platform_tasks WHERE id=task AND status='cancelled') THEN RAISE EXCEPTION 'Cancellation failed';END IF;
  r2:=(horeca_product_intent(sub,'reserve',pid,2,NULL)->>'id')::uuid;
  IF r2=r1 THEN RAISE EXCEPTION 'Cancellation history overwritten';END IF;
  UPDATE horeca_product_launches SET demand_threshold=2 WHERE product_id=planned;
  PERFORM horeca_product_intent(sub,'interest',planned,NULL,true);PERFORM horeca_product_intent(sub,'interest',planned,NULL,true);
  IF (SELECT count(*) FROM horeca_product_interests WHERE company_id=cid AND product_id=planned)<>1 THEN RAISE EXCEPTION 'Repeated company vote counted twice';END IF;
  PERFORM horeca_product_intent(sub2,'interest',planned,NULL,true);
  IF (SELECT count(*) FROM horeca_demand_alerts WHERE product_id=planned)<>1 THEN RAISE EXCEPTION 'Demand threshold did not create one CRM task';END IF;
  PERFORM horeca_product_intent(sub2,'interest',planned,NULL,true);
  IF (SELECT count(*) FROM horeca_demand_alerts WHERE product_id=planned)<>1 THEN RAISE EXCEPTION 'Repeated vote duplicated alert';END IF;
  PERFORM horeca_product_intent(sub,'interest',planned,NULL,false);PERFORM horeca_product_intent(sub,'interest',planned,NULL,false);
  IF EXISTS(SELECT 1 FROM horeca_product_interests WHERE company_id=cid AND product_id=planned) THEN RAISE EXCEPTION 'Vote not removed';END IF;
  UPDATE companies SET customer_state='blocked' WHERE id=cid;
  PERFORM horeca_product_intent(sub,'reserve',pid,0,NULL);
  IF (SELECT count(*) FROM orders)<>before_orders THEN RAISE EXCEPTION 'Intent created payable order';END IF;
  -- Receipt and approved current price exist only inside this rolled-back fixture.
  UPDATE companies SET customer_state='approved',country='FR',discount_pct=0 WHERE id=cid;
  r2:=(horeca_product_intent(sub,'reserve',pid,2,NULL)->>'id')::uuid;
  SELECT id INTO wh FROM warehouses ORDER BY id LIMIT 1;
  IF wh IS NULL THEN RAISE EXCEPTION 'Fixture requires an existing warehouse';END IF;
  INSERT INTO stock_lots(product_id,warehouse_id,lot_code,expiry_date,physical_qty) VALUES(pid,wh,'PREVIEW-INVARIANT-'||sub,current_date+30,100);
  INSERT INTO commerce_price_list_items(list_code,product_id,purchase_price,markup_pct,manual_price,is_published,updated_by) VALUES('FR_HORECA',pid,60,0,120,true,rb_root_staff_id());
  INSERT INTO commerce_tax_policies(company_id,product_id,rate,basis,evidence,valid_until,approved_by) VALUES(cid,pid,20,'PREVIEW SYNTHETIC ONLY','PREVIEW fixture, not a legal tax determination',current_date+30,rb_root_staff_id());
  INSERT INTO delivery_slots(delivery_date,"window",cutoff_at,warehouse_id) VALUES(current_date+2,'08:00–12:00',now()+interval '1 day',wh) RETURNING id INTO slot;
  oid:=(horeca_preorder_convert(rb_root_staff_id(),r2,slot)->>'id')::uuid;
  IF (horeca_preorder_convert(rb_root_staff_id(),r2,slot)->>'id')::uuid<>oid THEN RAISE EXCEPTION 'Conversion retry duplicated order';END IF;
  IF NOT EXISTS(SELECT 1 FROM orders WHERE id=oid AND company_id=cid AND channel='horeca') OR NOT EXISTS(SELECT 1 FROM order_items WHERE order_id=oid AND product_id=pid AND qty=0.5 AND unit_price=120) THEN RAISE EXCEPTION 'Current canonical price or gram package conversion incorrect';END IF;
  IF (SELECT count(*) FROM orders WHERE company_id=cid)<>1 OR (SELECT sum(physical_qty) FROM stock_lots WHERE product_id=pid)<>100 THEN RAISE EXCEPTION 'Conversion duplicated order or deducted physical stock';END IF;
  RAISE SQLSTATE 'ZX001' USING MESSAGE='rollback preview invariant fixtures';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
END $test$;
