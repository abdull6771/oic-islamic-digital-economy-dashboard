/**
 * One cluster encoding for the whole product.
 *
 * Advanced is green, Emerging is amber, and Foundational is red. The map,
 * cluster cards, tables and badges resolve those colours through shared tokens.
 */

export const CLUSTER_TONE = {
  "Advanced Digital Economies": "advanced",
  "Emerging Digital Economies": "emerging",
  "Foundational Digital Economies": "foundational",
};

export const CLUSTER_SHORT = {
  advanced: "Advanced",
  emerging: "Emerging",
  foundational: "Foundational",
};

/**
 * A non-colour cue for the cluster, so the tier survives greyscale, projection
 * and colour-vision deficiency.
 */
export const CLUSTER_TIER = {
  advanced: "●●●",
  emerging: "●●○",
  foundational: "●○○",
};

/** Slug for a cluster label, e.g. "Advanced Digital Economies" -> "advanced". */
export const toneFor = (label) => CLUSTER_TONE[label] || "neutral";

/** CSS value for a cluster's mark colour. */
export const clusterFill = (label) => `var(--cluster-${toneFor(label)})`;

/** CSS value for a cluster's boundary colour, which carries 3:1 non-text contrast. */
export const clusterLine = (label) => `var(--cluster-${toneFor(label)}-line)`;

/** Chart-ready mark colour for a cluster, read from the resolved token set. */
export const clusterColor = (tokens, label) =>
  tokens[`cluster-${toneFor(label)}`] || tokens["text-muted"];
