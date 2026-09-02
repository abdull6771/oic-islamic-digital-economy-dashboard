/**
 * Hash routing. The contract is unchanged from the original build - `#tab=<id>`
 * with the same tab ids, plus `#country=<name>` for a deep-linked profile - so
 * every link that worked before still resolves.
 */

export const parseHash = () =>
  new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""),
  );

/** Read one hash parameter. */
export const hashParam = (key) => parseHash().get(key);

/** Merge parameters into the hash; a null value removes the key. */
export function navigate(patch) {
  const params = parseHash();
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) params.delete(key);
    else params.set(key, value);
  }
  window.location.hash = params.toString();
}

/** Jump to a country's profile from anywhere - the map, the palette, a table. */
export const openCountry = (name) =>
  navigate({ tab: "profiles", country: name });

/** Subscribe to hash changes. Returns an unsubscribe function. */
export function onHashChange(handler) {
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}
