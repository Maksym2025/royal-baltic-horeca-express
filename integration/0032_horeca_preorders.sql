-- Additive extension of the EXISTING Commerce Core. Validate on its Preview branch.
-- No new inventory, payable-order, invoice or payment ledger.
BEGIN;
CREATE TABLE public.horeca_product_launches (
 product_id uuid PRIMARY KEY REFERENCES public.products(id),
 mode text NOT NULL CHECK(mode IN ('preorder','planned','regular')),
 expected_at date,
 indicative_cents integer NOT NULL CHECK(indicative_cents>0),
 package_translations jsonb NOT NULL DEFAULT '{}',
 image_url text,
 demand_threshold integer NOT NULL DEFAULT 20 CHECK(demand_threshold BETWEEN 1 AND 100000),
 updated_by uuid NOT NULL REFERENCES public.staff_users(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(mode<>'preorder' OR expected_at IS NOT NULL)
);
CREATE TABLE public.horeca_preorders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id),
 product_id uuid NOT NULL REFERENCES public.products(id),
 subject text NOT NULL REFERENCES customer_auth."user"(id),
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 1000),
 status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','cancelled','converted')),
 task_id uuid NOT NULL REFERENCES public.platform_tasks(id),
 order_id uuid UNIQUE REFERENCES public.orders(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((status='converted')=(order_id IS NOT NULL))
);
CREATE UNIQUE INDEX horeca_preorder_active ON public.horeca_preorders(company_id,product_id) WHERE status='reserved';
CREATE INDEX horeca_preorder_company ON public.horeca_preorders(company_id,created_at DESC);
CREATE TABLE public.horeca_product_interests (
 company_id uuid NOT NULL REFERENCES public.companies(id),
 product_id uuid NOT NULL REFERENCES public.products(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(company_id,product_id)
);
CREATE INDEX horeca_interests_product ON public.horeca_product_interests(product_id);
CREATE TABLE public.horeca_demand_alerts (
 product_id uuid PRIMARY KEY REFERENCES public.products(id),
 task_id uuid NOT NULL REFERENCES public.platform_tasks(id)
);

CREATE FUNCTION public.horeca_launch_public() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'id',p.id,'title',coalesce(c.translations->'fr'->>'title',p.name),'category',coalesce(p.species,'seafood'),
 'description',coalesce(c.translations->'fr'->>'description',p.product_form),'origin',null,'species',p.species,
 'unitWeight',p.pack_weight::text||' kg','packageType',coalesce(l.package_translations->>'fr',p.pack_weight::text||' kg'),
 'packageTranslations',l.package_translations,'translations',coalesce(c.translations,'{}'),
 'imageUrl',coalesce(l.image_url,CASE WHEN cardinality(c.image_ids)>0 THEN '/api/catalog/images/'||c.image_ids[1]::text END),
 'images','[]'::jsonb,'priceNetto',l.indicative_cents,'vatRate',0,'stock',0,'stockStatus','out_of_stock','active',true,
 'launchMode',l.mode,'expectedAt',l.expected_at,'demandThreshold',l.demand_threshold
 ) ORDER BY l.expected_at NULLS LAST,p.name),'[]') FROM horeca_product_launches l JOIN products p ON p.id=l.product_id
 JOIN horeca_catalog_cards c ON c.product_id=p.id WHERE l.mode IN ('preorder','planned') AND c.visibility='published';
$$;

CREATE FUNCTION public.horeca_launch_state(sub text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT jsonb_build_object(
 'counts',coalesce((SELECT jsonb_object_agg(product_id,n) FROM(SELECT product_id,count(*)::int n FROM horeca_product_interests GROUP BY product_id)x),'{}'),
 'liked',coalesce((SELECT jsonb_agg(i.product_id) FROM horeca_product_interests i JOIN customer_memberships m ON m.company_id=i.company_id WHERE m.subject=sub),'[]'),
 'preorders',coalesce((SELECT jsonb_agg(x ORDER BY x."createdAt" DESC) FROM (
 SELECT r.id,r.product_id "productId",r.quantity,r.status,r.order_id "orderId",p.name title,coalesce(c.translations,'{}') translations,
 coalesce(l.package_translations->>'fr',p.pack_weight::text||' kg') "packageType",r.created_at "createdAt"
 FROM horeca_preorders r JOIN customer_memberships m ON m.company_id=r.company_id JOIN products p ON p.id=r.product_id
 LEFT JOIN horeca_catalog_cards c ON c.product_id=p.id LEFT JOIN horeca_product_launches l ON l.product_id=p.id
 WHERE m.subject=sub ORDER BY (r.status='reserved') DESC,r.created_at DESC LIMIT 200)x),'[]'));
$$;

CREATE FUNCTION public.horeca_product_intent(sub text,act text,pid uuid,qty integer,wanted boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE buyer companies%ROWTYPE;launch horeca_product_launches%ROWTYPE;existing horeca_preorders%ROWTYPE;task uuid;actor uuid;total integer;result uuid;
BEGIN
 SELECT c.* INTO buyer FROM customer_memberships m JOIN companies c ON c.id=m.company_id WHERE m.subject=sub FOR UPDATE OF c;
 IF buyer.id IS NULL THEN RAISE EXCEPTION 'COMPANY_REGISTRATION_REQUIRED';END IF;
 IF buyer.customer_state<>'approved' AND NOT(act='reserve' AND qty=0) THEN RAISE EXCEPTION 'CUSTOMER_APPROVAL_REQUIRED';END IF;
 IF NOT commerce_rate_limit('horeca-intent:'||buyer.id::text,60,60) THEN RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';END IF;
 SELECT * INTO launch FROM horeca_product_launches WHERE product_id=pid FOR SHARE;
 SELECT s.id INTO actor FROM staff_users s JOIN staff_roles r ON r.staff_id=s.id WHERE r.role_id='channel_service' AND s.active LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'CHANNEL_NOT_CONFIGURED';END IF;
 IF act='reserve' THEN
  IF qty IS NULL OR qty<0 OR qty>1000 THEN RAISE EXCEPTION 'INVALID_QUANTITY';END IF;
  SELECT * INTO existing FROM horeca_preorders WHERE company_id=buyer.id AND product_id=pid AND status='reserved' FOR UPDATE;
  IF qty=0 THEN
   IF existing.id IS NOT NULL THEN
    UPDATE horeca_preorders SET status='cancelled',updated_at=now() WHERE id=existing.id;
    UPDATE platform_tasks SET status='cancelled',title='Précommande annulée · '||(SELECT name FROM products WHERE id=pid),description='Annulée par le client.',updated_at=now() WHERE id=existing.task_id;
   END IF;
   RETURN jsonb_build_object('id',existing.id);
  END IF;
  IF launch.product_id IS NULL OR launch.mode<>'preorder' OR NOT EXISTS(SELECT 1 FROM horeca_catalog_cards WHERE product_id=pid AND visibility='published') THEN RAISE EXCEPTION 'PREORDER_UNAVAILABLE';END IF;
  IF existing.id IS NULL THEN
   INSERT INTO platform_tasks(title,description,company_id,priority,created_by,assignee_id,due_at)
   VALUES('Précommande · '||(SELECT name FROM products WHERE id=pid),qty::text||' colis. Arrivée prévue : '||launch.expected_at::text||'. Sans paiement. Confirmer le prix et créer la commande après réception du stock.',buyer.id,'normal',actor,rb_root_staff_id(),launch.expected_at::timestamptz) RETURNING id INTO task;
   INSERT INTO horeca_preorders(company_id,product_id,subject,quantity,task_id) VALUES(buyer.id,pid,sub,qty,task) RETURNING id INTO result;
  ELSE
   UPDATE horeca_preorders SET quantity=qty,updated_at=now() WHERE id=existing.id RETURNING id INTO result;
   UPDATE platform_tasks SET description=qty::text||' colis. Arrivée prévue : '||launch.expected_at::text||'. Sans paiement. Prix final à confirmer avant facturation.',updated_at=now() WHERE id=existing.task_id;
  END IF;
  INSERT INTO platform_events(actor_id,entity_type,entity_id,action,detail) VALUES(actor,'preorder',result,'horeca.preorder_saved',jsonb_build_object('companyId',buyer.id,'productId',pid,'quantity',qty,'subject',sub));
  RETURN jsonb_build_object('id',result);
 ELSIF act='interest' THEN
  IF wanted IS NULL THEN RAISE EXCEPTION 'INVALID_INTEREST';END IF;
  IF NOT wanted THEN DELETE FROM horeca_product_interests WHERE company_id=buyer.id AND product_id=pid;RETURN jsonb_build_object('interested',false);END IF;
  -- Take the canonical product lock so concurrent votes create one demand task.
  PERFORM 1 FROM products WHERE id=pid FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(platform_public_catalog()||horeca_launch_public()) p WHERE p->>'id'=pid::text AND (p->>'stock')::numeric=0) THEN RAISE EXCEPTION 'INTEREST_UNAVAILABLE';END IF;
  INSERT INTO horeca_product_interests(company_id,product_id) VALUES(buyer.id,pid) ON CONFLICT DO NOTHING;
  SELECT count(*) INTO total FROM horeca_product_interests WHERE product_id=pid;
  IF total>=coalesce(launch.demand_threshold,20) AND NOT EXISTS(SELECT 1 FROM horeca_demand_alerts WHERE product_id=pid) THEN
   INSERT INTO platform_tasks(title,description,priority,created_by,assignee_id) VALUES('Demande assortiment · '||(SELECT name FROM products WHERE id=pid),total::text||' entreprises intéressées. Examiner la demande et décider de l’entrée en assortiment. Aucun achat ou ordre automatique.','normal',actor,rb_root_staff_id()) RETURNING id INTO task;
   INSERT INTO horeca_demand_alerts(product_id,task_id) VALUES(pid,task);
  END IF;
  RETURN jsonb_build_object('interested',true);
 ELSE RAISE EXCEPTION 'INVALID_INTENT';END IF;
END $$;

-- Existing CRM staff API may call these functions after its usual authentication.
CREATE FUNCTION public.horeca_preorders_admin(actor uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF NOT horeca_catalog_editor(actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED';END IF;
 RETURN jsonb_build_object('preorders',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT r.*,c.legal_name,c.normalized_email,p.name FROM horeca_preorders r JOIN companies c ON c.id=r.company_id JOIN products p ON p.id=r.product_id ORDER BY r.created_at DESC)x),'[]'),
 'demand',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT i.product_id,p.name,count(*)::int interested,coalesce(l.demand_threshold,20) threshold FROM horeca_product_interests i JOIN products p ON p.id=i.product_id LEFT JOIN horeca_product_launches l ON l.product_id=p.id GROUP BY i.product_id,p.name,l.demand_threshold)x),'[]'));
END $$;
CREATE FUNCTION public.horeca_preorder_convert(actor uuid,rid uuid,slot_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE r horeca_preorders%ROWTYPE;cid uuid;result jsonb;pack numeric;
BEGIN
 IF NOT horeca_catalog_editor(actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED';END IF;
 SELECT company_id INTO cid FROM horeca_preorders WHERE id=rid;
 PERFORM 1 FROM companies WHERE id=cid FOR UPDATE;
 SELECT * INTO r FROM horeca_preorders WHERE id=rid FOR UPDATE;
 IF r.id IS NULL OR r.status='cancelled' THEN RAISE EXCEPTION 'PREORDER_UNAVAILABLE';END IF;
 IF r.status='converted' THEN RETURN jsonb_build_object('id',r.order_id);END IF;
 SELECT pack_weight INTO pack FROM products WHERE id=r.product_id FOR UPDATE;
 IF (SELECT coalesce(sum(physical_qty-reserved_qty),0) FROM stock_lots WHERE product_id=r.product_id AND NOT quarantined AND expiry_date>=current_date)<pack*r.quantity THEN RAISE EXCEPTION 'PREORDER_STOCK_UNAVAILABLE';END IF;
 IF NOT EXISTS(SELECT 1 FROM customer_memberships WHERE subject=r.subject AND company_id=r.company_id) THEN RAISE EXCEPTION 'CUSTOMER_MEMBERSHIP_CHANGED';END IF;
 result:=platform_channel(r.subject,'place_order',jsonb_build_object('context',jsonb_build_object('deliverySlotId',slot_id,'preorderId',r.id,'paymentMethod','advance'),'items',jsonb_build_array(jsonb_build_object('productId',r.product_id,'cases',r.quantity))),r.id);
 UPDATE horeca_preorders SET status='converted',order_id=(result->>'id')::uuid,updated_at=now() WHERE id=r.id;
 UPDATE platform_tasks SET order_id=(result->>'id')::uuid,title='Précommande à facturer · '||(SELECT name FROM products WHERE id=r.product_id),description='Commande créée au prix courant. Facturation et réception du paiement via le processus Finance existant. Ne pas expédier sans validation Root.',updated_at=now() WHERE id=r.task_id;
 INSERT INTO platform_events(actor_id,entity_type,entity_id,action,detail) VALUES(actor,'preorder',r.id,'horeca.preorder_converted',jsonb_build_object('orderId',result->>'id'));
 RETURN result;
END $$;
REVOKE ALL ON public.horeca_product_launches,public.horeca_preorders,public.horeca_product_interests,public.horeca_demand_alerts FROM PUBLIC,rb_store_channel;
REVOKE ALL ON FUNCTION public.horeca_launch_public(),public.horeca_launch_state(text),public.horeca_product_intent(text,text,uuid,integer,boolean),public.horeca_preorders_admin(uuid),public.horeca_preorder_convert(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.horeca_launch_public(),public.horeca_launch_state(text),public.horeca_product_intent(text,text,uuid,integer,boolean) TO rb_store_channel;
COMMIT;
