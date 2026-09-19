import { eq } from "drizzle-orm";
import { categories } from "@/db/schema";
import { requireRestaurant } from "@/lib/server/auth";
import { database, apiError } from "@/lib/server/db";
import { privateJson } from "@/lib/server/http";
export async function GET(req: Request) {
  try {
    await requireRestaurant(req);
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
