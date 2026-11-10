import {unifiedEnabled,unifiedCall} from "./unified";
import type {LiveProduct,LiveOrder} from "@/lib/live-api";
import {ApiError} from "./db";
export const coreEnabled=()=>unifiedEnabled()||Boolean(process.env.COMMERCE_CORE_URL);
async function core<T>(path:string,subject:string,init:RequestInit={}):Promise<T>{
 if(unifiedEnabled()){if(path==="/api/channel/catalog")return unifiedCall<T>(subject,"catalog");if(path==="/api/channel/orders"&&init.method==="POST"){const body=JSON.parse(String(init.body));const result=await unifiedCall<{id:string}>(subject,"place_order",body,body.idempotencyKey);return {orderId:result.id} as T;}if(path==="/api/channel/orders")return unifiedCall<T>(subject,"orders");throw new ApiError(404,"Unknown Core operation");}
 const base=process.env.COMMERCE_CORE_URL;const secret=process.env.COMMERCE_CORE_SECRET;
 if(!base||!secret)throw new ApiError(503,"Commerce Core bridge is not configured.");
 const url=new URL(path,base);url.searchParams.set("subject",subject);
 const r=await fetch(url,{...init,headers:{"Content-Type":"application/json",Authorization:"Bearer "+secret,...init.headers},cache:"no-store",redirect:"error"});
 const b=await r.json();if(!r.ok)throw new ApiError(r.status,b.message||b.error||"Commerce Core unavailable");return b as T;
}
type Product={vat_rate:number;id:string;name:string;species:string|null;product_form:string|null;pack_weight:string|number;effective_price:number;available_kg:number};
export async function coreProducts(subject:string):Promise<LiveProduct[]>{
 const b=await core<{products:Product[]}>("/api/channel/catalog",subject);
 return b.products.map(p=>({id:p.id,title:p.name,category:p.species||"seafood",description:p.product_form,origin:null,species:p.species,unitWeight:p.pack_weight+" kg",imageUrl:null,images:[],translations:{},packageType:p.pack_weight+" kg carton",priceNetto:Math.round(p.effective_price*Number(p.pack_weight)*100),vatRate:Number(p.vat_rate),stock:Math.floor(p.available_kg/Number(p.pack_weight)),stockStatus:p.available_kg>0?"in_stock":"out_of_stock",active:true}));
}
export async function coreCategories(subject:string){const products=await coreProducts(subject);return [...new Set(products.map(p=>p.category))].map(id=>({id,name:id,active:true,translations:{}}));}
type CoreOrder={channel_context?:Record<string,string>;id:string;fulfillment_state:string;created_at:string;items:{productId:string;qty:number|string;unitPrice:number|string;packWeight:number|string;title:string;vatRate:number|null}[];payment_verified:boolean};
export async function coreOrders(subject:string):Promise<LiveOrder[]>{
 const rows=await core<CoreOrder[]>("/api/channel/orders",subject);
 return rows.map(o=>{if(o.items.some(i=>i.vatRate==null))throw new ApiError(409,"TAX_CONFIGURATION_REQUIRED");const total=o.items.reduce((n,i)=>n+Number(i.qty)*Number(i.unitPrice)*100,0);const vat=o.items.reduce((n,i)=>n+Math.round(Number(i.qty)*Number(i.unitPrice)*Number(i.vatRate)),0);return {id:o.id,totalAmountNetto:Math.round(total),totalVat:vat,totalAmountBrutto:Math.round(total)+vat,status:o.fulfillment_state==="dispatched"?"in_transit":o.fulfillment_state==="cancelled"?"cancelled":o.fulfillment_state==="draft"?"pending":"confirmed",deliveryDate:o.channel_context?.deliveryDate??"",deliverySlotId:o.channel_context?.deliverySlotId??"",deliveryAddress:o.channel_context?.deliveryAddress??"",paymentMethod:(o.channel_context?.paymentMethod??"advance") as LiveOrder["paymentMethod"],createdAt:o.created_at,payments:[{status:o.payment_verified?"succeeded":"pending"}],items:o.items.map(i=>({productId:i.productId,quantity:Number(i.qty)/Number(i.packWeight),priceAtMoment:Math.round(Number(i.unitPrice)*Number(i.packWeight)*100),vatRate:Number(i.vatRate),productTitle:i.title,packageType:i.packWeight+" kg carton"}))};});
}
export async function corePlaceOrder(subject:string,body:{idempotencyKey:string;items:{productId:string;quantity:number}[]},context:Record<string,string>={}){
 return core<{orderId:string}>("/api/channel/orders",subject,{method:"POST",body:JSON.stringify({subject,context,idempotencyKey:body.idempotencyKey,items:body.items.map(i=>({productId:i.productId,cases:i.quantity}))})});
}

