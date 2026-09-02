import { SOURCE_LINE } from "../lib/format.js";

/**
 * The frame every chart sits in.
 *
 * This is a citable research product, so sourcing is not optional: each chart
 * states what it shows, in what unit and for which year, and where the figures
 * come from. `summary` is the accessible fallback - screen readers get the
 * takeaway rather than an unlabelled SVG.
 */
export default function ChartFrame({
  title,
  subtitle,
  summary,
  legend,
  action,
  source = SOURCE_LINE,
  note,
  headingLevel = 2,
  className = "",
  children,
}) {
  const Heading = `h${headingLevel}`;
  return (
    <section className={`chart-frame ${className}`.trim()}>
      <div className="chart-head">
        <div style={{ minWidth: 0 }}>
          {title && <Heading className="t-h3">{title}</Heading>}
          {subtitle && <div className="chart-sub t-caption">{subtitle}</div>}
        </div>
        {(legend || action) && (
          <div className="chart-legend t-overline">
            {legend}
            {action}
          </div>
        )}
      </div>

      <div role={summary ? "img" : undefined} aria-label={summary || undefined}>
        {children}
      </div>

      {(source || note) && (
        <div className="chart-source t-caption">
          {note && <div>{note}</div>}
          {source}
        </div>
      )}
    </section>
  );
}

/** A legend entry: an 8px swatch and an 11px overline label. */
export function LegendKey({ color, children }) {
  return (
    <span className="legend-item t-overline">
      <span className="legend-swatch" style={{ background: color }} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ── Shared Recharts configuration ───────────────────────────────────────── */

/**
 * Axis styling, applied to every chart so the views are comparable.
 * Caption-sized, muted, no axis line, no tick marks.
 */
export const axis = (tokens) => ({
  tick: { fill: tokens["text-muted"], fontSize: 12 },
  stroke: tokens.border,
  tickLine: false,
  axisLine: false,
});

/**
 * Gridlines on the value axis only. A bar chart's category axis gets none.
 * `vertical` flips for horizontal bar charts, where the value axis is x.
 */
export const grid = (tokens, { horizontal = true } = {}) => ({
  stroke: tokens.border,
  strokeOpacity: 0.6,
  vertical: !horizontal,
  horizontal,
});

/** Every DEI/pillar score chart shares a 0-100 domain, so views compare. */
export const SCORE_DOMAIN = [0, 100];

/**
 * The OIC average reference line - the single most useful annotation in this
 * product, and drawn on every chart that compares countries.
 */
export const referenceLineProps = (tokens, { vertical = false } = {}) => ({
  stroke: tokens["text-subtle"],
  strokeDasharray: "4 4",
  strokeWidth: 1,
  ifOverflow: "extendDomain",
  label: {
    value: "OIC avg",
    position: vertical ? "top" : "right",
    fill: tokens["text-subtle"],
    fontSize: 11,
  },
});

/** Chart enter animations stay under 400ms, and stop entirely for reduced motion. */
export const animation = () => {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return { isAnimationActive: !reduced, animationDuration: reduced ? 0 : 360 };
};
