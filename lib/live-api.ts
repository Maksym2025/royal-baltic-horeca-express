'use client';

export type LiveCompany = { id:string; name:string; email:string; phone:string|null; address:string; vatNumber:string; paymentTerms:'INVOICE_7_DAYS'|'CARD_IMMEDIATE'; verified:boolean };
export type LiveProduct = { id:string; title:string; category:string; packageType:string; priceNetto:number; vatRate:number; stock:number; stockStatus:string; active:boolean };
export type LiveSlot = { id:string; deliveryDate:string; window:string; cutoffAt:string; enabled:boolean };
export type LiveOrderItem = { productId:string; quantity:number; priceAtMoment:number; vatRate:number; productTitle:string; packageType:string };
export type LiveOrder = { id:string; totalAmountNetto:number; totalVat:number; totalAmountBrutto:number; status:string; deliveryDate:string; deliverySlotId:string; deliveryAddress:string; paymentMethod:string; createdAt:string; items:LiveOrderItem[] };

async function json<T>(url:string, init?:RequestInit):Promise<T>{
  const r=await fetch(url,{...init,headers:{'Content-Type':'application/json',...(init?.headers||{})},cache:'no-store'});
  const body=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(body.error||'Anfrage fehlgeschlagen.');
  return body as T;
}
export const liveApi={
  company:()=>json<{company:LiveCompany|null}>('/api/company'),
  profile:()=>json<LiveCompany>('/api/profile'),
  products:()=>json<LiveProduct[]>('/api/products'),
  slots:()=>json<LiveSlot[]>('/api/delivery-slots'),
  orders:()=>json<LiveOrder[]>('/api/orders'),
  placeOrder:(body:{idempotencyKey:string;deliverySlotId:string;paymentMethod:'invoice'|'card_on_delivery'|'advance';items:{productId:string;quantity:number}[]})=>json<{orderId:string}>('/api/orders',{method:'POST',body:JSON.stringify(body)}),
};
