"use client";
import { type FormEvent, useState } from "react";
import { useI18n } from "./i18n-provider";
import { apiJson, type LiveCompany } from "@/lib/live-api";
export function AccountPanel({
  company,
  onSave,
}: {
  company: LiveCompany;
  onSave: (company: LiveCompany) => void;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      onSave(
        await apiJson<LiveCompany>("/api/profile", {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      );
      setNotice(t("saved"));
    } catch {
      setNotice(t("error"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rb-account">
      <div className="rb-section-heading">
        <div>
          <span className="rb-eyebrow">{t("account")}</span>
          <h1>{company.name}</h1>
          <p>{t("profileIntro")}</p>
        </div>
        <span className="rb-badge">
          {t(`approval_${company.approvalStatus}`)}
        </span>
      </div>
      <div className="rb-account-grid">
        <section className="rb-panel">
          <h2>{t("legalDetails")}</h2>
          <dl>
            <dt>{t("companyName")}</dt>
            <dd>{company.name}</dd>
            <dt>{t("vatNumber")}</dt>
            <dd dir="ltr">{company.vatNumber}</dd>
            <dt>{t("registered")}</dt>
            <dd>{new Date(company.createdAt).toLocaleDateString(locale)}</dd>
            <dt>{t("paymentTerms")}</dt>
            <dd>
              {t(
                company.paymentTerms === "INVOICE_7_DAYS" ? "invoice" : "card",
              )}
            </dd>
          </dl>
          <p className="rb-muted">{t("legalNote")}</p>
        </section>
        <form className="rb-panel" onSubmit={save}>
          <h2>{t("company")}</h2>
          <div className="rb-fields">
            <label>
              {t("contactPerson")}
              <input
                name="contactPerson"
                defaultValue={company.contactPerson || ""}
                required
                maxLength={160}
              />
            </label>
            <label>
              {t("email")}
              <input
                name="email"
                type="email"
                defaultValue={company.email}
                required
              />
            </label>
            <label>
              {t("phone")}
              <input
                name="phone"
                type="tel"
                defaultValue={company.phone || ""}
                maxLength={60}
              />
            </label>
          </div>
          <h2 id="delivery">{t("delivery")}</h2>
          <label>
            {t("address")}
            <textarea
              name="address"
              defaultValue={company.address}
              required
              minLength={5}
              maxLength={500}
            />
          </label>
          <h2 id="billing">{t("billing")}</h2>
          <label>
            {t("billingAddress")}
            <textarea
              name="billingAddress"
              defaultValue={company.billingAddress || company.address}
              required
              minLength={5}
              maxLength={500}
            />
          </label>
          <button className="rb-primary" disabled={busy}>
            {t(busy ? "sending" : "save")}
          </button>
          {notice && <p role="status">{notice}</p>}
        </form>
      </div>
    </section>
  );
}
