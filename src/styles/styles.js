/**
 * Inline-style shims for the shapes the views still build by hand.
 *
 * These used to be the whole design system: 618 inline style objects reaching
 * into a table of literal hex values, with `'Georgia', serif` hard-coded 30
 * times. Everything here now reads a token, so there is one place to change a
 * colour and no component carries a literal. Prefer the components in
 * src/components/Primitives.jsx - Card, ScoreBar, Badge, DataTable - over these;
 * they exist for the handful of bespoke layouts that are not worth abstracting.
 */

export const styles = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    padding: "var(--s-20)",
    minWidth: 0,
  },

  cardTitle: {
    fontSize: "1.125rem",
    lineHeight: "1.625rem",
    fontWeight: 600,
    letterSpacing: "-0.005em",
    color: "var(--text)",
    marginBottom: "var(--s-16)",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "var(--s-20)",
    alignItems: "start",
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "var(--s-20)",
    alignItems: "start",
  },

  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: "var(--s-16)",
    alignItems: "start",
  },

  /** A 6px track with a ramp fill. Prefer `<ScoreBar>`, which is labelled. */
  scoreBar: (val, color) => ({
    height: "6px",
    borderRadius: "var(--r-full)",
    background: `linear-gradient(90deg, ${color} ${val}%, var(--surface-2) ${val}%)`,
    marginTop: "var(--s-8)",
  }),

  /** Prefer `<Badge tone="…">`; this keeps arbitrary hue pairs working. */
  badge: (color, bg) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--s-4)",
    padding: "0.25rem 0.625rem",
    borderRadius: "var(--r-full)",
    fontSize: "0.6875rem",
    lineHeight: "0.875rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color,
    background: bg,
  }),

  /** Prefer `<RankPill>`. Gold, silver and bronze medal gradients are gone. */
  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "2.5rem",
    height: "1.5rem",
    padding: "0 var(--s-8)",
    borderRadius: "var(--r-full)",
    background: "var(--surface-2)",
    color: "var(--text-muted)",
    fontSize: "0.75rem",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },

  select: {
    height: "36px",
    padding: "0 var(--s-12)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: "0.8125rem",
    fontFamily: "inherit",
    cursor: "pointer",
  },

  tooltip: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)",
    boxShadow: "var(--e1)",
    padding: "var(--s-12)",
    fontSize: "0.75rem",
    color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
  },
};

export default styles;
