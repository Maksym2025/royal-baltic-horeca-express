import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { restaurantMembers, restaurants } from "@/db/schema";
import { ApiError, apiError, database } from "@/lib/server/db";
import { assertSameOrigin, requireUser } from "@/lib/server/auth";

const companySchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: z.string().email().max(254),
    phone: z.string().trim().max(60).optional().default(""),
    address: z.string().trim().min(5).max(300),
    vatNumber: z.string().trim().min(4).max(40),
  })
  .strict();

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) throw new ApiError(401, "Anmeldung erforderlich.");
    const db = database();
    const [record] = await db
      .select({ restaurant: restaurants })
      .from(restaurantMembers)
      .innerJoin(
        restaurants,
        eq(restaurantMembers.restaurantId, restaurants.id),
      )
      .where(eq(restaurantMembers.userId, session.user.id))
      .limit(1);
    const account = await requireUser(req);
    return Response.json(
      { company: record?.restaurant ?? null, role: account.role },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) throw new ApiError(401, "Anmeldung erforderlich.");
    const raw = await req.text();
    if (raw.length > 10000) throw new ApiError(413, "Anfrage zu groß.");
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "Ungültiges JSON.");
    }
    const parsed = companySchema.safeParse(json);
    if (!parsed.success)
      throw new ApiError(400, "Bitte Firmendaten vollständig prüfen.");

    const db = database();
    const [existing] = await db
      .select({ restaurantId: restaurantMembers.restaurantId })
      .from(restaurantMembers)
      .where(eq(restaurantMembers.userId, session.user.id))
      .limit(1);
    if (existing)
      throw new ApiError(
        409,
        "Dieses Benutzerkonto ist bereits mit einem Betrieb verknüpft.",
      );

    // One statement prevents orphan companies if membership insertion fails or races.
    const d = parsed.data;
    const result = await db.execute(sql`WITH new_company AS (
      INSERT INTO restaurants(name,email,phone,address,vat_number,payment_terms,verified)
      VALUES(${d.name},${d.email},${d.phone || null},${d.address},${d.vatNumber},'CARD_IMMEDIATE',false)
      RETURNING id
    ) INSERT INTO restaurant_members(subject,restaurant_id)
      SELECT ${session.user.id},id FROM new_company RETURNING restaurant_id`);
    const [company] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, String(result.rows[0].restaurant_id)));

    return Response.json(
      { company, status: "pending_verification" },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
