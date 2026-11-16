import { createInternalAuthMiddleware as createLegacyAdapter, handleInternalRequest as handleSharedRequest, internalResponseHeaders } from "./auth.js";
import { handleAccountRequest } from "./account-auth.js";
import { createAccountStore } from "./account-store.js";

const accountPath = (path) => path === "/admin" || path.startsWith("/admin/") || path === "/account" || path.startsWith("/account/") || ["/auth/me", "/auth/confirm"].includes(path);
const unavailable = () => new Response("Account access is temporarily unavailable. Please contact the site administrator.", { status: 503, headers: internalResponseHeaders() });

/** The deployment edition and server configuration, never a URL, choose auth. */
export async function handleInternalRequest(request, options = {}) {
  const { buildEdition, siteEdition, authMode = "shared" } = options;
  if (!["public", "full"].includes(buildEdition) || siteEdition !== buildEdition) return unavailable();
  const path = new URL(request.url).pathname;
  if (buildEdition === "public") return accountPath(path) ? new Response("Not found.", { status: 404, headers: { "Cache-Control": "no-store" } }) : handleSharedRequest(request, options);
  if (authMode === "shared") {
    if (path === "/auth/me") {
      const permission = await handleSharedRequest(request, options);
      if (permission) return permission;
      if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed.", { status: 405, headers: { ...internalResponseHeaders(), Allow: "GET, HEAD" } });
      return new Response(request.method === "HEAD" ? null : JSON.stringify({ mode: "shared", user: null }), { headers: { ...internalResponseHeaders(), "Content-Type": "application/json; charset=utf-8" } });
    }
    return accountPath(path) ? new Response("Not found.", { status: 404, headers: internalResponseHeaders() }) : handleSharedRequest(request, options);
  }
  if (authMode !== "supabase") return unavailable();
  try {
    const project = new URL(options.supabaseUrl);
    if (project.username || project.password || project.search || project.hash || !["", "/"].includes(project.pathname) ||
      (project.protocol !== "https:" && !(project.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(project.hostname))) ||
      typeof options.supabaseSecretKey !== "string" || !options.supabaseSecretKey.trim()) return unavailable();
    const store = options.store ?? createAccountStore({ url: project.origin, secretKey: options.supabaseSecretKey });
    return handleAccountRequest(request, { ...options, store });
  } catch { return unavailable(); }
}

/** Reuses the existing all-path Node adapter, with the same production handler. */
export function createInternalAuthMiddleware({ edition, env = process.env, store, clientAddress } = {}) {
  return createLegacyAdapter({ edition, env, requestHandler: (request, options) => handleInternalRequest(request, {
    ...options,
    authMode: env.INTERNAL_AUTH_MODE || "shared",
    supabaseUrl: env.SUPABASE_URL,
    supabaseSecretKey: env.SUPABASE_SECRET_KEY,
    ...(store ? { store } : {}),
    ...(clientAddress ? { clientAddress } : {}),
  }) });
}
