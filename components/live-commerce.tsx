'use client';

import {useEffect,useMemo,useState} from 'react';
import {AuthFlow} from '@/components/auth-flow';
import {signOut,useSession} from '@/lib/auth-client';
import {liveApi,type LiveCompany,type LiveOrder,type LiveProduct,type LiveSlot} from '@/lib/live-api';

type Cart=Record<string,number>;
const eur=(c:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(c/100);

export function LiveCommerce(){
 const {data:session,isPending}=useSession();
 const [company,setCompany]=useState<LiveCompany|null>(null),[products,setProducts]=useState<LiveProduct[]>([]),[slots,setSlots]=useState<LiveSlot[]>([]),[orders,setOrders]=useState<LiveOrder[]>([]),[cart,setCart]=useState<Cart>({}),[slot,setSlot]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[orderId,setOrderId]=useState('');
 async function load(){setError('');try{const c=await liveApi.company();setCompany(c.company);if(c.company?.verified){const [p,s,o]=await Promise.all([liveApi.products(),liveApi.slots(),liveApi.orders()]);setProducts(p);setSlots(s);setOrders(o);setSlot(x=>x||s[0]?.id||'')}}catch(e){setError(e instanceof Error?e.message:'Fehler beim Laden.')}}
 useEffect(()=>{if(session?.user)load();else{setCompany(null);setProducts([]);setOrders([])}},[session?.user?.id]);
 const totals=useMemo(()=>products.reduce((a,p)=>{const q=cart[p.id]||0;const net=p.priceNetto*q;return {net:a.net+net,tax:a.tax+Math.round(net*p.vatRate/10000)}},{net:0,tax:0}),[products,cart]);
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 function qty(p:LiveProduct,d:number){setCart(c=>({...c,[p.id]:Math.max(0,Math.min(p.stock,(c[p.id]||0)+d))}))}
 async function order(){if(!slot||!count)return;setBusy(true);setError('');try{const r=await liveApi.placeOrder({idempotencyKey:crypto.randomUUID(),deliverySlotId:slot,paymentMethod:company?.paymentTerms==='INVOICE_7_DAYS'?'invoice':'card_on_delivery',items:Object.entries(cart).filter(([,q])=>q>0).map(([productId,quantity])=>({productId,quantity}))});setOrderId(r.orderId);setCart({});await load()}catch(e){setError(e instanceof Error?e.message:'Bestellung fehlgeschlagen.')}finally{setBusy(false)}}
 if(isPending)return <div className="live-state">Zugang wird geprüft …</div>;
 if(!session?.user)return <section className="live-entry"><AuthFlow onReady={load}/></section>;
 if(!company)return <section className="live-entry"><div className="signed-user"><b>{session.user.name}</b><span>{session.user.email}</span></div><AuthFlow onReady={load}/></section>;
 if(!company.verified)return <section className="live-entry"><h1>B2B-Antrag eingegangen.</h1><p><b>{company.name}</b> ist mit Ihrem Benutzerkonto verknüpft. Nach der Prüfung werden Netto-Preise und Bestellungen freigeschaltet.</p><button onClick={()=>signOut()}>Abmelden</button></section>;
 return <div className="live-commerce"><header><div><small>HORECA EXPRESS · LIVE</small><h1>Ihr Fang für die Küche.</h1><p>{company.name} · Netto-Preise · {company.paymentTerms==='INVOICE_7_DAYS'?'Rechnung 7 Tage':'Kartenzahlung'}</p></div><button onClick={()=>signOut()}>Abmelden</button></header>{error&&<div className="auth-error">{error}</div>}{orderId&&<div className="live-success">Bestellung <b>{orderId}</b> wurde atomar in Neon angelegt.</div>}
 <div className="live-layout"><main><div className="live-grid">{products.map(p=><article key={p.id}><div><small>{p.category} · Art. {p.id}</small><h2>{p.title}</h2><p>{p.packageType} · Bestand {p.stock}</p></div><div className="live-buy"><b>{eur(p.priceNetto)}</b><span>netto</span><div><button disabled={!cart[p.id]} onClick={()=>qty(p,-1)}>−</button><strong>{cart[p.id]||0}</strong><button disabled={(cart[p.id]||0)>=p.stock} onClick={()=>qty(p,1)}>+</button></div></div></article>)}</div></main>
 <aside className="live-cart"><h2>Warenkorb</h2><p>{count} Gebinde</p>{Object.entries(cart).filter(([,q])=>q).map(([id,q])=>{const p=products.find(x=>x.id===id)!;return <div className="live-line" key={id}><span>{p.title} × {q}</span><b>{eur(p.priceNetto*q)}</b></div>})}<hr/><div className="live-line"><span>Netto</span><b>{eur(totals.net)}</b></div><div className="live-line"><span>MwSt.</span><b>{eur(totals.tax)}</b></div><div className="live-line total"><span>Brutto</span><b>{eur(totals.net+totals.tax)}</b></div><label>Liefertermin<select value={slot} onChange={e=>setSlot(e.target.value)}>{slots.map(s=><option key={s.id} value={s.id}>{new Date(s.deliveryDate).toLocaleDateString('de-DE')} · {s.window}</option>)}</select></label><button className="live-order" disabled={busy||!count||!slot} onClick={order}>{busy?'Bestellung wird angelegt …':'Verbindlich bestellen'}</button></aside></div>
 <section className="live-orders"><h2>Letzte Bestellungen</h2>{orders.slice(0,5).map(o=><div key={o.id}><b>{o.id.slice(0,8)}</b><span>{new Date(o.createdAt).toLocaleDateString('de-DE')} · {o.status}</span><strong>{eur(o.totalAmountBrutto)}</strong></div>)}</section></div>;
}
