import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { authOrigins } from "../lib/auth-origins.ts";

const env = {
  BETTER_AUTH_URL: "https://shop.example.com",
  VERCEL_ENV: "preview",
  VERCEL_URL: "shop-build.vercel.app",
  VERCEL_BRANCH_URL: "shop-git-feature.vercel.app",
  VERCEL_PROJECT_PRODUCTION_URL: "shop.example.com",
};

test("production retains its configured auth URL and only exact trusted origins", () => {
  const options = authOrigins({ ...env, VERCEL_ENV: "production" });
  assert.equal(options.baseURL, env.BETTER_AUTH_URL);
  assert.deepEqual(options.trustedOrigins, [
    "https://shop.example.com", "https://shop-build.vercel.app", "https://shop-git-feature.vercel.app",
  ]);
  assert.ok(options.trustedOrigins.every((origin) => !origin.includes("*")));
  assert.deepEqual(authOrigins({}), { baseURL: undefined, trustedOrigins: [] });
});

test("Preview accepts password sign-in and keeps OAuth callbacks on each exact preview host", async () => {
  const auth = betterAuth({
    ...authOrigins(env),
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    secret: "local-test-only-secret-with-at-least-32-characters",
    emailAndPassword: { enabled: true },
    socialProviders: { google: { clientId: "local-test-client", clientSecret: "local-test-secret" } },
    logger: { disabled: true },
  });
  const request = (host, endpoint, body, origin = `https://${host}`) =>
    auth.handler(new Request(`https://${host}/api/auth/${endpoint}`, {
      method: "POST", headers: { "content-type": "application/json", origin, host }, body: JSON.stringify(body),
    }));
  const credentials = { email: "admin-test@example.com", password: "test-only-password-123", name: "Test admin" };
  const signup = await request(env.VERCEL_BRANCH_URL, "sign-up/email", credentials);
  assert.equal(signup.status, 200, await signup.clone().text());
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
    const login = await request(host, "sign-in/email", credentials);
    assert.equal(login.status, 200, await login.clone().text());
    const cookies = login.headers.getSetCookie();
    assert.ok(cookies.some((cookie) => cookie.includes("session_token=")));
    assert.ok(cookies.every((cookie) => !/domain=/i.test(cookie)), "cookies must remain host-only");
    const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
    const session = await auth.api.getSession({ headers: new Headers({ host, cookie }) });
    assert.equal(session?.user.email, credentials.email);
    const oauth = await request(host, "sign-in/social", { provider: "google", callbackURL: "/admin" });
    assert.equal(oauth.status, 200, await oauth.clone().text());
    const { url } = await oauth.json();
    assert.equal(new URL(url).searchParams.get("redirect_uri"), `https://${host}/api/auth/callback/google`);
  }
  const denied = await request(env.VERCEL_URL, "sign-in/email", credentials, "https://attacker.example");
  assert.equal(denied.status, 403);
  const badPassword = await request(env.VERCEL_URL, "sign-in/email", { ...credentials, password: "wrong-password" });
  assert.equal(badPassword.status, 401);
});
