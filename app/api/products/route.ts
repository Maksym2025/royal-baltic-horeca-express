import { and, eq } from "drizzle-orm";
import { products, categories } from "@/db/schema";
import { database, apiError } from "@/lib/server/db";
import { requireRestaurant } from "@/lib/server/auth";
import {coreEnabled,coreProducts} from "@/lib/server/commerce-core";
export async function GET(req: Request) {
  try {
    const restaurant=await requireRestaurant(req);
    if(coreEnabled())return Response.json(await coreProducts(restaurant.subject??restaurant.id),{headers:{"Cache-Control":"private, no-store"}});
    return Response.json(
      await database()
        .select({ product: products })
        .from(products)
        .innerJoin(categories, eq(products.category, categories.id))
        .where(and(eq(products.active, true), eq(categories.active, true)))
        .then((rows) => rows.map((r) => r.product)),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}

