import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { restaurants } from '@/db/schema';
import { database, apiError } from '@/lib/server/db';
import { requireCompany, assertSameOrigin } from '@/lib/server/auth';
import { privateJson, readBody } from '@/lib/server/http';
export async function GET(req:Request){try{return privateJson(await requireCompany(req));}catch(e){return apiError(e);}}
export async function PATCH(req:Request){try{
 assertSameOrigin(req);const company=await requireCompany(req);
 const data=await readBody(req,z.object({contactPerson:z.string().trim().min(1).max(160),email:z.string().email().max(254),phone:z.string().trim().max(60),address:z.string().trim().min(5).max(500),billingAddress:z.string().trim().min(5).max(500)}).strict());
 const [updated]=await database().update(restaurants).set(data).where(eq(restaurants.id,company.id)).returning();return privateJson(updated);
}catch(e){return apiError(e);}}
