import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { COUNTRIES, META, REFERENCE_YEAR, findCountryByGeoName, getCluster } from "../data/index.js";
import { useChartTokens, seqColor } from "../styles/tokens.js";
import { CLUSTER_SHORT, toneFor } from "../lib/clusters.js";
import { openCountry } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import { Button, ErrorState, LoadingState } from "./Primitives.jsx";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

/** Where the cluster thresholds fall on a 0-100 ramp. */
const THRESHOLDS = [40, 60];
const INITIAL_VIEW = { coordinates: [12, 14], zoom: 1 };

/**
 * The flagship view: a full-width choropleth on the sequential DEI ramp.
 *
 * The old map was a fixed 800px SVG with an 80px legend rail glued to its right
 * edge carrying 8px text, bucketed into three traffic-light colours that
 * contradicted the cluster cards one screen away, and it rendered silently
 * empty when the CDN fetch failed. This one is aspect-ratio driven, reads the
 * continuous ramp with the cluster thresholds ticked on a legend beneath it,
 * and says so when the atlas will not load.
 */
export default function WorldMap() {
  const tokens = useChartTokens();
  const [geoData, setGeoData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [hovered, setHovered] = useState(null);
  const [view, setView] = useState(INITIAL_VIEW);
  const wrapRef = useRef(null);

  const load = useCallback(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(GEO_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((topology) => {
        if (cancelled) return;
        setGeoData(topology);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  const covered = useMemo(
    () => COUNTRIES.filter((c) => typeof c.adei === "number").length,
    [],
  );

  const handleMove = (event) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    setHovered((prev) =>
      prev ? { ...prev, x: event.clientX - box.left, y: event.clientY - box.top } : prev,
    );
  };

  const rampStops = tokens.seq;

  return (
    <section className="card" aria-labelledby="world-map-title">
      <div className="card-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="t-h3" id="world-map-title">
            OIC member states by Digital Economy Index
          </h2>
          <div className="card-sub t-caption">
            {fmt.SCORE_UNIT} · {REFERENCE_YEAR} · {META.countryCount} member states
          </div>
        </div>
      </div>

      {status === "loading" && <LoadingState label="Loading world atlas…" height={320} />}

      {status === "error" && (
        <ErrorState title="The world atlas could not be loaded." onRetry={load}>
          The base map is fetched from a public CDN at runtime. Every other view on
          this page works offline; only the map needs the network.
        </ErrorState>
      )}

      {status === "ready" && (
        <>
          <div className="map-wrap" ref={wrapRef} onMouseMove={handleMove}>
            <div className="map-controls no-print">
              <Button
                size="sm"
                className="btn-icon"
                aria-label="Zoom in"
                onClick={() => setView((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.5) }))}
              >
                +
              </Button>
              <Button
                size="sm"
                className="btn-icon"
                aria-label="Zoom out"
                onClick={() => setView((v) => ({ ...v, zoom: Math.max(1, v.zoom / 1.5) }))}
              >
                −
              </Button>
              <Button
                size="sm"
                className="btn-icon"
                aria-label="Reset map view"
                onClick={() => setView(INITIAL_VIEW)}
              >
                ⟲
              </Button>
            </div>

            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 165 }}
              width={900}
              height={450}
              style={{ width: "100%", height: "100%" }}
              role="img"
              aria-label={`World map of the ${META.countryCount} OIC member states shaded by Digital Economy Index score for ${REFERENCE_YEAR}. Darker shading is a higher score.`}
            >
              <title>
                OIC member states shaded by Digital Economy Index score, {REFERENCE_YEAR}
              </title>
              <defs>
                <pattern
                  id="no-data-hatch"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="6" height="6" fill={tokens["surface-2"]} />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={tokens["border-strong"]} strokeWidth="2" />
                </pattern>
              </defs>
              <ZoomableGroup
                center={view.coordinates}
                zoom={view.zoom}
                onMoveEnd={({ coordinates, zoom }) => setView({ coordinates, zoom })}
                maxZoom={8}
              >
                <Geographies geography={geoData}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const geoName = geo.properties.name;
                      const country = findCountryByGeoName(geoName);
                      const hasScore = country && typeof country.adei === "number";
                      const fill = !country
                        ? tokens["map-nodata"]
                        : hasScore
                          ? seqColor(tokens, country.adei)
                          : "url(#no-data-hatch)";

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          tabIndex={-1}
                          onMouseEnter={() => country && setHovered({ country, x: 0, y: 0 })}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => country && openCountry(country.name)}
                          style={{
                            default: {
                              fill,
                              stroke: tokens.surface,
                              strokeWidth: 0.5,
                              outline: "none",
                              cursor: country ? "pointer" : "default",
                            },
                            hover: {
                              fill,
                              stroke: country ? tokens.text : tokens.surface,
                              strokeWidth: country ? 1.25 : 0.5,
                              outline: "none",
                              cursor: country ? "pointer" : "default",
                            },
                            pressed: {
                              fill,
                              stroke: tokens.text,
                              strokeWidth: 1.25,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {hovered && (
              <div className="map-tooltip" style={{ left: hovered.x, top: hovered.y }}>
                <div className="tooltip-card">
                  <div className="tooltip-title">{hovered.country.name}</div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">DEI score</span>
                    <span className="tooltip-value">{fmt.score(hovered.country.adei)}</span>
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Rank</span>
                    <span className="tooltip-value">{fmt.rank(hovered.country.rank)}</span>
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Cluster</span>
                    <span className="tooltip-value">
                      {CLUSTER_SHORT[toneFor(getCluster(hovered.country.adei).label)]}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend: horizontal, beneath the map, at a readable size, with the
              cluster thresholds ticked on the scale rather than baked into the fill. */}
          <div className="map-legend">
            <div className="ramp">
              <div className="t-overline" style={{ color: "var(--text-muted)", marginBottom: "var(--s-4)" }}>
                DEI score
              </div>
              <div className="ramp-bar" aria-hidden="true">
                {rampStops.map((stop, i) => (
                  <span key={i} style={{ background: stop }} />
                ))}
              </div>
              <div className="ramp-scale t-caption">
                {[0, 100].map((v) => (
                  <span key={v} className="ramp-tick" style={{ left: `${v}%` }}>
                    {v}
                  </span>
                ))}
                {THRESHOLDS.map((v) => (
                  <span
                    key={v}
                    className="ramp-tick"
                    data-threshold="true"
                    style={{ left: `${v}%` }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <div className="legend-keys t-caption">
              <span className="legend-key">
                <span className="swatch" style={{ background: "var(--map-nodata)" }} />
                Non-OIC
              </span>
              <span className="legend-key">
                <span
                  className="swatch"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, var(--border-strong) 0 2px, var(--surface-2) 2px 5px)",
                  }}
                />
                No data
              </span>
            </div>
          </div>

          <div className="chart-source t-caption">
            Thresholds mark the cluster boundaries: Foundational below 40, Emerging 40–59,
            Advanced 60 and above. {covered} of {META.countryCount} member states carry a{" "}
            {REFERENCE_YEAR} score. Select a country to open its profile. {fmt.SOURCE_LINE}
          </div>
        </>
      )}
    </section>
  );
}
