/**
 * Owner-run, one-time binding of Kinan's Auth identity to a pending admin profile.
 * No email or password is created, printed, reused or sent by this command.
 */
import { pathToFileURL } from "node:url";

const EMAIL = "kinan@inceif.edu.my";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function bootstrapKinan({ url, secretKey, userId, apply = false, fetchImpl = fetch } = {}) {
  let base;
  try { base = new URL(url); } catch { throw new Error("Set SUPABASE_URL to the intended project URL."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if ((base.protocol !== "https:" && !(base.protocol === "http:" && local)) || base.username || base.password || base.search || base.hash || base.pathname !== "/") throw new Error("Use the intended HTTPS Supabase project origin.");
  if (!UUID.test(userId || "")) throw new Error("Supply Kinan's immutable Auth UUID with --user-id.");
  if (typeof secretKey !== "string" || !secretKey || /\s/.test(secretKey) || secretKey.startsWith("sb_publishable_")) throw new Error("Set the server-only SUPABASE_SECRET_KEY.");
  const legacy = secretKey.split(".").length === 3;
  if (legacy) {
    try { if (JSON.parse(Buffer.from(secretKey.split(".")[1], "base64url").toString("utf8")).role !== "service_role") throw new Error(); }
    catch { throw new Error("Use a server secret key with service-role access."); }
  }
  const headers = { apikey: secretKey, ...(legacy ? { Authorization: `Bearer ${secretKey}` } : {}), "Content-Type": "application/json" };
  async function request(path, options = {}) {
    let response;
    try { response = await fetchImpl(base.origin + path, { ...options, headers, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000) }); }
    catch { throw new Error("The account service could not be reached. No credentials were printed."); }
    if (!response.ok) throw new Error("Bootstrap was rejected. Confirm the migration, project key and Kinan identity.");
    try { return await response.json(); } catch { throw new Error("The account service returned an unexpected response."); }
  }
  const auth = await request(`/auth/v1/admin/users/${userId}`, { method: "GET" });
  const user = auth?.user || auth;
  if (user.id !== userId || String(user.email).toLowerCase() !== EMAIL) throw new Error("Only Kinan's kinan@inceif.edu.my Auth identity may be bound to the pending administrator.");
  if (!apply) return { dryRun: true, id: userId, email: EMAIL };
  const result = await request("/rest/v1/rpc/toolkit_bootstrap_admin", { method: "POST", body: JSON.stringify({ p_user_id: userId }) });
  if (result?.id !== userId || result.email !== EMAIL || result.role !== "admin") throw new Error("Bootstrap did not return the expected administrator.");
  return { dryRun: false, id: result.id, email: result.email, role: result.role, pending: !result.activatedAt || result.requiresPasswordReset === true };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    console.log("Usage: node scripts/bootstrap-accounts.mjs --user-id <Kinan Auth UUID> [--apply]");
    console.log("Requires SUPABASE_URL and server-only SUPABASE_SECRET_KEY in the process environment.");
    console.log("Without --apply, checks the existing identity only. --apply creates a pending admin; email verification/password setup are still required.");
    console.log("Never sends email or creates a password.");
    return;
  }
  if (args.some((arg, index) => !["--user-id", "--apply"].includes(arg) && args[index - 1] !== "--user-id") || args.filter((arg) => arg === "--user-id").length !== 1) throw new Error("Invalid arguments. Use --help.");
  const userId = args[args.indexOf("--user-id") + 1];
  const result = await bootstrapKinan({ url: process.env.SUPABASE_URL, secretKey: process.env.SUPABASE_SECRET_KEY, userId, apply: args.includes("--apply") });
  const outcome = result.dryRun ? "Matched identity; no database change" : result.pending ? "Pending administrator profile bound" : "Administrator already initialized";
  console.log(`${outcome}: ${result.email} (${result.id})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
