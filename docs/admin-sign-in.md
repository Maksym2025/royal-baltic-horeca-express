# Administrator sign-in and Preview origins

These changes adapt patches 0001 and 0002 on top of `feat/admin-invitation`
(commit `a97831d`). They do not merge that branch into main or change accounts.

## Behavior

- `/admin/login` is the separate email/password entry point. Anonymous `/admin`
  requests redirect there; non-ADMIN users receive an explanation and can sign out.
- The database-backed `requireAdmin` check remains authoritative. No browser role
  or email address grants access. Unexpected backend failures remain errors.
- Activation links lead to `/admin/login` on the same deployment.
- The customer header is hidden only on `/admin` and `/admin/*`. Admin pages
  advertise `noindex, nofollow`; this is separate from access control.
- Sign-in and sign-out failures release the busy state and show an error.
  Successful sign-in/out uses a full navigation to clear cached protected views.
- The login form uses browser email validation, an accessible password visibility
  button, 44px or larger controls, a single-column phone layout and the existing
  Royal Baltic imagery and navy/gold identity. Global customer main padding is
  reset for the admin shell.

## Auth origins

`lib/auth-origins.ts` uses exact environment-provided origins. There is no
`*.vercel.app` wildcard and no trust based on the incoming Origin header.
Production retains `BETTER_AUTH_URL`. Only Vercel Preview uses Better Auth's
multi-host baseURL with exact `VERCEL_URL` and `VERCEL_BRANCH_URL`, so callbacks
stay on the host where sign-in began. Cookies remain host-only. This API is
available in Better Auth 1.7.5, pinned in package-lock.json.

Google Cloud must separately authorize the exact callback URL
`https://<preview-host>/api/auth/callback/google`. Prefer the stable branch URL
for Google testing rather than registering every deployment URL. Generating the
correct callback does not prove Google has authorized it. This PR does not change
provider settings, environment secrets, database roles or production auth settings.

## Existing accounts and invitations

The activation endpoint intentionally refuses users who are already verified or
have an auth account. Its “expired or already used” message can have more than one
cause. Inspect the specific user, credential and invitation before any repair.
Do not blindly set `ADMIN` or `email_verified` from the original patch README's
advice. An invitation does not automatically repair an existing account's password.

## Validation

- `npm run test:auth`: Better Auth integration using a disposable in-memory adapter;
  tests exact origin configuration, email/password sign-in, session reads,
  host-only cookies, OAuth callback host selection, rejected foreign origins and
  rejected wrong passwords. No external database or Google request is made.
- `tsc --noEmit` and full ESLint passed. The existing browser-only invitation
  fragment initialization has one documented local lint exception; its token
  handling is unchanged.
- `next build --webpack` passed with a dummy local database URL and dummy secret.
- HTTP checks on the production build passed for anonymous `/admin` redirect,
  login and forbidden notice rendering, noindex, missing customer header, password
  toggle markup and activation page rendering.
- Browser layout and interactive UI checks remain unverified: no Chromium was
  installed in this environment and its download failed. Do not treat CSS review
  as a visual or accessibility audit.
- Before release: test 320/390/768/1024/1440px layouts, email validation, password
  toggle, failed login/retry, admin and non-admin sessions, sign-out and real
  Google round trip on Preview. No production deployment or database change was
  performed during this review.
