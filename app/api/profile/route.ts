import {apiError} from '@/lib/server/db';
import {requireRestaurant} from '@/lib/server/auth';
export async function GET(req:Request){try{const r=await requireRestaurant(req);return Response.json({id:r.id,name:r.name,email:r.email,phone:r.phone,address:r.address,vatNumber:r.vatNumber,paymentTerms:r.paymentTerms,verified:r.verified},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return apiError(e)}}
