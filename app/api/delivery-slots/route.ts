import {and,eq,gt,asc} from 'drizzle-orm';
import {deliverySlots} from '@/db/schema';
import {database,apiError} from '@/lib/server/db';
import {requireRestaurant} from '@/lib/server/auth';
export async function GET(req:Request){try{await requireRestaurant(req);return Response.json(await database().select().from(deliverySlots).where(and(eq(deliverySlots.enabled,true),gt(deliverySlots.cutoffAt,new Date()))).orderBy(asc(deliverySlots.deliveryDate)).limit(30),{headers:{'Cache-Control':'private, no-store'}})}catch(e){return apiError(e)}}
