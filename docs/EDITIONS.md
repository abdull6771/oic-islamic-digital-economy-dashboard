# Public and internal deployments

Both editions use the same application source and generated OIC dataset. Deploy
them as separate Vercel projects so their environment variables and domains stay
independent. The existing production project does not need to change while the
new editions are reviewed.

The preview implementation is on branch `feature/public-internal-landing` in
the sibling `oic-dei-landing-preview` checkout. The original
`oic-islamic-digital-economy-dashboard` checkout and its branch remain available.
The two editions were deployed as separate production projects on 13 November
2026. The original production project remains unchanged.

| Edition | Production URL | Access |
| --- | --- | --- |
| Public | https://oic-dei-public.vercel.app | Anonymous; seven Explore tools |
| Full internal | https://oic-dei-internal.vercel.app | Custom sign-in; all sixteen tools |

Both deployments were updated on 16 November 2026 from commit
`d39e02cd60f0bd28f7894c449e0e468cd46a10d4` on
`feature/kinan-user-admin`. The full deployment explicitly keeps
`INTERNAL_AUTH_MODE=shared`, so the existing login remains in use and individual
account administration is not active. The deployed dataset SHA-256 is
`3e1a8e5c81ba532fd8b7254253a2798464b7c73d414f6ce1442ba08cf4c3fb16`.
Their shared landing header reads **Digital Economy Index: OIC Countries 2025**,
with **Digital Economy Policy Toolkit** directly underneath.
The public "Register your interest" button opens an email to
`kinan@inceif.edu.my`, configured through the `CONTACT_EMAIL` build setting.
The login page's "Contact the toolkit administrator" link also opens
`mailto:kinan@inceif.edu.my`.
Both landing and dashboard footers use the supplied 2026 ISRA Institute report citation.
The Acknowledgements footer omits the Methodology, Data Sources and Contact links.
Its project description and disclaimer use the supplied MOF/IERIF/IsDB wording;
Research Team includes IsDB Technical Contributor Mr Syed Faiq Najeeb, and the
separate Authors section is removed. About INCEIF University is unchanged.
Earlier production verification passed nineteen checks covering anonymous public
access, internal login, secure cookies, protected assets, logout and matching data.
Both production module graphs passed the edition checks.

The internal production username is `inceif`. Its owner-chosen password and
independent session signing key are stored in Vercel's secret environment
variables, with a local recovery copy in the ignored `.env.deployed-full.local`
file. This file must not be committed or uploaded. The local full preview uses
the same login details in `.env.full.local`, with its own session signing key.
The login details were updated on 13 November 2026 without changing the
application code or dataset.

These first releases were deployed through the authenticated Vercel CLI from
isolated source directories. For future changes, publish both projects from
the same reviewed `feature/kinan-user-admin` source and dataset, keeping each
project's existing production environment variables and the full site's shared
mode until account activation is ready. Updating one project does not
automatically deploy the other. Do not deploy from the original checkout or
replace the original
production project when updating these two editions.

## Run and build each edition

Run these commands from the preview checkout:

| Command | Result |
| --- | --- |
| `npm run dev:public` | Public development site at `http://127.0.0.1:5181` |
| `npm run dev:full` | Password-protected full development site at `http://127.0.0.1:5182` |
| `npm run build:public` | Public production files in `dist-public/` |
| `npm run build:full` | Full production files in `dist-full/` |
| `npm run preview:public` | Serve the built public site at `http://127.0.0.1:5183` |
| `npm run preview:full` | Serve the built full site with the password guard at `http://127.0.0.1:5184` |
| `npm run build` | Build the edition selected by `SITE_EDITION` into `dist/` for Vercel |
| `npm run validate:editions` | Verify allowed routes, links and each edition's production module graph |
| `npm run validate:auth` | Verify the server access guard |

The default build uses `public` when no edition is selected. The explicit
`:public` and `:full` commands choose their named edition. An explicit
`SITE_EDITION` in the server environment or local environment file must agree
with that command; a conflicting server setting fails closed.

Both builds read `src/data/adei-dataset.json`. After a data refresh, rebuild
both editions to publish that update to both sites. The generated `edition.json`
records the edition and dataset fingerprint; preview refuses to serve a build
whose marker disagrees with the selected edition.

## Internal access

### Individual accounts and Kinan's admin dashboard

The account-management code is deployed on both projects from `d39e02c`, with
the internal deployment explicitly set to `INTERNAL_AUTH_MODE=shared`. The
existing full-site login continues to work; individual accounts and **Manage
users** remain inactive until email setup is complete.

The separate Supabase project **oic-dei-accounts** is connected at
`https://nodyweltrmxatgiivfrl.supabase.co`. Migration `202611160001` is applied
and recorded in migration history. Live read-only checks verified four tables
with row-level security and sixteen server-only functions, with no table or
function privileges for the anonymous or authenticated browser roles. The
internal Vercel project has its server URL and privileged server key configured;
the key remains in Vercel's private environment.

The Site URL and exact `/auth/confirm` redirect are applied, public signup is
disabled, and email confirmation is required. Kinan's identity is bound to a
pending administrator profile: email is not yet confirmed, password setup and
activation are pending, and no invitation email has been sent.

**Remaining setup:** INCEIF IT must provide the approved production SMTP
settings. On this project's Free plan with the default email provider, Supabase
rejected the custom invite/recovery templates with HTTP 400
`entitlement_required`; custom SMTP must be configured before those templates
can be applied. The required token-hash templates are already versioned below.
Keep shared mode active until SMTP, both templates and the email/password-setup
flow have been verified. No plan upgrade has been made.

With `INTERNAL_AUTH_MODE=supabase`, Kinan signs in with
`kinan@inceif.edu.my` and a password he sets himself. **Manage users** opens
`/admin/users`, where he can create member accounts, resend invitations, send
password resets, disable access and reactivate accounts. Members have their
own logins and cannot access admin pages or mutations. There is no public
self-registration or administrator role selector in the member-creation form.

Invited users follow an email link and set their own password; Kinan never
sees their stored password. Existing members can change their own password
after verifying their current password. Disabling or resetting an account
revokes its stored sessions, and re-enabling access does not restore old
cookies. Logout revokes the individual session in the database. Sessions last
eight hours; limited password-setup sessions last ten minutes. Account status,
current role and session validity are checked on every protected request.

The public edition returns 404 for admin, account, identity and email-confirmation
routes. The full edition's account mode has no fallback to the shared password
when its database or configuration is unavailable.

#### One-time Supabase setup

1. Create the separate, organization-owned Supabase project approved for these
   dashboard accounts. Apply
   `supabase/migrations/202611160001_toolkit_accounts.sql` to that new project.
   This transaction creates only the `toolkit_*` accounts, sessions, rate limits,
   audit tables and server-only functions. Browser roles have no direct access.
2. Disable public signups in Supabase Auth. Set its Site URL to
   `https://oic-dei-internal.vercel.app` and allow the exact redirect
   `https://oic-dei-internal.vercel.app/auth/confirm`.
3. Configure production SMTP and an approved sender. Supabase's built-in email
   service is for testing and restricts recipients; it is not sufficient for
   sending invitations to ordinary dashboard users. See the official
   [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).
4. Set the **Invite user** email link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` and the
   **Reset password** link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`.
   The confirmation page requires a deliberate POST before consuming the
   one-time token, so an email scanner opening the link does not use it up.
   Use these templates rather than the default fragment-token callback; see
   [email templates](https://supabase.com/docs/guides/auth/auth-email-templates).
5. Create Kinan's Auth identity at exactly `kinan@inceif.edu.my`, with no reuse
   of the old shared password. Record its immutable Auth UUID. With
   `SUPABASE_URL` and the server-only `SUPABASE_SECRET_KEY` in the process
   environment, run `npm run accounts:bootstrap -- --user-id <UUID>` to verify
   the target, then append `--apply` to create his pending administrator
   profile. This command sends no email and does not create or print a password.
   The pending profile can exist before email verification, but it cannot get
   toolkit access until Kinan proves email possession and sets his password.
6. On the internal Vercel project only, configure the following values and
   deploy the reviewed account-management branch. Activate this mode only
   after the migration, email templates, SMTP and pending Kinan profile exist.
   Arrange Kinan's initial invitation explicitly, then verify that he can
   complete setup, sign in, manage a test member and revoke that member's access.
   Remove the former `INTERNAL_SITE_USER` and `INTERNAL_SITE_PASSWORD` values
   after successful cutover; no shared-login fallback is needed in account mode.

The narrow, non-secret `supabase/config.toml` and the two HTML files in
`supabase/templates/` version the Auth settings and invitation/reset links above.
They declare no SMTP or unrelated service settings. Once INCEIF SMTP is
configured, run these commands from this branch's checkout root to review and
apply the declared settings and templates to `oic-dei-accounts`:

```sh
supabase config diff --remote=nodyweltrmxatgiivfrl
supabase config push --remote=nodyweltrmxatgiivfrl --yes
```

The local `project_id` is a name, not the hosted target; keep the explicit remote
reference. Production SMTP still requires separate configuration. Template keys
and variables follow the official [CLI config reference](https://supabase.com/docs/guides/local-development/cli/config)
and [email template guide](https://supabase.com/docs/guides/local-development/customizing-email-templates).

| Server environment variable | Account-mode value |
| --- | --- |
| `SITE_EDITION` | `full` |
| `INTERNAL_AUTH_MODE` | `supabase` |
| `SUPABASE_URL` | The new project's HTTPS origin |
| `SUPABASE_SECRET_KEY` | Supabase server secret key, or legacy `service_role` key |
| `INTERNAL_SESSION_SECRET` | Independent random secret of at least 32 characters |

Keep every privileged key server-side. Never use a publishable/anon key for
admin work or prefix these variables with `VITE_`. The app stores opaque cookie
hashes instead of raw session tokens. Its hash is bound to
`INTERNAL_SESSION_SECRET`, so rotating that secret invalidates account cookies.
Roles come from protected database records bound to Auth user IDs, never from
editable user metadata. Account changes are recorded in the audit table; no
passwords, email tokens or raw session cookies are recorded there.

Run `npm run validate:accounts` for HTTP, role, revocation, CSRF, invitation and
REST-adapter checks with synthetic accounts and fake delivery. These tests do
not contact Supabase or send messages. The migration has also been exercised
in isolated PostgreSQL-compatible engines. The production connection, schema
and pending administrator binding are verified. SMTP delivery and Kinan's actual
onboarding remain to be verified before switching to account mode.

### Existing shared login

The full edition has a branded sign-in screen at `/auth/login`. The server
checks the configured username and password before issuing an eight-hour
session cookie. The guard checks every path, including JavaScript assets and
API requests. A separate, unlisted URL by itself does not restrict access.

The sign-in form works without JavaScript. Its small client enhancement adds
password visibility and submit feedback. Credentials are checked only on the
server; the page never contains the configured password. The existing full
preview username and password in `.env.full.local` continue to work.

Configure these server environment variables on the internal Vercel project:

| Name | Value |
| --- | --- |
| `SITE_EDITION` | `full` |
| `INTERNAL_SITE_USER` | Your chosen username; defaults to `internal` |
| `INTERNAL_SITE_PASSWORD` | A long, unique password stored as a Vercel secret environment variable |
| `INTERNAL_SESSION_SECRET` | An independent, cryptographically random server signing secret of at least 32 characters; a 32-byte random value encoded as base64url is recommended |

For a separate Vercel project, use build command `npm run build` and output
directory `dist`. Its `SITE_EDITION=full` setting selects the full application
and creates its server build marker during that build. Use the same branch and
build settings on the public Vercel project, with `SITE_EDITION=public` instead.

Never prefix either secret with `VITE_`, put it in client code, or commit it to
Git. The session signing secret is required and must be independent of the
login password. It prevents the login page's public CSRF token from becoming a
way to test password guesses offline. Use HTTPS for the deployed internal domain. Sessions use a host-only,
HttpOnly, SameSite=Strict cookie with the Secure flag on HTTPS. Login requests
require a short-lived CSRF token and an exact same-origin Origin header.

The deployment middleware also checks a generated build-edition marker. A
missing marker, missing runtime edition, conflicting edition, or missing
internal password or session signing secret returns HTTP 503 without serving
the application.
Unauthenticated document requests redirect to the sign-in screen; protected
assets and APIs return HTTP 401. Incorrect credentials show a generic error on
the sign-in page. Authorized internal responses use private, no-store cache
headers and a noindex instruction.

Use **Sign out** to clear the browser session. The session also expires after
eight hours. Changing the server username, password or signing secret invalidates
sessions signed with the previous configuration. Sign out requires a same-origin POST;
visiting a link cannot sign the user out.

The marker is generated by the edition build, before Vercel packages the
middleware. Do not upload the full `dist` directory to an ordinary static host
without an equivalent server access guard: JavaScript alone cannot protect an
internal deployment.

## Public access

Set `SITE_EDITION=public` on the public Vercel project. The matching public
build permits anonymous access. The application also excludes restricted tool
routes and links from the public edition.

## Local checks

The Vite configuration installs the same guard before its development and
preview handlers. Public local previews need no password. A full local preview
requires `INTERNAL_SITE_PASSWORD` and `INTERNAL_SESSION_SECRET` in the server environment or an ignored local
environment file. Keep the local server bound to a loopback address.

The preview checkout includes an ignored `.env.full.local` containing only the
local full-edition settings and preview credentials. Do not reuse its temporary
password or signing secret for deployment. `.env.example` documents the available
settings and contains no real secrets. If creating your own full local
configuration, set `SITE_EDITION=full`, `INTERNAL_SITE_USER`,
`INTERNAL_SITE_PASSWORD` and `INTERNAL_SESSION_SECRET` in `.env.full.local`.
Public preview does not read this full-mode local file.

Vite loads these files on startup. Restart the local server after changing a
password, signing secret or edition setting. The server variables never enter the browser's
bundle; only the selected edition and contact address are defined for the
client.

Run `node scripts/validate-internal-auth.mjs` to check both editions, the login
form, CSRF and origin validation, signed sessions, cookie attributes, expiry,
password and signing-secret rotation, logout, denied paths, cache handling and
configuration failures. The tests create temporary secrets in memory and do
not print or save them.

## Deployment verification

After deploying the internal project, verify that an anonymous document request
to `/` redirects to the sign-in screen, and an actual `/assets/*.js` URL and
any API route return 401. Sign in and confirm the Home page and all tools open,
then sign out and confirm protected requests are denied again. Verify the same
public URLs work without credentials on the public project. Rotate the shared
password in the hosting environment and redeploy when access should be revoked.

Implementation follows the official [Vercel Routing Middleware JS reference](https://vercel.com/docs/routing-middleware/js-reference)
and [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).
