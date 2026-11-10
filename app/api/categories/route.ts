import { eq } from "drizzle-orm";
import { categories } from "@/db/schema";
import { requireRestaurant } from "@/lib/server/auth";
import { database, apiError } from "@/lib/server/db";
import { privateJson } from "@/lib/server/http";
import {coreEnabled,coreCategories} from "@/lib/server/commerce-core";
export async function GET(req: Request) {
  try {
    const restaurant=await requireRestaurant(req);if(coreEnabled())return Response.json(await coreCategories(restaurant.subject??restaurant.id));
    return privateJson(
      await database()
        .select()
        .from(categories)
        .where(eq(categories.active, true))
        .orderBy(categories.name),
    );
  } catch (e) {
    return apiError(e);
  }
}

