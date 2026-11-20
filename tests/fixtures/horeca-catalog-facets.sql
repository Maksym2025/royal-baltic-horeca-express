-- Preview ONLY. These six SKU temperatures are the original demo specifications
-- from lib/catalog.ts. Confirm actual product labels before production.
BEGIN;
DO $$ BEGIN
 IF current_setting('horeca.preview_seed',true) IS DISTINCT FROM 'confirmed' THEN RAISE EXCEPTION 'PREVIEW_SEED_REQUIRES_EXPLICIT_OPT_IN'; END IF;
END $$;
UPDATE horeca_catalog_cards c SET storage_condition=v.storage,
 temperature_min_c=v.min_c, temperature_max_c=v.max_c, processing_method=v.method
FROM (VALUES
 ('10442','chilled',0::numeric,2::numeric,'unprocessed'),
 ('20881','frozen',NULL,-18,'unprocessed'),
 ('30129','frozen',NULL,-18,'unprocessed'),
 ('44090','chilled',0,4,'salted'),
 ('10456','frozen',NULL,-18,'unprocessed'),
 ('20912','frozen',NULL,-18,'unspecified')
) v(sku,storage,min_c,max_c,method) JOIN products p ON p.sku=v.sku
WHERE c.product_id=p.id;
UPDATE horeca_catalog_cards SET processing_method='smoked' WHERE product_id='a801b313-f911-4444-8000-000000000004';
COMMIT;
