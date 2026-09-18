-- Additive migration. Existing IDs, orders, prices and stock remain intact.
CREATE TYPE user_role AS ENUM ('CUSTOMER','ADMIN');
CREATE TYPE approval_status AS ENUM ('PENDING','APPROVED','REJECTED','DISABLED');
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preparing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready';
ALTER TABLE "user" ADD COLUMN role user_role NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE restaurants ADD COLUMN contact_person text;
ALTER TABLE restaurants ADD COLUMN billing_address text;
ALTER TABLE restaurants ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'PENDING';
UPDATE restaurants SET approval_status='APPROVED' WHERE verified;
ALTER TABLE restaurants ADD CONSTRAINT restaurant_approval_consistent CHECK (verified = (approval_status='APPROVED'));
CREATE TABLE categories (id text PRIMARY KEY, name text NOT NULL, active boolean NOT NULL DEFAULT true, translations jsonb NOT NULL DEFAULT '{}');
INSERT INTO categories (id,name) SELECT DISTINCT category,category FROM products;
ALTER TABLE products ADD COLUMN description text;
ALTER TABLE products ADD COLUMN origin text;
ALTER TABLE products ADD COLUMN species text;
ALTER TABLE products ADD COLUMN unit_weight text;
ALTER TABLE products ADD COLUMN image_url text;
ALTER TABLE products ADD COLUMN images jsonb NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN translations jsonb NOT NULL DEFAULT '{}';
ALTER TABLE products ADD CONSTRAINT products_category_fk FOREIGN KEY (category) REFERENCES categories(id);
CREATE INDEX orders_created_at_idx ON orders(created_at);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_restaurant_created_idx ON orders(restaurant_id,created_at);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX payments_order_idx ON payments(order_id);
CREATE INDEX delivery_slots_available_idx ON delivery_slots(enabled,cutoff_at);
CREATE INDEX products_category_active_idx ON products(category,active);
-- A cancellation releases reserved stock once, in the same transaction.
CREATE OR REPLACE FUNCTION rb_cancel_order(oid uuid, expected text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE target orders%ROWTYPE; line record;
BEGIN
 SELECT * INTO target FROM orders WHERE id=oid FOR UPDATE;
 IF NOT FOUND OR target.status::text<>expected OR target.status::text NOT IN ('pending','confirmed','processing','preparing','ready') THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM payments WHERE order_id=oid AND status='succeeded') THEN RAISE EXCEPTION 'Paid orders require payment reconciliation before cancellation'; END IF;
 FOR line IN SELECT product_id,quantity FROM order_items WHERE order_id=oid ORDER BY product_id LOOP
  UPDATE products SET stock=stock+line.quantity,stock_status=CASE WHEN stock+line.quantity<6 THEN 'low' ELSE 'in_stock' END WHERE id=line.product_id;
 END LOOP;
 UPDATE orders SET status='cancelled' WHERE id=oid;
 RETURN true;
END; $$;
