import { randomBytes } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASH = /^[0-9a-f]{64}$/;
const INVALID_LOGIN = new Set(["invalid_credentials", "invalid_grant", "email_not_confirmed", "user_banned", "user_not_found"]);
const INVALID_EMAIL_TOKEN = new Set(["otp_expired", "otp_disabled", "token_expired", "access_denied", "user_banned", "user_not_found"]);

export class AccountStoreError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = "AccountStoreError";
    this.code = code;
    this.status = status;
  }
}

const invalid = () => new AccountStoreError("INVALID_INPUT", 400, "The account request is invalid.");
const unavailable = () => new AccountStoreError("BACKEND_UNAVAILABLE", 503, "Account services are temporarily unavailable. Please try again later.");
const forbidden = () => new AccountStoreError("FORBIDDEN", 403, "This account action is not permitted.");
const configuration = () => new AccountStoreError("CONFIGURATION", 503, "Account services are not configured correctly.");

function emailAddress(value) {
  if (typeof value !== "string") throw invalid();
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\u0000-\u001f\u007f]/.test(email)) throw invalid();
  return email;
}
function userId(value) { if (typeof value !== "string" || !UUID.test(value)) throw invalid(); return value; }
function tokenHash(value) { if (typeof value !== "string" || !HASH.test(value)) throw invalid(); return value; }
function displayName(value) {
  if (typeof value !== "string" || value.trim().length > 120 || /[\u0000-\u001f\u007f]/.test(value)) throw invalid();
  return value.trim();
}
function passwordValue(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 1024 || !value.trim() || /[\u0000-\u001f\u007f]/.test(value)) throw invalid();
  return value;
}
function endpointUrl(value) {
  let target;
  try { target = new URL(value); } catch { throw configuration(); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  if ((target.protocol !== "https:" && !(target.protocol === "http:" && local)) || target.username || target.password || target.search || target.hash || !["", "/"].includes(target.pathname)) throw configuration();
  return target.origin;
}
function confirmationUrl(value) {
  let target;
  try { target = new URL(value); } catch { throw invalid(); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  if ((target.protocol !== "https:" && !(target.protocol === "http:" && local)) || target.username || target.password || target.search || target.hash || target.pathname !== "/auth/confirm") throw invalid();
  return target.href;
}
function identity(data) {
  const value = data?.user || data;
  if (!value || !UUID.test(value.id || "") || typeof value.email !== "string") throw unavailable();
  return { id: value.id, email: emailAddress(value.email) };
}

function apiError(status, data) {
  const code = String(data?.error_code || data?.code || data?.error || "");
  const message = String(data?.message || "");
  if (status === 429) return new AccountStoreError("RATE_LIMITED", 429, "Too many account requests. Please try again later.");
  if (code === "PT401") return new AccountStoreError("UNAUTHENTICATED", 401, "Please sign in again.");
  if (code === "PT403") return forbidden();
  if (code === "PT404") return new AccountStoreError("NOT_FOUND", 404, "The account could not be found.");
  if (code === "23505" || code === "PT409" || ["email_exists", "user_already_exists", "email_already_exists"].includes(code)) return new AccountStoreError("CONFLICT", 409, message === "PASSWORD_CHANGE_BUSY" ? "A password change is already in progress. Please try again shortly." : "This account action conflicts with the current account state.");
  if (code === "PT400" || code === "23514" || code === "22P02") return invalid();
  if (status === 401 || status === 403 || code.startsWith("PGRST") || ["42501", "42P01", "42883", "invalid_api_key", "bad_jwt"].includes(code)) return configuration();
  if (status === 404) return new AccountStoreError("NOT_FOUND", 404, "The account could not be found.");
  if (status >= 400 && status < 500) return new AccountStoreError("INVALID_INPUT", 400, "The account service could not accept this request. Check the supplied details.");
  return unavailable();
}

/**
 * Server-only Supabase REST adapter. The browser never receives its privileged
 * key, Auth tokens, password-operation claims, or database session hashes.
 */
export function createAccountStore({ url, secretKey, fetchImpl = fetch } = {}) {
  const origin = endpointUrl(url);
  if (typeof secretKey !== "string" || !secretKey || /\s/.test(secretKey) || secretKey.startsWith("sb_publishable_") || typeof fetchImpl !== "function") throw configuration();
  const legacyJwt = secretKey.split(".").length === 3;
  if (legacyJwt) {
    try {
      if (JSON.parse(Buffer.from(secretKey.split(".")[1], "base64url").toString("utf8")).role !== "service_role") throw configuration();
    } catch { throw configuration(); }
  }
  const headers = {
    apikey: secretKey,
    ...(legacyJwt ? { Authorization: `Bearer ${secretKey}` } : {}),
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Info": "oic-toolkit-server/1",
  };

  async function request(path, { method = "POST", body, allowCodes = null } = {}) {
    let result;
    try {
      result = await fetchImpl(origin + path, {
        method, headers, redirect: "error", cache: "no-store",
        signal: AbortSignal.timeout(15000),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch { throw unavailable(); }
    let data = null;
    try {
      const content = await result.text();
      if (content) data = JSON.parse(content);
    } catch { throw unavailable(); }
    if (!result.ok) {
      const code = String(data?.error_code || data?.code || data?.error || "");
      if (allowCodes?.has(code) && result.status >= 400 && result.status < 500) return null;
      throw apiError(result.status, data);
    }
    return data;
  }
  const rpc = (name, body) => request(`/rest/v1/rpc/${name}`, { body });
  const authorizeAdmin = (actorHash) => rpc("toolkit_assert_admin", { p_actor_hash: tokenHash(actorHash) });
  async function targetFor(actorHash, id) {
    const target = await rpc("toolkit_admin_get_user", { p_actor_hash: tokenHash(actorHash), p_user_id: userId(id) });
    if (!target) throw new AccountStoreError("NOT_FOUND", 404, "The account could not be found.");
    return target;
  }
  async function authUserFor(target) {
    const data = await request(`/auth/v1/admin/users/${userId(target.id)}`, { method: "GET" });
    const actual = identity(data);
    if (actual.id !== target.id || actual.email !== target.email) throw new AccountStoreError("CONFLICT", 409, "The account identity needs an administrator review.");
    return data?.user || data;
  }
  async function mail(target, redirectTo, kind) {
    const path = kind === "invite" ? "invite" : "recover";
    await request(`/auth/v1/${path}?redirect_to=${encodeURIComponent(confirmationUrl(redirectTo))}`, {
      body: { email: target.email, ...(kind === "invite" ? { data: { name: target.name } } : {}) },
    });
  }

  return Object.freeze({
    async authenticate(email, password) {
      const normalizedEmail = emailAddress(email);
      if (typeof password !== "string" || password.length > 1024 || !password) return null;
      const data = await request("/auth/v1/token?grant_type=password", {
        body: { email: normalizedEmail, password }, allowCodes: INVALID_LOGIN,
      });
      return data === null ? null : identity(data);
    },
    async verifyEmailToken(hash, type) {
      if (typeof hash !== "string" || hash.length < 16 || hash.length > 512 || !/^[A-Za-z0-9_-]+$/.test(hash) || !["invite", "recovery"].includes(type)) return null;
      const data = await request("/auth/v1/verify", { body: { token_hash: hash, type }, allowCodes: INVALID_EMAIL_TOKEN });
      return data === null ? null : identity(data);
    },
    async getSession(hash) { return rpc("toolkit_get_session", { p_token_hash: tokenHash(hash) }); },
    async createSession(id, hash, purpose, expiresAt) {
      const date = new Date(expiresAt);
      if (!["full", "setup"].includes(purpose) || !Number.isFinite(date.getTime())) throw invalid();
      return rpc("toolkit_create_session", { p_user_id: userId(id), p_token_hash: tokenHash(hash), p_purpose: purpose, p_expires_at: date.toISOString() });
    },
    async revokeSession(hash) { await rpc("toolkit_revoke_session", { p_token_hash: tokenHash(hash) }); },
    async listUsers(actorHash, { page = 1, perPage = 25 } = {}) {
      if (!Number.isInteger(page) || page < 1 || page > 100000 || !Number.isInteger(perPage) || perPage < 1 || perPage > 100) throw invalid();
      return rpc("toolkit_admin_list_users", { p_actor_hash: tokenHash(actorHash), p_page: page, p_per_page: perPage });
    },
    async createUser(actorHash, { email, name = "" } = {}) {
      const normalizedEmail = emailAddress(email), normalizedName = displayName(name);
      await authorizeAdmin(actorHash);
      const created = await request("/auth/v1/admin/users", {
        body: { email: normalizedEmail, password: randomBytes(48).toString("base64url"), email_confirm: false, user_metadata: { name: normalizedName } },
      });
      const account = identity(created);
      try {
        return await rpc("toolkit_admin_create_account", {
          p_actor_hash: tokenHash(actorHash), p_user_id: account.id, p_email: normalizedEmail, p_name: normalizedName,
        });
      } catch (error) {
        // This ID came only from the preceding successful create call. Never
        // delete an existing identity found by email or returned by a lookup.
        try { await request(`/auth/v1/admin/users/${account.id}`, { method: "DELETE", body: { should_soft_delete: false } }); }
        catch { throw unavailable(); }
        throw error;
      }
    },
    async sendInvite(actorHash, id, redirectTo) {
      const target = await targetFor(actorHash, id);
      if (target.status !== "active") throw forbidden();
      const authUser = await authUserFor(target);
      const kind = authUser.email_confirmed_at ? "recovery" : "invite";
      await mail(target, redirectTo, kind);
      await rpc("toolkit_admin_record_invite", { p_actor_hash: tokenHash(actorHash), p_user_id: target.id, p_kind: kind });
    },
    async resetPassword(actorHash, id, redirectTo) {
      const target = await targetFor(actorHash, id);
      if (target.status !== "active") throw forbidden();
      const authUser = await authUserFor(target);
      await mail(target, redirectTo, authUser.email_confirmed_at ? "recovery" : "invite");
      // A failed email request never locks the member out of the application.
      await rpc("toolkit_admin_require_password_reset", { p_actor_hash: tokenHash(actorHash), p_user_id: target.id });
    },
    async setAccountStatus(actorHash, id, status) {
      if (!["active", "disabled"].includes(status)) throw invalid();
      return rpc("toolkit_admin_set_status", { p_actor_hash: tokenHash(actorHash), p_user_id: userId(id), p_status: status });
    },
    async setPassword(hash, password) {
      const checkedHash = tokenHash(hash), checkedPassword = passwordValue(password);
      const claim = await rpc("toolkit_begin_password_setup", { p_token_hash: checkedHash });
      if (!claim || !UUID.test(claim.userId || "") || !UUID.test(claim.operationId || "")) throw unavailable();
      try {
        await request(`/auth/v1/admin/users/${claim.userId}`, { method: "PUT", body: { password: checkedPassword } });
      } catch (error) {
        // On transport uncertainty the provider may have accepted the change.
        // Keep the five-minute lease instead of admitting a competing request.
        if (error instanceof AccountStoreError && error.code !== "BACKEND_UNAVAILABLE") {
          try { await rpc("toolkit_cancel_password_setup", { p_token_hash: checkedHash, p_operation_id: claim.operationId }); } catch { /* A short lease expires on its own. */ }
        }
        throw error;
      }
      return rpc("toolkit_complete_password_setup", { p_token_hash: checkedHash, p_operation_id: claim.operationId });
    },
    async consumeRateLimit(key, limit, windowSeconds) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 1000 || !Number.isInteger(windowSeconds) || windowSeconds < 1 || windowSeconds > 86400) throw invalid();
      const allowed = await rpc("toolkit_consume_rate_limit", { p_key_hash: tokenHash(key), p_limit: limit, p_window_seconds: windowSeconds });
      if (typeof allowed !== "boolean") throw unavailable();
      return allowed;
    },
  });
}
