import { useState } from "react";
import { styles } from "../styles/styles.js";
import {
  COUNTRIES,
  META,
  PILLARS,
  getCluster,
} from "../data/index.js";

function PolicyRecommendations() {
  const [selected, setSelected] = useState("United Arab Emirates");
  const country = COUNTRIES.find((c) => c.name === selected);
  const cluster = getCluster(country.adei);

  const generateRecommendations = (c) => {
    const recs = [];
    const p = PILLARS.reduce((acc, pillar) => {
      acc[pillar.key] = c[pillar.key];
      return acc;
    }, {});

    if (p.p5 < 40)
      recs.push({
        pillar: "Innovation",
        priority: "IMMEDIATE",
        action:
          "Innovation is the primary bottleneck in OIC's digital transformation. R&D activity remains predominantly state-funded with limited private-sector participation. Incentivize private-sector R&D participation, strengthen venture financing ecosystems, and establish structured commercialization pathways linking university research centers with industry and investment capital.",
        icon: "🔬",
      });
    if (p.p3 < 40)
      recs.push({
        pillar: "Workforce",
        priority: "HIGH",
        action:
          "Many OIC economies remain structurally concentrated in primary sectors rather than knowledge-intensive industries. Launch national digital skills programs targeting youth and women. Expand knowledge-intensive employment through STEM education, professional certifications, and workforce upskilling initiatives.",
        icon: "🎓",
      });
    if (p.p2 < 50)
      recs.push({
        pillar: "Infrastructure",
        priority: "HIGH",
        action:
          "Expand reliable broadband infrastructure, reduce access costs, and treat digital connectivity as a critical public utility. Pursue public-private partnerships for infrastructure financing and leverage Islamic Social Finance (Zakat/Waqf) for digital inclusion programs in underserved areas.",
        icon: "📡",
      });
    if (p.p1 < 50)
      recs.push({
        pillar: "Institutions",
        priority: "HIGH",
        action:
          "Strengthen digital governance frameworks and regulatory quality. Establish an independent digital regulator and implement GDPR-aligned data protection laws.",
        icon: "⚖",
      });
    if (p.p4 < 60)
      recs.push({
        pillar: "E-Government",
        priority: "MEDIUM",
        action:
          "Expand national e-ID and digital public service portals. Adopt open data standards and interoperable government systems. Benchmark against UAE PASS and Saudi Arabia's Absher.",
        icon: "🏛",
      });
    if (p.p8 < 30)
      recs.push({
        pillar: "Financial Market Development",
        priority: "MEDIUM",
        action:
          "Develop Islamic FinTech regulatory sandbox to attract digital finance innovation. In many OIC economies, a substantial population remains outside the formal banking system. Promote mobile banking, digital wallets, and Shariah-compliant FinTech solutions to drive financial inclusion, especially in rural areas.",
        icon: "💰",
      });
    if (p.p6 < 40)
      recs.push({
        pillar: "Future Technologies",
        priority: "MEDIUM",
        action:
          "Many Emerging and Foundational Digital Economies have yet to formalize national AI strategies or mobilize sustained capital toward frontier technologies. Create a national AI strategy with clear governance frameworks and investment incentives for advanced digital sectors to capture value from the next wave of technological transformation.",
        icon: "🤖",
      });
    if (p.p7 < 40)
      recs.push({
        pillar: "Market Development & Sophistication",
        priority: "MEDIUM",
        action:
          "Limited access to growth-stage financing constrains start-up scaling, while insufficient industrial diversification narrows the domestic demand base. Reduce digital trade barriers, streamline e-commerce regulations, expand start-up financing accessibility, and support SME digital adoption.",
        icon: "🛒",
      });

    if (!recs.length)
      recs.push({
        pillar: "Leadership",
        priority: "STRATEGIC",
        action:
          "Maintain leadership position by expanding digital exports, establishing regional tech hubs, and leading OIC digital standards. Invest in cutting-edge research in AI, quantum computing, and blockchain.",
        icon: "🚀",
      });

    return recs;
  };

  const recs = generateRecommendations(country);

  const PRIORITY_STYLES = {
    IMMEDIATE: { color: "#EF4444", bg: "#FEE2E2", border: "#EF4444" },
    HIGH: { color: "#F59E0B", bg: "#FEF3C7", border: "#F59E0B" },
    MEDIUM: { color: "#3B82F6", bg: "#DBEAFE", border: "#3B82F6" },
    STRATEGIC: { color: "#10B981", bg: "#D1FAE5", border: "#10B981" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <select
          style={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
        <div
          style={{
            ...styles.badge(cluster.color, cluster.bg),
            fontSize: "13px",
            padding: "4px 12px",
          }}
        >
          {cluster.label} · Score: {country.adei.toFixed(1)} · Rank #
          {country.rank}
        </div>
      </div>

      <div
        style={{
          ...styles.card,
          borderColor: `${cluster.color}40`,
          background: `linear-gradient(135deg, #FFFFFF, ${cluster.color}08)`,
        }}
      >
        <div style={{ ...styles.cardTitle, color: cluster.color }}>
          Strategic Context for {country.name}
        </div>
        <p
          style={{
            color: "#1E293B",
            fontSize: "13px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {country.name} is classified as a{" "}
          <strong style={{ color: cluster.color }}>{cluster.label}</strong> with
          an OIC DEI score of{" "}
          <strong style={{ color: "#000000" }}>
            {country.adei.toFixed(1)}
          </strong>{" "}
          (Rank #{country.rank} of {META.countryCount} OIC states). The
          following evidence-based recommendations are derived from pillar-level
          gap analysis relative to OIC leading nations and global best
          practices.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {recs.map((rec, i) => {
          const ps = PRIORITY_STYLES[rec.priority];
          return (
            <div
              key={i}
              style={{
                ...styles.card,
                border: `1px solid ${ps.border}40`,
                background: ps.bg,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    minWidth: "36px",
                    textAlign: "center",
                  }}
                >
                  {rec.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        ...styles.badge(ps.color, `${ps.border}20`),
                        fontSize: "10px",
                      }}
                    >
                      {rec.priority}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1E293B",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {rec.pillar}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      Current Score:{" "}
                      {country[
                        PILLARS.find(
                          (p) =>
                            p.name === rec.pillar ||
                            p.short === rec.pillar ||
                            p.pillar === rec.pillar,
                        )?.key || "p1"
                      ]?.toFixed(1)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#1E293B",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {rec.action}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OIC-wide Recommendations */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>OIC-Wide Strategic Recommendations</div>
        {[
          {
            icon: "🎯",
            title: "1. Aligning Policy with Digital Maturity",
            desc: "National digital strategies should reflect a country's current digital maturity. Foundational economies: prioritize affordable broadband and digital literacy. Emerging economies: accelerate SME digitalization and workforce upskilling. Advanced economies: scale private-sector R&D and advance frontier technologies.",
          },
          {
            icon: "🔗",
            title: "2. Transforming the Digital Divide into Intra-OIC Synergy",
            desc: "Establish structured intra-OIC corridors for knowledge transfer, venture capital mobilization, and digital trade facilitation. Create common standards for e-commerce governance, digital identity recognition, cybersecurity protocols, and Shariah-compliant FinTech solutions.",
          },
          {
            icon: "🧠",
            title:
              "3. Shared OIC Digital Talent & Innovation Mobility Framework",
            desc: "Develop a bloc-level mechanism to facilitate digital talent movement, harmonize skills certification standards, and co-finance regional centers of excellence in AI, data science, and Islamic FinTech. Structured university-industry collaboration can reduce brain drain and position the OIC as a coordinated digital knowledge hub.",
          },
          {
            icon: "🕌",
            title: "4. Leveraging Islamic Finance for Inclusive Growth",
            desc: "Deploy Zakat and Waqf-backed microfinance for digital inclusion in Foundational economies. Use Shariah-compliant venture capital and equity crowdfunding for Emerging economy start-ups. Advanced economies should pioneer regulatory standards for digital Sukuk and Shariah-compliant FinTech frameworks.",
          },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px 0",
              borderBottom: "1px solid #FFFFFF",
            }}
          >
            <span style={{ fontSize: "20px" }}>{r.icon}</span>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1E293B",
                  marginBottom: "4px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {r.title}
              </div>
              <div
                style={{ fontSize: "12px", color: "#1E293B", lineHeight: 1.6 }}
              >
                {r.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PolicyRecommendations;
