/**
 * One cluster encoding for the whole product.
 *
 * The old build encoded the three clusters twice - traffic-light green/amber/red
 * on the map legend and a green ramp on the cluster cards, one screen apart.
 * Everything now resolves through here, so the map, the cards, the tables and
 * the chips cannot disagree.
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
