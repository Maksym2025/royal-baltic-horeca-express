import {and,eq} from 'drizzle-orm';
import {products,categories} from '@/db/schema';
import {database} from '@/lib/server/db';
import {publicProduct} from '@/lib/public-product';
import {unifiedPublicCatalog,unifiedEnabled} from '@/lib/server/unified';
export async function GET(){try{
 const rows=unifiedEnabled()?await unifiedPublicCatalog():await database().select({product:products}).from(products).innerJoin(categories,eq(products.category,categories.id)).where(and(eq(products.active,true),eq(categories.active,true))).then(r=>r.map(x=>publicProduct(x.product)));
 return Response.json(rows,{headers:{'Cache-Control':'no-store'}});
}catch{return Response.json({error:'CATALOG_UNAVAILABLE'},{status:503,headers:{'Cache-Control':'no-store'}});}}
