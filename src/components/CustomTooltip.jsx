import { SCORE_UNIT } from "../lib/format.js";

/**
 * The Recharts tooltip.
 *
 * Bold title, then one `label — value` row per series with an 8px swatch and
 * tabular numerals, and the unit stated once at the foot. Ordered by value
 * descending when there are more than three series, so a nine-pillar tooltip is
 * readable instead of being a wall in arbitrary order.
 */
export default function CustomTooltip({
  active,
  payload,
  label,
  unit = SCORE_UNIT,
  digits = 1,
  formatValue,
  title,
}) {
  if (!active || !payload?.length) return null;

  const rows = payload
    .filter((p) => p.value !== null && p.value !== undefined)
    .map((p) => ({
      name: p.name ?? p.dataKey,
      value: p.value,
      color: p.color || p.fill || p.stroke || "var(--text-muted)",
    }));

  if (rows.length > 3) rows.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const render = (v) => {
    if (formatValue) return formatValue(v);
    return typeof v === "number" ? v.toFixed(digits) : v;
  };

  return (
    <div className="tooltip-card">
      {(title ?? label) !== undefined && (title ?? label) !== "" && (
        <div className="tooltip-title">{title ?? label}</div>
      )}
      {rows.map((row, i) => (
        <div className="tooltip-row" key={`${row.name}-${i}`}>
          <span className="legend-swatch" style={{ background: row.color }} aria-hidden="true" />
          <span className="tooltip-label">{row.name}</span>
          <span className="tooltip-value">{render(row.value)}</span>
        </div>
      ))}
      {unit && <div className="tooltip-unit t-caption">{unit}</div>}
    </div>
  );
}
