import { requireAdmin, assertSameOrigin } from "@/lib/server/auth";
import { adminRead, adminWrite } from "@/lib/server/admin";
import { apiError } from "@/lib/server/db";
import { privateJson } from "@/lib/server/http";
type Context = { params: Promise<{ resource: string }> };
export async function GET(req: Request, { params }: Context) {
  try {
    await requireAdmin(req);
    return privateJson(
      await adminRead((await params).resource, new URL(req.url)),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request, { params }: Context) {
  try {
    assertSameOrigin(req);
    await requireAdmin(req);
    return privateJson(await adminWrite((await params).resource, req), 201);
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(req: Request, context: Context) {
  try {
    assertSameOrigin(req);
    await requireAdmin(req);
    return privateJson(await adminWrite((await context.params).resource, req));
  } catch (e) {
    return apiError(e);
  }
}
