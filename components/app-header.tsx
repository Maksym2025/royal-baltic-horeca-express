"use client";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import {Globe,UserRound,ShoppingBag,Search} from "lucide-react";
import {useI18n} from "./i18n-provider";
import {isLocale,languageNames,locales} from "@/lib/i18n/dictionaries";
export function AppHeader(){
 const {locale,setLocale,t}=useI18n(); const sentinel=useRef<HTMLDivElement>(null);const [compact,setCompact]=useState(false);
 useEffect(()=>{const o=new IntersectionObserver(([e])=>setCompact(!e.isIntersecting));if(sentinel.current)o.observe(sentinel.current);return()=>o.disconnect();},[]);
 return <><div className="market-announcement">{locale==='ru'?'Рыба и морепродукты для профессиональной кухни · Заказ от одного ящика':locale==='fr'?'Poissons & fruits de mer pour les professionnels · Dès un carton':locale==='ar'?'أسماك ومأكولات بحرية للمطابخ المهنية · ابتداءً من صندوق واحد':'Fish & seafood for professional kitchens · From one carton'}</div><div ref={sentinel} className="market-sentinel"/><header className={`rb-header market-header ${compact?'is-compact':''}`}><Link href="/" className="rb-brand"><Image src="/images/whale.png" alt="" width={56} height={40}/><span>ROYAL BALTIC<small>HORECA EXPRESS</small></span></Link><nav aria-label="Royal Baltic"><Link href="/live"><Search size={19}/><span>{t('catalog')}</span></Link><Link href="/account"><UserRound size={19}/><span>{t('account')}</span></Link><Link href="/cart"><ShoppingBag size={19}/><span>{t('cart')}</span></Link></nav><label className="rb-language"><Globe size={17}/><span className="sr-only">{t('language')}</span><select value={locale} onChange={e=>{if(isLocale(e.target.value))setLocale(e.target.value)}}>{locales.map(l=><option value={l} key={l}>{languageNames[l]}</option>)}</select></label></header></>;
}
