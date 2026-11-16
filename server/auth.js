import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { renderLoginPage } from "./login-page.js";

const EDITIONS = new Set(["public", "full"]);
const SESSION_SECONDS = 8 * 60 * 60;
const CSRF_SECONDS = 10 * 60;
const MAX_FORM_BYTES = 8192;
const PRIVATE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Vary: "Cookie, Origin",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
});
const PRIVATE_NAMES = new Set(Object.keys(PRIVATE_HEADERS).map((name) => name.toLowerCase()));
const hardeningApplied = Symbol("internal-response-hardening");
const digest = (value) => createHash("sha256").update(value, "utf8").digest();
const equal = (actual, expected) => timingSafeEqual(digest(actual), digest(expected));
export const internalResponseHeaders = () => ({ ...PRIVATE_HEADERS });

/** A return destination is always a local app URL, never an external address. */
export function sanitizeReturnTo(value) {
  if (typeof value !== "string" || value.length > 2048) return "/";
  let inspected = value;
  for (let count = 0; count < 3; count++) {
    if (!inspected.startsWith("/") || inspected.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(inspected)) return "/";
    try {
      const decoded = decodeURIComponent(inspected);
      if (decoded === inspected) break;
      inspected = decoded;
    } catch { return "/"; }
  }
  try {
    const target = new URL(inspected, "https://internal.invalid");
    if (target.origin !== "https://internal.invalid" || target.pathname === "/auth" || target.pathname.startsWith("/auth/")) return "/";
  } catch { return "/"; }
  const canonical = new URL(value, "https://internal.invalid");
  const destination = canonical.pathname + canonical.search + canonical.hash;
  if (destination.startsWith("//") || new URL(destination, "https://internal.invalid").origin !== "https://internal.invalid") return "/";
  return destination;
}

function cookieNames(url) {
  const prefix = url.protocol === "https:" ? "__Host-" : "";
  return { session: `${prefix}oic_session`, csrf: `${prefix}oic_login_csrf` };
}

function cookie(name, value, seconds, url) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${url.protocol === "https:" ? "; Secure" : ""}`;
}

function readCookie(request, name) {
  const header = request.headers.get("cookie");
  if (!header || header.length > 16384) return null;
  const matches = header.split(";").map((part) => part.trim()).filter((part) => part.startsWith(`${name}=`));
  if (matches.length !== 1) return null;
  return matches[0].slice(name.length + 1);
}

function signingKey(config) {
  return digest(`oic-toolkit-session-v1\0${config.sessionSecret}\0${config.username}\0${config.password}`);
}

function issueToken(type, config, seconds) {
  const issuedAt = Math.floor(config.now / 1000);
  const payload = Buffer.from(JSON.stringify({ type, subject: config.username, iat: issuedAt, exp: issuedAt + seconds, nonce: randomBytes(24).toString("base64url") })).toString("base64url");
  const signature = createHmac("sha256", signingKey(config)).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function validToken(token, type, config, lifetime) {
  if (typeof token !== "string" || token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [encoded, signature] = token.split(".");
  const expected = createHmac("sha256", signingKey(config)).update(encoded).digest("base64url");
  if (!equal(signature, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    const current = Math.floor(config.now / 1000);
    return payload.type === type && payload.subject === config.username && typeof payload.nonce === "string" && payload.nonce.length === 32
      && Number.isSafeInteger(payload.iat) && Number.isSafeInteger(payload.exp) && payload.iat <= current
      && payload.exp > current && payload.exp - payload.iat === lifetime;
  } catch { return false; }
}

function response(body, status, extra = {}) {
  return new Response(body, { status, headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8", ...extra } });
}
const redirect = (location) => response(null, 303, { Location: location });

function loginPage(request, config, { status = 200, error = "", username = "", returnTo = "/" } = {}) {
  const url = new URL(request.url);
  const nonce = randomBytes(18).toString("base64url");
  const csrfToken = issueToken("csrf", config, CSRF_SECONDS);
  const page = response(renderLoginPage({ csrfToken, returnTo: sanitizeReturnTo(returnTo), error, username, sessionHours: SESSION_SECONDS / 3600, nonce }), status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
    "X-Frame-Options": "DENY",
  });
  page.headers.append("Set-Cookie", cookie(cookieNames(url).csrf, csrfToken, CSRF_SECONDS, url));
  return page;
}

function sameOriginPost(request, url) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return origin === url.origin && (!fetchSite || fetchSite === "same-origin" || fetchSite === "none");
}

async function readForm(request) {
  if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get("content-type") || "")) return null;
  if (Number(request.headers.get("content-length")) > MAX_FORM_BYTES) return null;
  let length = 0;
  const chunks = [];
  try {
    const reader = request.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > MAX_FORM_BYTES) { await reader.cancel(); return null; }
        chunks.push(value);
      }
    }
    const form = new URLSearchParams(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (["username", "password", "csrfToken", "returnTo"].some((name) => form.getAll(name).length > 1)) return null;
    return form;
  } catch { return null; }
}

function documentRequest(request, url) {
  if (!["GET", "HEAD"].includes(request.method)) return false;
  if (url.pathname === "/" || url.pathname === "/index.html") return true;
  if (/^\/(?:assets|src|node_modules|server|api|@)/.test(url.pathname) || /\.[^/]+$/.test(url.pathname)) return false;
  return (request.headers.get("accept") || "").includes("text/html") || request.headers.get("sec-fetch-dest") === "document";
}

/** Shared by Vercel middleware and the local Vite server. Null authorizes next(). */
export async function handleInternalRequest(request, { buildEdition, siteEdition, username = "internal", password, sessionSecret, now = Date.now() } = {}) {
  if (!EDITIONS.has(buildEdition) || buildEdition !== siteEdition) return response("This site is temporarily unavailable. Please contact the site administrator.", 503);
  if (buildEdition === "public") return null;
  if (typeof username !== "string" || !username.trim() || username.length > 256 || /[:\u0000-\u001f\u007f]/.test(username)
    || typeof password !== "string" || !password.trim() || password.length > 2048 || /[\u0000-\u001f\u007f]/.test(password)
    || typeof sessionSecret !== "string" || sessionSecret.length < 32 || sessionSecret.length > 512 || !sessionSecret.trim() || /[\u0000-\u001f\u007f]/.test(sessionSecret) || !Number.isFinite(now)) {
    return response("This site is temporarily unavailable. Please contact the site administrator.", 503);
  }
  const config = { username, password, sessionSecret, now };
  const url = new URL(request.url);
  const names = cookieNames(url);
  const authenticated = validToken(readCookie(request, names.session), "session", config, SESSION_SECONDS);

  if (url.pathname === "/auth/login") {
    const returnTo = sanitizeReturnTo(url.searchParams.get("returnTo") || "/");
    if (request.method === "GET" || request.method === "HEAD") return authenticated ? redirect(returnTo) : loginPage(request, config, { returnTo });
    if (request.method !== "POST") return response("Method not allowed.", 405, { Allow: "GET, HEAD, POST" });
    if (!sameOriginPost(request, url)) return response("This sign-in request could not be verified. Please reload the sign-in page.", 403);
    const form = await readForm(request);
    if (!form) return loginPage(request, config, { status: 400, error: "Please reload this page and try signing in again.", returnTo });
    const destination = sanitizeReturnTo(form.get("returnTo") || "/");
    const csrfToken = form.get("csrfToken");
    const csrfCookie = readCookie(request, names.csrf);
    if (!csrfCookie || !csrfToken || !equal(csrfCookie, csrfToken) || !validToken(csrfToken, "csrf", config, CSRF_SECONDS)) {
      return loginPage(request, config, { status: 403, error: "Your sign-in page expired. Please try again.", returnTo: destination });
    }
    const submittedUser = form.get("username") || "";
    const submittedPassword = form.get("password") || "";
    const userMatches = equal(submittedUser, username);
    const passwordMatches = equal(submittedPassword, password);
    if (!userMatches || !passwordMatches) return loginPage(request, config, { status: 401, error: "The username or password is incorrect. Please try again.", username: submittedUser.slice(0, 256), returnTo: destination });
    const result = redirect(destination);
    result.headers.append("Set-Cookie", cookie(names.session, issueToken("session", config, SESSION_SECONDS), SESSION_SECONDS, url));
    result.headers.append("Set-Cookie", cookie(names.csrf, "", 0, url));
    return result;
  }

  if (url.pathname === "/auth/logout") {
    if (request.method !== "POST") return response("Method not allowed.", 405, { Allow: "POST" });
    if (!sameOriginPost(request, url)) return response("This sign-out request could not be verified.", 403);
    const result = redirect("/auth/login");
    result.headers.append("Set-Cookie", cookie(names.session, "", 0, url));
    result.headers.append("Set-Cookie", cookie(names.csrf, "", 0, url));
    return result;
  }

  if (authenticated) return null;
  if (documentRequest(request, url)) return redirect(`/auth/login?returnTo=${encodeURIComponent(sanitizeReturnTo(url.pathname + url.search))}`);
  return response("Sign in to access the internal toolkit.", 401);
}

/** Preserve private headers even when downstream static handlers enable caches. */
function protectNodeResponse(response) {
  if (response[hardeningApplied]) return;
  response[hardeningApplied] = true;
  const writeHead = response.writeHead;
  response.writeHead = function protectedWriteHead(statusCode, messageOrHeaders, extraHeaders) {
    const message = typeof messageOrHeaders === "string" ? messageOrHeaders : undefined;
    const supplied = message ? extraHeaders : messageOrHeaders;
    const entries = Array.isArray(supplied)
      ? Array.from({ length: supplied.length / 2 }, (_, index) => [supplied[index * 2], supplied[index * 2 + 1]])
      : Object.entries(supplied || {});
    const safe = Object.fromEntries(entries.filter(([name]) => !PRIVATE_NAMES.has(name.toLowerCase())));
    for (const [name, value] of Object.entries(PRIVATE_HEADERS)) this.setHeader(name, value);
    return message ? writeHead.call(this, statusCode, message, { ...safe, ...PRIVATE_HEADERS }) : writeHead.call(this, statusCode, { ...safe, ...PRIVATE_HEADERS });
  };
}

async function incomingForm(request) {
  let size = 0;
  const parts = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size <= MAX_FORM_BYTES) parts.push(chunk);
  }
  return size <= MAX_FORM_BYTES ? Buffer.concat(parts) : null;
}

/** Connect-compatible guard, installed before Vite's HTML and asset handlers. */
export function createInternalAuthMiddleware({ edition, env = process.env, requestHandler = handleInternalRequest } = {}) {
  return async function internalAuthMiddleware(request, response, next) {
    if (edition === "full") protectNodeResponse(response);
    try {
      const protocol = request.socket.encrypted ? "https" : "http";
      const url = new URL(request.url, `${protocol}://${request.headers.host || "127.0.0.1"}`);
      const method = request.method || "GET";
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) value.forEach((entry) => headers.append(name, entry));
        else if (value !== undefined) headers.set(name, value);
      }
      let body;
      if (edition === "full" && method === "POST" && (/^\/(?:auth|admin|account)(?:\/|$)/.test(url.pathname))) {
        if (Number(request.headers["content-length"]) > MAX_FORM_BYTES) {
          request.resume();
          response.writeHead(413);
          response.end("The sign-in request is too large.");
          return;
        }
        body = await incomingForm(request);
        if (body === null) { response.writeHead(413); response.end("The sign-in request is too large."); return; }
      }
      const decision = await requestHandler(new Request(url, { method, headers, ...(body ? { body } : {}) }), {
        buildEdition: edition, siteEdition: env.SITE_EDITION ?? edition,
        username: env.INTERNAL_SITE_USER ?? "internal", password: env.INTERNAL_SITE_PASSWORD,
        sessionSecret: env.INTERNAL_SESSION_SECRET,
        clientAddress: request.socket.remoteAddress || "unknown",
      });
      if (!decision) return next();
      if (edition !== "full") protectNodeResponse(response);
      response.statusCode = decision.status;
      for (const [name, value] of decision.headers) if (name !== "set-cookie") response.setHeader(name, value);
      const cookies = decision.headers.getSetCookie();
      if (cookies.length) response.setHeader("Set-Cookie", cookies);
      response.end(method === "HEAD" ? undefined : await decision.text());
    } catch {
      protectNodeResponse(response);
      response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("This site is temporarily unavailable. Please try again later.");
    }
  };
}
