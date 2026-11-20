-- Additive editorial fields on the EXISTING shared catalog. Preview first.
BEGIN;
ALTER TABLE public.horeca_catalog_cards
 ADD COLUMN storage_condition text NOT NULL DEFAULT 'unspecified' CHECK (storage_condition IN ('chilled','frozen','unspecified')),
 ADD COLUMN temperature_min_c numeric(4,1),
 ADD COLUMN temperature_max_c numeric(4,1),
 ADD COLUMN processing_method text NOT NULL DEFAULT 'unspecified' CHECK (processing_method IN ('unprocessed','hot-smoked','cold-smoked','smoked','salted','dried','unspecified')),
 ADD CONSTRAINT horeca_catalog_temperature_range CHECK (
   (temperature_min_c IS NULL OR temperature_min_c BETWEEN -80 AND 40)
   AND (temperature_max_c IS NULL OR temperature_max_c BETWEEN -80 AND 40)
   AND (temperature_min_c IS NULL OR temperature_max_c IS NULL OR temperature_min_c <= temperature_max_c)
   AND (storage_condition <> 'frozen' OR (temperature_min_c IS NULL OR temperature_min_c <= 0) AND (temperature_max_c IS NULL OR temperature_max_c <= 0))
 );
CREATE FUNCTION public.horeca_catalog_facets() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',product_id,
   'storageCondition',storage_condition,'temperatureMinC',temperature_min_c,
   'temperatureMaxC',temperature_max_c,'processingMethod',processing_method)), '[]'::jsonb)
 FROM horeca_catalog_cards WHERE visibility='published';
$$;
REVOKE ALL ON FUNCTION public.horeca_catalog_facets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.horeca_catalog_facets() TO rb_store_channel;
COMMENT ON COLUMN public.horeca_catalog_cards.temperature_max_c IS 'Approved product-label storage maximum in Celsius. NULL means unconfirmed; never a fleet sensor reading.';
COMMENT ON COLUMN public.horeca_catalog_cards.processing_method IS 'Approved product preparation; smoked does not imply hot-smoked or cold-smoked.';
COMMIT;
