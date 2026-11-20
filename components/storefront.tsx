"use client";
import { useEffect, useState, useCallback } from "react";
import { kilograms } from "@/lib/cart-math";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Minus,
  Search,
  ShoppingBag,
  Truck,
  Package,
  Fish,
  Snowflake,
  Thermometer,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { type LiveProduct } from "@/lib/live-api";
import { readShopCart, cartKey, type ShopCart } from "@/lib/shop-cart";
import {
  productStorage,
  productDescription,
  type StorageCondition,
} from "@/lib/product-storage";
import { useI18n } from "./i18n-provider";
import { useProductIntent } from "./product-intent-provider";
import { DemandHeart, PreorderControl, IntentFeedback } from "./product-intent";
import { shopCopy } from "./shop-copy";
import { catalogCopy, categoryLabel } from "./catalog-copy";
import { matchesProcessing, processingMethods, type ProcessingMethod } from "@/lib/product-facets";
import { ProductStorageBadge, ProductPreparation } from "./product-facts";
export function Storefront({
  featured = false,
  basket = false,
  selection,
}: {
  featured?: boolean;
  basket?: boolean;
  selection?: string[];
}) {
  const { t, locale } = useI18n();
  const c = shopCopy[locale];
  const f = catalogCopy[locale];
  const intent = useProductIntent();
  const { data: session, isPending } = useSession();
  const userId = session?.user.id || "guest";
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [cart, setCart] = useState<ShopCart>({});
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [storage, setStorage] = useState<StorageCondition | "">("");
  const [category, setCategory] = useState("");
  const [processing, setProcessing] = useState<ProcessingMethod | "">("");
  const [query, setQuery] = useState("");
  useEffect(()=>{
    if (featured || basket) return;
    const restore = () => {
      const params=new URLSearchParams(window.location.search);
      setQuery(params.get("q")||"");
      setCategory(params.get("category")||"");
      const storage = params.get("storage"), processing = params.get("processing");
      setStorage(storage === "chilled" || storage === "frozen" ? storage : "");
      setProcessing(processingMethods.includes(processing as ProcessingMethod) ? processing as ProcessingMethod : "");
    };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  },[featured,basket]);
  function filter(key: "q" | "category" | "storage" | "processing", value: string) {
    const params = new URLSearchParams(window.location.search);
    if(value) params.set(key,value); else params.delete(key);
    const url = `${window.location.pathname}${params.size ? `?${params}` : ""}`;
    window.history[key === "q" ? "replaceState" : "pushState"]({}, "", url);
    if(key === "q") setQuery(value);
    if(key === "category") setCategory(value);
    if(key === "storage") setStorage(value as StorageCondition | "");
    if(key === "processing") setProcessing(value as ProcessingMethod | "");
  }
  function resetFilters() {
    setStorage(""); setProcessing(""); setCategory(""); setQuery("");
    const params = new URLSearchParams(window.location.search);
    ["storage","processing","category","q"].forEach(key => params.delete(key));
    window.history.pushState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }
  const [view, setView] = useState<"grid" | "quick">("grid");
  const viewLabels = locale === "ru" ? ["Плитка", "Быстрый заказ"] : locale === "fr" ? ["Grille", "Commande rapide"] : locale === "de" ? ["Kacheln", "Schnellbestellung"] : ["Grid", "Quick order"];
  const [sort, setSort] = useState("name");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const p = await fetch("/api/catalog").then(async r => { if (!r.ok) throw new Error("catalog"); return await r.json() as LiveProduct[]; });
      setProducts(p);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // Synchronize the catalog with the external API on initial mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    if (isPending) return;
    const restore = () => {
      setCart(readShopCart(userId));
      try {
        setLocked(!!sessionStorage.getItem(`rb-pending-${userId}`));
      } catch {
        setLocked(false);
      }
      setReady(true);
    };
    restore();
  }, [isPending, userId]);
  function change(p: LiveProduct, delta: number) {
    if (!ready || locked) return;
    setCart((current) => {
      const next = {
        ...current,
        [p.id]: Math.max(
          0,
          Math.min(1000, p.stock, (current[p.id] || 0) + delta),
        ),
      };
      try {
        sessionStorage.setItem(cartKey(userId), JSON.stringify(next));
      } catch {
        /* In-memory basket remains usable. */
      }
      return next;
    });
    if (delta > 0) setNotice(`${c.added}: ${title(p)}`);
  }
  const title = (p: LiveProduct) => p.translations?.[locale]?.title || p.title;
  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(n / 100);
  const filtered = products.filter(
    (p) =>
      (!selection || selection.includes(p.id)) &&
      (!basket || (cart[p.id] || 0) > 0) &&
      (!storage || productStorage(p) === storage) &&
      matchesProcessing(p, processing) &&
      (!category || p.category === category) &&
      `${title(p)} ${p.id} ${p.species||""} ${p.description||""}`
        .toLocaleLowerCase(locale)
        .includes(query.trim().toLocaleLowerCase(locale)),
  );
  filtered.sort((a,b) => Number(b.stock > 0) - Number(a.stock > 0) || (sort === "price" ? a.priceNetto-b.priceNetto : title(a).localeCompare(title(b),locale)));
  const shown = featured ? filtered.slice(0, 4) : filtered;
  const categories = [...new Set(products.map(p => p.category))];
  const matchesQuery = (p:LiveProduct) => `${title(p)} ${p.id} ${p.species || ""} ${p.description || ""}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale));
  const countStorage = (value:string) => products.filter(p => (!value || productStorage(p) === value) && matchesProcessing(p,processing) && (!category || p.category === category) && matchesQuery(p)).length;
  const countProcessing = (value:string) => products.filter(p => (!storage || productStorage(p) === storage) && matchesProcessing(p,value) && (!category || p.category === category) && matchesQuery(p)).length;
  const countCategory = (value:string) => products.filter(p => (!storage || productStorage(p) === storage) && matchesProcessing(p,processing) && (!value || p.category === value) && matchesQuery(p)).length;
  const lines = products.filter((p) => (cart[p.id] || 0) > 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const net = lines.reduce((n, p) => n + p.priceNetto * cart[p.id], 0);
  return (
    <section className={`rb-store${featured ? " rb-store-featured" : ""}`}>
      {!featured && (
        <>
          <div className="rb-section-heading">
            <div>
              <p className="rb-eyebrow">ROYAL BALTIC · HORECA EXPRESS</p>
              <h1>{t(basket ? "cart" : "catalog")}</h1>
            </div>
            <Link href={basket ? "/live" : "/cart"} className="rb-secondary">
              <ShoppingBag size={20} />
              {basket ? c.continue : c.viewCart} · {count}
            </Link>
          </div>
          <div className="rb-store-usps">
            <span>
              <Truck size={20} />
              {c.delivery}
            </span>
            <span>
              <Package size={20} />
              {c.boxes}
            </span>
          </div>
        </>
      )}
      {featured ? (
        <div className="rb-home-heading">
          <h2>{t("catalog")}</h2>
          <Link href="/live">{c.continue} →</Link>
        </div>
      ) : !basket ? (
        <>
          <label className="rb-search">
            <Search size={21} aria-hidden="true" />
            <span className="sr-only">{t("search")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => filter("q", e.target.value)}
              placeholder={t("search")}
            />
          </label>
          <section className="hx-catalog-filters" aria-label={f.allCatalog}>
          <p className="hx-filter-hint">{f.hint}</p>
          <fieldset className="hx-storage-options"><legend>{f.storage}</legend>
            {[
              ["", t("all")],
              ["chilled", c.chilled],
              ["frozen", c.frozen],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={storage === id ? "active" : ""}
                aria-pressed={storage === id}
                onClick={() => filter("storage", id)}
              >
                {id === "frozen" ? (
                  <Snowflake size={18} />
                ) : id === "chilled" ? (
                  <Thermometer size={18} />
                ) : (
                  <Fish size={18} />
                )}{" "}
                <span>{label}</span><small>{loading ? "…" : countStorage(id)}</small>
              </button>
            ))}
          </fieldset>
          <fieldset className="hx-filter-row"><legend>{f.processing}</legend><div className="hx-filter-chips">
            {(["", "smoked", "hot-smoked", "cold-smoked", "salted", "dried"] as const).map(method => <button type="button" key={method} aria-pressed={processing === method} onClick={() => filter("processing", method)}>{method ? f.methods[method] : f.all}<small>{loading ? "…" : countProcessing(method)}</small></button>)}
          </div></fieldset>
          <fieldset className="hx-filter-row"><legend>{f.family}</legend><div className="hx-filter-chips">
            <button
              className={!category ? "active" : ""}
              aria-pressed={!category}
              type="button"
              onClick={() => filter("category", "")}
            >
              {t("all")}<small>{loading ? "…" : countCategory("")}</small>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={category === cat ? "active" : ""}
                aria-pressed={category === cat}
                onClick={() => filter("category", cat)}
              >
                {categoryLabel(cat,locale)}<small>{loading ? "…" : countCategory(cat)}</small>
              </button>
            ))}
          </div></fieldset>
          <div className="hx-mobile-filters">
            <label>{f.processing}<select value={processing} onChange={e=>filter("processing",e.target.value)}>{(["", "smoked", "hot-smoked", "cold-smoked", "salted", "dried"] as const).map(method=><option key={method} value={method}>{method ? f.methods[method] : f.all} · {loading ? "…" : countProcessing(method)}</option>)}</select></label>
            <label>{f.family}<select value={category} onChange={e=>filter("category",e.target.value)}><option value="">{f.all} · {loading ? "…" : countCategory("")}</option>{categories.map(cat=><option key={cat} value={cat}>{categoryLabel(cat,locale)} · {loading ? "…" : countCategory(cat)}</option>)}</select></label>
          </div>
          </section>
          <div className="hx-catalog-results"><p role="status">{loading ? t("loading") : `${filtered.length} ${f.results}`}</p>{(storage || processing || category || query) && <button type="button" onClick={resetFilters}>{f.reset}</button>}<label className="market-sort">{f.sort} <select aria-label={f.sort} value={sort} onChange={e=>setSort(e.target.value)}><option value="name">{f.name}</option><option value="price">{f.price}</option></select></label></div>
        </>
      ) : (
        <button
          className="rb-text-button"
          disabled={locked}
          onClick={() => {
            if (locked) return;
            setCart({});
            try {
              sessionStorage.setItem(cartKey(userId), "{}");
            } catch {}
          }}
        >
          {t("clear")}
        </button>
      )}
      {locked && (
        <p className="rb-warning" role="status">
          {t("orderLocked")} <Link href="/checkout">{c.checkout}</Link>
        </p>
      )}
      {!featured && <IntentFeedback />}
      <p className="sr-only" role="status">
        {notice}
      </p>
      {!featured && !basket && <div className="rb-view-switch" role="group" aria-label={t("catalog")}>
        {(["grid", "quick"] as const).map((mode, i) => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>{viewLabels[i]}</button>)}
      </div>}
      {loading ? (
        <div className="rb-store-loading" role="status">
          {t("loading")}
        </div>
      ) : error ? (
        <div className="rb-error" role="alert">
          {t("error")}{" "}
          <button
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <div className={view === "quick" && !featured && !basket ? "rb-shop-grid rb-quick-list" : "rb-shop-grid"}>
          {shown.map((p) => {
            const qty = cart[p.id] || 0;
            const announcement = intent.data.products.find(x => x.id === p.id);
            const packageName = announcement?.packageTranslations[locale] || p.packageType;
            return (
              <article className="rb-shop-product" key={p.id}>
                <Link href={`/products/${p.id}`} className="rb-shop-photo" aria-label={title(p)}>
                  {(p.imageUrl || ["Salmon","Seafood","Whitefish","Roe"].includes(p.category)) ? (
                    <Image
                      src={p.imageUrl || `/images/product-${["Salmon","Seafood","Whitefish","Roe"].indexOf(p.category)}.jpg`}
                      alt={title(p)}
                      width={600}
                      height={400}
                      unoptimized
                    />
                  ) : (
                    <Fish size={48} aria-label={title(p)} />
                  )}
                  <ProductStorageBadge product={p} />
                </Link>
                <div className="rb-shop-product-body">
                  <small>{p.origin || p.species || p.id}</small>
                  <h2><Link href={`/products/${p.id}`}>{title(p)}</Link></h2>
                  <ProductPreparation product={p}/>
                  <p>
                    {packageName}
                    {!announcement && p.unitWeight ? ` · ${p.unitWeight}` : ""}
                  </p>
                  <p className="rb-shop-description">
                    {productDescription(
                      p.translations?.[locale]?.description || p.description,
                    )}
                  </p>
                  <div className="rb-shop-price">
                    <strong>{p.priceNetto>0?money(p.priceNetto):(locale==='ru'?'Цена уточняется':locale==='de'?'Preis auf Anfrage':locale==='fr'?'Prix sur demande':'Price on request')}</strong>
                    <span>
                      {t("net")}
                    </span>
                  </div>
                  <small>{packageName} · {t("perPack")}{p.priceNetto>0 && kilograms(p.unitWeight) !== null && <> · {money(p.priceNetto / kilograms(p.unitWeight)!)}/kg</>}</small>
                  <p className={"rb-shop-availability"+(p.stock<=0?" rb-stock-empty":"")}>
                    {t(p.stock === 0 ? "out" : p.stock < 6 ? "low" : "stock")}
                  </p>
                  {announcement?.launchMode === "preorder" ? <PreorderControl product={announcement} /> : p.stock === 0 && !basket ? <DemandHeart productId={p.id} /> : qty > 0 ? (
                    <div className="rb-shop-in-basket">
                      <div className="rb-quantity">
                        <button
                          disabled={!ready || locked}
                          aria-label={`${t("remove")} ${title(p)}`}
                          onClick={() => change(p, -1)}
                        >
                          <Minus size={18} />
                        </button>
                        <output aria-label={`${c.box} ${title(p)}`}>
                          {qty}
                        </output>
                        <button
                          disabled={
                            !ready || locked || qty >= Math.min(p.stock, 1000)
                          }
                          aria-label={`${t("add")} ${title(p)}`}
                          onClick={() => change(p, 1)}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <span>{c.box}</span>
                    </div>
                  ) : (
                    <button
                      className="rb-primary rb-add-to-cart"
                      disabled={!ready || locked || p.stock === 0}
                      onClick={() => change(p, 1)}
                      aria-label={`${c.add}: ${title(p)}`}
                    >
                      <ShoppingBag size={19} />
                      {c.add}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {!loading && !error && !shown.length && (
        <div className="rb-empty"><p>
          {t(
            basket ? "emptyCart" : products.length ? "noMatches" : "noProducts",
          )}
        </p>{!basket && (storage || processing || category || query) && <button className="rb-secondary" type="button" onClick={resetFilters}>{f.reset}</button>}</div>
      )}
      {!featured && count > 0 && (
        <aside className="rb-shop-basket" aria-label={t("cart")}>
          <div>
            <ShoppingBag size={22} />
            <span>
              {c.box}: {count}
            </span>
            <strong>
              {money(net)} <small>{t("net")}</small>
            </strong>
          </div>
          <Link href={basket ? "/checkout" : "/cart"} className="rb-primary">
            {basket ? c.checkout : c.viewCart} →
          </Link>
        </aside>
      )}
    </section>
  );
}

