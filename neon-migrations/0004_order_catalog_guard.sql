-- Preserve ordering, idempotency, price snapshots and stock locks; reject archived categories.
-- One PostgreSQL transaction owns validation, inventory reservations and snapshots.
CREATE OR REPLACE FUNCTION rb_place_order(
  rid uuid,
  idem uuid,
  fingerprint text,
  slot_id uuid,
  method text,
  items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $rb_order$
DECLARE
  customer restaurants%ROWTYPE;
  delivery delivery_slots%ROWTYPE;
  existing orders%ROWTYPE;
  product products%ROWTYPE;
  line jsonb;
  order_id uuid := gen_random_uuid();
  qty integer;
  net integer := 0;
  tax integer := 0;
BEGIN
  SELECT * INTO customer FROM restaurants WHERE id = rid FOR UPDATE;
  IF NOT FOUND OR NOT customer.verified THEN
    RAISE EXCEPTION 'Restaurant not verified';
  END IF;

  SELECT * INTO existing FROM orders WHERE restaurant_id = rid AND idempotency_key = idem;
  IF FOUND THEN
    IF existing.request_hash <> fingerprint THEN
      RAISE EXCEPTION 'Idempotency conflict';
    END IF;
    RETURN existing.id;
  END IF;

  IF method NOT IN ('invoice', 'card_on_delivery', 'advance') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  IF method = 'invoice' AND customer.payment_terms <> 'INVOICE_7_DAYS' THEN
    RAISE EXCEPTION 'Invoice not allowed';
  END IF;

  SELECT * INTO delivery
  FROM delivery_slots
  WHERE id = slot_id AND enabled AND cutoff_at > now()
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery slot unavailable';
  END IF;

  IF jsonb_typeof(items) <> 'array' OR jsonb_array_length(items) < 1 OR jsonb_array_length(items) > 100 THEN
    RAISE EXCEPTION 'Invalid items';
  END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(items)) <>
     (SELECT count(DISTINCT x->>'productId') FROM jsonb_array_elements(items) x) THEN
    RAISE EXCEPTION 'Duplicate products';
  END IF;

  FOR line IN SELECT value FROM jsonb_array_elements(items) ORDER BY value->>'productId' LOOP
    qty := (line->>'quantity')::integer;
    IF qty IS NULL OR qty < 1 OR qty > 1000 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;
    SELECT * INTO product FROM products WHERE id = line->>'productId' AND active AND EXISTS (SELECT 1 FROM categories WHERE categories.id=products.category AND categories.active) FOR UPDATE;
    IF NOT FOUND OR product.stock < qty THEN
      RAISE EXCEPTION 'Insufficient stock';
    END IF;
    net := net + product.price_netto * qty;
    tax := tax + round(product.price_netto::numeric * qty * product.vat_rate / 10000)::integer;
  END LOOP;

  INSERT INTO orders(
    id, restaurant_id, idempotency_key, request_hash,
    total_amount_netto, total_vat, total_amount_brutto, status,
    delivery_date, delivery_slot_id, delivery_address, payment_method
  ) VALUES (
    order_id, rid, idem, fingerprint,
    net, tax, net + tax, 'pending',
    delivery.delivery_date, slot_id, customer.address, method
  );

  FOR line IN SELECT value FROM jsonb_array_elements(items) ORDER BY value->>'productId' LOOP
    qty := (line->>'quantity')::integer;
    SELECT * INTO product FROM products WHERE id = line->>'productId';
    INSERT INTO order_items(order_id, product_id, quantity, price_at_moment, vat_rate, product_title, package_type)
    VALUES(order_id, product.id, qty, product.price_netto, product.vat_rate, product.title, product.package_type);
    UPDATE products
    SET stock = stock - qty,
        stock_status = CASE
          WHEN stock - qty = 0 THEN 'out_of_stock'
          WHEN stock - qty < 6 THEN 'low'
          ELSE 'in_stock'
        END
    WHERE id = product.id;
  END LOOP;

  INSERT INTO payments(order_id, amount, currency, status)
  VALUES(order_id, net + tax, 'eur', 'pending');

  RETURN order_id;
END;
$rb_order$;
