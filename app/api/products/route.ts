import {eq} from 'drizzle-orm';
import {products} from '@/db/schema';
import {database,apiError} from '@/lib/server/db';
import {requireRestaurant} from '@/lib/server/auth';
export async function GET(req:Request){try{await requireRestaurant(req);return Response.json(await database().select().from(products).where(eq(products.active,true)),{headers:{'Cache-Control':'private, no-store'}})}catch(e){return apiError(e)}}
