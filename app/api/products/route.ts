import { and, eq } from "drizzle-orm";
import { products, categories } from "@/db/schema";
import { database, apiError } from "@/lib/server/db";
import { publicProduct } from "@/lib/public-product";
export async function GET() {
  try {
    return Response.json(
      await database()
        .select({ product: products })
        .from(products)
        .innerJoin(categories, eq(products.category, categories.id))
        .where(and(eq(products.active, true), eq(categories.active, true)))
        .then((rows) => rows.map((r) => publicProduct(r.product))),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
