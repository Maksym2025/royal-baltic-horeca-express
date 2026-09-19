"use client";
import { Repeat2 } from "lucide-react";
import { useI18n } from "./i18n-provider";
import type { LiveOrder } from "@/lib/live-api";
export function OrderHistory({
  orders,
  onRepeat,
}: {
  orders: LiveOrder[];
  onRepeat: (order: LiveOrder) => void;
}) {
  const { t, locale } = useI18n();
  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(n / 100);
  return (
    <section>
      <div className="rb-section-heading">
        <h1>{t("orders")}</h1>
        <span>{orders.length}</span>
      </div>
      {!orders.length && <p className="rb-empty">{t("noOrders")}</p>}
      {orders.map((o) => (
        <article className="rb-order" key={o.id}>
          <header>
            <div>
              <small>{t("orderNumber")}</small>
              <strong dir="ltr">{o.id}</strong>
              <span>
                {new Date(o.createdAt).toLocaleDateString(locale)} ·{" "}
                {t("deliveryDate")}:{" "}
                {new Date(`${o.deliveryDate}T12:00:00`).toLocaleDateString(
                  locale,
                )}
              </span>
            </div>
            <span className="rb-badge">{t(`status_${o.status}`)}</span>
            <strong>{money(o.totalAmountBrutto)}</strong>
          </header>
          <details>
            <summary>{t("details")}</summary>
            <div className="rb-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("products")}</th>
                    <th>{t("quantity")}</th>
                    <th>{t("net")}</th>
                    <th>{t("vat")}</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
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
            <p>
              {t("deliveryTo")}: {o.deliveryAddress}
            </p>
            <p>
              {t("payment")}:{" "}
              {t(
                o.paymentMethod === "invoice"
                  ? "invoice"
                  : o.paymentMethod === "advance"
                    ? "advance"
                    : "card",
              )}
            </p>
            {o.payments?.map((p, i) => (
              <p key={i}>{t(`payment_${p.status}`)}</p>
            ))}
            <div className="rb-totals">
              <span>
                {t("net")}
                <b>{money(o.totalAmountNetto)}</b>
              </span>
              <span>
                {t("vat")}
                <b>{money(o.totalVat)}</b>
              </span>
              <span>
                {t("gross")}
                <b>{money(o.totalAmountBrutto)}</b>
              </span>
            </div>
          </details>
          <button className="rb-secondary" onClick={() => onRepeat(o)}>
            <Repeat2 size={16} />
            {t("repeat")}
          </button>
        </article>
      ))}
    </section>
  );
}
