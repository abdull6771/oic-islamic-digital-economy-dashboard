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
`5f2ab710f7eae47c3bb7dd55ff364ea57fb1cf3f` on
`feature/public-internal-landing`. The deployed dataset SHA-256 is
`3e1a8e5c81ba532fd8b7254253a2798464b7c73d414f6ce1442ba08cf4c3fb16`.
Their shared landing header reads **Digital Economy Index: OIC Countries 2025**.
The public "Register your interest" button opens an email to
`kinan@inceif.edu.my`, configured through the `CONTACT_EMAIL` build setting.
The report citation has been removed from both landing and dashboard footers.
The Acknowledgements footer omits the Methodology, Data Sources and Contact links.
Its project description and disclaimer use the supplied MOF/IERIF/IsDB wording;
Research Team includes IsDB Technical Contributor Mr Syed Faiq Najeeb, and the
separate Authors section is removed. About INCEIF University is unchanged.
Live verification passed nineteen checks covering anonymous public access,
internal login, secure cookies, protected assets, logout and matching data.
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
this same branch and dataset, keeping each project's existing production
environment variables. Updating one project does not automatically deploy the
other. Do not deploy from the original checkout or replace the original
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
