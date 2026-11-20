"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {Fish,ShoppingBag} from 'lucide-react';
import {kilograms,remainingCartons} from '@/lib/cart-math';
import {useSession} from '@/lib/auth-client';
import type {LiveProduct} from '@/lib/live-api';
import {readShopCart,cartKey} from '@/lib/shop-cart';
import {useI18n} from './i18n-provider';
import {useProductIntent} from "./product-intent-provider";
import {PreorderControl,DemandHeart,IntentFeedback} from "./product-intent";
import {shopCopy} from './shop-copy';
import {ProductStorageBadge,ProductPreparation} from './product-facts';
import {categoryLabel} from './catalog-copy';
export function ProductDetail({id}:{id:string}){
 const {data:intent}=useProductIntent();
 const announcement=intent.products.find(p=>p.id===id);
 const {locale,t}=useI18n(),c=shopCopy[locale];const {data:session,isPending}=useSession();const [photo,setPhoto]=useState(0);const [product,setProduct]=useState<LiveProduct|null>(null),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[quantity,setQuantity]=useState(1),[added,setAdded]=useState(false),[locked,setLocked]=useState(false);
 useEffect(()=>{if(isPending)return;let active=true;const read=async(endpoint:string)=>{const r=await fetch(endpoint,{cache:'no-store'});if(!r.ok)throw Error();return await r.json() as LiveProduct[]};Promise.all([read('/api/catalog'),session?.user?.id?read('/api/products').catch(()=>[] as LiveProduct[]):Promise.resolve([] as LiveProduct[])]).then(([publicRows,privateRows])=>{const rows=new Map(publicRows.map(p=>[p.id,p]));privateRows.forEach(p=>rows.set(p.id,p));return [...rows.values()]}).then(rows=>{if(active){setProduct(rows.find(p=>p.id===id)||null);setFailed(false)}}).catch(()=>{if(active){setFailed(true);setProduct(null)}}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id,isPending,session?.user?.id]);
 const money=(n:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(n/100);
 if(loading||isPending)return <main className="rb-state" role="status">{t('loading')}</main>;
 const selected=product||announcement;
 if(!selected)return <main className="rb-state"><h1>{t(failed?'error':'noProducts')}</h1><Link href="/live">{c.continue}</Link></main>;
 const photos=selected.images?.length?selected.images.map(i=>i.url):selected.imageUrl?[selected.imageUrl]:[];
 const p=selected,title=p.translations?.[locale]?.title||p.title,kg=kilograms(p.unitWeight);
 const packageName=announcement?.packageTranslations[locale]||p.packageType;
 function add(){if(!product||isPending)return;const uid=session?.user.id||'guest';try{if(sessionStorage.getItem(`rb-pending-${uid}`)){setLocked(true);return;}const cart=readShopCart(uid);const room=remainingCartons(product.stock,cart[id]||0);if(quantity>room){setFailed(true);setAdded(false);return;}cart[id]=(cart[id]||0)+quantity;setFailed(false);sessionStorage.setItem(cartKey(uid),JSON.stringify(cart));setAdded(true);}catch{setFailed(true)}}
 return <main className="market-detail"><Link href="/live">← {t('catalog')}</Link><div className="market-detail-grid"><div><div className="market-detail-photo">{photos.length?<Image src={photos[photo]||photos[0]} alt={title} width={720} height={600} unoptimized/>:<Fish size={90} aria-label={title}/>}</div>{photos.length>1&&<div className="market-photo-thumbs">{photos.map((url,index)=><button key={url} type="button" aria-label={`${title} · ${index+1}`} aria-pressed={photo===index} onClick={()=>setPhoto(index)}><Image src={url} alt="" width={96} height={80} unoptimized/></button>)}</div>}</div><section><p className="rb-eyebrow">ROYAL BALTIC · {p.species}</p><h1>{title}</h1><ProductStorageBadge product={p} detail/><ProductPreparation product={p}/><p className="market-detail-price">{p.priceNetto>0?money(p.priceNetto):(locale==='ru'?'Цена уточняется':locale==='de'?'Preis auf Anfrage':locale==='fr'?'Prix sur demande':'Price on request')} <small>{t('net')}</small></p><p>{packageName}{p.priceNetto>0&&kg!==null&&<> · {money(p.priceNetto/kg)}/kg</>}</p><p>{t(p.stock>0?'stock':'out')}</p><IntentFeedback/>{announcement?.launchMode==="preorder"?<PreorderControl product={announcement}/>:p.stock===0?<DemandHeart productId={p.id}/>:<div className="market-calculator"><label>{c.box}<input type="number" min={1} max={Math.min(1000,p.stock)||1} step={1} value={quantity} onChange={e=>{setQuantity(Math.max(1,Math.min(1000,p.stock||1,Math.trunc(Number(e.target.value)||1))));setAdded(false)}}/></label><output aria-live="polite">{p.priceNetto>0?money(quantity*p.priceNetto):(locale==='ru'?'Цена уточняется':locale==='de'?'Preis auf Anfrage':locale==='fr'?'Prix sur demande':'Price on request')} {t('net')}{kg!==null&&<> · {quantity*kg} kg</>}</output><button className="rb-primary" disabled={isPending||p.stock<1||locked} onClick={add}><ShoppingBag size={18}/>{added?c.added:c.add}</button>{added&&<Link className="rb-secondary" href="/cart">{c.viewCart} →</Link>}{locked&&<p role="alert">{t('orderLocked')} <Link href="/checkout">{c.checkout}</Link></p>}{failed&&<p role="alert">{t('error')}</p>}</div>}<p>{locale==='de'?'MwSt. und Lieferung werden beim Bestellen berechnet.':locale==='ru'?'НДС и доставка рассчитываются при оформлении.':locale==='fr'?'TVA et livraison calculées lors de la commande.':locale==='ar'?'تُحسب الضريبة والتوصيل عند إتمام الطلب.':'VAT and delivery calculated at checkout.'}</p><dl><dt>{t('catalog')}</dt><dd>{categoryLabel(p.category,locale)}</dd><dt>{c.perBox}</dt><dd>{announcement?packageName:p.unitWeight||p.packageType}</dd></dl><p>{p.translations?.[locale]?.description||p.description}</p></section></div></main>
}
