import { useState, useEffect } from "react";
import {
  Legend,
} from "recharts";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { styles } from "../styles/styles.js";
import {
  COUNTRIES,
  findCountryByGeoName,
  getCluster,
  getCountry,
} from "../data/index.js";

function WorldMap() {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
      .then((res) => res.json())
      .then((data) => {
        const countries = data.objects.countries.geometries.map(
          (geom, idx) => ({
            ...geom,
            id: idx,
          }),
        );
        setGeoData({
          type: "FeatureCollection",
          features: countries.map((geom) => ({
            type: "Feature",
            properties: { id: geom.id },
            geometry: geom,
          })),
        });
      })
      .catch((err) => console.error("Failed to load map data:", err));
  }, []);

  const getCountryColor = (countryName) => {
    const country = findCountryByGeoName(countryName);

    if (!country) return "#E2E8F0";

    const cluster = getCluster(country.adei);
    if (cluster.label === "Advanced Digital Economies") return "#10B981";
    if (cluster.label === "Emerging Digital Economies") return "#F59E0B";
    return "#EF4444";
  };

  const getCountryInfo = (countryName) => findCountryByGeoName(countryName);

  const geoUrl =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>OIC Countries Map</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0px",
          gap: "0px",
        }}
      >
        <div style={{ flex: 1 }}>
          <svg
            width="100%"
            height="800"
            style={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}
          >
            <ComposableMap projection="geoEqualEarth">
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name;
                    const country = getCountryInfo(countryName);
                    const fill = country
                      ? getCountryColor(countryName)
                      : "#F1F5F9";

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHoveredCountry(countryName)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        style={{
                          default: {
                            fill: fill,
                            stroke: "#FFFFFF",
                            strokeWidth: 0.75,
                            outline: "none",
                            cursor: country ? "pointer" : "default",
                            transition: "fill 0.2s ease",
                          },
                          hover: {
                            fill: country ? fill : "#F1F5F9",
                            stroke: "#B8922A",
                            strokeWidth: 1.5,
                            outline: "none",
                            cursor: country ? "pointer" : "default",
                            filter: "brightness(1.1)",
                          },
                          pressed: {
                            fill: fill,
                            stroke: "#B8922A",
                            strokeWidth: 1.5,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </svg>
        </div>
        <div
          style={{
            width: "80px",
            padding: "4px",
            background: "#F8FAFC",
            borderRadius: "0px 8px 8px 0px",
            border: "1px solid #E2E8F0",
            borderLeft: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "8px",
              fontWeight: 600,
              color: "#64748B",
              marginBottom: "3px",
            }}
          >
            Legend
          </div>
          {[
            {
              label: "Advanced",
              color: "#10B981",
              count: COUNTRIES.filter(
                (c) =>
                  getCluster(c.adei).label === "Advanced Digital Economies",
              ).length,
            },
            {
              label: "Emerging",
              color: "#F59E0B",
              count: COUNTRIES.filter(
                (c) =>
                  getCluster(c.adei).label === "Emerging Digital Economies",
              ).length,
            },
            {
              label: "Foundational",
              color: "#EF4444",
              count: COUNTRIES.filter(
                (c) =>
                  getCluster(c.adei).label === "Foundational Digital Economies",
              ).length,
            },
            {
              label: "Non-OIC",
              color: "#F1F5F9",
              count: "Other",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                marginBottom: "2px",
                fontSize: "8px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  background: item.color,
                  border: "1px solid #CBD5E1",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "#1E293B",
                  fontWeight: 500,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </span>
              {typeof item.count === "number" && (
                <span
                  style={{
                    color: "#64748B",
                    marginLeft: "auto",
                    fontSize: "8px",
                  }}
                >
                  ({item.count})
                </span>
              )}
            </div>
          ))}
          {hoveredCountry && getCountryInfo(hoveredCountry) && (
            <div
              style={{
                marginTop: "6px",
                paddingTop: "4px",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "#000000",
                  marginBottom: "2px",
                }}
              >
                {hoveredCountry}
              </div>
              <div style={{ fontSize: "8px", color: "#64748B" }}>
                Score:{" "}
                <strong>
                  {getCountryInfo(hoveredCountry).adei.toFixed(1)}
                </strong>
              </div>
              <div style={{ fontSize: "8px", color: "#64748B" }}>
                Rank: <strong>#{getCountryInfo(hoveredCountry).rank}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorldMap;
