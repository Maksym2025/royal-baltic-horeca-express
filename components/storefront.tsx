"use client";
import { useEffect, useState, useCallback } from "react";
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
import { liveApi, type LiveProduct, type LiveCategory } from "@/lib/live-api";
import { readShopCart, cartKey, type ShopCart } from "@/lib/shop-cart";
import {
  productStorage,
  productDescription,
  type StorageCondition,
} from "@/lib/product-storage";
import { useI18n } from "./i18n-provider";
import { shopCopy } from "./shop-copy";
export function Storefront({
  featured = false,
  basket = false,
}: {
  featured?: boolean;
  basket?: boolean;
}) {
  const { t, locale } = useI18n();
  const c = shopCopy[locale];
  const { data: session, isPending } = useSession();
  const userId = session?.user.id || "guest";
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [cart, setCart] = useState<ShopCart>({});
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [storage, setStorage] = useState<StorageCondition | "">("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const [p, cat] = await Promise.all([
        liveApi.products(),
        liveApi.categories(),
      ]);
      setProducts(p);
      setCategories(cat);
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
      setReady(true);
    };
    restore();
  }, [isPending, userId]);
  function change(p: LiveProduct, delta: number) {
    if (!ready) return;
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
      (!basket || (cart[p.id] || 0) > 0) &&
      (!storage || productStorage(p) === storage) &&
      (!category || p.category === category) &&
      `${title(p)} ${p.id}`
        .toLocaleLowerCase(locale)
        .includes(query.trim().toLocaleLowerCase(locale)),
  );
  const shown = featured ? filtered.slice(0, 4) : filtered;
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
            />
          </label>
          <div className="rb-storage-filters" aria-label={t("catalog")}>
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
                onClick={() => setStorage(id as StorageCondition | "")}
              >
                {id === "frozen" ? (
                  <Snowflake size={18} />
                ) : id === "chilled" ? (
                  <Thermometer size={18} />
                ) : (
                  <Fish size={18} />
                )}{" "}
                {label}
              </button>
            ))}
          </div>
          <div className="rb-categories" aria-label={t("all")}>
            <button
              className={!category ? "active" : ""}
              aria-pressed={!category}
              onClick={() => setCategory("")}
            >
              {t("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={category === cat.id ? "active" : ""}
                aria-pressed={category === cat.id}
                onClick={() => setCategory(cat.id)}
              >
                {cat.translations?.[locale] || cat.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button
          className="rb-text-button"
          onClick={() => {
            setCart({});
            try {
              sessionStorage.setItem(cartKey(userId), "{}");
            } catch {}
          }}
        >
          {t("clear")}
        </button>
      )}
      <p className="sr-only" role="status">
        {notice}
      </p>
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
        <div className="rb-shop-grid">
          {shown.map((p) => {
            const state = productStorage(p);
            const qty = cart[p.id] || 0;
            return (
              <article className="rb-shop-product" key={p.id}>
                <div className="rb-shop-photo">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={title(p)}
                      width={600}
                      height={400}
                      unoptimized
                    />
                  ) : (
                    <Fish size={48} aria-label={title(p)} />
                  )}
                  <span
                    className={`rb-shop-condition rb-shop-condition--${state}`}
                  >
                    {state === "chilled"
                      ? c.chilled
                      : state === "frozen"
                        ? c.frozen
                        : c.unknown}
                  </span>
                </div>
                <div className="rb-shop-product-body">
                  <small>{p.origin || p.species || p.id}</small>
                  <h2>{title(p)}</h2>
                  <p>
                    {p.packageType}
                    {p.unitWeight ? ` · ${p.unitWeight}` : ""}
                  </p>
                  <p className="rb-shop-description">
                    {productDescription(
                      p.translations?.[locale]?.description || p.description,
                    )}
                  </p>
                  <div className="rb-shop-price">
                    <strong>{money(p.priceNetto)}</strong>
                    <span>
                      {t("net")} · {p.vatRate / 100}% {t("vat")}
                    </span>
                  </div>
                  <small>
                    {p.packageType} · {t("perPack")}
                  </small>
                  <p className="rb-shop-availability">
                    {t(p.stock === 0 ? "out" : p.stock < 6 ? "low" : "stock")}
                  </p>
                  {qty > 0 ? (
                    <div className="rb-shop-in-basket">
                      <div className="rb-quantity">
                        <button
                          disabled={!ready}
                          aria-label={`${t("remove")} ${title(p)}`}
                          onClick={() => change(p, -1)}
                        >
                          <Minus size={18} />
                        </button>
                        <output aria-label={`${c.box} ${title(p)}`}>
                          {qty}
                        </output>
                        <button
                          disabled={!ready || qty >= Math.min(p.stock, 1000)}
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
                      disabled={!ready || p.stock === 0}
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
        <p className="rb-empty">
          {t(
            basket ? "emptyCart" : products.length ? "noMatches" : "noProducts",
          )}
        </p>
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
