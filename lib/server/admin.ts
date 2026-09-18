import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { categories, deliverySlots, orders, orderItems, payments, products, restaurants } from '@/db/schema';
import { ApiError, database } from './db';
import { readBody } from './http';
import { transitions, type OrderStatus } from '@/lib/order-status';

const text = z.string().trim().max(1000);
const image = z.object({ url: z.string().url().max(2000), pathname: text, contentType: z.enum(['image/jpeg','image/png','image/webp']), size: z.number().int().min(1).max(3000000) }).strict();
const productSchema = z.object({
  id: z.string().trim().min(1).max(60).regex(/^[a-zA-Z0-9._-]+$/), title: text.min(1), category: text.min(1),
  description: text.nullable().optional(), origin: text.nullable().optional(), species: text.nullable().optional(),
  unitWeight: text.nullable().optional(), packageType: text.min(1), priceNetto: z.number().int().min(0).max(10000000),
  vatRate: z.number().int().min(0).max(10000), stock: z.number().int().min(0).max(1000000), active: z.boolean(),
  imageUrl: z.string().url().max(2000).nullable().optional(), images: z.array(image).max(10).default([]),
  translations: z.record(z.enum(['fr','en','ru','ar']),z.object({title:text,description:text}).strict()).default({}),
}).strict();
const categorySchema = z.object({id:text.min(1).max(100),name:text.min(1),active:z.boolean(),translations:z.record(z.enum(['fr','en','ru','ar']),text).default({})}).strict();
const slotSchema = z.object({id:z.string().uuid().optional(),deliveryDate:z.string().date(),window:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d–([01]\d|2[0-3]):[0-5]\d$/),cutoffAt:z.string().datetime(),enabled:z.boolean()}).strict().refine(s=>s.window.slice(0,5)<s.window.slice(6),'Window end must follow start').refine(s=>s.cutoffAt.slice(0,10)<=s.deliveryDate,'Cutoff must not follow delivery date');

export async function adminRead(resource: string, url: URL) {
 const db = database();
 switch(resource) {
  case 'dashboard': {
   const result=await db.execute(sql`SELECT
    (SELECT count(*) FROM orders WHERE created_at >= (date_trunc('day',now() AT TIME ZONE 'Europe/Berlin') AT TIME ZONE 'Europe/Berlin')) AS "ordersToday",
    (SELECT count(*) FROM orders WHERE created_at >= (date_trunc('week',now() AT TIME ZONE 'Europe/Berlin') AT TIME ZONE 'Europe/Berlin')) AS "ordersWeek",
    (SELECT coalesce(sum(total_amount_netto),0) FROM orders WHERE status <> 'cancelled') AS "netSales",
    (SELECT count(*) FROM orders WHERE status = 'pending') AS "pendingOrders",
    (SELECT count(*) FROM products WHERE active AND stock < 6) AS "lowStock",
    (SELECT count(*) FROM restaurants WHERE verified AND approval_status='APPROVED') AS "activeCustomers"`);
   const recent=await db.select({order:orders,company:restaurants.name}).from(orders).innerJoin(restaurants,eq(orders.restaurantId,restaurants.id)).orderBy(desc(orders.createdAt)).limit(10);
   return {stats:result.rows[0],recent};
  }
  case 'products': return db.select().from(products).orderBy(products.title);
  case 'categories': return db.select().from(categories).orderBy(categories.name);
  case 'customers': return db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
  case 'delivery-slots': return db.select().from(deliverySlots).orderBy(desc(deliverySlots.deliveryDate));
  case 'orders': {
   const customer=url.searchParams.get('customer');
   if(customer&&!z.string().uuid().safeParse(customer).success) throw new ApiError(400,'Invalid customer.');
   const rows=await db.select({order:orders,company:restaurants.name,window:deliverySlots.window}).from(orders)
    .innerJoin(restaurants,eq(orders.restaurantId,restaurants.id)).innerJoin(deliverySlots,eq(orders.deliverySlotId,deliverySlots.id))
    .where(customer?eq(orders.restaurantId,customer):undefined).orderBy(desc(orders.createdAt)).limit(500);
   if(!rows.length)return [];
   const ids=rows.map(r=>r.order.id);
   const [items,paymentRows]=await Promise.all([db.select().from(orderItems).where(inArray(orderItems.orderId,ids)),db.select().from(payments).where(inArray(payments.orderId,ids))]);
   return rows.map(r=>({...r,items:items.filter(i=>i.orderId===r.order.id),payments:paymentRows.filter(p=>p.orderId===r.order.id)}));
  }
  case 'settings': return {currency:'EUR',timezone:'Europe/Berlin',imageStorageConfigured:!!process.env.BLOB_READ_WRITE_TOKEN,googleConfigured:!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET),onlineCardPayments:false};
  default: throw new ApiError(404,'Unknown resource.');
 }
}
export async function adminWrite(resource: string, req: Request) {
 const db=database();const creating=req.method==='POST';
 switch(resource) {
  case 'products': {
   const data=await readBody(req,productSchema);
   const [category]=await db.select().from(categories).where(eq(categories.id,data.category));
   if(!category)throw new ApiError(400,'Choose an existing category.');
   // Only configured object storage or existing static fallback URLs may be attached.
   for(const url of [data.imageUrl,...data.images.map(i=>i.url)].filter(Boolean) as string[]) {
    const host=process.env.BLOB_PUBLIC_HOST;
    if(!host||new URL(url).hostname!==host||new URL(url).protocol!=='https:')throw new ApiError(400,'Image must belong to configured catalog storage.');
   }
   const values={...data,stockStatus:data.stock===0?'out_of_stock':data.stock<6?'low':'in_stock'};
   if(creating)return (await db.insert(products).values(values).returning())[0];
   const [updated]=await db.update(products).set(values).where(eq(products.id,data.id)).returning();
   if(!updated)throw new ApiError(404,'Product not found.');return updated;
  }
  case 'categories': {
   const data=await readBody(req,categorySchema);
   if(creating)return (await db.insert(categories).values(data).returning())[0];
   const [updated]=await db.update(categories).set(data).where(eq(categories.id,data.id)).returning();
   if(!updated)throw new ApiError(404,'Category not found.');return updated;
  }
  case 'customers': {
   if(creating)throw new ApiError(405,'Use company registration.');
   const data=await readBody(req,z.object({id:z.string().uuid(),approvalStatus:z.enum(['PENDING','APPROVED','REJECTED','DISABLED']),paymentTerms:z.enum(['INVOICE_7_DAYS','CARD_IMMEDIATE'])}).strict());
   const [updated]=await db.update(restaurants).set({...data,verified:data.approvalStatus==='APPROVED'}).where(eq(restaurants.id,data.id)).returning();
   if(!updated)throw new ApiError(404,'Customer not found.');return updated;
  }
  case 'delivery-slots': {
   const data=await readBody(req,slotSchema);const values={...data,cutoffAt:new Date(data.cutoffAt)};
   if(creating)return (await db.insert(deliverySlots).values(values).returning())[0];
   if(!data.id)throw new ApiError(400,'Slot ID required.');
   // Existing order delivery snapshots must not be silently changed.
   const [used]=await db.select({id:orders.id}).from(orders).where(eq(orders.deliverySlotId,data.id)).limit(1);
   if(used){const [old]=await db.select().from(deliverySlots).where(eq(deliverySlots.id,data.id));if(old&&(old.deliveryDate!==data.deliveryDate||old.window!==data.window))throw new ApiError(409,'Slot has orders. Disable it and create a new slot to change its date/window.');}
   const [updated]=await db.update(deliverySlots).set(values).where(eq(deliverySlots.id,data.id)).returning();
   if(!updated)throw new ApiError(404,'Slot not found.');return updated;
  }
  case 'orders': {
   if(creating)throw new ApiError(405,'Use customer checkout.');
   const data=await readBody(req,z.object({id:z.string().uuid(),from:z.enum(['pending','confirmed','processing','preparing','ready','in_transit','delivered','cancelled']),status:z.enum(['pending','confirmed','processing','preparing','ready','in_transit','delivered','cancelled'])}).strict());
   if(!transitions[data.from as OrderStatus].includes(data.status))throw new ApiError(409,'Invalid order transition.');
   if(data.status==='cancelled'){
    const result=await db.execute(sql`select rb_cancel_order(${data.id}::uuid,${data.from}) as changed`);
    if(!result.rows[0]?.changed)throw new ApiError(409,'Order changed. Refresh and try again.');
    return {id:data.id,status:'cancelled'};
   }
   const [updated]=await db.update(orders).set({status:data.status}).where(and(eq(orders.id,data.id),eq(orders.status,data.from))).returning();
   if(!updated)throw new ApiError(409,'Order changed. Refresh and try again.');return updated;
  }
  default:throw new ApiError(404,'Unknown resource.');
 }
}
