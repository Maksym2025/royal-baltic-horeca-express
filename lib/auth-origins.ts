type AuthEnvironment = Record<string, string | undefined>;

/** Use exact platform-provided hosts; never trust an arbitrary request Origin. */
export function authOrigins(env: AuthEnvironment) {
  const previewHosts = [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
    .filter((host): host is string => Boolean(host));
  const trustedOrigins = [...new Set([
    env.BETTER_AUTH_URL && new URL(env.BETTER_AUTH_URL).origin,
    ...previewHosts.map((host) => new URL(`https://${host}`).origin),
    env.VERCEL_PROJECT_PRODUCTION_URL && new URL(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`).origin,
  ].filter((origin): origin is string => Boolean(origin)))];

  return {
    // Preview callbacks stay on the host where sign-in started. Production keeps its configured URL.
    // Dynamic baseURL is supported by Better Auth 1.7.5, pinned in package-lock.json.
    baseURL: env.VERCEL_ENV === "preview" && previewHosts.length
      ? { allowedHosts: previewHosts, protocol: "https" as const }
      : env.BETTER_AUTH_URL,
    trustedOrigins,
  };
}
