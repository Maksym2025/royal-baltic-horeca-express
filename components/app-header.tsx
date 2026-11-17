"use client";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useState} from "react";
import {Globe,UserRound,ShoppingBag,Search,LayoutGrid,ChevronDown} from "lucide-react";
import {useI18n} from "./i18n-provider";
import {isLocale,locales,languageNames} from "@/lib/i18n/dictionaries";
import {useSession} from "@/lib/auth-client";
import {readShopCart} from "@/lib/shop-cart";
import {kilograms} from "@/lib/cart-math";
import type {LiveProduct} from "@/lib/live-api";
const copy={ru:{categories:"Категории",search:"Поиск по артикулу, рыбе или разделке…",account:"B2B-кабинет",boxes:"ящ.",kg:"кг"},fr:{categories:"Catégories",search:"Rechercher une référence, un poisson, une découpe…",account:"Espace B2B",boxes:"colis",kg:"kg"},de:{categories:"Kategorien",search:"Artikel, Fisch oder Zuschnitt suchen…",account:"B2B-Konto",boxes:"Kt.",kg:"kg"},en:{categories:"Categories",search:"Search by SKU, fish or cut…",account:"B2B account",boxes:"ctn",kg:"kg"}};
export function AppHeader(){
 const {locale,setLocale,t}=useI18n();const c=copy[locale==='ar'?'en':locale];const {data:session}=useSession();const [products,setProducts]=useState<LiveProduct[]>([]);const [totals,setTotals]=useState({boxes:0,kg:0,net:0});
 useEffect(()=>{let active=true;fetch('/api/catalog').then(r=>r.ok?r.json():[]).then(p=>{if(active)setProducts(p)}).catch(()=>{});return()=>{active=false}},[]);
 useEffect(()=>{const sync=()=>{const cart=readShopCart(session?.user.id||'guest');let boxes=0,kg=0,net=0;for(const p of products){const n=cart[p.id]||0;boxes+=n;kg+=n*(kilograms(p.unitWeight)||0);net+=n*p.priceNetto;}setTotals(old=>old.boxes===boxes&&old.kg===kg&&old.net===net?old:{boxes,kg,net});};sync();const timer=setInterval(sync,1000);window.addEventListener('focus',sync);return()=>{clearInterval(timer);window.removeEventListener('focus',sync)}},[session?.user.id,products]);
 return <header className="rb-header rb-reference-header">
 <Link href="/" className="rb-reference-brand"><Image src="/images/brand-whale.jpg" alt="" width={40} height={40}/><span><strong>ROYAL BALTIC</strong><small>B2B HORECA EXPRESS</small></span></Link>
 <details className="rb-header-categories"><summary><LayoutGrid size={17}/><span>{c.categories}</span><ChevronDown size={15}/></summary><nav aria-label={c.categories}><a href="/live">{t('all')}</a>{[...new Set(products.map(p=>p.category))].map(category=><a key={category} href={'/live?category='+encodeURIComponent(category)}>{category}</a>)}</nav></details>
 <form action="/live" method="get" className="rb-header-search" role="search"><button type="submit" aria-label={t('search')}><Search size={18}/></button><input name="q" aria-label={t('search')} placeholder={c.search}/></form>
 <div className="rb-header-locale"><Globe size={17}/><label><span className="sr-only">{t('language')}</span><select value={locale} onChange={e=>{if(isLocale(e.target.value))setLocale(e.target.value)}}>{locales.map(l=><option key={l} value={l} title={languageNames[l]}>{l.toUpperCase()}</option>)}</select></label><span>· € EUR</span></div>
 <Link href="/account" className="rb-header-account"><UserRound size={21}/><span>{c.account}</span></Link>
 <Link href="/cart" className="rb-header-cart" aria-label={t('cart')}><ShoppingBag size={23}/><span><small>{totals.boxes} {c.boxes} · {Number(totals.kg.toFixed(2))} {c.kg}</small><strong>{new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(totals.net/100)}</strong></span></Link>
 </header>;
}

