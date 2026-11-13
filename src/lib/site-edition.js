import { TOOL_CATALOG } from "./tool-catalog.js";

/** Replaced at build time; visitors cannot switch editions through a URL. */
export const EDITION = typeof __SITE_EDITION__ === "undefined" ? "public" : __SITE_EDITION__;
export const IS_PUBLIC = EDITION === "public";
export const CONTACT_EMAIL = typeof __CONTACT_EMAIL__ === "undefined" ? "devbabura@gmail.com" : __CONTACT_EMAIL__;

const editions = new Set(["public", "full"]);
export function allowedViewIds(edition = EDITION) {
  if (!editions.has(edition)) throw new Error(`Unknown site edition: ${edition}`);
  return ["home", ...TOOL_CATALOG.filter((tool) => edition === "full" || tool.group === "explore").map((tool) => tool.id), "acknowledgement"];
}
export const canAccessView = (id, edition = EDITION) => allowedViewIds(edition).includes(id);
export const resolveView = (id, edition = EDITION) => canAccessView(id, edition) ? id : "home";
