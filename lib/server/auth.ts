import { eq } from "drizzle-orm";
import { restaurantMembers, restaurants, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ApiError, database } from "./db";

export async function requireUser(request: Pick<Request, "headers">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) throw new ApiError(401, "Authentication required.");
  // Read role from PostgreSQL on every request: never a browser claim or stale session role.
  const [record] = await database()
    .select({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  if (!record) throw new ApiError(401, "Authentication required.");
  return record;
}
export async function requireAdmin(request: Pick<Request, "headers">) {
  const account = await requireUser(request);
  if (account.role !== "ADMIN")
    throw new ApiError(403, "Administrator access required.");
  return account;
}
export async function getCompany(userId: string) {
  const [record] = await database()
    .select({ restaurant: restaurants })
    .from(restaurantMembers)
    .innerJoin(restaurants, eq(restaurantMembers.restaurantId, restaurants.id))
    .where(eq(restaurantMembers.userId, userId))
    .limit(1);
  return record?.restaurant ?? null;
}
export async function requireCompany(request: Pick<Request, "headers">) {
  const account = await requireUser(request);
  const company = await getCompany(account.id);
  if (!company) throw new ApiError(403, "Company registration required.");
  return company;
}
export async function requireRestaurant(request: Pick<Request, "headers">) {
  const company = await requireCompany(request);
  if (!company.verified || company.approvalStatus !== "APPROVED")
    throw new ApiError(403, "B2B approval required.");
  return company;
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new ApiError(403, "Invalid origin.");
}
