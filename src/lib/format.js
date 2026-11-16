/**
 * Number formatting for a citable research product.
 *
 * The index publishes scores to one decimal, deltas signed to one decimal and
 * weights as whole percentages. Every figure on screen goes through here so a
 * value never appears at two different precisions in two different views, and
 * so the glyphs used for signs are the typographic ones (− U+2212, not a
 * hyphen) that line up under `font-variant-numeric: tabular-nums`.
 */

/** A DEI or pillar score: one decimal, e.g. `41.2`. */
export const score = (v) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : v.toFixed(1);

/** A score with no decimal, for dense heatmap cells: `41`. */
export const scoreCompact = (v) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : v.toFixed(0);

/** A signed change, e.g. `+3.4` / `−1.8`. Uses a true minus sign. */
export const delta = (v, digits = 1) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const rounded = Number(v.toFixed(digits));
  if (rounded === 0) return `0.${"0".repeat(digits)}`.replace(/\.$/, "");
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(digits)}`;
};

/** A signed rank movement in places, e.g. `+4` (gained) / `−4` (lost). */
export const rankDelta = (v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (v === 0) return "0";
  return `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
};

/** An arrow glyph carrying the same meaning as the delta colour. */
export const deltaArrow = (v) => (v > 0 ? "▲" : v < 0 ? "▼" : "■");

/** Which semantic token a delta belongs to. */
export const deltaTone = (v) =>
  v > 0 ? "positive" : v < 0 ? "negative" : "neutral";

/** A rank, e.g. `#12`. */
export const rank = (v) =>
  v === null || v === undefined ? "—" : `#${v}`;

/** A pillar weight, e.g. `15%`. */
export const weight = (v) =>
  v === null || v === undefined ? "—" : `${Math.round(v)}%`;

/** A percentage to one decimal, e.g. `62.5%`. */
export const percent = (v, digits = 1) =>
  v === null || v === undefined || Number.isNaN(v)
    ? "—"
    : `${v.toFixed(digits)}%`;

/** Fixed-precision helper for anything that is not a score. */
export const num = (v, digits = 2) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : v.toFixed(digits);

/** The source line every chart carries. */
export const SOURCE_LINE = "Source: OIC DEI 2025, INCEIF University";

/** The unit every DEI/pillar score chart states. */
export const SCORE_UNIT = "DEI score, 0–100";
