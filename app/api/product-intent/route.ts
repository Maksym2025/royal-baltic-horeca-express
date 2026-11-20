import { auth } from "@/lib/auth";
import { requireUser, assertSameOrigin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/db";
import { privateJson, readBody } from "@/lib/server/http";
import {
  productIntentData,
  saveProductIntent,
} from "@/lib/server/product-intent";
import { intentSchema } from "@/lib/product-intent";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return privateJson(await productIntentData(session?.user.id ?? null));
  } catch {
    return privateJson({ error: "INTENT_UNAVAILABLE" }, 503);
  }
}
export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    const account = await requireUser(req);
    return privateJson(
      await saveProductIntent(account.id, await readBody(req, intentSchema)),
    );
  } catch (e) {
    return apiError(e);
  }
}
