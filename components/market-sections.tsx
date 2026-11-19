'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Storefront} from './storefront';
import {RecipeCards} from './recipe-blog';
import {useI18n} from './i18n-provider';
import type {ContentItem} from '@/lib/server/content';
export function MarketSections(){const {locale}=useI18n();const [items,setItems]=useState<ContentItem[]>([]);const [failed,setFailed]=useState(false);
useEffect(()=>{fetch('/api/content').then(r=>{if(!r.ok)throw Error();return r.json();}).then(setItems).catch(()=>setFailed(true));},[]);
const blocks=items.filter(x=>x.kind==='block').sort((a,b)=>(a.settings.order||0)-(b.settings.order||0));
return <div className="rb-market-preview">{failed&&<p role="alert">{locale==='ru'?'Не удалось загрузить витрину. Обновите страницу.':'Content unavailable. Please refresh.'}</p>}{blocks.map(b=>{const t=b.translations[locale]?.title?b.translations[locale]:b.translations.fr; if(!t)return null;
if(b.slug==='banner')return <section className="rb-editorial-banner" key={b.id}>{b.image_id&&<img src={'/api/content/media/'+b.image_id} alt=""/>}<div><small>ROYAL BALTIC</small><h2>{t.title}</h2><p>{t.body||t.summary}</p><Link href={b.settings.href||'/live'}>{t.cta||'Catalogue'} →</Link></div></section>;
if(b.slug==='recipes')return <section className="rb-home-section rb-recipe-section" key={b.id}><h2>{['Популярные рецепты','Recettes de chefs','Chef recipes','Rezepte von Köchen','Popular recipes','Recettes populaires','Beliebte Rezepte'].includes(t.title) ? ({"fr":"Les recettes de notre chef","ru":"Рецепты от нашего шефа","de":"Rezepte aus unserer Küche","en":"Recipes from our chef"})[locale==='ar'?'en':locale] : t.title}</h2><p>{t.summary||t.body}</p><RecipeCards items={items.filter(x=>x.kind==='recipe').slice(0,3)}/><Link href="/recipes">{locale==='ru'?'Все рецепты':locale==='de'?'Alle Rezepte':locale==='fr'?'Toutes les recettes':'All recipes'} →</Link></section>;
return <section key={b.id} className={b.slug==='chef'?'rb-chef-section':'rb-home-section rb-preview-week'}><div className={b.slug==='chef'?'rb-home-section':''}><h2>{t.title}</h2><p>{t.summary||t.body}</p><Storefront featured={b.slug!=='catalog'} selection={b.slug==='catalog'?undefined:b.settings.productIds||[]}/></div></section>;})}</div>;}
