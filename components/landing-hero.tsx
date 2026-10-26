"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Fish,
  Package,
  Repeat2,
  Thermometer,
  Truck,
} from "lucide-react";
import { useI18n } from "./i18n-provider";
import { Storefront } from "./storefront";
import { shopCopy } from "./shop-copy";
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
  const shop = shopCopy[locale];
  const benefits = [
    [Fish, c.fish, c.fishText],
    [Thermometer, c.cold, c.coldText],
    [Truck, shop.delivery, shop.deliveryText],
    [Package, shop.boxes, shop.boxesText],
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
          <div className="rb-store-usps rb-hero-usps">
            <span>
              <Truck size={18} />
              {shop.delivery}
            </span>
            <span>
              <Package size={18} />
              {shop.boxes}
            </span>
          </div>
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
            <Storefront featured />
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
            [shop.choose, shop.chooseText],
            [shop.fill, shop.fillText],
            [shop.receive, shop.receiveText],
          ].map(([title, text]) => (
            <li key={title}>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link className="rb-primary" href="/live">
          {c.explore}
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
