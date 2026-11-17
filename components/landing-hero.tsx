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
import { MarketSections } from "./market-sections";
import { heroCopy } from "./hero-copy";
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
export function LandingHero({ welcome = false, preview = false }: { welcome?: boolean; preview?: boolean }) {
  const { t, locale } = useI18n();
  const c = designCopy[locale];
  const hero = heroCopy[locale === "ar" ? "en" : locale];
  const shop = shopCopy[locale];
  const benefits = [
    [Fish, c.fish, c.fishText],
    [Thermometer, c.cold, c.coldText],
    [Truck, shop.delivery, shop.deliveryText],
    [Package, shop.boxes, shop.boxesText],
  ] as const;
  return (
    <main className="rb-landing">
      <section className="rb-ocean-hero rb-captain-hero">
        <Image className="rb-ocean-image" src="/images/captain-clean.jpg" alt="" fill sizes="100vw" priority/>
        <div className="rb-ocean-action">
          <p className="rb-eyebrow">{hero.badge}</p>
          <h1>{hero.title}</h1>
          <p className="rb-captain-subtitle">{hero.subtitle}</p>
          <div className="rb-captain-ctas">
            <Link className="rb-captain-secondary rb-catalog-glow" href="/live">{hero.secondary}<ArrowUpRight size={20}/></Link>
          </div>
        </div>
        <div className="rb-captain-trust">{hero.trust.map((label,index)=>{const Icon=[Truck,Thermometer,Fish,Package][index];return <div key={label}><Icon size={22} aria-hidden="true"/><span>{label}</span></div>})}</div>
      </section>
      {!welcome && (
        <>
          <section className="market-range" aria-label={c.selection}>{[["salmon",0],["seafood",1],["whitefish",2],["roe",3]].map(([key,i])=><Link href="/live" key={key}><Image src={`/images/product-${i}.jpg`} alt="" width={360} height={240}/><span>{c[key as "salmon"]} ↗</span></Link>)}</section>
          {preview && <MarketSections/>}
          {!preview && <><section className="rb-home-shortcuts" aria-label={t("orders")}>
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
          </section></>}
        </>
      )}
      {!preview && <><section className="rb-home-section">
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
        <Link href="mailto:sale@royal-baltic.com" className="rb-text-button">
          {t("company")}
        </Link>
      </section></>}

    </main>
  );
}

