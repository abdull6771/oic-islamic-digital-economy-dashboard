import { createHash, timingSafeEqual } from "node:crypto";

const EDITIONS = new Set(["public", "full"]);
const REALM = 'Basic realm="OIC internal toolkit", charset="UTF-8"';
const PRIVATE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Vary: "Authorization",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
});
const PRIVATE_NAMES = new Set(Object.keys(PRIVATE_HEADERS).map((name) => name.toLowerCase()));
const hardeningApplied = Symbol("internal-response-hardening");

const digest = (value) => createHash("sha256").update(value, "utf8").digest();
const equal = (actual, expected) => timingSafeEqual(digest(actual), digest(expected));

/** A malformed or oversized Authorization header is always an authentication failure. */
function credentialsFrom(header) {
  if (typeof header !== "string" || header.length > 8192) return null;
  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header);
  if (!match || match[1].length % 4 !== 0) return null;
  try {
    const bytes = Buffer.from(match[1], "base64");
    if (bytes.toString("base64") !== match[1]) return null;
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const colon = decoded.indexOf(":");
    if (colon < 1 || /[\u0000-\u001f\u007f]/.test(decoded)) return null;
    return { username: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
  } catch {
    return null;
  }
}

function unavailable() {
  return new Response("This site is temporarily unavailable. Please contact the site administrator.", {
    status: 503,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * The deployment must agree with its build marker. Missing or conflicting
 * settings never turn a full artifact into an anonymous public site.
 * Returns null only when the request may reach the site handler.
 */
export function checkInternalAccess(authorization, {
  buildEdition,
  siteEdition,
  username = "internal",
  password,
} = {}) {
  if (!EDITIONS.has(buildEdition) || !EDITIONS.has(siteEdition) || buildEdition !== siteEdition) {
    return unavailable();
  }
  if (buildEdition === "public") return null;

  if (typeof username !== "string" || !username.trim() || /[:\u0000-\u001f\u007f]/.test(username)
    || typeof password !== "string" || !password.trim() || /[\u0000-\u001f\u007f]/.test(password)) {
    return unavailable();
  }

  const supplied = credentialsFrom(authorization);
  if (supplied) {
    // Compare fixed-length hashes for both fields, without short-circuiting.
    const usernameMatches = equal(supplied.username, username);
    const passwordMatches = equal(supplied.password, password);
    if (usernameMatches && passwordMatches) return null;
  }
  return new Response("Authentication is required to access the internal toolkit.", {
    status: 401,
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "WWW-Authenticate": REALM,
    },
  });
}

export function internalResponseHeaders() {
  return { ...PRIVATE_HEADERS };
}

/** Keep full-edition assets private even if a downstream static handler sets cache headers. */
function protectNodeResponse(response) {
  if (response[hardeningApplied]) return;
  response[hardeningApplied] = true;
  const writeHead = response.writeHead;
  response.writeHead = function protectedWriteHead(statusCode, messageOrHeaders, extraHeaders) {
    for (const [name, value] of Object.entries(PRIVATE_HEADERS)) this.setHeader(name, value);
    const message = typeof messageOrHeaders === "string" ? messageOrHeaders : undefined;
    const supplied = message ? extraHeaders : messageOrHeaders;
    const entries = Array.isArray(supplied)
      ? Array.from({ length: supplied.length / 2 }, (_, index) => [supplied[index * 2], supplied[index * 2 + 1]])
      : Object.entries(supplied || {});
    const safeHeaders = Object.fromEntries(entries.filter(([name]) => !PRIVATE_NAMES.has(name.toLowerCase())));
    const finalHeaders = { ...safeHeaders, ...PRIVATE_HEADERS };
    return message
      ? writeHead.call(this, statusCode, message, finalHeaders)
      : writeHead.call(this, statusCode, finalHeaders);
  };
}

/**
 * Connect-compatible guard for Vite dev and preview servers. Install before
 * every other handler. `edition` is the trusted edition chosen by Vite config;
 * an explicit SITE_EDITION override must agree with it.
 */
export function createInternalAuthMiddleware({ edition, env = process.env } = {}) {
  return async function internalAuthMiddleware(request, response, next) {
    const decision = checkInternalAccess(request.headers.authorization, {
      buildEdition: edition,
      siteEdition: env.SITE_EDITION ?? edition,
      username: env.INTERNAL_SITE_USER ?? "internal",
      password: env.INTERNAL_SITE_PASSWORD,
    });
    if (edition === "full" || decision) protectNodeResponse(response);
    if (!decision) return next();
    response.statusCode = decision.status;
    for (const [name, value] of decision.headers) response.setHeader(name, value);
    response.end(request.method === "HEAD" ? undefined : await decision.text());
  };
}
