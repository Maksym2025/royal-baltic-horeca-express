import { Pool } from "pg";
import { ApiError } from "./db";
import type { AnnouncedProduct, IntentData } from "../product-intent";
const pool = new Pool({
  connectionString: process.env.CHANNEL_DATABASE_URL,
  max: 2,
  connectionTimeoutMillis: 5000,
});
export async function announcedProducts(): Promise<AnnouncedProduct[]> {
  if (process.env.HORECA_INTENTS_ENABLED !== "1") return [];
  return (await pool.query("select horeca_launch_public() result")).rows[0]
    .result;
}
export async function productIntentData(
  subject: string | null,
): Promise<IntentData> {
  if (process.env.HORECA_INTENTS_ENABLED !== "1")
    return { products: [], counts: {}, liked: [], preorders: [] };
  const [products, state] = await Promise.all([
    announcedProducts(),
    pool.query("select horeca_launch_state($1) result", [subject]),
  ]);
  return { products, ...state.rows[0].result };
}
export async function saveProductIntent(
  subject: string,
  body: {
    action: string;
    productId: string;
    quantity?: number;
    interested?: boolean;
  },
) {
  if (process.env.HORECA_INTENTS_ENABLED !== "1")
    throw new ApiError(503, "INTENT_UNAVAILABLE");
  try {
    return (
      await pool.query(
        "select horeca_product_intent($1,$2,$3::uuid,$4,$5) result",
        [
          subject,
          body.action,
          body.productId,
          body.quantity ?? null,
          body.interested ?? null,
        ],
      )
    ).rows[0].result;
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    throw new ApiError(
      /REGISTRATION|APPROVAL/.test(m)
        ? 403
        : /UNAVAILABLE|STALE/.test(m)
          ? 409
          : /RATE_LIMIT/.test(m)
            ? 429
            : 400,
      /^[A-Z_]+$/.test(m) ? m : "INTENT_UNAVAILABLE",
    );
  }
}
