import {eq} from 'drizzle-orm';
import {restaurantMembers,restaurants} from '@/db/schema';
import {database,ApiError} from './db';
// This header is trusted ONLY behind Sites' authenticated dispatcher.
// Do not expose the origin worker or reuse this adapter on another host.
export async function requireRestaurant(request:Request){const subject=request.headers.get('oai-authenticated-user-id');if(!subject)throw new ApiError(401,'Anmeldung erforderlich.');const db=database();const [record]=await db.select({restaurant:restaurants}).from(restaurantMembers).innerJoin(restaurants,eq(restaurantMembers.restaurantId,restaurants.id)).where(eq(restaurantMembers.subject,subject)).limit(1);if(!record?.restaurant.verified)throw new ApiError(403,'Ihr Betrieb ist noch nicht freigeschaltet.');return record.restaurant}
export function assertSameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new ApiError(403,'Ungültiger Ursprung.');}
