import { useEffect, useState } from "react";

/**
 * Bridge from the CSS custom properties to the few places that cannot use them.
 *
 * Recharts and react-simple-maps write `fill` and `stroke` as SVG *attributes*,
 * and `var()` is not resolved in an attribute value - only in a CSS
 * declaration. So chart series read their colours from here instead, and this
 * module resolves them from the same tokens.css that styles everything else.
 * tokens.css stays the single source of truth; this is the only reader.
 */

const NAMES = [
  "bg",
  "surface",
  "surface-2",
  "border",
  "border-strong",
  "text",
  "text-muted",
  "text-subtle",
  "brand-700",
  "accent",
  "tint",
  "interactive",
  "on-brand",
  "positive",
  "negative",
  "warning",
  "info",
  "map-nodata",
  "cluster-advanced",
  "cluster-emerging",
  "cluster-foundational",
  "cluster-advanced-line",
  "cluster-emerging-line",
  "cluster-foundational-line",
];

const EMPTY = Object.freeze({
  ...Object.fromEntries(NAMES.map((n) => [n, "#000000"])),
  pillar: Array(9).fill("#000000"),
  seq: Array(7).fill("#000000"),
});

function read() {
  if (typeof window === "undefined") return EMPTY;
  const cs = getComputedStyle(document.documentElement);
  const get = (n) => cs.getPropertyValue(`--${n}`).trim() || "#000000";
  return {
    ...Object.fromEntries(NAMES.map((n) => [n, get(n)])),
    /** The 9 categorical pillar hues, in pillar order. */
    pillar: Array.from({ length: 9 }, (_, i) => get(`p${i + 1}`)),
    /** The sequential DEI ramp, low score to high. */
    seq: Array.from({ length: 7 }, (_, i) => get(`seq-${i + 1}`)),
  };
}

/**
 * Chart-ready token values for the theme currently rendered. Re-reads whenever
 * the explicit theme attribute changes or the system preference flips, so
 * charts recolour with the rest of the page.
 */
export function useChartTokens() {
  const [tokens, setTokens] = useState(read);

  useEffect(() => {
    const refresh = () => setTokens(read());
    refresh();

    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", refresh);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", refresh);
    };
  }, []);

  return tokens;
}

/** Colour for a pillar by its 1-based id, in the current theme. */
export const pillarColor = (tokens, pillarId) =>
  tokens.pillar[(pillarId - 1) % 9];

/**
 * The sequential ramp sampled at a DEI score. The index scores 0-100, so the
 * domain is fixed rather than data-driven - a country keeps the same colour on
 * every view.
 */
export function seqColor(tokens, value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return tokens["map-nodata"];
  }
  return tokens.seq[seqIndex(value)];
}

/** Which of the 7 ramp stops a 0-100 score falls in. */
export function seqIndex(value, stops = 7) {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return Math.min(stops - 1, Math.floor((clamped / 100) * stops));
}

/** The ramp stop for a score, as a CSS value — for DOM styles, not SVG attributes. */
export const seqVar = (value) => `var(--seq-${seqIndex(value) + 1})`;

/** Text colour that clears AA on that ramp stop, in whichever theme is showing. */
export const seqInkVar = (value) => `var(--seq-${seqIndex(value) + 1}-ink)`;
