import { eq } from "drizzle-orm";
import { categories } from "@/db/schema";
import { database, apiError } from "@/lib/server/db";
export async function GET() {
  try {
    return Response.json(
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
