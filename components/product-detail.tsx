"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {Fish,ShoppingBag} from 'lucide-react';
import {useSession} from '@/lib/auth-client';
import type {LiveProduct} from '@/lib/live-api';
import {readShopCart,cartKey} from '@/lib/shop-cart';
import {useI18n} from './i18n-provider';
import {shopCopy} from './shop-copy';
export function ProductDetail({id}:{id:string}){
 const {locale,t}=useI18n(),c=shopCopy[locale];const {data:session,isPending}=useSession();const [product,setProduct]=useState<LiveProduct|null>(null),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[quantity,setQuantity]=useState(1),[added,setAdded]=useState(false),[locked,setLocked]=useState(false);
 useEffect(()=>{let active=true;fetch('/api/catalog').then(async r=>{if(!r.ok)throw Error();return await r.json() as LiveProduct[]}).then(rows=>{if(active)setProduct(rows.find(p=>p.id===id)||null)}).catch(()=>{if(active)setFailed(true)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id]);
 const money=(n:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(n/100);
 if(loading)return <main className="rb-state" role="status">{t('loading')}</main>;
 if(!product)return <main className="rb-state"><h1>{t(failed?'error':'noProducts')}</h1><Link href="/live">{c.continue}</Link></main>;
 const p=product,title=p.translations?.[locale]?.title||p.title,kg=parseFloat(p.unitWeight||'');
 function add(){if(!product||isPending)return;const uid=session?.user.id||'guest';try{if(sessionStorage.getItem(`rb-pending-${uid}`)){setLocked(true);return;}const cart=readShopCart(uid);cart[id]=Math.min(1000,product.stock,(cart[id]||0)+quantity);sessionStorage.setItem(cartKey(uid),JSON.stringify(cart));setAdded(true);}catch{setFailed(true)}}
 return <main className="market-detail"><Link href="/live">← {t('catalog')}</Link><div className="market-detail-grid"><div className="market-detail-photo">{p.imageUrl?<Image src={p.imageUrl} alt={title} width={720} height={600} unoptimized/>:<Fish size={90} aria-label={title}/>}</div><section><p className="rb-eyebrow">ROYAL BALTIC · {p.species}</p><h1>{title}</h1><p className="market-detail-price">{money(p.priceNetto)} <small>{t('net')}</small></p><p>{p.packageType}{kg>0&&<> · {money(p.priceNetto/kg)}/kg</>}</p><p>{t(p.stock>0?'stock':'out')}</p><div className="market-calculator"><label>{c.box}<input type="number" min={1} max={Math.min(1000,p.stock)||1} step={1} value={quantity} onChange={e=>{setQuantity(Math.max(1,Math.min(1000,p.stock||1,Math.trunc(Number(e.target.value)||1))));setAdded(false)}}/></label><output aria-live="polite">{money(quantity*p.priceNetto)} {t('net')}{kg>0&&<> · {quantity*kg} kg</>}</output><button className="rb-primary" disabled={isPending||p.stock<1||locked} onClick={add}><ShoppingBag size={18}/>{added?c.added:c.add}</button>{added&&<Link className="rb-secondary" href="/cart">{c.viewCart} →</Link>}{locked&&<p role="alert">{t('orderLocked')} <Link href="/checkout">{c.checkout}</Link></p>}{failed&&<p role="alert">{t('error')}</p>}</div><p>{locale==='ru'?'НДС и доставка рассчитываются при оформлении.':locale==='fr'?'TVA et livraison calculées lors de la commande.':locale==='ar'?'تُحسب الضريبة والتوصيل عند إتمام الطلب.':'VAT and delivery calculated at checkout.'}</p><dl><dt>{t('catalog')}</dt><dd>{p.category}</dd><dt>{c.perBox}</dt><dd>{p.unitWeight||p.packageType}</dd></dl><p>{p.translations?.[locale]?.description||p.description}</p></section></div></main>
}
