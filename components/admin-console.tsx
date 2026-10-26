"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import {
  BarChart3,
  Fish,
  FolderTree,
  Package,
  Users,
  Truck,
  Settings,
  Plus,
  RefreshCw,
  Pencil,
  Archive,
  Upload,
} from "lucide-react";
import {
  apiJson,
  type LiveProduct,
  type LiveCategory,
  type LiveCompany,
  type LiveSlot,
  type LiveOrder,
  type CatalogImage,
} from "@/lib/live-api";
import { statusLabels, transitions } from "@/lib/order-status";
import { locales, languageNames } from "@/lib/i18n/dictionaries";

type Tab =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "delivery-slots"
  | "settings";
const tabs = [
  ["dashboard", "Dashboard", BarChart3],
  ["products", "Products", Fish],
  ["categories", "Categories", FolderTree],
  ["orders", "Orders", Package],
  ["customers", "Customers", Users],
  ["delivery-slots", "Delivery slots", Truck],
  ["settings", "Settings", Settings],
] as const;
type AdminOrder = {
  order: LiveOrder;
  company: string;
  window: string;
  items: LiveOrder["items"];
  payments: { status: string; amount: number }[];
};
type Dashboard = {
  stats: Record<
    | "ordersToday"
    | "ordersWeek"
    | "netSales"
    | "pendingOrders"
    | "lowStock"
    | "activeCustomers",
    string
  >;
  recent: { order: LiveOrder; company: string }[];
};
type Configuration = {
  currency: string;
  timezone: string;
  imageStorageConfigured: boolean;
  googleConfigured: boolean;
  onlineCardPayments: boolean;
};
const money = (cents: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
const date = (value: string) =>
  new Date(
    value.length === 10 ? `${value}T12:00:00` : value,
  ).toLocaleDateString("en-GB");
async function write(resource: Tab, body: unknown, creating = false) {
  return apiJson(`/api/admin/${resource}`, {
    method: creating ? "POST" : "PATCH",
    body: JSON.stringify(body),
  });
}
export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [revision, setRevision] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  async function leave() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await signOut();
      if (result.error) {
        setSignOutError("Unable to sign out. Please try again.");
        return;
      }
      // Discard cached protected views after the server has cleared the session.
      window.location.replace("/admin/login");
    } catch {
      setSignOutError("Unable to connect. Please try again.");
    } finally { setSigningOut(false); }
  }
  return (
    <main className="rb-admin" dir="ltr">
      <aside className="rb-admin-nav">
        <span className="rb-eyebrow">OPERATIONS</span>
        <h1>Royal Baltic</h1>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="rb-admin-foot">
          <Link href="/">Customer site</Link>
          <button
            type="button"
            disabled={signingOut}
            onClick={leave}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          {signOutError && <p role="alert">{signOutError}</p>}
        </div>
        <small>
          HoReCa procurement
          <br />
          Europe / Berlin
        </small>
      </aside>
      <section className="rb-admin-content">
        <header className="rb-section-heading">
          <div>
            <span className="rb-eyebrow">CONTROL DESK</span>
            <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
          </div>
          <button
            className="rb-secondary"
            onClick={() => setRevision((r) => r + 1)}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>
        <AdminResource key={`${tab}-${revision}`} tab={tab} />
      </section>
    </main>
  );
}
function AdminResource({ tab }: { tab: Tab }) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await apiJson(`/api/admin/${tab}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load.");
    }
  }, [tab]);
  // Async API synchronization; no synchronous derived-state updates.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function save(body: unknown, creating = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await write(tab, body, creating);
      await load();
      setNotice("Saved.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="rb-state">
        {error ? <p role="alert">{error}</p> : "Loading live data…"}
      </div>
    );
  return (
    <>
      {error && (
        <p className="rb-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="rb-notice" role="status">
          {notice}
        </p>
      )}
      {tab === "dashboard" ? (
        <DashboardView data={data as Dashboard} />
      ) : tab === "products" ? (
        <ProductManager
          products={data as LiveProduct[]}
          save={save}
          busy={busy}
        />
      ) : tab === "categories" ? (
        <CategoryManager
          categories={data as LiveCategory[]}
          save={save}
          busy={busy}
        />
      ) : tab === "orders" ? (
        <OrdersManager orders={data as AdminOrder[]} save={save} busy={busy} />
      ) : tab === "customers" ? (
        <CustomerManager
          customers={data as LiveCompany[]}
          save={save}
          busy={busy}
        />
      ) : tab === "delivery-slots" ? (
        <SlotManager slots={data as LiveSlot[]} save={save} busy={busy} />
      ) : (
        <SettingsView data={data as Configuration} />
      )}
    </>
  );
}
type Save = (body: unknown, creating?: boolean) => Promise<boolean>;
function DashboardView({ data }: { data: Dashboard }) {
  const labels = {
    ordersToday: "Orders today",
    ordersWeek: "Orders this week",
    netSales: "Net sales · all time, excluding cancelled",
    pendingOrders: "New orders",
    lowStock: "Active products below 6 units",
    activeCustomers: "Approved B2B customers",
  };
  return (
    <>
      <div className="rb-metrics">
        {Object.entries(data.stats).map(([key, value]) => (
          <div key={key}>
            <span>{labels[key as keyof typeof labels]}</span>
            <strong>
              {key === "netSales"
                ? money(Number(value))
                : Number(value).toLocaleString("en-GB")}
            </strong>
          </div>
        ))}
      </div>
      <h2>Recent orders</h2>
      <div className="rb-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Company</th>
              <th>Date</th>
              <th>Status</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map(({ order: o, company }) => (
              <tr key={o.id}>
                <td>{o.id.slice(0, 8)}</td>
                <td>{company}</td>
                <td>{date(o.createdAt)}</td>
                <td>{statusLabels[o.status]}</td>
                <td>{money(o.totalAmountNetto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.recent.length && <p className="rb-empty">No orders recorded.</p>}
      </div>
    </>
  );
}
function productBody(p: LiveProduct) {
  return {
    id: p.id,
    expectedStock: p.stock,
    title: p.title,
    category: p.category,
    description: p.description,
    origin: p.origin,
    species: p.species,
    unitWeight: p.unitWeight,
    packageType: p.packageType,
    priceNetto: p.priceNetto,
    vatRate: p.vatRate,
    stock: p.stock,
    active: p.active,
    imageUrl: p.imageUrl,
    images: p.images,
    translations: p.translations,
  };
}
function ProductManager({
  products,
  save,
  busy,
}: {
  products: LiveProduct[];
  save: Save;
  busy: boolean;
}) {
  const [editing, setEditing] = useState<LiveProduct | null | undefined>();
  const [query, setQuery] = useState("");
  return (
    <>
      <div className="rb-actions">
        <input
          aria-label="Search products"
          placeholder="Search SKU or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="rb-primary" onClick={() => setEditing(null)}>
          <Plus size={17} />
          New product
        </button>
      </div>
      {editing !== undefined && (
        <ProductEditor
          key={editing?.id || "new"}
          product={editing}
          busy={busy}
          onClose={() => setEditing(undefined)}
          save={async (body, creating) => {
            const ok = await save(body, creating);
            if (ok) setEditing(undefined);
            return ok;
          }}
        />
      )}
      <div className="rb-table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU / product</th>
              <th>Category / pack</th>
              <th>Net price</th>
              <th>VAT</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products
              .filter((p) =>
                `${p.id} ${p.title}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.title}</strong>
                    <small>{p.id}</small>
                  </td>
                  <td>
                    {p.category}
                    <small>{p.packageType}</small>
                  </td>
                  <td>{money(p.priceNetto)}</td>
                  <td>{p.vatRate / 100}%</td>
                  <td>
                    {p.stock}
                    <small>{p.stockStatus}</small>
                  </td>
                  <td>{p.active ? "Active" : "Archived"}</td>
                  <td>
                    <div className="rb-actions">
                      <button
                        className="rb-secondary"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil size={15} />
                        View / edit
                      </button>
                      <button
                        className="rb-secondary"
                        disabled={busy}
                        onClick={() =>
                          void save({ ...productBody(p), active: !p.active })
                        }
                      >
                        <Archive size={15} />
                        {p.active ? "Archive" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!products.length && (
          <p className="rb-empty">
            No catalog products yet. Create a category and your first product.
          </p>
        )}
      </div>
    </>
  );
}
function ProductEditor({
  product,
  save,
  busy,
  onClose,
}: {
  product: LiveProduct | null;
  save: Save;
  busy: boolean;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [images, setImages] = useState<CatalogImage[]>(product?.images || []);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void apiJson<LiveCategory[]>("/api/admin/categories")
      .then(setCategories)
      .catch(() => setError("Unable to load categories."));
  }, []);
  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const img = data as CatalogImage;
      setImages((all) => [...all, img]);
      if (!imageUrl) setImageUrl(img.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) || "");
    await save(
      {
        ...(product ? { expectedStock: product.stock } : {}),
        id: get("id"),
        title: get("title"),
        category: get("category"),
        description: get("description") || null,
        origin: get("origin") || null,
        species: get("species") || null,
        unitWeight: get("unitWeight") || null,
        packageType: get("packageType"),
        priceNetto: Math.round(Number(get("price")) * 100),
        vatRate: Math.round(Number(get("vat")) * 100),
        stock: Number(get("stock")),
        active: f.get("active") === "on",
        imageUrl: imageUrl || null,
        images,
        translations: Object.fromEntries(
          locales.map((l) => [
            l,
            { title: get(`${l}-title`), description: get(`${l}-description`) },
          ]),
        ),
      },
      !product,
    );
  }
  return (
    <form className="rb-editor rb-panel" onSubmit={submit}>
      <div className="rb-section-heading">
        <h2>{product ? "Edit product" : "Create product"}</h2>
        <button type="button" className="rb-secondary" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="rb-fields">
        <label>
          SKU
          <input
            name="id"
            defaultValue={product?.id}
            readOnly={!!product}
            required
            pattern="[a-zA-Z0-9._-]+"
            maxLength={60}
          />
        </label>
        <label>
          Product name
          <input
            name="title"
            defaultValue={product?.title}
            required
            maxLength={1000}
          />
        </label>
        <label>
          Category
          <select
            name="category"
            defaultValue={product?.category || ""}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {!c.active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Packaging
          <input
            name="packageType"
            defaultValue={product?.packageType}
            placeholder="Karton à 5 kg"
            required
          />
        </label>
        <label>
          Net price · EUR
          <input
            name="price"
            type="number"
            min="0"
            max="100000"
            step="0.01"
            defaultValue={product ? product.priceNetto / 100 : ""}
            required
          />
        </label>
        <label>
          VAT · %
          <input
            name="vat"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={product ? product.vatRate / 100 : ""}
            required
          />
        </label>
        <label>
          Stock · packages
          <input
            name="stock"
            type="number"
            min="0"
            max="1000000"
            step="1"
            defaultValue={product?.stock ?? 0}
            required
          />
        </label>
        <label>
          Origin
          <input name="origin" defaultValue={product?.origin || ""} />
        </label>
        <label>
          Species / type
          <input name="species" defaultValue={product?.species || ""} />
        </label>
        <label>
          Carton weight / unit
          <input name="unitWeight" defaultValue={product?.unitWeight || ""} />
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          defaultValue={product?.description || ""}
          maxLength={1000}
        />
      </label>
      <label className="rb-check">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product?.active ?? true}
        />
        Active product
      </label>
      <h3>Product images</h3>
      <p className="rb-muted">
        JPEG, PNG or WebP · max. 3 MB each · stored in Vercel Blob
      </p>
      <div className="rb-image-list">
        {images.map((img) => (
          <div key={img.url}>
            <Image
              src={img.url}
              alt="Catalog image"
              width={100}
              height={80}
              unoptimized
            />
            <button
              type="button"
              className="rb-secondary"
              onClick={() => setImageUrl(img.url)}
            >
              {imageUrl === img.url ? "Main image" : "Set as main"}
            </button>
            <button
              type="button"
              className="rb-text-button"
              onClick={() => {
                setImages((all) => all.filter((i) => i.url !== img.url));
                if (imageUrl === img.url) setImageUrl("");
              }}
            >
              Detach
            </button>
          </div>
        ))}
      </div>
      <label className="rb-upload">
        <Upload size={18} />
        {uploading ? "Uploading…" : "Upload image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading || images.length >= 10}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p role="alert" className="rb-error">
          {error}
        </p>
      )}
      <details>
        <summary>Translations · FR / EN / RU / AR</summary>
        {locales.map((l) => (
          <fieldset key={l} dir={l === "ar" ? "rtl" : "ltr"}>
            <legend>{languageNames[l]}</legend>
            <label>
              Product name
              <input
                name={`${l}-title`}
                defaultValue={product?.translations?.[l]?.title || ""}
              />
            </label>
            <label>
              Description
              <textarea
                name={`${l}-description`}
                defaultValue={product?.translations?.[l]?.description || ""}
              />
            </label>
          </fieldset>
        ))}
      </details>
      <button
        className="rb-primary"
        disabled={busy || uploading || !categories.length}
      >
        {busy ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
function CategoryManager({
  categories,
  save,
  busy,
}: {
  categories: LiveCategory[];
  save: Save;
  busy: boolean;
}) {
  const [edit, setEdit] = useState<LiveCategory | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (
      await save(
        {
          id: String(f.get("id")),
          name: String(f.get("name")),
          active: f.get("active") === "on",
          translations: Object.fromEntries(
            locales.map((l) => [l, String(f.get(l) || "")]),
          ),
        },
        !edit,
      )
    ) {
      setEdit(null);
      form.reset();
    }
  }
  return (
    <>
      <form key={edit?.id || "new"} onSubmit={submit} className="rb-panel">
        <h2>{edit ? "Edit category" : "New category"}</h2>
        <div className="rb-fields">
          <label>
            Category ID
            <input
              name="id"
              defaultValue={edit?.id}
              readOnly={!!edit}
              required
              maxLength={100}
            />
          </label>
          <label>
            Name
            <input name="name" defaultValue={edit?.name} required />
          </label>
          {locales.map((l) => (
            <label key={l}>
              {languageNames[l]}
              <input
                name={l}
                dir={l === "ar" ? "rtl" : "ltr"}
                defaultValue={edit?.translations?.[l] || ""}
              />
            </label>
          ))}
        </div>
        <label className="rb-check">
          <input
            type="checkbox"
            name="active"
            defaultChecked={edit?.active ?? true}
          />
          Active
        </label>
        <button className="rb-primary" disabled={busy}>
          Save category
        </button>
        {edit && (
          <button
            type="button"
            className="rb-text-button"
            onClick={() => setEdit(null)}
          >
            Cancel edit
          </button>
        )}
      </form>
      <div className="rb-table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.active ? "Active" : "Archived"}</td>
                <td>
                  <button className="rb-secondary" onClick={() => setEdit(c)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function OrdersManager({
  orders,
  save,
  busy,
}: {
  orders: AdminOrder[];
  save: Save;
  busy: boolean;
}) {
  const [filter, setFilter] = useState("");
  return (
    <>
      <label>
        Status filter
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
              {v === "processing" ? " (legacy)" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="rb-muted">
        Latest 500 orders. Amounts and line items are stored order snapshots.
      </p>
      {orders
        .filter((r) => !filter || r.order.status === filter)
        .map((r) => (
          <article className="rb-order" key={r.order.id}>
            <header>
              <div>
                <strong>{r.company}</strong>
                <small>{r.order.id}</small>
                <span>
                  Ordered {date(r.order.createdAt)} · Delivery{" "}
                  {date(r.order.deliveryDate)} / {r.window}
                </span>
              </div>
              <span className="rb-badge">{statusLabels[r.order.status]}</span>
              <strong>{money(r.order.totalAmountBrutto)}</strong>
            </header>
            <details>
              <summary>Items, delivery & payment</summary>
              <div className="rb-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product / SKU</th>
                      <th>Quantity</th>
                      <th>Net</th>
                      <th>VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map((i) => (
                      <tr key={i.productId}>
                        <td>
                          {i.productTitle}
                          <small>
                            {i.productId} · {i.packageType}
                          </small>
                        </td>
                        <td>{i.quantity}</td>
                        <td>{money(i.priceAtMoment * i.quantity)}</td>
                        <td>{i.vatRate / 100}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{r.order.deliveryAddress}</p>
              <p>
                Payment:{" "}
                {r.order.paymentMethod === "card_on_delivery"
                  ? "Card on delivery"
                  : r.order.paymentMethod === "invoice"
                    ? "Invoice · 7 days"
                    : "Bank transfer in advance"}
              </p>
              {r.payments.map((p, i) => (
                <p key={i}>
                  {p.status} · {money(p.amount)}
                </p>
              ))}
              <p>
                Net {money(r.order.totalAmountNetto)} · VAT{" "}
                {money(r.order.totalVat)} · Gross{" "}
                {money(r.order.totalAmountBrutto)}
              </p>
            </details>
            <div className="rb-actions">
              {transitions[r.order.status].map((next) => (
                <button
                  key={next}
                  className={
                    next === "cancelled" ? "rb-secondary" : "rb-primary"
                  }
                  disabled={busy}
                  onClick={() => {
                    if (
                      next !== "cancelled" ||
                      window.confirm(
                        "Cancel this order and release reserved stock?",
                      )
                    )
                      void save({
                        id: r.order.id,
                        from: r.order.status,
                        status: next,
                      });
                  }}
                >
                  {statusLabels[next]}
                </button>
              ))}
            </div>
          </article>
        ))}
      {!orders.length && <p className="rb-empty">No orders.</p>}
    </>
  );
}
function CustomerManager({
  customers,
  save,
  busy,
}: {
  customers: LiveCompany[];
  save: Save;
  busy: boolean;
}) {
  const [history, setHistory] = useState<{
    company: string;
    orders: AdminOrder[];
  } | null>(null);
  const [error, setError] = useState("");
  async function openHistory(c: LiveCompany) {
    try {
      setHistory({
        company: c.name,
        orders: await apiJson<AdminOrder[]>(
          `/api/admin/orders?customer=${c.id}`,
        ),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load.");
    }
  }
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {history && (
        <section className="rb-panel">
          <div className="rb-section-heading">
            <h2>{history.company} · Order history</h2>
            <button className="rb-secondary" onClick={() => setHistory(null)}>
              Close
            </button>
          </div>
          {history.orders.map((r) => (
            <p key={r.order.id}>
              {date(r.order.createdAt)} · {r.order.id} ·{" "}
              {statusLabels[r.order.status]} ·{" "}
              {money(r.order.totalAmountBrutto)}
            </p>
          ))}
          {!history.orders.length && <p>No orders.</p>}
        </section>
      )}
      {customers.map((c) => (
        <article className="rb-order" key={c.id}>
          <header>
            <div>
              <strong>{c.name}</strong>
              <small>
                {c.contactPerson || "No contact person supplied"} · {c.email}
              </small>
              <span>Registered {date(c.createdAt)}</span>
            </div>
            <span className="rb-badge">{c.approvalStatus}</span>
          </header>
          <details>
            <summary>Company details</summary>
            <dl>
              <dt>Phone</dt>
              <dd>{c.phone || "—"}</dd>
              <dt>VAT number</dt>
              <dd>{c.vatNumber}</dd>
              <dt>Delivery address</dt>
              <dd>{c.address}</dd>
              <dt>Billing address</dt>
              <dd>{c.billingAddress || "—"}</dd>
              <dt>Company ID</dt>
              <dd>{c.id}</dd>
            </dl>
          </details>
          <label>
            Payment terms
            <select
              disabled={busy}
              value={c.paymentTerms}
              onChange={(e) =>
                void save({
                  id: c.id,
                  approvalStatus: c.approvalStatus,
                  paymentTerms: e.target.value,
                })
              }
            >
              <option value="CARD_IMMEDIATE">
                Card on delivery / advance transfer
              </option>
              <option value="INVOICE_7_DAYS">Invoice · 7 days</option>
            </select>
          </label>
          <div className="rb-actions">
            {(["APPROVED", "REJECTED", "DISABLED"] as const).map((status) => (
              <button
                key={status}
                className={
                  status === "APPROVED" ? "rb-primary" : "rb-secondary"
                }
                disabled={busy || c.approvalStatus === status}
                onClick={() =>
                  void save({
                    id: c.id,
                    approvalStatus: status,
                    paymentTerms: c.paymentTerms,
                  })
                }
              >
                {status === "APPROVED"
                  ? "Approve"
                  : status === "REJECTED"
                    ? "Reject"
                    : "Disable"}
              </button>
            ))}
            <button
              className="rb-secondary"
              onClick={() => void openHistory(c)}
            >
              View orders
            </button>
          </div>
        </article>
      ))}
      {!customers.length && (
        <p className="rb-empty">No registered companies.</p>
      )}
    </>
  );
}
function SlotManager({
  slots,
  save,
  busy,
}: {
  slots: LiveSlot[];
  save: Save;
  busy: boolean;
}) {
  const [edit, setEdit] = useState<LiveSlot | null>(null);
  const localTime = (v: string) => {
    const d = new Date(v);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const body = {
      ...(edit ? { id: edit.id } : {}),
      deliveryDate: String(f.get("deliveryDate")),
      window: `${f.get("start")}–${f.get("end")}`,
      cutoffAt: new Date(String(f.get("cutoff"))).toISOString(),
      enabled: f.get("enabled") === "on",
    };
    if (await save(body, !edit)) {
      setEdit(null);
      form.reset();
    }
  }
  return (
    <>
      <form className="rb-panel" key={edit?.id || "new"} onSubmit={submit}>
        <h2>{edit ? "Edit delivery slot" : "Create delivery slot"}</h2>
        <div className="rb-fields">
          <label>
            Delivery date
            <input
              type="date"
              name="deliveryDate"
              required
              defaultValue={edit?.deliveryDate}
            />
          </label>
          <label>
            Window start · Europe/Berlin
            <input
              type="time"
              name="start"
              required
              defaultValue={edit?.window.split("–")[0]}
            />
          </label>
          <label>
            Window end · Europe/Berlin
            <input
              type="time"
              name="end"
              required
              defaultValue={edit?.window.split("–")[1]}
            />
          </label>
          <label>
            Order cutoff · your browser time zone
            <input
              type="datetime-local"
              name="cutoff"
              required
              defaultValue={edit ? localTime(edit.cutoffAt) : ""}
            />
          </label>
        </div>
        <label className="rb-check">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={edit?.enabled ?? true}
          />
          Enabled
        </label>
        <button className="rb-primary" disabled={busy}>
          Save slot
        </button>
        {edit && (
          <button
            type="button"
            className="rb-text-button"
            onClick={() => setEdit(null)}
          >
            Cancel edit
          </button>
        )}
      </form>
      <div className="rb-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Delivery date</th>
              <th>Window</th>
              <th>Cutoff · Europe/Berlin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id}>
                <td>{date(s.deliveryDate)}</td>
                <td>{s.window}</td>
                <td>
                  {new Date(s.cutoffAt).toLocaleString("en-GB", {
                    timeZone: "Europe/Berlin",
                  })}
                </td>
                <td>{s.enabled ? "Enabled" : "Disabled"}</td>
                <td>
                  <button className="rb-secondary" onClick={() => setEdit(s)}>
                    Edit
                  </button>
                  <button
                    className="rb-text-button"
                    disabled={busy}
                    onClick={() => void save({ ...s, enabled: !s.enabled })}
                  >
                    {s.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function SettingsView({ data }: { data: Configuration }) {
  return (
    <section className="rb-panel">
      <h2>Production integrations</h2>
      <dl>
        <dt>Currency</dt>
        <dd>{data.currency}</dd>
        <dt>Operations timezone</dt>
        <dd>{data.timezone}</dd>
        <dt>Catalog image storage</dt>
        <dd>
          {data.imageStorageConfigured
            ? "Configured"
            : "Not configured — add BLOB_READ_WRITE_TOKEN and BLOB_PUBLIC_HOST in deployment settings"}
        </dd>
        <dt>Google OAuth</dt>
        <dd>
          {data.googleConfigured
            ? "Configured"
            : "Not configured — add Google OAuth credentials in deployment settings"}
        </dd>
        <dt>Online card payments</dt>
        <dd>Not activated. Card on delivery is available.</dd>
      </dl>
      <p className="rb-muted">
        Credentials are managed in deployment environment variables.
        Administrator roles are assigned through a trusted database connection.
      </p>
    </section>
  );
}
