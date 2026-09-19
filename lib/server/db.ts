import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
export function database() {
  if (!process.env.DATABASE_URL)
    throw new ApiError(503, "Database connection is not configured.");
  return drizzle(neon(process.env.DATABASE_URL), { schema });
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  let cause: unknown = error;
  for (let i = 0; i < 3 && cause instanceof Error; i++) {
    if (
      [
        "Restaurant not verified",
        "Idempotency conflict",
        "Invoice not allowed",
        "Delivery slot unavailable",
        "Insufficient stock",
        "Paid orders require payment reconciliation before cancellation",
      ].includes(cause.message)
    )
      return Response.json(
        { error: cause.message },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    if ("code" in cause && cause.code === "23505")
      return Response.json(
        { error: "This record already exists." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    cause = cause.cause;
  }
  console.error("API operation failed");
  return Response.json(
    { error: "The request could not be processed." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}
