import { z } from 'zod';
import { ApiError } from './db';
export async function readBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  const raw = await req.text();
  if (raw.length > 100000) throw new ApiError(413, 'Request too large.');
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new ApiError(400, 'Invalid JSON.'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '));
  return parsed.data;
}
export const privateJson = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
