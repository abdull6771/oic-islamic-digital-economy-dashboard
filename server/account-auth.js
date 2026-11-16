import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { internalResponseHeaders, sanitizeReturnTo } from "./auth.js";
import { renderLoginPage } from "./login-page.js";
import { renderAdminPage, renderConfirmPage, renderMessagePage, renderPasswordPage } from "./account-pages.js";

const SESSION_SECONDS = 8 * 60 * 60;
const SETUP_SECONDS = 10 * 60;
const CSRF_SECONDS = 10 * 60;
const MAX_BODY_BYTES = 8192;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@<>"\\]+@[^\s@<>"\\]+\.[^\s@<>"\\]+$/;
const SESSION_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const allowedMethods = (methods) => response("Method not allowed.", 405, { Allow: methods });
const hmac = (secret, value) => createHmac("sha256", secret).update(value).digest("hex");
const equal = (left, right) => typeof left === "string" && typeof right === "string" && timingSafeEqual(Buffer.from(hmac("account-compare", left)), Buffer.from(hmac("account-compare", right)));

/** The server secret binds database session hashes, so its rotation revokes cookies. */
export const hashAccountSessionToken = (token, secret) => hmac(secret, `toolkit-account-session-v1\0${token}`);

function response(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: { ...internalResponseHeaders(), "Content-Type": "text/plain; charset=utf-8", ...headers } });
}
const redirect = (destination) => response(null, 303, { Location: destination });
function page(renderer, options = {}, status = 200) {
  const nonce = randomBytes(18).toString("base64url");
  return response(renderer({ ...options, nonce }), status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
  });
}
function message(title, detail, status) {
  return page(renderMessagePage, { title, message: detail }, status);
}
function names(url) {
  const prefix = url.protocol === "https:" ? "__Host-" : "";
  return { session: `${prefix}oic_account_session`, csrf: `${prefix}oic_login_csrf`, legacy: `${prefix}oic_session` };
}
function cookie(name, value, seconds, url) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${url.protocol === "https:" ? "; Secure" : ""}`;
}
function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  if (header.length > 16384) return null;
  const found = header.split(";").map((part) => part.trim()).filter((part) => part.startsWith(`${name}=`));
  return found.length === 1 ? found[0].slice(name.length + 1) : null;
}
function sameOrigin(request, url) {
  const site = request.headers.get("sec-fetch-site");
  return request.headers.get("origin") === url.origin && (!site || site === "same-origin" || site === "none");
}
function documentRequest(request, url) {
  return ["GET", "HEAD"].includes(request.method) && (url.pathname === "/" || url.pathname === "/index.html" ||
    (!/^\/(?:assets|src|server|api|@|node_modules)/.test(url.pathname) && !/\.[^/]+$/.test(url.pathname) &&
      ((request.headers.get("accept") || "").includes("text/html") || request.headers.get("sec-fetch-dest") === "document")));
}
async function formData(request, fields) {
  if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get("content-type") || "") || Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return null;
  try {
    let size = 0;
    const parts = [];
    const reader = request.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BODY_BYTES) { await reader.cancel(); return null; }
        parts.push(value);
      }
    }
    const form = new URLSearchParams(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)));
    for (const key of form.keys()) if (!fields.includes(key) || form.getAll(key).length !== 1) return null;
    return form;
  } catch { return null; }
}
function signedCsrf(secret, now, context) {
  const payload = Buffer.from(JSON.stringify({ context, issued: Math.floor(now / 1000), nonce: randomBytes(24).toString("base64url") })).toString("base64url");
  return `${payload}.${hmac(secret, `toolkit-account-csrf-v1\0${payload}`)}`;
}
function validCsrf(token, context, secret, now) {
  if (typeof token !== "string" || token.length > 1024 || !/^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/.test(token)) return false;
  const [payload, signature] = token.split(".");
  if (!equal(signature, hmac(secret, `toolkit-account-csrf-v1\0${payload}`))) return false;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const time = Math.floor(now / 1000);
    return value.context === context && Number.isSafeInteger(value.issued) && value.issued <= time && time - value.issued < CSRF_SECONDS && /^[A-Za-z0-9_-]{32}$/.test(value.nonce);
  } catch { return false; }
}
function preauthPage(renderer, options, context, config, url, status = 200) {
  const csrfToken = signedCsrf(config.sessionSecret, config.now, context);
  const result = page(renderer, { ...options, csrfToken }, status);
  result.headers.append("Set-Cookie", cookie(names(url).csrf, csrfToken, CSRF_SECONDS, url));
  return result;
}
function preauthValid(request, form, context, config, url) {
  const token = form?.get("csrfToken");
  return token && equal(token, readCookie(request, names(url).csrf)) && validCsrf(token, context, config.sessionSecret, config.now);
}
const sessionCsrf = (token, secret) => hmac(secret, `toolkit-account-form-v1\0${token}`);
const publicUser = (session) => ({ id: session.userId, name: session.name, email: session.email, role: session.role });
const invalidForm = () => message("Please reload this page", "The form could not be verified. Reload the page and try again.", 400);
const invalidOrigin = () => message("Request could not be verified", "Please return to the website and try again.", 403);

async function takeLimit(config, action, identity = "", limit = 20, seconds = 900) {
  const key = hmac(config.sessionSecret, `toolkit-rate-v1\0${action}\0${config.clientAddress}\0${identity}`);
  return await config.store.consumeRateLimit(key, limit, seconds);
}
async function beginSession(config, userId, purpose, url, destination) {
  const token = randomBytes(32).toString("base64url");
  const seconds = purpose === "setup" ? SETUP_SECONDS : SESSION_SECONDS;
  const session = await config.store.createSession(userId, hashAccountSessionToken(token, config.sessionSecret), purpose, new Date(config.now + seconds * 1000).toISOString());
  if (!session) return null;
  const result = redirect(destination ?? "/");
  result.headers.append("Set-Cookie", cookie(names(url).session, token, seconds, url));
  result.headers.append("Set-Cookie", cookie(names(url).csrf, "", 0, url));
  result.headers.append("Set-Cookie", cookie(names(url).legacy, "", 0, url));
  return result;
}
function loginPage(config, url, options = {}, status = 200) {
  return preauthPage(renderLoginPage, { accountMode: true, returnTo: sanitizeReturnTo(url.searchParams.get("returnTo") || "/"), ...options }, "login", config, url, status);
}
const confirmInput = (hash, type) => typeof hash === "string" && /^[A-Za-z0-9_-]{20,256}$/.test(hash) && ["invite", "recovery"].includes(type);

async function handle(request, config) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const token = readCookie(request, names(url).session);
  const tokenHash = SESSION_TOKEN.test(token || "") ? hashAccountSessionToken(token, config.sessionSecret) : null;
  const session = tokenHash ? await config.store.getSession(tokenHash) : null;
  const active = session && session.status === "active" && ["admin", "member"].includes(session.role) &&
    ["full", "setup"].includes(session.purpose) && Date.parse(session.expiresAt) > config.now;
  const full = active && session.purpose === "full" && !session.requiresPasswordReset && Boolean(session.activatedAt);

  if (path === "/auth/logout") {
    if (method !== "POST") return allowedMethods("POST");
    if (!sameOrigin(request, url)) return invalidOrigin();
    if (tokenHash) await config.store.revokeSession(tokenHash);
    const result = redirect("/auth/login");
    for (const name of Object.values(names(url))) result.headers.append("Set-Cookie", cookie(name, "", 0, url));
    return result;
  }
  if (path === "/auth/login") {
    if (["GET", "HEAD"].includes(method)) {
      if (full) return redirect(sanitizeReturnTo(url.searchParams.get("returnTo") || "/"));
      if (active && session.purpose === "setup") return redirect("/account/password");
      return loginPage(config, url);
    }
    if (method !== "POST") return allowedMethods("GET, HEAD, POST");
    if (!sameOrigin(request, url)) return invalidOrigin();
    const form = await formData(request, ["csrfToken", "username", "password", "returnTo"]);
    if (!form) return invalidForm();
    if (!preauthValid(request, form, "login", config, url)) return loginPage(config, url, { error: "Your sign-in page expired. Please try again." }, 403);
    const email = (form.get("username") || "").trim().toLowerCase();
    const password = form.get("password") || "";
    const destination = sanitizeReturnTo(form.get("returnTo") || "/");
    if (!await takeLimit(config, "login-ip", "", 100) || !await takeLimit(config, "login-email", email, 15)) return message("Please try again later", "There have been too many sign-in attempts. Please wait before trying again.", 429);
    const identity = email.length <= 254 && EMAIL.test(email) && password.length > 0 && password.length <= 2048 ? await config.store.authenticate(email, password) : null;
    const signedIn = identity ? await beginSession(config, identity.id, "full", url, destination) : null;
    if (!signedIn) return loginPage(config, url, { error: "Unable to sign in with those details. Check your email and password, or contact Kinan for help.", username: email.slice(0, 254), returnTo: destination }, 401);
    if (tokenHash) await config.store.revokeSession(tokenHash);
    return signedIn;
  }
  if (path === "/auth/confirm") {
    if (["GET", "HEAD"].includes(method)) {
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      if (!confirmInput(tokenHash, type)) return message("This link is not valid", "Ask Kinan to send a new invitation or password-reset link.", 400);
      // A GET never consumes an OTP: email scanners cannot activate an account.
      return preauthPage(renderConfirmPage, { tokenHash, type }, "confirm", config, url);
    }
    if (method !== "POST") return allowedMethods("GET, HEAD, POST");
    if (!sameOrigin(request, url)) return invalidOrigin();
    const form = await formData(request, ["csrfToken", "tokenHash", "type"]);
    if (!form) return invalidForm();
    if (!preauthValid(request, form, "confirm", config, url)) return invalidOrigin();
    if (!confirmInput(form.get("tokenHash"), form.get("type"))) return invalidForm();
    if (!await takeLimit(config, "confirm", "", 20)) return message("Please try again later", "Too many attempts. Please wait before trying this link again.", 429);
    const identity = await config.store.verifyEmailToken(form.get("tokenHash"), form.get("type"));
    const signedIn = identity ? await beginSession(config, identity.id, "setup", url, "/account/password") : null;
    if (!signedIn) return message("This link has expired", "Ask Kinan to send a new invitation or password-reset link.", 401);
    if (tokenHash) await config.store.revokeSession(tokenHash);
    return signedIn;
  }

  if (!active) {
    if (path === "/admin" || path.startsWith("/admin/") || path === "/account/password" || documentRequest(request, url)) return redirect(`/auth/login?returnTo=${encodeURIComponent(sanitizeReturnTo(path + url.search))}`);
    return response("Sign in to access the internal toolkit.", 401);
  }
  const csrfToken = sessionCsrf(token, config.sessionSecret);
  if (path === "/account/password") {
    const setup = session.purpose === "setup";
    if (["GET", "HEAD"].includes(method)) return page(renderPasswordPage, { csrfToken, setup });
    if (method !== "POST") return allowedMethods("GET, HEAD, POST");
    if (!sameOrigin(request, url)) return invalidOrigin();
    const form = await formData(request, ["csrfToken", "password", "confirmPassword", "currentPassword"]);
    if (!form) return invalidForm();
    if (!equal(form.get("csrfToken"), csrfToken)) return invalidOrigin();
    const password = form.get("password") || "";
    if (password.length < 12 || password.length > 128 || /[\u0000\r\n]/.test(password) || password !== form.get("confirmPassword")) return page(renderPasswordPage, { csrfToken, setup, error: "Use a password of 12–128 characters and enter the same password in both fields." }, 400);
    if (!await takeLimit(config, "password", session.userId, 10, 900)) return message("Please try again later", "Too many attempts. Please wait before trying again.", 429);
    let passwordHash = tokenHash;
    if (!setup) {
      const identity = await config.store.authenticate(session.email, form.get("currentPassword") || "");
      if (!identity || identity.id !== session.userId) return page(renderPasswordPage, { csrfToken, setup, error: "Your current password could not be verified." }, 401);
      // Password RPCs require a limited setup capability. For a signed-in user
      // it is created only after reauthentication and is never sent to a browser.
      passwordHash = hashAccountSessionToken(randomBytes(32).toString("base64url"), config.sessionSecret);
      const capability = await config.store.createSession(session.userId, passwordHash, "setup", new Date(config.now + SETUP_SECONDS * 1000).toISOString());
      if (!capability) return message("Password change is unavailable", "Please sign in again before changing your password.", 401);
    }
    try { await config.store.setPassword(passwordHash, password); }
    finally {
      if (!setup) {
        try { await config.store.revokeSession(passwordHash); }
        catch { /* The unexposed limited capability expires after ten minutes. */ }
      }
    }
    const signedIn = await beginSession(config, session.userId, "full", url, session.role === "admin" ? "/admin/users" : "/");
    if (!signedIn) return message("Password updated", "Please sign in again with your new password.", 503);
    return signedIn;
  }
  if (!full) {
    if (path === "/admin" || path.startsWith("/admin/")) return response("Administrator access is required.", 403);
    return documentRequest(request, url) ? redirect("/account/password") : response("Finish setting your password to access the toolkit.", 401);
  }
  if (path === "/auth/me") {
    if (!["GET", "HEAD"].includes(method)) return allowedMethods("GET, HEAD");
    return response(JSON.stringify({ mode: "supabase", user: publicUser(session) }), 200, { "Content-Type": "application/json; charset=utf-8" });
  }
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (session.role !== "admin") return response("Administrator access is required.", 403);
    if (path === "/admin") return ["GET", "HEAD"].includes(method) ? redirect("/admin/users") : allowedMethods("GET, HEAD");
    const requestedPage = url.searchParams.get("page") || "1";
    const currentPage = /^\d{1,4}$/.test(requestedPage) && Number(requestedPage) > 0 ? Number(requestedPage) : 1;
    async function adminPage(options = {}, status = 200) {
      const { users, hasNext } = await config.store.listUsers(tokenHash, { page: currentPage, perPage: 25 });
      return page(renderAdminPage, { viewer: publicUser(session), users, page: currentPage, hasNext, csrfToken, ...options }, status);
    }
    if (path === "/admin/users" && ["GET", "HEAD"].includes(method)) return adminPage();
    const actions = ["/admin/users/create", "/admin/users/invite", "/admin/users/reset", "/admin/users/status"];
    if (!actions.includes(path)) return response("Not found.", 404);
    if (method !== "POST") return allowedMethods("POST");
    if (!sameOrigin(request, url)) return invalidOrigin();
    const fields = path.endsWith("/create") ? ["csrfToken", "name", "email"] : path.endsWith("/status") ? ["csrfToken", "userId", "status"] : ["csrfToken", "userId"];
    const form = await formData(request, fields);
    if (!form) return invalidForm();
    if (!equal(form.get("csrfToken"), csrfToken)) return invalidOrigin();
    if (!await takeLimit(config, "admin-mutation", session.userId, 30, 300)) return message("Please try again later", "Too many account changes. Please wait before trying again.", 429);
    const redirectTo = new URL("/auth/confirm", url).href;
    if (path.endsWith("/create")) {
      const name = (form.get("name") || "").trim();
      const email = (form.get("email") || "").trim().toLowerCase();
      if (!name || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name) || email.length > 254 || !EMAIL.test(email)) return adminPage({ error: "Enter a name and a valid email address." }, 400);
      const user = await config.store.createUser(tokenHash, { name, email });
      try { await config.store.sendInvite(tokenHash, user.id, redirectTo); }
      catch { return adminPage({ error: "The account was created, but its invitation could not be sent. Check email delivery and use Resend invitation." }, 502); }
      return adminPage({ notice: "Account created and invitation sent. The user can now set their own password." });
    }
    const userId = form.get("userId") || "";
    if (!UUID.test(userId)) return invalidForm();
    if (path.endsWith("/invite")) {
      await config.store.sendInvite(tokenHash, userId, redirectTo);
      return adminPage({ notice: "A new account-setup email has been sent." });
    }
    if (path.endsWith("/reset")) {
      await config.store.resetPassword(tokenHash, userId, redirectTo);
      // A reset can revoke the acting administrator's session too.
      if (userId === session.userId) return redirect("/auth/login");
      return adminPage({ notice: "A password-reset link has been sent and the user's previous sessions have ended." });
    }
    const status = form.get("status");
    if (!["active", "disabled"].includes(status)) return invalidForm();
    if (userId === session.userId && status === "disabled") return adminPage({ error: "You cannot disable your own administrator account." }, 400);
    await config.store.setAccountStatus(tokenHash, userId, status);
    return adminPage({ notice: status === "disabled" ? "Access disabled. The user's sessions have ended." : "Access enabled. The user can sign in again." });
  }
  if (path.startsWith("/account/") || path === "/account" || path.startsWith("/auth/")) return response("Not found.", 404);
  return null;
}

/** Account mode never falls back to the former shared password on failure. */
export async function handleAccountRequest(request, { sessionSecret, store, now = Date.now(), clientAddress = "unknown" } = {}) {
  if (typeof sessionSecret !== "string" || !sessionSecret.trim() || sessionSecret.length < 32 || sessionSecret.length > 512 || /[\u0000-\u001f\u007f]/.test(sessionSecret) || !store || !Number.isFinite(now)) return message("Account access is unavailable", "Please contact Kinan for help signing in.", 503);
  let result;
  try {
    result = await handle(request, { sessionSecret, store, now, clientAddress: String(clientAddress).slice(0, 256) });
  } catch (error) {
    const status = [400, 401, 403, 404, 409, 429].includes(error?.status) ? error.status : 503;
    const details = status === 409 ? "That account already exists or another account change is in progress. Reload the users page before trying again." : status === 403 ? "You do not have permission to make this account change." : status === 404 ? "That account could not be found." : status === 400 ? "The account change could not be accepted. Check the details and try again." : status === 429 ? "Too many requests. Please wait before trying again." : "The account service is temporarily unavailable. Please try again later.";
    result = message("Account request could not be completed", details, status);
  }
  return result && request.method === "HEAD" ? new Response(null, { status: result.status, headers: result.headers }) : result;
}
