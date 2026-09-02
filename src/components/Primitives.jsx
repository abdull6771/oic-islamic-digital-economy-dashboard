import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as fmt from "../lib/format.js";
import { CLUSTER_TIER, CLUSTER_SHORT, toneFor } from "../lib/clusters.js";

/** Measure before paint in the browser; fall back to useEffect off-DOM. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The primitive layer: Card, StatTile, Badge, Delta, ScoreBar, InsightBlock,
 * the control set and the empty/loading/error states.
 *
 * Every one of these is a thin wrapper over a class in components.css. None of
 * them carries a colour, a font stack or a pixel value of its own.
 */

/* ── Card ────────────────────────────────────────────────────────────────── */

export function Card({
  title,
  subtitle,
  action,
  footer,
  headingId,
  className = "",
  children,
  ...rest
}) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {(title || action) && (
        <div className="card-head">
          <div style={{ minWidth: 0 }}>
            {title && (
              <h2 className="t-h3" id={headingId}>
                {title}
              </h2>
            )}
            {subtitle && <div className="card-sub t-caption">{subtitle}</div>}
          </div>
          {action && <div className="row" style={{ flexWrap: "nowrap" }}>{action}</div>}
        </div>
      )}
      {children}
      {footer && <div className="card-foot t-caption">{footer}</div>}
    </section>
  );
}

/* ── Stat tile ───────────────────────────────────────────────────────────── */

/**
 * A KPI: overline label, tabular value, one supporting line, an optional signed
 * delta and an optional sparkline. No fill tint, no 2px border, no gradient.
 */
export function StatTile({ label, value, support, delta, series, className = "" }) {
  return (
    <div className={`stat-tile ${className}`.trim()}>
      <div className="stat-label t-overline">{label}</div>
      <div className="stat-value t-metric-sm">
        <span>{value}</span>
        {delta !== undefined && delta !== null && <Delta value={delta} />}
      </div>
      {support && <div className="stat-support t-caption">{support}</div>}
      {series?.length > 1 && <Sparkline values={series} label={label} />}
    </div>
  );
}

/** A 40px trend line. Decorative only — the figure above it carries the value. */
export function Sparkline({ values, label, width = 120, height = 40 }) {
  const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (clean.length < 2) return null;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  let path = "";
  let started = false;
  values.forEach((v, i) => {
    if (typeof v !== "number" || Number.isNaN(v)) return;
    const x = i * step;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    path += `${started ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    started = true;
  });
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label} trend, ${fmt.score(clean[0])} to ${fmt.score(clean[clean.length - 1])}`}
      style={{ marginTop: "var(--s-8)", display: "block", overflow: "visible" }}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--interactive)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ── Badge / cluster chip / delta ────────────────────────────────────────── */

export function Badge({ tone = "neutral", children, ...rest }) {
  return (
    <span className="badge" data-tone={tone} {...rest}>
      {children}
    </span>
  );
}

/** The cluster chip. The tier glyph carries the tier without relying on colour. */
export function ClusterBadge({ cluster, short = false }) {
  const tone = toneFor(cluster);
  return (
    <span className="badge" data-tone={tone}>
      <span className="tier" aria-hidden="true">
        {CLUSTER_TIER[tone]}
      </span>
      {short ? CLUSTER_SHORT[tone] || cluster : cluster}
    </span>
  );
}

/**
 * A signed change. The arrow and the sign both carry the direction, so the
 * colour is never doing the work alone.
 */
export function Delta({ value, digits = 1, unit = "", places = false }) {
  const tone = fmt.deltaTone(value);
  const text = places ? fmt.rankDelta(value) : fmt.delta(value, digits);
  return (
    <span className="delta t-caption" data-tone={tone}>
      <span className="delta-arrow" aria-hidden="true">
        {fmt.deltaArrow(value)}
      </span>
      <span>
        {text}
        {unit}
      </span>
    </span>
  );
}

/** A rank, optionally dotted when it is a top-three position. */
export function RankPill({ rank, top = false }) {
  return (
    <span className="rank-pill">
      {top && <span className="top-dot" aria-hidden="true" />}
      {rank}
    </span>
  );
}

/* ── Score bar ───────────────────────────────────────────────────────────── */

export function ScoreBar({ value, color = "var(--interactive)", label, showValue = true }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      className="score-bar"
      role="img"
      aria-label={`${label ? `${label}: ` : ""}${fmt.score(value)} out of 100`}
    >
      <span className="score-bar-track">
        <span
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      {showValue && (
        <span className="score-bar-value t-caption">{fmt.score(value)}</span>
      )}
    </div>
  );
}

/* ── Insight block ───────────────────────────────────────────────────────── */

/**
 * The "Strategic Insight" panels. One treatment everywhere: surface-2 fill,
 * a 3px interactive left rule, body-lg copy inside a 72ch measure, and the
 * provenance tag as a real caption chip rather than 9px grey text.
 */
export function InsightBlock({ title = "Strategic Insight", provenance = "AI-assisted insight", children }) {
  return (
    <aside className="insight">
      <div className="insight-head">
        <h3 className="t-overline">{title}</h3>
        {provenance && <span className="provenance t-caption">{provenance}</span>}
      </div>
      <div className="insight-body t-body-lg">{children}</div>
    </aside>
  );
}

/* ── Controls ────────────────────────────────────────────────────────────── */

export function Field({ label, hideLabel = false, children, className = "", ...rest }) {
  return (
    <label className={`field ${className}`.trim()} {...rest}>
      <span className={hideLabel ? "visually-hidden" : "t-overline"}>{label}</span>
      {children}
    </label>
  );
}

export function Select({ label, hideLabel, value, onChange, options, className = "", ...rest }) {
  return (
    <Field label={label} hideLabel={hideLabel} className={className}>
      <select
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
    </Field>
  );
}

export function Button({ variant = "", size = "", className = "", children, ...rest }) {
  const classes = ["btn", variant && `btn-${variant}`, size && `btn-${size}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

/** A labelled range input with a live numeric readout. */
export function RangeSlider({ label, value, onChange, min = 0, max = 100, step = 1, readout, id }) {
  const autoId = useRef(`range-${Math.random().toString(36).slice(2, 8)}`).current;
  const inputId = id || autoId;
  return (
    <div className="stack-sm" style={{ gap: "var(--s-4)" }}>
      <div className="row" style={{ gap: "var(--s-8)" }}>
        <label className="t-sm" htmlFor={inputId} style={{ minWidth: 0, flex: 1 }}>
          {label}
        </label>
        <span className="t-caption tnum" style={{ fontWeight: 600 }}>
          {readout ?? `${value}%`}
        </span>
      </div>
      <input
        id={inputId}
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ── Empty / loading / error ─────────────────────────────────────────────── */

export function EmptyState({ title, children, action, icon = "—" }) {
  return (
    <div className="empty-state">
      <div className="t-h3" aria-hidden="true" style={{ color: "var(--text-subtle)" }}>
        {icon}
      </div>
      {title && <p className="empty-title t-body">{title}</p>}
      {children && <p className="t-caption" style={{ maxWidth: "44ch" }}>{children}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading…", height = 200 }) {
  return (
    <div
      className="skeleton"
      style={{ height, width: "100%" }}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  );
}

export function ErrorState({ title, children, onRetry }) {
  return (
    <div className="empty-state" role="alert">
      <span className="badge" data-tone="warning">
        ⚠ Unavailable
      </span>
      {title && <p className="empty-title t-body">{title}</p>}
      {children && <p className="t-caption" style={{ maxWidth: "48ch" }}>{children}</p>}
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/* ── Table scroll container ──────────────────────────────────────────────── */

/**
 * Wraps a wide table so it scrolls inside its own box - the page itself never
 * scrolls sideways - and shows a fade on the edge that is cut off.
 */
export function TableScroll({ maxHeight, className = "", children }) {
  const ref = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () =>
      setOverflowing(el.scrollWidth - el.clientWidth > 2 && el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, []);

  return (
    <div className={`table-fade ${className}`.trim()} data-overflowing={overflowing}>
      <div className="table-scroll" ref={ref} style={maxHeight ? { maxHeight } : undefined}>
        {children}
      </div>
    </div>
  );
}

/* ── Sortable data table ─────────────────────────────────────────────────── */

/**
 * The ranking tables are the core of this product, so they get real sorting
 * with an explicit indicator and `aria-sort`.
 *
 * `columns`: `{ key, label, numeric, sortable, sortValue, render, width }`.
 */
export function DataTable({
  caption,
  columns,
  rows,
  rowKey,
  initialSort,
  zebra = false,
  maxHeight,
  onRowClick,
}) {
  const [sort, setSort] = useState(initialSort || null);

  const sorted = (() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const value = col.sortValue || ((row) => row[col.key]);
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  })();

  const toggle = (key) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  return (
    <TableScroll maxHeight={maxHeight}>
      <table className={`data-table ${zebra ? "zebra" : ""}`.trim()}>
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
              return (
                <th
                  key={col.key}
                  scope="col"
                  data-numeric={col.numeric ? "true" : undefined}
                  aria-sort={col.sortable === false ? undefined : ariaSort}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <button
                      type="button"
                      className="sort-btn"
                      onClick={() => toggle(col.key)}
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      <span className="sort-ind" aria-hidden="true">
                        {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  data-numeric={col.numeric ? "true" : undefined}
                  className={col.nameCell ? "name-cell" : undefined}
                >
                  {col.render ? col.render(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

/* ── Client-side media query ─────────────────────────────────────────────── */

/** True while the viewport matches `query`. The old build had no resize handling at all. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
