"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShieldCheck,
  LogOut,
  Truck,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import {
  liveApi,
  type LiveCompany,
  type LiveProduct,
  type LiveSlot,
  type LiveOrder,
  type LiveCategory,
  type OrderRequest,
  HttpError,
} from "@/lib/live-api";
import { readShopCart } from "@/lib/shop-cart";
import { designCopy } from "./design-copy";
import { AuthFlow } from "./auth-flow";
import { AccountPanel } from "./account-panel";
import { OrderHistory } from "./order-history";
import { useI18n } from "./i18n-provider";

type View = "catalog" | "account" | "orders" | "checkout";
export function LiveCommerce({
  initialView = "catalog",
}: {
  initialView?: View;
}) {
  const { data: session, isPending } = useSession();
  const { t } = useI18n();
  if (isPending)
    return (
      <main className="rb-state" role="status">
        {t("loading")}
      </main>
    );
  if (!session?.user)
    return <AuthFlow onReady={() => window.location.reload()} />;
  return (
    <CommerceSession
      key={session.user.id}
      userId={session.user.id}
      initialView={initialView}
    />
  );
}
function CommerceSession({
  userId,
  initialView,
}: {
  userId: string;
  initialView: View;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const view = initialView;
  const [company, setCompany] = useState<LiveCompany | null>(null);
  const [role, setRole] = useState("CUSTOMER");
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [slots, setSlots] = useState<LiveSlot[]>([]);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [slot, setSlot] = useState("");
  const [payment, setPayment] =
    useState<OrderRequest["paymentMethod"]>("card_on_delivery");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [online, setOnline] = useState(true);
  const pending = useRef<OrderRequest | null>(null);
  const storageKey = `rb-pending-${userId}`;
  const cartKey = `rb-cart-${userId}`;
  function storeCart(next: Record<string, number>) {
    setCart(next);
    try {
      sessionStorage.setItem(cartKey, JSON.stringify(next));
    } catch {
      /* In-memory ordering still works. */
    }
  }
  const refresh = useCallback(async () => {
    try {
      const result = await liveApi.company();
      setError(false);
      setCompany(result.company);
      setRole(result.role);
      if (
        result.company?.verified &&
        result.company.approvalStatus === "APPROVED"
      ) {
        const [p, c, s, o] = await Promise.all([
          liveApi.products(),
          liveApi.categories(),
          liveApi.slots(),
          liveApi.orders(),
        ]);
        setProducts(p);
        setCategories(c);
        setSlots(s);
        setOrders(o);
        setSlot((current) =>
          s.some((x) => x.id === current) ? current : s[0]?.id || "",
        );
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  // The initial effect performs network synchronization; state writes follow awaited responses.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const restore = async () => {
      update();
      try {
        setCart(readShopCart(userId));
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          const p = JSON.parse(stored) as OrderRequest;
          if (p.idempotencyKey && Array.isArray(p.items)) {
            pending.current = p;
            setLocked(true);
            setCart(
              Object.fromEntries(p.items.map((i) => [i.productId, i.quantity])),
            );
            setSlot(p.deliverySlotId);
            setPayment(p.paymentMethod);
          }
        }
      } catch {
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* Storage unavailable. */
        }
      }
    };
    void restore();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [storageKey, cartKey, userId]);
  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(n / 100);
  const title = (p: LiveProduct) => p.translations?.[locale]?.title || p.title;
  const categoryName = (id: string) => {
    const c = categories.find((c) => c.id === id);
    return c?.translations?.[locale] || c?.name || id;
  };
  const lines = products.filter((p) => (cart[p.id] || 0) > 0);
  const net = lines.reduce((sum, p) => sum + p.priceNetto * cart[p.id], 0);
  const vat = lines.reduce(
    (sum, p) =>
      sum + Math.round((p.priceNetto * cart[p.id] * p.vatRate) / 10000),
    0,
  );
  const invalidCart = Object.entries(cart).some(
    ([id, qty]) =>
      qty > 0 && !products.some((p) => p.id === id && p.stock >= qty),
  );
  function quantity(p: LiveProduct, delta: number) {
    if (locked) return;
    storeCart({
      ...cart,
      [p.id]: Math.max(0, Math.min(1000, p.stock, (cart[p.id] || 0) + delta)),
    });
  }
  function repeat(o: LiveOrder) {
    if (locked) {
      setNotice(t("orderLocked"));
      return;
    }
    let unavailable = false;
    const next = { ...cart };
    for (const item of o.items) {
      const p = products.find((p) => p.id === item.productId);
      if (!p || p.stock === 0) {
        unavailable = true;
        continue;
      }
      const wanted = (next[p.id] || 0) + item.quantity;
      if (wanted > p.stock || wanted > 1000) unavailable = true;
      next[p.id] = Math.min(1000, p.stock, wanted);
    }
    storeCart(next);
    router.push("/live");
    setNotice(t("reorderNote") + (unavailable ? " " + t("unavailable") : ""));
  }
  async function placeOrder() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const request = pending.current || {
        idempotencyKey: crypto.randomUUID(),
        deliverySlotId: slot,
        paymentMethod: payment,
        items: lines.map((p) => ({ productId: p.id, quantity: cart[p.id] })),
      };
      pending.current = request;
      setLocked(true);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(request));
      } catch {
        /* Keep the same key in memory. */
      }
      const response = await liveApi.placeOrder(request);
      pending.current = null;
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* Storage unavailable. */
      }
      setLocked(false);
      storeCart({});
      setOrderId(response.orderId);
      await refresh();
    } catch (e) {
      setError(true);
      if (e instanceof HttpError && e.status < 500) {
        pending.current = null;
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* Storage unavailable. */
        }
        setLocked(false);
        await refresh();
        setError(true);
      }
    } finally {
      setBusy(false);
    }
  }
  const signout = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };
  if (loading)
    return (
      <main className="rb-state" role="status">
        {t("loading")}
      </main>
    );
  const toolbar = (
    <div className="rb-customer-bar">
      <span>
        <ShieldCheck size={16} />
        {company?.name || t("account")}
        {company?.verified && <small>{t("verified")}</small>}
      </span>
      <div>
        {role === "ADMIN" && <Link href="/admin">{t("admin")}</Link>}
        <button onClick={() => void signout()}>
          <LogOut size={16} />
          {t("signOut")}
        </button>
      </div>
    </div>
  );
  if (!company)
    return (
      <>
        {toolbar}
        {error ? (
          <main className="rb-state">
            <p role="alert">{t("error")}</p>
            <button onClick={() => void refresh()}>{t("retry")}</button>
          </main>
        ) : (
          <AuthFlow companyMode onReady={() => void refresh()} />
        )}
      </>
    );
  const approved = company.verified && company.approvalStatus === "APPROVED";
  return (
    <>
      {toolbar}
      <main className={`rb-main${view === "checkout" ? " rb-checkout" : ""}`}>
        <nav className="rb-tabs">
          {(["catalog", "account", "orders"] as const).map((v) => (
            <Link
              key={v}
              className={view === v ? "active" : ""}
              href={
                v === "catalog"
                  ? "/live"
                  : v === "orders"
                    ? "/account?view=orders"
                    : "/account"
              }
              aria-current={view === v ? "page" : undefined}
            >
              {t(v)}
            </Link>
          ))}
        </nav>
        {!online && (
          <p className="rb-warning" role="status">
            {t("offline")}
          </p>
        )}
        {error && (
          <div className="rb-error" role="alert">
            {t("error")}{" "}
            <button onClick={() => void refresh()}>{t("refresh")}</button>
          </div>
        )}
        {notice && (
          <div className="rb-notice" role="status">
            {notice}
            <button aria-label={t("close")} onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}
        {!approved && view !== "account" ? (
          <section className="rb-state">
            <ShieldCheck size={42} />
            <h1>
              {t(
                company.approvalStatus === "REJECTED"
                  ? "rejected"
                  : company.approvalStatus === "DISABLED"
                    ? "disabled"
                    : "pending",
              )}
            </h1>
            <p>
              {t(
                company.approvalStatus === "PENDING"
                  ? "pendingText"
                  : "contactSupport",
              )}
            </p>
            <button className="rb-secondary" onClick={() => void refresh()}>
              {t("refresh")}
            </button>
            <button
              className="rb-text-button"
              onClick={() => router.push("/account")}
            >
              {t("account")}
            </button>
          </section>
        ) : view === "account" ? (
          <AccountPanel company={company} onSave={setCompany} />
        ) : view === "orders" ? (
          <OrderHistory orders={orders} onRepeat={repeat} />
        ) : (
          <>
            {orderId && (
              <section className="rb-success" role="status">
                <CheckCircle2 size={28} />
                <div>
                  <h2>{t("success")}</h2>
                  <p>
                    {t("orderNumber")}: <b dir="ltr">{orderId}</b>
                  </p>
                </div>
                <button onClick={() => router.push("/account?view=orders")}>
                  {t("viewOrders")}
                </button>
              </section>
            )}
            <div className="rb-section-heading">
              <div>
                <span className="rb-eyebrow">{t("catalogIntro")}</span>
                <h1>
                  {view === "checkout"
                    ? designCopy[locale].checkout
                    : t("catalog")}
                </h1>
              </div>
              <span className="rb-route">
                <Truck size={20} />
                {t("delivery")} · France
              </span>
            </div>
            {view === "checkout" && (
              <Link href="/live" className="rb-text-button">
                ← {designCopy[locale].back}
              </Link>
            )}
            <div className="rb-commerce-grid">
              <section>
                <label className="rb-search">
                  <Search size={21} />
                  <span className="sr-only">{t("search")}</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search")}
                  />
                </label>
                <div className="rb-categories">
                  <button
                    className={!category ? "active" : ""}
                    onClick={() => setCategory("")}
                  >
                    {t("all")}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      className={category === c.id ? "active" : ""}
                      onClick={() => setCategory(c.id)}
                    >
                      {categoryName(c.id)}
                    </button>
                  ))}
                </div>
                <div className="rb-product-grid">
                  {products
                    .filter(
                      (p) =>
                        (!category || p.category === category) &&
                        `${title(p)} ${p.title} ${p.id}`
                          .toLocaleLowerCase(locale)
                          .includes(query.toLocaleLowerCase(locale)),
                    )
                    .map((p) => (
                      <article className="rb-product" key={p.id}>
                        <div className="rb-product-photo">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={title(p)}
                              width={480}
                              height={320}
                              unoptimized
                            />
                          ) : (
                            <div className="rb-product-placeholder">
                              <ShoppingBag size={38} />
                            </div>
                          )}
                          <span
                            className={`rb-stock ${p.stock < 6 ? "low" : ""}`}
                          >
                            {t(
                              p.stock === 0
                                ? "out"
                                : p.stock < 6
                                  ? "low"
                                  : "stock",
                            )}
                          </span>
                        </div>
                        <div className="rb-product-content">
                          <small>
                            {categoryName(p.category)} · <bdi>{p.id}</bdi>
                          </small>
                          <h2>{title(p)}</h2>
                          <p>
                            {p.packageType}
                            {p.unitWeight ? ` · ${p.unitWeight}` : ""}
                          </p>
                          {(p.translations?.[locale]?.description ||
                            p.description) && (
                            <p className="rb-muted">
                              {p.translations?.[locale]?.description ||
                                p.description}
                            </p>
                          )}
                          {p.origin && (
                            <small>
                              {t("origin")}: {p.origin}
                            </small>
                          )}
                          {p.species && (
                            <small>
                              {t("species")}: {p.species}
                            </small>
                          )}
                          <div className="rb-product-bottom">
                            <div>
                              <strong>{money(p.priceNetto)}</strong>
                              <small>
                                {t("net")} · {p.vatRate / 100}% {t("vat")}
                              </small>
                            </div>
                            <div className="rb-quantity">
                              <button
                                aria-label={`${t("remove")} ${title(p)}`}
                                disabled={locked || !cart[p.id]}
                                onClick={() => quantity(p, -1)}
                              >
                                <Minus size={17} />
                              </button>
                              <output aria-label={t("quantity")}>
                                {cart[p.id] || 0}
                              </output>
                              <button
                                aria-label={`${t("add")} ${title(p)}`}
                                disabled={
                                  locked ||
                                  p.stock < 1 ||
                                  (cart[p.id] || 0) >= p.stock
                                }
                                onClick={() => quantity(p, 1)}
                              >
                                <Plus size={17} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
                {!products.length && (
                  <p className="rb-empty">{t("noProducts")}</p>
                )}
                {products.length > 0 &&
                  !products.some(
                    (p) =>
                      (!category || p.category === category) &&
                      `${title(p)} ${p.title} ${p.id}`
                        .toLocaleLowerCase(locale)
                        .includes(query.toLocaleLowerCase(locale)),
                  ) && <p className="rb-empty">{t("noMatches")}</p>}
              </section>
              <aside className="rb-cart" id="cart">
                <header>
                  <ShoppingBag size={21} />
                  <h2>{t("cart")}</h2>
                  <span>{Object.values(cart).reduce((a, b) => a + b, 0)}</span>
                </header>
                {!lines.length ? (
                  <p className="rb-empty">{t("emptyCart")}</p>
                ) : (
                  <>
                    <div className="rb-cart-lines">
                      {lines.map((p) => (
                        <div key={p.id}>
                          <strong>{title(p)}</strong>
                          <small>{p.packageType}</small>
                          <div>
                            <div className="rb-quantity">
                              <button
                                aria-label={t("remove")}
                                disabled={locked}
                                onClick={() => quantity(p, -1)}
                              >
                                <Minus size={15} />
                              </button>
                              <output>{cart[p.id]}</output>
                              <button
                                aria-label={t("add")}
                                disabled={locked || cart[p.id] >= p.stock}
                                onClick={() => quantity(p, 1)}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                            <b>{money(p.priceNetto * cart[p.id])}</b>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="rb-text-button"
                      disabled={locked}
                      onClick={() => storeCart({})}
                    >
                      {t("clear")}
                    </button>
                  </>
                )}
                {invalidCart && <p className="rb-error">{t("unavailable")}</p>}
                {locked && <p className="rb-warning">{t("orderLocked")}</p>}
                <label>
                  {t("deliverySlot")}
                  <select
                    value={slot}
                    disabled={locked}
                    onChange={(e) => setSlot(e.target.value)}
                  >
                    <option value="">{t("selectSlot")}</option>
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {new Date(
                          `${s.deliveryDate}T12:00:00`,
                        ).toLocaleDateString(locale)}{" "}
                        · {s.window}
                      </option>
                    ))}
                  </select>
                </label>
                {!slots.length && <p className="rb-muted">{t("noSlots")}</p>}
                <label>
                  {t("payment")}
                  <select
                    value={payment}
                    disabled={locked}
                    onChange={(e) =>
                      setPayment(
                        e.target.value as OrderRequest["paymentMethod"],
                      )
                    }
                  >
                    {company.paymentTerms === "INVOICE_7_DAYS" && (
                      <option value="invoice">{t("invoice")}</option>
                    )}
                    <option value="card_on_delivery">{t("card")}</option>
                    <option value="advance">{t("advance")}</option>
                  </select>
                </label>
                <div className="rb-totals">
                  <span>
                    {t("net")}
                    <b>{money(net)}</b>
                  </span>
                  <span>
                    {t("vat")}
                    <b>{money(vat)}</b>
                  </span>
                  <span>
                    {t("gross")}
                    <b>{money(net + vat)}</b>
                  </span>
                </div>
                <p className="rb-muted">{t("totalsNote")}</p>
                <button
                  className="rb-primary"
                  disabled={
                    busy ||
                    !online ||
                    (!locked && (!lines.length || !slot || invalidCart))
                  }
                  onClick={() => void placeOrder()}
                >
                  {t(busy ? "sending" : locked ? "retry" : "placeOrder")}
                </button>
                <p className="rb-delivery-address">
                  {t("deliveryTo")}
                  <br />
                  {company.address}
                </p>
              </aside>
            </div>
            <Link href="/checkout" className="rb-mobile-cart">
              <ShoppingBag size={20} />
              {t("cart")} · {Object.values(cart).reduce((a, b) => a + b, 0)}
              <b>{money(net + vat)}</b>
            </Link>
          </>
        )}
      </main>
    </>
  );
}
