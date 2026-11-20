"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Heart,
  Info,
  Minus,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import type { AnnouncedProduct } from "@/lib/product-intent";
import { useI18n } from "./i18n-provider";
import { useProductIntent } from "./product-intent-provider";
import { intentCopy } from "./intent-copy";
export function IntentFeedback() {
  const { locale } = useI18n(),
    c = intentCopy[locale];
  const { notice, needsLogin } = useProductIntent();
  return notice ? (
    <div className="hx-intent-feedback" role="status">
      {notice}
      {needsLogin && (
        <Link href="/account">
          {c.account}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  ) : null;
}
export function DemandHeart({ productId }: { productId: string }) {
  const { locale } = useI18n(),
    c = intentCopy[locale];
  const { data, busy, failed, interest } = useProductIntent();
  const liked = data.liked.includes(productId);
  return (
    <div className="hx-demand">
      <span className="hx-demand-label">{c.planned}</span>
      <div className="hx-demand-actions">
        <button
          className={`hx-heart ${liked ? "is-liked" : ""}`}
          type="button"
          aria-pressed={liked}
          disabled={busy || failed}
          onClick={() => void interest(productId, !liked)}
        >
          <Heart
            size={18}
            fill={liked ? "currentColor" : "none"}
            aria-hidden="true"
          />
          {liked ? c.liked : c.heart}
        </button>
        <details className="hx-demand-info">
          <summary aria-label={c.info}>
            <Info size={19} aria-hidden="true" />
          </summary>
          <p>{c.explanation}</p>
        </details>
      </div>
      <small>
        {data.counts[productId] ?? 0} {c.votes}
      </small>
    </div>
  );
}
export function PreorderControl({
  product: p,
  initialQuantity,
}: {
  product: AnnouncedProduct;
  initialQuantity?: number;
}) {
  const { locale } = useI18n(),
    c = intentCopy[locale];
  const { data, busy, reserve } = useProductIntent();
  const saved = data.preorders.find(
    (r) => r.productId === p.id && r.status === "reserved",
  );
  const [quantity, setQuantity] = useState(
    String(initialQuantity ?? saved?.quantity ?? 1),
  );
  const value = Number(quantity),
    valid = Number.isInteger(value) && value >= 1 && value <= 1000;
  const title = p.translations[locale]?.title || p.title;
  return (
    <form
      className="hx-preorder-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void reserve(p.id, value);
      }}
    >
      <div className="hx-quantity-row">
        <span>{c.qty}</span>
        <div className="hx-stepper">
          <button
            type="button"
            aria-label={`${c.qty} − · ${title}`}
            disabled={busy || value <= 1}
            onClick={() =>
              setQuantity(String(Math.max(1, (valid ? value : 1) - 1)))
            }
          >
            <Minus size={15} />
          </button>
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            required
            aria-label={`${c.qty} · ${title}`}
            value={quantity}
            disabled={busy}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button
            type="button"
            aria-label={`${c.qty} + · ${title}`}
            disabled={busy || value >= 1000}
            onClick={() =>
              setQuantity(String(Math.min(1000, (valid ? value : 1) + 1)))
            }
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <button className="hx-reserve" disabled={busy || !valid}>
        {saved ? <Check size={16} /> : null}
        {busy ? c.saving : saved ? c.update : c.reserve}
      </button>
      <small className="hx-reserved" aria-hidden={saved ? undefined : true}>
        {saved ? `${c.reserved}: ${saved.quantity}` : "\u00a0"}
      </small>
    </form>
  );
}
export function UpcomingProducts() {
  const { locale } = useI18n(),
    c = intentCopy[locale];
  const { data, loading, failed, refresh } = useProductIntent();
  const products = data.products.filter((p) => p.launchMode === "preorder");
  if (loading)
    return (
      <div
        className="hx-coming-loading"
        aria-busy="true"
        aria-label={c.title}
      />
    );
  if (failed)
    return (
      <div className="hx-coming-unavailable">
        <span>{c.unavailable}</span>
        <button onClick={() => void refresh()}>{c.retry}</button>
      </div>
    );
  if (!products.length) return null;
  return (
    <section
      className="hx-coming"
      id="upcoming"
      aria-labelledby="hx-coming-heading"
    >
      <header>
        <div>
          <p className="rb-eyebrow">HORECA EXPRESS</p>
          <h2 id="hx-coming-heading">{c.title}</h2>
          <p>{c.intro}</p>
        </div>
        <span className="hx-coming-date">
          <CalendarDays size={17} />
          {products[0].expectedAt
            ? new Date(`${products[0].expectedAt}T12:00:00`).toLocaleDateString(
                locale,
                { day: "numeric", month: "long", year: "numeric" },
              )
            : c.noDate}
        </span>
      </header>
      <IntentFeedback />
      <div className="hx-coming-grid">
        {products.map((p) => {
          const title = p.translations[locale]?.title || p.title;
          const saved = data.preorders.find(
            (r) => r.productId === p.id && r.status === "reserved",
          );
          return (
            <article className="hx-coming-card" key={p.id}>
              <div className="hx-coming-photo">
                <Image
                  src={p.imageUrl!}
                  alt={title}
                  width={560}
                  height={330}
                  unoptimized
                />
                <span>{c.badge}</span>
              </div>
              <div className="hx-coming-body">
                <h3>{title}</h3>
                <p className="hx-pack">
                  {p.packageTranslations[locale] || p.packageType}
                </p>
                <p className="hx-product-date">
                  {c.expected}{" "}
                  {p.expectedAt
                    ? new Date(`${p.expectedAt}T12:00:00`).toLocaleDateString(
                        locale,
                        { day: "numeric", month: "long" },
                      )
                    : c.noDate}
                </p>
                <div className="hx-coming-price">
                  <strong>
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: "EUR",
                    }).format(p.priceNetto / 100)}
                  </strong>
                  <small>{c.estimated}</small>
                </div>
                <PreorderControl
                  key={`${p.id}-${saved?.quantity ?? 0}`}
                  product={p}
                />
              </div>
            </article>
          );
        })}
      </div>
      <div className="hx-coming-terms">
        <Info size={17} aria-hidden="true" />
        <p>{c.terms}</p>
      </div>
      <small className="hx-photo-credit">
        {c.illustration} · {c.credit}:{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:Buckling.jpg"
          target="_blank"
          rel="noreferrer"
        >
          Christopher Bertram
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/3.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 3.0
        </a>
      </small>
    </section>
  );
}
export function PreorderList() {
  const { locale } = useI18n(),
    c = intentCopy[locale];
  const { data, loading, busy, reserve } = useProductIntent();
  const [pending, setPending] = useState<{
    productId: string;
    quantity: number;
  } | null>(null);
  useEffect(() => {
    const restore = async () => {
      try {
        const value = JSON.parse(
          sessionStorage.getItem("rb-preorder-selection") || "null",
        );
        if (
          value &&
          Number.isInteger(value.quantity) &&
          value.quantity > 0 &&
          value.quantity <= 1000
        )
          setPending(value);
      } catch {}
    };
    void restore();
  }, []);
  const selected = pending
    ? data.products.find((p) => p.id === pending.productId)
    : null;
  return (
    <section className="hx-preorders">
      <h2>{c.history}</h2>
      <IntentFeedback />
      {selected &&
        pending &&
        !data.preorders.some(
          (r) => r.productId === selected.id && r.status === "reserved",
        ) && (
          <div className="hx-pending-selection">
            <h3>{c.pending}</h3>
            <p>
              {selected.translations[locale]?.title || selected.title} ·{" "}
              {pending.quantity} {c.packages}
            </p>
            <PreorderControl
              product={selected}
              initialQuantity={pending.quantity}
            />
          </div>
        )}
      {!loading && !data.preorders.length && !selected && (
        <p className="rb-muted">{c.empty}</p>
      )}
      {data.preorders.map((r) => (
        <article className="hx-preorder-row" key={r.id}>
          <div>
            <h3>{r.translations[locale]?.title || r.title}</h3>
            <p>
              {r.quantity} {c.packages} ·{" "}
              {data.products.find((p) => p.id === r.productId)
                ?.packageTranslations[locale] || r.packageType}
            </p>
          </div>
          <div>
            <strong>
              {r.status === "reserved"
                ? c.reserved
                : r.status === "cancelled"
                  ? c.cancelled
                  : c.converted}
            </strong>
            {r.status === "reserved" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void reserve(r.productId, 0)}
              >
                {c.cancel}
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
