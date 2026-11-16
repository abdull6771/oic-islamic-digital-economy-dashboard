/** Account authentication is exercised against a fake durable store; no external service is called. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { handleAccountRequest, hashAccountSessionToken } from "../server/account-auth.js";
import { handleInternalRequest, createInternalAuthMiddleware } from "../server/request-handler.js";
import { createAccountStore, AccountStoreError } from "../server/account-store.js";

const BASE = "https://internal.example.test";
const IDS = {
  admin: "11111111-1111-4111-8111-111111111111",
  member: "22222222-2222-4222-8222-222222222222",
  pending: "33333333-3333-4333-8333-333333333333",
  disabled: "44444444-4444-4444-8444-444444444444",
  escaped: "55555555-5555-4555-8555-555555555555",
};
const clone = (value) => structuredClone(value);
function storeError(code, status) { return Object.assign(new Error("Fixture store error"), { code, status }); }
const decodeHtml = (text) => text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
function hidden(html, name) {
  const tag = (html.match(/<input\b[^>]*>/g) || []).find((input) => input.includes(`name="${name}"`));
  const value = tag?.match(/\bvalue="([^"]*)"/)?.[1];
  assert.ok(value !== undefined, `Rendered form needs ${name}`);
  return decodeHtml(value);
}
function pairs(response) { return response.headers.getSetCookie().map((value) => value.split(";", 1)[0]); }
function cookieValue(response, name = "__Host-oic_account_session") { return pairs(response).find((pair) => pair.startsWith(`${name}=`))?.slice(name.length + 1); }
function cookieHeader(response) { return pairs(response).filter((pair) => pair.slice(pair.indexOf("=") + 1)).join("; "); }
function mergeCookies(existing, response) {
  const jar = new Map(existing.split(";").map((part) => part.trim()).filter(Boolean).map((pair) => [pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1)]));
  for (const pair of pairs(response)) {
    const at = pair.indexOf("=");
    const name = pair.slice(0, at), value = pair.slice(at + 1);
    if (value) jar.set(name, value); else jar.delete(name);
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}
function fixture() {
  const now = Date.now();
  const sessionSecret = randomBytes(32).toString("base64url");
  const password = randomBytes(24).toString("base64url");
  const users = new Map([
    [IDS.admin, { id: IDS.admin, email: "admin@example.test", name: "Fixture Administrator", role: "admin", status: "active", requiresPasswordReset: false, activatedAt: new Date(now - 86400000).toISOString() }],
    [IDS.member, { id: IDS.member, email: "member@example.test", name: "Fixture Member", role: "member", status: "active", requiresPasswordReset: false, activatedAt: new Date(now - 86400000).toISOString() }],
    [IDS.pending, { id: IDS.pending, email: "pending@example.test", name: "Pending Member", role: "member", status: "active", requiresPasswordReset: true, activatedAt: null }],
    [IDS.disabled, { id: IDS.disabled, email: "disabled@example.test", name: "Disabled Member", role: "member", status: "disabled", requiresPasswordReset: false, activatedAt: new Date(now - 86400000).toISOString() }],
    [IDS.escaped, { id: IDS.escaped, email: "escaped@example.test", name: '<img src=x onerror=alert(1)>', role: "member", status: "active", requiresPasswordReset: false, activatedAt: new Date(now - 86400000).toISOString() }],
  ]);
  const passwords = new Map([...users.keys()].map((id) => [id, password]));
  const sessions = new Map();
  const tokens = new Map();
  const calls = [];
  const emails = [];
  const flags = { denyRateLimit: false, rateUnavailable: false, sessionUnavailable: false };
  const record = (method, fields = {}) => calls.push({ method, ...fields });
  const profileSession = (record) => {
    const user = users.get(record.userId);
    return user ? { ...clone(record), ...clone(user), id: record.id, userId: user.id } : null;
  };
  const getSession = async (hash) => {
    record("getSession");
    if (flags.sessionUnavailable) throw storeError("BACKEND_UNAVAILABLE", 503);
    const session = sessions.get(hash);
    const user = session && users.get(session.userId);
    if (!session || !user || user.status !== "active" || Date.parse(session.expiresAt) <= now) return null;
    return profileSession(session);
  };
  const requireAdmin = async (hash) => {
    const actor = await getSession(hash);
    if (!actor || actor.role !== "admin" || actor.purpose !== "full") throw storeError("NOT_AUTHORIZED", 403);
    return actor;
  };
  const revokeUser = (userId) => {
    for (const [hash, session] of sessions) if (session.userId === userId) sessions.delete(hash);
  };
  const store = {
    async authenticate(email, submittedPassword) {
      record("authenticate");
      const user = [...users.values()].find((item) => item.email === email.toLowerCase());
      return user && passwords.get(user.id) === submittedPassword ? { id: user.id, email: user.email } : null;
    },
    async verifyEmailToken(tokenHash, type) {
      record("verifyEmailToken", { type });
      const key = `${type}:${tokenHash}`;
      const userId = tokens.get(key);
      if (!userId) return null;
      tokens.delete(key);
      const user = users.get(userId);
      return user ? { id: user.id, email: user.email } : null;
    },
    getSession,
    async createSession(userId, tokenHash, purpose, expiresAt) {
      record("createSession", { userId, tokenHash, purpose });
      assert.match(tokenHash, /^[a-f0-9]{64}$/i);
      const user = users.get(userId);
      if (!user || user.status !== "active") return null;
      const session = { id: randomUUID(), userId, purpose, expiresAt: new Date(expiresAt).toISOString() };
      sessions.set(tokenHash, session);
      return profileSession(session);
    },
    async revokeSession(hash) { record("revokeSession", { hash }); sessions.delete(hash); },
    async listUsers(actorHash, { page, perPage }) {
      await requireAdmin(actorHash);
      record("listUsers", { page, perPage });
      const ordered = [...users.values()].sort((a, b) => a.email.localeCompare(b.email));
      const start = (page - 1) * perPage;
      return { users: clone(ordered.slice(start, start + perPage)), hasNext: start + perPage < ordered.length };
    },
    async createUser(actorHash, { email, name }) {
      await requireAdmin(actorHash);
      record("createUser", { email, name });
      if ([...users.values()].some((user) => user.email === email)) throw storeError("USER_EXISTS", 409);
      const user = { id: randomUUID(), email, name, role: "member", status: "active", requiresPasswordReset: true, activatedAt: null };
      users.set(user.id, user);
      return clone(user);
    },
    async sendInvite(actorHash, userId, redirectTo) {
      await requireAdmin(actorHash);
      record("sendInvite", { userId });
      const user = users.get(userId);
      if (!user) throw storeError("USER_NOT_FOUND", 404);
      emails.push({ type: "invite", userId, redirectTo });
    },
    async resetPassword(actorHash, userId, redirectTo) {
      await requireAdmin(actorHash);
      record("resetPassword", { userId });
      const user = users.get(userId);
      if (!user) throw storeError("USER_NOT_FOUND", 404);
      user.requiresPasswordReset = true;
      revokeUser(userId);
      emails.push({ type: "recovery", userId, redirectTo });
    },
    async setAccountStatus(actorHash, userId, status) {
      const actor = await requireAdmin(actorHash);
      record("setAccountStatus", { userId, status });
      if (actor.userId === userId && status === "disabled") throw storeError("SELF_DISABLE", 400);
      const user = users.get(userId);
      if (!user) throw storeError("USER_NOT_FOUND", 404);
      user.status = status;
      if (status === "disabled") revokeUser(userId);
    },
    async setPassword(tokenHash, newPassword) {
      const actor = await getSession(tokenHash);
      if (!actor) throw storeError("NOT_AUTHENTICATED", 401);
      if (actor.purpose !== "setup") throw storeError("NOT_AUTHORIZED", 403);
      record("setPassword", { userId: actor.userId, tokenHash, purpose: actor.purpose });
      passwords.set(actor.userId, newPassword);
      const user = users.get(actor.userId);
      user.requiresPasswordReset = false;
      user.activatedAt ||= new Date(now).toISOString();
      revokeUser(actor.userId);
      return clone(user);
    },
    async consumeRateLimit(key, limit, windowSeconds) {
      record("consumeRateLimit", { limit, windowSeconds });
      assert.ok(typeof key === "string" && key && Number.isInteger(limit) && limit > 0 && Number.isInteger(windowSeconds) && windowSeconds > 0);
      if (flags.rateUnavailable) throw storeError("BACKEND_UNAVAILABLE", 503);
      return !flags.denyRateLimit;
    },
  };
  const options = { sessionSecret, store, now, clientAddress: "fixture-client" };
  async function call(path, { origin = BASE, method = "GET", headers = {}, form, cookie, rawBody, override = {}, wrapper = false } = {}) {
    const requestHeaders = new Headers(headers);
    if (cookie) requestHeaders.set("Cookie", cookie);
    if (form !== undefined) requestHeaders.set("Content-Type", "application/x-www-form-urlencoded");
    const request = new Request(new URL(path, origin), { method, headers: requestHeaders,
      ...((form !== undefined || rawBody !== undefined) ? { body: form !== undefined ? new URLSearchParams(form).toString() : rawBody } : {}) });
    return wrapper
      ? handleInternalRequest(request, { buildEdition: "full", siteEdition: "full", authMode: "supabase", supabaseUrl: "https://fixture.supabase.co", supabaseSecretKey: "test-only-service-key", ...options, ...override })
      : handleAccountRequest(request, { ...options, ...override });
  }
  return { now, password, sessionSecret, users, passwords, sessions, tokens, calls, emails, flags, store, options, call };
}
async function loginForm(f, { origin = BASE, returnTo = "/" } = {}) {
  const response = await f.call(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`, { origin });
  assert.equal(response.status, 200);
  const html = await response.text();
  return { csrfToken: hidden(html, "csrfToken"), returnTo: hidden(html, "returnTo"), cookie: cookieHeader(response), html, response };
}
async function signIn(f, user = IDS.member, { origin = BASE, password = f.password, extra = {} } = {}) {
  const state = await loginForm(f, { origin });
  const response = await f.call("/auth/login", { origin, method: "POST", headers: { Origin: origin }, cookie: state.cookie,
    form: { username: f.users.get(user).email, password, csrfToken: state.csrfToken, returnTo: state.returnTo, ...extra } });
  assert.equal(response.status, 303);
  const value = cookieValue(response, origin.startsWith("https:") ? "__Host-oic_account_session" : "oic_account_session");
  assert.ok(value, "Individual login must issue an account session");
  return { response, cookie: cookieHeader(response), token: value, hash: hashAccountSessionToken(value, f.sessionSecret) };
}
async function formFor(f, path, actor) {
  const response = await f.call(path, { cookie: actor.cookie, headers: { Accept: "text/html" } });
  assert.equal(response.status, 200);
  const html = await response.text();
  return { csrfToken: hidden(html, "csrfToken"), cookie: mergeCookies(actor.cookie, response), html };
}
async function adminPost(f, path, actor, fields) {
  const state = await formFor(f, "/admin/users", actor);
  return f.call(path, { method: "POST", headers: { Origin: BASE }, cookie: state.cookie, form: { csrfToken: state.csrfToken, ...fields } });
}
async function confirmToken(f, userId, type = "invite") {
  const hash = randomBytes(32).toString("hex");
  f.tokens.set(`${type}:${hash}`, userId);
  const response = await f.call(`/auth/confirm?token_hash=${hash}&type=${type}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const result = await f.call("/auth/confirm", { method: "POST", headers: { Origin: BASE }, cookie: cookieHeader(response),
    form: { csrfToken: hidden(html, "csrfToken"), tokenHash: hidden(html, "tokenHash"), type: hidden(html, "type") } });
  return { response: result, hash, formResponse: response };
}
let count = 0;
async function check(name, run) { const f = fixture(); await run(f); count++; console.log(`PASS ${name}`); }

await check("public builds reject account and administrator routes without invoking a backend", async (f) => {
  for (const path of ["/admin/users", "/admin/users/create", "/account/password", "/auth/me", "/auth/confirm"]) {
    const response = await f.call(path, { wrapper: true, override: { buildEdition: "public", siteEdition: "public" } });
    assert.equal(response.status, 404, path);
  }
  assert.equal(await f.call("/", { wrapper: true, override: { buildEdition: "public", siteEdition: "public" } }), null);
  assert.equal(f.calls.length, 0);
});
await check("unknown or incomplete account-mode settings fail closed", async (f) => {
  for (const override of [{ authMode: "administrator" }, { siteEdition: "public" }, { sessionSecret: undefined }, { sessionSecret: "too-short" }, { store: undefined, supabaseUrl: undefined }, { store: undefined, supabaseSecretKey: undefined }]) {
    assert.equal((await f.call("/auth/login", { wrapper: true, override })).status, 503);
  }
});
await check("shared-password mode still signs in while keeping administrator and account routes unavailable", async (f) => {
  const override = { authMode: "shared", username: "internal", password: f.password };
  const first = await f.call("/auth/login", { wrapper: true, override });
  assert.equal(first.status, 200);
  const html = await first.text();
  const response = await f.call("/auth/login", { wrapper: true, override, method: "POST", headers: { Origin: BASE }, cookie: cookieHeader(first),
    form: { csrfToken: hidden(html, "csrfToken"), username: "internal", password: f.password, returnTo: "/" } });
  assert.equal(response.status, 303);
  const cookie = cookieHeader(response);
  const metadata = await f.call("/auth/me", { wrapper: true, override, cookie });
  assert.equal(metadata.status, 200);
  assert.equal((await metadata.json()).mode, "shared");
  for (const path of ["/admin/users", "/account/password", "/auth/confirm"]) assert.equal((await f.call(path, { wrapper: true, override, cookie })).status, 404);
  assert.equal(f.calls.length, 0);
});
await check("individual sign-in creates an opaque server-stored session with secure cookie attributes", async (f) => {
  const actor = await signIn(f);
  const cookie = actor.response.headers.getSetCookie().find((value) => value.startsWith("__Host-oic_account_session="));
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.match(cookie, /;\s*Secure/i);
  assert.match(cookie, /Path=\//i);
  assert.ok(!/Domain=/i.test(cookie));
  for (const secret of [f.password, f.sessionSecret, IDS.member, "member@example.test"]) assert.ok(!actor.token.includes(secret));
  assert.ok(f.sessions.has(actor.hash));
  assert.ok(!f.sessions.has(actor.token));
  assert.equal(await f.call("/assets/private.js", { cookie: actor.cookie }), null);
});
await check("loopback HTTP uses the non-Secure local session cookie", async (f) => {
  const actor = await signIn(f, IDS.member, { origin: "http://127.0.0.1:9876" });
  const cookie = actor.response.headers.getSetCookie().find((value) => value.startsWith("oic_account_session="));
  assert.ok(cookie && !/;\s*Secure/i.test(cookie));
  assert.match(cookie, /HttpOnly/i);
});
await check("invalid credentials and disabled accounts never receive a full session", async (f) => {
  for (const [id, password] of [[IDS.member, "wrong-password"], [IDS.disabled, f.password]]) {
    const state = await loginForm(f);
    const response = await f.call("/auth/login", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie,
      form: { username: f.users.get(id).email, password, csrfToken: state.csrfToken, returnTo: "/" } });
    assert.ok([401, 403].includes(response.status));
    assert.ok(!cookieValue(response));
    assert.ok(!(await response.text()).includes(f.password));
  }
});
await check("unauthenticated requests cannot retrieve app assets or account metadata", async (f) => {
  assert.equal((await f.call("/", { headers: { Accept: "text/html" } })).status, 303);
  for (const path of ["/assets/app.js", "/src/App.jsx", "/auth/me"]) assert.equal((await f.call(path)).status, 401, path);
  const forged = Buffer.from(JSON.stringify({ userId: IDS.admin, role: "admin" })).toString("base64url");
  assert.equal((await f.call("/admin/users", { cookie: `__Host-oic_account_session=${forged}` })).status, 303);
});
await check("account metadata derives identity and role from the durable session", async (f) => {
  const actor = await signIn(f, IDS.admin);
  const response = await f.call("/auth/me", { cookie: actor.cookie });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.mode, "supabase");
  assert.equal(payload.user.id, IDS.admin);
  assert.equal(payload.user.role, "admin");
  for (const privateValue of [actor.token, f.password, f.sessionSecret]) assert.ok(!JSON.stringify(payload).includes(privateValue));
  assert.match(response.headers.get("cache-control"), /no-store/);
});
await check("members cannot list or change users even with forged administrator form fields", async (f) => {
  const actor = await signIn(f);
  assert.equal((await f.call("/admin/users", { cookie: actor.cookie })).status, 403);
  const state = await formFor(f, "/account/password", actor);
  for (const path of ["create", "invite", "reset", "status"]) {
    const response = await f.call(`/admin/users/${path}`, { method: "POST", headers: { Origin: BASE }, cookie: state.cookie,
      form: { csrfToken: state.csrfToken, role: "admin", userId: IDS.admin, name: "Forged administrator", email: "forged@example.test", status: "disabled" } });
    assert.equal(response.status, 403, path);
  }
  assert.ok(!f.calls.some(({ method }) => ["listUsers", "createUser", "sendInvite", "resetPassword", "setAccountStatus"].includes(method)));
});
await check("administrator pages escape stored names and use bounded pagination", async (f) => {
  const actor = await signIn(f, IDS.admin);
  const state = await formFor(f, "/admin/users", actor);
  assert.ok(!state.html.includes('<img src=x onerror=alert(1)>'));
  assert.ok(state.html.includes("&lt;img"));
  assert.ok(state.html.includes("Resend invitation"));
  assert.match(state.html, /reset link/i);
  const response = await f.call("/admin/users?page=2&perPage=10000", { cookie: actor.cookie });
  assert.equal(response.status, 200);
  const requested = f.calls.filter(({ method }) => method === "listUsers").at(-1);
  assert.equal(requested.page, 2);
  assert.ok(requested.perPage > 0 && requested.perPage <= 100);
});
await check("administrator creation rejects invalid forms and privilege mass assignment before any email", async (f) => {
  const actor = await signIn(f, IDS.admin);
  for (const fields of [{ name: "", email: "new@example.test" }, { name: "New Member", email: "invalid-email" }, { name: "New Member", email: "new@example.test", role: "admin" }]) {
    assert.equal((await adminPost(f, "/admin/users/create", actor, fields)).status, 400);
  }
  assert.equal(f.emails.length, 0);
  assert.ok(!f.calls.some(({ method }) => method === "createUser"));
});
await check("an administrator creates only a member and sends one invitation through the store", async (f) => {
  const actor = await signIn(f, IDS.admin);
  const result = await adminPost(f, "/admin/users/create", actor, { name: "New Member", email: "new@example.test" });
  assert.ok([200, 303].includes(result.status));
  const created = [...f.users.values()].find((user) => user.email === "new@example.test");
  assert.ok(created);
  assert.equal(created.role, "member");
  assert.equal(created.requiresPasswordReset, true);
  assert.equal(f.emails.length, 1);
  assert.equal(f.emails[0].type, "invite");
  assert.equal(new URL(f.emails[0].redirectTo).origin, BASE);
});
await check("administrator actions require same-origin session-bound CSRF and valid user identifiers", async (f) => {
  const actor = await signIn(f, IDS.admin);
  const state = await formFor(f, "/admin/users", actor);
  for (const headers of [{}, { Origin: "https://attacker.example" }]) {
    const response = await f.call("/admin/users/create", { method: "POST", headers, cookie: state.cookie,
      form: { csrfToken: state.csrfToken, name: "New Member", email: "new@example.test" } });
    assert.equal(response.status, 403);
  }
  assert.equal((await f.call("/admin/users/create", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie,
    form: { csrfToken: state.csrfToken + "x", name: "New Member", email: "new@example.test" } })).status, 403);
  for (const action of ["invite", "reset", "status"]) assert.equal((await adminPost(f, `/admin/users/${action}`, actor, { userId: "not-a-uuid", ...(action === "status" ? { status: "disabled" } : {}) })).status, 400);
  assert.equal(f.emails.length, 0);
  assert.ok(!f.calls.some(({ method }) => ["createUser", "sendInvite", "resetPassword", "setAccountStatus"].includes(method)));
});
await check("account login and confirmation reject cross-origin, expired and wrong-purpose preauth tokens", async (f) => {
  const state = await loginForm(f);
  const form = { username: "member@example.test", password: f.password, csrfToken: state.csrfToken, returnTo: "/" };
  for (const headers of [{}, { Origin: "https://attacker.example" }]) assert.equal((await f.call("/auth/login", { method: "POST", cookie: state.cookie, form, headers })).status, 403);
  assert.equal((await f.call("/auth/login", { method: "POST", cookie: state.cookie, form, headers: { Origin: BASE }, override: { now: f.now + 10 * 60 * 1000 + 1 } })).status, 403);
  const tokenHash = randomBytes(32).toString("hex");
  f.tokens.set(`invite:${tokenHash}`, IDS.pending);
  assert.equal((await f.call("/auth/confirm", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie,
    form: { csrfToken: state.csrfToken, tokenHash, type: "invite" } })).status, 403);
  assert.ok(!f.calls.some(({ method }) => ["authenticate", "verifyEmailToken"].includes(method)));
});
await check("password and administrator forms cannot reuse a different session's CSRF token", async (f) => {
  const first = await signIn(f, IDS.admin);
  const other = await signIn(f, IDS.admin);
  const state = await formFor(f, "/admin/users", first);
  assert.equal((await f.call("/admin/users/create", { method: "POST", headers: { Origin: BASE }, cookie: other.cookie,
    form: { csrfToken: state.csrfToken, name: "New Member", email: "new@example.test" } })).status, 403);
  const newPassword = randomBytes(20).toString("base64url");
  assert.equal((await f.call("/account/password", { method: "POST", headers: { Origin: BASE }, cookie: other.cookie,
    form: { csrfToken: state.csrfToken, currentPassword: f.password, password: newPassword, confirmPassword: newPassword } })).status, 403);
  assert.equal(f.emails.length, 0);
  assert.ok(!f.calls.some(({ method }) => method === "setPassword"));
});
await check("opening administrator action URLs never sends email or changes access", async (f) => {
  const actor = await signIn(f, IDS.admin);
  for (const path of ["create", "invite", "reset", "status"]) assert.equal((await f.call(`/admin/users/${path}?userId=${IDS.member}`, { cookie: actor.cookie })).status, 405);
  assert.equal(f.emails.length, 0);
  assert.ok(!f.calls.some(({ method }) => ["createUser", "sendInvite", "resetPassword", "setAccountStatus"].includes(method)));
});
await check("disabling a member invalidates every existing session and re-enabling does not restore them", async (f) => {
  const admin = await signIn(f, IDS.admin);
  const first = await signIn(f);
  const second = await signIn(f);
  assert.ok([200, 303].includes((await adminPost(f, "/admin/users/status", admin, { userId: IDS.member, status: "disabled" })).status));
  for (const actor of [first, second]) assert.equal((await f.call("/assets/app.js", { cookie: actor.cookie })).status, 401);
  assert.ok([200, 303].includes((await adminPost(f, "/admin/users/status", admin, { userId: IDS.member, status: "active" })).status));
  assert.equal((await f.call("/assets/app.js", { cookie: first.cookie })).status, 401);
});
await check("server-side role changes take effect on the next administrator request", async (f) => {
  const actor = await signIn(f, IDS.admin);
  f.users.get(IDS.admin).role = "member";
  assert.equal((await f.call("/admin/users", { cookie: actor.cookie })).status, 403);
});
await check("resend and password-reset actions target the selected account and reset revokes sessions", async (f) => {
  const admin = await signIn(f, IDS.admin);
  const member = await signIn(f);
  assert.ok([200, 303].includes((await adminPost(f, "/admin/users/invite", admin, { userId: IDS.pending })).status));
  assert.ok([200, 303].includes((await adminPost(f, "/admin/users/reset", admin, { userId: IDS.member })).status));
  assert.deepEqual(f.emails.map(({ type, userId }) => ({ type, userId })), [{ type: "invite", userId: IDS.pending }, { type: "recovery", userId: IDS.member }]);
  assert.equal((await f.call("/assets/app.js", { cookie: member.cookie })).status, 401);
});
await check("invite and recovery links require a POST before consuming a single-use email token", async (f) => {
  for (const type of ["invite", "recovery"]) {
    const tokenHash = randomBytes(32).toString("hex");
    f.tokens.set(`${type}:${tokenHash}`, IDS.pending);
    const first = await f.call(`/auth/confirm?token_hash=${tokenHash}&type=${type}`);
    const second = await f.call(`/auth/confirm?token_hash=${tokenHash}&type=${type}`);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(f.calls.filter(({ method }) => method === "verifyEmailToken").length, type === "invite" ? 0 : 2);
    const html = await first.text();
    const fields = { csrfToken: hidden(html, "csrfToken"), tokenHash: hidden(html, "tokenHash"), type: hidden(html, "type") };
    const consumed = await f.call("/auth/confirm", { method: "POST", headers: { Origin: BASE }, cookie: cookieHeader(first), form: fields });
    assert.equal(consumed.status, 303);
    assert.ok(cookieValue(consumed));
    const repeated = await f.call("/auth/confirm", { method: "POST", headers: { Origin: BASE }, cookie: cookieHeader(first), form: fields });
    assert.ok([400, 401, 403].includes(repeated.status));
    assert.ok(!cookieValue(repeated));
  }
});
await check("setup sessions cannot open the toolkit before a password is set", async (f) => {
  const { response } = await confirmToken(f, IDS.pending);
  assert.equal(response.status, 303);
  const actor = { cookie: cookieHeader(response) };
  assert.equal((await f.call("/account/password", { cookie: actor.cookie })).status, 200);
  assert.equal((await f.call("/assets/app.js", { cookie: actor.cookie })).status, 401);
  for (const path of ["/", "/admin/users"]) {
    const blocked = await f.call(path, { cookie: actor.cookie, headers: { Accept: "text/html" } });
    assert.ok([303, 403].includes(blocked.status));
    if (blocked.status === 303) assert.ok(blocked.headers.get("location").startsWith("/account/password"));
  }
});
await check("initial password setup activates the member, replaces the limited session and restores tool access", async (f) => {
  const { response: confirmed } = await confirmToken(f, IDS.pending);
  const actor = { cookie: cookieHeader(confirmed) };
  const state = await formFor(f, "/account/password", actor);
  const newPassword = randomBytes(20).toString("base64url");
  const response = await f.call("/account/password", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie,
    form: { csrfToken: state.csrfToken, password: newPassword, confirmPassword: newPassword } });
  assert.equal(response.status, 303);
  assert.ok(cookieValue(response));
  assert.equal(f.users.get(IDS.pending).requiresPasswordReset, false);
  assert.ok(f.users.get(IDS.pending).activatedAt);
  assert.equal(await f.call("/assets/app.js", { cookie: cookieHeader(response) }), null);
  assert.equal((await f.call("/assets/app.js", { cookie: actor.cookie })).status, 401);
});
await check("normal password changes require reauthentication and revoke all older sessions", async (f) => {
  const first = await signIn(f);
  const other = await signIn(f);
  const state = await formFor(f, "/account/password", first);
  const newPassword = randomBytes(20).toString("base64url");
  const fields = { csrfToken: state.csrfToken, currentPassword: "incorrect", password: newPassword, confirmPassword: newPassword };
  const rejected = await f.call("/account/password", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie, form: fields });
  assert.ok([400, 401, 403].includes(rejected.status));
  assert.ok(!f.calls.some(({ method }) => method === "setPassword"));
  assert.ok(!f.calls.some(({ method, purpose }) => method === "createSession" && purpose === "setup"), "Wrong current passwords must not mint a setup capability");
  const response = await f.call("/account/password", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie, form: { ...fields, currentPassword: f.password } });
  assert.equal(response.status, 303);
  const capability = f.calls.find(({ method, purpose }) => method === "createSession" && purpose === "setup");
  assert.ok(capability, "Reauthentication must mint a limited setup capability before changing a password");
  assert.ok(f.calls.some(({ method, tokenHash, purpose }) => method === "setPassword" && tokenHash === capability.tokenHash && purpose === "setup"));
  assert.ok(!f.sessions.has(capability.tokenHash), "The intermediate setup capability must not survive password completion");
  for (const old of [first, other]) assert.equal((await f.call("/assets/app.js", { cookie: old.cookie })).status, 401);
  assert.equal(await f.call("/assets/app.js", { cookie: cookieHeader(response) }), null);
});
await check("password validation rejects short, oversized and mismatched entries without changing any account", async (f) => {
  const actor = await signIn(f);
  const state = await formFor(f, "/account/password", actor);
  for (const [password, confirmPassword] of [["too-short", "too-short"], ["x".repeat(129), "x".repeat(129)], ["long-enough-password", "different-password"]]) {
    assert.equal((await f.call("/account/password", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie,
      form: { csrfToken: state.csrfToken, currentPassword: f.password, password, confirmPassword } })).status, 400);
  }
  assert.ok(!f.calls.some(({ method }) => method === "setPassword"));
});
await check("logout revokes the stored session so a copied old cookie cannot be reused", async (f) => {
  const actor = await signIn(f);
  const response = await f.call("/auth/logout", { method: "POST", headers: { Origin: BASE }, cookie: actor.cookie });
  assert.equal(response.status, 303);
  assert.ok(f.calls.some(({ method, hash }) => method === "revokeSession" && hash === actor.hash));
  assert.equal((await f.call("/assets/app.js", { cookie: actor.cookie })).status, 401);
});
await check("opaque sessions expire and signing-secret rotation invalidates existing cookies", async (f) => {
  const actor = await signIn(f);
  assert.equal((await f.call("/assets/app.js", { cookie: actor.cookie, override: { sessionSecret: randomBytes(32).toString("base64url") } })).status, 401);
  const raw = f.sessions.get(actor.hash);
  raw.expiresAt = new Date(f.now - 1).toISOString();
  assert.equal((await f.call("/assets/app.js", { cookie: actor.cookie })).status, 401);
});
await check("durable rate-limit denial and backend failures stop authentication before privileged work", async (f) => {
  const state = await loginForm(f);
  const fields = { username: "member@example.test", password: f.password, csrfToken: state.csrfToken, returnTo: "/" };
  f.flags.denyRateLimit = true;
  assert.equal((await f.call("/auth/login", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie, form: fields })).status, 429);
  f.flags.denyRateLimit = false;
  f.flags.rateUnavailable = true;
  assert.equal((await f.call("/auth/login", { method: "POST", headers: { Origin: BASE }, cookie: state.cookie, form: fields })).status, 503);
  assert.ok(!f.calls.some(({ method }) => method === "authenticate"));
});
await check("a failed durable-session lookup never serves protected resources", async (f) => {
  const actor = await signIn(f);
  f.flags.sessionUnavailable = true;
  const result = await f.call("/assets/app.js", { cookie: actor.cookie });
  assert.equal(result.status, 503);
  const body = await result.text();
  assert.ok(!body.includes("Fixture store error"));
  assert.ok(!body.includes(f.sessionSecret));
});

async function withHttpServer(f, run) {
  const guard = createInternalAuthMiddleware({ edition: "full", env: { SITE_EDITION: "full", INTERNAL_AUTH_MODE: "supabase", INTERNAL_SESSION_SECRET: f.sessionSecret, SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SECRET_KEY: "test-only-service-key" }, store: f.store, clientAddress: "fixture-http-client" });
  const server = createServer((req, res) => {
    guard(req, res, () => { res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "public, max-age=10000" }); res.end("protected fixture"); })
      .catch(() => { res.writeHead(500); res.end("Fixture request failed"); });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.close(); server.closeAllConnections(); await once(server, "close"); }
}
await check("the real HTTP middleware completes individual login, identity and revoking logout with a fake store", async (f) => {
  await withHttpServer(f, async (origin) => {
    const first = await fetch(origin + "/auth/login", { redirect: "manual" });
    assert.equal(first.status, 200);
    const csrfToken = hidden(await first.text(), "csrfToken");
    const signedIn = await fetch(origin + "/auth/login", { method: "POST", redirect: "manual", headers: { Origin: origin, Cookie: cookieHeader(first), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken, username: "admin@example.test", password: f.password, returnTo: "/" }) });
    assert.equal(signedIn.status, 303);
    const cookie = cookieHeader(signedIn);
    const asset = await fetch(origin + "/assets/app.js", { headers: { Cookie: cookie } });
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get("cache-control"), /private, no-store/);
    const me = await fetch(origin + "/auth/me", { headers: { Cookie: cookie } });
    assert.equal((await me.json()).user.id, IDS.admin);
    const usersPage = await fetch(origin + "/admin/users", { headers: { Cookie: cookie } });
    assert.equal(usersPage.status, 200);
    const adminCsrf = hidden(await usersPage.text(), "csrfToken");
    const created = await fetch(origin + "/admin/users/create", { method: "POST", redirect: "manual", headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: adminCsrf, name: "HTTP Fixture Member", email: "http-fixture@example.test" }) });
    assert.ok([200, 303].includes(created.status));
    assert.equal(f.emails.length, 1);
    assert.equal((await fetch(origin + "/auth/logout", { method: "POST", redirect: "manual", headers: { Origin: origin, Cookie: cookie } })).status, 303);
    assert.equal((await fetch(origin + "/assets/app.js", { redirect: "manual", headers: { Cookie: cookie } })).status, 401);
  });
});
function jsonResponse(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }); }
function restFixture(respond) {
  const key = "sb_secret_fixture_" + randomBytes(24).toString("base64url");
  const calls = [];
  const store = createAccountStore({ url: "https://fixture.supabase.co", secretKey: key, fetchImpl: async (input, init) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://fixture.supabase.co", "Adapter requests must stay on the configured service");
    const call = { path: url.pathname, search: url.search, method: init.method, headers: new Headers(init.headers), body: init.body === undefined ? undefined : JSON.parse(init.body), redirect: init.redirect, cache: init.cache, signal: init.signal };
    assert.ok(call.headers.get("apikey") === key, "Privileged key belongs only in the server request header");
    assert.ok(!input.includes(key) && !String(init.body || "").includes(key), "Never place a privileged key in URLs or payloads");
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    calls.push(call);
    return respond(call, calls, key);
  } });
  return { store, calls, key };
}
async function caught(action) {
  try { await action(); } catch (error) { return error; }
  assert.fail("Expected the adapter request to fail closed");
}
function assertStoreError(error, status, key = "", code) {
  assert.ok(error instanceof AccountStoreError);
  assert.equal(error.status, status);
  if (code) assert.equal(error.code, code);
  assert.ok(!key || !error.message.includes(key), "Errors must not expose the privileged key");
  assert.ok(!error.message.includes("UPSTREAM_PRIVATE_DETAIL"), "Errors must not expose provider or database details");
}
const actorHash = "a".repeat(64);
const profile = { id: IDS.member, email: "member@example.test", name: "Fixture Member", role: "member", status: "active" };

await check("the REST adapter keeps privileged keys and provider tokens out of returned identities", async () => {
  const providerToken = randomBytes(32).toString("base64url");
  const rest = restFixture((call) => {
    assert.equal(call.path, "/auth/v1/token");
    assert.equal(call.search, "?grant_type=password");
    assert.equal(call.body.email, "member@example.test");
    return jsonResponse({ user: { id: IDS.member, email: "MEMBER@example.test" }, access_token: providerToken, refresh_token: "private-refresh-token" });
  });
  const result = await rest.store.authenticate(" MEMBER@example.test ", randomBytes(20).toString("base64url"));
  assert.deepEqual(result, { id: IDS.member, email: "member@example.test" });
  for (const secret of [providerToken, rest.key, "private-refresh-token"]) assert.ok(!JSON.stringify(result).includes(secret));
  assert.ok(rest.calls[0].signal instanceof AbortSignal);
});
await check("adapter configuration errors are rejected before any fetch or privileged operation", () => {
  let fetched = false;
  const fetchImpl = async () => { fetched = true; throw new Error("No fetch was expected"); };
  const anonymousJwt = `header.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;
  for (const settings of [
    { url: "http://remote.example.test", secretKey: "test-secret-key" },
    { url: "https://name:password@fixture.supabase.co", secretKey: "test-secret-key" },
    { url: "https://fixture.supabase.co?key=unsafe", secretKey: "test-secret-key" },
    { url: "https://fixture.supabase.co", secretKey: "sb_publishable_fixture" },
    { url: "https://fixture.supabase.co", secretKey: anonymousJwt },
    { url: "https://fixture.supabase.co", secretKey: "" },
  ]) {
    let error;
    try { createAccountStore({ ...settings, fetchImpl }); } catch (caught) { error = caught; }
    assertStoreError(error, 503, settings.secretKey, "CONFIGURATION");
  }
  assert.equal(fetched, false);
});
await check("authentication denial remains distinct from sanitized permission, configuration and transport failures", async () => {
  const invalidLogin = restFixture(() => jsonResponse({ error_code: "invalid_credentials", message: "UPSTREAM_PRIVATE_DETAIL" }, 400));
  assert.equal(await invalidLogin.store.authenticate("member@example.test", "incorrect-password"), null);
  const invalidEmailToken = restFixture(() => jsonResponse({ error_code: "otp_expired", message: "UPSTREAM_PRIVATE_DETAIL" }, 403));
  assert.equal(await invalidEmailToken.store.verifyEmailToken("f".repeat(64), "invite"), null);
  for (const [httpStatus, body, expectedStatus, code] of [
    [400, { code: "PT401", message: "UPSTREAM_PRIVATE_DETAIL" }, 401, "UNAUTHENTICATED"],
    [403, { code: "PT403", message: "UPSTREAM_PRIVATE_DETAIL" }, 403, "FORBIDDEN"],
    [401, { code: "invalid_api_key", message: "UPSTREAM_PRIVATE_DETAIL" }, 503, "CONFIGURATION"],
    [500, { message: "UPSTREAM_PRIVATE_DETAIL" }, 503, "BACKEND_UNAVAILABLE"],
  ]) {
    const rest = restFixture(() => jsonResponse(body, httpStatus));
    assertStoreError(await caught(() => rest.store.listUsers(actorHash)), expectedStatus, rest.key, code);
  }
  const unavailable = restFixture((_call, _calls, key) => { throw new Error(`UPSTREAM_PRIVATE_DETAIL ${key}`); });
  assertStoreError(await caught(() => unavailable.store.getSession(actorHash)), 503, unavailable.key, "BACKEND_UNAVAILABLE");
  const malformed = restFixture(() => new Response("UPSTREAM_PRIVATE_DETAIL not JSON", { status: 200 }));
  assertStoreError(await caught(() => malformed.store.getSession(actorHash)), 503, malformed.key, "BACKEND_UNAVAILABLE");
  const invalidLimit = restFixture(() => jsonResponse("true"));
  assertStoreError(await caught(() => invalidLimit.store.consumeRateLimit(actorHash, 10, 60)), 503, invalidLimit.key, "BACKEND_UNAVAILABLE");
});
await check("every invite rechecks SQL administrator permission before sending exactly one targeted email", async () => {
  let authorized = true;
  const rest = restFixture((call) => {
    if (call.path.endsWith("/toolkit_admin_get_user")) {
      assert.equal(call.body.p_actor_hash, actorHash);
      assert.equal(call.body.p_user_id, IDS.member);
      return authorized ? jsonResponse(profile) : jsonResponse({ code: "PT403", message: "UPSTREAM_PRIVATE_DETAIL" }, 403);
    }
    if (call.path === `/auth/v1/admin/users/${IDS.member}`) return jsonResponse({ ...profile, email_confirmed_at: null });
    if (call.path === "/auth/v1/invite") {
      assert.deepEqual(call.body, { email: profile.email, data: { name: profile.name } });
      assert.equal(new URLSearchParams(call.search).get("redirect_to"), `${BASE}/auth/confirm`);
      return jsonResponse({});
    }
    if (call.path.endsWith("/toolkit_admin_record_invite")) return jsonResponse(null);
    throw new Error("Unexpected fake REST request");
  });
  await rest.store.sendInvite(actorHash, IDS.member, `${BASE}/auth/confirm`);
  assert.deepEqual(rest.calls.map(({ path }) => path), ["/rest/v1/rpc/toolkit_admin_get_user", `/auth/v1/admin/users/${IDS.member}`, "/auth/v1/invite", "/rest/v1/rpc/toolkit_admin_record_invite"]);
  authorized = false;
  assertStoreError(await caught(() => rest.store.sendInvite(actorHash, IDS.member, `${BASE}/auth/confirm`)), 403, rest.key);
  assert.equal(rest.calls.filter(({ path }) => path === "/auth/v1/invite").length, 1);
  assert.equal(rest.calls.at(-1).path, "/rest/v1/rpc/toolkit_admin_get_user");
});
await check("identity mismatches and failed delivery cannot send mail to another account or lock a member out", async () => {
  const mismatch = restFixture((call) => call.path.endsWith("/toolkit_admin_get_user") ? jsonResponse(profile) : jsonResponse({ id: IDS.disabled, email: "different@example.test" }));
  assertStoreError(await caught(() => mismatch.store.sendInvite(actorHash, IDS.member, `${BASE}/auth/confirm`)), 409, mismatch.key);
  assert.equal(mismatch.calls.length, 2);
  const failedMail = restFixture((call) => {
    if (call.path.endsWith("/toolkit_admin_get_user")) return jsonResponse(profile);
    if (call.path === `/auth/v1/admin/users/${IDS.member}`) return jsonResponse({ ...profile, email_confirmed_at: "2026-01-01T00:00:00Z" });
    if (call.path === "/auth/v1/recover") return jsonResponse({ message: "UPSTREAM_PRIVATE_DETAIL" }, 500);
    throw new Error("A failed email must not request a password-reset lock");
  });
  assertStoreError(await caught(() => failedMail.store.resetPassword(actorHash, IDS.member, `${BASE}/auth/confirm`)), 503, failedMail.key);
  assert.ok(!failedMail.calls.some(({ path }) => path.endsWith("/toolkit_admin_require_password_reset")));
});
await check("account creation fixes member inputs and rolls back only a newly created Auth identity", async () => {
  const newId = "66666666-6666-4666-8666-666666666666";
  for (const mode of ["success", "profile-denied", "existing-email", "admin-denied"]) {
    const rest = restFixture((call) => {
      if (call.path.endsWith("/toolkit_assert_admin")) return mode === "admin-denied" ? jsonResponse({ code: "PT403", message: "UPSTREAM_PRIVATE_DETAIL" }, 403) : jsonResponse(true);
      if (call.path === "/auth/v1/admin/users") {
        assert.equal(call.method, "POST");
        assert.equal(call.body.email, "new@example.test");
        assert.equal(call.body.email_confirm, false);
        assert.deepEqual(call.body.user_metadata, { name: "New Member" });
        assert.ok(!("app_metadata" in call.body) && !("role" in call.body));
        assert.ok(typeof call.body.password === "string" && call.body.password.length >= 48);
        return mode === "existing-email" ? jsonResponse({ code: "email_exists", message: "UPSTREAM_PRIVATE_DETAIL" }, 422) : jsonResponse({ id: newId, email: "new@example.test" });
      }
      if (call.path.endsWith("/toolkit_admin_create_account")) {
        assert.deepEqual(Object.keys(call.body).sort(), ["p_actor_hash", "p_email", "p_name", "p_user_id"]);
        assert.equal(call.body.p_user_id, newId);
        return mode === "profile-denied" ? jsonResponse({ code: "PT403", message: "UPSTREAM_PRIVATE_DETAIL" }, 403) : jsonResponse({ id: newId, email: "new@example.test", role: "member" });
      }
      if (call.path === `/auth/v1/admin/users/${newId}` && call.method === "DELETE") return jsonResponse(null);
      throw new Error("Unexpected fake account creation request");
    });
    if (mode === "success") {
      const result = await rest.store.createUser(actorHash, { email: " NEW@example.test ", name: " New Member ", role: "admin" });
      assert.equal(result.role, "member");
      assert.equal(rest.calls.some(({ method }) => method === "DELETE"), false);
    } else {
      const error = await caught(() => rest.store.createUser(actorHash, { email: "new@example.test", name: "New Member" }));
      assertStoreError(error, mode === "existing-email" ? 409 : 403, rest.key);
      const deletes = rest.calls.filter(({ method }) => method === "DELETE");
      assert.equal(deletes.length, mode === "profile-denied" ? 1 : 0);
      if (deletes.length) assert.equal(deletes[0].path, `/auth/v1/admin/users/${newId}`);
    }
  }
});
await check("password writes require a fresh SQL operation claim before provider update and completion", async () => {
  const operationId = "77777777-7777-4777-8777-777777777777";
  const newPassword = randomBytes(24).toString("base64url");
  for (const mode of ["success", "claim-denied", "provider-rejected", "provider-uncertain", "completion-denied"]) {
    const rest = restFixture((call) => {
      if (call.path.endsWith("/toolkit_begin_password_setup")) return mode === "claim-denied" ? jsonResponse({ code: "PT403", message: "UPSTREAM_PRIVATE_DETAIL" }, 403) : jsonResponse({ userId: IDS.member, operationId });
      if (call.path === `/auth/v1/admin/users/${IDS.member}`) {
        assert.equal(call.method, "PUT");
        assert.ok(call.body.password === newPassword);
        if (mode === "provider-uncertain") throw new Error("UPSTREAM_PRIVATE_DETAIL transport uncertain");
        if (mode === "provider-rejected") return jsonResponse({ code: "weak_password", message: "UPSTREAM_PRIVATE_DETAIL" }, 422);
        return jsonResponse({ id: IDS.member, email: profile.email });
      }
      if (call.path.endsWith("/toolkit_complete_password_setup") || call.path.endsWith("/toolkit_cancel_password_setup")) {
        assert.deepEqual(call.body, { p_token_hash: actorHash, p_operation_id: operationId });
        return mode === "completion-denied" ? jsonResponse({ code: "PT403", message: "UPSTREAM_PRIVATE_DETAIL" }, 403) : jsonResponse(profile);
      }
      throw new Error("Unexpected fake password operation request");
    });
    if (mode === "success") await rest.store.setPassword(actorHash, newPassword);
    else assertStoreError(await caught(() => rest.store.setPassword(actorHash, newPassword)), mode === "provider-uncertain" ? 503 : mode === "provider-rejected" ? 400 : 403, rest.key);
    const paths = rest.calls.map(({ path }) => path);
    assert.equal(paths[0], "/rest/v1/rpc/toolkit_begin_password_setup");
    if (mode === "claim-denied") assert.equal(paths.length, 1, "An unauthorized claim must never reach the Auth password update");
    else assert.equal(paths[1], `/auth/v1/admin/users/${IDS.member}`);
    assert.equal(paths.some((path) => path.endsWith("/toolkit_complete_password_setup")), ["success", "completion-denied"].includes(mode));
    assert.equal(paths.some((path) => path.endsWith("/toolkit_cancel_password_setup")), mode === "provider-rejected", "An uncertain provider write must keep its short operation lease");
  }
});
console.log(`${count} account and administrator checks passed with fake stores and REST; no live service or email used.`);
