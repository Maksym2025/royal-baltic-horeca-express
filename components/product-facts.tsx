"use client";
import { Snowflake, Thermometer, Fish } from "lucide-react";
import type { LiveProduct } from "@/lib/live-api";
import { productStorage } from "@/lib/product-storage";
import { productProcessing, temperatureLabel } from "@/lib/product-facets";
import { useI18n } from "./i18n-provider";
import { catalogCopy } from "./catalog-copy";
export function ProductStorageBadge({ product, detail = false }: { product: LiveProduct; detail?: boolean }) {
  const { locale } = useI18n(), c = catalogCopy[locale], storage = productStorage(product), temperature = temperatureLabel(product, locale);
  const Icon = storage === "frozen" ? Snowflake : storage === "chilled" ? Thermometer : Fish;
  return <span className={`hx-storage-badge hx-storage-badge--${storage}${detail ? " hx-storage-badge--detail" : ""}`}><Icon size={15} aria-hidden="true" /><span>{storage === "unspecified" ? c.unknown : c[storage]}{temperature && <strong>{temperature}</strong>}</span></span>;
}
export function ProductPreparation({ product }: { product: LiveProduct }) {
  const { locale } = useI18n(), c = catalogCopy[locale], method = productProcessing(product);
  return <div className="hx-product-facts">{method !== "unspecified" && <span className="hx-method-tag">{method === "smoked" ? (locale === "ru" ? "Копчёное" : locale === "fr" ? "Fumé" : locale === "de" ? "Geräuchert" : "Smoked") : c.methods[method]}</span>}{!temperatureLabel(product, locale) && <small><Thermometer size={14} aria-hidden="true" />{c.temperature}</small>}</div>;
}
