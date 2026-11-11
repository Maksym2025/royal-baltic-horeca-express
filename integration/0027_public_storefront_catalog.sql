-- Apply to existing Commerce Core only, after a fresh backup. No data migration.
BEGIN;
CREATE OR REPLACE FUNCTION public.platform_public_catalog() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
 'id',p.id,'title',p.name,'category',COALESCE(p.species,'seafood'),
 'description',p.product_form,'origin',NULL,'species',p.species,
 'unitWeight',p.pack_weight::text||' kg','imageUrl',NULL,'images','[]'::jsonb,
 'translations','{}'::jsonb,'packageType',p.pack_weight::text||' kg',
 'priceNetto',round(p.selling_price*p.pack_weight*100),'vatRate',0,
 'stock',greatest(0,floor(COALESCE((SELECT sum(physical_qty-reserved_qty) FROM public.stock_lots WHERE product_id=p.id AND NOT quarantined AND expiry_date>=current_date),0)/p.pack_weight)),
 'stockStatus','catalog','active',true) ORDER BY p.name),'[]'::jsonb)
 FROM public.products p WHERE p.selling_price>0 AND p.pack_weight>0;
$$;
REVOKE ALL ON FUNCTION public.platform_public_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_public_catalog() TO rb_store_channel;
COMMIT;
