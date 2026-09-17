import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { restaurantMembers, restaurants } from '@/db/schema';
import { database, ApiError } from './db';

export async function requireRestaurant(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) throw new ApiError(401, 'Anmeldung erforderlich.');

  const db = database();
  const [record] = await db
    .select({ restaurant: restaurants })
    .from(restaurantMembers)
    .innerJoin(restaurants, eq(restaurantMembers.restaurantId, restaurants.id))
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1);

  if (!record?.restaurant) {
    throw new ApiError(403, 'Kein Betrieb ist mit diesem Benutzerkonto verknüpft.');
  }
  if (!record.restaurant.verified) {
    throw new ApiError(403, 'Ihr Betrieb ist noch nicht freigeschaltet.');
  }
  return record.restaurant;
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || origin !== new URL(req.url).origin) {
    throw new ApiError(403, 'Ungültiger Ursprung.');
  }
}
