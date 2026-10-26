import { createHash, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { database } from "@/lib/server/db";

export const runtime = "nodejs";
const reply = (message: string, status: number) =>
  Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return reply("Недопустимый источник запроса.", 403);
  if (Number(request.headers.get("content-length") || 0) > 4096)
    return reply("Запрос слишком большой.", 413);
  let body;
  try { body = await request.json(); } catch { return reply("Некорректный запрос.", 400); }
  const { token, password } = body || {};
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token) ||
      typeof password !== "string" || password.length < 12 || password.length > 128)
    return reply("Нужна действующая ссылка и пароль от 12 до 128 символов.", 400);
  const identifier = "admin-invite:" + createHash("sha256").update(token).digest("hex");
  try {
    const db = database();
    const pending = await db.execute(sql`SELECT id FROM verification WHERE identifier = ${identifier} AND expires_at > now() LIMIT 1`);
    if (!pending.rows.length) return reply("Ссылка истекла или уже использована.", 400);
    const passwordHash = await hashPassword(password);
    // The user row lock serializes concurrent activation. Consuming the invitation,
    // creating the credential and verifying/promoting the user are one SQL statement.
    const result = await db.execute(sql`
      WITH locked_user AS MATERIALIZED (
        SELECT u.id FROM "user" u
        JOIN verification v ON v.value = u.id
        WHERE v.identifier = ${identifier} AND v.expires_at > now()
          AND u.email_verified = false
          AND NOT EXISTS (SELECT 1 FROM account a WHERE a.user_id = u.id)
        FOR UPDATE OF u
      ), claimed AS (
        DELETE FROM verification v USING locked_user u
        WHERE v.identifier = ${identifier} AND v.value = u.id AND v.expires_at > now()
        RETURNING v.value
      ), credential AS (
        INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
        SELECT ${randomUUID()}, value, value, 'credential', ${passwordHash}, now(), now() FROM claimed
        RETURNING user_id
      )
      UPDATE "user" u SET email_verified = true, role = 'ADMIN', updated_at = now()
      FROM credential c WHERE u.id = c.user_id RETURNING u.id
    `);
    if (!result.rows.length) return reply("Ссылка истекла или уже использована.", 400);
    return reply("Почта подтверждена. Пароль создан, доступ администратора активирован.", 200);
  } catch {
    // Never log the invitation token, password, SQL parameters or credential hash.
    return reply("Не удалось активировать доступ. Попробуйте ещё раз.", 500);
  }
}
