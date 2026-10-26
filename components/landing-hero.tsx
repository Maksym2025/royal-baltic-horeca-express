"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "./i18n-provider";

const labels = { ru: "Перейти в каталог", en: "Explore the catalog", fr: "Voir le catalogue", ar: "تصفح الكتالوج" };
export function CatalogButton({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  return <Link href="/live" className={`rb-motion-cta${compact ? " rb-motion-cta--compact" : ""}`}>
    <span>{labels[locale]}</span><span className="rb-motion-arrow" aria-hidden="true"><ArrowUpRight size={22}/></span>
  </Link>;
}
export function LandingHero() {
  const { t } = useI18n();
  return <main className="rb-landing">
    <section className="rb-ocean-hero" aria-label="Royal Baltic · HoReCa Express">
      <Image className="rb-ocean-image" src="/images/horeca-hero.webp" alt="Fresh from the cold waters to your table! A fisherman at the helm in cold northern waters." width={1536} height={864} sizes="100vw" priority />
      <div className="rb-ocean-action">
        <div className="rb-ocean-mobile-copy"><p className="rb-eyebrow">ROYAL BALTIC / HORECA EXPRESS</p><h1>{t("welcome")}</h1></div>
        <CatalogButton />
        <p className="rb-ocean-caption">{t("catalogIntro")}</p>
      </div>
    </section>
  </main>;
}
