import {pgTable,pgEnum,uuid,text,integer,boolean,timestamp,date,jsonb,uniqueIndex,index,check} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';

export const paymentTerms=pgEnum('payment_terms',['INVOICE_7_DAYS','CARD_IMMEDIATE']);
export const orderStatus=pgEnum('order_status',['pending','processing','in_transit','delivered','cancelled']);
export const paymentStatus=pgEnum('payment_status',['pending','succeeded','failed']);

// Better Auth core schema. IDs are text because Better Auth owns their generation.
export const user=pgTable('user',{
  id:text().primaryKey(),
  name:text().notNull(),
  email:text().notNull().unique(),
  emailVerified:boolean('email_verified').notNull().default(false),
  image:text(),
  createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow(),
});
export const session=pgTable('session',{
  id:text().primaryKey(),
  userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
  token:text().notNull().unique(),
  expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),
  ipAddress:text('ip_address'),
  userAgent:text('user_agent'),
  createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow(),
},t=>[index('session_user_id_idx').on(t.userId)]);
export const account=pgTable('account',{
  id:text().primaryKey(),
  userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
  accountId:text('account_id').notNull(),
  providerId:text('provider_id').notNull(),
  accessToken:text('access_token'),
  refreshToken:text('refresh_token'),
  accessTokenExpiresAt:timestamp('access_token_expires_at',{withTimezone:true}),
  refreshTokenExpiresAt:timestamp('refresh_token_expires_at',{withTimezone:true}),
  scope:text(),
  idToken:text('id_token'),
  password:text(),
  createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow(),
},t=>[index('account_user_id_idx').on(t.userId)]);
export const verification=pgTable('verification',{
  id:text().primaryKey(),
  identifier:text().notNull(),
  value:text().notNull(),
  expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),
  createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow(),
},t=>[index('verification_identifier_idx').on(t.identifier)]);

export const restaurants=pgTable('restaurants',{id:uuid().defaultRandom().primaryKey(),name:text().notNull(),email:text().notNull(),phone:text(),address:text().notNull(),vatNumber:text('vat_number').notNull(),stripeCustomerId:text('stripe_customer_id'),paymentTerms:paymentTerms('payment_terms').notNull().default('CARD_IMMEDIATE'),verified:boolean().notNull().default(false),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()});
export const restaurantMembers=pgTable('restaurant_members',{id:uuid().defaultRandom().primaryKey(),userId:text('subject').notNull().unique().references(()=>user.id,{onDelete:'cascade'}),restaurantId:uuid('restaurant_id').notNull().references(()=>restaurants.id)});
export const products=pgTable('products',{id:text().primaryKey(),title:text().notNull(),category:text().notNull(),packageType:text('package_type').notNull(),priceNetto:integer('price_netto').notNull(),vatRate:integer('vat_rate').notNull(),stock:integer().notNull().default(0),stockStatus:text('stock_status').notNull().default('in_stock'),active:boolean().notNull().default(true)},t=>[check('product_price_positive',sql`${t.priceNetto} >= 0`),check('product_stock_positive',sql`${t.stock} >= 0`),check('product_vat_bounds',sql`${t.vatRate} between 0 and 10000`)]);
export const deliverySlots=pgTable('delivery_slots',{id:uuid().defaultRandom().primaryKey(),deliveryDate:date('delivery_date').notNull(),window:text().notNull(),enabled:boolean().notNull().default(true),cutoffAt:timestamp('cutoff_at',{withTimezone:true}).notNull()});
export const orders=pgTable('orders',{id:uuid().defaultRandom().primaryKey(),restaurantId:uuid('restaurant_id').notNull().references(()=>restaurants.id),idempotencyKey:uuid('idempotency_key').notNull(),requestHash:text('request_hash').notNull(),totalAmountNetto:integer('total_amount_netto').notNull(),totalVat:integer('total_vat').notNull(),totalAmountBrutto:integer('total_amount_brutto').notNull(),currency:text().notNull().default('eur'),status:orderStatus().notNull().default('pending'),deliveryDate:date('delivery_date').notNull(),deliverySlotId:uuid('delivery_slot_id').notNull().references(()=>deliverySlots.id),deliveryAddress:text('delivery_address').notNull(),paymentMethod:text('payment_method').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()},t=>[uniqueIndex('order_idempotency').on(t.restaurantId,t.idempotencyKey),check('order_totals_match',sql`${t.totalAmountBrutto} = ${t.totalAmountNetto} + ${t.totalVat}`)]);
export const orderItems=pgTable('order_items',{id:uuid().defaultRandom().primaryKey(),orderId:uuid('order_id').notNull().references(()=>orders.id),productId:text('product_id').notNull().references(()=>products.id),quantity:integer().notNull(),priceAtMoment:integer('price_at_moment').notNull(),vatRate:integer('vat_rate').notNull(),productTitle:text('product_title').notNull(),packageType:text('package_type').notNull()},t=>[check('item_quantity_positive',sql`${t.quantity} > 0`)]);
export const payments=pgTable('payments',{id:uuid().defaultRandom().primaryKey(),orderId:uuid('order_id').notNull().references(()=>orders.id),stripePaymentIntentId:text('stripe_payment_intent_id').unique(),amount:integer().notNull(),currency:text().notNull().default('eur'),status:paymentStatus().notNull().default('pending'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()});
export const stripeEvents=pgTable('stripe_events',{id:text().primaryKey(),receivedAt:timestamp('received_at',{withTimezone:true}).notNull().defaultNow()});
