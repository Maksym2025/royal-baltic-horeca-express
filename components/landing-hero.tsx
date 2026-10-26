"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  Fish,
  LockKeyhole,
  Package,
  Repeat2,
  Thermometer,
  ReceiptText,
} from "lucide-react";
import { useI18n } from "./i18n-provider";
import { designCopy } from "./design-copy";
export function CatalogButton() {
  const { locale } = useI18n();
  return (
    <Link href="/live" className="rb-motion-cta">
      <span>{designCopy[locale].explore}</span>
      <span className="rb-motion-arrow" aria-hidden="true">
        <ArrowUpRight size={22} />
      </span>
    </Link>
  );
}
export function LandingHero({ welcome = false }: { welcome?: boolean }) {
  const { t, locale } = useI18n();
  const c = designCopy[locale];
  const benefits = [
    [Fish, c.fish, c.fishText],
    [Thermometer, c.cold, c.coldText],
    [CalendarDays, c.day, c.dayText],
    [ReceiptText, c.pay, c.payText],
  ] as const;
  return (
    <main className="rb-landing">
      <section className="rb-ocean-hero">
        <Image
          className="rb-ocean-image"
          src="/design/hero.webp"
          alt=""
          fill
          sizes="100vw"
          priority
        />
        <div className="rb-ocean-action">
          <p className="rb-eyebrow">{t("catalogIntro")}</p>
          <h1>{t("welcome")}</h1>
          <p>{c.intro}</p>
          <CatalogButton />
          {welcome && (
            <div className="rb-welcome-actions">
              <Link href="/register" className="rb-primary">
                {c.register}
              </Link>
              <Link href="/sign-in" className="rb-secondary">
                {t("signIn")}
              </Link>
            </div>
          )}
        </div>
      </section>
      {!welcome && (
        <>
          <section className="rb-home-shortcuts" aria-label={t("orders")}>
            <Link href="/account?view=orders">
              <Repeat2 aria-hidden="true" />
              <span>
                {t("repeat")}
                <small>{c.orderText}</small>
              </span>
            </Link>
            <Link href="/account?view=orders">
              <Package aria-hidden="true" />
              <span>
                {t("orders")}
                <small>{c.dayText}</small>
              </span>
            </Link>
          </section>
          <section className="rb-home-section">
            <div className="rb-home-heading">
              <h2>{c.selection}</h2>
              <Link href="/live">
                {c.explore} <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="rb-home-products">
              {[c.salmon, c.seafood, c.whitefish, c.roe].map((name, i) => (
                <Link href="/live" key={name} className="rb-home-product">
                  <Image
                    src={`/design/product-${i}.jpg`}
                    alt={name}
                    width={480}
                    height={320}
                  />
                  <div>
                    <h3>{name}</h3>
                    <span>
                      <LockKeyhole size={16} aria-hidden="true" />
                      {c.locked}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
      <section className="rb-home-section">
        <h2>{c.why}</h2>
        <div className="rb-benefits">
          {benefits.map(([Icon, title, text]) => (
            <article key={title}>
              <Icon aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="rb-home-section rb-how">
        <h2>{c.how}</h2>
        <ol>
          {[
            [c.register, c.registerText],
            [c.verify, c.verifyText],
            [c.order, c.orderText],
          ].map(([title, text]) => (
            <li key={title}>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link className="rb-primary" href="/register">
          {c.register}
          <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </section>
      <section className="rb-home-section">
        <h2>{c.about}</h2>
        <p className="rb-about-copy">{c.aboutText}</p>
        <Link href="/welcome" className="rb-text-button">
          {t("company")}
        </Link>
      </section>
      <footer className="rb-home-footer">
        © Royal Baltic · HoReCa Express{" "}
        <Link href="/admin/login">Administration</Link>
      </footer>
    </main>
  );
}
