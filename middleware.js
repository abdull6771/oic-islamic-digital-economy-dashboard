import { ipAddress, next } from "@vercel/functions";
import { BUILD_EDITION } from "./server/build-edition.js";
import { internalResponseHeaders } from "./server/auth.js";
import { handleInternalRequest } from "./server/request-handler.js";

// Every request is checked, including static assets, source paths and APIs.
export const config = { matcher: "/:path*", runtime: "nodejs" };

export default async function middleware(request) {
  const decision = await handleInternalRequest(request, {
    buildEdition: BUILD_EDITION,
    siteEdition: process.env.SITE_EDITION,
    username: process.env.INTERNAL_SITE_USER ?? "internal",
    password: process.env.INTERNAL_SITE_PASSWORD,
    sessionSecret: process.env.INTERNAL_SESSION_SECRET,
    authMode: process.env.INTERNAL_AUTH_MODE || "shared",
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    clientAddress: ipAddress(request) || "unknown",
  });
  if (decision) return decision;
  return BUILD_EDITION === "full" ? next({ headers: internalResponseHeaders() }) : next();
}
