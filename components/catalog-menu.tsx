"use client";
import { LayoutGrid, ChevronDown, Snowflake, Thermometer } from "lucide-react";
import type { LiveProduct } from "@/lib/live-api";
import { productStorage } from "@/lib/product-storage";
import { matchesProcessing } from "@/lib/product-facets";
import { catalogCopy, categoryLabel } from "./catalog-copy";
import { useI18n } from "./i18n-provider";
export function CatalogMenu({products}:{products:LiveProduct[]}) {
 const {locale,t}=useI18n(),c=catalogCopy[locale];
 return <details className="rb-header-categories" onKeyDown={e=>{if(e.key==="Escape"){e.currentTarget.removeAttribute("open");e.currentTarget.querySelector("summary")?.focus();}}}>
  <summary><LayoutGrid size={17} aria-hidden="true"/><span>{t("catalog")}</span><ChevronDown size={15} aria-hidden="true"/></summary>
  <nav className="hx-category-menu" aria-label={t("catalog")} onClick={e=>{if((e.target as HTMLElement).closest("a"))e.currentTarget.closest("details")?.removeAttribute("open")}}>
   <a className="hx-menu-all" href="/live">{c.allCatalog}<small>{products.length}</small></a>
   <div><h3>{c.storage}</h3>{(["chilled","frozen"] as const).map(storage=><a key={storage} href={`/live?storage=${storage}`}>{storage==="frozen"?<Snowflake size={15} aria-hidden="true"/>:<Thermometer size={15} aria-hidden="true"/>}{c[storage]}<small>{products.filter(p=>productStorage(p)===storage).length}</small></a>)}</div>
   <div><h3>{c.processing}</h3>{(["smoked","hot-smoked","cold-smoked","salted","dried"] as const).map(method=><a key={method} href={`/live?processing=${method}`}>{c.methods[method]}<small>{products.filter(p=>matchesProcessing(p,method)).length}</small></a>)}</div>
   <div className="hx-menu-families"><h3>{c.family}</h3>{[...new Set(products.map(p=>p.category))].map(category=><a key={category} href={`/live?category=${encodeURIComponent(category)}`}>{categoryLabel(category,locale)}<small>{products.filter(p=>p.category===category).length}</small></a>)}</div>
  </nav>
 </details>;
}
