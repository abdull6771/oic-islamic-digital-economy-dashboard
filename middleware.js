import { next } from "@vercel/functions";
import { BUILD_EDITION } from "./server/build-edition.js";
import { handleInternalRequest, internalResponseHeaders } from "./server/auth.js";

// Every request is checked, including static assets, source paths and APIs.
export const config = { matcher: "/:path*", runtime: "nodejs" };

export default async function middleware(request) {
  const decision = await handleInternalRequest(request, {
    buildEdition: BUILD_EDITION,
    siteEdition: process.env.SITE_EDITION,
    username: process.env.INTERNAL_SITE_USER ?? "internal",
    password: process.env.INTERNAL_SITE_PASSWORD,
    sessionSecret: process.env.INTERNAL_SESSION_SECRET,
  });
  if (decision) return decision;
  return BUILD_EDITION === "full" ? next({ headers: internalResponseHeaders() }) : next();
}
